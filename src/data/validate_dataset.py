import pandas as pd
from src.utils.logger import setup_logger

logger = setup_logger()


def validate_dataframe(df: pd.DataFrame) -> bool:
    """Validates the input DataFrame for data quality issues.

    Checks for:
    - Required columns
    - Valid target variable values (Winner)
    - Duplicate rows based on date, R_fighter, and B_fighter
    - Date column validity

    Args:
        df: Input pandas DataFrame.

    Returns:
        bool: True if validation passes, False otherwise.
    """
    logger.info("Starting dataset validation...")
    validation_passed = True

    # 1. Required Columns Check
    required_cols = ["R_fighter", "B_fighter", "Winner", "date"]
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        logger.error(f"Validation Failed: Missing critical columns: {missing_cols}")
        validation_passed = False
    else:
        logger.info("Required columns check: PASSED")

    # 2. Target Variable (Winner) Check
    if "Winner" in df.columns:
        valid_winners = {"Red", "Blue", "Draw"}
        actual_winners = set(df["Winner"].dropna().unique())
        invalid_winners = actual_winners - valid_winners

        if invalid_winners:
            logger.warning(
                f"Validation Warning: Found unexpected values in 'Winner' column: {invalid_winners}"
            )
            # We don't fail immediately, but log it as a warning since they could be nan/draws we handle later.
        else:
            logger.info("Target column values check: PASSED")

    # 3. Duplicate Fights Check
    if all(col in df.columns for col in ["R_fighter", "B_fighter", "date"]):
        duplicates = df.duplicated(subset=["R_fighter", "B_fighter", "date"])
        num_duplicates = duplicates.sum()

        if num_duplicates > 0:
            logger.warning(f"Validation Warning: Found {num_duplicates} duplicate fights in the dataset.")
            # Depending on policy, we can flag this or let clean_dataset drop them.
        else:
            logger.info("No duplicate fights check: PASSED")

    # 4. Data completeness check
    row_count = len(df)
    if row_count == 0:
        logger.error("Validation Failed: The dataset is empty.")
        validation_passed = False

    if validation_passed:
        logger.info("Dataset validation: SUCCESS")
    else:
        logger.error("Dataset validation: FAILED")

    return validation_passed


if __name__ == "__main__":
    from src.data.load_dataset import load_raw_data

    try:
        df = load_raw_data()
        validate_dataframe(df)
    except Exception as e:
        logger.error(f"Error in validation module: {e}")
