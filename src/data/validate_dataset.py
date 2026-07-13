import pandas as pd

required_columns = [
    "Winner",
    "R_fighter",
    "B_fighter",
    "date"
]

def validate_dataframe(df: pd.DataFrame) -> bool:
    """Validate that all required UFC columns exist in the dataframe."""
    print("\nVALIDATION RESULTS\n")

    all_columns_present = True
    for column in required_columns:
        if column in df.columns:
            print(f"{column} exists")
        else:
            print(f"{column} MISSING")
            all_columns_present = False

    return all_columns_present


if __name__ == "__main__":
    df = pd.read_csv("data/raw/original/ufc-master.csv")
    validate_dataframe(df)