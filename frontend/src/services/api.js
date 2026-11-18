import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('mandap-auth') || '{}');
  const token = auth?.state?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Never redirect on 401 from auth endpoints — a failed login should
    // show an error message, not bounce the user to another page.
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const auth = JSON.parse(localStorage.getItem('mandap-auth') || '{}');
      const refreshToken = auth?.state?.refreshToken;
      const userRole = auth?.state?.user?.role;
      // Send admins back to their own login page, everyone else to /login.
      const loginPath = userRole === 'ADMIN' ? '/admin/login' : '/login';
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          const stored = JSON.parse(localStorage.getItem('mandap-auth') || '{}');
          stored.state.token = data.token;
          localStorage.setItem('mandap-auth', JSON.stringify(stored));
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem('mandap-auth');
          window.location.href = loginPath;
        }
      } else {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
