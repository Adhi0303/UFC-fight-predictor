#!/bin/bash

# UFC Fight Predictor - Quick Deployment Script
# This script helps you deploy the application quickly

set -e

echo "🥊 UFC Fight Predictor - Deployment Script"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys:"
    echo "   - ODDS_API_KEY"
    echo "   - KAGGLE_API_TOKEN"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Ask deployment method
echo "Choose deployment method:"
echo "1) Docker Compose (Local/VPS)"
echo "2) Render.com (Cloud - Easiest)"
echo "3) Manual Setup"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🐳 Deploying with Docker Compose..."
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first:"
            echo "   https://docs.docker.com/get-docker/"
            exit 1
        fi
        
        # Check if Docker Compose is installed
        if ! command -v docker-compose &> /dev/null; then
            echo "❌ Docker Compose is not installed. Please install it first:"
            echo "   https://docs.docker.com/compose/install/"
            exit 1
        fi
        
        # Build and start containers
        echo "Building containers..."
        docker-compose build
        
        echo "Starting services..."
        docker-compose up -d
        
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "🌐 Access your application:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo ""
        echo "📊 View logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   docker-compose down"
        ;;
        
    2)
        echo ""
        echo "☁️  Deploying to Render.com..."
        echo ""
        echo "Follow these steps:"
        echo ""
        echo "1. Push your code to GitHub:"
        echo "   git add ."
        echo "   git commit -m 'Prepare for deployment'"
        echo "   git push origin main"
        echo ""
        echo "2. Go to https://render.com and sign in"
        echo ""
        echo "3. Click 'New +' → 'Blueprint'"
        echo ""
        echo "4. Connect your GitHub repository"
        echo ""
        echo "5. Render will detect render.yaml and deploy automatically"
        echo ""
        echo "6. Add environment variables in Render dashboard:"
        echo "   - ODDS_API_KEY"
        echo "   - KAGGLE_API_TOKEN"
        echo ""
        echo "7. Wait 5-10 minutes for deployment to complete"
        echo ""
        echo "📚 Full guide: See DEPLOYMENT.md"
        ;;
        
    3)
        echo ""
        echo "🔧 Manual Setup Instructions"
        echo ""
        echo "Backend Setup:"
        echo "1. cd web_app/backend"
        echo "2. pip install -r requirements.txt"
        echo "3. uvicorn main:app --host 0.0.0.0 --port 8000"
        echo ""
        echo "Frontend Setup (in new terminal):"
        echo "1. cd web_app/frontend"
        echo "2. npm install"
        echo "3. npm run dev"
        echo ""
        echo "📚 Full guide: See DEPLOYMENT.md"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Happy predicting!"
