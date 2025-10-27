import axiosClient from "../utils/axiosClient";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";
    };
  };
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    axiosClient.post<LoginResponse>("/auth/login", data),

  getProfile: () => axiosClient.get<LoginResponse["data"]["user"]>("/auth/me"),
};
