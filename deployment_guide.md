# Assessment Submission & Cloud Deployment Guide

This guide provides step-by-step instructions to deploy **StockSync** and prepare your links for the final submission.

---

## 📂 Step 1: Initialize Git & Push to GitHub

To submit your GitHub repository link, push the codebase from your laptop:

1. **Open your terminal / PowerShell** in the project root directory (e.g. `C:\projects\inventory-order-system`).
2. **Initialize Git**:
   ```bash
   git init
   ```
3. **Create a `.gitignore`** in the root folder to ignore node modules, SQLite database files, and virtual environments:
   Create a file named `.gitignore` with:
   ```text
   # Python
   backend/__pycache__/
   backend/*.pyc
   backend/.venv/
   backend/venv/
   backend/env/
   backend/app/inventory.db
   backend/app/inventory.db-journal
   
   # Node
   frontend/node_modules/
   frontend/dist/
   frontend/.env
   frontend/.env.local
   
   # OS
   .DS_Store
   Thumbs.db
   ```
4. **Stage and Commit all files**:
   ```bash
   git add .
   git commit -m "Initial commit of StockSync Full-Stack System"
   ```
5. **Create a new Repository on GitHub** (e.g. `stocksync-system`). Do NOT initialize with README or .gitignore.
6. **Link and push**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/<your-repo-name>.git
   git push -u origin main
   ```

---

## 🐳 Step 2: Build & Push Backend Image to Docker Hub

You are required to submit a Docker Hub link for your backend image.

1. **Log in to Docker Hub** in your terminal:
   ```bash
   docker login
   ```
2. **Build the Backend Docker Image** (from the root folder):
   ```bash
   docker build -t <your-dockerhub-username>/stocksync-backend:latest ./backend
   ```
3. **Push the Image to your Docker Hub Repository**:
   ```bash
   docker push <your-dockerhub-username>/stocksync-backend:latest
   ```

---

## 🚀 Step 3: Deploy Backend API on Render

Render is an excellent free hosting platform for Python/PostgreSQL backend services.

### A. Deploy PostgreSQL Database (Render Managed)
1. Go to your **[Render Dashboard](https://dashboard.render.com)** and log in.
2. Click **New +** and select **PostgreSQL**.
3. Configure settings:
   - **Name**: `stocksync-db`
   - **Database**: `inventory_db`
   - **User**: `postgres`
4. Click **Create Database**.
5. Once active, copy the **Internal Database URL** (for Render services) or **External Database URL** (for remote checks).

### B. Deploy FastAPI Web Service
1. Click **New +** and select **Web Service**.
2. Select **Build and deploy from a Git repository** and select your GitHub repository.
3. Configure settings:
   - **Name**: `stocksync-api`
   - **Root Directory**: `backend` (Important: points to backend directory)
   - **Language/Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Expand the **Advanced** section to add **Environment Variables**:
   - Add `DATABASE_URL` and paste your Render **Internal Database URL**.
5. Click **Create Web Service**. Render will build and deploy the API. Your live URL will look like: `https://stocksync-api.onrender.com`.

---

## 🌐 Step 4: Deploy Frontend React App on Vercel

Vercel is the easiest free hosting platform for static front-end apps (Vite/React).

1. Sign up/log in to **[Vercel Dashboard](https://vercel.com)**.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`** (Important: points to the frontend directory).
5. Expand the **Environment Variables** section:
   - **Key**: `VITE_API_URL`
   - **Value**: Paste your live deployed Render API URL (e.g. `https://stocksync-api.onrender.com`). Do NOT include a trailing slash.
6. Click **Deploy**. Vercel will install dependencies, compile the React build folder (`dist/`), and deploy it.
7. Your frontend URL will look like: `https://stocksync-system.vercel.app`.

---

## 📝 Step 5: Final Submission Template

Compile these links to submit your Technical Assessment:

| Deliverable | Link |
| --- | --- |
| **GitHub Repository Link** | `https://github.com/<your-username>/stocksync-system` |
| **Docker Hub Image Link** | `https://hub.docker.com/r/<your-username>/stocksync-backend` |
| **Live Frontend URL** | `https://stocksync-system.vercel.app` |
| **Live Backend API URL** | `https://stocksync-api.onrender.com` |
