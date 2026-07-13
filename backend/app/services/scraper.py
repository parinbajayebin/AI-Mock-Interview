
import re
import logging
import asyncio
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Tags that are almost always noise on career pages
_NOISE_TAGS = {"script", "style", "noscript", "header", "footer", "nav", "aside", "meta", "link"}

# CSS selectors that commonly contain the actual job content across popular ATS platforms
_JD_SELECTORS = [
    # Lever
    "[class*='posting-description']",
    "[class*='posting-requirements']",
    # Greenhouse
    "#content",
    "[class*='job-description']",
    # Workday
    "[data-automation-id='jobPostingDescription']",
    # LinkedIn
    "[class*='description__text']",
    "[class*='show-more-less-html']",
    # Generic
    "article",
    "main",
    "[class*='job-detail']",
    "[class*='job-post']",
    "[class*='jd-']",
    "[id*='job-description']",
    "[id*='job_description']",
]

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _clean_text(text: str) -> str:
    """Normalize whitespace and strip boilerplate noise from extracted text."""
    # Collapse multiple newlines/spaces
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Remove zero-width chars
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    return text.strip()


def _extract_from_soup(soup: BeautifulSoup) -> str:
    """Try targeted selectors first, then fall back to body text."""
    # Remove noise tags globally
    for tag in soup(_NOISE_TAGS):
        tag.decompose()

    # 1. Try each known ATS selector
    for selector in _JD_SELECTORS:
        elements = soup.select(selector)
        if elements:
            combined = "\n".join(el.get_text(separator="\n") for el in elements)
            cleaned = _clean_text(combined)
            if len(cleaned) > 200:  # sanity check — must have real content
                return cleaned

    # 2. Fall back to <body> text
    body = soup.find("body")
    if body:
        return _clean_text(body.get_text(separator="\n"))

    return _clean_text(soup.get_text(separator="\n"))


async def scrape_job_description(url: str) -> dict:
    """
    Fetches a job posting URL and returns structured text.

    Returns:
        {
            "success": bool,
            "url": str,
            "text": str,          # Clean job description text
            "char_count": int,
            "error": str | None
        }
    """
    if not url or not url.startswith(("http://", "https://")):
        return {
            "success": False,
            "url": url,
            "text": "",
            "char_count": 0,
            "error": "Invalid URL. Please provide a full URL starting with http:// or https://"
        }

    try:
        async with httpx.AsyncClient(
            headers=_HEADERS,
            follow_redirects=True,
            timeout=15.0
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        html = response.text
        soup = BeautifulSoup(html, "html.parser")
        text = _extract_from_soup(soup)

        if len(text) < 100:
            return {
                "success": False,
                "url": url,
                "text": "",
                "char_count": 0,
                "error": (
                    "Could not extract meaningful job description from this URL. "
                    "The page may require JavaScript (e.g. some LinkedIn pages). "
                    "Try pasting the job description text directly instead."
                )
            }

        # Truncate to keep LLM context reasonable (max ~6000 chars ≈ 1500 tokens)
        if len(text) > 6000:
            text = text[:6000] + "\n\n[Truncated for analysis]"

        logger.info(f"[SCRAPER] Successfully scraped {url} — {len(text)} chars extracted.")
        return {
            "success": True,
            "url": url,
            "text": text,
            "char_count": len(text),
            "error": None
        }

    except httpx.HTTPStatusError as e:
        logger.warning(f"[SCRAPER] HTTP error for {url}: {e.response.status_code}")
        return {
            "success": False,
            "url": url,
            "text": "",
            "char_count": 0,
            "error": f"HTTP {e.response.status_code}: Unable to fetch that page. It may require login or be blocked."
        }
    except httpx.TimeoutException:
        return {
            "success": False,
            "url": url,
            "text": "",
            "char_count": 0,
            "error": "Request timed out. The career page took too long to respond."
        }
    except Exception as e:
        logger.exception(f"[SCRAPER] Unexpected error for {url}")
        return {
            "success": False,
            "url": url,
            "text": "",
            "char_count": 0,
            "error": f"Unexpected error: {str(e)}"
        }


# Additional selectors to find company product / about info
_COMPANY_SELECTORS = [
    "[class*='product']",
    "[class*='about']",
    "[class*='solution']",
    "[class*='feature']",
    "[class*='service']",
    "[class*='platform']",
    "[class*='hero']",
    "[class*='overview']",
    "main",
    "article",
]


async def scrape_company_homepage(url: str) -> dict:
    """
    Scrapes a company's main website (homepage, /about, /products pages)
    to extract background context: company name, products, tech stack, mission.

    Returns:
        {
            "success": bool,
            "url": str,
            "text": str,        # Clean extracted company context
            "char_count": int,
            "error": str | None
        }
    """
    if not url or not url.startswith(("http://", "https://")):
        return {
            "success": False,
            "url": url,
            "text": "",
            "char_count": 0,
            "error": "Invalid URL. Please provide a full URL starting with http:// or https://"
        }

    # Try fetching homepage, /about, and /products to get richer context
    pages_to_try = [url]
    base = url.rstrip("/")
    for path in ["/about", "/about-us", "/products", "/platform", "/solutions"]:
        pages_to_try.append(base + path)

    combined_text = ""

    async with httpx.AsyncClient(
        headers=_HEADERS,
        follow_redirects=True,
        timeout=12.0
    ) as client:
        for page_url in pages_to_try[:3]:  # max 3 pages to stay fast
            try:
                response = await client.get(page_url)
                if response.status_code != 200:
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                for tag in soup(_NOISE_TAGS):
                    tag.decompose()

                # Try targeted selectors first
                extracted = ""
                for selector in _COMPANY_SELECTORS:
                    elements = soup.select(selector)
                    if elements:
                        extracted = "\n".join(el.get_text(separator="\n") for el in elements[:3])
                        extracted = _clean_text(extracted)
                        if len(extracted) > 150:
                            break

                if not extracted:
                    body = soup.find("body")
                    extracted = _clean_text(body.get_text(separator="\n")) if body else ""

                if extracted:
                    combined_text += f"\n\n--- From: {page_url} ---\n{extracted[:2000]}"

            except Exception:
                continue  # Silently skip unavailable sub-pages

    combined_text = _clean_text(combined_text)

    if len(combined_text) < 100:
        return {
            "success": False,
            "url": url,
            "text": "",
            "char_count": 0,
            "error": (
                "Could not extract meaningful company information from this URL. "
                "The page may be JavaScript-rendered. Try the company's /about page directly."
            )
        }

    # Cap at 5000 chars to keep LLM context manageable
    if len(combined_text) > 5000:
        combined_text = combined_text[:5000] + "\n\n[Truncated]"

    logger.info(f"[SCRAPER] Company homepage scraped: {url} — {len(combined_text)} chars")
    return {
        "success": True,
        "url": url,
        "text": combined_text,
        "char_count": len(combined_text),
        "error": None
    }

