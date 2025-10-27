// File: src/components/reports/ReportEVM.tsx

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
    dealerLabel,
    makeValueFormatter,
    ChartCard,
    BarChartComponent,
    LineChartComponent,
    LoadingState,
    ErrorState,
    StatCard,
    SectionCard,
} from "./reportUtils";

const EVM_REPORTS: { id: AnyReportType; label: string }[] = [
    { id: "dealer-performance", label: "Doanh số theo khu vực, đại lý" },
    { id: "inventory", label: "Tồn kho & tốc độ tiêu thụ" },
];

type URec = Record<string, unknown>;

interface ReportEVMProps {
    userRole: string;
    defaultPeriod?: Period;
}

export default function ReportEVM({
    userRole,
    defaultPeriod = "month",
}: ReportEVMProps) {
    const reportDefs = EVM_REPORTS;

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

    // const renderInventory = (d: ReportPayload) => {
    //     console.log("Inventory payload:", d);

    //     const dealerSummary: ChartData[] = Array.isArray(d.dealerSummary) ? (d.dealerSummary as URec[]).map((r) => ({ dealer: dealerLabel((r as URec).dealer), available: toNum((r as URec).available), reserved: toNum((r as URec).reserved), sold: toNum((r as URec).sold), })) : [];
    //     const lowStock: ChartData[] = Array.isArray(d.lowStock) ? (d.lowStock as URec[]).map((r) => ({ vehicle: vehicleLabel((r as URec).vehicle), available: toNum((r as URec).available), })) : [];
    //     const vehicleStats: ChartData[] = Array.isArray(d.vehicleStats) ? (d.vehicleStats as URec[]).map((r) => ({ vehicle: vehicleLabel((r as URec).vehicle), totalStock: toNum((r as URec).totalStock), totalSold: toNum((r as URec).totalSold), })) : [];
    //     return (
    //         <div className="grid grid-cols-1 gap-8">
    //             <ChartCard title="Tồn kho theo đại lý"><BarChartComponent data={dealerSummary} xKey="dealer" bars={[{ key: "available", color: COLORS[1] }, { key: "reserved", color: COLORS[2] }, { key: "sold", color: COLORS[3] }]} stacked valueFormatter={vf} /></ChartCard>
    //             <ChartCard title="Xe sắp hết hàng"><BarChartComponent layout="vertical" data={lowStock} xKey="vehicle" bars={[{ key: "available", color: COLORS[3] }]} valueFormatter={vf} /></ChartCard>
    //             <ChartCard title="Top xe theo tồn kho & bán"><BarChartComponent data={vehicleStats} xKey="vehicle" bars={[{ key: "totalStock", color: COLORS[0] }, { key: "totalSold", color: COLORS[1] }]} valueFormatter={vf} /></ChartCard>
    //         </div>
    //     );
    // };


    // --- GIỮ NGUYÊN HÀM renderInventory ---
    // const renderInventory = (d: ReportPayload) => {
    //     console.log("Inventory payload:", d);

    //     const dealerSummary: ChartData[] = Array.isArray(d.dealerSummary)
    //         ? (d.dealerSummary as URec[]).map((r) => ({
    //             dealer: dealerLabel((r as URec).dealer),
    //             available: toNum((r as URec).available),
    //             reserved: toNum((r as URec).reserved),
    //             sold: toNum((r as URec).sold),
    //         }))
    //         : [];
    //     console.log("dealerSummary >>>", dealerSummary);

    //     const lowStock: ChartData[] = Array.isArray(d.lowStock)
    //         ? (d.lowStock as URec[]).map((r) => ({
    //             vehicle: vehicleLabel((r as URec).vehicle),
    //             available: toNum((r as URec).available),
    //         }))
    //         : [];
    //     console.log("lowStock >>>", lowStock);

    //     const vehicleStats: ChartData[] = Array.isArray(d.vehicleStats)
    //         ? (d.vehicleStats as URec[]).map((r) => ({
    //             vehicle: vehicleLabel((r as URec).vehicle),
    //             totalStock: toNum((r as URec).totalStock),
    //             totalSold: toNum((r as URec).totalSold),
    //         }))
    //         : [];
    //     console.log("vehicleStats >>>", vehicleStats);

    //     return (
    //         <div className="grid grid-cols-1 gap-8">
    //             <ChartCard title="Tồn kho theo đại lý">
    //                 <BarChartComponent
    //                     data={dealerSummary}
    //                     xKey="dealer"
    //                     bars={[
    //                         { key: "available", color: COLORS[1] },
    //                         { key: "reserved", color: COLORS[2] },
    //                         { key: "sold", color: COLORS[3] },
    //                     ]}
    //                     stacked
    //                     valueFormatter={vf}
    //                 />
    //             </ChartCard>

    //             <ChartCard title="Xe sắp hết hàng">
    //                 <BarChartComponent
    //                     layout="vertical"
    //                     data={lowStock}
    //                     xKey="vehicle"
    //                     bars={[{ key: "available", color: COLORS[3] }]}
    //                     valueFormatter={vf}
    //                 />
    //             </ChartCard>

    //             <ChartCard title="Top xe theo tồn kho & bán">
    //                 <BarChartComponent
    //                     data={vehicleStats}
    //                     xKey="vehicle"
    //                     bars={[
    //                         { key: "totalStock", color: COLORS[0] },
    //                         { key: "totalSold", color: COLORS[1] },
    //                     ]}
    //                     valueFormatter={vf}
    //                 />
    //             </ChartCard>
    //         </div>
    //     );
    // };


    // const renderInventory = (d: ReportPayload) => {
    //     console.log("Inventory payload:", d);

    //     const dealersRaw = Array.isArray((d as any).dealers) ? (d as any).dealers : [];
    //     const dealerSummary: ChartData[] = dealersRaw.map((r: any) => {
    //         const total = toNum(r.inventoryTotal);
    //         const sold = toNum(r.inventorySold);
    //         const reserved = toNum(r.inventoryReserved ?? 0);
    //         const available = Math.max(total - sold - reserved, 0);
    //         return {
    //             dealer: r.dealerName ?? "",
    //             available,
    //             reserved,
    //             sold,
    //         };
    //     });
    //     console.log("dealerSummary >>>", dealerSummary);

    //     const lowStockFromApi: ChartData[] = Array.isArray(d.lowStock)
    //         ? (d.lowStock as URec[]).map((r) => ({
    //             vehicle: vehicleLabel((r as URec).vehicle),
    //             available: toNum((r as URec).available),
    //         }))
    //         : [];
    //     const lowStockFallback: ChartData[] = dealerSummary
    //         .filter((x) => toNum(x.available) <= 5)
    //         .map((x) => ({ vehicle: toStr(x.dealer), available: toNum(x.available) }));
    //     const lowStock: ChartData[] = lowStockFromApi.length ? lowStockFromApi : lowStockFallback;
    //     console.log("lowStock >>>", lowStock);

    //     const vehicleStats: ChartData[] = dealersRaw.map((r: any) => ({
    //         vehicle: r.dealerName ?? "",
    //         totalStock: toNum(r.inventoryTotal),
    //         totalSold: toNum(r.inventorySold),
    //     }));
    //     console.log("vehicleStats >>>", vehicleStats);

    //     return (
    //         <div className="grid grid-cols-1 gap-8">
    //             <ChartCard title="Tồn kho theo đại lý">
    //                 <BarChartComponent
    //                     data={dealerSummary}
    //                     xKey="dealer"
    //                     bars={[
    //                         { key: "available", color: COLORS[1] },
    //                         { key: "reserved", color: COLORS[2] },
    //                         { key: "sold", color: COLORS[3] },
    //                     ]}
    //                     stacked
    //                     valueFormatter={vf}
    //                 />
    //             </ChartCard>

    //             <ChartCard title="Đại lý/xe sắp hết hàng">
    //                 <BarChartComponent
    //                     layout="vertical"
    //                     data={lowStock}
    //                     xKey="vehicle"
    //                     bars={[{ key: "available", color: COLORS[3] }]}
    //                     valueFormatter={vf}
    //                 />
    //             </ChartCard>

    //             <ChartCard title="Thống kê tồn kho & bán theo đại lý">
    //                 <BarChartComponent
    //                     data={vehicleStats}
    //                     xKey="vehicle"
    //                     bars={[
    //                         { key: "totalStock", color: COLORS[0] },
    //                         { key: "totalSold", color: COLORS[1] },
    //                     ]}
    //                     valueFormatter={vf}
    //                 />
    //             </ChartCard>
    //         </div>
    //     );
    // };


    const renderInventory = (d: ReportPayload) => {
        console.log("Inventory payload:", d);

        const dealerSummary: ChartData[] = Array.isArray(d.dealerSummary)
            ? (d.dealerSummary as URec[]).map((r) => ({
                dealer: toStr((r as URec).dealer),
                available: toNum((r as URec).available),
                reserved: toNum((r as URec).reserved),
                sold: toNum((r as URec).sold),
            }))
            : [];
        console.log("dealerSummary >>>", dealerSummary);

        const lowStockFromApi: ChartData[] = Array.isArray(d.lowStock)
            ? (d.lowStock as URec[]).map((r) => ({
                vehicle: vehicleLabel((r as URec).vehicle),
                available: toNum((r as URec).available),
            }))
            : [];

        const lowStockFallback: ChartData[] = dealerSummary
            .filter((x) => toNum(x.available) <= 5)
            .map((x) => ({
                vehicle: toStr(x.dealer),
                available: toNum(x.available),
            }));

        const lowStock: ChartData[] =
            lowStockFromApi.length ? lowStockFromApi : lowStockFallback;
        console.log("lowStock >>>", lowStock);

        const vehicleStats: ChartData[] = dealerSummary.map((r) => ({
            vehicle: toStr(r.dealer),
            totalStock: toNum(r.available) + toNum(r.reserved) + toNum(r.sold),
            totalSold: toNum(r.sold),
        }));
        console.log("vehicleStats >>>", vehicleStats);

        return (
            <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Tồn kho">
                    <BarChartComponent
                        data={dealerSummary}
                        xKey="dealer"
                        bars={[
                            { key: "available", color: COLORS[1] },
                            { key: "reserved", color: COLORS[2] },
                            { key: "sold", color: COLORS[3] },
                        ]}
                        stacked
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Xe sắp hết hàng">
                    <BarChartComponent
                        layout="vertical"
                        data={lowStock}
                        xKey="vehicle"
                        bars={[{ key: "available", color: COLORS[3] }]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Thống kê tồn kho & bán">
                    <BarChartComponent
                        data={vehicleStats}
                        xKey="vehicle"
                        bars={[
                            { key: "totalStock", color: COLORS[0] },
                            { key: "totalSold", color: COLORS[1] },
                        ]}
                        valueFormatter={vf}
                    />
                </ChartCard>
            </div>
        );
    };


    const renderDealerPerformance = (d: ReportPayload) => {
        const dealers = Array.isArray(d.dealerSummary) ? d.dealerSummary : [];

        const salesChart = dealers.map((r) => ({
            dealer: r.dealer,
            salesRevenue: r.salesRevenue,
            salesCount: r.salesCount,
        }));

        const inventoryChart = dealers.map((r) => ({
            dealer: r.dealer,
            total: r.inventoryTotal,
            sold: r.inventorySold,
        }));

        const testDriveChart = dealers.map((r) => ({
            dealer: r.dealer,
            testDrives: r.testDrives,
        }));

        const targetChart = dealers.map((r) => ({
            dealer: r.dealer,
            achievementRate: r.achievementRate,
        }));

        return (
            <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Doanh thu theo đại lý">
                    <BarChartComponent
                        data={salesChart}
                        xKey="dealer"
                        bars={[
                            { key: "salesRevenue", color: COLORS[0] },
                            { key: "salesCount", color: COLORS[1] },
                        ]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Tồn kho & bán theo đại lý">
                    <BarChartComponent
                        data={inventoryChart}
                        xKey="dealer"
                        bars={[
                            { key: "total", color: COLORS[2] },
                            { key: "sold", color: COLORS[3] },
                        ]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Lái thử theo đại lý">
                    <BarChartComponent
                        data={testDriveChart}
                        xKey="dealer"
                        bars={[{ key: "testDrives", color: COLORS[4] }]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Tỉ lệ hoàn thành mục tiêu (%)">
                    <BarChartComponent
                        data={targetChart}
                        xKey="dealer"
                        bars={[{ key: "achievementRate", color: COLORS[5] }]}
                        valueFormatter={(v) => `${v.toFixed(1)}%`}
                    />
                </ChartCard>
            </div>
        );
    };



    const renderExecutiveSummary = (d: ReportPayload) => {
        return (
            <div className="space-y-10">
                {d.customers && (<SectionCard title="Khách hàng" color="from-blue-500 to-blue-400"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><StatCard label="Đang hoạt động" value={d.customers.active} color="bg-blue-50" /><StatCard label="Khách hàng mới" value={d.customers.new} color="bg-blue-100" /><StatCard label="Tổng số" value={d.customers.total} color="bg-blue-200" /></div></SectionCard>)}
                {d.dealerOrders && (<SectionCard title="Đơn hàng đại lý" color="from-green-500 to-green-400"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><StatCard label="Tổng đơn hàng" value={d.dealerOrders.totalOrders} color="bg-green-50" /><StatCard label="Tổng số lượng" value={d.dealerOrders.totalQuantity} color="bg-green-100" /><StatCard label="Tổng giá trị" value={d.dealerOrders.totalAmount} color="bg-green-200" /></div></SectionCard>)}
                {d.inventory && (<SectionCard title="Tồn kho" color="from-purple-500 to-purple-400"><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><StatCard label="Xe còn hàng" value={d.inventory.available} color="bg-purple-50" /><StatCard label="Đã giữ chỗ" value={d.inventory.reserved} color="bg-purple-100" /><StatCard label="Đã bán" value={d.inventory.sold} color="bg-purple-200" /><StatCard label="Tổng số xe" value={d.inventory.total} color="bg-purple-300" /></div></SectionCard>)}
                {d.sales && (<SectionCard title="Doanh số" color="from-orange-500 to-orange-400"><div className="grid grid-cols-1 md:grid-cols-5 gap-6"><StatCard label="Doanh thu" value={d.sales.totalRevenue} color="bg-orange-50" /><StatCard label="Chiết khấu" value={d.sales.totalDiscount} color="bg-orange-100" /><StatCard label="HĐ hoàn tất" value={d.sales.completedContracts} color="bg-orange-200" /><StatCard label="Tổng HĐ" value={d.sales.totalContracts} color="bg-orange-300" /><StatCard label="Giá trị TB" value={d.sales.averageOrderValue} color="bg-orange-400" /></div></SectionCard>)}
                {d.testDrives && (<SectionCard title="Test Drives" color="from-pink-500 to-pink-400"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><StatCard label="Hoàn tất" value={d.testDrives.completed} color="bg-pink-50" /><StatCard label="Tỉ lệ hoàn tất (%)" value={d.testDrives.completionRate} color="bg-pink-100" /><StatCard label="Tổng số" value={d.testDrives.total} color="bg-pink-200" /></div></SectionCard>)}
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
            {loading ? (<LoadingState />) : err ? (<ErrorState message={err} />) : (<> {activeReport === "dealer-performance" && data && renderExecutiveSummary(data)} {activeReport === "inventory" && data && renderInventory(data)} </>)}

            {activeReport === "dealer-performance" && data && renderDealerPerformance(data)}


        </div>
    );
}