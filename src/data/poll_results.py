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

def poll_and_update():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    
    queue_path = os.path.join(project_root, "data", "processed", "queued_fights.json")
    data_path = os.path.join(project_root, "data", "processed", "ufc-cleaned.csv")
    
    if not os.path.exists(queue_path):
        logger.info("No queued_fights.json found. Nothing to poll.")
        return

    try:
        with open(queue_path, "r") as f:
            queued_events = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load queue: {e}")
        return

    if not queued_events:
        logger.info("Queue is empty.")
        return

    df = pd.read_csv(data_path)
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    updated_queue = []
    new_rows = []
    
    # We fetch current year ESPN data once
    current_year = datetime.now().year
    espn_url = f"https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?limit=100&dates={current_year}"
    try:
        espn_data = requests.get(espn_url, timeout=10).json()
        espn_events = espn_data.get("events", [])
    except Exception as e:
        logger.error(f"Failed to fetch ESPN data: {e}")
        return

    for event in queued_events:
        event_date = event.get("event_date", "")
        # If the event is in the future or today, skip it for now
        if event_date >= today_str:
            updated_queue.append(event)
            continue
            
        logger.info(f"Processing past event: {event.get('event_name')} on {event_date}")
        
        # Find this event in ESPN payload
        espn_match = None
        for ee in espn_events:
            date_str = ee.get("date", "")[:10]
            if date_str == event_date:
                # To be safe, check if the status is final
                status = ee.get("competitions", [{}])[0].get("status", {}).get("type", {}).get("name", "")
                if status == "STATUS_FINAL":
                    espn_match = ee
                    break
        
        if not espn_match:
            logger.warning(f"Could not find completed ESPN event for {event_date}. Will keep in queue.")
            updated_queue.append(event)
            continue
            
        # Extract results
        comps = espn_match.get("competitions", [])
        for comp in comps:
            competitors = comp.get("competitors", [])
            if len(competitors) != 2: continue
            
            # Identify winner and loser
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
            
            # Map back to our dataset names using the matchup list from queue
            # (In the queue, we have 'fighter_a' and 'fighter_b')
            r_fighter = None
            b_fighter = None
            for mu in event.get("matchups", []):
                q_names = [mu["fighter_a"], mu["fighter_b"]]
                w_match = process.extractOne(winner_name, q_names)
                l_match = process.extractOne(loser_name, q_names)
                if w_match and l_match and w_match[1] > 80 and l_match[1] > 80 and w_match[0] != l_match[0]:
                    # Determine red/blue based on arbitrary order for new fights
                    r_fighter = w_match[0]
                    b_fighter = l_match[0]
                    r_won = True
                    weight_class = mu.get("weight_class", "Unknown")
                    r_odds = mu.get("fighter_a_odds", -110) if mu["fighter_a"] == r_fighter else mu.get("fighter_b_odds", -110)
                    b_odds = mu.get("fighter_b_odds", -110) if mu["fighter_b"] == b_fighter else mu.get("fighter_a_odds", -110)
                    break
                    
            if not r_fighter:
                continue # Couldn't match
                
            # Method parsing from status detail (e.g. "Unofficial Winner Kotko")
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
            
            # Forward-fill stats from previous fights in df
            r_history = df[(df['R_fighter'] == r_fighter) | (df['B_fighter'] == r_fighter)]
            b_history = df[(df['R_fighter'] == b_fighter) | (df['B_fighter'] == b_fighter)]
            
            # Build a new row dictionary with default 0s
            new_row = {col: 0.0 if df[col].dtype in ['float64', 'int64'] else '' for col in df.columns}
            
            new_row['R_fighter'] = r_fighter
            new_row['B_fighter'] = b_fighter
            new_row['date'] = event_date
            new_row['location'] = espn_match.get("venue", {}).get("fullName", "Unknown")
            new_row['weight_class'] = weight_class
            new_row['Winner'] = 'Red'
            new_row['finish'] = finish
            new_row['finish_round'] = finish_round
            new_row['finish_round_time'] = finish_time
            new_row['R_odds'] = r_odds
            new_row['B_odds'] = b_odds
            
            # Forward fill stats (wins, losses, strikes, etc.) if history exists
            if not r_history.empty:
                r_latest = r_history.sort_values('date', ascending=False).iloc[0]
                pref = 'R_' if r_latest['R_fighter'] == r_fighter else 'B_'
                new_row['R_age'] = r_latest.get(f'{pref}age', 30) + 0.5 # approximate age increment
                new_row['R_Height_cms'] = r_latest.get(f'{pref}Height_cms', 175)
                new_row['R_Reach_cms'] = r_latest.get(f'{pref}Reach_cms', 175)
                new_row['R_Weight_lbs'] = r_latest.get(f'{pref}Weight_lbs', 155)
                new_row['R_wins'] = r_latest.get(f'{pref}wins', 0) + (1 if r_latest['Winner'] == ('Red' if pref == 'R_' else 'Blue') else 0)
                new_row['R_losses'] = r_latest.get(f'{pref}losses', 0) + (1 if r_latest['Winner'] != ('Red' if pref == 'R_' else 'Blue') else 0)
                new_row['R_current_win_streak'] = r_latest.get(f'{pref}current_win_streak', 0) + 1
                new_row['R_current_lose_streak'] = 0
                new_row['R_avg_SIG_STR_landed'] = r_latest.get(f'{pref}avg_SIG_STR_landed', 0)
                new_row['R_avg_SIG_STR_pct'] = r_latest.get(f'{pref}avg_SIG_STR_pct', 0)
                new_row['R_avg_TD_landed'] = r_latest.get(f'{pref}avg_TD_landed', 0)
                new_row['R_avg_TD_pct'] = r_latest.get(f'{pref}avg_TD_pct', 0)
            
            if not b_history.empty:
                b_latest = b_history.sort_values('date', ascending=False).iloc[0]
                pref = 'R_' if b_latest['R_fighter'] == b_fighter else 'B_'
                new_row['B_age'] = b_latest.get(f'{pref}age', 30) + 0.5
                new_row['B_Height_cms'] = b_latest.get(f'{pref}Height_cms', 175)
                new_row['B_Reach_cms'] = b_latest.get(f'{pref}Reach_cms', 175)
                new_row['B_Weight_lbs'] = b_latest.get(f'{pref}Weight_lbs', 155)
                new_row['B_wins'] = b_latest.get(f'{pref}wins', 0)
                new_row['B_losses'] = b_latest.get(f'{pref}losses', 0) + 1
                new_row['B_current_win_streak'] = 0
                new_row['B_current_lose_streak'] = b_latest.get(f'{pref}current_lose_streak', 0) + 1
                new_row['B_avg_SIG_STR_landed'] = b_latest.get(f'{pref}avg_SIG_STR_landed', 0)
                new_row['B_avg_SIG_STR_pct'] = b_latest.get(f'{pref}avg_SIG_STR_pct', 0)
                new_row['B_avg_TD_landed'] = b_latest.get(f'{pref}avg_TD_landed', 0)
                new_row['B_avg_TD_pct'] = b_latest.get(f'{pref}avg_TD_pct', 0)
                
            new_rows.append(new_row)
            logger.info(f"Added new result: {r_fighter} def. {b_fighter} by {finish} (Round {finish_round})")

    if new_rows:
        new_df = pd.DataFrame(new_rows)
        # Append to ufc-cleaned.csv
        combined_df = pd.concat([df, new_df], ignore_index=True)
        # Sort by date descending
        combined_df['date'] = pd.to_datetime(combined_df['date'])
        combined_df = combined_df.sort_values(by='date', ascending=False)
        combined_df.to_csv(data_path, index=False)
        logger.info(f"Appended {len(new_rows)} new fights to dataset.")
        
        # Trigger backend reload
        try:
            requests.post("http://localhost:8000/api/reload-data", timeout=5)
            logger.info("Triggered FastAPI backend data reload.")
        except Exception as e:
            logger.error(f"Could not reload FastAPI backend: {e}")

    # Save updated queue back to json
    with open(queue_path, "w") as f:
        json.dump(updated_queue, f, indent=4)
        logger.info(f"Updated queue saved. {len(updated_queue)} events remaining.")

if __name__ == "__main__":
    poll_and_update()
