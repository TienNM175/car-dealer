import axiosClient from "@/lib/utils/axiosClient";
import { inventoryApi } from "@/lib/api/inventoryApi";

export type Period = "week" | "month" | "quarter" | "year";
export type AnyReportType =
  | "inventory"
  | "sales"
  | "customers"
  | "dealer-performance"
  | "vehicles-by-dealer"
  | "dashboard"
  | "executive-summary"
  | "debts";

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

export async function fetchReport(
  type: AnyReportType,
  period: Period,
  dealerId?: string
): Promise<ReportPayload> {
  console.log("[DEBUG] Fetching report:", type, period);

  const { fromDate, toDate } = buildDateRange(period);
  const params: Record<string, string | undefined> = { fromDate, toDate };
  if (dealerId) params.dealerId = dealerId;

  if (type === "inventory") {
    try {
      console.log("[DEBUG] Calling /reports/inventory with params:", params);
      const res = await axiosClient.get(`/reports/inventory`, { params });
      const data = res.data?.data || res.data;
      console.log("[DEBUG] /reports/inventory raw:", data);

      const dealersRaw =
        data.dealerSummary || data.dealers || data.summary?.byDealer || [];

      const dealerSummary = Array.isArray(dealersRaw)
        ? dealersRaw.map((d: any) => ({
            dealer: d.dealer?.name ?? d.dealerName ?? "Không xác định",
            available: Number(
              d.totalAvailable ?? d.available ?? d.summary?.available ?? 0
            ),
            reserved: Number(
              d.totalReserved ?? d.reserved ?? d.summary?.reserved ?? 0
            ),
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

      const total =
        dealerSummary.reduce(
          (sum, d) => sum + Number(d.available ?? 0) + Number(d.reserved ?? 0),
          0
        ) ?? 0;

      return {
        title: "Tồn kho & tốc độ tiêu thụ",
        unit: "xe",
        total,
        dealerSummary,
        lowStock,
        vehicleStats,
      };
    } catch (error: any) {
      console.warn(
        "[WARN] /reports/inventory failed, fallback to inventoryApi:",
        error
      );

      const [sumRes, lowRes] = await Promise.all([
        inventoryApi.getInventorySummary(),
        inventoryApi.getLowStockAlerts(),
      ]);
      const summary = sumRes.data?.data;
      const low = lowRes.data?.data;

      const dealerSummary = [
        {
          dealer: { name: "Tổng đại lý" },
          available: summary?.dealers?.totalAvailable ?? 0,
          reserved: summary?.dealers?.totalReserved ?? 0,
          sold: summary?.dealers?.totalSold ?? 0,
        },
        {
          dealer: { name: "EVM (Tổng hệ thống)" },
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
        title: "Tồn kho & tốc độ tiêu thụ",
        unit: "xe",
        total: summary?.dealers?.totalQuantity ?? 0,
        dealerSummary,
        lowStock,
        vehicleStats: [],
      };
    }
  }

  if (type === "sales") {
    const res = await axiosClient.get(`/reports/sales`, { params });
    const data = res.data?.data || res.data;
    console.log("data: ", data);

    const totalRevenue =
      data.byStatus?.reduce(
        (sum: number, s: any) =>
          sum + Number(s._sum?.finalPrice ?? s.revenue ?? 0),
        0
      ) ?? 0;

    return {
      title: "Doanh số theo nhân viên",
      unit: "VND",
      total: totalRevenue,
      ...data,
    };
  }

  if (type === "customers") {
    const res = await axiosClient.get(`/reports/customers`, { params });
    const data = res.data?.data || res.data;
    console.log("cus: ", data);

    const totalCustomers =
      data.byStatus?.reduce(
        (sum: number, s: any) => sum + Number(s.count ?? 0),
        0
      ) ?? 0;

    return {
      title: "Báo cáo khách hàng",
      unit: "khách",
      total: totalCustomers,
      ...data,
    };
  }

  // THÊM CASE XỬ LÝ CHO "debts" - ĐẶT Ở ĐÂY, NGOÀI BLOCK "dealer-performance"
  if (type === "debts") {
  const res = await axiosClient.get(`/debts/customers`, { params });
  const data = res.data?.data || res.data;
  
  return {
    title: "Công nợ khách hàng",
    unit: "VND",
    total: data.summary?.totalDebt || 0,
    ...data
  };
}

  if (type === "dealer-performance") {
    const res = await axiosClient.get(`/reports/dealer-performance`, {
      params,
    });
    const raw = res.data?.data || res.data;

    // Handle new format: { dealers: [...], vehiclesByDealer: [...] }
    if (raw?.dealers && Array.isArray(raw.dealers)) {
      const totalRevenue = raw.dealers.reduce(
        (a: number, d: any) => a + Number(d.sales?.revenue ?? 0),
        0
      );

      return {
        title: "Doanh số theo khu vực, đại lý",
        unit: "VND",
        total: totalRevenue,
        dealers: raw.dealers,
        vehiclesByDealer: raw.vehiclesByDealer || [], // Danh sách xe và breakdown theo đại lý
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
        title: "Doanh số theo khu vực, đại lý",
        unit: "VND",
        total: totalRevenue,
        dealers: raw,
        vehiclesByDealer: [], // Empty if old format
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

    return raw as ReportPayload;
  }

  if (type === "vehicles-by-dealer") {
    const res = await axiosClient.get(`/reports/vehicles-by-dealer`, {
      params,
    });
    const data = res.data?.data || res.data;

    return {
      title: "Xe theo đại lý",
      unit: "xe",
      total: Array.isArray(data) ? data.length : 0,
      vehicles: Array.isArray(data) ? data : [],
    };
  }

  if (type === "executive-summary") {
    const res = await axiosClient.get(`/reports/executive-summary`, { params });
    const data = res.data?.data || res.data;

    return {
      title: "Báo cáo tổng hợp hệ thống",
      unit: "VND",
      total: data.keyMetrics?.totalRevenue ?? 0,
      ...data,
    };
  }

  if (type === "dashboard") {
    const res = await axiosClient.get(`/reports/dashboard`, { params });
    const data = res.data?.data || res.data;
    return {
      title: "Tổng quan Dashboard",
      total: 0,
      ...data,
    };
  }

  const res = await axiosClient.get(`/reports/${type}`, { params });
  const payload = res.data?.data || res.data;
  return payload as ReportPayload;
}