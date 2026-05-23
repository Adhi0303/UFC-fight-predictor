import os
import pandas as pd
from src.utils.logger import setup_logger
from src.utils.config_loader import load_config

logger = setup_logger()

def load_raw_data(file_path: str = None) -> pd.DataFrame:
    """Loads raw UFC fight data from CSV file.

    Args:
        file_path: Path to the raw CSV file. If None, it resolves using paths.yaml.

    Returns:
        pd.DataFrame: Loaded dataset.
    """
    if file_path is None:
        try:
            paths = load_config("configs/paths.yaml")
            raw_dir = paths["data"]["raw"]
            file_path = os.path.join(raw_dir, "original", "ufc-master.csv")
        except Exception as e:
            logger.error(f"Failed to load paths config: {e}")
            # Fallback to default relative path
            file_path = "data/raw/original/ufc-master.csv"

    logger.info(f"Attempting to load raw dataset from: {file_path}")

    if not os.path.exists(file_path):
        error_msg = f"Raw dataset file not found at: {file_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    try:
        df = pd.read_csv(file_path)
        logger.info(f"Successfully loaded raw dataset. Shape: {df.shape}")
        return df
    except Exception as e:
        logger.error(f"Failed to read CSV file: {e}")
        raise e

if __name__ == "__main__":
    try:
        df = load_raw_data()
        print("\n--- Raw Dataset Loaded Successfully ---")
        print(f"Shape: {df.shape}")
        print("\nFirst 5 rows:")
        print(df.head())
    except Exception as e:
        print(f"Error loading dataset: {e}")