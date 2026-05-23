# UFC AI Platform - Learning Modules & Task Tracker

This document breaks down the entire UFC fight prediction project into bite-sized, trackable tasks. Since your main goal is to **learn and understand how Machine Learning models are built and how they work**, each phase is divided into small steps. 

For each step, we highlight **what you are learning** and **what code is being written**, so you can follow along as the AI agent writes it.

---

## ✅ Phase 0: Project Foundation (Completed)
**Goal:** Set up a professional ML engineering environment.
* [x] **0.1 Initialize Repository:** Set up Git, virtual environment, and folder structure.
* [x] **0.2 Configure MLOps:** Set up MLflow for experiment tracking, and DVC for data versioning.
* [x] **0.3 Create Configurations:** Build `paths.yaml` and `logging.yaml` for a config-driven architecture.
> **💡 What you learned:** Real-world ML isn't just a Jupyter notebook. It requires proper project structures, environment isolation, and tracking tools (MLOps) to ensure reproducibility.

---

## ✅ Phase 1: Data Engineering (Completed)
**Goal:** Ingest, clean, and validate raw UFC data.
* [x] **1.1 Data Loading (`load_dataset.py`):** Write a script to safely load the raw CSV data.
* [x] **1.2 Data Profiling (`profile_dataset.py`):** Automatically check data shapes, missing values, and target distributions.
* [x] **1.3 Data Validation (`validate_dataset.py`):** Ensure critical columns like `Winner` and `date` exist and are valid.
* [x] **1.4 Data Cleaning (`clean_dataset.py`):** Handle missing values (e.g., fill missing heights with medians), remove duplicates, and standardize stances.
* [x] **1.5 Pipeline Orchestration (`save_processed_data.py`):** Tie it all together to output `ufc-cleaned.csv`.
> **💡 What you learned:** "Garbage in, garbage out." The data engineering phase is about ensuring the data fed into the ML model is high quality, consistent, and missing values are handled logically (like using weight-class medians for missing heights).

---

## ⏳ Phase 2: Feature Engineering (Next Up)
**Goal:** Transform raw data into intelligent, predictive features. *This is where the real "intelligence" happens!*
* [x] **2.1 Differential Features (`build_features.py`):** Code features that compare fighters (e.g., `reach_diff = R_reach - B_reach`, `age_diff`).
  * *Learning concept:* Fights are matchups. The model learns better from relative advantages than raw numbers.
* [x] **2.2 Target Encoding (`build_features.py`):** Convert the "Winner" column (Red/Blue/Draw) into numerical values (1/0).
  * *Learning concept:* ML models only understand numbers. We have to map text categories to binary outcomes for classification.
* [x] **2.3 Categorical Encoding (`build_features.py`):** Convert categorical data like `Stance` or `weight_class` into numeric representations (One-Hot Encoding).
  * *Learning concept:* Transforming text properties into separate binary columns so the model can process them mathematically.
* [x] **2.4 Leakage Prevention Check:** Drop columns that contain post-fight information (like `finish_method` or `rounds_fought`).
  * *Learning concept:* "Data Leakage" is when you accidentally feed the model information from the future that it wouldn't know before the fight begins. This makes models look 100% accurate in testing but fail in reality.

---

## ⏳ Phase 3: Exploratory Data Analysis (EDA)
**Goal:** Discover patterns and correlations visually.
* [ ] **3.1 Distribution Analysis (`notebooks/eda.ipynb`):** Plot age distributions, reach advantages, and their impact on win rates.
  * *Learning concept:* Understanding the statistical realities of the sport (e.g., does a 5+ year age gap drastically reduce win probability?).
* [ ] **3.2 Correlation Mapping (`notebooks/eda.ipynb`):** Build a heatmap to see which features correlate most strongly with winning.
  * *Learning concept:* Identifying which variables naturally influence the target variable, which helps guide what features to keep or drop.

---

## ⏳ Phase 4: Baseline Machine Learning Models
**Goal:** Train our first real ML models to establish a performance benchmark.
* [ ] **4.1 Train/Test Split (`train_baselines.py`):** Split the data chronologically (e.g., train on fights before 2023, test on 2023-2024).
  * *Learning concept:* "Temporal splitting". In time-series or sports data, you must test on the future, not random samples from the past, to mimic real-world deployment.
* [ ] **4.2 Train Logistic Regression (`train_baselines.py`):** Train a simple linear classifier.
  * *Learning concept:* Logistic Regression acts as a baseline. It draws a straight line (decision boundary) through data and predicts probabilities. 
* [ ] **4.3 Train Baseline Random Forest (`train_baselines.py`):** Train an ensemble of decision trees.
  * *Learning concept:* Random Forests can learn non-linear patterns (e.g., "age matters more for flyweights than heavyweights") by having many decision trees vote on the outcome.

---

## ⏳ Phase 5: Advanced Modeling (Boosting)
**Goal:** Train production-grade, state-of-the-art tabular ML models.
* [ ] **5.1 Train XGBoost Model (`train_model.py`):** Implement the XGBoost algorithm.
  * *Learning concept:* "Gradient Boosting". Unlike Random Forest which builds trees independently, XGBoost builds trees sequentially—each new tree tries to fix the mistakes of the previous tree.
* [ ] **5.2 Hyperparameter Tuning (`train_model.py`):** Use Grid Search or Random Search to find the best model parameters.
  * *Learning concept:* Finding the sweet spot between "underfitting" (model is too simple) and "overfitting" (model memorizes the training data but fails on new data).

---

## ⏳ Phase 6: Model Evaluation & Explainability
**Goal:** Grade the model and understand *why* it makes its predictions.
* [ ] **6.1 Advanced Metrics (`evaluate.py`):** Calculate Accuracy, Precision, Recall, ROC-AUC, and Log-Loss.
  * *Learning concept:* Accuracy isn't everything. ROC-AUC measures how well the model ranks winners, and Log-Loss measures how confident and trustworthy the predicted probabilities are.
* [ ] **6.2 Explainability with SHAP (`evaluate.py` / notebooks):** Generate feature importance charts and SHAP values for specific fights.
  * *Learning concept:* Breaking the "black box." SHAP explains exactly how much each feature (like a reach advantage) pushed the final probability up or down for a specific prediction.

---

## ⏳ Phases 7-9: Deployment & Visualization (Future)
*Once the core ML engine is built, we will break down the simulation engine (Monte Carlo), the FastAPI backend, and the Streamlit frontend dashboard into trackable tasks here.*

---

**How to use this tracker:**
Whenever we start a new coding session, tell me (the agent) which task from this list we are working on. I will write the code for that specific task, explain the ML concepts behind it, and check it off the list once you understand it!
