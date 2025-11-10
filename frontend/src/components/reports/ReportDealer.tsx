// File: src/components/reports/ReportDealer.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    fetchReport,
    type AnyReportType,
    type Period,
    type ReportPayload,
} from "@/lib/api/reportApi";
import {
    COLORS,
    VN_LABELS,
    ChartData,
    toNum,
    toStr,
    vehicleLabel,
    makeValueFormatter,
    ChartCard,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent,
    LoadingState,
    ErrorState,
} from "./reportUtils";

const DEALER_REPORTS: { id: AnyReportType; label: string }[] = [
    { id: "sales", label: "Doanh số theo nhân viên" },
    { id: "debts", label: "Báo cáo công nợ" },
    { id: "customers", label: "Báo cáo khách hàng" },
];

type URec = Record<string, unknown>;

interface ReportDealerProps {
    userRole: string;
    userId?: string;
    dealerId?: string;
    defaultPeriod?: Period;
}

// THÊM TYPE CHO StatCard
type ColorType = "red" | "blue" | "orange" | "green" | "gray";

// THÊM COMPONENT StatCard
const StatCard = ({
    label,
    value,
    color = "gray",
    format = "number"
}: {
    label: string;
    value: number;
    color?: ColorType;
    format?: "number" | "currency";
}) => {
    const colorClasses: Record<ColorType, string> = {
        red: "border-red-500 text-red-600",
        blue: "border-blue-500 text-blue-600",
        orange: "border-orange-500 text-orange-600",
        green: "border-green-500 text-green-600",
        gray: "border-gray-500 text-gray-600"
    };

    const formattedValue = format === "currency"
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
        : value.toLocaleString('vi-VN');

    return (
        <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${colorClasses[color]}`}>
            <h4 className="text-sm font-medium text-gray-500">{label}</h4>
            <p className="text-2xl font-bold">{formattedValue}</p>
        </div>
    );
};

// THÊM COMPONENT DebtCard
const DebtCard = ({ debt }: { debt: any }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status: string, isOverdue: boolean) => {
        if (isOverdue) {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Quá hạn</span>;
        }
        if (status === 'PAID') {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Đã trả hết</span>;
        }
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Đang trả góp</span>;
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">
                            {debt.customer?.firstName} {debt.customer?.lastName}
                        </h5>
                        {getStatusBadge(debt.status, debt.isOverdue)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                        {debt.vehicle?.manufacturer?.name} {debt.vehicle?.model} {debt.vehicle?.variant}
                    </p>
                    <p className="text-sm text-gray-500">
                        HĐ: {debt.contract?.contractCode} • {formatDate(debt.contract?.createdAt)}
                    </p>
                </div>
                <div className="text-right ml-4">
                    <p className="text-lg font-bold text-red-600">
                        {formatCurrency(debt.remainingBalance || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                        Tổng: {formatCurrency(debt.totalAmount || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                        Đã trả: {formatCurrency(debt.paidAmount || 0)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Thông tin trả góp:</p>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>Trả góp: {formatCurrency(debt.monthlyPayment || 0)}/tháng</p>
                        <p>Số tháng: {debt.contract?.installmentMonths || 'N/A'}</p>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Tiến độ:</p>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>Còn nợ: {formatCurrency(debt.remainingBalance || 0)}</p>
                        <p>Đã trả: {formatCurrency(debt.paidAmount || 0)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ReportDealer({
    userRole,
    userId,
    dealerId,
    defaultPeriod = "month",
}: ReportDealerProps) {
    const reportDefs = DEALER_REPORTS;

    const [activeReport, setActiveReport] = useState<AnyReportType>(reportDefs[0].id);
    const [period, setPeriod] = useState<Period>(defaultPeriod);
    const [data, setData] = useState<ReportPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let aborted = false;
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // GIẢI PHÁP: Sử dụng "all" làm period mặc định cho báo cáo công nợ
                const reportPeriod = activeReport === "debts" ? "all" : period;
                const json = await fetchReport(activeReport, reportPeriod, dealerId);
                if (!aborted) setData(json);
            } catch (e) {
                if (!aborted) setErr("Không thể tải dữ liệu");
            } finally {
                if (!aborted) setLoading(false);
            }
        })();
        return () => {
            aborted = true;
        };
    }, [activeReport, period, dealerId]);

    const totalFmt = useMemo(() => {
        if (data?.total === undefined || data?.total === null) return "—";
        return makeValueFormatter(data.unit ?? undefined)(Number(data.total), "");
    }, [data]);

    const vf = makeValueFormatter(data?.unit ?? undefined);

    const renderSales = (d: ReportPayload) => {
        const byStatus: ChartData[] = Array.isArray(d.byStatus)
            ? (d.byStatus as URec[]).map((r) => ({
                status: toStr((r as URec).status),
                count: toNum((r as URec).count),
                revenue: toNum((r as URec).revenue),
            }))
            : [];

        const byPayment: ChartData[] = Array.isArray(d.byPaymentType)
            ? (d.byPaymentType as URec[]).map((r) => ({
                type: toStr((r as URec).type),
                count: toNum((r as URec).count),
                revenue: toNum((r as URec).revenue),
            }))
            : [];

        const topVehicles: ChartData[] = Array.isArray(d.topVehicles)
            ? (d.topVehicles as URec[]).map((r) => ({
                vehicle: vehicleLabel((r as URec).vehicle),
                count: toNum((r as URec).count),
                revenue: toNum((r as URec).revenue),
            }))
            : [];

        // 🆕 Staff performance (Doanh số theo nhân viên)
        const staffPerformance: ChartData[] = Array.isArray(d.staffPerformance)
            ? (d.staffPerformance as any[])
                // ✅ Lọc theo đại lý hiện tại (nếu có dealerId)
                .filter((r) => !dealerId || r.staff?.dealerId === dealerId)
                .map((r) => ({
                    staff: `${r.staff?.firstName ?? ""} ${r.staff?.lastName ?? ""}`.trim(),
                    email: r.staff?.email ?? "",
                    role: r.staff?.role ?? "",
                    salesCount: Number(r.salesCount ?? 0),
                    totalRevenue: Number(r.totalRevenue ?? 0),
                    averageOrderValue: Number(r.averageOrderValue ?? 0),
                }))
            : [];


        return (
            <div className="grid grid-cols-1 gap-8">

                {/* <ChartCard title="Doanh số theo trạng thái">
                    <PieChartComponent
                        data={byStatus}
                        dataKey="count"
                        nameKey="status"
                        valueFormatter={vf}
                    />
                </ChartCard> */}

                <ChartCard title="Theo hình thức thanh toán">
                    <PieChartComponent
                        data={byPayment}
                        dataKey="count"
                        nameKey="type"
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Top xe bán chạy">
                    <BarChartComponent
                        data={topVehicles}
                        xKey="vehicle"
                        bars={[
                            { key: "count", color: COLORS[0] },
                            { key: "revenue", color: COLORS[1] },
                        ]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Doanh số theo nhân viên">
                    <BarChartComponent
                        layout="vertical"
                        data={staffPerformance}
                        xKey="staff"
                        bars={[
                            { key: "salesCount", color: COLORS[0] },
                            { key: "totalRevenue", color: COLORS[1] },
                            { key: "averageOrderValue", color: COLORS[2] },
                        ]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                {/* {staffPerformance.length > 0 && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 text-black">
                            Chi tiết doanh số nhân viên
                        </h3>
                        <table className="min-w-full border border-gray-200 text-black">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-black">Nhân viên</th>
                                    <th className="px-4 py-2 text-right text-sm font-medium text-black">Số đơn</th>
                                    <th className="px-4 py-2 text-right text-sm font-medium text-black">Tổng doanh thu</th>
                                    <th className="px-4 py-2 text-right text-sm font-medium text-black">Giá trị TB/đơn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffPerformance.map((s, i) => (
                                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-black flex items-center gap-2">
                                            {s.staff}
                                            {s.role === "dealer_manager" && (
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-black rounded">
                                                    Quản lý
                                                </span>
                                            )}
                                            {s.role === "dealer_staff" && (
                                                <span className="text-xs px-2 py-1 bg-green-100 text-black rounded">
                                                    Nhân viên
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right text-black">{s.salesCount}</td>
                                        <td className="px-4 py-2 text-sm text-right text-black">
                                            {vf(s.totalRevenue, "VND")}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right text-black">
                                            {vf(s.averageOrderValue, "VND")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                )} */}

            </div>
        );
    };

    const renderDebts = (d: ReportPayload) => {
        const debts = d.debts || [];
        const summary = d.summary || {};

        return (
            <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Tổng công nợ"
                        value={summary.totalDebt || 0}
                        format="currency"
                        color="red"
                    />
                    <StatCard
                        label="HĐ đang trả góp"
                        value={summary.activeContracts || 0}
                        color="blue"
                    />
                    <StatCard
                        label="HĐ quá hạn"
                        value={summary.overdueContracts || 0}
                        color="orange"
                    />
                </div>

                {/* Danh sách công nợ */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h3 className="text-lg text-black font-semibold">Danh sách công nợ khách hàng</h3>
                    </div>
                    <div className="p-6">
                        {debts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có công nợ nào
                            </div>
                        ) : (
                            debts.map((debt: any, index: number) => (
                                <DebtCard key={index} debt={debt} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCustomers = (d: ReportPayload) => {
        const byStatus: ChartData[] = Array.isArray(d.byStatus)
            ? (d.byStatus as URec[]).map((r) => ({
                status: toStr((r as URec).status),
                count: toNum((r as URec).count),
            }))
            : [];

        const byCity: ChartData[] = Array.isArray(d.byCity)
            ? (d.byCity as URec[]).map((r) => ({
                city: toStr((r as URec).city),
                count: toNum((r as URec).count),
            }))
            : [];

        const acquisitionTrend: ChartData[] = Array.isArray(d.acquisitionTrend)
            ? (d.acquisitionTrend as URec[]).map((r) => ({
                month: toStr((r as URec).month ?? (r as URec).date),
                count: toNum((r as URec).count),
            }))
            : [];

        const funnel: ChartData[] = (() => {
            const raw = (d.conversionFunnel as unknown) ?? {};
            if (!raw || typeof raw !== "object") return [];
            return Object.entries(raw as URec).map(([stage, v]) => {
                const vr = v as URec;
                return {
                    stage,
                    count: toNum(vr.count),
                    percentage: toNum(vr.percentage)
                };
            });
        })();

        return (
            <div className="grid grid-cols-1 gap-8">
                {/* <ChartCard title="Khách hàng theo trạng thái">
                    <PieChartComponent 
                        data={byStatus} 
                        dataKey="count" 
                        nameKey="status" 
                        valueFormatter={vf} 
                    />
                </ChartCard> */}

                <ChartCard title="Khách hàng theo thành phố">
                    <BarChartComponent
                        layout="vertical"
                        data={byCity}
                        xKey="city"
                        bars={[{ key: "count", color: COLORS[3] }]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                {acquisitionTrend.length > 0 && (
                    <ChartCard title="Xu hướng thu hút khách hàng">
                        <LineChartComponent
                            data={acquisitionTrend}
                            xKey="month"
                            lines={[{ key: "count", color: COLORS[0] }]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}

                {funnel.length > 0 && (
                    <ChartCard title="Mô hình tiếp thị chuyển đổi khách hàng">
                        <BarChartComponent
                            layout="vertical"
                            data={funnel}
                            xKey="stage"
                            bars={[{ key: "count", color: COLORS[4] }]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    {reportDefs.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setActiveReport(r.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${activeReport === r.id
                                ? "bg-blue-600 text-white"
                                : "border border-black/20 text-black hover:bg-black/5"
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {/* CHỈ HIỆN FILTER KHI KHÔNG PHẢI BÁO CÁO CÔNG NỢ */}
                {activeReport !== "debts" && (
                    <div className="flex gap-2">
                        {(["week", "month", "quarter", "year"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${period === p
                                    ? "bg-blue-600 text-white"
                                    : "border border-black/20 text-black hover:bg-black/5"
                                    }`}
                            >
                                {p === "week" ? "Tuần" : p === "month" ? "Tháng" : p === "quarter" ? "Quý" : "Năm"}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-2 text-black">
                    {reportDefs.find((r) => r.id === activeReport)?.label}
                </h2>
                <p className="text-3xl font-bold text-black">{totalFmt}</p>
                {data?.unit && <p className="text-sm text-black mt-1">Đơn vị: {data.unit}</p>}
            </div>

            {activeReport === "sales" && Array.isArray(data?.byStatus) && (
                <ChartCard title="Doanh thu & Số đơn hàng theo trạng thái">
                    <BarChartComponent
                        layout="vertical"
                        data={[
                            ...data.byStatus.map((item: any) => ({
                                status: item.status || "Không rõ",
                                count: Number(item.count || 0),
                                revenue: Number(item.revenue || 0),
                            })),
                            // {
                            //     status: "Tổng cộng",
                            //     count: data.byStatus.reduce((sum: number, i: any) => sum + Number(i.count || 0), 0),
                            //     revenue: data.byStatus.reduce((sum: number, i: any) => sum + Number(i.revenue || 0), 0),
                            // },
                        ]}
                        xKey="status"
                        bars={[
                            { key: "count", color: "#f59e0b", label: "Số đơn hàng" },
                            { key: "revenue", color: "#10b981", label: "Doanh thu (VND)" },
                        ]}
                        valueFormatter={(val: number) =>
                            new Intl.NumberFormat("vi-VN", {
                                style: "decimal",
                                maximumFractionDigits: 0,
                            }).format(val)

                        }
                        tooltipFormatter={(entry: any) => (
                            <div className="text-sm space-y-1">
                                <p><strong>Trạng thái:</strong> {entry.status}</p>
                                <p><span className="text-yellow-600">Số đơn hàng:</span> {entry.count.toLocaleString("vi-VN")}</p>
                                <p><span className="text-green-600">Doanh thu:</span>{" "}
                                    {new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                        maximumFractionDigits: 0,
                                    }).format(entry.revenue || 0)}
                                </p>
                            </div>
                        )}
                    />
                </ChartCard>
            )}




            {loading ? (
                <LoadingState />
            ) : err ? (
                <ErrorState message={err} />
            ) : (
                <>
                    {activeReport === "sales" && data && renderSales(data)}
                    {activeReport === "debts" && data && renderDebts(data)}
                    {activeReport === "customers" && data && renderCustomers(data)}
                </>
            )}
        </div>
    );
}