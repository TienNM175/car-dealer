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
  { id: "vehicles-by-dealer", label: "Xe theo đại lý" },
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
                        valueFormatter={(v) => `${Number(v).toFixed(1)}%`}
                    />
                </ChartCard>

        {/* Danh sách xe và breakdown theo đại lý */}
        {d.vehiclesByDealer &&
          Array.isArray(d.vehiclesByDealer) &&
          d.vehiclesByDealer.length > 0 && (
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
                        {item.dealers &&
                          Array.isArray(item.dealers) &&
                          item.dealers.map(
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
            // Tổng inventory: EVM + dealers (hoặc dùng totalInventory từ backend nếu có)
            const totalInventory =
              item.totalInventory !== undefined
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
                value={d.customers.active}
                color="bg-blue-50"
              />
              <StatCard
                label="Khách hàng mới"
                value={d.customers.new}
                color="bg-blue-100"
              />
              <StatCard
                label="Tổng số"
                value={d.customers.total}
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
                value={d.dealerOrders.totalOrders}
                color="bg-green-50"
              />
              <StatCard
                label="Tổng số lượng"
                value={d.dealerOrders.totalQuantity}
                color="bg-green-100"
              />
              <StatCard
                label="Tổng giá trị"
                value={d.dealerOrders.totalAmount}
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
                value={d.inventory.available}
                color="bg-purple-50"
              />
              <StatCard
                label="Đã giữ chỗ"
                value={d.inventory.reserved}
                color="bg-purple-100"
              />
              <StatCard
                label="Đã bán"
                value={d.inventory.sold}
                color="bg-purple-200"
              />
              <StatCard
                label="Tổng số xe"
                value={d.inventory.total}
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
                value={d.sales.totalRevenue}
                color="bg-orange-50"
              />
              <StatCard
                label="Chiết khấu"
                value={d.sales.totalDiscount}
                color="bg-orange-100"
              />
              <StatCard
                label="HĐ hoàn tất"
                value={d.sales.completedContracts}
                color="bg-orange-200"
              />
              <StatCard
                label="Tổng HĐ"
                value={d.sales.totalContracts}
                color="bg-orange-300"
              />
              <StatCard
                label="Giá trị TB"
                value={d.sales.averageOrderValue}
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
                value={d.testDrives.completed}
                color="bg-pink-50"
              />
              <StatCard
                label="Tỉ lệ hoàn tất (%)"
                value={d.testDrives.completionRate}
                color="bg-pink-100"
              />
              <StatCard
                label="Tổng số"
                value={d.testDrives.total}
                color="bg-pink-200"
              />
            </div>
          </SectionCard>
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
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                activeReport === r.id
                  ? "bg-blue-600 text-white"
                  : "border border-black/20 text-black hover:bg-black/5"
              }`}
            >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {(["week", "month", "quarter", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "border border-black/20 text-black hover:bg-black/5"
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
            </header>
            <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-2 text-black">
          {reportDefs.find((r) => r.id === activeReport)?.label}
        </h2>
                <p className="text-3xl font-bold text-black">{totalFmt}</p>
        {data?.unit && (
          <p className="text-sm text-black mt-1">Đơn vị: {data.unit}</p>
        )}
            </div>
      {loading ? (
        <LoadingState />
      ) : err ? (
        <ErrorState message={err} />
      ) : (
        <>
          {" "}
          {activeReport === "dealer-performance" &&
            data &&
            renderExecutiveSummary(data)}{" "}
          {activeReport === "inventory" && data && renderInventory(data)}{" "}
        </>
      )}

      {activeReport === "dealer-performance" &&
        data &&
        renderDealerPerformance(data)}

      {activeReport === "vehicles-by-dealer" &&
        data &&
        renderVehiclesByDealer(data)}
        </div>
    );
}
