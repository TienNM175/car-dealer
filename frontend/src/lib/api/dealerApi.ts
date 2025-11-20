import api from '../utils/axiosClient';
import { fetchReport } from '@/lib/api/reportApi';

export interface Dealer {
  id: string;
  name: string;
  code: string;
  regionId: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    users: number;
    dealerOrders: number;
    inventories: number;
    dealerTargets?: number;
  };
}

export interface Region {
  id: string;
  name: string;
  code: string;
  _count?: {
    dealers: number;
  };
}

export interface CreateDealerInput {
  name: string;
  code: string;
  regionId: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface UpdateDealerInput {
  name?: string;
  regionId?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface DealerFilters {
  search?: string;
  regionId?: string;
  city?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DealersListResponse {
  success: boolean;
  message: string;
  data: Dealer[];
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface DealerResponse {
  success: boolean;
  data: Dealer;
  message?: string;
}

export interface DealerDebtInfo {
  dealerId: string;
  totalDebt: number;
  overdueDebt: number;
  creditLimit: number;
  availableCredit: number;
  lastUpdated: string;
  _debug?: {
    debtItemsCount: number;
    reportSummary: any;
    dataSource?: string;
  };
}

class DealerApi {
  // Dealer CRUD
  async getAllDealers(filters: DealerFilters = {}, pagination: PaginationParams = {}): Promise<DealersListResponse> {
    const params = { ...filters, ...pagination };
    const response = await api.get('/dealers', { params });
    return response.data;
  }

  async getDealerById(id: string): Promise<DealerResponse> {
    const response = await api.get(`/dealers/${id}`);
    return response.data;
  }

  async createDealer(data: CreateDealerInput): Promise<DealerResponse> {
    const response = await api.post('/dealers', data);
    return response.data;
  }

  async updateDealer(id: string, data: UpdateDealerInput): Promise<DealerResponse> {
    const response = await api.put(`/dealers/${id}`, data);
    return response.data;
  }

  async deleteDealer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ [dealerApi] Deleting dealer: ${id}`);
      
      const response = await api.delete(`/dealers/${id}`);
      
      console.log('✅ [dealerApi] Delete successful:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ [dealerApi] Delete error details:', {
        url: `/dealers/${id}`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });
      
      if (error.response?.data) {
        console.error('📡 [dealerApi] Server response data:', {
          message: error.response.data.message,
          error: error.response.data.error,
          details: error.response.data.details,
          constraints: error.response.data.constraints,
          code: error.response.data.code
        });
      }
      
      throw error;
    }
  }

  // Regions
  async getAllRegions(): Promise<{ success: boolean; data: Region[] }> {
    const response = await api.get('/dealers/regions');
    return response.data;
  }

  // Staff Management
  async getDealerStaff(dealerId: string): Promise<{
      message: string; success: boolean; data: any[] 
  }> {
    const response = await api.get(`/dealers/${dealerId}/staff`);
    return response.data;
  }

  async addStaff(dealerId: string, staffData: any): Promise<{
      message: string | undefined; success: boolean; data: any 
  }> {
    const response = await api.post(`/dealers/${dealerId}/staff`, staffData);
    return response.data;
  }

  async updateStaff(dealerId: string, staffId: string, data: any): Promise<{ success: boolean; data: any }> {
    const response = await api.put(`/dealers/${dealerId}/staff/${staffId}`, data);
    return response.data;
  }

  async removeStaff(dealerId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/dealers/${dealerId}/staff/${staffId}`);
    return response.data;
  }

  // Dealer Operations
  async getDealerInventory(dealerId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/dealers/${dealerId}/inventory`);
    return response.data;
  }

  async getDealerOrders(dealerId: string, status?: string): Promise<{ success: boolean; data: any[] }> {
    const params = status ? { status } : {};
    const response = await api.get(`/dealers/${dealerId}/orders`, { params });
    return response.data;
  }

  async getDealerSalesStats(dealerId: string, fromDate?: Date, toDate?: Date): Promise<{ success: boolean; data: any }> {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate.toISOString();
    if (toDate) params.toDate = toDate.toISOString();
    
    const response = await api.get(`/dealers/${dealerId}/sales-stats`, { params });
    return response.data;
  }

  // Targets
  async getDealerTargets(dealerId: string, year?: number): Promise<{
      message: string; success: boolean; data: any[] 
  }> {
    const params = year ? { year } : {};
    const response = await api.get(`/dealers/${dealerId}/targets`, { params });
    return response.data;
  }

  async setDealerTarget(dealerId: string, year: number, month: number, targetAmount: number): Promise<{
      message: string | undefined; success: boolean; data: any 
  }> {
    const response = await api.post(`/dealers/${dealerId}/targets`, {
      year,
      month,
      targetAmount,
    });
    return response.data;
  }

  async deleteDealerTarget(targetId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ [dealerApi] Deleting dealer target: ${targetId}`);
      
      const response = await api.delete(`/dealers/targets/${targetId}`);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ [dealerApi] Failed to delete dealer target:', error);
      
      if (error.response?.status === 404) {
        console.log('🔄 Trying alternative endpoint...');
        try {
          const altResponse = await api.delete(`/dealer-targets/${targetId}`);
          return altResponse.data;
        } catch (altError) {
          console.error('❌ Alternative endpoint also failed:', altError);
          throw altError;
        }
      }
      
      throw error;
    }
  }

