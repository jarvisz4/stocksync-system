from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from . import models, schemas
from decimal import Decimal

# --- PRODUCT CRUD ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Product)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Product.name.ilike(search_filter)) |
            (models.Product.sku.ilike(search_filter))
        )
    return query.order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        stock_quantity=product.stock_quantity
    )
    db.add(db_product)
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Integrity error: SKU must be unique."
        )

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    if product.sku is not None and product.sku != db_product.sku:
        existing = get_product_by_sku(db, product.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product.sku}' already exists."
            )
            
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
        
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Integrity error updating product SKU."
        )

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    # Check if this product is ordered
    referenced = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if referenced:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it has associated orders. Adjust its stock to 0 instead."
        )
        
    db.delete(db_product)
    db.commit()
    return db_product


# --- CUSTOMER CRUD ---

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    try:
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Integrity error: Email must be unique."
        )

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
        
    # Check if there are orders referencing this customer
    referenced = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if referenced:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer because they have active orders."
        )
        
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- ORDER CRUD ---

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} does not exist."
        )

    # Use transactions explicitly to ensure atomicity
    try:
        order_items_to_create = []
        total_amount = Decimal("0.00")
        
        # Aggregate duplicate entries of same product inside the order request
        aggregated_items = {}
        for item in order_in.items:
            if item.product_id in aggregated_items:
                aggregated_items[item.product_id] += item.quantity
            else:
                aggregated_items[item.product_id] = item.quantity

        # Process each item in order (using SELECT FOR UPDATE row-level lock)
        for product_id, qty in aggregated_items.items():
            db_product = db.query(models.Product).with_for_update().filter(models.Product.id == product_id).first()
            
            if not db_product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {product_id} does not exist."
                )
                
            if db_product.stock_quantity < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{db_product.name}'. Requested: {qty}, Available: {db_product.stock_quantity}."
                )
            
            # Deduct stock quantity
            db_product.stock_quantity -= qty
            
            # Calculate pricing
            item_total = db_product.price * qty
            total_amount += item_total
            
            # Instantiate OrderItem
            order_item = models.OrderItem(
                product_id=product_id,
                quantity=qty,
                unit_price=db_product.price
            )
            order_items_to_create.append(order_item)
            
        # Insert parent Order
        db_order = models.Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush()  # Flush so that db_order.id is generated for order items
        
        # Link order items to order
        for item in order_items_to_create:
            item.order_id = db_order.id
            db.add(item)
            
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except HTTPException:
        # Re-raise explicit HTTP validation errors and rollback
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error occurred during transactional order placement: {str(e)}"
        )

def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    if not db_order:
        return None
        
    try:
        # Restore stock counts when deleting an order (production best practice)
        for item in db_order.items:
            db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if db_product:
                db_product.stock_quantity += item.quantity
                
        # Force load relationships to populate properties and serialize to Pydantic while session is active
        if hasattr(schemas.OrderResponse, "model_validate"):
            order_response = schemas.OrderResponse.model_validate(db_order)
        else:
            order_response = schemas.OrderResponse.from_orm(db_order)
            
        db.delete(db_order)
        db.commit()
        return order_response
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not delete order: {str(e)}"
        )

