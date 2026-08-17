import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 120 seconds to safely accommodate large document extraction and multi-batch AI generation
});

// Attach JWT token & active user session headers if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quizforge_token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const userJson = localStorage.getItem('quizforge_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user?._id || user?.id) {
        config.headers['x-user-id'] = user._id || user.id;
      }
      if (user?.name) {
        config.headers['x-user-name'] = encodeURIComponent(user.name);
      }
    } catch (e) {}
  }
  return config;
});

// Response interceptor to clear stale tokens on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('quizforge_token');
    }
    return Promise.reject(error);
  }
);

export default api;
