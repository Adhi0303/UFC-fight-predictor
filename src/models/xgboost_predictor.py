"""
XGBoost Fight Predictor Module
Loads the trained XGBoost model and constructs a 128-feature vector
from two fighter profiles to predict the probability of Red winning.
"""
import pandas as pd
import numpy as np
import joblib
import os
from src.utils.logger import setup_logger

logger = setup_logger()

# Module-level cache for the model
_model = None
_feature_names = None


def _load_model():
    """Load the XGBoost model once and cache it."""
    global _model, _feature_names
    if _model is not None:
        return _model, _feature_names

    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    model_path = os.path.join(project_root, "models", "xgboost_model.pkl")

    if not os.path.exists(model_path):
        logger.warning(f"XGBoost model not found at {model_path}. Falling back to odds-only mode.")
        return None, None

    _model = joblib.load(model_path)
    _feature_names = list(_model.feature_names_in_)
    logger.info(f"XGBoost model loaded successfully ({len(_feature_names)} features).")
    return _model, _feature_names


def build_feature_vector(r_name: str, b_name: str, df: pd.DataFrame,
                         r_odds: float = -110, b_odds: float = -110,
                         rounds: int = 3, weight_class: str = None) -> pd.DataFrame:
    """
    Constructs the 128-feature vector that the XGBoost model expects,
    using the most recent fight data for each fighter from the cleaned dataset.
    """
    model, feature_names = _load_model()
    if model is None or feature_names is None:
        return None

    # Get the most recent fight row for each fighter
    r_as_red = df[df['R_fighter'] == r_name].sort_values('date', ascending=False)
    r_as_blue = df[df['B_fighter'] == r_name].sort_values('date', ascending=False)
    b_as_red = df[df['R_fighter'] == b_name].sort_values('date', ascending=False)
    b_as_blue = df[df['B_fighter'] == b_name].sort_values('date', ascending=False)

    # Find the most recent fight for Red fighter
    r_latest = None
    r_prefix = None
    r_date_red = r_as_red.iloc[0]['date'] if len(r_as_red) > 0 else '1900-01-01'
    r_date_blue = r_as_blue.iloc[0]['date'] if len(r_as_blue) > 0 else '1900-01-01'

    if str(r_date_red) >= str(r_date_blue) and len(r_as_red) > 0:
        r_latest = r_as_red.iloc[0]
        r_prefix = 'R_'
    elif len(r_as_blue) > 0:
        r_latest = r_as_blue.iloc[0]
        r_prefix = 'B_'
    elif len(r_as_red) > 0:
        r_latest = r_as_red.iloc[0]
        r_prefix = 'R_'

    # Find the most recent fight for Blue fighter
    b_latest = None
    b_prefix = None
    b_date_red = b_as_red.iloc[0]['date'] if len(b_as_red) > 0 else '1900-01-01'
    b_date_blue = b_as_blue.iloc[0]['date'] if len(b_as_blue) > 0 else '1900-01-01'

    if str(b_date_blue) >= str(b_date_red) and len(b_as_blue) > 0:
        b_latest = b_as_blue.iloc[0]
        b_prefix = 'B_'
    elif len(b_as_red) > 0:
        b_latest = b_as_red.iloc[0]
        b_prefix = 'R_'
    elif len(b_as_blue) > 0:
        b_latest = b_as_blue.iloc[0]
        b_prefix = 'B_'

    if r_latest is None or b_latest is None:
        logger.warning(f"Could not find fight data for one or both fighters: {r_name}, {b_name}")
        return None

    # --- Build the feature row ---
    features = {}

    # Odds and EV
    features['R_odds'] = r_odds
    features['B_odds'] = b_odds
    features['R_ev'] = _odds_to_ev(r_odds)
    features['B_ev'] = _odds_to_ev(b_odds)
    features['no_of_rounds'] = rounds

    # Fighter stat columns — extract from their most recent fight row
    r_stat_cols = [
        'current_lose_streak', 'current_win_streak', 'draw',
        'avg_SIG_STR_landed', 'avg_SIG_STR_pct', 'avg_SUB_ATT',
        'avg_TD_landed', 'avg_TD_pct', 'longest_win_streak', 'losses',
        'total_rounds_fought', 'total_title_bouts',
        'win_by_Decision_Majority', 'win_by_Decision_Split',
        'win_by_Decision_Unanimous', 'win_by_KO/TKO', 'win_by_Submission',
        'win_by_TKO_Doctor_Stoppage', 'wins',
        'Height_cms', 'Reach_cms', 'Weight_lbs'
    ]

    # Red fighter stats
    for col in r_stat_cols:
        src_col = f'{r_prefix}{col}'
        features[f'R_{col}'] = _safe(r_latest.get(src_col, 0))

    # Blue fighter stats
    for col in r_stat_cols:
        src_col = f'{b_prefix}{col}'
        features[f'B_{col}'] = _safe(b_latest.get(src_col, 0))

    # Age
    features['R_age'] = _safe(r_latest.get(f'{r_prefix}age', 30))
    features['B_age'] = _safe(b_latest.get(f'{b_prefix}age', 30))

    # Differential features
    features['lose_streak_dif'] = features['R_current_lose_streak'] - features['B_current_lose_streak']
    features['win_streak_dif'] = features['R_current_win_streak'] - features['B_current_win_streak']
    features['longest_win_streak_dif'] = features['R_longest_win_streak'] - features['B_longest_win_streak']
    features['win_dif'] = features['R_wins'] - features['B_wins']
    features['loss_dif'] = features['R_losses'] - features['B_losses']
    features['total_round_dif'] = features['R_total_rounds_fought'] - features['B_total_rounds_fought']
    features['total_title_bout_dif'] = features['R_total_title_bouts'] - features['B_total_title_bouts']
    features['ko_dif'] = features['R_win_by_KO/TKO'] - features['B_win_by_KO/TKO']
    features['sub_dif'] = features['R_win_by_Submission'] - features['B_win_by_Submission']
    features['height_dif'] = features['R_Height_cms'] - features['B_Height_cms']
    features['reach_dif'] = features['R_Reach_cms'] - features['B_Reach_cms']
    features['age_dif'] = features['R_age'] - features['B_age']
    features['sig_str_dif'] = features['R_avg_SIG_STR_landed'] - features['B_avg_SIG_STR_landed']
    features['avg_sub_att_dif'] = features['R_avg_SUB_ATT'] - features['B_avg_SUB_ATT']
    features['avg_td_dif'] = features['R_avg_TD_landed'] - features['B_avg_TD_landed']

    # Ranking features (default to NaN / 0 — the model handles missing rankings)
    rank_divisions = [
        "Women's Flyweight", "Women's Featherweight", "Women's Strawweight",
        "Women's Bantamweight", "Heavyweight", "Light Heavyweight",
        "Middleweight", "Welterweight", "Lightweight", "Featherweight",
        "Bantamweight", "Flyweight", "Pound-for-Pound"
    ]

    # Match weightclass rank
    features['B_match_weightclass_rank'] = _safe(b_latest.get('B_match_weightclass_rank', 0) if b_prefix == 'B_' else b_latest.get('R_match_weightclass_rank', 0))
    features['R_match_weightclass_rank'] = _safe(r_latest.get('R_match_weightclass_rank', 0) if r_prefix == 'R_' else r_latest.get('B_match_weightclass_rank', 0))

    for div in rank_divisions:
        features[f'R_{div}_rank'] = _safe(r_latest.get(f'{r_prefix[0]}_{div}_rank', 0) if f'{r_prefix[0]}_{div}_rank' in r_latest.index else 0)
        features[f'B_{div}_rank'] = _safe(b_latest.get(f'{b_prefix[0]}_{div}_rank', 0) if f'{b_prefix[0]}_{div}_rank' in b_latest.index else 0)

    # Method odds (default to 0 if not available)
    features['r_dec_odds'] = _safe(r_latest.get('r_dec_odds', 0) if r_prefix == 'R_' else r_latest.get('b_dec_odds', 0))
    features['b_dec_odds'] = _safe(b_latest.get('b_dec_odds', 0) if b_prefix == 'B_' else b_latest.get('r_dec_odds', 0))
    features['r_sub_odds'] = _safe(r_latest.get('r_sub_odds', 0) if r_prefix == 'R_' else r_latest.get('b_sub_odds', 0))
    features['b_sub_odds'] = _safe(b_latest.get('b_sub_odds', 0) if b_prefix == 'B_' else b_latest.get('r_sub_odds', 0))
    features['r_ko_odds'] = _safe(r_latest.get('r_ko_odds', 0) if r_prefix == 'R_' else r_latest.get('b_ko_odds', 0))
    features['b_ko_odds'] = _safe(b_latest.get('b_ko_odds', 0) if b_prefix == 'B_' else b_latest.get('r_ko_odds', 0))

    # Duplicate diff features (the dataset has both "age_dif" and "age_diff" etc.)
    features['age_diff'] = features['age_dif']
    features['reach_diff'] = features['reach_dif']
    features['height_diff'] = features['height_dif']
    features['sig_str_diff'] = features['sig_str_dif']
    features['td_diff'] = features['avg_td_dif']

    # Weight class one-hot encoding
    weight_classes = [
        'Catch Weight', 'Featherweight', 'Flyweight', 'Heavyweight',
        'Light Heavyweight', 'Lightweight', 'Middleweight', 'Welterweight',
        "Women's Bantamweight", "Women's Featherweight",
        "Women's Flyweight", "Women's Strawweight"
    ]
    for wc in weight_classes:
        features[f'weight_class_{wc}'] = 1 if weight_class == wc else 0

    # Stance one-hot encoding
    r_stance = r_latest.get(f'{r_prefix}Stance', 'Orthodox') if f'{r_prefix}Stance' in r_latest.index else 'Orthodox'
    b_stance = b_latest.get(f'{b_prefix}Stance', 'Orthodox') if f'{b_prefix}Stance' in b_latest.index else 'Orthodox'

    for stance in ['Orthodox', 'Southpaw', 'Switch']:
        features[f'R_Stance_{stance}'] = 1 if str(r_stance) == stance else 0
        features[f'B_Stance_{stance}'] = 1 if str(b_stance) == stance else 0
    features['B_Stance_Unknown'] = 1 if str(b_stance) not in ['Orthodox', 'Southpaw', 'Switch'] else 0

    # Gender (default male for UFC)
    features['gender_MALE'] = 1

    # Better rank
    r_rank = features.get('R_match_weightclass_rank', 0)
    b_rank = features.get('B_match_weightclass_rank', 0)
    if r_rank > 0 and b_rank > 0:
        features['better_rank_Red'] = 1 if r_rank < b_rank else 0
        features['better_rank_Blue'] = 1 if b_rank < r_rank else 0
        features['better_rank_neither'] = 0
    else:
        features['better_rank_Red'] = 0
        features['better_rank_Blue'] = 0
        features['better_rank_neither'] = 1

    # Build the DataFrame with columns in the exact order the model expects
    row = {}
    for col in feature_names:
        row[col] = features.get(col, 0)

    feature_df = pd.DataFrame([row], columns=feature_names)

    # Replace any NaN with 0
    feature_df = feature_df.fillna(0)

    return feature_df


