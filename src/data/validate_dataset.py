import pandas as pd

required_columns = [
    "Winner",
    "R_fighter",
    "B_fighter",
    "date"
]

df = pd.read_csv(
    "data/raw/original/ufc-master.csv"
)

print("\nVALIDATION RESULTS\n")

for column in required_columns:

    if column in df.columns:
        print(f"{column} exists")

    else:
        print(f"{column} MISSING")