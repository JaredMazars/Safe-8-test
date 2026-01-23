import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Get CSRF token
let csrfToken = null;
export const getCsrfToken = async () => {
  if (!csrfToken) {
    try {
      console.log('🔐 Fetching CSRF token...');
      const response = await api.get('/api/csrf-token');
      csrfToken = response.data.token;
      console.log('🔐 CSRF token received:', csrfToken ? 'YES' : 'NO');
    } catch (error) {
      console.error('🔐 Failed to fetch CSRF token:', error);
    }
  }
  return csrfToken;
};

// Add CSRF token and admin token to requests
api.interceptors.request.use(async config => {
  console.log('🌐 API Request:', config.method.toUpperCase(), config.url);
  
  // Add admin token if exists
  const token = localStorage.getItem('adminToken');
  if (token && config.url.includes('/admin/')) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Admin token added');
  }
  
  // Add CSRF token for state-changing requests
  if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    const csrf = await getCsrfToken();
    if (csrf) {
      config.headers['x-csrf-token'] = csrf;
      console.log('🔐 CSRF token added to request');
    } else {
      console.warn('⚠️ CSRF token not available for', config.method, config.url);
    }
  }
  
  console.log('📤 Request headers:', config.headers);
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.location.pathname.includes('/admin/')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
