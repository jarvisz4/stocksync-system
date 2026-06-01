# StockSync: Premium Inventory & Order Management System

## 🌐 Live Production URLs
Quickly access the running cloud application through these public links:
- **Interactive Live Dashboard (Vercel):** [https://stocksync-system.vercel.app](https://stocksync-system.vercel.app)
- **Active Backend API (Render):** [https://stocksync-api-un68.onrender.com](https://stocksync-api-un68.onrender.com)
- **Interactive REST Swagger Docs:** [https://stocksync-api-un68.onrender.com/docs](https://stocksync-api-un68.onrender.com/docs)

---

StockSync is a production-ready, full-stack **Inventory & Order Management System** built with **FastAPI (Python)**, **React.js (Vite)**, and **PostgreSQL**. 


It implements high-end aesthetics (sleek dark mode glassmorphism panels, harmonious HSL palettes, and fluid CSS transitions), relational database transactions, strict stock validations, and orchestrates seamlessly under **Docker Compose**.

---

## Key Features & Business Logic

### 📦 Product Management
- Full CRUD API with fields for names, prices, quantities, unique SKUs, and date indicators.
- **Business Rules**: Unique SKU checking, positive price limits (`price > 0`), and non-negative stock counts (`stock_quantity >= 0`).

### 👥 Customer Management
- Complete customer register with unique email fields, format verification, and detail logging.
- **Business Rules**: Strict email syntactical validation and email address uniqueness checks.

### 🛒 Transaction-Safe Orders (Acid Transactions)
- Place checkout orders containing multiple product lines, automatically fetching live item pricing to calculate order grand totals.
- **Inventory Safety**: Prior to committing the transaction, StockSync fetches all items with database row-level locking (`SELECT FOR UPDATE`) to avoid concurrency race conditions.
- **Atomicity (All-or-Nothing)**: If any single product in an order has insufficient warehouse stock, the entire transaction **rolls back** immediately, raising an HTTP 400 Bad Request error.
- **Order Cancellation Stock Recovery**: When an order is deleted, the database automatically **restores** the stock counts for each of its items.

---

## Project Structure

```text
inventory-order-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application bootstrapper & REST routing
│   │   ├── database.py      # SQLAlchemy connection engine & DB session generator
│   │   ├── models.py        # Relational models (Product, Customer, Order, OrderItem)
│   │   ├── schemas.py       # Pydantic input/output parsing & data validations
│   │   ├── crud.py          # SQL transaction queries & inventory lock logic
│   │   └── seed.py          # Database seed script for initial testing data
│   ├── Dockerfile           # Backend container setup
│   ├── .dockerignore
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Sleek reusable UI elements
│   │   ├── pages/           # Dashboard, Products, Customers, Orders
│   │   ├── api.js           # API fetch wrapper communicating with FastAPI
│   │   ├── index.css        # Premium HSL variables, glassmorphic themes, animations
│   │   ├── App.jsx          # React master router & floating toast alert container
│   │   └── main.jsx         # React application entry point
│   ├── index.html           # Document framework
│   ├── package.json         # Front-end dependencies (React 18, Vite, Lucide Icons)
│   ├── vite.config.js       # Vite configuration binding host port
│   ├── Dockerfile           # Frontend container setup
│   └── .dockerignore
├── docker-compose.yml       # Services orchestrator (Postgres, backend, frontend)
├── test_api.py              # Zero-dependency API integration testing script
└── README.md                # Full setup manual and documentation
```

---

## Getting Started (Docker Compose)

The easiest way to boot StockSync is using Docker Compose. Make sure you have Docker installed on your machine.

### 1. Launch Services
Open a terminal in the root directory (`inventory-order-system/`) and run:
```bash
docker-compose up --build
```

This starts three services:
- **`db` (Postgres)**: Initialized and healthy on port `5432` with a named volume `pgdata`.
- **`backend` (FastAPI)**: Checks for DB readiness, runs database schema initialization, generates premium seed data, and starts listening on `http://localhost:8000`.
- **`frontend` (Vite + React)**: Launches our administrative glassmorphism UI on `http://localhost:5173`.

### 2. Access the Application
- **Admin Dashboard UI**: Open your browser at [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger Docs**: Explore and run live backend queries at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Manual Local Development Setup

If you prefer to run services individually without Docker, follow these steps:

### Backend Setup
1. **Navigate to the folder**:
   ```bash
   cd backend
   ```
2. **Set up a Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Environment variables**:
   Create a `.env` file (or set local terminal variables) pointing to your PostgreSQL instance:
   ```text
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>
   ```
5. **Run the Database Seed**:
   ```bash
   python -m app.seed
   ```
6. **Launch the API Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will start running at `http://127.0.0.1:8000`.

### Frontend Setup
1. **Navigate to the folder**:
   ```bash
   cd ../frontend
   ```
2. **Install Packages**:
   ```bash
   npm install
   ```
3. **Launch the Web Dashboard**:
   ```bash
   npm run dev
   ```
   The frontend will start running at `http://localhost:5173`.

---

## Running Integration Tests

We have included a zero-dependency automated API test runner `test_api.py` that tests every endpoint and validates transaction constraints.

Ensure the backend API service is running at `http://localhost:8000`, then execute:
```bash
python test_api.py
```

### What gets validated:
1. **API Status**: Health check diagnostics.
2. **Product CRUD**: Item creation, verification, and SKU uniqueness blocks.
3. **Customer Registration**: Duplicate email blocks.
4. **Inventory Failure Rollback**: Placing an order for a product that exceeds stock. It ensures that the transaction rolls back, leaves stock intact, and throws HTTP 400.
5. **Successful Checkout Transactions**: Correctly deducts stock and calculates grand totals.
6. **Order Cancellations**: Deletes placed orders and restores product stock levels.

---

## Cloud Deployment Guide

StockSync is configured to be fully production-ready and easily deployed to cloud services:

### 1. Backend Deployment (Render, Railway, or Heroku)
- Render can build the backend directly using Python environments.
- Set your build command: `pip install -r requirements.txt`
- Set your start command: `python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Configure **Environment Variables**:
  - `DATABASE_URL`: Point to your production PostgreSQL connection string.

### 2. Frontend Deployment (Vercel, Netlify, or Amplify)
- Point to the `frontend/` directory.
- Build command: `npm run build`
- Output directory: `dist/`
- Configure **Environment Variables**:
  - `VITE_API_URL`: Point to your deployed FastAPI backend URL (e.g. `https://stocksync-api.onrender.com`).
