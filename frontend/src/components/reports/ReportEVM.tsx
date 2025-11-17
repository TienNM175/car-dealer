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
    { id: "vehicles-by-dealer", label: "Xe theo đại lý" },
    { id: "inventory", label: "Tồn kho & tốc độ tiêu thụ" },
    { id: "dealer-debts", label: "Công nợ đại lý" },
];

type URec = Record<string, unknown>;

interface ReportEVMProps {
    userRole: string;
    defaultPeriod?: Period;
}

// Helper function to format dealer label
const formatDealerLabel = (dealer: any): string => {
    if (!dealer) return "Không xác định";
    if (typeof dealer === 'string') return dealer;
    return [dealer.name, dealer.code, dealer.city].filter(Boolean).join(" - ");
};

// Custom StatCard component hỗ trợ format
const CustomStatCard = ({ 
    label, 
    value, 
    color = "gray",
    format = "number" 
}: { 
    label: string; 
    value: number; 
    color?: string;
    format?: "number" | "currency";
}) => {
    const colorClasses: Record<string, string> = {
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

// Fallback data để tránh crash
const getFallbackData = (type: AnyReportType): ReportPayload => {
    const baseData = {
        title: "Báo cáo",
        unit: "",
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
        case "dealer-performance":
            return {
                ...baseData,
                dealers: [],
                dealerSummary: [],
                vehiclesByDealer: [],
                totalCancelledDeposits: {
                    totalAmount: 0,
                    count: 0
                }
            };
        case "vehicles-by-dealer":
            return {
                ...baseData,
                vehicles: []
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
        default:
            return baseData;
    }
};

export default function ReportEVM({
    userRole,
    defaultPeriod = "month",
}: ReportEVMProps) {
    const reportDefs = EVM_REPORTS;

    const [activeReport, setActiveReport] = useState<AnyReportType>(
        reportDefs[0].id
    );
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
                console.log(`[REPORT] Fetching ${activeReport} for period ${period}`);
                // GIẢI PHÁP: Sử dụng "all" làm period mặc định cho báo cáo công nợ đại lý
                const reportPeriod = activeReport === "dealer-debts" ? "all" : period;
                const json = await fetchReport(activeReport, reportPeriod);
                
                if (!aborted) {
                    console.log(`[REPORT] Success:`, json);
                    setData(json);
                }
            } catch (e: any) {
                if (!aborted) {
                    console.error(`[REPORT] Error:`, e);
                    const errorMessage = e.response?.data?.message || e.message || "Không thể tải dữ liệu";
                    setErr(errorMessage);
                    
                    // Set fallback data để UI không bị trống
                    setData(getFallbackData(activeReport));
                }
            } finally {
                if (!aborted) setLoading(false);
            }
        })();
        
        return () => {
            aborted = true;
        };
    }, [activeReport, period]);

    const totalFmt = useMemo(() => {
        if (!data || data.total === undefined || data.total === null) return "—";
        return makeValueFormatter(data.unit ?? undefined)(Number(data.total), "");
    }, [data]);

    const vf = makeValueFormatter(data?.unit ?? undefined);

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

        const lowStock: ChartData[] = lowStockFromApi.length
            ? lowStockFromApi
            : lowStockFallback;
        console.log("lowStock >>>", lowStock);

        const vehicleStats: ChartData[] = dealerSummary.map((r) => ({
            vehicle: toStr(r.dealer),
            totalStock: toNum(r.available) + toNum(r.reserved) + toNum(r.sold),
            totalSold: toNum(r.sold),
        }));
        console.log("vehicleStats >>>", vehicleStats);

        return (
            <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Tồn kho theo đại lý">
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

                {lowStock.length > 0 && (
                    <ChartCard title="Xe sắp hết hàng">
                        <BarChartComponent
                            layout="vertical"
                            data={lowStock}
                            xKey="vehicle"
                            bars={[{ key: "available", color: COLORS[3] }]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}

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

        const salesChart = dealers.map((r: any) => ({
            dealer: r.dealer,
            salesRevenue: r.salesRevenue,
            salesCount: r.salesCount,
        }));

        const inventoryChart = dealers.map((r: any) => ({
            dealer: r.dealer,
            total: r.inventoryTotal,
            sold: r.inventorySold,
        }));

        const testDriveChart = dealers.map((r: any) => ({
            dealer: r.dealer,
            testDrives: r.testDrives,
        }));

        const targetChart = dealers.map((r: any) => ({
            dealer: r.dealer,
            achievementRate: r.achievementRate,
        }));

        return (
            <div className="grid grid-cols-1 gap-8">
                {salesChart.length > 0 && (
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
                )}

                {inventoryChart.length > 0 && (
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
                )}

                {testDriveChart.length > 0 && (
                    <ChartCard title="Lái thử theo đại lý">
                        <BarChartComponent
                            data={testDriveChart}
                            xKey="dealer"
                            bars={[{ key: "testDrives", color: COLORS[4] }]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}

                {targetChart.length > 0 && (
                    <ChartCard title="Tỉ lệ hoàn thành mục tiêu (%)">
                        <BarChartComponent
                            data={targetChart}
                            xKey="dealer"
                            bars={[{ key: "achievementRate", color: COLORS[5] }]}
                            valueFormatter={(v) => `${Number(v).toFixed(1)}%`}
                        />
                    </ChartCard>
                )}

                {/* Danh sách xe và breakdown theo đại lý */}
                {d.vehiclesByDealer && Array.isArray(d.vehiclesByDealer) && d.vehiclesByDealer.length > 0 && (
                    <SectionCard
                        title="Doanh số theo xe và đại lý"
                        color="from-indigo-500 to-indigo-400"
                    >
                        <div className="space-y-4">
                            {d.vehiclesByDealer.map((item: any, index: number) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg p-4 border border-gray-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                {item.vehicle?.manufacturer?.name || ""}{" "}
                                                {item.vehicle?.model || ""}
                                            </h4>
                                            {item.vehicle?.variant && (
                                                <p className="text-sm text-gray-500">
                                                    {item.vehicle.variant}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Tổng hợp đồng</p>
                                            <p className="text-lg font-bold text-indigo-600">
                                                {item.totalContracts || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Bán tại các đại lý:
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {item.dealers && Array.isArray(item.dealers) && item.dealers.map(
                                                (dealerItem: any, dealerIndex: number) => (
                                                    <div
                                                        key={dealerIndex}
                                                        className="bg-gray-50 rounded p-2 flex items-center justify-between"
                                                    >
                                                        <span className="text-sm text-gray-700">
                                                            {dealerItem.dealer?.name || "Unknown"}
                                                        </span>
                                                        <span className="text-sm font-semibold text-indigo-600">
                                                            {dealerItem.contractCount || 0} HĐ
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Tổng tiền hủy cọc (chỉ tổng, không chi tiết từng đại lý) */}
                {d.totalCancelledDeposits && Number(d.totalCancelledDeposits.totalAmount || 0) > 0 && (
                    <SectionCard
                        title="Tổng tiền hủy cọc (tất cả đại lý)"
                        color="from-orange-500 to-orange-400"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Tổng tiền hủy cọc</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(Number(d.totalCancelledDeposits.totalAmount || 0))}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Số HĐ đặt cọc đã hủy</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {d.totalCancelledDeposits.count || 0}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            * Tổng tiền cọc không hoàn lại từ tất cả đại lý khi khách hủy HĐ đặt cọc
                        </p>
                    </SectionCard>
                )}

                {dealers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Không có dữ liệu hiệu suất đại lý
                    </div>
                )}
            </div>
        );
    };

    const renderVehiclesByDealer = (d: ReportPayload) => {
        const vehicles = Array.isArray(d.vehicles) ? d.vehicles : [];

        const openVehicleDetail = (vehicleId?: string) => {
            if (!vehicleId) return;
            const url = `/evm/reports/vehicles/${vehicleId}`;
            if (typeof window !== "undefined") {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        };

        return (
            <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Danh sách xe trong hệ thống
                    </h3>
                    <p className="text-sm text-gray-600">
                        Click vào xe để xem chi tiết tồn kho và hợp đồng
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((item: any, index: number) => {
                        const vehicleName = `${item.vehicle?.manufacturer?.name || ""} ${
                            item.vehicle?.model || ""
                        } ${item.vehicle?.variant || ""}`.trim();
                        
                        const totalInventory = item.totalInventory !== undefined
                            ? item.totalInventory
                            : (item.evmInventory?.quantity || 0) +
                            (item.inventory && Array.isArray(item.inventory)
                                ? item.inventory.reduce(
                                    (sum: number, inv: any) =>
                                        sum + Number(inv.quantity || inv.total || 0),
                                    0
                                )
                                : 0);
                        const totalSales = item.totalSales || 0;

                        return (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-200 cursor-pointer"
                                onClick={() => openVehicleDetail(item.vehicle?.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900 text-base leading-tight">
                                        {vehicleName || "Xe không xác định"}
                                    </h4>
                                    <svg
                                        className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Tồn kho:</span>
                                        <span className="text-sm font-semibold text-green-600">
                                            {totalInventory} xe
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">
                                            Hợp đồng đã ký:
                                        </span>
                                        <span className="text-sm font-semibold text-orange-600">
                                            {totalSales} HĐ
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openVehicleDetail(item.vehicle?.id);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Xem chi tiết →
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {vehicles.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                        Không có xe nào trong hệ thống
                    </div>
                )}
            </div>
        );
    };

    const renderExecutiveSummary = (d: ReportPayload) => {
        return (
            <div className="space-y-10">
                {d.customers && (
                    <SectionCard title="Khách hàng" color="from-blue-500 to-blue-400">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                label="Đang hoạt động"
                                value={d.customers.active || 0}
                                color="bg-blue-50"
                            />
                            <StatCard
                                label="Khách hàng mới"
                                value={d.customers.new || 0}
                                color="bg-blue-100"
                            />
                            <StatCard
                                label="Tổng số"
                                value={d.customers.total || 0}
                                color="bg-blue-200"
                            />
                        </div>
                    </SectionCard>
                )}
                {d.dealerOrders && (
                    <SectionCard
                        title="Đơn hàng đại lý"
                        color="from-green-500 to-green-400"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                label="Tổng đơn hàng"
                                value={d.dealerOrders.totalOrders || 0}
                                color="bg-green-50"
                            />
                            <StatCard
                                label="Tổng số lượng"
                                value={d.dealerOrders.totalQuantity || 0}
                                color="bg-green-100"
                            />
                            <StatCard
                                label="Tổng giá trị"
                                value={d.dealerOrders.totalAmount || 0}
                                color="bg-green-200"
                            />
                        </div>
                    </SectionCard>
                )}
                {d.inventory && (
                    <SectionCard title="Tồn kho" color="from-purple-500 to-purple-400">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard
                                label="Xe còn hàng"
                                value={d.inventory.available || 0}
                                color="bg-purple-50"
                            />
                            <StatCard
                                label="Đã giữ chỗ"
                                value={d.inventory.reserved || 0}
                                color="bg-purple-100"
                            />
                            <StatCard
                                label="Đã bán"
                                value={d.inventory.sold || 0}
                                color="bg-purple-200"
                            />
                            <StatCard
                                label="Tổng số xe"
                                value={d.inventory.total || 0}
                                color="bg-purple-300"
                            />
                        </div>
                    </SectionCard>
                )}
                {d.sales && (
                    <SectionCard title="Doanh số" color="from-orange-500 to-orange-400">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <StatCard
                                label="Doanh thu"
                                value={d.sales.totalRevenue || 0}
                                color="bg-orange-50"
                            />
                            <StatCard
                                label="Chiết khấu"
                                value={d.sales.totalDiscount || 0}
                                color="bg-orange-100"
                            />
                            <StatCard
                                label="HĐ hoàn tất"
                                value={d.sales.completedContracts || 0}
                                color="bg-orange-200"
                            />
                            <StatCard
                                label="Tổng HĐ"
                                value={d.sales.totalContracts || 0}
                                color="bg-orange-300"
                            />
                            <StatCard
                                label="Giá trị TB"
                                value={d.sales.averageOrderValue || 0}
                                color="bg-orange-400"
                            />
                        </div>
                    </SectionCard>
                )}
                {d.testDrives && (
                    <SectionCard title="Test Drives" color="from-pink-500 to-pink-400">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                label="Hoàn tất"
                                value={d.testDrives.completed || 0}
                                color="bg-pink-50"
                            />
                            <StatCard
                                label="Tỉ lệ hoàn tất (%)"
                                value={d.testDrives.completionRate || 0}
                                color="bg-pink-100"
                            />
                            <StatCard
                                label="Tổng số"
                                value={d.testDrives.total || 0}
                                color="bg-pink-200"
                            />
                        </div>
                    </SectionCard>
                )}
            </div>
        );
    };

    const renderDealerDebts = (d: ReportPayload) => {
        const detailedDebts = Array.isArray(d.detailedDebts) ? d.detailedDebts : [];
        const summary = d.summary || {};

        // Chart data by dealer
        const byDealer = detailedDebts.reduce((acc: any[], debt: any) => {
            const dealerName = formatDealerLabel(debt.dealer);
            const existing = acc.find(item => item.dealer === dealerName);

            if (existing) {
                existing.totalDebt += debt.remainingBalance || 0;
                existing.orderCount += 1;
            } else {
                acc.push({
                    dealer: dealerName,
                    totalDebt: debt.remainingBalance || 0,
                    orderCount: 1
                });
            }

            return acc;
        }, []);

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

        const DealerDebtCard = ({ debt }: { debt: any }) => {
            return (
                <div className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-gray-900">
                                    {formatDealerLabel(debt.dealer)}
                                </h5>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    debt.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                    debt.isOverdue ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {debt.status === 'PAID' ? 'Đã trả' : 
                                    debt.isOverdue ? 'Quá hạn' : 'Đang nợ'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                                Đơn hàng: {debt.order?.orderNumber || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {debt.vehicle?.manufacturer?.name} {debt.vehicle?.model} {debt.vehicle?.variant}
                            </p>
                            <p className="text-sm text-gray-500">
                                Đặt hàng: {formatDate(debt.order?.orderedAt)} • 
                                Giao hàng: {debt.order?.deliveredAt ? formatDate(debt.order.deliveredAt) : 'Chưa giao'}
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
                            <p className="text-sm font-medium text-gray-700 mb-1">Thông tin đơn hàng:</p>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>Trạng thái: {debt.order?.status || 'N/A'}</p>
                                <p>Hạn thanh toán: {debt.dueDate ? formatDate(debt.dueDate) : 'N/A'}</p>
                                {debt.isOverdue && (
                                    <p className="text-red-600">Quá hạn: {debt.daysOverdue} ngày</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Nhân viên đặt hàng:</p>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{debt.staff?.firstName} {debt.staff?.lastName}</p>
                                <p>{debt.staff?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <CustomStatCard
                        label="Tổng công nợ"
                        value={summary.totalDebt || 0}
                        format="currency"
                        color="red"
                    />
                    <CustomStatCard
                        label="Tổng đơn hàng"
                        value={summary.totalOrders || 0}
                        color="blue"
                    />
                    <CustomStatCard
                        label="Đơn hàng chưa thanh toán"
                        value={summary.unpaidOrders || 0}
                        color="orange"
                    />
                    <CustomStatCard
                        label="Đơn hàng quá hạn"
                        value={summary.overdueOrders || 0}
                        color="red"
                    />
                </div>

                {/* Chart - Debt by dealer */}
                {byDealer.length > 0 && (
                    <ChartCard title="Công nợ theo đại lý">
                        <BarChartComponent
                            data={byDealer}
                            xKey="dealer"
                            bars={[
                                { key: "totalDebt", color: COLORS[0] },
                            ]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}

                {/* Danh sách công nợ chi tiết */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h3 className="text-lg text-black font-semibold">Danh sách công nợ đại lý chi tiết</h3>
                    </div>
                    <div className="p-6">
                        {detailedDebts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có công nợ đại lý nào
                            </div>
                        ) : (
                            detailedDebts.map((debt: any, index: number) => (
                                <DealerDebtCard key={index} debt={debt} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderReportContent = () => {
        if (!data) return null;

        switch (activeReport) {
            case "inventory":
                return renderInventory(data);
            case "dealer-performance":
                return renderDealerPerformance(data);
            case "vehicles-by-dealer":
                return renderVehiclesByDealer(data);
            case "executive-summary":
                return renderExecutiveSummary(data);
            case "dealer-debts":
                return renderDealerDebts(data);
            default:
                return (
                    <div className="text-center py-12 text-gray-500">
                        Chức năng báo cáo đang được phát triển
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    {reportDefs.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setActiveReport(r.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeReport === r.id
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                
                {/* CHỈ HIỆN FILTER KHI KHÔNG PHẢI BÁO CÁO CÔNG NỢ ĐẠI LÝ */}
                {activeReport !== "dealer-debts" && (
                    <div className="flex gap-2">
                        {(["week", "month", "quarter", "year"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    period === p
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                                }`}
                            >
                                {p === "week"
                                    ? "Tuần"
                                    : p === "month"
                                    ? "Tháng"
                                    : p === "quarter"
                                    ? "Quý"
                                    : "Năm"}
                            </button>
                        ))}
                    </div>
                )}
            </header>
            
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">
                    {data?.title || reportDefs.find((r) => r.id === activeReport)?.label}
                </h2>
                <p className="text-3xl font-bold text-gray-900">{totalFmt}</p>
                {data?.unit && (
                    <p className="text-sm text-gray-600 mt-1">Đơn vị: {data.unit}</p>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <LoadingState />
            ) : err ? (
                <ErrorState message={err} />
            ) : (
                renderReportContent()
            )}
        </div>
    );
}