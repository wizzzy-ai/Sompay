import axios from 'axios';


let accessToken = null;

export function setAccessToken(token) { 
  accessToken = token; 
}

export function clearAccessToken() { 
  accessToken = null; 
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = accessToken || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}
  return config;
});

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach(cb => cb(token));
  subscribers = [];
}

function addSubscriber(cb) { 
  subscribers.push(cb); 
}

api.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error;

    if (response && response.status === 404 && config && !config._routeRetry) {
      const originalUrl = config.url || '';
      if (originalUrl.startsWith('/auth/')) {
        config._routeRetry = true;
        config.url = `/api${originalUrl}`;
        return api(config);
      }
      if (originalUrl.startsWith('/api/auth/')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/api/auth/', '/auth/');
        return api(config);
      }
      if (originalUrl.startsWith('/payments/')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/payments/', '/api/payment/');
        return api(config);
      }
      if (originalUrl.startsWith('/dashboard/')) {
        config._routeRetry = true;
        config.url = `/api${originalUrl}`;
        return api(config);
      }
      if (originalUrl.startsWith('/api/dashboard/')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/api/dashboard/', '/dashboard/');
        return api(config);
      }
      if (originalUrl.startsWith('/api/payment/')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/api/payment/', '/payments/');
        return api(config);
      }
      if (originalUrl.startsWith('/users/')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/users/', '/api/user/');
        return api(config);
      }
      if (originalUrl.startsWith('/api/user/')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/api/user/', '/users/');
        return api(config);
      }
      if (originalUrl.startsWith('/messages')) {
        config._routeRetry = true;
        config.url = `/api${originalUrl}`;
        return api(config);
      }
      if (originalUrl.startsWith('/api/messages')) {
        config._routeRetry = true;
        config.url = originalUrl.replace('/api/messages', '/messages');
        return api(config);
      }
    }
    
    if (response && response.status === 401 && !config._retry) {
      if (isRefreshing) {
        return new Promise(resolve => {
          addSubscriber(token => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(api(config));
          });
        });
      }
      
      config._retry = true;
      isRefreshing = true;
      
      try {
        let r;
        try {
          r = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        } catch (refreshErr) {
          if (refreshErr?.response?.status === 404) {
            r = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
          } else {
            throw refreshErr;
          }
        }
        const newToken = r.data.accessToken;
        setAccessToken(newToken);
        onRefreshed(newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (e) {
        clearAccessToken();
        window.location.href = `${import.meta.env.BASE_URL}login`;
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
