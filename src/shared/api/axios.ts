import axios, { AxiosError } from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return (
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      axiosError.message ??
      'Request failed'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
};
