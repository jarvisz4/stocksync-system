import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Users, Mail, Phone, Calendar } from 'lucide-react';
import { api } from '../api';

export default function Customers({ triggerToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      triggerToast(err.message || 'Error fetching customers list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData({ full_name: '', email: '', phone: '' });
    setIsAddModalOpen(true);
  };

  // Client-side form validations
  const validateForm = () => {
    if (!formData.full_name.trim()) {
      triggerToast('Customer full name is required.', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      triggerToast('Email address is required.', 'error');
      return false;
    }
    // Simple email regex format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      triggerToast('Please provide a valid email format.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim() || null
      };

      await api.createCustomer(payload);
      triggerToast('Customer profile registered successfully!', 'success');
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err) {
      triggerToast(err.message || 'Failed to create customer.', 'error');
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This cannot be undone.')) {
      return;
    }

    try {
      await api.deleteCustomer(customerId);
      triggerToast('Customer deleted successfully.', 'success');
      fetchCustomers();
    } catch (err) {
      // Backend transaction-safety block checks if customer has active orders and rejects if yes
      triggerToast(err.message || 'Could not delete customer.', 'error');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Customer Management</h1>
          <p>Register transactional customers, examine database contacts, and monitor active buyer accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Register Customer
        </button>
      </div>

      {/* Main Customers List */}
      <div className="glass-card">
        {loading && customers.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Syncing customer database...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <Users size={44} style={{ opacity: 0.4 }} />
            <p>No customers registered. Click "Register Customer" to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Contact</th>
                  <th>Phone Number</th>
                  <th>Join Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600 }}>{customer.full_name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={13} style={{ color: 'hsl(var(--primary))' }} />
                        <span>{customer.email}</span>
                      </div>
                    </td>
                    <td>
                      {customer.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Phone size={13} style={{ color: 'hsl(var(--success))' }} />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.4 }}>Not provided</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={13} style={{ opacity: 0.5 }} />
                        <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(customer.id)}
                        title="Delete profile"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD CUSTOMER MODAL --- */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Register New Customer</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="full_name">Customer Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    placeholder="e.g. Tony Stark"
                    className="glass-input"
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email Address (Must be unique)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="e.g. tony@starkindustries.com"
                    className="glass-input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="phone">Phone Number (Optional)</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    placeholder="e.g. +1-212-555-0199"
                    className="glass-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
