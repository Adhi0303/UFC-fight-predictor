import pandas as pd

required_columns = [
    "Winner",
    "R_fighter",
    "B_fighter",
    "date"
]

def validate_dataframe(df: pd.DataFrame) -> bool:
    print("\nVALIDATION RESULTS\n")

    is_valid = True
    for column in required_columns:
        if column in df.columns:
            print(f"{column} exists")
        else:
            print(f"{column} MISSING")
            is_valid = False

    return is_valid

if __name__ == "__main__":
    df = pd.read_csv("data/raw/original/ufc-master.csv")
    validate_dataframe(df)