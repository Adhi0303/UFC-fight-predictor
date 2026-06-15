import os
import json
import time
import requests
from datetime import datetime
import pandas as pd
from thefuzz import process
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def backfill():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    
    data_path = os.path.join(project_root, "data", "processed", "ufc-cleaned.csv")
    
    df = pd.read_csv(data_path)
    
    # We fetch current year ESPN data
    current_year = datetime.now().year
    espn_url = f"https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?limit=100&dates={current_year}"
    try:
        espn_data = requests.get(espn_url, timeout=10).json()
        espn_events = espn_data.get("events", [])
    except Exception as e:
        logger.error(f"Failed to fetch ESPN data: {e}")
        return

    # Build a list of all fighter names in our DB for matching
    roster_names = list(set(df['R_fighter'].dropna().unique().tolist() + df['B_fighter'].dropna().unique().tolist()))
    
    new_rows = []
    
    for ee in espn_events:
        status = ee.get("competitions", [{}])[0].get("status", {}).get("type", {}).get("name", "")
        if status != "STATUS_FINAL":
            continue
            
        event_date_str = ee.get("date", "")[:10]
        event_name = ee.get("name", "Unknown Event")
        
        comps = ee.get("competitions", [])
        for comp in comps:
            competitors = comp.get("competitors", [])
            if len(competitors) != 2: continue
            
            winner_c = None
            loser_c = None
            for c in competitors:
                if c.get("winner", False):
                    winner_c = c
                else:
                    loser_c = c
                    
            if not winner_c or not loser_c: continue
            
            winner_name = winner_c.get("athlete", {}).get("displayName", "")
            loser_name = loser_c.get("athlete", {}).get("displayName", "")
            
            # Fuzzy match to our database
            w_match = process.extractOne(winner_name, roster_names)
            l_match = process.extractOne(loser_name, roster_names)
            
            if w_match and l_match and w_match[1] > 80 and l_match[1] > 80:
                r_fighter = w_match[0]
                b_fighter = l_match[0]
            else:
                continue
                
            # Check if this fight is already in df
            existing = df[((df['R_fighter'] == r_fighter) & (df['B_fighter'] == b_fighter)) | 
                          ((df['R_fighter'] == b_fighter) & (df['B_fighter'] == r_fighter))]
            if not existing.empty and str(existing.iloc[0]['date'])[:10] == event_date_str:
                continue # Already in DB
                
            # Extract result
            details = comp.get("details", [])
            finish = "DEC"
            for d in details:
                t_text = d.get("type", {}).get("text", "").lower()
                if "kotko" in t_text or "ko" in t_text:
                    finish = "KO/TKO"
                elif "submission" in t_text:
                    finish = "SUB"
                    
            finish_round = comp.get("status", {}).get("period", 3)
            finish_time = comp.get("status", {}).get("displayClock", "5:00")
            weight_class_raw = comp.get("type", {}).get("abbreviation", "Unknown")
            
            # Forward fill stats
            r_history = df[(df['R_fighter'] == r_fighter) | (df['B_fighter'] == r_fighter)]
            b_history = df[(df['R_fighter'] == b_fighter) | (df['B_fighter'] == b_fighter)]
            
            new_row = {col: 0.0 if df[col].dtype in ['float64', 'int64'] else '' for col in df.columns}
            new_row['R_fighter'] = r_fighter
            new_row['B_fighter'] = b_fighter
            new_row['date'] = event_date_str
            new_row['location'] = ee.get("venue", {}).get("fullName", "Unknown")
            new_row['weight_class'] = weight_class_raw
            new_row['Winner'] = 'Red'
            new_row['finish'] = finish
            new_row['finish_round'] = finish_round
            new_row['finish_round_time'] = finish_time
            new_row['R_odds'] = -110 # We don't have odds for backfill easily
            new_row['B_odds'] = -110
            
            if not r_history.empty:
                r_latest = r_history.sort_values('date', ascending=False).iloc[0]
                pref = 'R_' if r_latest['R_fighter'] == r_fighter else 'B_'
                for col in df.columns:
                    if col.startswith('R_') and col != 'R_fighter' and col != 'R_odds':
                        mapped_col = col.replace('R_', pref, 1)
                        if mapped_col in r_latest and pd.notna(r_latest[mapped_col]):
                            new_row[col] = r_latest[mapped_col]
                
                # Explicit updates
                prev_won = r_latest.get('Winner') == ('Red' if pref == 'R_' else 'Blue')
                new_row['R_wins'] = r_latest.get(f'{pref}wins', 0) + (1 if prev_won else 0)
                new_row['R_losses'] = r_latest.get(f'{pref}losses', 0) + (0 if prev_won else 1)
                new_row['R_current_win_streak'] = (r_latest.get(f'{pref}current_win_streak', 0) + 1) if prev_won else 0
                new_row['R_current_lose_streak'] = 0 if prev_won else (r_latest.get(f'{pref}current_lose_streak', 0) + 1)
            
            if not b_history.empty:
                b_latest = b_history.sort_values('date', ascending=False).iloc[0]
                pref = 'R_' if b_latest['R_fighter'] == b_fighter else 'B_'
                for col in df.columns:
                    if col.startswith('B_') and col != 'B_fighter' and col != 'B_odds':
                        mapped_col = col.replace('B_', pref, 1)
                        if mapped_col in b_latest and pd.notna(b_latest[mapped_col]):
                            new_row[col] = b_latest[mapped_col]
                
                # Explicit updates
                prev_won = b_latest.get('Winner') == ('Red' if pref == 'R_' else 'Blue')
                new_row['B_wins'] = b_latest.get(f'{pref}wins', 0) + (1 if prev_won else 0)
                new_row['B_losses'] = b_latest.get(f'{pref}losses', 0) + (0 if prev_won else 1)
                new_row['B_current_win_streak'] = (b_latest.get(f'{pref}current_win_streak', 0) + 1) if prev_won else 0
                new_row['B_current_lose_streak'] = 0 if prev_won else (b_latest.get(f'{pref}current_lose_streak', 0) + 1)
                
            new_rows.append(new_row)
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            logger.info(f"Backfilled: {r_fighter} def. {b_fighter} at {event_name}")

    if new_rows:
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(by='date', ascending=False)
        df.to_csv(data_path, index=False)
        logger.info(f"Appended {len(new_rows)} backfilled fights to dataset.")
        
        try:
            requests.post("http://localhost:8000/api/reload-data", timeout=5)
            logger.info("Triggered FastAPI backend data reload.")
        except Exception as e:
            logger.error(f"Could not reload FastAPI backend: {e}")

if __name__ == "__main__":
    backfill()
