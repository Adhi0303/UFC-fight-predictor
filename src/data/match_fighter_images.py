"""
Match Fighter Images to Roster
===============================
Since the full scraper worked earlier (got 2,544 fighters), let's use a hybrid approach:
1. Use the scraped fighter_images.csv if it exists
2. Match those to our roster
3. Create a clean mapping file for the frontend
"""

import pandas as pd
from pathlib import Path
from src.utils.logger import setup_logger

logger = setup_logger()

def fuzzy_match_name(name1: str, name2: str) -> float:
    """Simple fuzzy matching score (0-1)."""
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    if n1 == n2:
        return 1.0
    
    # Check if one contains the other
    if n1 in n2 or n2 in n1:
        return 0.9
    
    # Check word overlap
    words1 = set(n1.split())
    words2 = set(n2.split())
    overlap = len(words1 & words2)
    total = len(words1 | words2)
    
    return overlap / total if total > 0 else 0.0

def match_fighters():
    """Match scraped images to our roster."""
    
    # Load our roster
    logger.info("Loading fighter roster from dataset...")
    df = pd.read_csv("data/processed/ufc-ml-features.csv")
    red_fighters = df['R_fighter'].dropna().unique()
    blue_fighters = df['B_fighter'].dropna().unique()
    our_fighters = sorted(set(list(red_fighters) + list(blue_fighters)))
    logger.info(f"Our roster: {len(our_fighters)} fighters")
    
    # Check if we have scraped data
    scraped_path = Path("data/raw/external/fighter_images.csv")
    
    if not scraped_path.exists():
        logger.warning("No scraped data found. Run scraper first!")
        logger.info("Creating placeholder mapping...")
        
        # Create placeholder with no images
        mapping = pd.DataFrame({
            'fighter_name': our_fighters,
            'image_url': [''] * len(our_fighters),
            'has_image': [False] * len(our_fighters)
        })
    else:
        logger.info(f"Loading scraped images from {scraped_path}...")
        scraped_df = pd.read_csv(scraped_path)
        logger.info(f"Scraped data: {len(scraped_df)} fighters with images")
        
        # Match fighters
        mapping_data = []
        matched_count = 0
        
        for fighter in our_fighters:
            best_match = None
            best_score = 0.0
            
            for _, row in scraped_df.iterrows():
                score = fuzzy_match_name(fighter, row['fighter_name'])
                if score > best_score:
                    best_score = score
                    best_match = row
            
            if best_score >= 0.85:  # Good match threshold
                mapping_data.append({
                    'fighter_name': fighter,
                    'image_url': best_match['image_url'],
                    'has_image': True,
                    'match_score': best_score
                })
                matched_count += 1
            else:
                mapping_data.append({
                    'fighter_name': fighter,
                    'image_url': '',
                    'has_image': False,
                    'match_score': 0.0
                })
        
        mapping = pd.DataFrame(mapping_data)
        logger.info(f"Matched {matched_count}/{len(our_fighters)} fighters ({matched_count/len(our_fighters)*100:.1f}%)")
    
    # Save mapping
    output_path = "data/processed/fighter_image_mapping.csv"
    mapping.to_csv(output_path, index=False)
    logger.info(f"Saved mapping to {output_path}")
    
    # Print summary
    print(f"\nFighter Image Mapping Created")
    print(f"  Total fighters: {len(mapping)}")
    print(f"  With images: {mapping['has_image'].sum()}")
    print(f"  Without images: {(~mapping['has_image']).sum()}")
    print(f"\nSample matches:")
    print(mapping[mapping['has_image']].head(10)[['fighter_name', 'has_image']].to_string(index=False))

if __name__ == "__main__":
    match_fighters()
