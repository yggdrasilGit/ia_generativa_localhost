# FASE 4 — Importação de Documentos (Knowledge Ingestion)

## Objetivo

Fazer a IA conseguir:

* 📄 receber arquivos (PDF, DOCX, TXT, etc.)
* 📚 extrair conteúdo (inclusive escaneado)
* 🧠 transformar em conhecimento pesquisável
* 🔎 preparar para RAG (Fase 5)

---

# O que essa fase entrega

Ao final da Fase 4 você terá:

```text id="v9kq0z"
✔ Upload de documentos
✔ Extração de texto
✔ OCR para PDFs escaneados
✔ Limpeza e segmentação (chunks)
✔ Metadados (autor, título, página)
✔ Indexação em banco vetorial (ChromaDB ou FAISS)
✔ API de consulta básica ao conhecimento
```

---

# Arquitetura da Fase 4

```text id="c2k8px"
Frontend
   │
   ▼
Upload API (FastAPI)
   │
   ▼
Document Service
   │
   ├── Detecta tipo de arquivo
   ├── Extrai texto
   ├── OCR (se necessário)
   ├── Limpa texto
   ├── Divide em chunks
   ├── Cria embeddings
   ▼
Vector DB (ChromaDB)
```

---

# Estrutura do projeto (nova camada)

```text id="j7xq1m"
backend/
│
├── documents/
│   ├── upload.py
│   ├── parser.py
│   ├── ocr.py
│   ├── cleaner.py
│   ├── chunker.py
│   ├── embeddings.py
│   └── indexer.py
│
├── rag/
│   └── vector_store.py
```

---

# 1. Upload de arquivos

Endpoint:

```python id="m3kq8a"
POST /api/v1/documents/upload
```

Recebe:

* PDF
* DOCX
* TXT
* EPUB (opcional na fase 4)

---

# 2. Detecção automática do tipo

```python id="q1v9pd"
if pdf:
    if is_scanned:
        run OCR
    else:
        extract text directly
```

---

# 3. OCR (PDF escaneado)

Ferramentas:

* OCRmyPDF (melhor escolha)
* Tesseract
* PaddleOCR (mais preciso)

Fluxo:

```text id="x8m0ld"
Imagem PDF
   ↓
OCR
   ↓
Texto limpo
```

---

# 4. Extração de texto

### PDF normal

* PyMuPDF (fitz)
* pdfplumber

### DOCX

* python-docx

### TXT

* leitura direta

---

# 5. Limpeza de texto

Remover:

* quebras estranhas
* espaços duplicados
* headers repetidos
* rodapés
* números de página soltos

---

# 6. Chunking (muito importante)

Você não manda livro inteiro para IA.

Divide em pedaços:

```text id="u2j8pq"
Chunk 1: 500–1000 tokens
Chunk 2: 500–1000 tokens
Chunk 3: 500–1000 tokens
```

Estratégias:

* por parágrafo
* por título
* por tamanho fixo (tokens)

---

# 7. Embeddings

Transformar texto em vetor:

Modelos:

* BGE-M3
* all-MiniLM
* Nomic Embed

```text id="v7p1lc"
Texto → Embedding → Vetor numérico
```

---

# 8. Banco vetorial (ChromaDB)

Armazenar:

```text id="k9m2xq"
Chunk
Embedding
Metadados
```

Exemplo:

* título do livro
* autor
* página
* capítulo
* fonte

---

# 9. Indexação

Processo:

```text id="t4n8qp"
Upload
  ↓
Extração
  ↓
Chunking
  ↓
Embedding
  ↓
ChromaDB
```

---

# 10. API de documentos

Endpoints:

```text id="z1k9qp"
POST /documents/upload
GET  /documents/list
DELETE /documents/{id}
POST /documents/reindex
GET  /documents/search
```

---

# 11. Busca semântica (pré-RAG)

Antes da Fase 5, você já pode testar:

```text id="p8v2ld"
Pergunta

↓

Busca no ChromaDB

↓

Retorna chunks relevantes
```

---

# 12. Interface no frontend

Adicionar:

* 📎 Upload de arquivos
* 📚 Biblioteca de documentos
* 🔍 Busca nos documentos
* 📊 Status de indexação

---

# 13. Pipeline assíncrono (IMPORTANTE)

Não travar o chat.

Use:

* Celery + Redis OU
* FastAPI BackgroundTasks

```text id="h2x8qm"
Upload → fila → processamento → indexação
```

---

# 14. Status de processamento

Cada arquivo deve ter status:

```text id="c7m9lp"
uploaded
processing
ocr
embedding
indexed
error
```

---

# 15. Logs

Registrar:

* tempo de processamento
* tamanho do arquivo
* número de chunks
* erros de OCR
* sucesso/falha

---

# Resultado da Fase 4

Ao final você terá uma IA que:

✔ recebe livros
✔ entende PDFs escaneados
✔ transforma tudo em conhecimento estruturado
✔ armazena em banco vetorial
✔ está pronta para responder perguntas na Fase 5

---

# O pulo de inteligência dessa fase

Aqui acontece a virada:

Antes:

> IA só conversa

Depois:

> IA começa a “ler sua biblioteca”