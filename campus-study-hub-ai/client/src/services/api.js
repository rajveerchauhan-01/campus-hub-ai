import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000
});
let accessToken = null;
export const setAccessToken = token => { accessToken = token; };
api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
let refreshing = null;
api.interceptors.response.use(response => response, async error => {
  const original = error.config;
  if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
    original._retry = true;
    try {
      refreshing ||= api.post('/auth/refresh').then(({ data }) => { setAccessToken(data.accessToken); return data.accessToken; }).finally(() => { refreshing = null; });
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch { setAccessToken(null); }
  }
  return Promise.reject(error);
});
export function getErrorMessage(error) {
  return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Something went wrong.';
}
