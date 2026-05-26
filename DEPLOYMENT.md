# UFC Fight Prediction Platform - Deployment Guide

## 🚀 Deployment Options

This guide covers **3 deployment strategies** from easiest to most scalable:

1. **Quick Deploy (Render)** - Free tier, 5 minutes setup
2. **AWS Deployment** - Production-ready, scalable
3. **Docker + Cloud** - Containerized, portable

---

## Option 1: Quick Deploy with Render (Recommended for MVP)

### ✅ Pros
- **Free tier available**
- **Zero DevOps knowledge required**
- **Auto-deploy from GitHub**
- **Built-in SSL certificates**
- **5-minute setup**

### 📋 Prerequisites
- GitHub account
- Render account (free): https://render.com

### 🔧 Setup Steps

#### 1. Prepare Your Repository

Ensure these files exist (already created in this guide):
- `render.yaml` - Render configuration
- `web_app/backend/requirements.txt` - Python dependencies
- `web_app/frontend/package.json` - Node dependencies

#### 2. Push to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

#### 3. Deploy on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select `UFC-fight-predictor` repository
5. Render will auto-detect `render.yaml` and create:
   - **Backend service** (FastAPI)
   - **Frontend service** (React/Vite)
   - **PostgreSQL database** (optional, for future features)

#### 4. Configure Environment Variables

In Render Dashboard → Backend Service → Environment:

```
ODDS_API_KEY=your_odds_api_key_here
KAGGLE_API_TOKEN=your_kaggle_token_here
FRONTEND_URL=https://your-frontend.onrender.com
```

#### 5. Wait for Build (5-10 minutes)

Render will:
- Install dependencies
- Build frontend
- Start backend server
- Assign public URLs

#### 6. Access Your App

- **Frontend**: `https://ufc-predictor-frontend.onrender.com`
- **Backend API**: `https://ufc-predictor-backend.onrender.com`

### ⚠️ Render Free Tier Limitations

- **Spins down after 15 min of inactivity** (cold start ~30s)
- **750 hours/month free** (enough for demo/portfolio)
- **Limited to 512MB RAM**

**Solution**: Upgrade to $7/month for always-on service

---

## Option 2: AWS Deployment (Production-Ready)

### ✅ Pros
- **Highly scalable**
- **99.99% uptime SLA**
- **Full control over infrastructure**
- **Cost-effective at scale**

### 💰 Estimated Monthly Cost
- **Development**: $15-25/month
- **Production**: $50-100/month (with auto-scaling)

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  CloudFront (CDN) + S3 (Frontend Static Files)  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  Application Load Balancer (ALB)                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  ECS Fargate (Backend FastAPI Container)        │
│  - Auto-scaling: 1-4 tasks                      │
│  - Health checks enabled                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  S3 (Data Storage: models, datasets)            │
└──────────────────────────────────────────────────┘
```

### 📋 Prerequisites

- AWS Account
- AWS CLI installed: `aws configure`
- Docker installed
- Domain name (optional, recommended)

### 🔧 Deployment Steps

#### Step 1: Build and Push Docker Images

```bash
# Build backend image
cd web_app/backend
docker build -t ufc-predictor-backend .
docker tag ufc-predictor-backend:latest <your-ecr-repo>:latest
docker push <your-ecr-repo>:latest

# Build frontend
cd ../frontend
npm run build
```

#### Step 2: Deploy with AWS CDK (Infrastructure as Code)

```bash
cd infrastructure/aws
npm install
cdk bootstrap
cdk deploy --all
```

This creates:
- **S3 buckets** for frontend and data
- **ECS Fargate cluster** for backend
- **Application Load Balancer**
- **CloudFront distribution**
- **Route53 DNS** (if domain provided)

#### Step 3: Upload Data to S3

```bash
aws s3 sync ../../data/processed s3://ufc-predictor-data/processed/
aws s3 sync ../../models s3://ufc-predictor-data/models/
```

#### Step 4: Configure Environment Variables

In AWS Systems Manager → Parameter Store:

```
/ufc-predictor/odds-api-key
/ufc-predictor/kaggle-token
```

#### Step 5: Deploy Frontend to S3 + CloudFront

```bash
cd web_app/frontend
npm run build
aws s3 sync dist/ s3://ufc-predictor-frontend/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### 📊 Monitoring

