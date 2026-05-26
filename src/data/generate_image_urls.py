"""
Generate Fighter Image URLs
============================
Instead of scraping, generate likely UFC.com image URLs based on patterns.
Then test which ones work.

UFC Image URL Pattern (discovered from scraping):
https://ufc.com/images/styles/event_fight_card_upper_body_of_standing_athlete/s3/{year-month}/LASTNAME_FIRSTNAME_R_{date}.png

Simpler fallback:
https://dmxg5wxfqgb4u.cloudfront.net/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{First_Last}/{FIRST_LAST}_R.png
"""

import pandas as pd
import requests
from pathlib import Path
from src.utils.logger import setup_logger

logger = setup_logger()

def name_to_slug(name: str) -> tuple[str, str]:
    """
    Convert 'Conor McGregor' to:
    - slug: 'Conor_McGregor'
    - upper_slug: 'MCGREGOR_CONOR'
    """
    parts = name.strip().split()
    if len(parts) < 2:
        return name.replace(" ", "_"), name.upper().replace(" ", "_")
    
    first = parts[0]
    last = " ".join(parts[1:])
    
    slug = f"{first}_{last}".replace(" ", "_").replace("'", "")
    upper_slug = f"{last.upper()}_{first.upper()}".replace(" ", "_").replace("'", "")
    
    return slug, upper_slug

def test_image_url(url: str) -> bool:
    """Test if image URL is valid (returns 200 and has content)."""
    try:
        r = requests.head(url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
        return r.status_code == 200
    except:
        return False

def generate_image_urls(fighter_name: str) -> list[str]:
    """Generate possible UFC.com image URLs for a fighter."""
    slug, upper_slug = name_to_slug(fighter_name)
    
    # Pattern 1: CloudFront CDN (most common)
    urls = [
        f"https://dmxg5wxfqgb4u.cloudfront.net/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{slug}/{upper_slug}_R.png",
        f"https://dmxg5wxfqgb4u.cloudfront.net/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{slug}/{upper_slug}_L.png",
    ]
    
    # Pattern 2: Direct UFC.com
    urls.extend([
        f"https://ufc.com/images/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{slug}/{upper_slug}_R.png",
        f"https://ufc.com/images/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{slug}/{upper_slug}_L.png",
    ])
    
    return urls

def create_image_mapping():
    """Create a mapping of fighters to their image URLs."""
    logger.info("Loading fighter roster...")
    df = pd.read_csv("data/processed/ufc-ml-features.csv")
    
    red_fighters = df['R_fighter'].dropna().unique()
    blue_fighters = df['B_fighter'].dropna().unique()
    all_fighters = sorted(set(list(red_fighters) + list(blue_fighters)))
    
    logger.info(f"Testing image URLs for {len(all_fighters)} fighters...")
    logger.info("This will take a few minutes...")
    
    mapping = []
    found_count = 0
    
    for i, fighter in enumerate(all_fighters, 1):
        if i % 100 == 0:
            logger.info(f"Progress: {i}/{len(all_fighters)} ({found_count} found)")
        
        possible_urls = generate_image_urls(fighter)
        working_url = None
        
        for url in possible_urls:
            if test_image_url(url):
                working_url = url
                found_count += 1
                break
        
        mapping.append({
            'fighter_name': fighter,
            'image_url': working_url if working_url else '',
            'has_image': working_url is not None
        })
    
    # Save
    output_path = "data/processed/fighter_image_mapping.csv"
    mapping_df = pd.DataFrame(mapping)
    mapping_df.to_csv(output_path, index=False)
    
    logger.info(f"\nMapping complete!")
    logger.info(f"  Total fighters: {len(mapping_df)}")
    logger.info(f"  With images: {found_count} ({found_count/len(mapping_df)*100:.1f}%)")
    logger.info(f"  Saved to: {output_path}")
    
    print(f"\nFighter Image Mapping Created")
    print(f"  Total: {len(mapping_df)}")
    print(f"  With images: {found_count}")
    print(f"\nSample fighters with images:")
    print(mapping_df[mapping_df['has_image']].head(10)[['fighter_name']].to_string(index=False))

if __name__ == "__main__":
    create_image_mapping()
