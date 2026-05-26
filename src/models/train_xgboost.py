import pandas as pd
import numpy as np
import mlflow
import mlflow.xgboost
from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score, log_loss
from src.utils.logger import setup_logger
import os
import joblib

logger = setup_logger()

def load_and_split_data(filepath: str = "data/processed/ufc-ml-features.csv"):
    """
    Loads features and strictly splits chronologically at 2023.
    """
    logger.info(f"Loading features from {filepath}...")
    df = pd.read_csv(filepath)
    
    # Ensure date is datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Chronological Split (No time-traveling!)
    train_df = df[df['date'] < '2023-01-01'].copy()
    test_df = df[df['date'] >= '2023-01-01'].copy()
    
    # Drop columns that algorithms cannot read (strings/dates)
    cols_to_drop = ['date', 'R_fighter', 'B_fighter']
    
    X_train = train_df.drop(columns=cols_to_drop + ['Winner'])
    y_train = train_df['Winner']
    
    X_test = test_df.drop(columns=cols_to_drop + ['Winner'])
    y_test = test_df['Winner']
    
    logger.info(f"Training on {len(X_train)} fights (Before 2023).")
    logger.info(f"Testing on {len(X_test)} fights (2023 onwards).")
    
    return X_train, X_test, y_train, y_test, X_train.columns

def train_xgboost():
    """
    Trains an XGBoost model using GridSearchCV for hyperparameter tuning.
    """
    X_train, X_test, y_train, y_test, feature_names = load_and_split_data()
    
    logger.info("Starting XGBoost Hyperparameter Tuning (Grid Search)...")
    logger.info("This will train dozens of models to find the perfect combination. Please wait.")
    
    # 1. Define the Base Model
    # eval_metric='logloss' suppresses an xgboost warning
    xgb = XGBClassifier(eval_metric='logloss', random_state=42)
    
    # 2. Define the Grid (The "Settings" we want to test)
    # To keep runtime reasonable, we use a small grid. 
    # In a massive Kaggle competition, you might test hundreds of combinations!
    param_grid = {
        'n_estimators': [50, 100, 200],      # How many trees to build
        'max_depth': [3, 5, 7],              # How deep the trees can go (complexity)
        'learning_rate': [0.01, 0.1, 0.2]    # How fast the model learns from mistakes
    }
    
    # 3. Initialize GridSearchCV
    # cv=3 means it validates 3 times internally.
    # Total models trained = 3 (n_estimators) * 3 (max_depth) * 3 (learning_rate) * 3 (cv) = 81 models!
    grid_search = GridSearchCV(
        estimator=xgb,
        param_grid=param_grid,
        scoring='accuracy',
        n_jobs=-1,
        cv=3,
        verbose=1
    )
    
    # Start MLflow tracking run
    with mlflow.start_run(run_name="XGBoost_Tuned"):
        # 4. Fit the grid search
        grid_search.fit(X_train, y_train)
        
        # 5. Extract the BEST model from the grid
        best_model = grid_search.best_estimator_
        
        logger.info(f"Grid Search Complete! Best parameters found:")
        logger.info(f"{grid_search.best_params_}")
        
        # 6. Evaluate the Best Model on our test set
        y_pred = best_model.predict(X_test)
        y_prob = best_model.predict_proba(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        loss = log_loss(y_test, y_prob)
        
        logger.info(f"[XGBoost Tuned] Accuracy: {acc:.4f} | Log Loss: {loss:.4f}")
        
        # 7. Extract Feature Importances (What did the model care about?)
        importances = best_model.feature_importances_
        feature_importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': importances
        }).sort_values(by='Importance', ascending=False)
        
        logger.info("\nTop 5 Most Important Features:")
        logger.info(f"\n{feature_importance_df.head(5)}")
        
        # 8. Log Everything to MLflow
        # Log Best Parameters
        mlflow.log_params(grid_search.best_params_)
        
        # Log Final Metrics
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("log_loss", loss)
        
        # Save feature importances to a local CSV so MLflow can track the file
        os.makedirs("data/processed", exist_ok=True)
        feature_importance_df.to_csv("data/processed/xgb_feature_importances.csv", index=False)
        
        # Save the best model to disk
        os.makedirs("models", exist_ok=True)
        joblib.dump(best_model, "models/xgboost_model.pkl")
        
        logger.info("Logged XGBoost tuning results and feature importances to MLflow!")

if __name__ == "__main__":
    train_xgboost()