  async deactivateDealerTarget(targetId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔴 [dealerApi] Deactivating dealer target: ${targetId}`);
      const response = await api.put(`/dealers/targets/${targetId}`, {
        isActive: false
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [dealerApi] Failed to deactivate dealer target:', error);
      throw error;
    }
  }

  async getDealerDebt(dealerId: string, userRole?: string): Promise<DealerDebtInfo> {
    try {
      console.log(`💰 [dealerApi] Fetching debt for dealer: ${dealerId}, userRole: ${userRole}`);
      
      // Cho phép Admin, EVM Staff, và Dealer Manager xem công nợ
      const canAccessDebtReport = userRole === 'ADMIN' || userRole === 'EVM_STAFF' || userRole === 'DEALER_MANAGER';
      
      if (!canAccessDebtReport) {
        console.log('🔒 [dealerApi] User not authorized for debt report, using zero debt');
        return {
          dealerId,
          totalDebt: 0,
          overdueDebt: 0,
          creditLimit: 5000000000,
          availableCredit: 5000000000,
          lastUpdated: new Date().toISOString(),
          _debug: {
            debtItemsCount: 0,
            reportSummary: { source: 'restricted_access' },
            dataSource: 'restricted'
          }
        };
      }
      
      // Nếu có quyền, thử API báo cáo công nợ đại lý
      try {
        const reportData = await fetchReport('dealer-debts', 'all', dealerId);
        console.log('✅ [dealerApi] Debt data from report API:', reportData);
        
        // Tìm công nợ của dealer cụ thể từ báo cáo
        return this.extractDealerDebtFromReport(reportData, dealerId);
        
      } catch (reportError: any) {
        console.error('❌ [dealerApi] Debt report failed:', reportError.message);
        // Nếu báo cáo công nợ bị lỗi, trả về công nợ = 0
        return {
          dealerId,
          totalDebt: 0,
          overdueDebt: 0,
          creditLimit: 5000000000,
          availableCredit: 5000000000,
          lastUpdated: new Date().toISOString(),
          _debug: {
            debtItemsCount: 0,
            reportSummary: { source: 'api_error' },
            dataSource: 'error'
          }
        };
      }
      
    } catch (error: any) {
      console.error('❌ [dealerApi] Error fetching dealer debt:', error.message);
      
      // Fallback: sử dụng giá trị mặc định
      return {
        dealerId,
        totalDebt: 0,
        overdueDebt: 0,
        creditLimit: 5000000000,
        availableCredit: 5000000000,
        lastUpdated: new Date().toISOString(),
        _debug: {
          debtItemsCount: 0,
          reportSummary: { source: 'fallback' },
          dataSource: 'fallback'
        }
      };
    }
  }

  // Method để trích xuất công nợ của dealer cụ thể từ báo cáo
  private extractDealerDebtFromReport(reportData: any, dealerId: string): DealerDebtInfo {
    try {
      const detailedDebts = reportData.detailedDebts || [];
      const summary = reportData.summary || {};
      
      console.log('📊 [dealerApi] Processing report data:', {
        detailedDebtsCount: detailedDebts.length,
        summaryTotalDebt: summary.totalDebt
      });

      // Tìm công nợ của dealer cụ thể
      const dealerDebts = detailedDebts.filter((debt: any) => {
        const debtDealerId = debt.dealer?.id || debt.dealerId;
        return debtDealerId === dealerId;
      });

      // Tính tổng công nợ
      let totalDebt = 0;
      if (summary.totalDebt && detailedDebts.length === 0) {
        totalDebt = summary.totalDebt;
      } else {
        totalDebt = dealerDebts.reduce((sum: number, debt: any) => {
          return sum + (debt.remainingBalance || debt.totalAmount || 0);
        }, 0);
      }

      // Tính công nợ quá hạn
      const overdueDebt = dealerDebts.reduce((sum: number, debt: any) => {
        if (debt.isOverdue || debt.status === 'OVERDUE') {
          return sum + (debt.remainingBalance || debt.totalAmount || 0);
        }
        return sum;
      }, 0);

      const creditLimit = 5000000000;
      const availableCredit = Math.max(0, creditLimit - totalDebt);

      const result: DealerDebtInfo = {
        dealerId,
        totalDebt,
        overdueDebt,
        creditLimit,
        availableCredit,
        lastUpdated: new Date().toISOString()
      };

      // Debug info
      if (process.env.NODE_ENV === 'development') {
        result._debug = {
          debtItemsCount: dealerDebts.length,
          reportSummary: summary,
          dataSource: detailedDebts.length > 0 ? 'detailed' : 'summary'
        };
      }

      return result;

    } catch (error) {
      console.error('❌ [dealerApi] Error extracting dealer debt from report:', error);
      return {
        dealerId,
        totalDebt: 0,
        overdueDebt: 0,
        creditLimit: 5000000000,
        availableCredit: 5000000000,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

export const dealerApi = new DealerApi();