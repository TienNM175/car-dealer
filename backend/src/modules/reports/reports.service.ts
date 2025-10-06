import prisma from "../../config/database";
import { Prisma } from "@prisma/client";

interface DateRangeFilter {
  fromDate?: Date;
  toDate?: Date;
}

interface DealerFilter extends DateRangeFilter {
  dealerId?: string;
}

export class ReportsService {
  /**
   * Dashboard Overview - Key metrics
   */
  async getDashboardOverview(filters: DealerFilter) {
    const where: any = {
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
    };

    // Total customers
    const totalCustomers = await prisma.customer.count({
      where: {
        ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
        ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      },
    });

    // New customers this period
    const newCustomers = totalCustomers;

    // Active customers (with recent activity)
    const activeCustomers = await prisma.customer.count({
      where: {
        status: { in: ["CONTACTED", "TEST_DRIVE", "QUOTED", "PURCHASED"] },
      },
    });

    // Total contracts
    const contractWhere: Prisma.ContractWhereInput = {
      ...where,
      ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }),
    };

    const contractStats = await prisma.contract.aggregate({
      where: contractWhere,
      _count: true,
      _sum: {
        finalPrice: true,
        discount: true,
      },
    });

    // Completed contracts
    const completedContracts = await prisma.contract.count({
      where: {
        ...contractWhere,
        status: "COMPLETED",
      },
    });

    // Total revenue
    const revenue = await prisma.contract.aggregate({
      where: {
        ...contractWhere,
        status: "COMPLETED",
      },
      _sum: {
        finalPrice: true,
      },
    });

    // Test drives
    const testDriveWhere: Prisma.TestDriveWhereInput = {
      ...(filters.fromDate && { scheduledDate: { gte: filters.fromDate } }),
      ...(filters.toDate && { scheduledDate: { lte: filters.toDate } }),
      ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }),
    };

    const testDriveStats = await prisma.testDrive.groupBy({
      by: ["status"],
      where: testDriveWhere,
      _count: true,
    });

    const totalTestDrives = testDriveStats.reduce(
      (sum, item) => sum + item._count,
      0
    );
    const completedTestDrives =
      testDriveStats.find((item) => item.status === "COMPLETED")?._count || 0;

    // Inventory
    const totalInventory = await prisma.inventory.aggregate({
      where: filters.dealerId ? { dealerId: filters.dealerId } : {},
      _sum: {
        quantity: true,
        available: true,
        reserved: true,
        sold: true,
      },
    });

    // Dealer orders
    const dealerOrderWhere: Prisma.DealerOrderWhereInput = {
      ...(filters.fromDate && { orderedAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { orderedAt: { lte: filters.toDate } }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
    };

    const dealerOrderStats = await prisma.dealerOrder.aggregate({
      where: dealerOrderWhere,
      _count: true,
      _sum: {
        quantity: true,
        totalAmount: true,
      },
    });

    return {
      customers: {
        total: totalCustomers,
        new: newCustomers,
        active: activeCustomers,
      },
      sales: {
        totalContracts: contractStats._count,
        completedContracts,
        totalRevenue: revenue._sum.finalPrice || 0,
        totalDiscount: contractStats._sum.discount || 0,
        averageOrderValue:
          completedContracts > 0
            ? Number(revenue._sum.finalPrice || 0) / completedContracts
            : 0,
      },
      testDrives: {
        total: totalTestDrives,
        completed: completedTestDrives,
        completionRate:
          totalTestDrives > 0
            ? (completedTestDrives / totalTestDrives) * 100
            : 0,
      },
      inventory: {
        total: totalInventory._sum.quantity || 0,
        available: totalInventory._sum.available || 0,
        reserved: totalInventory._sum.reserved || 0,
        sold: totalInventory._sum.sold || 0,
      },
      dealerOrders: {
        totalOrders: dealerOrderStats._count,
        totalQuantity: dealerOrderStats._sum.quantity || 0,
        totalAmount: dealerOrderStats._sum.totalAmount || 0,
      },
    };
  }

  /**
   * Sales Report - Detailed sales analysis
   */
  async getSalesReport(filters: DealerFilter) {
    const where: Prisma.ContractWhereInput = {
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }),
    };

    // Sales by status
    const byStatus = await prisma.contract.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    // Sales by payment type
    const byPaymentType = await prisma.contract.groupBy({
      by: ["paymentType"],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    // Sales by vehicle
    const byVehicle = await prisma.contract.groupBy({
      by: ["vehicleId"],
      where: {
        ...where,
        status: "COMPLETED",
      },
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    const topVehicles = await Promise.all(
      byVehicle.slice(0, 10).map(async (item) => {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: item.vehicleId },
          select: {
            id: true,
            model: true,
            variant: true,
            manufacturer: {
              select: {
                name: true,
              },
            },
          },
        });
        return {
          vehicle,
          count: item._count,
          revenue: item._sum.finalPrice || 0,
        };
      })
    );

    // Sales by staff
    const byStaff = await prisma.contract.groupBy({
      by: ["staffId"],
      where: {
        ...where,
        status: "COMPLETED",
      },
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    const staffPerformance = await Promise.all(
      byStaff.map(async (item) => {
        const staff = await prisma.user.findUnique({
          where: { id: item.staffId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });
        return {
          staff,
          salesCount: item._count,
          totalRevenue: item._sum.finalPrice || 0,
          averageOrderValue: Number(item._sum.finalPrice || 0) / item._count,
        };
      })
    );

    // Monthly trend (last 12 months)
    const monthlyTrend = await this.getMonthlySalesTrend(filters);

    return {
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
      byPaymentType: byPaymentType.map((item) => ({
        type: item.paymentType,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
      topVehicles: topVehicles.sort(
        (a, b) => Number(b.revenue) - Number(a.revenue)
      ),
      staffPerformance: staffPerformance.sort(
        (a, b) => Number(b.totalRevenue) - Number(a.totalRevenue)
      ),
      monthlyTrend,
    };
  }

  /**
   * Monthly sales trend
   */
  private async getMonthlySalesTrend(filters: DealerFilter) {
    const endDate = filters.toDate || new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11); // Last 12 months

    const contracts = await prisma.contract.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
        ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }),
      },
      select: {
        createdAt: true,
        finalPrice: true,
      },
    });

    // Group by month
    const monthlyData: Record<string, { count: number; revenue: number }> = {};

    contracts.forEach((contract) => {
      const monthKey = `${contract.createdAt.getFullYear()}-${String(
        contract.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, revenue: 0 };
      }

      monthlyData[monthKey].count++;
      monthlyData[monthKey].revenue += Number(contract.finalPrice);
    });

    // Fill missing months with zeros
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      result.push({
        month: monthKey,
        count: monthlyData[monthKey]?.count || 0,
        revenue: monthlyData[monthKey]?.revenue || 0,
      });
    }

    return result;
  }

  /**
   * Customer Report
   */
  async getCustomerReport(filters: DateRangeFilter) {
    // Customer by status
    const byStatus = await prisma.customer.groupBy({
      by: ["status"],
      _count: true,
    });

    // Customer by city
    const byCity = await prisma.customer.groupBy({
      by: ["city"],
      _count: true,
      orderBy: {
        _count: {
          city: "desc",
        },
      },
      take: 10,
    });

    // Customer acquisition trend (last 12 months)
    const endDate = filters.toDate || new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11);

    const customers = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const monthlyAcquisition: Record<string, number> = {};
    customers.forEach((customer) => {
      const monthKey = `${customer.createdAt.getFullYear()}-${String(
        customer.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyAcquisition[monthKey] = (monthlyAcquisition[monthKey] || 0) + 1;
    });

    const acquisitionTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acquisitionTrend.push({
        month: monthKey,
        count: monthlyAcquisition[monthKey] || 0,
      });
    }

    // Conversion funnel
    const interested = await prisma.customer.count({
      where: { status: "INTERESTED" },
    });
    const contacted = await prisma.customer.count({
      where: { status: "CONTACTED" },
    });
    const testDrive = await prisma.customer.count({
      where: { status: "TEST_DRIVE" },
    });
    const quoted = await prisma.customer.count({ where: { status: "QUOTED" } });
    const purchased = await prisma.customer.count({
      where: { status: "PURCHASED" },
    });
    const total = interested + contacted + testDrive + quoted + purchased;

    return {
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      byCity: byCity
        .filter((item) => item.city)
        .map((item) => ({
          city: item.city,
          count: item._count,
        })),
      acquisitionTrend,
      conversionFunnel: {
        interested: {
          count: interested,
          percentage: total > 0 ? (interested / total) * 100 : 0,
        },
        contacted: {
          count: contacted,
          percentage: total > 0 ? (contacted / total) * 100 : 0,
        },
        testDrive: {
          count: testDrive,
          percentage: total > 0 ? (testDrive / total) * 100 : 0,
        },
        quoted: {
          count: quoted,
          percentage: total > 0 ? (quoted / total) * 100 : 0,
        },
        purchased: {
          count: purchased,
          percentage: total > 0 ? (purchased / total) * 100 : 0,
        },
      },
    };
  }

  /**
   * Inventory Report
   */
  async getInventoryReport(dealerId?: string) {
    // Dealer inventory summary
    const dealerInventory = await prisma.inventory.groupBy({
      by: ["dealerId"],
      where: dealerId ? { dealerId } : {},
      _sum: {
        quantity: true,
        available: true,
        reserved: true,
        sold: true,
      },
    });

    const dealerSummary = await Promise.all(
      dealerInventory.map(async (item) => {
        const dealer = await prisma.dealer.findUnique({
          where: { id: item.dealerId },
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        });
        return {
          dealer,
          quantity: item._sum.quantity || 0,
          available: item._sum.available || 0,
          reserved: item._sum.reserved || 0,
          sold: item._sum.sold || 0,
        };
      })
    );

    // Low stock items
    const lowStock = await prisma.inventory.findMany({
      where: {
        available: { lte: 5 },
        ...(dealerId && { dealerId }),
      },
      include: {
        dealer: {
          select: {
            name: true,
            city: true,
          },
        },
        vehicle: {
          select: {
            model: true,
            variant: true,
            manufacturer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { available: "asc" },
      take: 20,
    });

    // Vehicle popularity (most in inventory)
    const byVehicle = await prisma.inventory.groupBy({
      by: ["vehicleId"],
      where: dealerId ? { dealerId } : {},
      _sum: {
        quantity: true,
        sold: true,
      },
    });

    const vehicleStats = await Promise.all(
      byVehicle.slice(0, 10).map(async (item) => {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: item.vehicleId },
          select: {
            model: true,
            variant: true,
            manufacturer: {
              select: {
                name: true,
              },
            },
          },
        });
        return {
          vehicle,
          totalStock: item._sum.quantity || 0,
          totalSold: item._sum.sold || 0,
        };
      })
    );

    return {
      dealerSummary,
      lowStock,
      vehicleStats: vehicleStats.sort((a, b) => b.totalSold - a.totalSold),
    };
  }

  /**
   * Dealer Performance Report
   */
  async getDealerPerformanceReport(filters: DateRangeFilter) {
    const dealers = await prisma.dealer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
      },
    });

    const performance = await Promise.all(
      dealers.map(async (dealer) => {
        // Sales
        const salesStats = await prisma.contract.aggregate({
          where: {
            staff: { dealerId: dealer.id },
            status: "COMPLETED",
            ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
            ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
          },
          _count: true,
          _sum: {
            finalPrice: true,
          },
        });

        // Test drives
        const testDrives = await prisma.testDrive.count({
          where: {
            staff: { dealerId: dealer.id },
            status: "COMPLETED",
            ...(filters.fromDate && {
              scheduledDate: { gte: filters.fromDate },
            }),
            ...(filters.toDate && { scheduledDate: { lte: filters.toDate } }),
          },
        });

        // Inventory
        const inventory = await prisma.inventory.aggregate({
          where: { dealerId: dealer.id },
          _sum: {
            quantity: true,
            sold: true,
          },
        });

        // Staff count
        const staffCount = await prisma.user.count({
          where: {
            dealerId: dealer.id,
            isActive: true,
          },
        });

        // Target achievement
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const target = await prisma.target.findUnique({
          where: {
            dealerId_year_month: {
              dealerId: dealer.id,
              year: currentYear,
              month: currentMonth,
            },
          },
        });

        return {
          dealer,
          sales: {
            count: salesStats._count,
            revenue: salesStats._sum.finalPrice || 0,
          },
          testDrives,
          inventory: {
            total: inventory._sum.quantity || 0,
            sold: inventory._sum.sold || 0,
          },
          staffCount,
          target: target
            ? {
                targetAmount: target.targetAmount,
                achievedAmount: target.achievedAmount,
                achievementRate:
                  Number(target.targetAmount) > 0
                    ? (Number(target.achievedAmount) /
                        Number(target.targetAmount)) *
                      100
                    : 0,
              }
            : null,
        };
      })
    );

    return performance.sort(
      (a, b) => Number(b.sales.revenue) - Number(a.sales.revenue)
    );
  }

  /**
   * Executive Summary - High-level overview
   */
  async getExecutiveSummary(filters: DateRangeFilter) {
    const overview = await this.getDashboardOverview(filters);
    const salesReport = await this.getSalesReport(filters);
    const customerReport = await this.getCustomerReport(filters);

    return {
      period: {
        from: filters.fromDate?.toISOString().split("T")[0],
        to: filters.toDate?.toISOString().split("T")[0],
      },
      keyMetrics: {
        totalRevenue: overview.sales.totalRevenue,
        totalContracts: overview.sales.completedContracts,
        averageOrderValue: overview.sales.averageOrderValue,
        newCustomers: overview.customers.new,
        testDriveCompletionRate: overview.testDrives.completionRate,
      },
      trends: {
        monthlySales: salesReport.monthlyTrend,
        customerAcquisition: customerReport.acquisitionTrend,
      },
      topPerformers: {
        vehicles: salesReport.topVehicles.slice(0, 5),
        staff: salesReport.staffPerformance.slice(0, 5),
      },
    };
  }
}
