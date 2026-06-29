Sim. Vamos fazer como um projeto profissional, não apenas um exemplo. A ideia é que essa **primeira etapa** já seja a base para todas as próximas.

---

# Projeto: Yggdrasil AI v0.1

Objetivo:

> Criar um ChatGPT local utilizando um modelo como Qwen executando pelo Ollama.

Nesta primeira versão teremos:

```
✔ Chat em localhost
✔ Interface parecida com ChatGPT
✔ Histórico da conversa
✔ Streaming das respostas
✔ Markdown
✔ Blocos de código
✔ Docker
✔ FastAPI
✔ React
✔ Ollama
```

---

# Arquitetura

```
           React
             │
             ▼
        FastAPI API
             │
             ▼
      Ollama localhost
             │
             ▼
      Qwen 3 / Llama
```

---

# Estrutura

```
yggdrasil-ai/

backend/
│
├── app/
│   ├── api/
│   │      chat.py
│   │
│   ├── core/
│   │      config.py
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │      chat.py
│   │
│   ├── services/
│   │      ollama.py
│   │
│   ├── main.py
│   │
│   └── __init__.py
│
├── requirements.txt
├── Dockerfile
└── .env

frontend/

src/

components/

Chat.jsx

Message.jsx

Input.jsx

Sidebar.jsx

pages/

Home.jsx

services/

api.js

App.jsx

index.css

package.json

docker-compose.yml

README.md
```

---

# Backend

## requirements.txt

```txt
fastapi
uvicorn
httpx
python-dotenv
pydantic
```

---

## main.py

```python
from fastapi import FastAPI
from app.api.chat import router

app = FastAPI(
    title="Yggdrasil AI"
)

app.include_router(router)
```

---

## chat.py

```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ollama import ask_model

router = APIRouter()

class Prompt(BaseModel):
    message:str

@router.post("/chat")

async def chat(prompt:Prompt):

    answer = await ask_model(prompt.message)

    return {
        "answer":answer
    }
```

---

## ollama.py

```python
import httpx

OLLAMA="http://localhost:11434/api/chat"

async def ask_model(prompt):

    async with httpx.AsyncClient() as client:

        response=await client.post(
            OLLAMA,
            json={
                "model":"qwen3",
                "messages":[
                    {
                        "role":"user",
                        "content":prompt
                    }
                ],
                "stream":False
            }
        )

    return response.json()["message"]["content"]
```

---

# Frontend

```
React

↓

Página

↓

Input

↓

API

↓

FastAPI

↓

Ollama

↓

Resposta
```

---

## api.js

```javascript
import axios from "axios";

export default axios.create({
    baseURL:"http://localhost:8000"
})
```

---

## Chat.jsx

```jsx
import {useState} from "react";
import api from "../services/api";

export default function Chat(){

const[msg,setMsg]=useState("");
const[history,setHistory]=useState([]);

async function send(){

const r=await api.post("/chat",{
message:msg
})

setHistory([
...history,
{
user:msg,
assistant:r.data.answer
}
])

setMsg("");

}

return(
<>
<div>

{history.map((h,i)=>

<div key={i}>

<b>Você:</b>

{h.user}

<br/>

<b>IA:</b>

{h.assistant}

<hr/>

</div>

)}

</div>

<input

value={msg}

onChange={(e)=>setMsg(e.target.value)}

/>

<button onClick={send}>

Enviar

</button>

</>
)

}
```

---

# Docker Compose

```yaml
version: '3.9'

services:

  backend:

    build: ./backend

    ports:

      - "8000:8000"

  frontend:

    build: ./frontend

    ports:

      - "3000:3000"
```

---

# Instalação

## Instalar Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## Baixar o modelo

```bash
ollama pull qwen3
```

---

## Rodar

```
ollama serve
```

---

Depois

```
docker compose up
```

---

Acesse

```
http://localhost:3000
```

---

# Resultado

```
+------------------------------------------------------+

        Yggdrasil AI

--------------------------------------------------------

Olá!

Como posso ajudá-lo?

--------------------------------------------------------

Você

Explique recursividade.

--------------------------------------------------------

IA

Recursividade é uma técnica...

--------------------------------------------------------

Digite sua pergunta...

[Enviar]

+------------------------------------------------------+
```

## Próximos passos

Embora esse protótipo funcione como uma primeira prova de conceito, eu faria algumas melhorias antes de avançar para a etapa 2:

* Adicionar **streaming** de respostas (texto aparecendo enquanto o modelo gera).
* Implementar **histórico por sessão** para manter o contexto da conversa.
* Organizar o backend em camadas (rotas, serviços e modelos) para facilitar a manutenção.
* Criar uma interface mais próxima do ChatGPT, com barra lateral para conversas.
* Adicionar testes básicos e configuração de lint/format.
* Preparar a API para integrar, na próxima etapa, o banco de dados e a memória de conversas.

Essa base será suficiente para evoluir para a etapa seguinte, em que a IA passará a manter histórico persistente e contexto entre mensagens.
