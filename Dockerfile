FROM python:3.9-slim

WORKDIR /app

# Create a non-root user that Hugging Face requires
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Install system dependencies as root first, then switch back
USER root
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*
USER user

# Copy requirements
COPY --chown=user web_app/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional dependencies
RUN pip install --no-cache-dir \
    httpx \
    python-dotenv \
    thefuzz \
    python-Levenshtein

# Copy project files with proper ownership
COPY --chown=user . .

# Create necessary directories
RUN mkdir -p data/processed data/raw/original models

# Expose Hugging Face default port
EXPOSE 7860

# Health check (Hugging Face expects the app to be on 7860)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:7860/ || exit 1

# Run the application (Changed to port 7860 for Hugging Face)
CMD ["uvicorn", "web_app.backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
