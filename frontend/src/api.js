const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom wrapper for standard fetch requests that enforces proper headers,
 * formats payloads, and handles error responses with detailed backend details.
 */
async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Check if the response contains content to parse
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      // Return detailed API error if available
      const errorMessage = data?.detail || `HTTP error! Status: ${response.status}`;
      throw new Error(
        typeof errorMessage === 'string' 
          ? errorMessage 
          : Array.isArray(errorMessage) 
            ? errorMessage.map(e => e.msg).join(', ') 
            : JSON.stringify(errorMessage)
      );
    }

    return data;
  } catch (error) {
    console.error(`API Request Failure [${config.method || 'GET'} ${path}]:`, error);
    throw error;
  }
}

export const api = {
  // --- PRODUCTS ---
  async getProducts(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/products${query}`, { method: 'GET' });
  },

  async getProduct(id) {
    return request(`/products/${id}`, { method: 'GET' });
  },

  async createProduct(productData) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, productData) {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id) {
    return request(`/products/${id}`, { method: 'DELETE' });
  },

  // --- CUSTOMERS ---
  async getCustomers() {
    return request('/customers', { method: 'GET' });
  },

  async getCustomer(id) {
    return request(`/customers/${id}`, { method: 'GET' });
  },

  async createCustomer(customerData) {
    return request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  async deleteCustomer(id) {
    return request(`/customers/${id}`, { method: 'DELETE' });
  },

  // --- ORDERS ---
  async getOrders() {
    return request('/orders', { method: 'GET' });
  },

  async getOrder(id) {
    return request(`/orders/${id}`, { method: 'GET' });
  },

  async createOrder(orderData) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async deleteOrder(id) {
    return request(`/orders/${id}`, { method: 'DELETE' });
  },
};
