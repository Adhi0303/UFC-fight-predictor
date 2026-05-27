from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import sys
import os
import math
import httpx
import asyncio
from datetime import datetime
from thefuzz import process
from dotenv import load_dotenv

load_dotenv()

# Add the project root to sys.path so we can import from src
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, project_root)

from src.models.simulator import run_monte_carlo, FighterProfile
from src.models.xgboost_predictor import predict_win_probability

app = FastAPI(title="Octagon AI — UFC Fight Predictor API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data once at startup
df = pd.DataFrame()
roster_data = []
image_mapping = {}

@app.on_event("startup")
def load_data():
    global df, roster_data, image_mapping
    data_path = os.path.join(project_root, "data", "processed", "ufc-cleaned.csv")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)

        # Load fighter image mapping (processed ones if any)
        image_mapping_path = os.path.join(project_root, "data", "processed", "fighter_image_mapping.csv")
        if os.path.exists(image_mapping_path):
            img_df = pd.read_csv(image_mapping_path)
            image_mapping.update(dict(zip(img_df['fighter_name'], img_df['image_url'])))
            
        # Also load the newly scraped images, overriding the generic ones
        scraped_images_path = os.path.join(project_root, "data", "raw", "external", "fighter_images.csv")
        if os.path.exists(scraped_images_path):
            scraped_df = pd.read_csv(scraped_images_path)
            image_mapping.update(dict(zip(scraped_df['fighter_name'], scraped_df['image_url'])))

        # Build detailed roster
        temp = pd.concat([
            df[['R_fighter', 'weight_class']].rename(columns={'R_fighter': 'name'}),
            df[['B_fighter', 'weight_class']].rename(columns={'B_fighter': 'name'})
        ]).dropna(subset=['name', 'weight_class'])

        grouped = temp.groupby('name')['weight_class'].unique().reset_index()
        grouped['weight_classes'] = grouped['weight_class'].apply(list)
        grouped = grouped.drop(columns=['weight_class'])
        
        # Add image URLs
        grouped['image_url'] = grouped['name'].map(image_mapping).fillna('')
        
        roster_data = grouped.to_dict(orient='records')
    else:
        print(f"Warning: Data file not found at {data_path}")


class PredictRequest(BaseModel):
    R_fighter: str
    B_fighter: str
    R_odds: float = -110
    B_odds: float = -110
    rounds: int = 3
    bout_weight_class: Optional[str] = None


# ─── ROSTER ───────────────────────────────────────────────────
@app.get("/api/fighters")
def get_fighters(weight_class: Optional[str] = Query(None)):
    if not roster_data:
        return {"fighters": []}

    if weight_class and weight_class != "All Classes":
        filtered = [f for f in roster_data if weight_class in f.get("weight_classes", [])]
        return {"fighters": filtered}

    return {"fighters": roster_data}


