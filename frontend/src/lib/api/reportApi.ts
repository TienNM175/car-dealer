import axiosClient from "@/lib/utils/axiosClient";
import { inventoryApi } from "@/lib/api/inventoryApi";

export type Period = "week" | "month" | "quarter" | "year" | "all";
export type AnyReportType =
  | "inventory"
  | "sales"
  | "customers"
  | "dealer-performance"
  | "vehicles-by-dealer"
  | "dashboard"
  | "executive-summary"
  | "debts"
  | "dealer-debts";

export interface ReportPayload {
  title?: string;
  unit?: string;
  total?: number | string;
  [key: string]: any;
}

function buildDateRange(period: Period) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date(to);
  switch (period) {
    case "week":
      from.setDate(to.getDate() - 6);
      break;
    case "month":
      from.setMonth(to.getMonth() - 1);
      break;
    case "quarter":
      from.setMonth(to.getMonth() - 3);
      break;
    case "year":
      from.setFullYear(to.getFullYear() - 1);
      break;
  }
  from.setHours(0, 0, 0, 0);

  return { fromDate: from.toISOString(), toDate: to.toISOString() };
}

// Fallback data để tránh crash UI
function getFallbackData(type: AnyReportType): ReportPayload {
  const baseData = {
    title: getReportTitle(type),
    unit: getReportUnit(type),
    total: 0
  };

  switch (type) {
    case "inventory":
      return {
        ...baseData,
        dealerSummary: [],
        lowStock: [],
        vehicleStats: []
      };
    case "sales":
      return {
        ...baseData,
        byStatus: [],
        summary: {}
      };
    case "customers":
      return {
        ...baseData,
        byStatus: [],
        summary: {}
      };
    case "dealer-performance":
      return {
        ...baseData,
        dealers: [],
        dealerSummary: [],
        vehiclesByDealer: []
      };
    case "vehicles-by-dealer":
      return {
        ...baseData,
        vehicles: []
      };
    case "executive-summary":
      return {
        ...baseData,
        keyMetrics: {},
        customers: {},
        dealerOrders: {},
        inventory: {},
        sales: {},
        testDrives: {}
      };
    case "dashboard":
      return {
        ...baseData,
        metrics: {}
      };
    case "debts":
      return {
        ...baseData,
        summary: { totalDebt: 0 },
        customers: []
      };
    case "dealer-debts":
      return {
        ...baseData,
        detailedDebts: [],
        summary: {
          totalDebt: 0,
          totalOrders: 0,
          unpaidOrders: 0,
          overdueOrders: 0
        }
      };
    default:
      return baseData;
  }
}

function getReportTitle(type: AnyReportType): string {
  const titles: Record<AnyReportType, string> = {
    "inventory": "Tồn kho & tốc độ tiêu thụ",
    "sales": "Doanh số theo nhân viên",
    "customers": "Báo cáo khách hàng",
    "dealer-performance": "Doanh số theo khu vực, đại lý",
    "vehicles-by-dealer": "Xe theo đại lý",
    "dashboard": "Tổng quan Dashboard",
    "executive-summary": "Báo cáo tổng hợp hệ thống",
    "debts": "Công nợ khách hàng",
    "dealer-debts": "Công nợ đại lý"
  };
  return titles[type] || "Báo cáo";
}

function getReportUnit(type: AnyReportType): string {
  const units: Record<AnyReportType, string> = {
    "inventory": "xe",
    "sales": "VND",
    "customers": "khách",
    "dealer-performance": "VND",
    "vehicles-by-dealer": "xe",
    "dashboard": "",
    "executive-summary": "VND",
    "debts": "VND",
    "dealer-debts": "VND"
  };
  return units[type] || "";
}

// Helper function để xử lý inventory data
function processInventoryData(data: any) {
  const dealersRaw = data.dealerSummary || data.dealers || data.summary?.byDealer || [];

  const dealerSummary = Array.isArray(dealersRaw)
    ? dealersRaw.map((d: any) => ({
      dealer: d.dealer?.name ?? d.dealerName ?? "Không xác định",
      available: Number(d.totalAvailable ?? d.available ?? d.summary?.available ?? 0),
      reserved: Number(d.totalReserved ?? d.reserved ?? d.summary?.reserved ?? 0),
      sold: Number(d.totalSold ?? d.sold ?? d.summary?.sold ?? 0),
    }))
    : [];

  const lowStock = Array.isArray(data.lowStock)
    ? data.lowStock.map((v: any) => ({
      vehicle: v.vehicle?.model ?? v.vehicleName ?? "Xe không xác định",
      available: Number(v.available ?? v.stock ?? 0),
    }))
    : [];

  const vehicleStats = Array.isArray(data.vehicleStats)
    ? data.vehicleStats.map((v: any) => ({
      vehicle: v.vehicle?.model ?? v.vehicleName ?? "Xe không xác định",
      totalStock: Number(v.totalStock ?? v.stock ?? 0),
      totalSold: Number(v.totalSold ?? v.sold ?? 0),
    }))
    : [];

  const total = dealerSummary.reduce(
    (sum, d) => sum + Number(d.available ?? 0) + Number(d.reserved ?? 0),
    0
  );

  return {
    dealerSummary,
    lowStock,
    vehicleStats,
    total
  };
}

