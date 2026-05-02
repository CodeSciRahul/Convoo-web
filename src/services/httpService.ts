import axios from "axios";
import properties from "@/config/properties";
import { removeUserInfo } from "@/Redux/feature/authSlice";
import { store } from "@/Redux/Store";
import { AxiosRequestConfig, AxiosResponse } from 'axios';

// Create custom Axios instance
const custom_axios = axios.create({
    baseURL: properties?.PUBLIC_BASE_URL,
});

// Add request interceptor to include Authorization header
custom_axios.interceptors.request.use(
    (config) => {
        const tokenString = localStorage.getItem("token");
        const token = tokenString ? JSON.parse(tokenString) : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors globally
custom_axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status) {
            if (error.response.status === 401) {
                store.dispatch(removeUserInfo())
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Define HTTP helper functions
function httpGet<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return custom_axios.get<T>(url, config);
  }
  
  function httpPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return custom_axios.post<T>(url, data, config);
  }
  
  function httpPatch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return custom_axios.patch<T>(url, data, config);
  }
  
  function httpPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return custom_axios.put<T>(url, data, config);
  }
  
  function httpDelete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return custom_axios.delete<T>(url, config);
  }

// Export HTTP methods
const http = {
    get: httpGet,
    post: httpPost,
    put: httpPut,
    delete: httpDelete,
    patch: httpPatch,
};

export default http;
