// ============================================
// 5. src/api/client.ts
// ============================================
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../constants/config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url}`, response.status);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ Response Error:', error.response?.status, error.message);
        
        // Handle common errors
        if (error.response?.status === 404) {
          throw new Error('Không tìm thấy dữ liệu');
        } else if (error.response?.status === 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Kết nối timeout. Vui lòng kiểm tra mạng');
        } else if (!error.response) {
          throw new Error('Không thể kết nối đến máy chủ');
        }
        
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();
