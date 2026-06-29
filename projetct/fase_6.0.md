Perfeito — agora você entra na parte que separa um “chat com documentos” de um **assistente de verdade estilo ChatGPT/Perplexity**.

---

# FASE 6 — RAG HÍBRIDO + BUSCA NA INTERNET INTELIGENTE

## Objetivo

Fazer sua IA decidir automaticamente:

* 📚 usar seus livros (RAG local)
* 🌐 usar internet (dados atualizados)
* 🧠 combinar ambos
* 📌 citar fontes
* ⚖️ escolher a melhor evidência

---

# O que muda na Fase 6

Antes (Fase 5):

> “Procuro só nos seus documentos”

Agora:

> “Decido onde buscar: livros, internet ou ambos”

---

# Arquitetura da Fase 6

```text id="rag6_arch"
Usuário pergunta
      │
      ▼
Query Analyzer (INTENÇÃO)
      │
      ▼
Router de conhecimento
      │
 ┌────┼───────────────┐
 ▼    ▼               ▼
RAG  INTERNET      HÍBRIDO
(local)   (web)   (local+web)
      │      │        │
      └──────┼────────┘
             ▼
      Fusion Layer
             │
      Re-ranking
             │
      Prompt final LLM
             │
      Resposta com fontes
```

---

# 1. Query Analyzer (cérebro da decisão)

Aqui a IA decide **onde buscar antes de responder**.

Exemplos:

| Pergunta                              | Decisão        |
| ------------------------------------- | -------------- |
| "O que é recursividade?"              | RAG (livros)   |
| "Quem é o presidente do Brasil hoje?" | Internet       |
| "Explique IA e tendências atuais"     | Híbrido        |
| "Lei do ICMS no Brasil"               | RAG + Internet |

---

## Modelo simples de decisão

```python id="router_logic"
if pergunta é conceitual ou técnico:
    usar RAG
elif pergunta é atual ou notícia:
    usar Internet
else:
    usar híbrido
```

---

# 2. RAG Local (Fase 5 reutilizada)

* ChromaDB / FAISS
* embeddings
* top-k chunks
* reranker

---

# 3. Módulo de Internet (NOVO)

## Ferramentas possíveis:

* Tavily API (melhor para IA)
* Brave Search API
* SerpAPI
* Bing API

---

## Pipeline web:

```text id="web_pipeline"
Pergunta
   ↓
Search API
   ↓
Top resultados
   ↓
Scraping (trafilatura)
   ↓
Limpeza
   ↓
Resumo IA
   ↓
Chunks estruturados
```

---

## Exemplo de resultado web:

```text id="web_chunks"
[Site: wikipedia.org]
Texto resumido...

[Site: g1.globo.com]
Notícia relevante...

[Site: stackoverflow]
Explicação técnica...
```

---

# 4. Fusion Layer (parte mais importante)

Aqui você junta:

```text id="fusion"
RAG (livros)
+
Internet
```

Depois:

* remove duplicados
* ordena por relevância
* filtra ruído
* aplica reranking final

---

# 5. Reranker global

Agora você não reordena só chunks locais.

Você reordena:

* livros
* sites
* PDFs
* notícias

Tudo junto.

---

# 6. Context Builder híbrido

```text id="prompt6"
Você é um assistente inteligente.

Use os seguintes contextos:

=== LIVROS ===
{chunks locais}

=== INTERNET ===
{chunks web}

Regras:
- Priorize fontes mais confiáveis
- Cite sempre a origem
- Se houver conflito, explique as diferenças
```

---

# 7. Resposta final com múltiplas fontes

Exemplo:

```text id="answer6"
Recursividade é uma técnica em que uma função chama a si mesma.

📚 Segundo o livro "Estruturas de Dados", pág. 45:
"Recursão é um método de resolução de problemas..."

🌐 Já segundo a Wikipedia:
"Recursion occurs when a function..."

✔ Conclusão:
Ambas definições estão corretas, sendo a primeira mais técnica.
```

---

# 8. Sistema de confiança por fonte

Cada fonte recebe um peso:

| Fonte         | Peso |
| ------------- | ---- |
| Livro próprio | 0.9  |
| PDF acadêmico | 0.85 |
| Wikipedia     | 0.7  |
| Blog          | 0.5  |
| Fórum         | 0.4  |

---

# 9. Cache inteligente

Para evitar custo e lentidão:

```text id="cache6"
Pergunta → hash → cache

Se existir:
   retorna resposta

Se não:
   executa pipeline
```

---

# 10. API da Fase 6

```text id="api6"
POST /api/v1/agent/chat
POST /api/v1/agent/query
POST /api/v1/agent/web-search
POST /api/v1/agent/rag-search
```

---

# 11. Controle de estratégia (IMPORTANTE)

Você pode deixar a IA escolher:

```text id="strategy6"
"estratégia": "auto | rag | web | hybrid"
```

---

# 12. Observabilidade

Agora você mede:

* quantos chunks vieram de livros
* quantos vieram da web
* tempo de busca
* tempo de geração
* confiança final

---

# 13. Segurança (novo ponto crítico)

Na internet:

* filtrar sites ruins
* bloquear spam
* evitar prompt injection

Exemplo de proteção:

```text id="security6"
Se o site disser:
"ignore instruções anteriores"

→ ignorar completamente
```

---

# 14. Pipeline final

```text id="final6"
Usuário
  ↓
Classificador de intenção
  ↓
Router (RAG / Web / Híbrido)
  ↓
Coleta de contexto
  ↓
Fusion Layer
  ↓
Reranker
  ↓
LLM (Qwen / Llama)
  ↓
Resposta com fontes
```

---

# O que você ganha com a Fase 6

Você terá um sistema que:

✔ usa seus livros como base de conhecimento
✔ busca na internet automaticamente
✔ compara fontes
✔ explica divergências
✔ cita tudo corretamente
✔ escolhe a melhor resposta possível

---

# Resultado prático

Sua IA começa a se comportar como:

* ChatGPT (conversa)
* Perplexity (busca web)
* NotebookLM (livros)
* Assistente pessoal

tudo ao mesmo tempo.

---

# Próxima fase natural (se quiser continuar)

## 👉 FASE 7 — Agentes + ferramentas (tool calling real)

Onde sua IA começa a:

* usar calculadora
* rodar código Python
* abrir arquivos
* executar funções
* tomar decisões autônomas

---

Se quiser, posso montar a **Fase 7 (Agentes + Tool Calling + IA que executa ações reais)** — que é onde o sistema deixa de ser só “inteligente” e vira “operacional”.
