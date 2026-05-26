"""
Download Fighter Images
========================
Downloads fighter portrait images for fighters in our existing dataset.
Uses the UFC.com image URL pattern.

Strategy:
1. Load our existing fighter roster from ufc-ml-features.csv
2. For each unique fighter, construct the UFC.com image URL
3. Download and save to web_app/frontend/public/fighters/
"""

import os
import time
import requests
import pandas as pd
from pathlib import Path
from src.utils.logger import setup_logger

logger = setup_logger()

# UFC image URL pattern (discovered from scraping)
UFC_IMAGE_BASE = "https://ufc.com/images/styles/event_fight_card_upper_body_of_standing_athlete/s3"

def slugify(name: str) -> str:
    """Convert fighter name to URL-friendly slug."""
    return name.replace(" ", "_").replace("'", "").replace(".", "")

def get_unique_fighters() -> list[str]:
    """Extract unique fighter names from our dataset."""
    logger.info("Loading fighter names from dataset...")
    df = pd.read_csv("data/processed/ufc-ml-features.csv")
    
    red_fighters = df['R_fighter'].dropna().unique()
    blue_fighters = df['B_fighter'].dropna().unique()
    
    all_fighters = sorted(set(list(red_fighters) + list(blue_fighters)))
    logger.info(f"Found {len(all_fighters)} unique fighters in dataset")
    
    return all_fighters

def download_image(fighter_name: str, output_dir: Path) -> bool:
    """
    Attempt to download fighter image from UFC.com.
    
    Returns True if successful, False otherwise.
    """
    slug = slugify(fighter_name)
    output_path = output_dir / f"{slug}.png"
    
    # Skip if already exists
    if output_path.exists():
        return True
    
    # Try multiple UFC URL patterns
    url_patterns = [
        f"{UFC_IMAGE_BASE}/image/fighter_images/{slug}/{slug.upper()}_R.png",
        f"{UFC_IMAGE_BASE}/image/ufc-fighter-container/*/profile-galery/fullbodyright-picture/{slug.lower()}_*_RightFullBodyImage.png",
        f"https://dmxg5wxfqgb4u.cloudfront.net/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{slug}/{slug.upper()}_R.png",
    ]
    
    for url in url_patterns:
        try:
            response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
            if response.status_code == 200 and len(response.content) > 1000:  # Valid image
                output_path.write_bytes(response.content)
                logger.info(f"✓ Downloaded: {fighter_name}")
                return True
        except Exception:
            continue
    
    logger.warning(f"✗ Could not find image for: {fighter_name}")
    return False

def run():
    """Main execution."""
    output_dir = Path("web_app/frontend/public/fighters")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    fighters = get_unique_fighters()
    
    logger.info(f"Starting download of {len(fighters)} fighter images...")
    logger.info(f"Output directory: {output_dir.absolute()}")
    
    success_count = 0
    fail_count = 0
    
    for i, fighter in enumerate(fighters, 1):
        if i % 50 == 0:
            logger.info(f"Progress: {i}/{len(fighters)} ({success_count} downloaded, {fail_count} failed)")
        
        if download_image(fighter, output_dir):
            success_count += 1
        else:
            fail_count += 1
        
        time.sleep(0.2)  # Be polite
    
    logger.info(f"\n✓ Download complete!")
    logger.info(f"  Success: {success_count}")
    logger.info(f"  Failed: {fail_count}")
    logger.info(f"  Total: {len(fighters)}")

if __name__ == "__main__":
    run()
