// mobile/src/api/contractLookup.ts
import { apiClient } from './client';

export interface ContractLookupRequest {
  contractCode: string;
  email?: string;
  phone?: string;
}

export interface ContractLookupResponse {
  success: boolean;
  message: string;
  data: {
    contract: any;
    customer: any;
    vehicle: any;
    dealer: any;
    staff: any;
    debt: any;
  };
}

export interface DebtInfoResponse {
  success: boolean;
  message: string;
  data: {
    contractCode: string;
    customer: any;
    debt: any;
    paymentHistory: any[];
  };
}

export interface PaymentScheduleResponse {
  success: boolean;
  message: string;
  data: {
    contractCode: string;
    customer: any;
    paymentInfo: any;
    schedule: any[];
    summary: any;
  };
}

export const contractLookupApi = {
  /**
   * Lookup contract by contract code and customer info
   */
  lookupContract: async (data: ContractLookupRequest) => {
    const response = await apiClient.post<ContractLookupResponse>(
      '/public/contracts/lookup',
      data
    );
    return response.data;
  },

  /**
   * Get debt information for a contract
   */
  getContractDebt: async (contractCode: string, email?: string, phone?: string) => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);

    const response = await apiClient.get<DebtInfoResponse>(
      `/public/contracts/${contractCode}/debt?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get payment schedule for installment contract
   */
  getPaymentSchedule: async (contractCode: string, email?: string, phone?: string) => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);

    const response = await apiClient.get<PaymentScheduleResponse>(
      `/public/contracts/${contractCode}/payment-schedule?${params.toString()}`
    );
    return response.data;
  },
};