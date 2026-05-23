import pandas as pd
from src.utils.logger import setup_logger
import os

logger = setup_logger()

def generate_profile_report(df: pd.DataFrame, output_path: str = None) -> None:
    """Generates a simple profiling report of the given DataFrame.
    
    Args:
        df: Input pandas DataFrame to profile.
        output_path: Optional path to save the text report.
    """
    logger.info("Generating dataset profile report...")
    
    report_lines = []
    
    report_lines.append("="*50)
    report_lines.append("DATASET PROFILE REPORT")
    report_lines.append("="*50)
    
    # 1. Dataset Shape
    report_lines.append(f"\n1. Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    
    # 2. Missing Values Summary
    report_lines.append("\n2. Missing Values:")
    missing_data = df.isnull().sum()
    missing_data = missing_data[missing_data > 0].sort_values(ascending=False)
    if not missing_data.empty:
        for col, count in missing_data.items():
            report_lines.append(f"   - {col}: {count} ({round(count/len(df)*100, 2)}%)")
    else:
        report_lines.append("   - No missing values found.")
        
    # 3. Duplicates Summary
    if all(col in df.columns for col in ["R_fighter", "B_fighter", "date"]):
        duplicates = df.duplicated(subset=["R_fighter", "B_fighter", "date"]).sum()
        report_lines.append(f"\n3. Duplicate Fights Found: {duplicates}")
    else:
        report_lines.append("\n3. Duplicate Fights Found: Cannot check without R_fighter, B_fighter, and date columns.")
        
    # 4. Target Variable Class Balance
    if "Winner" in df.columns:
        report_lines.append("\n4. Target Variable (Winner) Distribution:")
        dist = df["Winner"].value_counts()
        for cls, count in dist.items():
            report_lines.append(f"   - {cls}: {count} ({round(count/len(df)*100, 2)}%)")
            
    # Combine lines
    report_text = "\n".join(report_lines)
    
    # Print to console/logger
    print(report_text)
    
    # Save to file if path provided
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            f.write(report_text)
        logger.info(f"Profile report saved to {output_path}")
        
if __name__ == "__main__":
    from src.data.load_dataset import load_raw_data
    try:
        df = load_raw_data()
        generate_profile_report(df, output_path="logs/raw_data_profile.txt")
    except Exception as e:
        logger.error(f"Failed to profile dataset: {e}")