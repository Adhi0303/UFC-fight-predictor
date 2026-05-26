from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import sys
import os

# Add the project root to sys.path so we can import from src
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, project_root)

from src.models.simulator import run_monte_carlo, FighterProfile

app = FastAPI(title="UFC Fight Predictor API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
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
        
        # Group by name and get list of weight classes
        grouped = temp.groupby('name')['weight_class'].unique().reset_index()
        # Convert numpy arrays to lists for JSON serialization
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

@app.get("/api/fighters")
def get_fighters():
    if not roster_data:
        return {"fighters": [{"name": "Conor McGregor", "weight_classes": ["Lightweight"]}, {"name": "Max Holloway", "weight_classes": ["Featherweight"]}]}
    return {"fighters": roster_data}

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
            "reach": profile.sig_str_pct # placeholder
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Fighter {name} not found or error parsing: {str(e)}")

def odds_to_prob(odds: float) -> float:
    if odds < 0:
        return abs(odds) / (abs(odds) + 100)
    else:
        return 100 / (odds + 100)

@app.post("/api/predict")
def predict_fight(req: PredictRequest):
    if df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    # Calculate prior probability based on odds
    r_implied = odds_to_prob(req.R_odds)
    b_implied = odds_to_prob(req.B_odds)
    
    # Normalize probabilities to sum to 1.0
    total = r_implied + b_implied
    if total == 0:
        p_A = 0.5
    else:
        p_A = r_implied / total
        
    # Run simulation
    try:
        results = run_monte_carlo(
            fighter_A=req.R_fighter,
            fighter_B=req.B_fighter,
            p_A=p_A,
            rounds=req.rounds
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
