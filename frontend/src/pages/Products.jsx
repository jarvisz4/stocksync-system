import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package } from 'lucide-react';
import { api } from '../api';

export default function Products({ triggerToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock_quantity: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(searchTerm);
      setProducts(data);
    } catch (err) {
      triggerToast(err.message || 'Error fetching products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({ name: '', sku: '', price: '', stock_quantity: '0' });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
    setIsEditModalOpen(true);
  };

  // Form Validations
  const validateForm = () => {
    if (!formData.name.trim()) {
      triggerToast('Product name cannot be empty.', 'error');
      return false;
    }
    if (!formData.sku.trim()) {
      triggerToast('SKU identifier is required.', 'error');
      return false;
    }
    if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) {
      triggerToast('Price must be greater than $0.00.', 'error');
      return false;
    }
    if (parseInt(formData.stock_quantity) < 0 || isNaN(parseInt(formData.stock_quantity))) {
      triggerToast('Stock quantity cannot be negative.', 'error');
      return false;
    }
    return true;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity)
      };

      await api.createProduct(payload);
      triggerToast('Product successfully added!', 'success');
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      triggerToast(err.message || 'Failed to add product.', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity)
      };

      await api.updateProduct(selectedProduct.id, payload);
      triggerToast('Product details updated successfully!', 'success');
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      triggerToast(err.message || 'Failed to update product details.', 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this product? This cannot be undone.')) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      triggerToast('Product removed successfully.', 'success');
      fetchProducts();
    } catch (err) {
      triggerToast(err.message || 'Could not delete product.', 'error');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Product Catalog</h1>
          <p>Add new stock arrivals, edit item listings, and monitor warehouse volumes.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filter and Table Section */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="glass-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Syncing product catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Package size={44} style={{ opacity: 0.4 }} />
            <p>No products found matching your search.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU Code</th>
                  <th>Unit Price</th>
                  <th>Stock Inventory</th>
                  <th>Inventory Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        Registered: {new Date(product.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {product.sku}
                      </code>
                    </td>
                    <td>${parseFloat(product.price).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{product.stock_quantity}</td>
                    <td>
                      {product.stock_quantity === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : product.stock_quantity < 10 ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">Fully Stocked</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(product)} title="Edit details">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)} title="Delete product">
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

      {/* --- ADD PRODUCT MODAL --- */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Product Entry</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="name">Product Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                    className="glass-input"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="sku">SKU Code (Must be unique)</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    required
                    placeholder="e.g. SONY-WH1000-M5"
                    className="glass-input"
                    value={formData.sku}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="price">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    required
                    placeholder="299.99"
                    className="glass-input"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="stock_quantity">Starting Stock Quantity</label>
                  <input
                    type="number"
                    id="stock_quantity"
                    name="stock_quantity"
                    required
                    placeholder="20"
                    className="glass-input"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Modify Product Listing</h2>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="edit_name">Product Name</label>
                  <input
                    type="text"
                    id="edit_name"
                    name="name"
                    required
                    className="glass-input"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit_sku">SKU Code (Must be unique)</label>
                  <input
                    type="text"
                    id="edit_sku"
                    name="sku"
                    required
                    className="glass-input"
                    value={formData.sku}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit_price">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="edit_price"
                    name="price"
                    required
                    className="glass-input"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit_stock_quantity">Current Stock Quantity</label>
                  <input
                    type="number"
                    id="edit_stock_quantity"
                    name="stock_quantity"
                    required
                    className="glass-input"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
