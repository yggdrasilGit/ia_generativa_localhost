import re
import unicodedata


_LIGATURES = {
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬀ": "ff",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "æ": "ae",
    "œ": "oe",
}

_ACCENT_FIXES = [
    (r"\s*[˜\u0303]\s*a", "ã"),
    (r"\s*[˜\u0303]\s*o", "õ"),
    (r"\s*\^\s*a", "â"),
    (r"\s*\^\s*e", "ê"),
    (r"\s*\^\s*i", "î"),
    (r"\s*\^\s*o", "ô"),
    (r"\s*\^\s*u", "û"),
    (r"\s*´\s*a", "á"),
    (r"\s*´\s*e", "é"),
    (r"\s*´\s*i", "í"),
    (r"\s*´\s*o", "ó"),
    (r"\s*´\s*u", "ú"),
    (r"\s*`\s*a", "à"),
    (r"\s*¨\s*u", "ü"),
    (r"\s*[¸\u0327]\s*c", "ç"),
    (r"c\s*[¸\u0327]", "ç"),
]


def _normalize_unicode(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    for bad, good in _LIGATURES.items():
        text = text.replace(bad, good)
    return text


def _fix_broken_accents(text: str) -> str:
    for pattern, replacement in _ACCENT_FIXES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def _fix_line_break_hyphenation(text: str) -> str:
    # Junta palavras quebradas por hifenização de fim de linha.
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)
    # Converte quebra de linha simples em espaço para manter fluidez.
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
    return text


def _fix_intra_word_spacing(text: str) -> str:
    # Corrige casos comuns de OCR/PDF em português, ex: "dimens ao" -> "dimensao".
    text = re.sub(r"([A-Za-zÀ-ÿ]{3,})\s+([A-Za-zÀ-ÿ]{2,})", lambda m: _join_if_split(m.group(1), m.group(2)), text)
    return text


def _join_if_split(left: str, right: str) -> str:
    # Heurística conservadora: evita juntar quando a palavra da esquerda já termina com pontuação.
    if re.search(r"[\.,;:!?]$", left):
        return f"{left} {right}"

    # Junta apenas em cenários conservadores de fragmentação OCR.
    common_suffixes = {
        "ao", "oes", "cao", "coes", "riais", "nita", "mente", "dade", "vel", "veis"
    }
    if left.islower() and right.islower() and (
        len(right) <= 3 or right in common_suffixes
    ):
        return f"{left}{right}"

    return f"{left} {right}"


def clean_text(text: str) -> str:
    text = _normalize_unicode(text)
    text = text.replace("\r", "\n")
    text = _fix_line_break_hyphenation(text)
    text = _fix_broken_accents(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+([\.,;:!?])", r"\1", text)
    # Remove linhas com apenas número de página
    text = re.sub(r"(?m)^\s*\d+\s*$", "", text)
    text = _fix_intra_word_spacing(text)
    return text.strip()
