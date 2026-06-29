# Fase 3 — Histórico, Autenticação e Gerenciamento de Usuários

## Objetivo

Permitir que cada usuário tenha sua própria conta, histórico, projetos, configurações e preferências, com segurança e escalabilidade.

---

# Arquitetura

```text
React

↓

FastAPI

↓

Autenticação

↓

PostgreSQL

↓

Histórico

↓

Projetos

↓

Configurações
```

---

# Estrutura

```text
backend/

app/

├── auth/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   ├── permissions/
│   └── security/
│
├── users/
│
├── conversations/
│
├── history/
│
├── settings/
│
├── projects/
│
├── sessions/
│
└── audit/
```

---

# 3.1 Sistema de Usuários

Cada usuário possui:

```text
Nome

Email

Senha

Avatar

Idioma

Tema

Fuso horário

Data de criação

Último acesso

Status

Plano (futuro)

Configurações pessoais
```

---

# 3.2 Cadastro

Campos:

```text
Nome

Email

Senha

Confirmar senha
```

Validações:

* senha forte
* email válido
* confirmação de senha
* usuário único

---

# 3.3 Login

Permitir:

```text
Email

Senha
```

Preparado para adicionar futuramente:

* Login com Google
* Login com GitHub
* Login corporativo (OIDC/OAuth2)

---

# 3.4 Recuperação de Senha

Fluxo:

```text
Email

↓

Token

↓

Nova senha
```

---

# 3.5 Sessões

Cada login cria uma sessão.

Mostrar:

```text
Windows

Linux

Mac

Android

iPhone

Último acesso

IP

Navegador
```

Permitir:

```text
Encerrar sessão
```

---

# 3.6 Tokens

Utilizar:

```text
JWT Access Token

+

Refresh Token
```

Separados.

---

# 3.7 Renovação Automática

Quando expirar:

```text
Access Token

↓

Refresh Token

↓

Novo Access Token
```

Sem desconectar o usuário.

---

# 3.8 Logout

Permitir:

```text
Logout atual

Logout de todos dispositivos
```

---

# 3.9 Histórico

Guardar:

```text
Pergunta

Resposta

Modelo

Data

Tempo

Tokens

Projeto

Tags
```

---

# 3.10 Busca no Histórico

Pesquisar:

```text
Python

↓

Todas mensagens contendo Python
```

Filtros:

* data
* projeto
* modelo
* tags

---

# 3.11 Conversas

Cada conversa possui:

```text
Título

Projeto

Modelo

Criada

Última edição

Número de mensagens

Favorita

Arquivada

Fixada
```

---

# 3.12 Organização

Permitir:

```text
Mover

Duplicar

Arquivar

Excluir

Renomear

Fixar

Favoritar
```

---

# 3.13 Configurações

Salvar:

```text
Tema

Idioma

Modelo padrão

Temperatura

Top-P

Prompt padrão

Layout

Atalhos
```

---

# 3.14 Avatar

Upload de imagem.

Preparar para futuras opções como geração por IA.

---

# 3.15 Auditoria

Registrar eventos importantes:

```text
Login

Logout

Troca de senha

Criação de projeto

Exclusão de conversa

Alteração de configurações
```

---

# 3.16 Lixeira

Conversas excluídas não são removidas imediatamente.

```text
Excluir

↓

Lixeira

↓

30 dias

↓

Exclusão definitiva
```

---

# 3.17 Backup do Usuário

Exportar:

* Conversas
* Projetos
* Configurações
* Favoritos
* Prompts

---

# 3.18 Importação

Importar um backup previamente exportado.

---

# 3.19 Perfil

Página com:

```text
Avatar

Nome

Email

Data de cadastro

Número de conversas

Projetos

Documentos

Uso de armazenamento
```

---

# 3.20 Segurança

Implementar:

* Hash de senhas com algoritmo moderno (por exemplo, Argon2id).
* Proteção contra força bruta (rate limiting e bloqueio temporário).
* CSRF (quando aplicável).
* CORS configurado corretamente.
* Validação rigorosa de entradas.
* Cabeçalhos HTTP de segurança.
* Criptografia para dados sensíveis.

---

# Banco de Dados

```text
users

id

name

email

password_hash

avatar

created_at

updated_at

last_login
```

```text
projects

id

user_id

name

description

created_at
```

```text
conversations

id

project_id

title

created_at

updated_at

favorite

archived
```

```text
messages

id

conversation_id

role

content

tokens

created_at
```

```text
sessions

id

user_id

token

device

ip

expires_at
```

```text
settings

id

user_id

theme

language

default_model

temperature

top_p
```

```text
audit_logs

id

user_id

action

details

created_at
```

---

# APIs

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh

GET    /users/me
PUT    /users/me

GET    /projects
POST   /projects
PUT    /projects/{id}
DELETE /projects/{id}

GET    /conversations
POST   /conversations
PUT    /conversations/{id}
DELETE /conversations/{id}

GET    /messages/{conversation_id}

GET    /settings
PUT    /settings

GET    /audit

POST   /backup/export
POST   /backup/import
```

---

# Interface

```text
+-----------------------------------------------------------+

 Sidebar

 Projetos

 Histórico

 Favoritos

 Arquivos

 Configurações

------------------------------------------------------------

 Conversa

------------------------------------------------------------

 Digite sua mensagem...

📎 🎤 🌐 📚 ⚙️

------------------------------------------------------------

Usuário: Yggdrasil

Modelo: Qwen 3

Projeto: IA Local

Sessão: Ativa

+-----------------------------------------------------------+
```

---

# Resultado esperado da Fase 3

Ao concluir essa fase, o Yggdrasil AI terá:

* ✅ Sistema completo de autenticação e gerenciamento de usuários.
* ✅ Histórico persistente e pesquisável.
* ✅ Organização por projetos e conversas.
* ✅ Sessões seguras e gerenciamento de dispositivos.
* ✅ Configurações personalizadas por usuário.
* ✅ Estrutura de banco de dados preparada para memória, RAG, agentes e compartilhamento.
* ✅ APIs REST organizadas e prontas para integração com as próximas fases.

Essa base permitirá que a **Fase 4 (Importação de Documentos)** e a **Fase 5 (RAG com ChromaDB)** armazenem documentos e conhecimento vinculados a cada usuário e a cada projeto, mantendo isolamento e organização dos dados desde o início.
