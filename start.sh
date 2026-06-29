#!/usr/bin/env bash
# =============================================================================
#  Yggdrasil AI — Script de inicialização completa
#  Uso: ./start.sh
# =============================================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
VENV="$ROOT/venv"

# ── Cores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✔${NC}  $1"; }
info() { echo -e "${CYAN}➜${NC}  $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✘${NC}  $1"; exit 1; }
sep()  { echo -e "${BOLD}──────────────────────────────────────────${NC}"; }

# =============================================================================
echo ""
echo -e "${BOLD}   🌳  Yggdrasil AI — Iniciando...${NC}"
sep

# ── 1. Encerrar processos anteriores ──────────────────────────────────────
info "Encerrando processos anteriores..."
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "vite"             2>/dev/null || true
sleep 1
ok "Processos limpos"

# ── 2. Python / venv ──────────────────────────────────────────────────────
sep; info "Verificando Python..."
command -v python3 &>/dev/null || fail "Python 3 não encontrado. Instale em https://python.org"
PY_VER=$(python3 --version 2>&1)
ok "$PY_VER"

if [ ! -d "$VENV" ]; then
  info "Criando ambiente virtual..."
  python3 -m venv "$VENV"
  ok "venv criado"
fi

source "$VENV/bin/activate"
ok "venv ativado"

# ── 3. Dependências Python ────────────────────────────────────────────────
sep; info "Instalando dependências Python..."
pip install -q --upgrade pip
pip install -q -r "$BACKEND/requirements.txt"
ok "Dependências Python instaladas"

# ── 4. Node / npm ─────────────────────────────────────────────────────────
sep; info "Verificando Node.js..."
command -v node &>/dev/null || fail "Node.js não encontrado. Instale em https://nodejs.org"
command -v npm  &>/dev/null || fail "npm não encontrado."
ok "Node $(node --version)  /  npm $(npm --version)"

# ── 5. Dependências do frontend ───────────────────────────────────────────
info "Instalando dependências do frontend..."
cd "$FRONTEND"
npm install --silent
ok "Dependências npm instaladas"
cd "$ROOT"

# ── 6. Ollama ──────────────────────────────────────────────────────────────
sep; info "Verificando Ollama..."
OLLAMA_BIN=""
for p in ollama /usr/local/bin/ollama "$HOME/.ollama/bin/ollama"; do
  [ -x "$p" ] && OLLAMA_BIN="$p" && break
done

if [ -z "$OLLAMA_BIN" ]; then
  warn "Ollama não encontrado. Instalando..."
  curl -fsSL https://ollama.com/install.sh | sh
  for p in ollama /usr/local/bin/ollama; do
    [ -x "$p" ] && OLLAMA_BIN="$p" && break
  done
  [ -z "$OLLAMA_BIN" ] && fail "Falha ao instalar Ollama"
fi
ok "Ollama encontrado: $OLLAMA_BIN"

# Iniciar Ollama se não estiver rodando
if ! curl -s --max-time 2 http://localhost:11434 &>/dev/null; then
  info "Iniciando Ollama..."
  open /Applications/Ollama.app 2>/dev/null \
    || "$OLLAMA_BIN" serve &>/tmp/yggdrasil_ollama.log &
  for i in {1..10}; do
    sleep 1
    curl -s --max-time 1 http://localhost:11434 &>/dev/null && break
  done
fi

curl -s --max-time 3 http://localhost:11434 &>/dev/null \
  && ok "Ollama rodando em http://localhost:11434" \
  || fail "Ollama não respondeu. Verifique /tmp/yggdrasil_ollama.log"

# ── 7. Modelo ──────────────────────────────────────────────────────────────
MODEL=$(grep "OLLAMA_MODEL" "$BACKEND/.env" 2>/dev/null | cut -d= -f2 | tr -d ' \r')
MODEL="${MODEL:-qwen3:0.6b}"

