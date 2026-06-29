from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings


@dataclass
class SearchMatch:
    id: str
    score: float
    content: str
    metadata: dict


class VectorStore:
    def __init__(self):
        import chromadb

        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.collection = self.client.get_or_create_collection(name="documents")

    def upsert_chunks(self, ids: list[str], embeddings: list[list[float]], documents: list[str], metadatas: list[dict]):
        if not ids:
            return
        self.collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    def delete_by_ids(self, ids: list[str]):
        if not ids:
            return
        self.collection.delete(ids=ids)

    def delete_by_document(self, document_id: int):
        self.collection.delete(where={"document_id": document_id})

    def query(self, embedding: list[float], limit: int = 5, where: dict | None = None) -> list[SearchMatch]:
        result = self.collection.query(
            query_embeddings=[embedding],
            n_results=limit,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        ids = result.get("ids", [[]])[0]
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        out: list[SearchMatch] = []
        for idx, row_id in enumerate(ids):
            distance = float(distances[idx]) if idx < len(distances) else 0.0
            out.append(
                SearchMatch(
                    id=row_id,
                    score=max(0.0, 1.0 - distance),
                    content=docs[idx] if idx < len(docs) else "",
                    metadata=metas[idx] if idx < len(metas) else {},
                )
            )
        return out

    def get_by_id(self, chunk_id: str, where: dict | None = None) -> SearchMatch | None:
        result = self.collection.get(
            ids=[chunk_id],
            where=where,
            include=["documents", "metadatas"],
        )

        ids = result.get("ids", [])
        if not ids:
            return None

        docs = result.get("documents", [])
        metas = result.get("metadatas", [])

        return SearchMatch(
            id=ids[0],
            score=1.0,
            content=docs[0] if docs else "",
            metadata=metas[0] if metas else {},
        )

    def get_by_ids(self, chunk_ids: list[str], where: dict | None = None) -> list[SearchMatch]:
        if not chunk_ids:
            return []

        result = self.collection.get(
            ids=chunk_ids,
            where=where,
            include=["documents", "metadatas"],
        )

        ids = result.get("ids", [])
        docs = result.get("documents", [])
        metas = result.get("metadatas", [])

        out: list[SearchMatch] = []
        for idx, row_id in enumerate(ids):
            out.append(
                SearchMatch(
                    id=row_id,
                    score=1.0,
                    content=docs[idx] if idx < len(docs) else "",
                    metadata=metas[idx] if idx < len(metas) else {},
                )
            )
        return out
