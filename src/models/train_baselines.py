import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, log_loss, roc_auc_score
import mlflow
import mlflow.sklearn
from src.utils.logger import setup_logger

logger = setup_logger()

# =========================================================================
# ML CONCEPT: EXPERIMENT TRACKING (MLOPS)
# =========================================================================
# MLflow is our experiment tracker. It will automatically log our parameters,
# metrics, and trained models into a local 'mlruns' folder by default.

def load_and_split_data(filepath: str = "data/processed/ufc-ml-features.csv"):
    """
    Loads the ML-ready dataset and performs a CHRONOLOGICAL train/test split.
    """
    logger.info(f"Loading features from {filepath}...")
    df = pd.read_csv(filepath)
    
    # 1. Convert 'date' back to datetime format so we can split on it
    df['date'] = pd.to_datetime(df['date'])
    
    # =========================================================================
    # ML CONCEPT: TEMPORAL (CHRONOLOGICAL) TRAIN-TEST SPLIT
    # =========================================================================
    # In sports, we can't randomly mix fights from 2024 into the training data
    # and try to predict a fight from 2015. That is "time travel" (Data Leakage).
    # We must train on the PAST, and test on the FUTURE.
    # We will train on everything before 2023, and test on 2023 onwards.
    
    split_date = pd.to_datetime("2023-01-01")
    
    train_df = df[df['date'] < split_date].copy()
    test_df = df[df['date'] >= split_date].copy()
    
    logger.info(f"Training on {len(train_df)} fights (Before 2023).")
    logger.info(f"Testing on {len(test_df)} fights (2023 onwards).")
    
    # 2. Separate our Target Variable (Y) from our Features (X)
    y_train = train_df['Winner']
    y_test = test_df['Winner']
    
    # 3. Drop metadata columns from X because the model cannot train on names/dates
    drop_cols = ['Winner', 'date', 'R_fighter', 'B_fighter']
    X_train = train_df.drop(columns=drop_cols)
    X_test = test_df.drop(columns=drop_cols)
    
    return X_train, X_test, y_train, y_test


def evaluate_and_log_model(model, model_name, X_train, X_test, y_train, y_test):
    """
    Trains a given model, evaluates it, and logs everything to MLflow.
    """
    # Start an MLflow tracking run
    with mlflow.start_run(run_name=model_name):
        logger.info(f"Training {model_name}...")
        
        # 1. Train the model
        model.fit(X_train, y_train)
        
        # 2. Make Predictions
        # .predict() outputs exactly 1 or 0 (Red or Blue)
        predictions = model.predict(X_test)
        # .predict_proba() outputs the PROBABILITY [0.4, 0.6] (40% Blue, 60% Red)
        probabilities = model.predict_proba(X_test)[:, 1] # Probability of Red (1) winning
        
        # 3. Calculate Metrics
        # Accuracy: % of correct predictions
        accuracy = accuracy_score(y_test, predictions)
        # Log Loss: Measures how confident the model is (lower is better)
        loss = log_loss(y_test, probabilities)
        
        logger.info(f"[{model_name}] Accuracy: {accuracy:.4f} | Log Loss: {loss:.4f}")
        
        # 4. Log to MLflow
        # Log the hyperparameters used
        mlflow.log_params(model.get_params())
        
        # Log the metrics we care about
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("log_loss", loss)
        
        # Save the actual trained model file into MLflow!
        # (Commented out temporarily to avoid local artifact store URI errors)
        # mlflow.sklearn.log_model(model, "model")
        logger.info(f"Logged {model_name} to MLflow.\n")


def train_baselines():
    # Load and split
    X_train, X_test, y_train, y_test = load_and_split_data()
    
    # =========================================================================
    # BASELINE 1: LOGISTIC REGRESSION
    # =========================================================================
    # Logistic Regression is a simple, linear model. It tries to draw a straight
    # line to separate Red winners from Blue winners. It's a great baseline!
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    evaluate_and_log_model(lr_model, "Logistic_Regression_Baseline", X_train, X_test, y_train, y_test)
    
    # =========================================================================
    # BASELINE 2: RANDOM FOREST
    # =========================================================================
    # Random Forest is an ensemble of Decision Trees. It can learn non-linear
    # relationships (e.g. "Reach matters more if you are a heavyweight").
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    evaluate_and_log_model(rf_model, "Random_Forest_Baseline", X_train, X_test, y_train, y_test)


if __name__ == "__main__":
    train_baselines()
    logger.info("Baseline training complete! Run 'mlflow ui' in your terminal to see the results.")