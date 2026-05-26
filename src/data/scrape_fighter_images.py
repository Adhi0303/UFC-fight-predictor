"""
UFC Fighter Image Scraper
=========================
Scrapes fighter names + portrait image URLs from ufc.com/athletes/all
using the Drupal Views AJAX endpoint (same API the browser uses for pagination).

Output: data/raw/external/fighter_images.csv
Columns: fighter_name, image_url
"""

import time
import requests
import pandas as pd
from bs4 import BeautifulSoup
from src.utils.logger import setup_logger

logger = setup_logger()

BASE_URL = "https://www.ufc.com"
AJAX_URL = "https://www.ufc.com/views/ajax?_wrapper_format=drupal_ajax"
OUTPUT_PATH = "data/raw/external/fighter_images.csv"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.ufc.com/athletes/all",
}

# Drupal Views AJAX payload — mirrors what the browser sends on scroll/page
BASE_PAYLOAD = {
    "view_name": "all_athletes",
    "view_display_id": "page",
    "view_args": "",
    "view_path": "/athletes/all",
    "view_base_path": "",
    "pager_element": "0",
}


def get_dom_id() -> str:
    """Fetch page 0 to extract the dynamic Drupal view DOM ID."""
    logger.info("Fetching page 0 to extract Drupal view DOM ID...")
    r = requests.get(f"{BASE_URL}/athletes/all", headers=HEADERS, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    # The DOM ID is embedded in the view container class
    view_div = soup.find("div", class_=lambda c: c and "js-view-dom-id-" in c)
    if not view_div:
        raise RuntimeError("Could not find Drupal view DOM ID on page.")

    for cls in view_div.get("class", []):
        if cls.startswith("js-view-dom-id-"):
            dom_id = cls.replace("js-view-dom-id-", "")
            logger.info(f"Found DOM ID: {dom_id[:20]}...")
            return dom_id

    raise RuntimeError("DOM ID class found but could not parse value.")


def parse_fighters_from_html(html: str) -> tuple[int, list[dict]]:
    """
    Parse fighter name + image URL from a chunk of UFC athlete card HTML.
    Returns: (total_cards_found, list_of_valid_fighters)
    """
    soup = BeautifulSoup(html, "lxml")
    fighters = []
    cards = soup.find_all("div", class_="c-listing-athlete-flipcard__inner")
    
    for card in cards:
        back = card.find("div", class_="c-listing-athlete-flipcard__back")
        if not back:
            continue

        name_tag = back.find("span", class_="c-listing-athlete__name")
        if not name_tag:
            continue
        name = name_tag.get_text(separator=" ", strip=True)
        if not name:
            continue

        bgimg_div = back.find("div", class_="c-listing-athlete__bgimg")
        img_tag = bgimg_div.find("img") if bgimg_div else None
        image_url = img_tag.get("src", "") if img_tag else ""

        if not image_url or "no-profile-image" in image_url:
            continue

        if image_url.startswith("/"):
            image_url = BASE_URL + image_url

        # The URLs often have query params like ?itok=... which are fine, but if we want clean URLs we could strip them.
        # However, Drupal S3 URLs sometimes require them. We will keep the exact URL.
        fighters.append({"fighter_name": name, "image_url": image_url})

    return len(cards), fighters


def scrape_all_fighters(delay: float = 0.5, limit: int = 5000) -> pd.DataFrame:
    """
    Iterates through all pages using standard GET pagination.
    """
    all_fighters = []
    page = 0

    while len(all_fighters) < limit:
        logger.info(f"Scraping page {page}...")
        url = f"{BASE_URL}/athletes/all?page={page}"
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=15)
            response.raise_for_status()
        except Exception as e:
            logger.warning(f"Request failed on page {page}: {e}. Stopping.")
            break

        html_chunk = response.text
        if not html_chunk:
            logger.info(f"No HTML content on page {page}. Stopping.")
            break

        total_cards, fighters_on_page = parse_fighters_from_html(html_chunk)

        if total_cards == 0:
            logger.info(f"No cards found on page {page}. Reached end of roster.")
            break

        all_fighters.extend(fighters_on_page)
        logger.info(f"  -> Found {len(fighters_on_page)} images out of {total_cards} cards (total so far: {len(all_fighters)})")

        page += 1
        time.sleep(delay)

    # Use dict.fromkeys to drop duplicates while preserving order
    # (Because some fighters might be listed twice on UFC.com)
    unique_fighters = []
    seen = set()
    for f in all_fighters:
        if f["fighter_name"] not in seen:
            seen.add(f["fighter_name"])
            unique_fighters.append(f)

    # Cut to limit
    unique_fighters = unique_fighters[:limit]
    
    df = pd.DataFrame(unique_fighters)
    logger.info(f"Scraping complete. Total unique fighters with images: {len(df)}")
    return df


def run():
    import os
    os.makedirs("data/raw/external", exist_ok=True)

    df = scrape_all_fighters(delay=0.5)

    df.to_csv(OUTPUT_PATH, index=False)
    logger.info(f"Saved to {OUTPUT_PATH}")

    print(f"\nScraped {len(df)} fighters with images.")
    print(df.head(10).to_string(index=False))


if __name__ == "__main__":
    run()
