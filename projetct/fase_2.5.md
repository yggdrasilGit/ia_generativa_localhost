Se eu estivesse projetando o **Yggdrasil AI** para ser desenvolvido durante vários anos, a **Fase 2.5** seria a última etapa antes da Fase 3. O objetivo seria transformar o frontend em uma plataforma extensível, para que as próximas fases (RAG, voz, memória, agentes, imagens etc.) sejam adicionadas apenas como módulos.

---

# Fase 2.5 — Plataforma Extensível

## Objetivo

Criar uma base que permita adicionar novas funcionalidades sem reescrever a interface.

---

# 1. Sistema de Plugins

Cada funcionalidade será um plugin.

```text
plugins/

chat/

library/

rag/

voice/

internet/

ocr/

images/

agents/

memory/
```

Cada plugin terá:

```text
plugin.json

routes

components

hooks

services

icons

permissions
```

---

# 2. Registro de Plugins

Ao iniciar:

```text
Yggdrasil AI

↓

Procura plugins

↓

Carrega automaticamente

↓

Mostra na interface
```

Assim, no futuro, basta instalar um novo plugin.

---

# 3. Tool Registry

Criar um registro central de ferramentas.

Exemplo:

```text
Chat

Internet

OCR

PDF

Imagem

Código

Python

Terminal

Memória

RAG
```

Cada ferramenta informa:

* nome
* descrição
* ícone
* permissões
* parâmetros
* versão

---

# 4. Event Bus

Tudo gera eventos.

```text
Mensagem enviada

↓

Evento

↓

Plugins escutam
```

Exemplo:

```text
Documento enviado

↓

OCR inicia

↓

Embeddings iniciam

↓

Biblioteca atualiza

↓

Notificação aparece
```

Sem dependências diretas entre módulos.

---

# 5. Command Bus

Tudo vira comando.

```text
Enviar mensagem

↓

Command

↓

Executor
```

Outro exemplo:

```text
Pesquisar Internet

↓

Command

↓

Plugin Internet
```

---

# 6. Sistema de Hooks

Plugins podem registrar ações.

```text
Antes de enviar mensagem

Depois da resposta

Depois do upload

Depois do OCR

Após login
```

---

# 7. Configuração Dinâmica

Cada plugin cria sua própria página de configuração.

Exemplo:

```text
Internet

↓

Número máximo de resultados

↓

Idioma

↓

Timeout
```

Sem alterar a tela principal de configurações.

---

# 8. Registro de Serviços

Um local único para acessar:

```text
ChatService

OCRService

MemoryService

VoiceService

ImageService

InternetService
```

---

# 9. Sistema de Permissões

Cada módulo informa o que precisa.

Exemplo:

```text
Plugin Voz

↓

Microfone

↓

Aceitar?
```

Outro:

```text
Plugin Internet

↓

Acesso à Web

↓

Aceitar?
```

---

# 10. Feature Flags

Habilitar ou desabilitar módulos.

```text
OCR

ON

Internet

OFF

Voice

OFF

Agents

OFF
```

Excelente para testes.

---

# 11. Sistema de Temas

Não apenas claro e escuro.

Exemplo:

```text
ChatGPT

Claude

GitHub

VSCode

Cyberpunk

Dracula

Nord

Solarized
```

---

# 12. Design System

Criar componentes reutilizáveis.

```text
Button

Card

Modal

Tooltip

Input

Dropdown

Toast

Badge

Dialog

Tabs

Sidebar

Avatar

Table

Tree

Loader
```

Nenhum componente duplicado.

---

# 13. Biblioteca de Ícones

Padronizar todos os ícones.

```text
Lucide

Material

Heroicons
```

---

# 14. Sistema de Layout

Permitir organizar os painéis.

```text
Sidebar

↓

Esquerda

↓

Direita

↓

Oculta
```

---

# 15. Registro de Atalhos

Cada plugin registra seus atalhos.

```text
OCR

Ctrl+Shift+O

Internet

Ctrl+Shift+I

Biblioteca

Ctrl+Shift+B
```

---

# 16. Sistema de Telemetria Local

Nunca envia dados para fora.

Mostra:

```text
Tempo

CPU

RAM

GPU

VRAM

Tokens

Mensagens

Plugins ativos
```

---

# 17. Gerenciador de Estado

Separar estados.

```text
Chat

↓

chatStore

Projetos

↓

projectStore

Usuário

↓

userStore

Interface

↓

uiStore
```

---

# 18. Sistema de Cache

Guardar:

* respostas
* modelos
* configurações
* miniaturas
* pesquisas

---

# 19. Internacionalização

Preparar:

```text
Português

English

Español

Français
```

Mesmo usando apenas português no início.

---

# 20. Modo Offline Completo

Toda interface continua funcionando.

Mesmo:

* sem internet
* sem plugin Internet

Tudo local.

---

# Estrutura definitiva da Fase 2

```text
frontend/

src/

├── app/
├── assets/
├── components/
├── plugins/
├── registry/
├── layouts/
├── hooks/
├── providers/
├── services/
├── stores/
├── contexts/
├── routes/
├── themes/
├── commands/
├── events/
├── permissions/
├── cache/
├── utils/
├── pages/
├── i18n/
└── types/
```

---

# O que você terá ao final da Fase 2

Antes mesmo de implementar autenticação, RAG ou memória, o Yggdrasil AI já será uma plataforma completa:

* ✅ Interface moderna e responsiva.
* ✅ Sistema de projetos, conversas e favoritos.
* ✅ Workspace organizado.
* ✅ Design System reutilizável.
* ✅ Arquitetura baseada em plugins.
* ✅ Registro de ferramentas e serviços.
* ✅ Event Bus e Command Bus.
* ✅ Temas, layouts e atalhos personalizáveis.
* ✅ Monitoramento e telemetria local.
* ✅ Base pronta para incorporar voz, OCR, RAG, agentes, geração de imagens e novos módulos sem reestruturar o projeto.

## Um último refinamento

Como etapa final da Fase 2, eu documentaria a arquitetura desde o início. Criaria uma pasta `docs/` contendo:

```text
docs/
├── architecture/
├── api/
├── frontend/
├── backend/
├── plugins/
├── diagrams/
├── decisions/      # ADRs (Architecture Decision Records)
├── roadmap/
└── contributing/
```

Além disso, manteria um catálogo de componentes (por exemplo, com Storybook ou uma solução equivalente) para documentar visualmente cada componente da interface. Isso facilita a manutenção, reduz inconsistências visuais e torna o projeto muito mais escalável à medida que novas funcionalidades forem sendo adicionadas.
