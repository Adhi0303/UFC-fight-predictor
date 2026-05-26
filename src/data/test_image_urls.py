"""
Test Fighter Image URLs
========================
Tests a sample of generated image URLs to see which ones actually work.
"""

import pandas as pd
import requests

def test_url(url: str) -> bool:
    """Test if URL returns a valid image."""
    try:
        r = requests.head(url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
        return r.status_code == 200
    except:
        return False

def test_sample_urls():
    """Test a sample of fighter image URLs."""
    df = pd.read_csv("data/processed/fighter_image_mapping.csv")
    
    # Test first 20 fighters
    sample = df.head(20)
    
    print("Testing sample fighter image URLs...\n")
    
    working = 0
    broken = 0
    
    for _, row in sample.iterrows():
        name = row['fighter_name']
        url = row['image_url']
        
        if test_url(url):
            print(f"OK {name}")
            working += 1
        else:
            print(f"FAIL {name}")
            print(f"  URL: {url}")
            broken += 1
    
    print(f"\nResults:")
    print(f"  Working: {working}/{len(sample)} ({working/len(sample)*100:.1f}%)")
    print(f"  Broken: {broken}/{len(sample)}")
    
    if working > 0:
        print(f"\nImage system is working! {working} images loaded successfully.")
    else:
        print(f"\nNo images loaded. Check URL pattern or UFC.com availability.")

if __name__ == "__main__":
    test_sample_urls()
