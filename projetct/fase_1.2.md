Entendi. Se o foco é **apenas a Fase 1**, então eu deixaria ela extremamente sólida antes de pensar em OCR, RAG ou busca na internet.

Eu chamaria essa fase de **"Core AI Engine"**. Ela seria a base para todas as próximas etapas.

# Objetivos da Fase 1

Ao final da Fase 1 você deve ter:

* ✅ Chat rápido
* ✅ Código limpo
* ✅ Fácil manutenção
* ✅ Fácil troca de modelo
* ✅ Interface moderna
* ✅ Base pronta para crescer

---

# Escopo da Fase 1

## 1. Arquitetura limpa (Clean Architecture)

Em vez de colocar tudo em um arquivo, separar em camadas:

```text
Frontend
      │
      ▼
API (FastAPI)
      │
      ▼
Application (regras de negócio)
      │
      ▼
Domain (entidades)
      │
      ▼
Infrastructure (Ollama, arquivos, etc.)
```

Isso evita reescrever o projeto depois.

---

## 2. Configuração centralizada

Tudo deve ser configurável por `.env`:

* Modelo
* URL do Ollama
* Temperatura
* Número máximo de tokens
* Timeout
* Porta
* Nível de log

Assim você muda o comportamento sem alterar código.

---

## 3. AI Manager

Não deixar o código conversar diretamente com o Ollama.

Criar uma classe:

```python
AIManager
```

Ela será responsável por:

* carregar o modelo;
* enviar mensagens;
* trocar de modelo;
* controlar temperatura;
* controlar contexto.

Depois, quando quiser trocar o Ollama por vLLM, praticamente só esse módulo muda.

---

## 4. Histórico por sessão

Mesmo sem banco de dados.

Cada usuário recebe um:

```text
session_id
```

Assim o modelo lembra do contexto da conversa.

---

## 5. Streaming

Em vez de esperar a resposta inteira:

```
Rec...

Recurs...

Recursividade...
```

A experiência fica muito melhor.

---

## 6. Markdown completo

Renderizar corretamente:

* tabelas;
* listas;
* blocos de código;
* fórmulas (LaTeX);
* citações.

---

## 7. Destaque de código

Código colorido automaticamente.

Exemplo:

```python
def soma(a, b):
    return a + b
```

---

## 8. Cancelar geração

Adicionar um botão **Parar**.

Se o modelo estiver gerando um texto enorme, o usuário pode interromper.

---

## 9. Regenerar resposta

Como no ChatGPT.

Botão:

```
Regenerar resposta
```

---

## 10. Copiar resposta

Cada mensagem deve ter:

* 📋 Copiar
* 👍 Gostei
* 👎 Não gostei

---

## 11. Sidebar

Mesmo sem salvar em banco.

```
Nova conversa

Conversa 1

Conversa 2

Conversa 3
```

---

## 12. Sistema de temas

* Claro
* Escuro
* Automático

---

## 13. Atalhos

Exemplo:

* Enter → enviar
* Shift+Enter → nova linha
* Ctrl+L → nova conversa
* Ctrl+K → pesquisar

---

## 14. Indicadores

Mostrar:

```
Modelo: Qwen 3

Tempo: 2,1 s

Tokens: 540
```

---

## 15. Health Check

Endpoint:

```
/health
```

Retorna:

```json
{
  "status": "online",
  "model": "qwen3",
  "version": "0.1.0"
}
```

---

## 16. Tratamento de erros

Mensagens claras:

* Modelo não encontrado.
* Ollama desligado.
* Tempo de resposta excedido.
* Erro de rede.

Sem expor rastreamentos técnicos ao usuário.

---

## 17. Logs estruturados

Registrar:

* início da conversa;
* duração;
* erros;
* modelo utilizado.

---

## 18. Testes

Já criar testes para:

* API;
* AI Manager;
* chat;
* frontend.

---

## 19. Docker

Containers separados:

```
Frontend

Backend

Ollama

Nginx
```

Assim qualquer pessoa consegue iniciar o projeto com um único comando.

---

## 20. Documentação

Ter um bom `README.md` com:

* instalação;
* arquitetura;
* estrutura de pastas;
* como contribuir;
* como adicionar novos modelos.

---

# Resultado esperado da Fase 1

Ao final, você terá um sistema que:

* conversa de forma fluida;
* mantém contexto por sessão;
* suporta streaming;
* tem uma interface moderna;
* é fácil de testar;
* é fácil de manter;
* está preparado para receber, nas próximas fases, recursos como memória persistente, RAG, OCR, busca na internet e agentes.

## Minha única mudança em relação ao plano inicial

Eu acrescentaria um **gerenciador de provedores de IA** desde a Fase 1. Em vez de o sistema depender diretamente do Ollama, criaria uma interface como:

```text
LLMProvider
├── OllamaProvider
├── VLLMProvider
├── OpenAIProvider
└── LMStudioProvider
```

Assim, o restante da aplicação nunca sabe qual modelo ou servidor está por trás. Se amanhã você decidir trocar o Ollama por outro servidor ou adicionar suporte a vários modelos, não precisará reescrever o chat nem a lógica do backend. Essa decisão arquitetural pequena no início costuma economizar muito trabalho nas fases seguintes.
