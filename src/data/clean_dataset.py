import pandas as pd
import numpy as np
from src.utils.logger import setup_logger

logger = setup_logger()


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Cleans and standardizes the UFC fights DataFrame.

    - Drops duplicates.
    - Handles missing target values.
    - Converts date columns to datetime objects.
    - Fills missing values in key features (ages, physical attributes, stats).
    - Standardizes categoricals.

    Args:
        df: Input pandas DataFrame.

    Returns:
        pd.DataFrame: Cleaned pandas DataFrame.
    """
    logger.info("Starting dataset cleaning...")
    cleaned_df = df.copy()

    # 1. Drop duplicates
    initial_shape = cleaned_df.shape
    cleaned_df = cleaned_df.drop_duplicates(subset=["R_fighter", "B_fighter", "date"])
    dropped_rows = initial_shape[0] - cleaned_df.shape[0]
    if dropped_rows > 0:
        logger.info(f"Dropped {dropped_rows} duplicate fight records.")

    # 2. Date conversion
    if "date" in cleaned_df.columns:
        cleaned_df["date"] = pd.to_datetime(cleaned_df["date"], errors="coerce")
        # Drop rows with invalid dates
        cleaned_df = cleaned_df.dropna(subset=["date"])
        logger.info("Converted 'date' column to datetime.")

    # 3. Standardize and encode target variable 'Winner'
    if "Winner" in cleaned_df.columns:
        # Drop rows where Winner is null or not in (Red, Blue, Draw)
        cleaned_df = cleaned_df[cleaned_df["Winner"].isin(["Red", "Blue", "Draw"])]
        logger.info(f"Target variable cleaned. Remaining rows: {len(cleaned_df)}")

    # 4. Handle physical traits missing values (Heights, Reaches, Weights)
    # Fill with median per weight class / gender if possible, or overall median
    physical_cols = ["R_Height_cms", "B_Height_cms", "R_Reach_cms", "B_Reach_cms", "R_Weight_lbs", "B_Weight_lbs"]
    for col in physical_cols:
        if col in cleaned_df.columns:
            median_val = cleaned_df[col].median()
            # If weight_class is present, fill with median of that weight class
            if "weight_class" in cleaned_df.columns:
                cleaned_df[col] = cleaned_df.groupby("weight_class")[col].transform(
                    lambda x: x.fillna(x.median() if not x.median() is np.nan else median_val)
                )
            else:
                cleaned_df[col] = cleaned_df[col].fillna(median_val)
    logger.info("Filled missing physical attributes (Height, Reach, Weight).")

    # 5. Handle missing Age columns
    age_cols = ["R_age", "B_age"]
    for col in age_cols:
        if col in cleaned_df.columns:
            median_age = cleaned_df[col].median()
            cleaned_df[col] = cleaned_df[col].fillna(median_age)
    logger.info("Filled missing age values.")

    # 6. Clean up stance columns
    stance_cols = ["R_Stance", "B_Stance"]
    for col in stance_cols:
        if col in cleaned_df.columns:
            cleaned_df[col] = cleaned_df[col].fillna("Unknown").str.strip()
    logger.info("Cleaned and standardized fighter stances.")

    # 7. Fill missing fighter stats with 0 (e.g., avg sig strikes, takedowns, streaks)
    stats_cols = [
        col for col in cleaned_df.columns 
        if "avg" in col.lower() or "streak" in col.lower() or "losses" in col.lower() or "wins" in col.lower()
    ]
    for col in stats_cols:
        cleaned_df[col] = cleaned_df[col].fillna(0)
    logger.info("Filled missing fighter statistics and streaks with 0.")

    # 8. Handle ranks: map missing/unranked to a default high number (e.g., 16/unranked)
    rank_cols = [col for col in cleaned_df.columns if "rank" in col.lower()]
    for col in rank_cols:
        # High value indicates unranked (not in top 15)
        cleaned_df[col] = cleaned_df[col].fillna(16.0)
    logger.info("Filled missing ranking columns with default unranked indicator (16.0).")

    # 9. Clean betting odds (fill missing with 0 or group average, here we use 0 or default EV)
    odds_cols = [col for col in cleaned_df.columns if "odds" in col.lower() or "ev" in col.lower()]
    for col in odds_cols:
        cleaned_df[col] = cleaned_df[col].fillna(0)
    logger.info("Filled missing betting odds/EV columns.")

    logger.info(f"Dataset cleaning completed. Final Shape: {cleaned_df.shape}")
    return cleaned_df


if __name__ == "__main__":
    from src.data.load_dataset import load_raw_data

    try:
        df = load_raw_data()
        cleaned_df = clean_data(df)
        print("\n--- Cleaned Dataset Sample ---")
        print(f"Shape: {cleaned_df.shape}")
        print(cleaned_df.head(2))
    except Exception as e:
        logger.error(f"Error in cleaning module: {e}")
