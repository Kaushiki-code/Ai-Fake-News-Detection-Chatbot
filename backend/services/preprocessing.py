"""
services/preprocessing.py — Text Cleaning & URL Scraping
"""

import re
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse


URL_PATTERN = re.compile(
    r'^https?://'
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
    r'localhost|'
    r'\d{1,3}(?:\.\d{1,3}){3})'
    r'(?::\d+)?(?:/?|[/?]\S+)$',
    re.IGNORECASE,
)

# Well-known credible news sources — used to inform the AI
CREDIBLE_SOURCES = {
    "indianexpress.com", "thehindu.com", "hindustantimes.com",
    "ndtv.com", "timesofindia.indiatimes.com", "livemint.com",
    "businessstandard.com", "financialexpress.com", "deccanherald.com",
    "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com",
    "theguardian.com", "nytimes.com", "washingtonpost.com",
    "bloomberg.com", "forbes.com", "economist.com",
    "ani.in", "pti.in", "theprint.in", "scroll.in", "thewire.in",
    "firstpost.com", "news18.com", "abplive.com", "zeenews.india.com",
}


def is_url(text: str) -> bool:
    return bool(URL_PATTERN.match(text.strip()))


def get_source_domain(url: str) -> str:
    """Extract root domain from URL (e.g. 'indianexpress.com')."""
    try:
        parsed = urlparse(url.strip())
        domain = parsed.netloc.lower()
        # Strip www.
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def is_credible_source(domain: str) -> bool:
    return domain in CREDIBLE_SOURCES


async def fetch_url_text(url: str) -> tuple[str, str]:
    """
    Fetch and parse text content from a web URL.
    Returns (extracted_text, source_domain).
    Uses a real browser User-Agent to bypass basic bot-blocking.
    """
    domain = get_source_domain(url)

    headers = {
        # Mimic a real Chrome browser to bypass basic paywalls/bot detection
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noisy tags
    for tag in soup(["script", "style", "nav", "footer", "aside", "form",
                     "header", "noscript", "iframe", "button", "figure"]):
        tag.decompose()

    # Try to find the main article body with more selectors
    article = (
        soup.find("article") or
        soup.find("div", class_=re.compile(r"article[-_]?(body|content|text)", re.I)) or
        soup.find("div", class_=re.compile(r"story[-_]?(body|content|text)", re.I)) or
        soup.find("div", {"itemprop": "articleBody"}) or
        soup.find("main") or
        soup.body
    )

    raw = article.get_text(separator="\n") if article else soup.get_text()
    cleaned = _clean(raw)

    # Try to also grab title + description for extra context
    title = ""
    desc = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text().strip()
    meta_desc = soup.find("meta", attrs={"name": "description"}) or \
                soup.find("meta", attrs={"property": "og:description"})
    if meta_desc and meta_desc.get("content"):
        desc = meta_desc["content"].strip()

    # Prepend title/description so AI has context even if body is paywalled
    extra = ""
    if title:
        extra += f"Article Title: {title}\n"
    if desc:
        extra += f"Article Description: {desc}\n"
    if extra:
        cleaned = extra + "\n" + cleaned

    return cleaned, domain


def _clean(text: str) -> str:
    """Normalize and clean text."""
    # Collapse excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\r', '', text)

    # Remove URLs embedded in text
    text = re.sub(r'https?://\S+', '[URL]', text)

    # Remove common boilerplate phrases
    boilerplate = [
        r'subscribe (now|today)', r'sign up for (our )?newsletter',
        r'cookie policy', r'privacy policy', r'terms of (service|use)',
        r'all rights reserved', r'copyright \d{4}',
        r'read more:', r'also read:', r'follow us on',
    ]
    for pattern in boilerplate:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    return text.strip()


async def preprocess(raw: str) -> tuple[str, str]:
    """
    Main entry point.
    Returns (cleaned_text, source_domain).
    - If raw is a URL, scrape and extract article text.
    - Otherwise, clean and return the raw text with empty domain.
    """
    if is_url(raw):
        try:
            return await fetch_url_text(raw)
        except Exception:
            return "", ""
    return _clean(raw), ""
