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

## ✅ Phase 2: Feature Engineering (Completed)
**Goal:** Transform raw data into intelligent, predictive features.
* [x] **2.1 Differential Features (`build_features.py`):** Code features that compare fighters (e.g., `reach_diff = R_reach - B_reach`, `age_diff`).
* [x] **2.2 Target Encoding (`build_features.py`):** Convert the "Winner" column (Red/Blue) into numerical values (1/0).
* [x] **2.3 Categorical Encoding (`build_features.py`):** Convert categorical data like `Stance` or `weight_class` into numeric representations (One-Hot Encoding).
* [x] **2.4 Leakage Prevention Check:** Drop columns that contain post-fight information (like `finish_method` or `rounds_fought`).
> **💡 What you learned:** Matchups matter most. Differential features capture relative advantages. Dropping post-fight stats prevents "Data Leakage" where the model implicitly cheats by looking at the future.

---

## ✅ Phase 3: Exploratory Data Analysis (EDA) (Completed)
**Goal:** Discover patterns and correlations visually.
* [x] **3.1 Distribution Analysis (`notebooks/eda.ipynb`):** Plot age distributions, reach advantages, and their impact on win rates.
* [x] **3.2 Correlation Mapping (`notebooks/eda.ipynb`):** Build a heatmap to see which features correlate most strongly with winning.
* [x] **3.3 Model Visualization (`notebooks/model_comparison.ipynb`):** Visualized 2D decision boundaries to compare linear vs. non-linear models.
> **💡 What you learned:** Visualizing data highlights major relationships (like Vegas odds and age gaps being highly correlated with win rate) and illustrates how different algorithms carve out decision boundaries.

---

## ✅ Phase 4: Baseline Machine Learning Models (Completed)
**Goal:** Train our first real ML models to establish a performance benchmark.
* [x] **4.1 Train/Test Split (`train_baselines.py`):** Split the data chronologically (train on pre-2023 fights, test on 2023+).
* [x] **4.2 Train Logistic Regression (`train_baselines.py`):** Train a simple linear classifier (Baseline Accuracy: 66.38%).
* [x] **4.3 Train Baseline Random Forest (`train_baselines.py`):** Train an ensemble of decision trees (Baseline Accuracy: 68.57%).
> **💡 What you learned:** Temporal (chronological) splitting is critical for sports datasets to avoid look-ahead bias. Baselines give you a baseline metric to beat.

---

## ✅ Phase 5: Advanced Modeling (Boosting) (Completed)
**Goal:** Train production-grade, state-of-the-art tabular ML models.
* [x] **5.1 Train XGBoost Model (`train_xgboost.py`):** Implement the XGBoost algorithm.
* [x] **5.2 Hyperparameter Tuning (`train_xgboost.py`):** Use Grid Search to find the best model parameters (Final Accuracy: 68.02%).
> **💡 What you learned:** Grid Search automatically tests recipes of parameters. XGBoost sequentially trains trees to fix errors. Tuning defensively prevents overfitting on chaotic data.

---

## ✅ Phase 6: Model Evaluation & Explainability (Completed)
**Goal:** Grade the model and understand *why* it makes its predictions.
* [x] **6.1 Advanced Metrics (`evaluate.py` / notebooks):** Calculated Accuracy, Precision, Recall, ROC-AUC, and Confusion Matrix. Discovered the 72% precision "Underdog Signal".
* [x] **6.2 Explainability with SHAP (`evaluate.py` / notebooks):** Generated feature importance charts and SHAP values to explain predictions.

---

## ✅ Phase 7: Simulation Engine (Completed)
**Goal:** Build a Monte Carlo simulator to run fights 10,000 times based on model probabilities.
* [x] **7.1 Fighter Profiles (`simulator.py`):** Parsed historical stats from `ufc-cleaned.csv` to build fighter data objects.
* [x] **7.2 Monte Carlo Physics (`simulator.py`):** Built random number generation to simulate finishes (KOs/Submissions) vs Decisions.
* [x] **7.3 Performance Optimization:** Engineered the simulator to run 10,000 runs in RAM under 100ms.
> **💡 What you learned:** Probabilities aren't destinies. A 60% win chance means out of 10,000 simulated fights, the fighter wins 6,000 times. Simulating this helps visualize the variance and risk.

---

## ⏳ Phase 8: Web Application (Up Next)
**Goal:** Build the frontend and backend to interact with the model.
* [ ] **8.1 Backend API (FastAPI):** Create API endpoints to serve fighter data and run simulations on demand.
* [ ] **8.2 Frontend UI (React/Tailwind):** Build the "Vegas Sportsbook" style dashboard to display predictions and simulations.

---

## 🚀 Phase 9: Future Enhancements (MLOps & Tuning)
**Goal:** Take the project to a production-grade level (Planned for later).
* [ ] **9.1 Advanced Tuning & Features:** ELO ratings and extensive hyperparameter tuning.
* [ ] **9.2 CI/CD & Automation:** Automated data scraping and model retraining on weekly schedules.

---

**How to use this tracker:**
Whenever we start a new coding session, tell me (the agent) which task from this list we are working on. I will write the code for that specific task, explain the ML concepts behind it, and check it off the list once you understand it!
