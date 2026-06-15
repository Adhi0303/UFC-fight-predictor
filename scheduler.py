import schedule
import time
import subprocess
import os
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Scheduler")

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

def run_data_poller():
    logger.info("Running Data Poller...")
    script_path = os.path.join(PROJECT_ROOT, "src", "data", "poll_results.py")
    try:
        result = subprocess.run(["python", script_path], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info("Data Poller completed successfully.")
            logger.info(result.stdout)
        else:
            logger.error("Data Poller failed.")
            logger.error(result.stderr)
    except Exception as e:
        logger.error(f"Error executing Data Poller: {e}")

def run_model_retraining():
    logger.info("Running XGBoost Model Retraining...")
    script_path = os.path.join(PROJECT_ROOT, "src", "models", "train_xgboost.py")
    try:
        result = subprocess.run(["python", script_path], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info("Model Retraining completed successfully.")
            logger.info(result.stdout)
        else:
            logger.error("Model Retraining failed.")
            logger.error(result.stderr)
    except Exception as e:
        logger.error(f"Error executing Model Retraining: {e}")

if __name__ == "__main__":
    logger.info("Starting UFC MLOps Scheduler...")
    
    # Run data poller every day at 2:00 AM (to catch completed events)
    schedule.every().day.at("02:00").do(run_data_poller)
    
    # Run model retraining every 20 days at 3:00 AM
    schedule.every(20).days.at("03:00").do(run_model_retraining)
    
    # For testing, we can run them once on startup if you uncomment below:
    # run_data_poller()
    
    logger.info("Scheduler is running. Waiting for jobs...")
    while True:
        schedule.run_pending()
        time.sleep(60)
