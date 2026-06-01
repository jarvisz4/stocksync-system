from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Product display name")
    sku: str = Field(..., min_length=2, max_length=50, description="Unique stock keeping unit identifier")
    price: Decimal = Field(..., gt=Decimal("0.00"), description="Unit price, must be greater than zero")
    stock_quantity: int = Field(..., ge=0, description="Inventory count, must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    price: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    stock_quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100, description="Customer's full name")
    email: EmailStr = Field(..., description="Customer's email address")
    phone: Optional[str] = Field(None, max_length=20, description="Customer's phone contact")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- ORDER ITEM SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="ID of product being ordered")
    quantity: int = Field(..., gt=0, description="Quantity being ordered, must be at least 1")

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="ID of customer purchasing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
