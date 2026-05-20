import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pendingGetRequests = new Map();
const getCache = new Map();
const CACHE_TTL = 60 * 1000;

const buildCacheKey = (url, config = {}) => {
  const params = config.params ? JSON.stringify(config.params) : '';
  const cacheMode = config.cache === false ? 'no-cache' : 'cache';
  return `${url}|${params}|${cacheMode}`;
};

const getCacheEntry = (key) => {
  const entry = getCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    getCache.delete(key);
    return null;
  }
  return entry.response;
};

const cachedGet = async (url, config = {}) => {
  const effectiveConfig = { ...config };
  const key = buildCacheKey(url, effectiveConfig);

  if (effectiveConfig.cache !== false) {
    const cachedResponse = getCacheEntry(key);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  if (pendingGetRequests.has(key)) {
    return pendingGetRequests.get(key);
  }

  const controller = new AbortController();
  if (!effectiveConfig.signal) {
    effectiveConfig.signal = controller.signal;
  }

  const requestPromise = api.request({ method: 'get', url, ...effectiveConfig })
    .then((response) => {
      pendingGetRequests.delete(key);
      if (effectiveConfig.cache !== false) {
        getCache.set(key, {
          response,
          expires: Date.now() + CACHE_TTL,
        });
      }
      return response;
    })
    .catch((error) => {
      pendingGetRequests.delete(key);
      throw error;
    });

  pendingGetRequests.set(key, requestPromise);
  return requestPromise;
};

api.get = cachedGet;

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

api.clearCache = (predicate) => {
  if (typeof predicate !== 'function') {
    getCache.clear();
    return;
  }
  for (const key of Array.from(getCache.keys())) {
    if (predicate(key)) {
      getCache.delete(key);
    }
  }
};

export default api;
