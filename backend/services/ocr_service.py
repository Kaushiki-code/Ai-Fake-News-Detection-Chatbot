"""
services/ocr_service.py — Image OCR using pytesseract
"""

from PIL import Image, ImageEnhance, ImageFilter


def extract_text_from_image(image_path: str) -> str:
    """
    Opens an image, pre-processes it for better OCR accuracy,
    and returns extracted text.

    Requires Tesseract-OCR to be installed on the system.
    On servers without Tesseract (e.g. Render free tier), this raises
    a clear RuntimeError instead of crashing the whole app.
    """
    try:
        import pytesseract  # lazy import — so missing Tesseract doesn't crash startup
    except ImportError:
        raise RuntimeError(
            "pytesseract is not installed. "
            "Run: pip install pytesseract Pillow"
        )

    try:
        img = Image.open(image_path).convert("L")  # grayscale

        # Enhance contrast and sharpness
        img = ImageEnhance.Contrast(img).enhance(2.0)
        img = ImageEnhance.Sharpness(img).enhance(2.0)
        img = img.filter(ImageFilter.SHARPEN)

        # OCR config: treat as a single column of text
        config = "--psm 6 --oem 3"
        text   = pytesseract.image_to_string(img, config=config)
        return text.strip()

    except RuntimeError:
        raise  # re-raise our own errors cleanly
    except Exception as e:
        # Catch "tesseract is not installed or it's not in your PATH" etc.
        error_msg = str(e)
        if "tesseract" in error_msg.lower() or "not found" in error_msg.lower():
            raise RuntimeError(
                "Image OCR is not available on this server — "
                "Tesseract-OCR is not installed. "
                "Please paste the article text directly or upload a PDF instead."
            ) from e
        raise RuntimeError(f"OCR failed: {e}") from e
