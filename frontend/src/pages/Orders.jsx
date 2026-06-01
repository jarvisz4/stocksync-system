import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, X, ShoppingCart, Calendar, User, DollarSign, Package } from 'lucide-react';
import { api } from '../api';

export default function Orders({ triggerToast }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Creation Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, max_stock: 0, price: 0 }
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, customersData] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      triggerToast(err.message || 'Error sync' + 'ing data models.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    if (customers.length === 0) {
      triggerToast('Please register at least one customer first.', 'error');
      return;
    }
    if (products.length === 0) {
      triggerToast('Please create at least one product first.', 'error');
      return;
    }
    setSelectedCustomerId(customers[0]?.id.toString() || '');
    setOrderItems([{ product_id: products[0]?.id.toString() || '', quantity: 1, max_stock: products[0]?.stock_quantity || 0, price: parseFloat(products[0]?.price) || 0 }]);
    setIsAddModalOpen(true);
  };

  const openDetailModal = async (order) => {
    try {
      setLoading(true);
      const detailedOrder = await api.getOrder(order.id);
      
      // Let's resolve customer details if they are missing in returning response
      if (!detailedOrder.customer) {
        detailedOrder.customer = customers.find(c => c.id === detailedOrder.customer_id) || null;
      }
      setSelectedOrder(detailedOrder);
      setIsDetailModalOpen(true);
    } catch (err) {
      triggerToast(err.message || 'Could not fetch order details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically calculate grand total for the order form in real-time
  const calculateFormGrandTotal = () => {
    return orderItems.reduce((sum, item) => {
      const p = products.find(prod => prod.id.toString() === item.product_id);
      if (p) {
        return sum + (parseFloat(p.price) * item.quantity);
      }
      return sum;
    }, 0);
  };

  const handleAddItemRow = () => {
    const defaultProduct = products[0];
    setOrderItems([
      ...orderItems,
      {
        product_id: defaultProduct?.id.toString() || '',
        quantity: 1,
        max_stock: defaultProduct?.stock_quantity || 0,
        price: parseFloat(defaultProduct?.price) || 0
      }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) {
      triggerToast('Order must contain at least 1 product line.', 'error');
      return;
    }
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    if (field === 'product_id') {
      const prod = products.find(p => p.id.toString() === value);
      updated[index] = {
        product_id: value,
        quantity: 1,
        max_stock: prod ? prod.stock_quantity : 0,
        price: prod ? parseFloat(prod.price) : 0
      };
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value) || 1;
    }
    setOrderItems(updated);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      triggerToast('Please select a customer.', 'error');
      return;
    }

    // Client-side validations
    for (const item of orderItems) {
      if (!item.product_id) {
        triggerToast('Please select a product for all lines.', 'error');
        return;
      }
      if (item.quantity <= 0) {
        triggerToast('Quantity must be greater than 0.', 'error');
        return;
      }
      
      const prod = products.find(p => p.id.toString() === item.product_id);
      if (!prod) {
        triggerToast('Selected product does not exist.', 'error');
        return;
      }
      if (prod.stock_quantity < item.quantity) {
        triggerToast(`Insufficient stock for "${prod.name}". Available: ${prod.stock_quantity}, Requested: ${item.quantity}.`, 'error');
        return;
      }
    }

    // Payload formulation
    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: orderItems.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity
      }))
    };

    try {
      await api.createOrder(payload);
      triggerToast('Order placed successfully! Inventory updated.', 'success');
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Failed to place order transaction.', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? Deleting will automatically RESTORE the stock of its items.')) {
      return;
    }

    try {
      await api.deleteOrder(orderId);
      triggerToast('Order deleted. Stock counts restored!', 'success');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Could not delete order.', 'error');
    }
  };

  const getCustomerName = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.full_name : `Customer ID: ${customerId}`;
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Order Ledger</h1>
          <p>Create transactional checkout receipts, examine order details, and restore inventory stock volumes.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="glass-card">
        {loading && orders.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Gathering transactional ledger...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={44} style={{ opacity: 0.4 }} />
            <p>No orders recorded. Click "Create Order" to submit a purchase.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        #ORD-{order.id.toString().padStart(5, '0')}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{getCustomerName(order.customer_id)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={13} style={{ opacity: 0.5 }} />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDetailModal(order)} title="View Receipt">
                          <Eye size={13} /> Details
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOrder(order.id)} title="Delete & Restore Inventory">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- CREATE ORDER MODAL DRAWER --- */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>Checkout Order Creation</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh' }}>
                {/* Select Customer */}
                <div className="input-group">
                  <label htmlFor="customer_id">Select Customer Profile</label>
                  <select
                    id="customer_id"
                    className="glass-input"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id.toString()} style={{ background: '#1e293b' }}>
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Multiple Products Section */}
                <div style={{ marginTop: '24px', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '12px' }}>
                    Purchasing Items
                  </label>
                  
                  {orderItems.map((item, index) => (
                    <div key={index} className="order-builder-row">
                      {/* Product Selector */}
                      <select
                        className="glass-input"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        required
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id.toString()} style={{ background: '#1e293b' }}>
                            {p.name} (${parseFloat(p.price).toFixed(2)}) [Stock: {p.stock_quantity}]
                          </option>
                        ))}
                      </select>

                      {/* Quantity Input */}
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="glass-input"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />

                      {/* Item Total Price Preview */}
                      <div style={{ paddingLeft: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '10px', color: 'hsl(var(--danger))' }}
                        onClick={() => handleRemoveItemRow(index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px', width: '100%' }}
                    onClick={handleAddItemRow}
                  >
                    + Add Product Line
                  </button>
                </div>

                {/* Grand Total Preview */}
                <div className="order-total-preview">
                  <div className="order-total-label">Estimated Order Grand Total</div>
                  <div className="order-total-value">${calculateFormGrandTotal().toFixed(2)}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Order Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW ORDER DETAILS RECEIPT MODAL --- */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem' }}>Receipt #ORD-{selectedOrder.id.toString().padStart(5, '0')}</h2>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Customer Box */}
              <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <div className="brand-logo" style={{ width: '40px', height: '40px', background: 'hsl(var(--primary-glow))', color: 'hsl(var(--primary))' }}>
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {selectedOrder.customer?.full_name || getCustomerName(selectedOrder.customer_id)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    {selectedOrder.customer?.email || 'No email contact saved'}
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
                Purchase Breakdown
              </h3>

              <div className="table-container" style={{ marginTop: '0', background: 'rgba(15,23,42,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product_name || `Product ID: ${item.product_id}`}</div>
                          {item.product_sku && (
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                              SKU: {item.product_sku}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                        <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Footer */}
              <div className="order-total-preview" style={{ marginTop: '20px' }}>
                <div className="order-total-label" style={{ fontWeight: 600, color: '#fff' }}>Total Paid Amount</div>
                <div className="order-total-value" style={{ color: 'hsl(var(--success))' }}>
                  ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
