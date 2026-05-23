const API_BASE = '/api';

const API = {
  // Get stored authentication token
  getToken() {
    return localStorage.getItem('token');
  },

  // Set auth token
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Save profile info
  setProfile(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Retrieve stored user profile info
  getProfile() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  // Clear credentials on logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Create headers
  getHeaders(isMultipart = false) {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Helper to handle API response and errors
  async handleResponse(response) {
    if (response.status === 401) {
      // Unauthorized: clear creds and send to landing
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/';
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Session expired. Please sign in again.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data;
  },

  // Standard GET request
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (err) {
      console.error(`GET ${endpoint} error:`, err);
      throw err;
    }
  },

  // Standard POST request
  async post(endpoint, body) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      return await this.handleResponse(response);
    } catch (err) {
      console.error(`POST ${endpoint} error:`, err);
      throw err;
    }
  },

  // Standard PUT request
  async put(endpoint, body) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      return await this.handleResponse(response);
    } catch (err) {
      console.error(`PUT ${endpoint} error:`, err);
      throw err;
    }
  },

  // Standard DELETE request
  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (err) {
      console.error(`DELETE ${endpoint} error:`, err);
      throw err;
    }
  },

  // Custom POST file upload request (Multer support)
  async postFile(endpoint, formData) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(true), // omit content-type, browser sets boundaries
        body: formData
      });
      return await this.handleResponse(response);
    } catch (err) {
      console.error(`FILE UPLOAD ${endpoint} error:`, err);
      throw err;
    }
  }
};