- **CloudWatch Logs**: Backend logs and errors
- **CloudWatch Metrics**: CPU, memory, request count
- **X-Ray**: Distributed tracing (optional)

---

## Option 3: Docker Compose (Local + Any Cloud)

### ✅ Pros
- **Portable** - Works on any cloud (AWS, GCP, Azure, DigitalOcean)
- **Easy local development**
- **Consistent environments**

### 🔧 Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### ☁️ Deploy to Any Cloud

#### DigitalOcean App Platform ($12/month)

1. Create Droplet (Ubuntu 22.04)
2. Install Docker + Docker Compose
3. Clone repo and run `docker-compose up -d`
4. Configure Nginx reverse proxy

#### Google Cloud Run (Serverless)

```bash
gcloud run deploy ufc-backend --source ./web_app/backend --region us-central1
gcloud run deploy ufc-frontend --source ./web_app/frontend --region us-central1
```

---

## 🔒 Security Checklist

- [ ] **Environment variables** stored securely (not in code)
- [ ] **API keys** rotated regularly
- [ ] **HTTPS enabled** (SSL certificates)
- [ ] **CORS configured** properly
- [ ] **Rate limiting** enabled on API
- [ ] **Input validation** on all endpoints
- [ ] **Database backups** scheduled (if using DB)

---

## 📈 Performance Optimization

### Backend
- [ ] Enable **Gzip compression**
- [ ] Add **Redis caching** for fighter data
- [ ] Use **CDN** for static assets
- [ ] Implement **connection pooling**

### Frontend
- [ ] Enable **code splitting**
- [ ] Lazy load **fighter images**
- [ ] Use **React.memo** for expensive components
- [ ] Implement **service worker** for offline support

---

## 🧪 Testing Before Deployment

```bash
# Backend tests
cd web_app/backend
pytest tests/

# Frontend tests
cd web_app/frontend
npm run test

# Load testing
artillery run load-test.yml
```

---

## 📊 Monitoring & Analytics

### Recommended Tools

1. **Sentry** - Error tracking (free tier)
2. **Google Analytics** - User behavior
3. **Uptime Robot** - Uptime monitoring (free)
4. **LogRocket** - Session replay (optional)

---

## 🚨 Troubleshooting

### Issue: Backend won't start

```bash
# Check logs
docker logs ufc-backend

# Common fixes
- Verify data files exist in /data/processed/
- Check environment variables
- Ensure port 8000 is not in use
```

### Issue: Frontend can't connect to backend

```bash
# Update API URL in frontend
# web_app/frontend/src/config.js
export const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'
```

### Issue: Model predictions failing

```bash
# Verify model file exists
ls -lh models/xgboost_model.pkl

# Re-train if needed
python src/models/train_xgboost.py
```

---

## 📝 Post-Deployment Checklist

- [ ] Test all features in production
- [ ] Set up monitoring alerts
- [ ] Configure automated backups
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Set up CI/CD pipeline
- [ ] Configure domain name
- [ ] Enable analytics

---

## 🎯 Recommended Deployment Path

**For Portfolio/Demo**: Render (Option 1)
**For Production**: AWS (Option 2)
**For Learning**: Docker Compose (Option 3)

---

## 📞 Support

If you encounter issues:
1. Check logs first
2. Review environment variables
3. Verify data files are present
4. Test API endpoints manually
5. Check GitHub Issues

---

## 🔄 Continuous Deployment

Your GitHub Actions workflow already handles:
- ✅ Weekly model retraining
- ✅ Automated testing
- ✅ Data updates from Kaggle

To enable auto-deploy on push:
- **Render**: Automatic (already configured)
- **AWS**: Add CodePipeline
- **Docker**: Add webhook to trigger rebuild

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
