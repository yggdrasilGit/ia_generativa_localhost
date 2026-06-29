import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.auth.tokens import decode_token
from app.documents.retrieval import inject_knowledge_context
from app.services.ollama import stream_chat, OllamaUnavailableError
from app.core.logging import logger

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    logger.info(f"WebSocket conectado: {websocket.client}")

    try:
        while True:
            # Recebe JSON: { messages: [...], model?: "..." }
            data = await websocket.receive_text()
            payload = json.loads(data)
            messages = payload.get("messages", [])
            model = payload.get("model")
            project_id = payload.get("project_id")
            access_token = payload.get("access_token")

            user_id = None
            if isinstance(access_token, str) and access_token.strip():
                try:
                    token_payload = decode_token(access_token.strip())
                    if token_payload.get("type") == "access":
                        user_id = int(token_payload.get("sub", "0"))
                except Exception:
                    user_id = None

            if not messages:
                await websocket.send_json({"type": "error", "content": "Nenhuma mensagem enviada."})
                continue

            rag_messages = await inject_knowledge_context(
                messages=messages,
                user_id=user_id,
                project_id=project_id,
            )

            # Streaming token a token
            try:
                async for chunk in stream_chat(rag_messages, model=model):
                    await websocket.send_json({"type": "chunk", "content": chunk})

                # Sinaliza fim do stream
                await websocket.send_json({"type": "done"})

            except OllamaUnavailableError as e:
                await websocket.send_json({"type": "error", "content": str(e)})

    except WebSocketDisconnect:
        logger.info(f"WebSocket desconectado: {websocket.client}")
    except Exception as e:
        logger.error(f"WebSocket erro: {e}")
        try:
            await websocket.send_json({"type": "error", "content": str(e)})
        except Exception:
            pass
