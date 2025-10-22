import axiosClient from "@/lib/utils/axiosClient";
import { inventoryApi } from "@/lib/api/inventoryApi";

function buildDateRange(period: Period) {
    const to = new Date();
    const from = new Date();
    switch (period) {
        case "week": from.setDate(to.getDate() - 6); break;
        case "month": from.setMonth(to.getMonth() - 1); break;
        case "quarter": from.setMonth(to.getMonth() - 3); break;
        case "year": from.setFullYear(to.getFullYear() - 1); break;
    }
    return { fromDate: from.toISOString(), toDate: to.toISOString() };
}

export async function fetchReport(
    type: AnyReportType,
    period: Period,
    dealerId?: string
): Promise<ReportPayload> {
    console.log("[DEBUG] Fetching report:", type, period);

    // =============== INVENTORY (EVM) ===============
    if (type === "inventory") {
        const [sumRes, lowRes] = await Promise.all([
            inventoryApi.getInventorySummary(),
            inventoryApi.getLowStockAlerts(),
        ]);

        const summary = sumRes.data?.data;
        const low = lowRes.data?.data;

        if (!summary) {
            return {
                title: "Tồn kho & tốc độ tiêu thụ",
                unit: "xe",
                total: 0,
                dealerSummary: [],
                lowStock: [],
                vehicleStats: [],
            };
        }

        console.log("test:", summary);

        // const dealerSummary = (summary.byDealer ?? []).map((d) => ({
        //     dealer: d.dealer,
        //     available: d.totalAvailable ?? 0,
        //     reserved: d.totalReserved ?? 0,
        //     sold: d.totalSold ?? 0,
        // }));

        const dealerSummary = [
            {
                dealer: { name: "Tổng đại lý" },
                available: summary.dealers?.totalAvailable ?? 0,
                reserved: summary.dealers?.totalReserved ?? 0,
                sold: summary.dealers?.totalSold ?? 0,
            },
            {
                dealer: { name: "EVM (Tổng hệ thống)" },
                available: summary.evm?.totalAvailable ?? 0,
                reserved: summary.evm?.totalReserved ?? 0,
                // sold: summary.evm?.totalSold ?? 0,
            },
        ];

        const lowStock = (low?.dealers ?? []).map((item) => ({
            vehicle: item.vehicle,
            available: item.available ?? 0,
        }));

        const vehicleStats: Array<Record<string, any>> = [];

        return {
            title: "Tồn kho & tốc độ tiêu thụ",
            unit: "xe",
            total: summary.dealers?.totalQuantity ?? 0,
            dealerSummary,
            lowStock,
            vehicleStats,
        };
    }

    // =============== DEALER-PERFORMANCE (EVM) ===============
    if (type === "dealer-performance") {
        const { fromDate, toDate } = buildDateRange(period);
        const params: Record<string, string | undefined> = { fromDate, toDate };
        if (dealerId) params.dealerId = dealerId;

        const res = await axiosClient.get(`/reports/dealer-performance`, { params });
        const raw = (res.data && (res.data as { data?: unknown }).data) || res.data;

        if (Array.isArray(raw)) {
            const dealers = raw.map((r: any) => ({
                dealerId: r.dealer?.id,
                dealerName: r.dealer?.name,
                sales: r.sales?.count ?? 0,
                salesRevenue: Number(r.sales?.revenue ?? 0),
                testDrives: r.testDrives ?? 0,
                inventorySold: r.inventory?.sold ?? 0,
                inventoryTotal: r.inventory?.total ?? 0,
                staffCount: r.staffCount ?? 0,
                achievedAmount: Number(r.target?.achievedAmount ?? 0),
                achievementRate: Number(r.target?.achievementRate ?? 0),
                targetAmount: Number(r.target?.targetAmount ?? 0),
            }));

            return {
                title: "Báo cáo đại lý",
                unit: "VND",
                total: dealers.reduce((acc, d) => acc + d.sales, 0),
                dealers,
                sales: {
                    totalRevenue: dealers.reduce((a, d) => a + d.salesRevenue, 0).toString(),
                    totalContracts: dealers.reduce((a, d) => a + d.sales, 0),
                    completedContracts: dealers.reduce((a, d) => a + d.sales, 0),
                    averageOrderValue: 0,
                    totalDiscount: "0",
                },
                inventory: {
                    sold: dealers.reduce((a, d) => a + d.inventorySold, 0),
                    total: dealers.reduce((a, d) => a + d.inventoryTotal, 0),
                    available: 0,
                    reserved: 0,
                },
                testDrives: {
                    completed: dealers.reduce((a, d) => a + d.testDrives, 0),
                    completionRate: 0,
                    total: dealers.reduce((a, d) => a + d.testDrives, 0),
                },
            };
        }

        return raw as ReportPayload;
    }

    const { fromDate, toDate } = buildDateRange(period);
    const params: Record<string, string | undefined> = { fromDate, toDate };
    if (dealerId) params.dealerId = dealerId;

    const res = await axiosClient.get(`/reports/${type}`, { params });
    const payload: unknown =
        (res.data && (res.data as { data?: unknown }).data) || res.data;

    console.log("[DEBUG] Response payload:", payload);
    return payload as ReportPayload;
}
