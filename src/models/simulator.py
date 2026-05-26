import pandas as pd
import numpy as np
import random
from src.utils.logger import setup_logger
import os

logger = setup_logger()

class FighterProfile:
    def __init__(self, name: str, df: pd.DataFrame):
        self.name = name
        self.parse_profile(df)

    def parse_profile(self, df: pd.DataFrame):
        """
        Parses historical fights to extract finishing rates, durability, and stats.
        """
        # Filter fights involving the fighter
        r_fights = df[df['R_fighter'] == self.name].copy()
        b_fights = df[df['B_fighter'] == self.name].copy()
        
        total_fights = len(r_fights) + len(b_fights)
        
        if total_fights == 0:
            # Default fallback stats for debut/unknown fighters
            self.total_wins = 0
            self.total_losses = 0
            self.ko_wins = 0
            self.sub_wins = 0
            self.dec_wins = 0
            self.ko_losses = 0
            self.sub_losses = 0
            self.dec_losses = 0
            self.slpm = 3.5
            self.td_rate = 1.5
            self.sig_str_pct = 0.45
            return

        # Calculate Wins & Losses
        # Winner = Red means R_fighter won, Blue means B_fighter won
        wins_r = r_fights[r_fights['Winner'] == 'Red']
        losses_r = r_fights[r_fights['Winner'] == 'Blue']
        
        wins_b = b_fights[b_fights['Winner'] == 'Blue']
        losses_b = b_fights[b_fights['Winner'] == 'Red']
        
        self.total_wins = len(wins_r) + len(wins_b)
        self.total_losses = len(losses_r) + len(losses_b)
        
        # Win distributions (KO, Sub, Dec)
        self.ko_wins = len(wins_r[wins_r['finish'] == 'KO/TKO']) + len(wins_b[wins_b['finish'] == 'KO/TKO'])
        self.sub_wins = len(wins_r[wins_r['finish'] == 'Submission']) + len(wins_b[wins_b['finish'] == 'Submission'])
        self.dec_wins = self.total_wins - (self.ko_wins + self.sub_wins) # Group decisions/DQs
        
        # Loss distributions (durability)
        self.ko_losses = len(losses_r[losses_r['finish'] == 'KO/TKO']) + len(losses_b[losses_b['finish'] == 'KO/TKO'])
        self.sub_losses = len(losses_r[losses_r['finish'] == 'Submission']) + len(losses_b[losses_b['finish'] == 'Submission'])
        self.dec_losses = self.total_losses - (self.ko_losses + self.sub_losses)

        # Career stats lookup (from the most recent fight)
        all_fights = pd.concat([r_fights, b_fights]).sort_values(by='date', ascending=False)
        most_recent = all_fights.iloc[0]
        
        if most_recent['R_fighter'] == self.name:
            self.slpm = most_recent.get('R_avg_SIG_STR_landed', 3.5)
            self.td_rate = most_recent.get('R_avg_TD_landed', 1.5)
            self.sig_str_pct = most_recent.get('R_avg_SIG_STR_pct', 0.45)
        else:
            self.slpm = most_recent.get('B_avg_SIG_STR_landed', 3.5)
            self.td_rate = most_recent.get('B_avg_TD_landed', 1.5)
            self.sig_str_pct = most_recent.get('B_avg_SIG_STR_pct', 0.45)

    def print_profile(self):
        print(f"\n=== Fighter Profile: {self.name} ===")
        print(f"Record: {self.total_wins} Wins - {self.total_losses} Losses")
        print(f"Win Methods: KO/TKO: {self.ko_wins} | Sub: {self.sub_wins} | Dec: {self.dec_wins}")
        print(f"Loss Methods: KO/TKO: {self.ko_losses} | Sub: {self.sub_losses} | Dec: {self.dec_losses}")
        print(f"SLpM (Strikes per Min): {self.slpm:.2f} | Sig Str Pct: {self.sig_str_pct*100:.1f}%")
        print(f"Grappling (TD rate per 15m): {self.td_rate:.2f}")


