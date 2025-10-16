import axiosClient from "@/lib/utils/axiosClient";

export type Period = "week" | "month" | "quarter" | "year";

export type DealerReportType = "sales" | "inventory" | "customers" | "dashboard";
export type EvmReportType = "dealer-performance" | "inventory" | "executive-summary";
export type AnyReportType = DealerReportType | EvmReportType;

export interface TimeSeriesPoint {
    date: string;
    value: number;
    [k: string]: number | string | undefined;
}

export interface BreakdownItem {
    label: string;
    value: number;
}

export type Row = Record<string, string | number | boolean | null | undefined>;

export interface ReportPayload {
    title?: string;
    period?: Period;
    unit?: string;
    total?: number;
    changePct?: number;
    timeseries?: TimeSeriesPoint[];
    breakdown?: BreakdownItem[];

    byStatus?: Row[];
    byPaymentType?: Row[];
    topVehicles?: Row[];
    staffPerformance?: Row[];
    monthlyTrend?: TimeSeriesPoint[];

    byCity?: Row[];
    byStatusCustomer?: Row[];
    acquisitionTrend?: TimeSeriesPoint[];
    conversionFunnel?: Row;

    dealerSummary?: Row[];
    lowStock?: Row[];
    vehicleStats?: Row[];

    dealers?: Array<{
        dealerId: string;
        dealerName: string;
        sales: number;
        testDrives: number;
        inventory: number;
        staffCount: number;
        target: number;
    }>;

    keyMetrics?: Row;
    trends?: TimeSeriesPoint[];
    topPerformers?: {
        vehicles?: Row[];
        staff?: Row[];
    };
}


function buildDateRange(period: Period) {
    const to = new Date();
    const from = new Date();

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

    return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
    };
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

    const res = await axiosClient.get(`/reports/${type}`, { params });

    const payload: unknown = (res.data && (res.data as { data?: unknown }).data) || res.data;

    console.log("[DEBUG] Response payload:", payload);
    return payload as ReportPayload;
}

export async function exportReportCSV(
    type: AnyReportType,
    period: Period,
    dealerId?: string
): Promise<Blob> {
    const { fromDate, toDate } = buildDateRange(period);
    const params: Record<string, string | undefined> = { fromDate, toDate };
    if (dealerId) params.dealerId = dealerId;

    const res = await axiosClient.get(`/reports/${type}/export`, {
        params,
        responseType: "blob",
    });
    return res.data;
}
