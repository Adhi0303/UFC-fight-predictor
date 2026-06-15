import pandas as pd
import os

project_root = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(project_root, "data", "processed", "ufc-cleaned.csv")

df = pd.read_csv(data_path)
df['date'] = pd.to_datetime(df['date'])

# Drop all 2026 fights
original_len = len(df)
df = df[df['date'].dt.year < 2026]
new_len = len(df)

print(f"Removed {original_len - new_len} backfilled fights.")
df.to_csv(data_path, index=False)
