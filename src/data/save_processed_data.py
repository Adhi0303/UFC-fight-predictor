import os
import pandas as pd
from src.utils.logger import setup_logger
from src.utils.config_loader import load_config
from src.data.load_dataset import load_raw_data
from src.data.validate_dataset import validate_dataframe
from src.data.profile_dataset import generate_profile_report
from src.data.clean_dataset import clean_data
from src.features.build_features import engineer_features

logger = setup_logger()


def save_data(df: pd.DataFrame, filename: str = "ufc-cleaned.csv", stage: str = "processed") -> str:
    """Saves the processed/interim DataFrame to the specified stage path.

    Args:
        df: The DataFrame to save.
        filename: Name of the output CSV file.
        stage: Config path key (e.g. 'processed' or 'interim').

    Returns:
        str: Absolute or resolved path to the saved file.
    """
    try:
        paths = load_config("configs/paths.yaml")
        dest_dir = paths["data"][stage]
    except Exception as e:
        logger.error(f"Failed to load paths config: {e}")
        dest_dir = f"data/{stage}"

    os.makedirs(dest_dir, exist_ok=True)
    output_path = os.path.join(dest_dir, filename)

    logger.info(f"Saving dataframe to {output_path}...")
    try:
        df.to_csv(output_path, index=False)
        logger.info(f"Successfully saved data to {output_path}.")
        return output_path
    except Exception as e:
        logger.error(f"Failed to save data: {e}")
        raise e


def run_preprocessing_pipeline() -> None:
    """Orchestrates the entire pre-processing pipeline:

    1. Load Raw Dataset
    2. Validate Dataset (Quality checks)
    3. Profile Dataset (Generate report)
    4. Clean Dataset (Impute, format, clean columns)
    5. Save Cleaned Dataset to Processed Location
    """
    logger.info("=========================================")
    logger.info("   STARTING PREPROCESSING PIPELINE       ")
    logger.info("=========================================")

    try:
        # Step 1: Load
        df = load_raw_data()

        # Step 2: Validate
        if not validate_dataframe(df):
            logger.warning("Data validation warnings/errors were encountered. Proceeding with caution...")

        # Step 3: Profile
        generate_profile_report(df, output_path="logs/raw_data_profile.txt")

        # Step 4: Clean
        cleaned_df = clean_data(df)
        
        # Save intermediate cleaned dataset
        save_data(cleaned_df, filename="ufc-cleaned.csv", stage="interim")

        # Step 5: Feature Engineering
        features_df = engineer_features(cleaned_df)

        # Step 6: Save ML-ready dataset
        output_path = save_data(features_df, filename="ufc-ml-features.csv", stage="processed")

        logger.info("=========================================")
        logger.info("   PREPROCESSING PIPELINE COMPLETED      ")
        logger.info(f"   Processed File: {output_path}      ")
        logger.info("=========================================")

    except Exception as e:
        logger.critical(f"Preprocessing pipeline failed: {e}")
        raise e


if __name__ == "__main__":
    run_preprocessing_pipeline()