def simulate_fight(profile_A: FighterProfile, profile_B: FighterProfile, p_A: float, rounds: int = 3):
    """
    Simulates a single fight round-by-round.
    p_A is the prior win probability of Fighter A from the XGBoost model.
    """
    # 1. Calculate round-level finish probabilities based on histories
    # Max values are used to prevent division by zero
    wins_A = max(1, profile_A.total_wins)
    wins_B = max(1, profile_B.total_wins)
    losses_A = max(1, profile_A.total_losses)
    losses_B = max(1, profile_B.total_losses)
    
    # Offensive threat
    threat_A_KO = profile_A.slpm * (profile_A.ko_wins / wins_A) * 0.03
    threat_B_KO = profile_B.slpm * (profile_B.ko_wins / wins_B) * 0.03
    
    threat_A_Sub = profile_A.td_rate * (profile_A.sub_wins / wins_A) * 0.02
    threat_B_Sub = profile_B.td_rate * (profile_B.sub_wins / wins_B) * 0.02
    
    # Defensive vulnerability (Durability)
    vuln_A_KO = (profile_A.ko_losses / losses_A) + 0.5
    vuln_B_KO = (profile_B.ko_losses / losses_B) + 0.5
    
    vuln_A_Sub = (profile_A.sub_losses / losses_A) + 0.5
    vuln_B_Sub = (profile_B.sub_losses / losses_B) + 0.5
    
    # Combined probabilities
    prob_KO_A = threat_A_KO * vuln_B_KO
    prob_KO_B = threat_B_KO * vuln_A_KO
    
    prob_Sub_A = threat_A_Sub * vuln_B_Sub
    prob_Sub_B = threat_B_Sub * vuln_A_Sub

    # Round scoring calibration (using prior probability p_A)
    # If the fight goes to a decision, the probability of A winning a round is p_A
    
    rounds_won_A = 0
    rounds_won_B = 0
    
    for r in range(1, rounds + 1):
        rand = random.random()
        
        # Check for finishes
        if rand < prob_KO_A:
            return "A", "KO/TKO", r
        elif rand < prob_KO_A + prob_KO_B:
            return "B", "KO/TKO", r
        elif rand < prob_KO_A + prob_KO_B + prob_Sub_A:
            return "A", "Submission", r
        elif rand < prob_KO_A + prob_KO_B + prob_Sub_A + prob_Sub_B:
            return "B", "Submission", r
        
        # If no finish, score the round
        # Probability A wins the round = p_A (prior probability)
        if random.random() < p_A:
            rounds_won_A += 1
        else:
            rounds_won_B += 1
            
    # If fight went the distance, judge decides based on rounds won
    if rounds_won_A > rounds_won_B:
        return "A", "Decision", rounds
    else:
        return "B", "Decision", rounds


