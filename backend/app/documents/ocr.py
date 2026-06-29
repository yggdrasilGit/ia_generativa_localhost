from __future__ import annotations


class OcrUnavailableError(RuntimeError):
    pass


def run_ocr(file_path: str) -> str:
    """OCR opcional para PDFs escaneados.

    A fase 4 já deixa o gancho pronto. Para ativar OCR real, instale
    `ocrmypdf` no sistema e execute o pipeline aqui.
    """
    raise OcrUnavailableError(
        "OCR não configurado. Instale OCRmyPDF/Tesseract para PDFs escaneados."
    )
