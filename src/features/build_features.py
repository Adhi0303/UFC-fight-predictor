import pandas as pd
from src.utils.logger import setup_logger

logger = setup_logger()

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms the cleaned data into Machine Learning-ready features.
    
    This function performs four main ML concepts:
    1. Leakage Prevention
    2. Target Encoding
    3. Differential Feature Engineering
    4. Categorical Encoding
    """
    logger.info("Starting Feature Engineering...")
    # Create a copy so we don't accidentally modify the original dataframe in-place
    features_df = df.copy()

    # =========================================================================
    # ML CONCEPT 1: LEAKAGE PREVENTION
    # =========================================================================
    # Data Leakage is the #1 reason machine learning models fail in production.
    # It happens when the model has access to data during training that it 
    # wouldn't have access to in the real world when making a prediction.
    # For example, if we keep 'finish_round', the model will learn that if 
    # finish_round is 1, the fight didn't go to a decision. We MUST drop all
    # data that happens AFTER the fight starts.
    
    leakage_columns = [
        'finish', 'finish_details', 'finish_round', 'finish_round_time',
        'total_fight_time_secs', 'location', 'country', 'title_bout' 
        # (We keep title_bout if we want to use it as a context feature, 
        # but let's drop non-predictive metadata)
    ]
    
    # We use errors='ignore' so it doesn't crash if a column is already missing
    features_df = features_df.drop(columns=leakage_columns, errors='ignore')
    logger.info("Dropped leakage/future columns.")


    # =========================================================================
    # ML CONCEPT 2: TARGET ENCODING
    # =========================================================================
    # Machine Learning algorithms are math functions; they cannot multiply "Red".
    # We must convert our target variable (the thing we want to predict) into a number.
    # Binary Classification means predicting between two states: 1 or 0.
    
    if 'Winner' in features_df.columns:
        # We only want clear winners to train the model cleanly, so we drop 'Draw'
        features_df = features_df[features_df['Winner'] != 'Draw']
        
        # Map 'Red' to 1 (Red wins), 'Blue' to 0 (Blue wins)
        features_df['Winner'] = features_df['Winner'].map({'Red': 1, 'Blue': 0})
        logger.info("Target Variable 'Winner' encoded: Red=1, Blue=0")


    # =========================================================================
    # ML CONCEPT 3: DIFFERENTIAL FEATURES
    # =========================================================================
    # A fight is a matchup. If Fighter A is 35 years old, that's just a number.
    # But if Fighter A is 35 and Fighter B is 22, Fighter B has a massive youth
    # advantage. We want the ML model to learn advantages, not just raw numbers.
    # We calculate the Difference (Red stats - Blue stats).
    
    logger.info("Calculating differential features...")
    
    # 1. Physical Differentials
    features_df['age_diff'] = features_df['R_age'] - features_df['B_age']
    features_df['reach_diff'] = features_df['R_Reach_cms'] - features_df['B_Reach_cms']
    features_df['height_diff'] = features_df['R_Height_cms'] - features_df['B_Height_cms']
    
    # 2. Striking Differentials (Average Significant Strikes Landed per minute, etc.)
    # We check if columns exist before doing math
    if 'R_avg_SIG_STR_landed' in features_df.columns and 'B_avg_SIG_STR_landed' in features_df.columns:
        features_df['sig_str_diff'] = features_df['R_avg_SIG_STR_landed'] - features_df['B_avg_SIG_STR_landed']
        
    # 3. Grappling Differentials
    if 'R_avg_TD_landed' in features_df.columns and 'B_avg_TD_landed' in features_df.columns:
        features_df['td_diff'] = features_df['R_avg_TD_landed'] - features_df['B_avg_TD_landed']


    # =========================================================================
    # ML CONCEPT 4: CATEGORICAL ENCODING (ONE-HOT ENCODING)
    # =========================================================================
    # Some data is text (categories) like "Stance". 
    # Southpaw, Orthodox, Switch.
    # We can't turn this into 1, 2, 3 because 3 is not "greater" than 1 in stance.
    # Instead, we use One-Hot Encoding: We create new columns that act as True/False (1/0).
    # e.g., 'is_Southpaw', 'is_Orthodox'.
    
    logger.info("One-hot encoding categorical variables...")
    
    # Identify the text columns we want to encode
    categorical_cols = ['weight_class', 'R_Stance', 'B_Stance', 'gender']
    
    # pd.get_dummies automatically converts text columns into 1s and 0s
    features_df = pd.get_dummies(
        features_df, 
        columns=[c for c in categorical_cols if c in features_df.columns],
        drop_first=True # Drops one category to avoid the "dummy variable trap" (multicollinearity)
    )

    # Finally, we drop identifiers that the model can't learn from
    # E.g., The model can't mathematically use names or exact dates to predict general rules.
    final_drop_cols = ['R_fighter', 'B_fighter', 'date']
    features_df = features_df.drop(columns=final_drop_cols, errors='ignore')
    
    logger.info(f"Feature Engineering Complete! Final shape: {features_df.shape}")
    
    return features_df

if __name__ == "__main__":
    from src.data.load_dataset import load_raw_data
    from src.data.clean_dataset import clean_data
    
    df = load_raw_data()
    cleaned_df = clean_data(df)
    featured_df = engineer_features(cleaned_df)
    
    print("\n--- ML Features Dataset Sample ---")
    print(featured_df.head(2))
