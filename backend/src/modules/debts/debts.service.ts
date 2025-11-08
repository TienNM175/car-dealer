import prisma from "../../config/database";

export class DebtsService {
  /**
   * Get customer installment debts - Công nợ trả góp của khách hàng
   */
  async getCustomerInstallmentDebts(dealerId?: string, filters?: any) {
    try {
      console.log("🔍 DEBTS SERVICE: Starting getCustomerInstallmentDebts");
      console.log("🔍 DEBTS SERVICE: dealerId:", dealerId);
      console.log("🔍 DEBTS SERVICE: filters:", filters);

      const where: any = {
        paymentType: "INSTALLMENT",
        status: { in: ["SIGNED", "DELIVERING", "COMPLETED"] }
      };

      console.log("🔍 DEBTS SERVICE: Base where clause:", where);

      if (dealerId) {
        where.staff = { dealerId: dealerId };
        console.log("🔍 DEBTS SERVICE: Added dealer filter");
      }

      // THÊM LOG ĐỂ XEM QUERY CUỐI CÙNG
      console.log("🔍 DEBTS SERVICE: Final where clause:", JSON.stringify(where, null, 2));

      const installmentContracts = await prisma.contract.findMany({
        where,
        include: {
          customer: true,
          vehicle: { include: { manufacturer: true } },
          staff: { include: { dealer: true } },
          customerDebts: true
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log("🔍 DEBTS SERVICE: Found contracts:", installmentContracts.length);
      
      if (installmentContracts.length === 0) {
        console.log("🔍 DEBTS SERVICE: NO CONTRACTS FOUND - Possible issues:");
        console.log("   - No contracts with paymentType=INSTALLMENT");
        console.log("   - No contracts with status in [SIGNED, DELIVERING, COMPLETED]");
        console.log("   - Dealer filter might be too restrictive");
      }

      const debts = installmentContracts.map(contract => {
        const customerDebt = contract.customerDebts?.[0];
        const paidAmount = customerDebt ? Number(customerDebt.paidAmount) : 0;
        const totalAmount = Number(contract.finalPrice);
        const remainingBalance = totalAmount - paidAmount;
        
        const isOverdue = this.checkIfOverdue(contract, customerDebt);
        
        return {
          contract: {
            id: contract.id,
            contractCode: contract.contractCode,
            finalPrice: contract.finalPrice,
            monthlyPayment: contract.monthlyPayment,
            installmentMonths: contract.installmentMonths,
            createdAt: contract.createdAt,
            signedAt: contract.signedAt
          },
          customer: {
            id: contract.customer.id,
            firstName: contract.customer.firstName,
            lastName: contract.customer.lastName,
            email: contract.customer.email,
            phone: contract.customer.phone
          },
          vehicle: {
            id: contract.vehicle.id,
            model: contract.vehicle.model,
            variant: contract.vehicle.variant,
            manufacturer: contract.vehicle.manufacturer
          },
          dealer: contract.staff.dealer,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          remainingBalance: remainingBalance,
          monthlyPayment: contract.monthlyPayment ? Number(contract.monthlyPayment) : null,
          status: remainingBalance <= 0 ? 'PAID' : 'UNPAID',
          isOverdue: isOverdue
        };
      });

      const summary = this.calculateDebtSummary(debts);
      
      console.log(`[DEBTS] Summary:`, summary);

      return {
        debts,
        summary
      };
    } catch (error) {
        console.error("❌ DEBTS SERVICE ERROR:", error);
        throw error;
    }
  }

  /**
   * Get dealer order debts - Công nợ đại lý với hãng
   */
  async getDealerOrderDebts(dealerId?: string, filters?: any) {
    try {
      console.log("🎯 getDealerOrderDebts called with:", { dealerId, filters });

      const where: any = {
        status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }
      };

      if (dealerId) {
        where.dealerId = dealerId;
      }

      if (filters?.fromDate || filters?.toDate) {
        where.orderedAt = {};
        if (filters.fromDate) where.orderedAt.gte = new Date(filters.fromDate);
        if (filters.toDate) where.orderedAt.lte = new Date(filters.toDate);
      }

      const dealerOrders = await prisma.dealerOrder.findMany({
        where,
        include: {
          dealer: true,
          vehicle: {
            include: { manufacturer: true }
          }
        },
        orderBy: { orderedAt: 'desc' }
      });

      console.log(`[DEBTS] Found ${dealerOrders.length} dealer orders`);

      const debts = dealerOrders.map(order => {
        const paidAmount = 0;
        const totalAmount = Number(order.totalAmount);
        const remainingBalance = totalAmount - paidAmount;
        
        return {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
            orderedAt: order.orderedAt,
            deliveredAt: order.deliveredAt
          },
          dealer: order.dealer,
          vehicle: order.vehicle,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          remainingBalance: remainingBalance,
          status: remainingBalance <= 0 ? 'PAID' : 'UNPAID',
          isOverdue: this.checkDealerOrderOverdue(order)
        };
      });

      return {
        debts,
        summary: this.calculateDebtSummary(debts)
      };
    } catch (error) {
      console.error("❌ Error in getDealerOrderDebts:", error);
      throw error;
    }
  }

  /**
   * Get debt overview for dashboard
   */
  async getDebtOverview(filters: any) {
    try {
      console.log("🎯 getDebtOverview called with:", filters);

      const [customerDebts, dealerDebts] = await Promise.all([
        this.getCustomerInstallmentDebts(filters.dealerId, filters),
        this.getDealerOrderDebts(filters.dealerId, filters)
      ]);

      return {
        customerDebts: customerDebts.summary,
        dealerDebts: dealerDebts.summary,
        totalOutstandingDebt: customerDebts.summary.totalDebt + dealerDebts.summary.totalDebt
      };
    } catch (error) {
      console.error("❌ Error in getDebtOverview:", error);
      throw error;
    }
  } // ĐÓNG getDebtOverview Ở ĐÂY

  /**
   * Get detailed dealer debts with payment history
   */
  async getDealerDebtsDetail(dealerId?: string, filters?: any) {
    try {
      console.log("🎯 getDealerDebtsDetail called with:", { dealerId, filters });

      const where: any = {};

      if (dealerId) {
        where.dealerId = dealerId;
      }

      // Get dealer debts
      const dealerDebts = await prisma.dealerDebt.findMany({
        where,
        include: {
          dealer: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get dealer orders for detailed breakdown
      const dealerOrdersWhere: any = {
        status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }
      };

      if (dealerId) {
        dealerOrdersWhere.dealerId = dealerId;
      }

      const dealerOrders = await prisma.dealerOrder.findMany({
        where: dealerOrdersWhere,
        include: {
          dealer: true,
          vehicle: {
            include: { manufacturer: true }
          },
          staff: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { orderedAt: 'desc' }
      });

      // Calculate detailed debts from orders
      const detailedDebts = dealerOrders.map(order => {
        const paidAmount = 0; // This would come from payment records in a real system
        const totalAmount = Number(order.totalAmount);
        const remainingBalance = totalAmount - paidAmount;
        
        const dueDate = this.calculateDealerOrderDueDate(order);
        const isOverdue = this.checkDealerDebtOverdue(dueDate, remainingBalance);
        
        return {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
            orderedAt: order.orderedAt,
            deliveredAt: order.deliveredAt,
            dueDate: dueDate
          },
          dealer: order.dealer,
          vehicle: order.vehicle,
          staff: order.staff,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          remainingBalance: remainingBalance,
          dueDate: dueDate,
          status: remainingBalance <= 0 ? 'PAID' : (isOverdue ? 'OVERDUE' : 'UNPAID'),
          isOverdue: isOverdue,
          daysOverdue: isOverdue ? this.calculateDaysOverdue(dueDate) : 0
        };
      });

      // Summary statistics
      const summary = {
        totalDebt: detailedDebts.reduce((sum, debt) => sum + Number(debt.remainingBalance || 0), 0),
        totalOrders: detailedDebts.length,
        unpaidOrders: detailedDebts.filter(d => Number(d.remainingBalance || 0) > 0).length,
        overdueOrders: detailedDebts.filter(d => d.isOverdue).length,
        totalPaid: detailedDebts.reduce((sum, debt) => sum + Number(debt.paidAmount || 0), 0)
      };

      return {
        dealerDebts: dealerDebts,
        detailedDebts: detailedDebts,
        summary: summary
      };
    } catch (error) {
      console.error("❌ Error in getDealerDebtsDetail:", error);
      throw error;
    }
  }

  // HELPER FUNCTIONS
  private checkIfOverdue(contract: any, customerDebt: any): boolean {
    if (!contract.signedAt) return false;
    
    const signedDate = new Date(contract.signedAt);
    const today = new Date();
    const daysSinceSigned = Math.floor((today.getTime() - signedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const paidAmount = customerDebt ? Number(customerDebt.paidAmount) : 0;
    const totalAmount = Number(contract.finalPrice);
    const remainingBalance = totalAmount - paidAmount;
    
    return daysSinceSigned > 30 && remainingBalance > 0;
  }

  private checkDealerOrderOverdue(order: any): boolean {
    if (!order.deliveredAt) return false;
    
    const deliveredDate = new Date(order.deliveredAt);
    const today = new Date();
    const daysSinceDelivered = Math.floor((today.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const paidAmount = 0;
    const remainingBalance = Number(order.totalAmount) - Number(paidAmount);
    
    return daysSinceDelivered > 30 && remainingBalance > 0;
  }

  private calculateDebtSummary(debts: any[]) {
    const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.remainingBalance || 0), 0);
    const activeDebts = debts.filter(d => Number(d.remainingBalance || 0) > 0);
    const overdueDebts = debts.filter(d => d.isOverdue);

    return {
      totalDebt,
      totalContracts: debts.length,
      activeContracts: activeDebts.length,
      overdueContracts: overdueDebts.length
    };
  }

  private calculateDealerOrderDueDate(order: any): Date {
    if (!order.deliveredAt) {
      // If not delivered yet, due date is 30 days after order date
      const dueDate = new Date(order.orderedAt);
      dueDate.setDate(dueDate.getDate() + 30);
      return dueDate;
    }
    
    // Due date is 30 days after delivery
    const dueDate = new Date(order.deliveredAt);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }

  private checkDealerDebtOverdue(dueDate: Date, remainingBalance: number): boolean {
    if (remainingBalance <= 0) return false;
    
    const today = new Date();
    return today > dueDate;
  }

  private calculateDaysOverdue(dueDate: Date): number {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}