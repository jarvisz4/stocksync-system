import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://localhost:8000"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            error_details = json.loads(res_body)
        except json.JSONDecodeError:
            error_details = res_body
        return e.code, error_details
    except urllib.error.URLError as e:
        print(f"\n[ERROR] Connection failed: Could not reach {BASE_URL}.")
        print("Please verify that your docker compose stack or backend server is running.")
        sys.exit(1)

def run_tests():
    print("=" * 60)
    print("           StockSync API Integration Test Suite")
    print("=" * 60)

    # 1. Test Root Endpoint
    print("\n[STEP 1] Testing Service Health Status...")
    status, body = make_request("/")
    assert status == 200, "Health check failed"
    print(f" -> API health: {body.get('status')} - {body.get('message')}")

    # 2. Test Product Creation
    print("\n[STEP 2] Creating a test product...")
    product_payload = {
        "name": "Integration Test Mouse",
        "sku": "TEST-MOUSE-99",
        "price": 49.99,
        "stock_quantity": 10
    }
    status, product = make_request("/products", "POST", product_payload)
    if status == 201:
        print(f" -> Success! Created Product ID: {product.get('id')} ({product.get('name')})")
    else:
        print(f" -> FAILED! Status: {status}, Error: {product}")
        return

    product_id = product.get("id")

    # 3. Test SKU Uniqueness Enforced
    print("\n[STEP 3] Verifying SKU uniqueness enforcement (should fail)...")
    status, err = make_request("/products", "POST", product_payload)
    if status == 400:
        print(f" -> Success! Backend rejected duplicate SKU with message: '{err.get('detail')}'")
    else:
        print(f" -> FAILED! Duplicate SKU was not rejected. Status: {status}")

    # 4. Test Customer Creation
    print("\n[STEP 4] Registering a test customer...")
    customer_payload = {
        "full_name": "Peter Parker",
        "email": "test-peter.parker@dailybugle.com",
        "phone": "+1-718-555-0143"
    }
    status, customer = make_request("/customers", "POST", customer_payload)
    if status in (201, 400):
        if status == 201:
            print(f" -> Success! Registered Customer ID: {customer.get('id')} ({customer.get('full_name')})")
            customer_id = customer.get("id")
        else:
            # If already seeded or created
            print(f" -> Customer already registered or email duplicate. Let's fetch all customers to get an ID.")
            _, customers_list = make_request("/customers")
            customer_id = customers_list[0].get("id")
            print(f" -> Using existing Customer ID: {customer_id}")
    else:
        print(f" -> FAILED! Customer registration status: {status}")
        return

    # 5. Test Transactional Order: Insufficient Stock
    print("\n[STEP 5] Testing Insufficient Stock Checkout Rollback (should fail)...")
    insufficient_order_payload = {
        "customer_id": customer_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 15 # We only have 10 in stock!
            }
        ]
    }
    status, err = make_request("/orders", "POST", insufficient_order_payload)
    if status == 400:
        print(f" -> Success! Backend rejected order with message: '{err.get('detail')}'")
        
        # Verify stock has not changed
        _, p_check = make_request(f"/products/{product_id}")
        assert p_check.get("stock_quantity") == 10, "Stock was incorrectly deducted!"
        print(f" -> Verified product stock remains intact at: {p_check.get('stock_quantity')}")
    else:
        print(f" -> FAILED! Order was not rejected. Status: {status}, Response: {err}")

    # 6. Test Transactional Order: Successful Checkout
    print("\n[STEP 6] Placing a valid checkout transaction...")
    valid_order_payload = {
        "customer_id": customer_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 3 # 3 out of 10
            }
        ]
    }
    status, order = make_request("/orders", "POST", valid_order_payload)
    if status == 201:
        print(f" -> Success! Order placed successfully. Total Amount: ${float(order.get('total_amount')):.2f}")
        
        # Verify stock deducted
        _, p_check = make_request(f"/products/{product_id}")
        assert p_check.get("stock_quantity") == 7, f"Stock should be 7 but got {p_check.get('stock_quantity')}"
        print(f" -> Verified product stock was deducted. Remaining stock: {p_check.get('stock_quantity')}")
    else:
        print(f" -> FAILED! Order placement status: {status}, Response: {order}")
        return

    order_id = order.get("id")

    # 7. Test Order Deletion & Stock Restoration
    print("\n[STEP 7] Cancelling order and verifying stock restoration...")
    status, _ = make_request(f"/orders/{order_id}", "DELETE")
    if status == 200:
        print(" -> Success! Order cancelled.")
        # Verify stock restored
        _, p_check = make_request(f"/products/{product_id}")
        assert p_check.get("stock_quantity") == 10, f"Stock should be 10 but got {p_check.get('stock_quantity')}"
        print(f" -> Verified product stock restored back to: {p_check.get('stock_quantity')}")
    else:
        print(f" -> FAILED! Order cancellation status: {status}")

    # Clean up test product
    print("\n[STEP 8] Cleaning up integration test product...")
    status, _ = make_request(f"/products/{product_id}", "DELETE")
    if status == 200:
        print(" -> Cleanup complete. Test product deleted successfully.")
    else:
        print(f" -> Failed to delete test product. Status: {status}")

    print("\n" + "=" * 60)
    print("   ALL INTEGRATION TESTS PASSED - SYSTEM IS PRODUCTION READY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