# ─── INDIVIDUAL FIGHTER STATS (legacy) ────────────────────────
@app.get("/api/fighters/{name}")
def get_fighter_stats(name: str):
    if df.empty:
        raise HTTPException(status_code=404, detail="Data not loaded")

    try:
        profile = FighterProfile(name, df)
        return {
            "name": profile.name,
            "wins": profile.total_wins,
            "losses": profile.total_losses,
            "ko_wins": profile.ko_wins,
            "sub_wins": profile.sub_wins,
            "dec_wins": profile.dec_wins,
            "slpm": profile.slpm,
            "td_rate": profile.td_rate,
            "reach": profile.sig_str_pct
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Fighter {name} not found: {str(e)}")


# ─── FULL FIGHTER PROFILE ────────────────────────────────────
@app.get("/api/fighters/{name}/profile")
def get_fighter_profile(name: str):
    if df.empty:
        raise HTTPException(status_code=404, detail="Data not loaded")

    r_fights = df[df['R_fighter'] == name].copy()
    b_fights = df[df['B_fighter'] == name].copy()

    if len(r_fights) + len(b_fights) == 0:
        raise HTTPException(status_code=404, detail=f"Fighter '{name}' not found in dataset")

    # Get the most recent fight to extract physical stats
    all_fights = []
    for _, row in r_fights.iterrows():
        all_fights.append(('R', row))
    for _, row in b_fights.iterrows():
        all_fights.append(('B', row))

    all_fights.sort(key=lambda x: x[1].get('date', ''), reverse=True)
    latest_side, latest = all_fights[0]
    prefix = latest_side + '_'

    # Physical
    height_cm = _safe_float(latest.get(f'{prefix}Height_cms'))
    reach_cm = _safe_float(latest.get(f'{prefix}Reach_cms'))
    weight_lbs = _safe_float(latest.get(f'{prefix}Weight_lbs'))
    stance = latest.get(f'{prefix}Stance', '—')
    age = _safe_int(latest.get(f'{prefix}age'))

    # Record
    wins = _safe_int(latest.get(f'{prefix}wins'))
    losses = _safe_int(latest.get(f'{prefix}losses'))
    draws = _safe_int(latest.get(f'{prefix}draw'))

    # Win methods
    ko_wins = _safe_int(latest.get(f'{prefix}win_by_KO/TKO'))
    sub_wins = _safe_int(latest.get(f'{prefix}win_by_Submission'))
    dec_unanimous = _safe_int(latest.get(f'{prefix}win_by_Decision_Unanimous'))
    dec_split = _safe_int(latest.get(f'{prefix}win_by_Decision_Split'))
    dec_majority = _safe_int(latest.get(f'{prefix}win_by_Decision_Majority'))
    tko_doc = _safe_int(latest.get(f'{prefix}win_by_TKO_Doctor_Stoppage'))

    # Streaks
    current_win_streak = _safe_int(latest.get(f'{prefix}current_win_streak'))
    current_lose_streak = _safe_int(latest.get(f'{prefix}current_lose_streak'))
    longest_win_streak = _safe_int(latest.get(f'{prefix}longest_win_streak'))

    # Career
    total_rounds = _safe_int(latest.get(f'{prefix}total_rounds_fought'))
    title_bouts = _safe_int(latest.get(f'{prefix}total_title_bouts'))

    # Striking & Grappling
    slpm = _safe_float(latest.get(f'{prefix}avg_SIG_STR_landed'))
    sig_str_pct = _safe_float(latest.get(f'{prefix}avg_SIG_STR_pct'))
    td_landed = _safe_float(latest.get(f'{prefix}avg_TD_landed'))
    td_pct = _safe_float(latest.get(f'{prefix}avg_TD_pct'))
    sub_att = _safe_float(latest.get(f'{prefix}avg_SUB_ATT'))

    # Weight classes
    weight_classes = list(set(
        list(r_fights['weight_class'].dropna().unique()) +
        list(b_fights['weight_class'].dropna().unique())
    ))

    # Calculate average fight time
    fight_times = []
    for _, row in all_fights:
        t = row.get('total_fight_time_secs')
        if pd.notna(t):
            try:
                fight_times.append(float(t))
            except ValueError:
                pass

    if fight_times:
        avg_s = sum(fight_times) / len(fight_times)
        avg_fight_time = f"{int(avg_s // 60)}:{int(avg_s % 60):02d}"
    else:
        avg_s = 0
        avg_fight_time = "0:00"

    # --- SYNTHESIZE OCTAGON METRICS (0-100) ---
    total_fights = max(wins + losses + draws, 1)
    
    striking_score = min(100.0, (slpm / 7.0 * 50.0) + (sig_str_pct * 50.0))
    grappling_score = min(100.0, (td_pct * 50.0) + (td_landed / 5.0 * 30.0) + (sub_att / 2.0 * 20.0))
    
    # Cardio: based on average fight time (up to 15 min / 900s) and total rounds fought
    cardio_score = min(100.0, (avg_s / 900.0 * 60.0) + (min(total_rounds, 50) / 50.0 * 40.0))
    
    # Defense: win rate + decision rate
    win_rate = wins / total_fights
    defense_score = min(100.0, (win_rate * 70.0) + ((dec_unanimous + dec_split + dec_majority) / max(wins, 1) * 30.0))
    
    # Experience: caps out around 25 fights, boosted by title bouts
    exp_score = min(100.0, (total_fights * 3.5) + (title_bouts * 5.0))
    
    overall_rating = int((striking_score + grappling_score + cardio_score + defense_score + exp_score) / 5)

    return {
        "name": name,
        "image_url": image_mapping.get(name, ""),
        "height_cm": height_cm,
        "reach_cm": reach_cm,
        "weight_lbs": weight_lbs,
        "stance": stance if isinstance(stance, str) else "—",
        "age": age,
        "record": {"wins": wins, "losses": losses, "draws": draws},
        "win_methods": {
            "ko": ko_wins,
            "sub": sub_wins,
            "dec_unanimous": dec_unanimous,
            "dec_split": dec_split,
            "dec_majority": dec_majority,
            "tko_doc": tko_doc
        },
        "streaks": {
            "current_win": current_win_streak,
            "current_lose": current_lose_streak,
            "longest_win": longest_win_streak
        },
        "career": {
            "total_rounds": total_rounds,
            "title_bouts": title_bouts,
            "avg_fight_time": avg_fight_time
        },
        "striking": {
            "slpm": slpm,
            "sig_str_pct": sig_str_pct
        },
        "grappling": {
            "td_landed": td_landed,
            "td_pct": td_pct,
            "sub_att": sub_att
        },
        "weight_classes": weight_classes,
        "octagon_metrics": {
            "striking": int(striking_score),
            "grappling": int(grappling_score),
            "cardio": int(cardio_score),
            "defense": int(defense_score),
            "experience": int(exp_score),
            "overall": overall_rating
        }
    }

def _safe_str(val, default=''):
    try:
        if pd.isna(val) or val is None:
            return default
        s = str(val)
        if s.lower() == 'nan':
            return default
        return s
    except Exception:
        return default

# ─── FIGHT HISTORY ───────────────────────────────────────────
@app.get("/api/fighters/{name}/history")
def get_fighter_history(name: str):
    if df.empty:
        raise HTTPException(status_code=404, detail="Data not loaded")

    fights = []

    # Fights as Red corner
    r_fights = df[df['R_fighter'] == name]
    for _, row in r_fights.iterrows():
        won = row.get('Winner') == 'Red'
        opponent_name = _safe_str(row.get('B_fighter'), '—')
        fights.append({
            "date": _safe_str(row.get('date')),
            "opponent": opponent_name,
            "opponent_image_url": image_mapping.get(opponent_name, ""),
            "result": "Win" if won else "Loss",
            "method": _safe_str(row.get('finish'), '—'),
            "method_detail": _safe_str(row.get('finish_details')),
            "round": _safe_int(row.get('finish_round')),
            "round_time": _safe_str(row.get('finish_round_time')),
            "weight_class": _safe_str(row.get('weight_class'), '—'),
            "location": _safe_str(row.get('location')),
            "title_bout": bool(row.get('title_bout', False)),
            "fighter_odds": _safe_float(row.get('R_odds')),
            "opponent_odds": _safe_float(row.get('B_odds'))
        })

    # Fights as Blue corner
    b_fights = df[df['B_fighter'] == name]
    for _, row in b_fights.iterrows():
        won = row.get('Winner') == 'Blue'
        opponent_name = _safe_str(row.get('R_fighter'), '—')
        fights.append({
            "date": _safe_str(row.get('date')),
            "opponent": opponent_name,
            "opponent_image_url": image_mapping.get(opponent_name, ""),
            "result": "Win" if won else "Loss",
            "method": _safe_str(row.get('finish'), '—'),
            "method_detail": _safe_str(row.get('finish_details')),
            "round": _safe_int(row.get('finish_round')),
            "round_time": _safe_str(row.get('finish_round_time')),
            "weight_class": _safe_str(row.get('weight_class'), '—'),
            "location": _safe_str(row.get('location')),
            "title_bout": bool(row.get('title_bout', False)),
            "fighter_odds": _safe_float(row.get('B_odds')),
            "opponent_odds": _safe_float(row.get('R_odds'))
        })

    # Sort by date descending
    fights.sort(key=lambda x: x['date'], reverse=True)

    return {"fights": fights}


# ─── PREDICTION ──────────────────────────────────────────────
def odds_to_prob(odds: float) -> float:
    if odds < 0:
        return abs(odds) / (abs(odds) + 100)
    else:
        return 100 / (odds + 100)


@app.post("/api/predict")
def predict_fight(req: PredictRequest):
    if df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")

    # --- Step 1: Get XGBoost model prediction ---
    xgb_result = predict_win_probability(
        r_name=req.R_fighter,
        b_name=req.B_fighter,
        df=df,
        r_odds=req.R_odds,
        b_odds=req.B_odds,
        rounds=req.rounds,
        weight_class=req.bout_weight_class
    )
    p_xgb = xgb_result.get("p_Red")  # Probability Red wins from XGBoost

    # --- Step 2: Get odds-implied probability ---
    r_implied = odds_to_prob(req.R_odds)
    b_implied = odds_to_prob(req.B_odds)
    total = r_implied + b_implied
    p_odds = r_implied / total if total != 0 else 0.5

    # --- Step 3: Blend the two signals ---
    # If XGBoost model is available, blend 60% model + 40% odds
    # If model unavailable, fall back to 100% odds
    if p_xgb is not None:
        XGBOOST_WEIGHT = 0.6
        ODDS_WEIGHT = 0.4
        p_A = (p_xgb * XGBOOST_WEIGHT) + (p_odds * ODDS_WEIGHT)
        prediction_source = "blended"
        print(f"\n🧠 PREDICTION PIPELINE:")
        print(f"   XGBoost Model:  {req.R_fighter} {p_xgb*100:.1f}% | {req.B_fighter} {(1-p_xgb)*100:.1f}%")
        print(f"   Betting Odds:   {req.R_fighter} {p_odds*100:.1f}% | {req.B_fighter} {(1-p_odds)*100:.1f}%")
        print(f"   Blended (60/40): {req.R_fighter} {p_A*100:.1f}% | {req.B_fighter} {(1-p_A)*100:.1f}%")
    else:
        p_A = p_odds
        prediction_source = "odds_only"
        print(f"\n⚠️  XGBoost model unavailable. Using odds-only: {req.R_fighter} {p_A*100:.1f}%")

    try:
        results = run_monte_carlo(
            fighter_A=req.R_fighter,
            fighter_B=req.B_fighter,
            p_A=p_A,
            rounds=req.rounds
        )
        # Attach metadata to results
        results["prediction_source"] = prediction_source
        if p_xgb is not None:
            results["xgboost_p_Red"] = round(p_xgb, 4)
            results["odds_p_Red"] = round(p_odds, 4)
        if req.bout_weight_class:
            results["bout_weight_class"] = req.bout_weight_class
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


# ─── HELPERS ─────────────────────────────────────────────────
def _safe_float(val, default=0.0):
    try:
        if pd.isna(val) or val is None:
            return default
        v = float(val)
        if math.isnan(v) or math.isinf(v):
            return default
        return v
    except (TypeError, ValueError):
        return default

def _safe_int(val, default=0):
    try:
        if pd.isna(val) or val is None:
            return default
        v = float(val)
        if math.isnan(v) or math.isinf(v):
            return default
        return int(v)
    except (TypeError, ValueError):
        return default
        
# ─── ODDS API ────────────────────────────────────────────────
@app.get("/api/odds")
async def get_live_odds(fighter_a: str, fighter_b: str):
    api_key = os.environ.get("ODDS_API_KEY")
    if not api_key or api_key == "your_key_here":
        return {"r_odds": -110, "b_odds": -110, "status": "key_missing"}

    url = f"https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?apiKey={api_key}&regions=us&markets=h2h&oddsFormat=american"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            if response.status_code != 200:
                return {"r_odds": -110, "b_odds": -110, "status": f"api_error_{response.status_code}"}
            
            data = response.json()
        except Exception as e:
            return {"r_odds": -110, "b_odds": -110, "status": "request_failed"}

    # Look through the upcoming events
    for event in data:
        # Event title is usually "Fighter A vs Fighter B" or similar
        # We check if both our requested fighters match well with the event participants
        home_team = event.get("home_team", "")
        away_team = event.get("away_team", "")
        
        teams = [home_team, away_team]
        
        # Fuzzy match fighter A against the two teams
        match_a, score_a = process.extractOne(fighter_a, teams)
        # Fuzzy match fighter B against the two teams
        match_b, score_b = process.extractOne(fighter_b, teams)
        
        if score_a > 80 and score_b > 80 and match_a != match_b:
            # We found the fight! Now get the odds
            bookmakers = event.get("bookmakers", [])
            if not bookmakers:
                continue
                
            # Grab DraftKings or just the first available bookmaker
            bookmaker = next((b for b in bookmakers if b["key"] == "draftkings"), bookmakers[0])
            markets = bookmaker.get("markets", [])
            if not markets:
                continue
                
            outcomes = markets[0].get("outcomes", [])
            if len(outcomes) < 2:
                continue
                
            # Match the outcomes to our requested fighters
            outcome_a = next((o for o in outcomes if o["name"] == match_a), outcomes[0])
            outcome_b = next((o for o in outcomes if o["name"] == match_b), outcomes[1])
            
            return {
                "r_odds": outcome_a["price"],
                "b_odds": outcome_b["price"],
                "status": "success",
                "bookmaker": bookmaker["title"]
            }

    # Fight not found
    return {"r_odds": -110, "b_odds": -110, "status": "not_found"}

async def _fetch_espn_data():
    url = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"
    current_year = datetime.now().year
    
    espn_bouts = []
    async with httpx.AsyncClient() as client:
        try:
            responses = await asyncio.gather(
                client.get(f"{url}?limit=100&dates={current_year}", timeout=10.0),
                client.get(f"{url}?limit=100&dates={current_year + 1}", timeout=10.0)
            )
            for res in responses:
                if res.status_code == 200:
                    data = res.json()
                    for event in data.get("events", []):
                        event_name = event.get("name", "UFC Event")
                        for comp in event.get("competitions", []):
                            competitors = comp.get("competitors", [])
                            if len(competitors) == 2:
                                f_a = competitors[0].get("athlete", {}).get("displayName", "")
                                f_b = competitors[1].get("athlete", {}).get("displayName", "")
                                rounds = comp.get("format", {}).get("regulation", {}).get("periods", 3)
                                weight_class_raw = comp.get("type", {}).get("abbreviation", "")
                                espn_bouts.append({
                                    "event_name": event_name,
                                    "fighter_a": f_a,
                                    "fighter_b": f_b,
                                    "rounds": rounds,
                                    "weight_class": weight_class_raw
                                })
        except Exception:
            pass
            
    return espn_bouts


# ─── UPCOMING CARD ───────────────────────────────────────────
def _detect_weight_class(fighter_a_name, fighter_b_name):
    """Detect the most likely weight class for a matchup from our roster data."""
    roster_lookup = {f["name"]: f.get("weight_classes", []) for f in roster_data}
    wc_a = roster_lookup.get(fighter_a_name, [])
    wc_b = roster_lookup.get(fighter_b_name, [])

    if wc_a and wc_b:
        # Find shared weight classes
        shared = [wc for wc in wc_a if wc in wc_b]
        if shared:
            return shared[0]
        # No overlap — use the most recent (last) weight class of fighter A
        return wc_a[-1]
    elif wc_a:
        return wc_a[-1]
    elif wc_b:
        return wc_b[-1]
    return ""


def _build_matchups(card_events, roster_names, espn_bouts):
    """Build matchup dicts from a list of API events."""
    matchups = []
    for i, event in enumerate(card_events):
        fighter_a_raw = event.get("home_team", "")
        fighter_b_raw = event.get("away_team", "")

        is_title = "title" in fighter_a_raw.lower() or "title" in fighter_b_raw.lower()
        rounds = 5 if (i == 0 or is_title) else 3

        # Override with ESPN data if a match is found
        is_official = False
        espn_weight_class = ""
        for eb in espn_bouts:
            a_match = process.extractOne(fighter_a_raw, [eb["fighter_a"], eb["fighter_b"]])
            b_match = process.extractOne(fighter_b_raw, [eb["fighter_a"], eb["fighter_b"]])
            if a_match and b_match and a_match[1] > 75 and b_match[1] > 75:
                if a_match[0] != b_match[0]:
                    rounds = eb["rounds"]
                    espn_weight_class = eb.get("weight_class", "")
                    is_official = True
                    break

        # Only include fights that are officially scheduled on ESPN
        if not is_official:
            continue

        if not fighter_a_raw or not fighter_b_raw:
            continue

        # Fuzzy-match against our roster
        fighter_a_name = fighter_a_raw
        fighter_b_name = fighter_b_raw
        fighter_a_image = ""
        fighter_b_image = ""
        fighter_a_in_db = False
        fighter_b_in_db = False

        if roster_names:
            match_a = process.extractOne(fighter_a_raw, roster_names)
            if match_a and match_a[1] > 80:
                fighter_a_name = match_a[0]
                fighter_a_image = image_mapping.get(match_a[0], "")
                fighter_a_in_db = True

            match_b = process.extractOne(fighter_b_raw, roster_names)
            if match_b and match_b[1] > 80:
                fighter_b_name = match_b[0]
                fighter_b_image = image_mapping.get(match_b[0], "")
                fighter_b_in_db = True

        # Extract odds from DraftKings or first available
        fighter_a_odds = -110
        fighter_b_odds = -110
        bookmaker_name = ""
        bookmakers = event.get("bookmakers", [])
        if bookmakers:
            bk = next((b for b in bookmakers if b["key"] == "draftkings"), bookmakers[0])
            bookmaker_name = bk.get("title", "")
            markets = bk.get("markets", [])
            if markets:
                outcomes = markets[0].get("outcomes", [])
                if len(outcomes) >= 2:
                    teams = [fighter_a_raw, fighter_b_raw]
                    for outcome in outcomes:
                        om = process.extractOne(outcome["name"], teams)
                        if om and om[1] > 80:
                            if om[0] == fighter_a_raw:
                                fighter_a_odds = outcome["price"]
                            else:
                                fighter_b_odds = outcome["price"]

        # Detect weight class
        weight_class = ""
        if espn_weight_class:
            weight_class = espn_weight_class.replace("W ", "Women's ") # Clean up ESPN abbreviation
        else:
            weight_class = _detect_weight_class(fighter_a_name, fighter_b_name)

        matchups.append({
            "fighter_a": fighter_a_name,
            "fighter_b": fighter_b_name,
            "fighter_a_image": fighter_a_image,
            "fighter_b_image": fighter_b_image,
            "fighter_a_odds": fighter_a_odds,
            "fighter_b_odds": fighter_b_odds,
            "fighter_a_in_db": fighter_a_in_db,
            "fighter_b_in_db": fighter_b_in_db,
            "commence_time": event.get("commence_time", ""),
            "bookmaker": bookmaker_name,
            "weight_class": weight_class,
            "rounds": rounds,
        })

    return matchups


@app.get("/api/upcoming-card")
async def get_upcoming_card():
    api_key = os.environ.get("ODDS_API_KEY")
    if not api_key or api_key == "your_key_here":
        return {"events": [], "status": "key_missing"}

    url = (
        f"https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/"
        f"?apiKey={api_key}&regions=us&markets=h2h&oddsFormat=american"
    )

    espn_bouts = []
    async with httpx.AsyncClient() as client:
        try:
            odds_task = client.get(url, timeout=15.0)
            espn_task = _fetch_espn_data()
            
            response, espn_bouts = await asyncio.gather(odds_task, espn_task)
            if response.status_code != 200:
                return {"events": [], "status": f"api_error_{response.status_code}"}
            data = response.json()
        except Exception:
            return {"events": [], "status": "request_failed"}

    if not data:
        return {"events": [], "status": "no_events"}

    # Build a lookup of our roster names for fuzzy matching
    roster_names = [f["name"] for f in roster_data] if roster_data else []

    # Group events by date (YYYY-MM-DD of commence_time)
    from collections import defaultdict
    date_groups = defaultdict(list)
    for event in data:
        commence = event.get("commence_time", "")
        day = commence[:10] if commence else "unknown"
        date_groups[day].append(event)

    # Build all event cards, sorted by date ascending
    sorted_dates = sorted(date_groups.keys())
    all_events = []

    for event_date in sorted_dates:
        card_events = date_groups[event_date]
        # Sort by commence_time descending so main events (later in the night) come first
        card_events.sort(key=lambda e: e.get("commence_time", ""), reverse=True)

        event_name = card_events[0].get("sport_title", "UFC") if card_events else "UFC"
        matchups = _build_matchups(card_events, roster_names, espn_bouts)

        if matchups:
            all_events.append({
                "event_name": event_name,
                "event_date": event_date,
                "matchups": matchups,
            })

    return {
        "events": all_events,
        "status": "success",
    }

