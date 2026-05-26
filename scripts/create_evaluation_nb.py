import json
import os

def create_evaluation_nb():
    notebook = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# Phase 6: Model Evaluation & Explainability\n",
                    "\n",
                    "In this notebook, we will evaluate our final tuned XGBoost model using:\n",
                    "1. **Confusion Matrix Heatmap** - To see where the model makes correct/incorrect predictions.\n",
                    "2. **ROC-AUC Curve** - To measure classification power across all probability thresholds.\n",
                    "3. **SHAP Summary Plot** - To explain which features influence predictions the most and how."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "import pandas as pd\n",
                    "import numpy as np\n",
                    "import matplotlib.pyplot as plt\n",
                    "import seaborn as sns\n",
                    "from xgboost import XGBClassifier\n",
                    "from sklearn.metrics import (\n",
                    "    accuracy_score, log_loss, confusion_matrix, classification_report,\n",
                    "    roc_curve, auc, precision_recall_curve\n",
                    ")\n",
                    "import shap\n",
                    "import os\n",
                    "import warnings\n",
                    "warnings.filterwarnings('ignore')\n",
                    "\n",
                    "# Fix working directory if run inside notebooks/\n",
                    "if os.path.basename(os.getcwd()) == 'notebooks':\n",
                    "    os.chdir('..')\n",
                    "print(f\"Current Working Directory: {os.getcwd()}\")\n",
                    "\n",
                    "# Use default style\n",
                    "sns.set_theme(style=\"whitegrid\")"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Load processed features\n",
                    "print(\"Loading features...\")\n",
                    "df = pd.read_csv(\"data/processed/ufc-ml-features.csv\")\n",
                    "df['date'] = pd.to_datetime(df['date'])\n",
                    "\n",
                    "# Chronological split (Training: pre-2023, Test: 2023+)\n",
                    "train_df = df[df['date'] < '2023-01-01'].copy()\n",
                    "test_df = df[df['date'] >= '2023-01-01'].copy()\n",
                    "\n",
                    "cols_to_drop = ['date', 'R_fighter', 'B_fighter']\n",
                    "\n",
                    "X_train = train_df.drop(columns=cols_to_drop + ['Winner'])\n",
                    "y_train = train_df['Winner']\n",
                    "\n",
                    "X_test = test_df.drop(columns=cols_to_drop + ['Winner'])\n",
                    "y_test = test_df['Winner']\n",
                    "\n",
                    "print(f\"Train set: {X_train.shape[0]} fights\")\n",
                    "print(f\"Test set: {X_test.shape[0]} fights\")"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Train the final model with best hyperparameters\n",
                    "best_params = {'learning_rate': 0.01, 'max_depth': 3, 'n_estimators': 200}\n",
                    "print(\"Training final tuned XGBoost model...\")\n",
                    "model = XGBClassifier(eval_metric='logloss', random_state=42, **best_params)\n",
                    "model.fit(X_train, y_train)\n",
                    "\n",
                    "# Predict\n",
                    "y_pred = model.predict(X_test)\n",
                    "y_prob = model.predict_proba(X_test)[:, 1]\n",
                    "\n",
                    "print(f\"Accuracy: {accuracy_score(y_test, y_pred):.4f}\")\n",
                    "print(f\"Log Loss: {log_loss(y_test, model.predict_proba(X_test)):.4f}\")"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 1. Confusion Matrix Heatmap\n",
                    "\n",
                    "Let's see where the model gets confused:"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "cm = confusion_matrix(y_test, y_pred)\n",
                    "labels = ['Blue Wins (0)', 'Red Wins (1)']\n",
                    "\n",
                    "plt.figure(figsize=(7, 5))\n",
                    "sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)\n",
                    "plt.title('Confusion Matrix - UFC XGBoost Model')\n",
                    "plt.xlabel('Predicted Label')\n",
                    "plt.ylabel('True Label')\n",
                    "os.makedirs(\"docs\", exist_ok=True)\n",
                    "plt.savefig('docs/confusion_matrix.png', bbox_inches='tight')\n",
                    "plt.show()\n",
                    "\n",
                    "print(classification_report(y_test, y_pred, target_names=labels))"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 2. ROC Curve & AUC Score"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "fpr, tpr, thresholds = roc_curve(y_test, y_prob)\n",
                    "roc_auc = auc(fpr, tpr)\n",
                    "\n",
                    "plt.figure(figsize=(7, 5))\n",
                    "plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')\n",
                    "plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')\n",
                    "plt.xlim([0.0, 1.0])\n",
                    "plt.ylim([0.0, 1.05])\n",
                    "plt.xlabel('False Positive Rate (FPR)')\n",
                    "plt.ylabel('True Positive Rate (TPR)')\n",
                    "plt.title('ROC Curve - UFC XGBoost Model')\n",
                    "plt.legend(loc=\"lower right\")\n",
                    "plt.savefig('docs/roc_curve.png', bbox_inches='tight')\n",
                    "plt.show()"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 3. SHAP Explainability Summary Plot"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Initialize SHAP TreeExplainer\n",
                    "print(\"Calculating SHAP values...\")\n",
                    "explainer = shap.TreeExplainer(model)\n",
                    "shap_values = explainer(X_test)\n",
                    "\n",
                    "# Plot summary plot\n",
                    "plt.figure(figsize=(10, 8))\n",
                    "shap.summary_plot(shap_values, X_test, show=False)\n",
                    "plt.title(\"SHAP Feature Importance Summary - UFC XGBoost\", fontsize=14)\n",
                    "plt.tight_layout()\n",
                    "plt.savefig('docs/shap_summary.png', bbox_inches='tight')\n",
                    "plt.show()"
                ]
            }
        ],
        "metadata": {},
        "nbformat": 4,
        "nbformat_minor": 2
    }
    
    os.makedirs("notebooks", exist_ok=True)
    with open("notebooks/model_evaluation.ipynb", "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=2)
    print("Successfully created notebooks/model_evaluation.ipynb")

if __name__ == "__main__":
    create_evaluation_nb()
