import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud, database
from .database import engine, get_db, wait_for_db

# Create DB tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="A highly optimized REST API for managing products, customers, transactions, and inventory levels.",
    version="1.0.0"
)

# Configure CORS to support local development and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific domains in highly restrictive environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Make sure database is ready
    wait_for_db(retries=10, delay=2)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "message": "Inventory & Order Management System API is running smoothly.",
        "documentation": "/docs"
    }


# --- PRODUCT API ENDPOINTS ---

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.get("/products", response_model=List[schemas.ProductResponse], tags=["Products"])
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = Query(None, description="Search products by name or SKU"),
    db: Session = Depends(get_db)
):
    return crud.get_products(db=db, skip=skip, limit=limit, search=search)

@app.get("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=product_id)
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db=db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product

@app.delete("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.delete_product(db=db, product_id=product_id)
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product


# --- CUSTOMER API ENDPOINTS ---

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers", response_model=List[schemas.CustomerResponse], tags=["Customers"])
def read_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db)
):
    return crud.get_customers(db=db, skip=skip, limit=limit)

@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return db_customer

@app.delete("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.delete_customer(db=db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return db_customer


# --- ORDER API ENDPOINTS ---

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order_in=order)

@app.get("/orders", response_model=List[schemas.OrderResponse], tags=["Orders"])
def read_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db)
):
    return crud.get_orders(db=db, skip=skip, limit=limit)

@app.get("/orders/{order_id}", response_model=schemas.OrderResponse, tags=["Orders"])
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return db_order

@app.delete("/orders/{order_id}", response_model=schemas.OrderResponse, tags=["Orders"])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.delete_order(db=db, order_id=order_id)
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return db_order