def predict_win_probability(r_name: str, b_name: str, df: pd.DataFrame,
                            r_odds: float = -110, b_odds: float = -110,
                            rounds: int = 3, weight_class: str = None) -> dict:
    """
    Uses the trained XGBoost model to predict the probability of
    the Red fighter winning. Returns a dict with p_Red, p_Blue, and source.
    """
    model, feature_names = _load_model()
    if model is None:
        return {"p_Red": None, "source": "model_not_found"}

    feature_df = build_feature_vector(r_name, b_name, df, r_odds, b_odds, rounds, weight_class)
    if feature_df is None:
        return {"p_Red": None, "source": "feature_build_failed"}

    try:
        # predict_proba returns [[p_class_0, p_class_1]]
        # Class 1 = Red wins, Class 0 = Blue wins
        probabilities = model.predict_proba(feature_df)[0]
        p_red = float(probabilities[1])
        p_blue = float(probabilities[0])

        logger.info(f"XGBoost Prediction: {r_name} ({p_red*100:.1f}%) vs {b_name} ({p_blue*100:.1f}%)")

        return {
            "p_Red": p_red,
            "p_Blue": p_blue,
            "source": "xgboost"
        }
    except Exception as e:
        logger.error(f"XGBoost prediction failed: {e}")
        return {"p_Red": None, "source": f"prediction_error: {str(e)}"}


def _safe(val, default=0.0):
    """Safely convert a value to float, returning default for NaN/None."""
    try:
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return default
        v = float(val)
        if np.isnan(v) or np.isinf(v):
            return default
        return v
    except (TypeError, ValueError):
        return default


def _odds_to_ev(odds: float) -> float:
    """Convert American odds to expected value percentage."""
    if odds < 0:
        return 100.0 / (abs(odds) / 100.0)
    else:
        return odds
