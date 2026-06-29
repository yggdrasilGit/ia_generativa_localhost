Agora você entrou na fase que realmente transforma seu projeto em algo “nível assistente moderno”: a IA deixa de só responder e passa a **agir no sistema**.

---

# FASE 7 — AGENTES + TOOL CALLING (IA EXECUTORA)

## Objetivo

Fazer sua IA:

* 🧠 decidir o que precisa fazer
* 🔧 escolher ferramentas automaticamente
* ⚙️ executar ações reais
* 🔁 voltar com resultado e responder
* 🧩 combinar múltiplas ferramentas em sequência

---

# O que muda na Fase 7

Antes (Fase 6):

> IA busca informações e responde

Agora:

> IA pensa → planeja → executa → responde

---

# Arquitetura da Fase 7

```text id="agent_arch"
Usuário
   │
   ▼
LLM (Planner)
   │
   ▼
Tool Router
   │
 ┌─┼────────────────────────────┐
 ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼
Web Search  Calculator  Python  Files  RAG  OCR  DB  System Tools
   │
   └──────────┬───────────────┘
              ▼
        Result Aggregator
              │
              ▼
         LLM (Responder)
              │
              ▼
           Resposta
```

---

# 1. Conceito central: Tool Calling

A IA não responde diretamente.

Ela gera algo assim:

```json id="tool_call"
{
  "tool": "calculator",
  "action": "multiply",
  "input": "53892 * 493"
}
```

Ou:

```json id="web_tool"
{
  "tool": "web_search",
  "query": "IA generativa 2026"
}
```

---

# 2. Tipos de agentes

## 🧠 Planner Agent (cérebro)

* interpreta pergunta
* decide estratégia
* chama ferramentas

---

## ⚙️ Executor Agent

* executa ferramentas
* retorna resultado bruto

---

## 🧾 Responder Agent

* organiza resposta final
* escreve explicação
* cita fontes

---

# 3. Ferramentas (Tool System)

## Estrutura base

```python id="tool_base"
class Tool:
    name: str
    description: str

    def run(self, input):
        pass
```

---

## Tools principais da Fase 7

### 🔢 Calculator Tool

```text id="calc"
operações matemáticas
```

Exemplo:

```json id="calc2"
{
  "tool": "calculator",
  "input": "12 * (5 + 3)"
}
```

---

### 🐍 Python Executor Tool

Executa código:

```python id="exec_py"
def run_code(code):
    exec(code)
```

Exemplo:

```json id="pytool"
{
  "tool": "python",
  "code": "print(2+2)"
}
```

---

### 🌐 Web Tool

```text id="webtool"
Busca na internet
Scraping
Resumo
```

---

### 📚 RAG Tool (Fase 5/6)

```text id="ragtool"
Busca em livros e PDFs
```

---

### 📁 File Tool

* ler PDF
* ler DOCX
* ler TXT
* listar arquivos

---

### 🧠 Memory Tool

* salvar informações importantes
* recuperar contexto

---

### 🗄️ Database Tool

* consultar PostgreSQL
* salvar dados estruturados

---

# 4. Orquestrador de ferramentas

O coração da Fase 7:

```text id="orchestrator"
IA decide:
   ↓
Qual ferramenta usar?
   ↓
Executa
   ↓
Recebe resultado
   ↓
Pode chamar outra ferramenta
   ↓
Finaliza resposta
```

---

# 5. Execução em cadeia (multi-tool)

Exemplo real:

Pergunta:

> “Qual a média dos números desses PDFs?”

Fluxo:

```text id="chain"
PDF Tool → extrai números
        ↓
Python Tool → calcula média
        ↓
LLM → explica resultado
```

---

# 6. Tool calling loop (IMPORTANTE)

A IA pode repetir chamadas:

```text id="loop"
Pergunta
  ↓
Tool 1
  ↓
Tool 2
  ↓
Tool 3
  ↓
Resposta final
```

---

# 7. Formato de comunicação interno

```json id="agent_msg"
{
  "step": "plan | tool_call | observe | finalize",
  "tool": "web_search",
  "input": "...",
  "result": "..."
}
```

---

# 8. Segurança (CRÍTICO)

Você PRECISA proteger:

### 🔒 Python Tool

* sandbox (Docker ou restricted exec)
* limite de CPU
* limite de memória
* timeout

---

### 🔒 File Tool

* bloquear acesso ao sistema
* limitar diretórios

---

### 🔒 Web Tool

* filtrar sites perigosos
* evitar prompt injection

---

# 9. Prompt do Planner Agent

```text id="planner_prompt"
Você é um agente que decide ferramentas.

Ferramentas disponíveis:
- calculator
- python
- web_search
- rag_search
- file_reader

Regras:
- sempre escolha a ferramenta correta
- nunca invente resultados
- se precisar de cálculo, use calculator
- se precisar de dados externos, use web_search
```

---

# 10. Pipeline completo

```text id="pipeline7"
Usuário pergunta
      ↓
Planner Agent (decide)
      ↓
Tool Router
      ↓
Execução das ferramentas
      ↓
Resultados agregados
      ↓
Responder Agent
      ↓
Resposta final
```

---

# 11. API da Fase 7

```text id="api7"
POST /api/v1/agent/execute
POST /api/v1/agent/chat
POST /api/v1/tools/run
POST /api/v1/tools/list
```

---

# 12. Execução paralela (avançado)

A IA pode rodar ferramentas ao mesmo tempo:

```text id="parallel"
Web Search ─┐
            ├──> Agregação
RAG Search ─┘
```

---

# 13. Logs de raciocínio

Você registra:

* ferramenta usada
* motivo
* entrada
* saída
* tempo de execução

---

# 14. Cache de ferramentas

Se a mesma operação for repetida:

```text id="cache7"
calculator(2+2) → 4 (cache)
```

---

# 15. Resultado final da Fase 7

Sua IA agora:

✔ não só responde
✔ mas executa ações reais
✔ usa ferramentas automaticamente
✔ combina múltiplos sistemas
✔ resolve problemas complexos sozinho

---

# Exemplo real de uso

Pergunta:

> “Baixe esse PDF, extraia os números e calcule a média”

Resposta interna:

```text id="example7"
1. File Tool → lê PDF
2. Python Tool → extrai números
3. Calculator Tool → média
4. LLM → explica
```

---

# O que você construiu até aqui

* Fase 1 → Chat local
* Fase 4 → Lê documentos
* Fase 5 → RAG inteligente
* Fase 6 → Internet + livros híbrido
* Fase 7 → IA que executa ações

---

# Resultado final da Fase 7

Você agora tem um sistema que se parece com:

* ChatGPT (conversa)
* Perplexity (web)
* Notion AI (documentos)
* Wolfram Alpha (cálculo)
* AutoGPT (agente)

tudo em um só sistema local.

---

Se quiser, posso montar a **Fase 8 (Memória permanente + aprendizado contínuo + IA que evolui sozinha)** — que é onde o sistema começa a ficar realmente “vivo” e acumulativo.
