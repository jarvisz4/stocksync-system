import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Info } from 'lucide-react';

// Pages import
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Trigger floating alert toast notifications
  const triggerToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically fade out after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  // Render subpage according to selected sidebar navigation
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard triggerToast={triggerToast} />;
      case 'products':
        return <Products triggerToast={triggerToast} />;
      case 'customers':
        return <Customers triggerToast={triggerToast} />;
      case 'orders':
        return <Orders triggerToast={triggerToast} />;
      default:
        return <Dashboard triggerToast={triggerToast} />;
    }
  };

  return (
    <div className="app-container">
      {/* Dynamic Glassmorphic Sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Package size={20} color="#fff" />
          </div>
          <span className="brand-name">StockSync</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button
                className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activePage === 'products' ? 'active' : ''}`}
                onClick={() => setActivePage('products')}
              >
                <Package size={18} />
                <span>Products</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activePage === 'customers' ? 'active' : ''}`}
                onClick={() => setActivePage('customers')}
              >
                <Users size={18} />
                <span>Customers</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activePage === 'orders' ? 'active' : ''}`}
                onClick={() => setActivePage('orders')}
              >
                <ShoppingCart size={18} />
                <span>Orders</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer Sidebar Details */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={12} />
          <span>StockSync Admin v1.0.0</span>
        </div>
      </aside>

      {/* Main Content Layout Container */}
      <main className="page-wrapper">
        {renderPage()}
      </main>

      {/* Floating Toast Notification Containers */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
