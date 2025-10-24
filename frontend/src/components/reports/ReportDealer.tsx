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
    { id: "customers", label: "Báo cáo công nợ" },
];

type URec = Record<string, unknown>;

interface ReportDealerProps {
    userRole: string;
    defaultPeriod?: Period;
}

export default function ReportDealer({
    userRole,
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
                const json = await fetchReport(activeReport, period);
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
    }, [activeReport, period]);

    const totalFmt = useMemo(() => {
        if (data?.total === undefined || data?.total === null) return "—";
        return makeValueFormatter(data.unit ?? undefined)(Number(data.total), "");
    }, [data]);

    const vf = makeValueFormatter(data?.unit ?? undefined);

    // const renderSales = (d: ReportPayload) => {
    //     const byStatus: ChartData[] = Array.isArray(d.byStatus) ? (d.byStatus as URec[]).map((r) => ({ status: toStr((r as URec).status), count: toNum((r as URec).count), revenue: toNum((r as URec).revenue), })) : [];
    //     const byPayment: ChartData[] = Array.isArray(d.byPaymentType) ? (d.byPaymentType as URec[]).map((r) => ({ type: toStr((r as URec).type), count: toNum((r as URec).count), revenue: toNum((r as URec).revenue), })) : [];
    //     const topVehicles: ChartData[] = Array.isArray(d.topVehicles) ? (d.topVehicles as URec[]).map((r) => ({ vehicle: vehicleLabel((r as URec).vehicle), count: toNum((r as URec).count), revenue: toNum((r as URec).revenue), })) : [];
    //     // const staffPerf: ChartData[] = Array.isArray(d.staffPerformance) ? (d.staffPerformance as URec[]).map((r) => ({ staff: toStr((r as URec).staff) || toStr(((r as URec).staff as URec | undefined)?.email), totalRevenue: toNum((r as URec).totalRevenue), salesCount: toNum((r as URec).salesCount), })) : [];
    //     const staffPerf: ChartData[] = Array.isArray(d.staffPerformance)
    //         ? (d.staffPerformance as URec[]).map((r) => {
    //             const staff = r.staff as URec;
    //             return {
    //                 staff: staff ? `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() : "",
    //                 email: staff?.email ?? "",
    //                 id: staff?.id ?? "",
    //                 totalRevenue: toNum(r.totalRevenue),
    //                 salesCount: toNum(r.salesCount),
    //             };
    //         })
    //         : [];


    //     return (
    //         <div className="grid grid-cols-1 gap-8">
    //             <ChartCard title="Doanh số theo trạng thái">
    //                 <PieChartComponent data={byStatus} dataKey="count" nameKey="status" valueFormatter={vf} />
    //             </ChartCard>
    //             <ChartCard title="Theo hình thức thanh toán">
    //                 <PieChartComponent data={byPayment} dataKey="count" nameKey="type" valueFormatter={vf} />
    //             </ChartCard>
    //             <ChartCard title="Top xe bán chạy">
    //                 <BarChartComponent data={topVehicles} xKey="vehicle" bars={[{ key: "count", color: COLORS[0] }, { key: "revenue", color: COLORS[1] }]} valueFormatter={vf} />
    //             </ChartCard>
    //             <ChartCard title="Hiệu suất nhân viên">
    //                 <BarChartComponent layout="vertical" data={staffPerf} xKey="staff" bars={[{ key: "totalRevenue", color: COLORS[2] }]} valueFormatter={vf} />
    //             </ChartCard>
    //         </div>
    //     );
    // };


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

        // --- Tạo dataset nhân viên, có dealer info ---
        const staffPerf: ChartData[] = Array.isArray(d.staffPerformance)
            ? (d.staffPerformance as URec[]).map((r) => {
                const staff = r.staff as URec;
                const dealer = (staff as any)?.dealer as URec | undefined;
                return {
                    staff: staff
                        ? `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() ||
                        staff.email ||
                        ""
                        : "",
                    email: staff?.email ?? "",
                    id: staff?.id ?? "",
                    dealerId: (staff as any)?.dealerId ?? "",
                    dealerName: dealer?.name ?? "Đại lý không xác định",
                    totalRevenue: toNum((r as any).totalRevenue),
                    salesCount: toNum((r as any).salesCount),
                };
            })
            : [];
        console.log("[DEBUG] Staff performance data:", staffPerf);


        // --- Nhóm theo dealerId ---
        const grouped: Record<string, ChartData[]> = {};
        for (const s of staffPerf) {
            const key = (s.dealerId as string) || "unknown";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(s);
        }

        // --- Quyền: nếu là Dealer hoặc Manager -> chỉ hiển thị đại lý của họ ---
        const role = (userRole || "").toUpperCase();
        let charts: React.ReactNode[] = [];

        if (role.includes("ADMIN") || role.includes("EVM")) {
            charts = Object.entries(grouped).map(([dealerId, list]) => (
                <ChartCard
                    key={dealerId}
                    title={`Hiệu suất nhân viên - ${list[0]?.dealerName ?? "Đại lý không xác định"}`}
                >
                    <BarChartComponent
                        layout="vertical"
                        data={list}
                        xKey="staff"
                        bars={[{ key: "totalRevenue", color: COLORS[2] }]}
                        valueFormatter={vf}
                    />
                </ChartCard>
            ));
        } else if (role.includes("DEALER") || role.includes("MANAGER")) {
            let currentDealerId: string | null = null;
            if (typeof window !== "undefined") {
                currentDealerId = localStorage.getItem("dealerId");
            }
            if (!currentDealerId) {
                const uniqueDealerIds = Array.from(
                    new Set(staffPerf.map((s) => s.dealerId).filter(Boolean))
                );
                if (uniqueDealerIds.length === 1) currentDealerId = uniqueDealerIds[0] as string;
            }
            const list = staffPerf.filter((s) => s.dealerId === currentDealerId);
            charts =
                list.length > 0
                    ? [
                        <ChartCard
                            key={currentDealerId}
                            title={`Hiệu suất nhân viên - ${list[0]?.dealerName ?? "Đại lý của bạn"}`}
                        >
                            <BarChartComponent
                                layout="vertical"
                                data={list}
                                xKey="staff"
                                bars={[{ key: "totalRevenue", color: COLORS[2] }]}
                                valueFormatter={vf}
                            />
                        </ChartCard>,
                    ]
                    : [
                        <ChartCard key="no-data" title="Hiệu suất nhân viên">
                            <p className="text-center text-gray-500 italic">
                                Không có dữ liệu cho đại lý của bạn.
                            </p>
                        </ChartCard>,
                    ];
        }

        return (
            <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Doanh số theo trạng thái">
                    <PieChartComponent
                        data={byStatus}
                        dataKey="count"
                        nameKey="status"
                        valueFormatter={vf}
                    />
                </ChartCard>

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

                {charts.length > 0 ? (
                    charts
                ) : (
                    <ChartCard title="Hiệu suất nhân viên">
                        <p className="text-center text-gray-500 italic">
                            Không có dữ liệu hoặc bạn không có quyền xem phần này.
                        </p>
                    </ChartCard>
                )}
            </div>
        );
    };




    const renderCustomers = (d: ReportPayload) => {
        const byStatus: ChartData[] = Array.isArray(d.byStatus) ? (d.byStatus as URec[]).map((r) => ({ status: toStr((r as URec).status), count: toNum((r as URec).count), })) : [];
        const byCity: ChartData[] = Array.isArray(d.byCity) ? (d.byCity as URec[]).map((r) => ({ city: toStr((r as URec).city), count: toNum((r as URec).count), })) : [];
        const acquisitionTrend: ChartData[] = Array.isArray(d.acquisitionTrend) ? (d.acquisitionTrend as URec[]).map((r) => ({ month: toStr((r as URec).month ?? (r as URec).date), count: toNum((r as URec).count), })) : [];
        const funnel: ChartData[] = (() => { const raw = (d.conversionFunnel as unknown) ?? {}; if (!raw || typeof raw !== "object") return []; return Object.entries(raw as URec).map(([stage, v]) => { const vr = v as URec; return { stage, count: toNum(vr.count), percentage: toNum(vr.percentage) }; }); })();
        return (
            <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Khách hàng theo trạng thái"><PieChartComponent data={byStatus} dataKey="count" nameKey="status" valueFormatter={vf} /></ChartCard>
                <ChartCard title="Khách hàng theo thành phố"><BarChartComponent layout="vertical" data={byCity} xKey="city" bars={[{ key: "count", color: COLORS[3] }]} valueFormatter={vf} /></ChartCard>
                {acquisitionTrend.length > 0 && (<ChartCard title="Xu hướng thu hút khách hàng"><LineChartComponent data={acquisitionTrend} xKey="month" lines={[{ key: "count", color: COLORS[0] }]} valueFormatter={vf} /></ChartCard>)}
                {funnel.length > 0 && (<ChartCard title="Mô hình tiếp thị chuyển đổi khách hàng"><BarChartComponent layout="vertical" data={funnel} xKey="stage" bars={[{ key: "count", color: COLORS[4] }]} valueFormatter={vf} /></ChartCard>)}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    {reportDefs.map((r) => (
                        <button key={r.id} onClick={() => setActiveReport(r.id)} className={`px-3 py-2 rounded-lg text-sm font-medium ${activeReport === r.id ? "bg-blue-600 text-white" : "border border-black/20 text-black hover:bg-black/5"}`}>
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {(["week", "month", "quarter", "year"] as const).map((p) => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-2 rounded-lg text-sm font-medium ${period === p ? "bg-blue-600 text-white" : "border border-black/20 text-black hover:bg-black/5"}`}>
                            {p === "week" ? "Tuần" : p === "month" ? "Tháng" : p === "quarter" ? "Quý" : "Năm"}
                        </button>
                    ))}
                </div>
            </header>
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-2 text-black">{reportDefs.find((r) => r.id === activeReport)?.label}</h2>
                <p className="text-3xl font-bold text-black">{totalFmt}</p>
                {data?.unit && <p className="text-sm text-black mt-1">Đơn vị: {data.unit}</p>}
            </div>
            {loading ? (<LoadingState />) : err ? (<ErrorState message={err} />) : (<> {activeReport === "sales" && data && renderSales(data)} {activeReport === "customers" && data && renderCustomers(data)} </>)}
        </div>
    );
}