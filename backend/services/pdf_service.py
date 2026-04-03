"""
services/pdf_service.py — PDF Text Extraction using pdfplumber
"""

import pdfplumber


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts and concatenates text from all pages of a PDF.
    Returns the combined text string.
    """
    texts = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    texts.append(page_text)
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {e}") from e

    return "\n\n".join(texts).strip()
