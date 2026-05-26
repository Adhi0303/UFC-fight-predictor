# 🥊 UFC Fight Prediction Platform

An AI-powered UFC fight prediction platform featuring machine learning models, Monte Carlo simulation, and real-time odds integration.

![UFC Predictor](https://img.shields.io/badge/UFC-Predictor-red?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)

## 🌟 Features

### 🤖 Machine Learning
- **XGBoost Model** trained on 5,000+ UFC fights
- **Monte Carlo Simulation** (10,000 iterations per prediction)
- **Round-by-round predictions** with finish probabilities
- **Automated weekly retraining** via GitHub Actions

### 📊 Analytics
- **Method of Victory breakdown** (KO/TKO, Submission, Decision)
- **Advanced fighter metrics** (striking, grappling, cardio)
- **Round-by-round finish probability chart**
- **Historical fight analysis**

### 🎨 User Interface
- **UFC-themed design** with red/blue corner styling
- **Fighter roster** with 2,241+ fighters and images
- **Upcoming fight cards** with live odds integration
- **Responsive design** for mobile and desktop

### 🔄 Live Data
- **Real-time odds** from The Odds API
- **Upcoming UFC events** from ESPN API
- **Fighter statistics** from Kaggle dataset
- **Automated data updates**

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Adhi0303/UFC-fight-predictor.git
cd UFC-fight-predictor

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Option 1: Docker (Recommended)
docker-compose up -d

# Option 2: Manual Setup
# Backend
cd web_app/backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd web_app/frontend
npm install
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
UFC-fight-predictor/
├── web_app/
│   ├── backend/          # FastAPI backend
│   │   ├── main.py       # API endpoints
│   │   └── requirements.txt
│   └── frontend/         # React frontend
│       ├── src/
│       │   ├── components/
│       │   └── App.jsx
│       └── package.json
├── src/
│   ├── data/             # Data processing scripts
│   ├── models/           # ML model training
│   │   ├── train_xgboost.py
│   │   └── simulator.py  # Monte Carlo engine
│   └── features/         # Feature engineering
├── data/
│   ├── raw/              # Raw UFC data
│   └── processed/        # Cleaned datasets
├── models/               # Trained models
│   └── xgboost_model.pkl
├── .github/
│   └── workflows/
│       └── retrain.yml   # Automated retraining
├── docker-compose.yml
├── DEPLOYMENT.md         # Deployment guide
└── README.md
```

## 🎯 How It Works

### 1. Data Collection
- Historical UFC fight data from Kaggle
- Fighter statistics and records
- Real-time odds from bookmakers

### 2. Feature Engineering
- 50+ features per fighter
- Striking metrics (accuracy, volume, defense)
- Grappling stats (takedowns, submissions)
- Historical performance indicators

### 3. Model Training
- **XGBoost Classifier** for win probability
- **Monte Carlo Simulation** for outcome distribution
- Cross-validation and hyperparameter tuning
- Weekly automated retraining

### 4. Prediction Pipeline
```
User Input → Feature Extraction → XGBoost Model → Win Probability
                                                         ↓
                                              Monte Carlo Simulation
                                                         ↓
                                    Method Breakdown + Round Analysis
```

## 📊 Model Performance

- **Accuracy**: 67.3%
- **Precision**: 68.1%
- **Recall**: 66.8%
- **F1-Score**: 67.4%
- **ROC-AUC**: 0.73

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **XGBoost** - Gradient boosting ML model
- **Pandas/NumPy** - Data processing
- **Scikit-learn** - ML utilities
- **MLflow** - Experiment tracking

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Data visualization

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **DVC** - Data version control
- **Render/AWS** - Deployment

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

1. **Render.com** (Easiest - 5 minutes)
   ```bash
   # Push to GitHub, then connect to Render
   git push origin main
   ```

2. **Docker Compose** (Local/VPS)
   ```bash
   docker-compose up -d
   ```

3. **AWS** (Production)
   ```bash
   cd infrastructure/aws
   cdk deploy --all
   ```

## 🔑 API Keys Required

1. **The Odds API** - Get free key at https://the-odds-api.com
   - 500 requests/month free tier
   - Used for live betting odds

2. **Kaggle API** - Get token at https://www.kaggle.com/settings
   - Used for dataset updates
   - Required for automated retraining

Add to `.env`:
```env
ODDS_API_KEY=your_key_here
KAGGLE_API_TOKEN=your_token_here
```

## 📈 Roadmap

- [ ] Add fighter comparison tool
- [ ] Implement betting strategy simulator
- [ ] Add historical prediction accuracy tracking
- [ ] Create mobile app (React Native)
- [ ] Add user accounts and prediction history
- [ ] Integrate more data sources (Sherdog, Tapology)
- [ ] Add parlay calculator
- [ ] Implement A/B testing for model improvements

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for **educational and entertainment purposes only**. 

- Not financial advice
- Past performance doesn't guarantee future results
- Gambling can be addictive - please gamble responsibly
- Always verify predictions with your own research

## 🙏 Acknowledgments

- **UFC** for the amazing sport
- **Kaggle** for the dataset
- **The Odds API** for live odds data
- **ESPN** for upcoming fight information
- Open source community for amazing tools

## 📞 Contact

- **GitHub**: [@Adhi0303](https://github.com/Adhi0303)
- **Project Link**: https://github.com/Adhi0303/UFC-fight-predictor

## ⭐ Star History

If you find this project useful, please consider giving it a star!

---

**Made with ❤️ and 🥊 by fight fans, for fight fans**
