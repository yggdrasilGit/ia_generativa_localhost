from __future__ import annotations

from dataclasses import dataclass


@dataclass
class WebResult:
    title: str
    url: str
    snippet: str


async def search_web(query: str, max_results: int = 5) -> list[WebResult]:
    try:
        from duckduckgo_search import DDGS

        results: list[WebResult] = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(
                    WebResult(
                        title=r.get("title") or "",
                        url=r.get("href") or r.get("url") or "",
                        snippet=r.get("body") or "",
                    )
                )
        return results
    except Exception:
        return []
