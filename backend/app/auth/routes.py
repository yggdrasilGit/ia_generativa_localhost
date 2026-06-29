from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
)
from app.auth.security import get_password_hash, verify_password
from app.auth.tokens import create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.db import get_db
from app.models.entities import AuditLog, User, UserSession, UserSettings

router = APIRouter(prefix="/auth", tags=["auth"])
_reset_tokens: dict[str, tuple[int, datetime]] = {}
_login_failures: dict[str, tuple[int, datetime]] = {}


@router.post("/register", response_model=TokenPair)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if body.password != body.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não conferem")

    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=get_password_hash(body.password),
        last_login=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    settings_row = UserSettings(user_id=user.id)
    db.add(settings_row)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        device=request.headers.get("x-device-name") or "unknown",
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session)

    db.add(AuditLog(user_id=user.id, action="register", details="Cadastro de usuário"))
    db.commit()

    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenPair)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    key = f"{body.email.lower()}|{request.client.host if request.client else 'unknown'}"
    fail_count, blocked_until = _login_failures.get(key, (0, datetime.min))
    if datetime.utcnow() < blocked_until:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em alguns minutos.")

    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        fail_count += 1
        if fail_count >= 5:
            _login_failures[key] = (fail_count, datetime.utcnow() + timedelta(minutes=10))
        else:
            _login_failures[key] = (fail_count, datetime.min)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha inválidos")

    _login_failures.pop(key, None)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    user.last_login = datetime.utcnow()
    db.add(
        UserSession(
            user_id=user.id,
            refresh_token=refresh_token,
            device=request.headers.get("x-device-name") or "unknown",
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    db.add(AuditLog(user_id=user.id, action="login", details="Login com sucesso"))
    db.commit()

    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Refresh token inválido")
        user_id = int(payload.get("sub", "0"))
    except ValueError:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    session = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id, UserSession.refresh_token == body.refresh_token)
        .first()
    )
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Sessão expirada")

    access_token = create_access_token(user_id)
    new_refresh_token = create_refresh_token(user_id)
    session.refresh_token = new_refresh_token
    session.expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(AuditLog(user_id=user_id, action="refresh_token", details="Token renovado"))
    db.commit()

    return TokenPair(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout")
def logout(body: RefreshRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    deleted = (
        db.query(UserSession)
        .filter(UserSession.user_id == user.id, UserSession.refresh_token == body.refresh_token)
        .delete()
    )
    db.add(AuditLog(user_id=user.id, action="logout", details=f"Logout sessão ({deleted})"))
    db.commit()
    return {"ok": True}


@router.post("/logout-all")
def logout_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()
    db.add(AuditLog(user_id=user.id, action="logout_all", details="Logout de todos os dispositivos"))
    db.commit()
    return {"ok": True}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user:
        return {"ok": True}

    token = str(uuid4())
    _reset_tokens[token] = (user.id, datetime.utcnow() + timedelta(minutes=15))
    db.add(AuditLog(user_id=user.id, action="forgot_password", details="Solicitação de reset"))
    db.commit()

    # Em produção, esse token deve ser enviado por e-mail.
    return {"ok": True, "reset_token": token}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não conferem")

    data = _reset_tokens.get(body.token)
    if not data:
        raise HTTPException(status_code=400, detail="Token inválido")

    user_id, expires_at = data
    if datetime.utcnow() > expires_at:
        _reset_tokens.pop(body.token, None)
        raise HTTPException(status_code=400, detail="Token expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.password_hash = get_password_hash(body.new_password)
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()
    db.add(AuditLog(user_id=user.id, action="reset_password", details="Senha redefinida"))
    _reset_tokens.pop(body.token, None)
    db.commit()
    return {"ok": True}