def run_monte_carlo(fighter_A: str, fighter_B: str, p_A: float, num_sims: int = 10000, rounds: int = 3):
    """
    Runs the Monte Carlo simulation 10,000 times and prints the breakdown.
    """
    # Load clean dataset
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    data_path = os.path.join(project_root, "data", "processed", "ufc-cleaned.csv")
    df = pd.read_csv(data_path)
    
    profile_A = FighterProfile(fighter_A, df)
    profile_B = FighterProfile(fighter_B, df)
    
    profile_A.print_profile()
    profile_B.print_profile()
    
    print(f"\nRunning {num_sims} Monte Carlo simulations for {fighter_A} vs {fighter_B}...")
    
    results = {
        "A_wins": 0, "B_wins": 0,
        "A_KO": 0, "A_Sub": 0, "A_Dec": 0,
        "B_KO": 0, "B_Sub": 0, "B_Dec": 0,
        "total_rounds": 0,
        "A_finishes_by_round": {1:0, 2:0, 3:0, 4:0, 5:0},
        "B_finishes_by_round": {1:0, 2:0, 3:0, 4:0, 5:0}
    }
    
    for _ in range(num_sims):
        winner, method, r = simulate_fight(profile_A, profile_B, p_A, rounds)
        results["total_rounds"] += r
        
        if winner == "A":
            results["A_wins"] += 1
            if method == "KO/TKO":
                results["A_KO"] += 1
                results["A_finishes_by_round"][r] = results["A_finishes_by_round"].get(r, 0) + 1
            elif method == "Submission":
                results["A_Sub"] += 1
                results["A_finishes_by_round"][r] = results["A_finishes_by_round"].get(r, 0) + 1
            else:
                results["A_Dec"] += 1
        else:
            results["B_wins"] += 1
            if method == "KO/TKO":
                results["B_KO"] += 1
                results["B_finishes_by_round"][r] = results["B_finishes_by_round"].get(r, 0) + 1
            elif method == "Submission":
                results["B_Sub"] += 1
                results["B_finishes_by_round"][r] = results["B_finishes_by_round"].get(r, 0) + 1
            else:
                results["B_Dec"] += 1
                
    # Calculate stats
    p_win_A = results["A_wins"] / num_sims
    p_win_B = results["B_wins"] / num_sims
    avg_rounds = results["total_rounds"] / num_sims
    
    print("\n" + "="*40)
    print(f"SIMULATION RESULTS ({fighter_A} vs {fighter_B})")
    print("="*40)
    print(f"{fighter_A} Win Probability: {p_win_A*100:.2f}%")
    print(f"   - KO/TKO: {results['A_KO']/num_sims*100:.2f}%")
    print(f"   - Submission: {results['A_Sub']/num_sims*100:.2f}%")
    print(f"   - Decision: {results['A_Dec']/num_sims*100:.2f}%")
    
    print(f"\n{fighter_B} Win Probability: {p_win_B*100:.2f}%")
    print(f"   - KO/TKO: {results['B_KO']/num_sims*100:.2f}%")
    print(f"   - Submission: {results['B_Sub']/num_sims*100:.2f}%")
    print(f"   - Decision: {results['B_Dec']/num_sims*100:.2f}%")
    
    print(f"\nAverage Rounds Fought: {avg_rounds:.2f} Rounds")
    print("="*40)
    
    return {
        "R_fighter": fighter_A,
        "B_fighter": fighter_B,
        "p_Red": p_win_A,
        "p_Blue": p_win_B,
        "simulation": {
            "R_KO": results["A_KO"] / num_sims,
            "R_Sub": results["A_Sub"] / num_sims,
            "R_Dec": results["A_Dec"] / num_sims,
            "B_KO": results["B_KO"] / num_sims,
            "B_Sub": results["B_Sub"] / num_sims,
            "B_Dec": results["B_Dec"] / num_sims,
            "avg_rounds": avg_rounds,
            "R_finishes_by_round": {k: v/num_sims for k,v in results["A_finishes_by_round"].items() if k <= rounds},
            "B_finishes_by_round": {k: v/num_sims for k,v in results["B_finishes_by_round"].items() if k <= rounds}
        },
        "stats": {
            "R": {
                "name": profile_A.name,
                "wins": profile_A.total_wins,
                "losses": profile_A.total_losses,
                "ko_wins": profile_A.ko_wins,
                "sub_wins": profile_A.sub_wins,
                "dec_wins": profile_A.dec_wins,
                "slpm": profile_A.slpm,
                "td_rate": profile_A.td_rate,
                "reach": profile_A.sig_str_pct # using this for now as reach isn't strictly parsed
            },
            "B": {
                "name": profile_B.name,
                "wins": profile_B.total_wins,
                "losses": profile_B.total_losses,
                "ko_wins": profile_B.ko_wins,
                "sub_wins": profile_B.sub_wins,
                "dec_wins": profile_B.dec_wins,
                "slpm": profile_B.slpm,
                "td_rate": profile_B.td_rate,
                "reach": profile_B.sig_str_pct
            }
        }
    }

if __name__ == "__main__":
    # Test simulation for Conor McGregor vs Max Holloway
    # We will assume a prior win probability of 52% for Conor (A)
    res = run_monte_carlo("Conor McGregor", "Max Holloway", p_A=0.52, rounds=3)
    print(res)