// Helper function để xử lý dealer performance data
function processDealerPerformanceData(raw: any) {
  // Handle new format: { dealers: [...], vehiclesByDealer: [...] }
  if (raw?.dealers && Array.isArray(raw.dealers)) {
    const totalRevenue = raw.dealers.reduce(
      (a: number, d: any) => a + Number(d.sales?.revenue ?? 0),
      0
    );

    return {
      total: totalRevenue,
      dealers: raw.dealers,
      vehiclesByDealer: raw.vehiclesByDealer || [],
      dealerSummary: raw.dealers.map((r: any) => ({
        dealer: r.dealer?.name ?? "",
        salesRevenue: Number(r.sales?.revenue ?? 0),
        salesCount: Number(r.sales?.count ?? 0),
        testDrives: Number(r.testDrives ?? 0),
        inventoryTotal: Number(r.inventory?.total ?? 0),
        inventorySold: Number(r.inventory?.sold ?? 0),
        staffCount: Number(r.staffCount ?? 0),
        achievementRate: Number(r.target?.achievementRate ?? 0),
      })),
    };
  }

  // Handle old format: array of dealers (for backward compatibility)
  if (Array.isArray(raw)) {
    const totalRevenue = raw.reduce(
      (a, d) => a + Number(d.sales?.revenue ?? 0),
      0
    );

    return {
      total: totalRevenue,
      dealers: raw,
      vehiclesByDealer: [],
      dealerSummary: raw.map((r: any) => ({
        dealer: r.dealer?.name ?? "",
        salesRevenue: Number(r.sales?.revenue ?? 0),
        salesCount: Number(r.sales?.count ?? 0),
        testDrives: Number(r.testDrives ?? 0),
        inventoryTotal: Number(r.inventory?.total ?? 0),
        inventorySold: Number(r.inventory?.sold ?? 0),
        staffCount: Number(r.staffCount ?? 0),
        achievementRate: Number(r.target?.achievementRate ?? 0),
      })),
    };
  }

  return {
    total: 0,
    dealers: [],
    vehiclesByDealer: [],
    dealerSummary: []
  };
}

