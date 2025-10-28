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

// Interceptor để gắn token nếu có
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  console.log("🔑 Token:", token ? "Present" : "Missing");
  console.log("📡 Request:", config.method?.toUpperCase(), config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để log lỗi và success
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful upload responses
    if (
      response.config?.url?.includes("/images") &&
      response.config?.method === "post"
    ) {
      console.log("✅ Upload Success:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default axiosClient;