info "Verificando modelo: $MODEL"
if "$OLLAMA_BIN" list 2>/dev/null | grep -q "${MODEL%%:*}"; then
  ok "Modelo '$MODEL' já está disponível"
else
  warn "Modelo '$MODEL' não encontrado. Baixando (~500 MB–5 GB)..."
  "$OLLAMA_BIN" pull "$MODEL" || fail "Falha ao baixar o modelo '$MODEL'"
  ok "Modelo '$MODEL' pronto"
fi

# ── 8. Backend ─────────────────────────────────────────────────────────────
sep; info "Iniciando backend FastAPI (porta 8000)..."
source "$VENV/bin/activate"
cd "$BACKEND"
uvicorn app.main:app --host 0.0.0.0 --port 8000 &>/tmp/yggdrasil_backend.log &
BACKEND_PID=$!
cd "$ROOT"

for i in {1..10}; do
  sleep 1
  curl -s --max-time 1 http://localhost:8000/api/health &>/dev/null && break
done

curl -s --max-time 2 http://localhost:8000/api/health &>/dev/null \
  && ok "Backend rodando em http://localhost:8000  (PID $BACKEND_PID)" \
  || { cat /tmp/yggdrasil_backend.log; fail "Backend não iniciou. Veja /tmp/yggdrasil_backend.log"; }

# ── 9. Frontend ────────────────────────────────────────────────────────────
sep; info "Iniciando frontend React (porta 5173)..."
# Libera a porta 5173 se estiver ocupada
PORTA_PID=$(lsof -ti tcp:5173 2>/dev/null || true)
[ -n "$PORTA_PID" ] && kill -9 $PORTA_PID 2>/dev/null && sleep 1 || true

cd "$FRONTEND"
npm run dev -- --host 0.0.0.0 --port 5173 &>/tmp/yggdrasil_frontend.log &
FRONTEND_PID=$!
cd "$ROOT"

for i in {1..12}; do
  sleep 1
  curl -s --max-time 1 http://127.0.0.1:5173 &>/dev/null && break
done

curl -s --max-time 2 http://127.0.0.1:5173 &>/dev/null \
  && ok "Frontend rodando em http://127.0.0.1:5173  (PID $FRONTEND_PID)" \
  || { cat /tmp/yggdrasil_frontend.log; fail "Frontend não iniciou. Veja /tmp/yggdrasil_frontend.log"; }

# ── 10. Teste de chat ──────────────────────────────────────────────────────
sep; info "Testando chat de ponta a ponta..."
RESP=$(curl -s --max-time 30 -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"responda apenas: ok\"}]}")

if [ -n "$RESP" ] && [[ "$RESP" != *"Ollama indisponível"* ]] && [[ "$RESP" != *"Erro"* ]]; then
  ok "Chat respondeu: \"$RESP\""
else
  warn "Chat retornou: \"$RESP\""
fi

# ── Resultado final ────────────────────────────────────────────────────────
sep
echo ""
echo -e "${BOLD}${GREEN}   🌳  Yggdrasil AI está no ar!${NC}"
echo ""
echo -e "   🌐  Interface:  ${BOLD}http://127.0.0.1:5173${NC}"
echo -e "   ⚙️   Backend:   ${BOLD}http://localhost:8000${NC}"
echo -e "   📋  API Docs:  ${BOLD}http://localhost:8000/docs${NC}"
echo -e "   🤖  Ollama:    ${BOLD}http://localhost:11434${NC}"
echo -e "   🧠  Modelo:    ${BOLD}$MODEL${NC}"
echo ""
echo -e "   Logs:"
echo -e "     Backend:  /tmp/yggdrasil_backend.log"
echo -e "     Frontend: /tmp/yggdrasil_frontend.log"
echo -e "     Ollama:   /tmp/yggdrasil_ollama.log"
echo ""
echo -e "   Para parar tudo: ${BOLD}./stop.sh${NC}"
sep
