"""
routes/upload.py — POST /analyze/upload (image or PDF)
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from services.ocr_service import extract_text_from_image
from services.pdf_service import extract_text_from_pdf
from services.preprocessing import preprocess
from services.openrouter_api import analyze_with_ai

router = APIRouter(tags=["upload"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
ALLOWED_PDF_TYPES   = {"application/pdf"}
MAX_FILE_SIZE_MB    = 10


@router.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...)):
    """
    Accepts an image or PDF upload.
    - Images → OCR via pytesseract
    - PDFs   → text extraction via pdfplumber
    Results are then passed to the same AI analysis pipeline.
    """
    # Size check
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_FILE_SIZE_MB} MB).")

    content_type = file.content_type or ""

    # Save temporarily
    ext     = Path(file.filename or "upload").suffix or ".bin"
    tmp_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
    tmp_path.write_bytes(contents)

    try:
        if content_type in ALLOWED_IMAGE_TYPES:
            text = extract_text_from_image(str(tmp_path))
        elif content_type in ALLOWED_PDF_TYPES:
            text = extract_text_from_pdf(str(tmp_path))
        else:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {content_type}. Use image or PDF.",
            )

        if not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract any text from the file.")

        cleaned, _ = await preprocess(text)   # file uploads have no source URL
        try:
            result  = await analyze_with_ai(cleaned)
        except RuntimeError as e:
            raise HTTPException(status_code=502, detail=str(e))
        return result

    finally:
        # Always clean up temp file
        try:
            os.remove(tmp_path)
        except OSError:
            pass
