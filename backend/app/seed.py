from sqlalchemy.orm import Session
from decimal import Decimal
from .database import SessionLocal, engine
from . import models

def seed_database():
    db = SessionLocal()
    try:
        print("Starting database seeding...")
        
        # Force clear existing records to flush old foreign names and insert Indian names
        print("Cleaning up old database records...")
        db.query(models.OrderItem).delete()
        db.query(models.Order).delete()
        db.query(models.Customer).delete()
        db.query(models.Product).delete()
        db.commit()
        
        # 1. Seed Products
        print("Seeding premium product catalog...")
        products = [
            models.Product(name="MacBook Pro 16\"", sku="APPLE-MBP-16", price=Decimal("2499.00"), stock_quantity=15),
            models.Product(name="iPhone 15 Pro Max", sku="APPLE-IPH15-PM", price=Decimal("1199.99"), stock_quantity=24),
            models.Product(name="Logitech MX Master 3S", sku="LOGI-MX3S", price=Decimal("99.99"), stock_quantity=4), # Low stock alert!
            models.Product(name="Sony WH-1000XM5", sku="SONY-WH1000-M5", price=Decimal("398.00"), stock_quantity=8), # Low stock alert!
            models.Product(name="Dell XPS 15 Laptop", sku="DELL-XPS15-01", price=Decimal("1899.50"), stock_quantity=12),
            models.Product(name="Keychron Q1 Mechanical Keyboard", sku="KEYCH-Q1-RGB", price=Decimal("169.00"), stock_quantity=3), # Low stock alert!
            models.Product(name="Samsung Odyssey G9 Monitor", sku="SAMS-G9-CURV", price=Decimal("1299.00"), stock_quantity=6), # Low stock alert!
            models.Product(name="Apple AirPods Pro 2", sku="APPLE-APP2", price=Decimal("249.00"), stock_quantity=35),
        ]
        db.bulk_save_objects(products)
        db.commit()
        print(f"Successfully seeded {len(products)} products.")

        # 2. Seed Customers (Highly realistic Indian names)
        print("Seeding customer accounts...")
        customers = [
            models.Customer(full_name="Amit Sharma", email="amit.sharma@gmail.com", phone="+91-9876543210"),
            models.Customer(full_name="Priya Patel", email="priya.patel@yahoo.com", phone="+91-9812345678"),
            models.Customer(full_name="Rajesh Kumar", email="rajesh.kumar@outlook.com", phone="+91-9988776655"),
            models.Customer(full_name="Sneha Reddy", email="sneha.reddy@gmail.com", phone="+91-9700112233"),
            models.Customer(full_name="Arjun Verma", email="arjun.verma@hotmail.com", phone="+91-9555667788"),
        ]
        db.bulk_save_objects(customers)
        db.commit()
        print(f"Successfully seeded {len(customers)} customers.")

        # 3. Seed Orders & OrderItems
        print("Seeding initial order ledger...")
        customer1 = db.query(models.Customer).filter(models.Customer.email == "amit.sharma@gmail.com").first()
        customer2 = db.query(models.Customer).filter(models.Customer.email == "priya.patel@yahoo.com").first()
        customer3 = db.query(models.Customer).filter(models.Customer.email == "sneha.reddy@gmail.com").first()
        
        p_mbp = db.query(models.Product).filter(models.Product.sku == "APPLE-MBP-16").first()
        p_mx = db.query(models.Product).filter(models.Product.sku == "LOGI-MX3S").first()
        p_sony = db.query(models.Product).filter(models.Product.sku == "SONY-WH1000-M5").first()
        p_airpods = db.query(models.Product).filter(models.Product.sku == "APPLE-APP2").first()
        
        if customer1 and customer2 and customer3 and p_mbp and p_mx and p_sony and p_airpods:
            # Order 1 (Amit Sharma)
            o1_total = (p_mbp.price * 2) + (p_mx.price * 1)
            order1 = models.Order(customer_id=customer1.id, total_amount=o1_total)
            db.add(order1)
            db.flush()
            
            db.add(models.OrderItem(order_id=order1.id, product_id=p_mbp.id, quantity=2, unit_price=p_mbp.price))
            db.add(models.OrderItem(order_id=order1.id, product_id=p_mx.id, quantity=1, unit_price=p_mx.price))
            
            p_mbp.stock_quantity -= 2
            p_mx.stock_quantity -= 1
            
            # Order 2 (Priya Patel)
            o2_total = (p_sony.price * 1) + (p_airpods.price * 3)
            order2 = models.Order(customer_id=customer2.id, total_amount=o2_total)
            db.add(order2)
            db.flush()
            
            db.add(models.OrderItem(order_id=order2.id, product_id=p_sony.id, quantity=1, unit_price=p_sony.price))
            db.add(models.OrderItem(order_id=order2.id, product_id=p_airpods.id, quantity=3, unit_price=p_airpods.price))
            
            p_sony.stock_quantity -= 1
            p_airpods.stock_quantity -= 3
            
            # Order 3 (Sneha Reddy)
            o3_total = p_airpods.price * 1
            order3 = models.Order(customer_id=customer3.id, total_amount=o3_total)
            db.add(order3)
            db.flush()
            
            db.add(models.OrderItem(order_id=order3.id, product_id=p_airpods.id, quantity=1, unit_price=p_airpods.price))
            p_airpods.stock_quantity -= 1
            
            db.commit()
            print("Successfully seeded orders and updated inventory stock levels.")
            
        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_database()