export async function fetchReport(
  type: AnyReportType,
  period: Period,
  dealerId?: string
): Promise<ReportPayload> {
  console.log("[DEBUG] Fetching report:", { type, period, dealerId });

  const { fromDate, toDate } = buildDateRange(period);
  const params: Record<string, string | undefined> = { fromDate, toDate };
  if (dealerId) params.dealerId = dealerId;

  try {
    if (type === "inventory") {
      try {
        console.log("[DEBUG] Calling /reports/inventory with params:", params);
        const res = await axiosClient.get(`/reports/inventory`, { params });
        const data = res.data?.data || res.data;
        console.log("[DEBUG] /reports/inventory raw:", data);

        const processedData = processInventoryData(data);

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          ...processedData,
        };
      } catch (error: any) {
        console.warn(
          "[WARN] /reports/inventory failed, fallback to inventoryApi:",
          error.message
        );

        // Fallback to inventoryApi
        try {
          const [sumRes, lowRes] = await Promise.all([
            inventoryApi.getInventorySummary(),
            inventoryApi.getLowStockAlerts(),
          ]);
          const summary = sumRes.data?.data;
          const low = lowRes.data?.data;

          const dealerSummary = [
            {
              dealer: "Tổng đại lý",
              available: summary?.dealers?.totalAvailable ?? 0,
              reserved: summary?.dealers?.totalReserved ?? 0,
              sold: summary?.dealers?.totalSold ?? 0,
            },
            {
              dealer: "EVM (Tổng hệ thống)",
              available: summary?.evm?.totalAvailable ?? 0,
              reserved: summary?.evm?.totalReserved ?? 0,
              sold: summary?.evm?.totalSold ?? 0,
            },
          ];

          const lowStock = (low?.dealers ?? []).map((item: any) => ({
            vehicle: item.vehicle?.model ?? "Không xác định",
            available: item.available ?? 0,
          }));

          return {
            title: getReportTitle(type),
            unit: getReportUnit(type),
            total: summary?.dealers?.totalQuantity ?? 0,
            dealerSummary,
            lowStock,
            vehicleStats: [],
          };
        } catch (fallbackError: any) {
          console.error("[ERROR] Inventory fallback also failed:", fallbackError.message);
          return getFallbackData(type);
        }
      }
    }

    if (type === "sales") {
      try {
        console.log("[DEBUG] Fetching /reports/sales with params:", params); // ✅ thêm dòng này
        const res = await axiosClient.get(`/reports/sales`, { params });
        const data = res.data?.data || res.data;
        console.log("[DEBUG] Sales data:", data);


        const totalRevenue = data.byStatus?.reduce(
          (sum: number, s: any) => sum + Number(s._sum?.finalPrice ?? s.revenue ?? 0),
          0
        ) ?? 0;

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          total: totalRevenue,
          byStatus: data.byStatus ?? [],
          byPaymentType: data.byPaymentType ?? [],
          topVehicles: data.topVehicles ?? [],
          staffPerformance: data.staffPerformance ?? [], // ✅ thêm dòng này
          monthlyTrend: data.monthlyTrend ?? [],
          vehiclesByDealer: data.vehiclesByDealer ?? [],
        };

      } catch (error: any) {
        console.error("[ERROR] Sales report failed:", error.message);
        return getFallbackData(type);
      }
    }

    if (type === "customers") {
      try {
        const res = await axiosClient.get(`/reports/customers`, { params });
        const data = res.data?.data || res.data;
        console.log("[DEBUG] Customers data:", data);

        const totalCustomers = data.byStatus?.reduce(
          (sum: number, s: any) => sum + Number(s.count ?? 0),
          0
        ) ?? 0;

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          total: totalCustomers,
          ...data,
        };
      } catch (error: any) {
        console.error("[ERROR] Customers report failed:", error.message);
        return getFallbackData(type);
      }
    }

    if (type === "debts") {
      try {
        const res = await axiosClient.get(`/debts/customers`, { params });
        const data = res.data?.data || res.data;

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          total: data.summary?.totalDebt || 0,
          ...data
        };
      } catch (error: any) {
        console.error("[ERROR] Debts report failed:", error.message);
        return getFallbackData(type);
      }
    }

    if (type === "dealer-debts") {
  try {
    console.log("[DEBUG] Fetching dealer debts from:", `/debts/dealers/detail`);
    const res = await axiosClient.get(`/debts/dealers/detail`, { params });
    const data = res.data?.data || res.data;
    console.log("[DEBUG] Dealer debts data:", data);

    return {
      title: getReportTitle(type),
      unit: getReportUnit(type),
      total: data.summary?.totalDebt || 0,
      ...data
    };
  } catch (error: any) {
    console.error("[ERROR] Dealer debts report failed:", error.message);
    
    // Fallback chi tiết hơn
    return {
      title: getReportTitle(type),
      unit: getReportUnit(type),
      total: 0,
      detailedDebts: [],
      summary: {
        totalDebt: 0,
        totalOrders: 0,
        unpaidOrders: 0,
        overdueOrders: 0,
        totalPaid: 0
      }
    };
  }
}

    if (type === "dealer-performance") {
      try {
        const res = await axiosClient.get(`/reports/dealer-performance`, { params });
        const raw = res.data?.data || res.data;

        const processedData = processDealerPerformanceData(raw);

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          ...processedData,
        };
      } catch (error: any) {
        console.error("[ERROR] Dealer performance report failed:", error.message);
        return getFallbackData(type);
      }
    }

    if (type === "vehicles-by-dealer") {
      try {
        const res = await axiosClient.get(`/reports/vehicles-by-dealer`, { params });
        const data = res.data?.data || res.data;

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          total: Array.isArray(data) ? data.length : 0,
          vehicles: Array.isArray(data) ? data : [],
        };
      } catch (error: any) {
        console.error("[ERROR] Vehicles by dealer report failed:", error.message);
        return getFallbackData(type);
      }
    }

    if (type === "executive-summary") {
      try {
        const res = await axiosClient.get(`/reports/executive-summary`, { params });
        const data = res.data?.data || res.data;

        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          total: data.keyMetrics?.totalRevenue ?? 0,
          ...data,
        };
      } catch (error: any) {
        console.error("[ERROR] Executive summary report failed:", error.message);
        return getFallbackData(type);
      }
    }

    if (type === "dashboard") {
      try {
        const res = await axiosClient.get(`/reports/dashboard`, { params });
        const data = res.data?.data || res.data;
        return {
          title: getReportTitle(type),
          unit: getReportUnit(type),
          total: 0,
          ...data,
        };
      } catch (error: any) {
        console.error("[ERROR] Dashboard report failed:", error.message);
        return getFallbackData(type);
      }
    }

    // Default case for other report types
    try {
      const res = await axiosClient.get(`/reports/${type}`, { params });
      const payload = res.data?.data || res.data;
      return {
        title: getReportTitle(type),
        unit: getReportUnit(type),
        total: 0,
        ...payload,
      } as ReportPayload;
    } catch (error: any) {
      console.error(`[ERROR] Generic report ${type} failed:`, error.message);
      return getFallbackData(type);
    }

  } catch (error: any) {
    console.error("❌ fetchReport general error:", {
      type,
      period,
      dealerId,
      error: error.message,
      code: error.code,
      response: error.response?.data
    });

    return getFallbackData(type);
  }
}