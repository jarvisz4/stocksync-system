FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (build-essential, libpq for PostgreSQL)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . .

# Expose port 8000
EXPOSE 8000

# Command to run on start: Wait for DB readiness, then run seed and start uvicorn
CMD python -c "from app.database import wait_for_db; wait_for_db(retries=15, delay=2)" && \
    python -m app.seed && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
