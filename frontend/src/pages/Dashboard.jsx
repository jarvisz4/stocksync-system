import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ triggerToast }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productsCount: 0,
    customersCount: 0,
    ordersCount: 0,
    lowStockCount: 0,
    lowStockItems: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [products, customers, orders] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getOrders()
      ]);

      const lowStockItems = products.filter(p => p.stock_quantity < 10);

      setStats({
        productsCount: products.length,
        customersCount: customers.length,
        ordersCount: orders.length,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems
      });
    } catch (err) {
      triggerToast(err.message || 'Failed to fetch dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Analyzing inventory analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Dashboard Overview</h1>
          <p>Real-time metrics, order tallies, and inventory warning levels.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} /> Refresh Live Metrics
        </button>
      </div>

      {/* Stats Widgets Grid */}
      <div className="dashboard-grid">
        <div className="glass-card stats-card" style={{ '--stats-accent': 'hsl(250, 84%, 63%)', '--stats-glow': 'rgba(99, 102, 241, 0.15)' }}>
          <div className="stats-icon">
            <Package size={24} />
          </div>
          <div className="stats-details">
            <h3>Total Products</h3>
            <div className="stats-value">{stats.productsCount}</div>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ '--stats-accent': 'hsl(172, 70%, 45%)', '--stats-glow': 'rgba(20, 184, 166, 0.15)' }}>
          <div className="stats-icon">
            <Users size={24} />
          </div>
          <div className="stats-details">
            <h3>Total Customers</h3>
            <div className="stats-value">{stats.customersCount}</div>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ '--stats-accent': 'hsl(271, 84%, 63%)', '--stats-glow': 'rgba(168, 85, 247, 0.15)' }}>
          <div className="stats-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stats-details">
            <h3>Total Orders</h3>
            <div className="stats-value">{stats.ordersCount}</div>
          </div>
        </div>

        <div className="glass-card stats-card" style={{
          '--stats-accent': stats.lowStockCount > 0 ? 'hsl(38, 92%, 50%)' : 'hsl(142, 70%, 45%)',
          '--stats-glow': stats.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'
        }}>
          <div className="stats-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stats-details">
            <h3>Low Stock Alerts</h3>
            <div className="stats-value">{stats.lowStockCount}</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Listing */}
      <div className="glass-card">
        <div className="brand-section" style={{ marginBottom: '20px' }}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <AlertTriangle size={18} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Critical Stock Alerts (&lt; 10 units)</h2>
        </div>
        
        {stats.lowStockItems.length === 0 ? (
          <div className="empty-state">
            <Package size={40} style={{ opacity: 0.4 }} />
            <p>Outstanding work! All product inventories are fully stocked.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                  <th>Status Warning</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{item.sku}</code></td>
                    <td>${parseFloat(item.price).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{item.stock_quantity}</td>
                    <td>
                      {item.stock_quantity === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : (
                        <span className="badge badge-warning">Low Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
