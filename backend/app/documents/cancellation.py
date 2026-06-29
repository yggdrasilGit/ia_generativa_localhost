from __future__ import annotations

import threading


class CancellationRegistry:
    """Thread-safe set of document IDs that have been requested for cancellation."""

    def __init__(self):
        self._lock = threading.Lock()
        self._cancelled: set[int] = set()

    def request(self, document_id: int) -> None:
        with self._lock:
            self._cancelled.add(document_id)

    def is_cancelled(self, document_id: int) -> bool:
        with self._lock:
            return document_id in self._cancelled

    def clear(self, document_id: int) -> None:
        with self._lock:
            self._cancelled.discard(document_id)


# Singleton used across the entire process
registry = CancellationRegistry()
