"""
Generate Fighter Image URLs (Fast Version)
===========================================
Generate UFC.com image URLs for all fighters.
The frontend will handle 404s gracefully with fallback silhouettes.
"""

import pandas as pd
from src.utils.logger import setup_logger

logger = setup_logger()

def name_to_url(name: str) -> str:
    """
    Convert 'Conor McGregor' to UFC.com image URL.
    Pattern: https://dmxg5wxfqgb4u.cloudfront.net/.../MCGREGOR_CONOR_R.png
    """
    parts = name.strip().split()
    if len(parts) < 2:
        slug = name.replace(" ", "_").replace("'", "")
        upper_slug = name.upper().replace(" ", "_").replace("'", "")
    else:
        first = parts[0]
        last = " ".join(parts[1:])
        slug = f"{first}_{last}".replace(" ", "_").replace("'", "")
        upper_slug = f"{last.upper()}_{first.upper()}".replace(" ", "_").replace("'", "")
    
    return f"https://dmxg5wxfqgb4u.cloudfront.net/styles/event_fight_card_upper_body_of_standing_athlete/s3/image/fighter_images/{slug}/{upper_slug}_R.png"

def create_mapping():
    """Create fighter -> image URL mapping."""
    logger.info("Loading fighter roster...")
    df = pd.read_csv("data/processed/ufc-ml-features.csv")
    
    red_fighters = df['R_fighter'].dropna().unique()
    blue_fighters = df['B_fighter'].dropna().unique()
    all_fighters = sorted(set(list(red_fighters) + list(blue_fighters)))
    
    logger.info(f"Generating image URLs for {len(all_fighters)} fighters...")
    
    mapping = pd.DataFrame({
        'fighter_name': all_fighters,
        'image_url': [name_to_url(f) for f in all_fighters]
    })
    
    output_path = "data/processed/fighter_image_mapping.csv"
    mapping.to_csv(output_path, index=False)
    
    logger.info(f"Saved mapping to {output_path}")
    
    print(f"\nFighter Image Mapping Created")
    print(f"  Total fighters: {len(mapping)}")
    print(f"\nSample URLs:")
    for _, row in mapping.head(5).iterrows():
        print(f"  {row['fighter_name']}: {row['image_url'][:70]}...")

if __name__ == "__main__":
    create_mapping()
