import prisma from "../../config/database";
import { Prisma } from "@prisma/client";

interface DateRangeFilter {
  fromDate?: Date;
  toDate?: Date;
}

interface DealerFilter extends DateRangeFilter {
  dealerId?: string;
  userId?: string;
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

    // Sales by staff (lọc theo dealer)
    const byStaff = await prisma.contract.groupBy({
      by: ["staffId"],
      where: {
        status: "COMPLETED",
        ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
        ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
        ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }), // ✅ Lọc theo dealer
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
            role: true,       // ✅ thêm role
            dealerId: true,   // ✅ thêm dealerId
            dealer: {         // ✅ lấy thông tin đại lý cho rõ
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        });

        return {
          staff: {
            id: staff?.id,
            firstName: staff?.firstName,
            lastName: staff?.lastName,
            email: staff?.email,
            role: staff?.role,               // ✅ thêm role
            dealerId: staff?.dealerId,       // ✅ để frontend lọc
            dealer: staff?.dealer || null,   // ✅ hiển thị tên đại lý
          },
          salesCount: item._count,
          totalRevenue: Number(item._sum.finalPrice || 0),
          averageOrderValue:
            item._count > 0 ? Number(item._sum.finalPrice || 0) / item._count : 0,
        };

      })
    );

    // Monthly trend (last 12 months)
    const monthlyTrend = await this.getMonthlySalesTrend(filters);

    // Vehicle sales by dealer - breakdown xe bán ở đại lý nào
    const vehiclesByDealer = await this.getVehicleSalesByDealer(where);

    // Tiền hủy cọc - tổng depositAmount của HĐ đặt cọc đã hủy
    const cancelledDeposits = await prisma.contract.aggregate({
      where: {
        contractType: "DEPOSIT",
        status: "CANCELLED",
        ...(filters.fromDate && { updatedAt: { gte: filters.fromDate } }), // Khi hủy
        ...(filters.toDate && { updatedAt: { lte: filters.toDate } }),
        ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }),
      },
      _sum: {
        depositAmount: true,
      },
      _count: true,
    });

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
      vehiclesByDealer, // Danh sách xe và breakdown theo đại lý
      cancelledDeposits: {
        totalAmount: cancelledDeposits._sum.depositAmount || 0,
        count: cancelledDeposits._count,
      },
    };
  }

  /**
   * Get vehicle sales breakdown by dealer
   * Trả về danh sách xe và mỗi xe bán ở đại lý nào, bao nhiêu hợp đồng
   */
  private async getVehicleSalesByDealer(where: Prisma.ContractWhereInput) {
    // Lấy tất cả contracts COMPLETED với vehicle và dealer info
    const contracts = await prisma.contract.findMany({
      where: {
        ...where,
        status: "COMPLETED",
      },
      select: {
        vehicleId: true,
        vehicle: {
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
        },
        staff: {
          select: {
            dealerId: true,
            dealer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Group theo vehicleId và dealerId
    const vehicleDealerMap = new Map<string, Map<string, number>>();
    const vehicleInfoMap = new Map<string, any>();

    contracts.forEach((contract) => {
      const vehicleId = contract.vehicleId;
      const dealerId = contract.staff.dealerId || "";
      const dealer = contract.staff.dealer;

      // Lưu thông tin vehicle (lần đầu gặp)
      if (!vehicleInfoMap.has(vehicleId)) {
        vehicleInfoMap.set(vehicleId, contract.vehicle);
      }

      // Khởi tạo map cho vehicle nếu chưa có
      if (!vehicleDealerMap.has(vehicleId)) {
        vehicleDealerMap.set(vehicleId, new Map());
      }

      const dealerMap = vehicleDealerMap.get(vehicleId)!;
      const currentCount = dealerMap.get(dealerId) || 0;
      dealerMap.set(dealerId, currentCount + 1);
    });

    // Chuyển đổi sang format response
    const result = Array.from(vehicleDealerMap.entries()).map(
      ([vehicleId, dealerMap]) => {
        const vehicle = vehicleInfoMap.get(vehicleId);
        const dealers = Array.from(dealerMap.entries())
          .map(([dealerId, contractCount]) => {
            // Tìm dealer info từ contracts
            const contract = contracts.find(
              (c) => c.vehicleId === vehicleId && c.staff.dealerId === dealerId
            );
            return {
              dealer: contract?.staff.dealer || {
                id: dealerId,
                name: "Unknown Dealer",
              },
              contractCount,
            };
          })
          .sort((a, b) => b.contractCount - a.contractCount); // Sort theo số lượng hợp đồng giảm dần

        const totalContracts = Array.from(dealerMap.values()).reduce(
          (sum, count) => sum + count,
          0
        );

        return {
          vehicle,
          dealers,
          totalContracts,
        };
      }
    );

    // Sort theo totalContracts giảm dần
    return result.sort((a, b) => b.totalContracts - a.totalContracts);
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
  async getCustomerReport(filters: DealerFilter) {
    const where: Prisma.ContractWhereInput = {
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      ...(filters.dealerId && { staff: { dealerId: filters.dealerId } }),
      status: { not: "COMPLETED" },
    };

    // Sales by status
    const listContract = await prisma.contract.findMany({
      where,
    });

    const customerIds = [...new Set(listContract.map((c) => c.customerId))];

    // Customer by status
    const byStatus = await prisma.customer.groupBy({
      by: ["status"],
      where: { id: { in: customerIds } },
      _count: true,
    });

    // Customer by city
    const byCity = await prisma.customer.groupBy({
      by: ["city"],
      where: { id: { in: customerIds } },
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
        id: { in: customerIds },
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
      // where: dealerId ? { dealerId } : {},
      where: { dealerId },
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
      // where: dealerId ? { dealerId } : {},
      where: { dealerId },
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

    // Get vehicle sales breakdown by dealer - danh sách xe và breakdown theo đại lý
    const where: Prisma.ContractWhereInput = {
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
    };
    const vehiclesByDealer = await this.getVehicleSalesByDealer(where);

    // Tổng tiền hủy cọc (tất cả đại lý) - chỉ tổng, không chi tiết
    const totalCancelledDeposits = await prisma.contract.aggregate({
      where: {
        contractType: "DEPOSIT",
        status: "CANCELLED",
        ...(filters.fromDate && { updatedAt: { gte: filters.fromDate } }), // Khi hủy
        ...(filters.toDate && { updatedAt: { lte: filters.toDate } }),
      },
      _sum: {
        depositAmount: true,
      },
      _count: true,
    });

    return {
      dealers: performance.sort(
        (a, b) => Number(b.sales.revenue) - Number(a.sales.revenue)
      ),
      vehiclesByDealer, // Danh sách xe và breakdown theo đại lý
      totalCancelledDeposits: {
        totalAmount: totalCancelledDeposits._sum.depositAmount || 0,
        count: totalCancelledDeposits._count,
      },
    };
  }

  /**
   * Get vehicles by dealer - Danh sách xe với inventory và sales breakdown
   * Trả về danh sách tất cả xe, mỗi xe có:
   * - Inventory: đang có ở những đại lý nào
   * - Sales: đã bán ở những đại lý nào
   */
  async getVehiclesByDealerReport(filters?: DateRangeFilter) {
    // Lấy tất cả vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        model: true,
        variant: true,
        manufacturer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        model: "asc",
      },
    });

    // Lấy inventory và sales cho từng vehicle
    const vehiclesWithDetails = await Promise.all(
      vehicles.map(async (vehicle) => {
        // EVM Inventory
        const evmInventory = await prisma.eVMInventory.findUnique({
          where: { vehicleId: vehicle.id },
          select: {
            quantity: true,
            reserved: true,
            available: true,
          },
        });

        // Inventory: đang có ở những đại lý nào (lấy tất cả, không filter available)
        const inventories = await prisma.inventory.findMany({
          where: {
            vehicleId: vehicle.id,
          },
          select: {
            dealerId: true,
            quantity: true,
            available: true,
            reserved: true,
            sold: true,
            dealer: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
              },
            },
          },
        });

        // Sales: đã bán ở những đại lý nào (TẤT CẢ contracts, không filter thời gian)
        const salesContracts = await prisma.contract.findMany({
          where: {
            vehicleId: vehicle.id,
          },
          select: {
            id: true,
            staff: {
              select: {
                dealerId: true,
                dealer: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    city: true,
                  },
                },
              },
            },
          },
        });

        // Group sales by dealer
        const salesByDealerMap = new Map<
          string,
          { dealer: any; count: number }
        >();
        salesContracts.forEach((contract) => {
          const dealerId = contract.staff.dealerId || "";
          const dealer = contract.staff.dealer;
          if (dealerId && dealer) {
            const existing = salesByDealerMap.get(dealerId);
            if (existing) {
              existing.count += 1;
            } else {
              salesByDealerMap.set(dealerId, { dealer, count: 1 });
            }
          }
        });

        const salesByDealer = Array.from(salesByDealerMap.values());

        // Tính tổng inventory: EVM + tất cả dealers
        const totalInventory =
          (evmInventory?.quantity || 0) +
          inventories.reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);

        return {
          vehicle,
          evmInventory: evmInventory || {
            quantity: 0,
            reserved: 0,
            available: 0,
          },
          inventory: inventories.map((inv) => ({
            dealer: inv.dealer,
            quantity: inv.quantity,
            available: inv.available,
            reserved: inv.reserved,
            sold: inv.sold,
            total: inv.quantity,
          })),
          sales: salesByDealer,
          totalSales: salesContracts.length,
          totalInventory, // Tổng số xe trong hệ thống
        };
      })
    );

    return vehiclesWithDetails;
  }

  /**
   * Get vehicle detail report - Chi tiết một xe cụ thể
   * Trả về:
   * - Thông tin xe
   * - EVM Inventory (tồn kho tại kho trung tâm)
   * - Dealer Inventory (tồn kho tại từng đại lý)
   * - Danh sách hợp đồng đã ký (với đầy đủ thông tin: ngày ký, ngày bán, đại lý, khách hàng, giá...)
   */
  async getVehicleDetailReport(vehicleId: string, filters?: DateRangeFilter) {
    // Lấy thông tin vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        model: true,
        variant: true,
        year: true,
        bodyType: true,
        retailPrice: true,
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // EVM Inventory (tồn kho tại kho trung tâm)
    const evmInventory = await prisma.eVMInventory.findUnique({
      where: { vehicleId },
      select: {
        quantity: true,
        reserved: true,
        available: true,
      },
    });

    // Dealer Inventory (tồn kho tại từng đại lý)
    const dealerInventories = await prisma.inventory.findMany({
      where: { vehicleId },
      select: {
        dealerId: true,
        quantity: true,
        available: true,
        reserved: true,
        sold: true,
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
      orderBy: {
        dealer: {
          name: "asc",
        },
      },
    });

    // Danh sách hợp đồng đã ký (TẤT CẢ, không filter thời gian)
    const contracts = await prisma.contract.findMany({
      where: {
        vehicleId,
      },
      select: {
        id: true,
        contractCode: true,
        status: true,
        basePrice: true,
        discount: true,
        tax: true,
        finalPrice: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dealerId: true,
            dealer: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Thống kê hợp đồng
    const contractsStats = {
      total: contracts.length,
      byStatus: {
        DRAFT: contracts.filter((c) => c.status === "DRAFT").length,
        PENDING: contracts.filter((c) => c.status === "PENDING").length,
        SIGNED: contracts.filter((c) => c.status === "SIGNED").length,
        COMPLETED: contracts.filter((c) => c.status === "COMPLETED").length,
        CANCELLED: contracts.filter((c) => c.status === "CANCELLED").length,
      },
      totalRevenue: contracts
        .filter((c) => c.status === "COMPLETED")
        .reduce((sum, c) => sum + Number(c.finalPrice || 0), 0),
    };

    return {
      vehicle,
      evmInventory: evmInventory || {
        quantity: 0,
        reserved: 0,
        available: 0,
      },
      dealerInventories,
      contracts,
      contractsStats,
    };
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
