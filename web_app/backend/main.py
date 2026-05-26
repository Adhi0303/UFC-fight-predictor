from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import sys
import os

# Add the project root to sys.path so we can import from src
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, project_root)

from src.models.simulator import run_monte_carlo, FighterProfile

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

@app.on_event("startup")
def load_data():
    global df, roster_data
    data_path = os.path.join(project_root, "data", "processed", "ufc-cleaned.csv")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)

        # Build detailed roster
        temp = pd.concat([
            df[['R_fighter', 'weight_class']].rename(columns={'R_fighter': 'name'}),
            df[['B_fighter', 'weight_class']].rename(columns={'B_fighter': 'name'})
        ]).dropna(subset=['name', 'weight_class'])

        grouped = temp.groupby('name')['weight_class'].unique().reset_index()
        grouped['weight_classes'] = grouped['weight_class'].apply(list)
        grouped = grouped.drop(columns=['weight_class'])
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

    return {
        "name": name,
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
            "title_bouts": title_bouts
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
        "weight_classes": weight_classes
    }


def _safe_str(val, default=''):
    if pd.isna(val):
        return default
    return str(val)

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
        fights.append({
            "date": _safe_str(row.get('date')),
            "opponent": _safe_str(row.get('B_fighter'), '—'),
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
        fights.append({
            "date": _safe_str(row.get('date')),
            "opponent": _safe_str(row.get('R_fighter'), '—'),
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

    r_implied = odds_to_prob(req.R_odds)
    b_implied = odds_to_prob(req.B_odds)
    total = r_implied + b_implied
    p_A = r_implied / total if total != 0 else 0.5

    try:
        results = run_monte_carlo(
            fighter_A=req.R_fighter,
            fighter_B=req.B_fighter,
            p_A=p_A,
            rounds=req.rounds
        )
        # Attach bout weight class to results if provided
        if req.bout_weight_class:
            results["bout_weight_class"] = req.bout_weight_class
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


# ─── HELPERS ─────────────────────────────────────────────────
def _safe_float(val, default=0.0):
    try:
        v = float(val)
        return v if not np.isnan(v) else default
    except (TypeError, ValueError):
        return default

def _safe_int(val, default=0):
    try:
        v = float(val)
        return int(v) if not np.isnan(v) else default
    except (TypeError, ValueError):
        return default
