import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Configuration
const API_BASE_URL = 'http://10.200.122.234:5000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track refresh token promise to prevent multiple simultaneous refreshes
let refreshTokenPromise: Promise<string> | null = null;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('Request token:', token.substring(0, 20) + '...');
            } else {
                console.log('No token found for request');
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // If refresh is already in progress, wait for it
                if (refreshTokenPromise) {
                    console.log('Waiting for existing refresh...');
                    const newToken = await refreshTokenPromise;
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    console.log('Retry token from waiting:', newToken.substring(0, 20) + '...');
                    return apiClient(originalRequest);
                }

                // Start new refresh
                refreshTokenPromise = (async () => {
                    const refreshToken = await SecureStore.getItemAsync('refresh_token');
                    if (!refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    console.log('Attempting token refresh...');
                    
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    const { accessToken } = response.data.data;
                    console.log('New access token received:', accessToken ? 'Yes' : 'No');
                    console.log('New token:', accessToken.substring(0, 20) + '...');
                    
                    // Store new token
                    await SecureStore.setItemAsync('access_token', accessToken);
                    
                    return accessToken;
                })();

                const newToken = await refreshTokenPromise;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                
                console.log('Retry token from new refresh:', newToken.substring(0, 20) + '...');
                console.log('Retrying request with new token...');
                return apiClient(originalRequest);

            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Clear refresh promise on failure
                refreshTokenPromise = null;
                // Refresh failed, redirect to login
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
            } finally {
                // Clear refresh promise when done
                refreshTokenPromise = null;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;