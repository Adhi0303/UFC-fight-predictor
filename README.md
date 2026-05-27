<div align="center">
  <img src="docs/ufc_logo.png" width="200" alt="UFC Logo" />
  <h1>Ultimate UFC Fight Predictor</h1>
  <p><strong>A State-of-the-Art Machine Learning & Monte Carlo Simulation Engine for MMA</strong></p>
</div>

---

## 🥊 Overview

The **Ultimate UFC Fight Predictor** is a highly advanced, open-source web application designed to predict the outcomes of Mixed Martial Arts (MMA) fights. It moves beyond simple "who will win" predictions by utilizing historical fighter statistics, advanced machine learning (XGBoost), and a robust **Monte Carlo Simulator** to predict the exact method, round, and time a fight will end.

The project features a sleek, cinematic, and fully responsive user interface built with modern web technologies, providing an immersive experience reminiscent of an official UFC broadcast.

🔗 **Live Demo:** [UFC Predictor on Vercel](https://ufc-fight-predictor-xkwl.vercel.app/)

## 🧠 How It Works (The Workflow)

This project is broken down into a robust data pipeline and a high-performance serving architecture:

1. **Data Collection & Processing:**
   * Fighter statistics, historical fight records, and Vegas odds are ingested using customized web scrapers and API aggregators (e.g., ESPN UFC data).
   * The data is cleaned, validated, and normalized to ensure statistical parity between fighters across different weight classes.

2. **Machine Learning Model (XGBoost):**
   * At its core, the prediction engine uses an **XGBoost Classifier**.
   * It analyzes hundreds of feature combinations (Striking differential, Takedown defense, Age, Reach advantage, Activity rates, etc.) to output a highly calibrated baseline Win/Loss probability for any given matchup.

3. **Monte Carlo Simulation Engine:**
   * Once the baseline probability is established, the application runs **10,000 independent Monte Carlo simulations** for the selected fight.
   * By sampling from historical finish distributions (KOs, Submissions, Decisions) and applying the fighters' specific finishing rates (e.g., a fighter with an 80% KO rate is heavily weighted toward KO finishes in the simulation), the engine calculates the exact likelihood of:
     * The Method of Victory (KO/TKO, Submission, Decision)
     * The specific Round the fight will end.
     * The specific Time the finish will occur.

4. **Web Application Architecture:**
   * **Backend:** A high-speed **FastAPI** server running in Python, optimized for rapid mathematical simulations and serving predictions via REST endpoints.
   * **Frontend:** A rich **React.js** interface built with **Vite** and **TailwindCSS**. It utilizes `framer-motion` for dynamic, scroll-triggered animations and `recharts` for interactive data visualizations (like Fighter Matchup Radar Charts and Probability Bars).

## 📊 Results & Accuracy

During rigorous backtesting on historical UFC data (hold-out test sets), the XGBoost model achieved a baseline prediction accuracy of **~67%**, which is exceptionally competitive in the highly volatile sport of MMA (where average betting favorites win ~64% of the time).

**Model Highlights:**
* Excellent calibration on heavily favored fighters.
* The Monte Carlo engine accurately mimics real-world UFC finish distributions, producing incredibly realistic Round and Method probabilities that align closely with Vegas prop betting lines.

## 🚀 How to Download & Run Locally

Want to run the simulations on your own machine? It's easy to get started. 

### Prerequisites
* Python 3.9+
* Node.js v18+

### 1. Clone the Repository
```bash
git clone https://github.com/Adhi0303/UFC-fight-predictor.git
cd UFC-fight-predictor
```

### 2. Start the FastAPI Backend
```bash
# Navigate to the backend directory
cd web_app/backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```
*The backend will now be running on `http://localhost:8000`*

### 3. Start the React Frontend
Open a **new terminal window** and run:
```bash
# Navigate to the frontend directory
cd web_app/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The web app will now be accessible at `http://localhost:5173`*

## 🤝 Contributing
Contributions are always welcome! Whether you want to improve the XGBoost model's accuracy, add new statistical visualizers to the React frontend, or integrate live odds APIs, feel free to fork this repository and submit a Pull Request.

## 📄 License
This project is open-source and available under the MIT License.
