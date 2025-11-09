import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

console.log("🌐 API Base URL:", baseURL);

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout for uploads
});

// Helper để lấy token an toàn (tránh lỗi SSR)
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("auth_token");
  } catch (error) {
    console.warn("⚠️ Cannot access localStorage:", error);
    return null;
  }
};

// Interceptor để gắn token nếu có
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("📡 Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error("❌ Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor để log lỗi và success
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful responses cho upload
    if (
      response.config?.url?.includes("/images") &&
      response.config?.method === "post"
    ) {
      console.log("✅ Upload Success:", {
        url: response.config.url,
        status: response.status,
      });
    }
    
    // Log successful report responses
    if (response.config?.url?.includes("/reports") || response.config?.url?.includes("/debts")) {
      console.log("📊 Report API Success:", {
        url: response.config.url,
        status: response.status,
        dataCount: response.data?.data ? Object.keys(response.data.data).length : 0
      });
    }
    
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    };
    
    console.error("❌ API Error Details:", errorDetails);
    
    // Phân loại và xử lý các loại lỗi cụ thể
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - Server không phản hồi sau 30s');
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('🌐 Network error - Kiểm tra kết nối mạng hoặc server');
    }
    
    if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - Token không hợp lệ hoặc hết hạn');
      // Có thể thêm logic redirect đến login ở đây
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        // window.location.href = "/login";
      }
    }
    
    if (error.response?.status === 404) {
      console.error('🔍 API endpoint không tồn tại:', error.config?.url);
    }
    
    if (error.response?.status >= 500) {
      console.error('🚨 Server error - Liên hệ admin để được hỗ trợ');
    }
    
    return Promise.reject({
      ...error,
      _handled: true,
      _timestamp: new Date().toISOString()
    });
  }
);

// Helper function để test kết nối API
export const testAPIConnection = async (): Promise<boolean> => {
  try {
    const response = await axiosClient.get("/health");
    console.log("✅ API Connection Test:", response.status);
    return true;
  } catch (error) {
    console.error("❌ API Connection Test Failed:", error);
    return false;
  }
};

// Helper function để retry request
export const retryRequest = async (
  requestFn: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      
      console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export default axiosClient;