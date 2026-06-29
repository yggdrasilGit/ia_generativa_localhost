from __future__ import annotations

import re
from typing import Literal

Strategy = Literal["rag", "web", "hybrid"]

# Palavras que indicam pergunta sobre eventos/fatos atuais → internet
_WEB_PATTERNS = re.compile(
    r"\b(hoje|agora|atual|recente|último|últimos|notícia|notícias|"
    r"2024|2025|2026|preço|cotação|eleição|evento|quem é|quem foi|"
    r"quando aconteceu|novo|nova|lançamento|tendência|trend)\b",
    re.IGNORECASE,
)

# Palavras que indicam conceitos técnicos/teóricos → RAG local
_RAG_PATTERNS = re.compile(
    r"\b(o que é|como funciona|explique|definição|conceito|teoria|algoritmo|"
    r"fórmula|equação|capítulo|página|segundo o livro|de acordo com|"
    r"aprenda|ensine|tutorial)\b",
    re.IGNORECASE,
)

# Prompts potencialmente maliciosos vindos de fontes externas
_INJECTION_PATTERNS = re.compile(
    r"(ignore (all |previous |prior |above |instruc|rules)|"
    r"forget (all |your |instruc)|"
    r"disregard (all |your |instruc)|"
    r"you are now|act as|roleplay as|pretend (to be|you are)|"
    r"new instructions?:)",
    re.IGNORECASE,
)


def analyze_query(question: str) -> Strategy:
    """Heuristically decide whether to use RAG, web, or hybrid search."""
    q = question.strip()

    web_score = len(_WEB_PATTERNS.findall(q))
    rag_score = len(_RAG_PATTERNS.findall(q))

    if web_score > 0 and rag_score == 0:
        return "web"
    if rag_score > 0 and web_score == 0:
        return "rag"
    if web_score > 0 and rag_score > 0:
        return "hybrid"

    # Default: try local first (hybrid), fall back via routes layer
    return "hybrid"


def sanitize_web_snippet(text: str) -> str:
    """Remove potential prompt-injection content from web snippets."""
    if not text:
        return text
    sanitized = _INJECTION_PATTERNS.sub("[CONTEÚDO REMOVIDO]", text)
    return sanitized[:2000]
