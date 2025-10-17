"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import type {
    ValueType,
    NameType,
} from "recharts/types/component/DefaultTooltipContent";
import {
    AnyReportType,
    Period,
    ReportPayload,
    fetchReport,
} from "@/lib/api/reportApi";

export type ReportsUserRole =
    | "dealer_staff"
    | "dealer_manager"
    | "evm_staff"
    | "evm_admin";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

type ChartData = Record<string, string | number>;

interface ReportsProps {
    userRole: string;
    defaultPeriod?: Period;
}

const DEALER_REPORTS: { id: AnyReportType; label: string }[] = [
    { id: "sales", label: "Báo cáo doanh số" },
    { id: "inventory", label: "Báo cáo tồn kho" },
    { id: "customers", label: "Báo cáo khách hàng" },
    { id: "dashboard", label: "Tổng quan" },
];

const EVM_REPORTS: { id: AnyReportType; label: string }[] = [
    { id: "dealer-performance", label: "Báo cáo đại lý" },
    { id: "inventory", label: "Tồn kho toàn hệ thống" },
    { id: "executive-summary", label: "Phân phối & logistics" },
    { id: "dashboard", label: "Doanh thu tổng" },
];

type URec = Record<string, unknown>;

const toNum = (v: unknown): number =>
    (typeof v === "number" ? v : Number(v ?? 0)) || 0;

const toStr = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (v && typeof v === "object") {
        const r = v as URec;
        if (typeof r.name === "string") return r.name;
        return (
            Object.values(r)
                .filter((x) => typeof x === "string")
                .join(" ")
                .trim() || ""
        );
    }
    return "";
};

const vehicleLabel = (v: unknown): string => {
    if (!v || typeof v !== "object") return toStr(v);
    const r = v as URec;
    const manu = (r.manufacturer as URec | undefined)?.name;
    return [manu, r.model, r.variant].map(toStr).filter(Boolean).join(" ");
};

const dealerLabel = (d: unknown): string => {
    if (!d || typeof d !== "object") return toStr(d);
    const r = d as URec;
    return [r.name, r.code, r.city].map(toStr).filter(Boolean).join(" - ");
};

const formatCompactVN = (n: number): string => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
};

const makeValueFormatter =
    (unit?: string) =>
        (value: ValueType, _name: NameType): string => {
            if (typeof value !== "number") return String(value);
            if (unit === "VND" || unit === "₫")
                return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
            if (unit === "%") return `${value.toFixed(1)}%`;
            return new Intl.NumberFormat("vi-VN").format(value);
        };

type TickProps = {
    x?: number;
    y?: number;
    payload?: { value: string | number };
};

const wrapTick = (maxChars: number) => {
    const Tick: React.FC<TickProps> = ({ x = 0, y = 0, payload }) => {
        const raw = String(payload?.value ?? "");
        if (!raw) {
            return null;
        }

        const words = raw.split(" ");
        const lines: string[] = [];
        let current = "";

        words.forEach((w) => {
            const candidate = (current ? current + " " : "") + w;
            if (candidate.trim().length > maxChars) {
                if (current) lines.push(current);
                current = w;
            } else {
                current = candidate;
            }
        });
        if (current) lines.push(current);

        const finalLines = lines.slice(0, 3);

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    textAnchor="middle"
                    fontSize={11}
                    fill="#111827"
                    style={{ pointerEvents: "none", lineHeight: "12px" }}
                    y={0}
                >
                    {finalLines.map((ln, i) => (
                        <tspan key={i} x={0} dy={i === 0 ? 14 : 12}>
                            {ln}
                        </tspan>
                    ))}
                    {lines.length > 3 && (
                        <tspan x={0} dy={12}>
                            ...
                        </tspan>
                    )}
                </text>
            </g>
        );
    };

    Tick.displayName = `WrapTick${maxChars}`;
    return Tick;
};

/*  COMPONENT CHÍNH  */
export default function Reports({
    userRole,
    defaultPeriod = "month",
}: ReportsProps) {
    const isDealer = userRole.toLowerCase().startsWith("dealer");
    const reportDefs = isDealer ? DEALER_REPORTS : EVM_REPORTS;

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


    // render seo nè nhe
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

        const staffPerf: ChartData[] = Array.isArray(d.staffPerformance)
            ? (d.staffPerformance as URec[]).map((r) => ({
                staff:
                    toStr((r as URec).staff) ||
                    toStr(((r as URec).staff as URec | undefined)?.email),
                totalRevenue: toNum((r as URec).totalRevenue),
                salesCount: toNum((r as URec).salesCount),
            }))
            : [];

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

                <ChartCard title="Hiệu suất nhân viên">
                    <BarChartComponent
                        layout="vertical"
                        data={staffPerf}
                        xKey="staff"
                        bars={[{ key: "totalRevenue", color: COLORS[2] }]}
                        valueFormatter={vf}
                    />
                </ChartCard>
            </div>
        );
    };

    // RENDER CÚTOMER
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
                return { stage, count: toNum(vr.count), percentage: toNum(vr.percentage) };
            });
        })();

        return (
            <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Khách hàng theo trạng thái">
                    <PieChartComponent
                        data={byStatus}
                        dataKey="count"
                        nameKey="status"
                        valueFormatter={vf}
                    />
                </ChartCard>

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
                    <ChartCard title="Funnel chuyển đổi khách hàng">
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

    // RENDER HÀNG TOỒN KHO
    const renderInventory = (d: ReportPayload) => {
        const dealerSummary: ChartData[] = Array.isArray(d.dealerSummary)
            ? (d.dealerSummary as URec[]).map((r) => ({
                dealer: dealerLabel((r as URec).dealer),
                available: toNum((r as URec).available),
                reserved: toNum((r as URec).reserved),
                sold: toNum((r as URec).sold),
            }))
            : [];

        const lowStock: ChartData[] = Array.isArray(d.lowStock)
            ? (d.lowStock as URec[]).map((r) => ({
                vehicle: vehicleLabel((r as URec).vehicle),
                available: toNum((r as URec).available),
            }))
            : [];

        const vehicleStats: ChartData[] = Array.isArray(d.vehicleStats)
            ? (d.vehicleStats as URec[]).map((r) => ({
                vehicle: vehicleLabel((r as URec).vehicle),
                totalStock: toNum((r as URec).totalStock),
                totalSold: toNum((r as URec).totalSold),
            }))
            : [];

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

                <ChartCard title="Xe sắp hết hàng">
                    <BarChartComponent
                        layout="vertical"
                        data={lowStock}
                        xKey="vehicle"
                        bars={[{ key: "available", color: COLORS[3] }]}
                        valueFormatter={vf}
                    />
                </ChartCard>

                <ChartCard title="Top xe theo tồn kho & bán">
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

    // RENDER DÁHBOARD
    const renderDashboard = (d: ReportPayload) => {
        const keyCards = Object.entries((d.keyMetrics as URec) ?? {});
        const trends: ChartData[] = Array.isArray(d.trends)
            ? (d.trends as URec[]).map((r) => ({
                date: toStr((r as URec).date ?? (r as URec).month),
                value: toNum((r as URec).value),
            }))
            : [];

        return (
            <div className="grid grid-cols-1 gap-8">
                {keyCards.map(([k, v]) => (
                    <div key={k} className="bg-white shadow rounded-xl p-6 text-center">
                        <p className="text-sm text-gray-500">{k}</p>
                        <p className="text-xl font-bold text-black">
                            {makeValueFormatter(d.unit ?? "")(toNum(v), "")}
                        </p>
                    </div>
                ))}

                {trends.length > 0 && (
                    <ChartCard title="Xu hướng tổng quan">
                        <LineChartComponent
                            data={trends}
                            xKey="date"
                            lines={[{ key: "value", color: COLORS[0] }]}
                            valueFormatter={makeValueFormatter(d.unit ?? "")}
                        />
                    </ChartCard>
                )}
            </div>
        );
    };

    // RENDER HIỆU SUẤT ĐẠI LÝ
    const renderDealerPerformance = (d: ReportPayload) => {
        const dealers: ChartData[] = Array.isArray(d.dealers)
            ? (d.dealers as URec[]).map((dl) => ({
                dealerName: toStr(dl.dealerName ?? (dl.dealer as URec | undefined)?.name),
                sales: toNum(dl.sales ?? (dl.sales as URec | undefined)?.count),
                testDrives: toNum(dl.testDrives),
                inventory: toNum(dl.inventory ?? (dl.inventory as URec | undefined)?.total),
                staffCount: toNum(dl.staffCount),
            }))
            : [];

        return (
            <ChartCard title="Hiệu suất đại lý">
                <BarChartComponent
                    data={dealers}
                    xKey="dealerName"
                    bars={[
                        { key: "sales", color: COLORS[0] },
                        { key: "testDrives", color: COLORS[1] },
                        { key: "inventory", color: COLORS[2] },
                        { key: "staffCount", color: COLORS[3] },
                    ]}
                    valueFormatter={vf}
                />
            </ChartCard>
        );
    };

    // REDER TOỔNG QUANG
    const renderExecutiveSummary = (d: ReportPayload) => {
        const vehicles: ChartData[] = Array.isArray(d.topPerformers?.vehicles)
            ? (d.topPerformers!.vehicles as URec[]).map((r) => ({
                vehicle: vehicleLabel((r as URec).vehicle),
                sales: toNum((r as URec).sales),
                revenue: toNum((r as URec).revenue),
            }))
            : [];

        const staff: ChartData[] = Array.isArray(d.topPerformers?.staff)
            ? (d.topPerformers!.staff as URec[]).map((r) => ({
                staff: toStr((r as URec).staff),
                sales: toNum((r as URec).sales),
                revenue: toNum((r as URec).revenue),
            }))
            : [];

        return (
            <div className="grid grid-cols-1 gap-8">
                {vehicles.length > 0 && (
                    <ChartCard title="Top xe nổi bật">
                        <BarChartComponent
                            data={vehicles}
                            xKey="vehicle"
                            bars={[
                                { key: "sales", color: COLORS[0] },
                                { key: "revenue", color: COLORS[1] },
                            ]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}

                {staff.length > 0 && (
                    <ChartCard title="Top nhân viên xuất sắc">
                        <BarChartComponent
                            layout="vertical"
                            data={staff}
                            xKey="staff"
                            bars={[
                                { key: "sales", color: COLORS[2] },
                                { key: "revenue", color: COLORS[3] },
                            ]}
                            valueFormatter={vf}
                        />
                    </ChartCard>
                )}
            </div>
        );
    };

    /*  RENDER CHÍNH NÈ  */
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
                    {activeReport === "sales" && data && renderSales(data)}
                    {activeReport === "customers" && data && renderCustomers(data)}
                    {activeReport === "inventory" && data && renderInventory(data)}
                    {activeReport === "dashboard" && data && renderDashboard(data)}
                    {activeReport === "dealer-performance" && data && renderDealerPerformance(data)}
                    {activeReport === "executive-summary" && data && renderExecutiveSummary(data)}
                </>
            )}
        </div>
    );
}

/*  MẤY CÁI BIỂU ĐỒ Ở ĐÂY */
function ChartCard({
    title,
    children,
    height = "h-[420px]",
}: {
    title: string;
    children: React.ReactNode;
    height?: string;
}) {
    return (
        <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">{title}</h3>
            <div className={height}>{children}</div>
        </div>
    );
}

function PieChartComponent({
    data,
    dataKey,
    nameKey,
    valueFormatter,
}: {
    data: ChartData[];
    dataKey: string;
    nameKey: string;
    valueFormatter?: (v: ValueType, n: NameType) => string;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} dataKey={dataKey} nameKey={nameKey} label>
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={valueFormatter} labelFormatter={(label) => `Nhóm: ${label}`} />
                <Legend formatter={(v) => `• ${v}`} />
            </PieChart>
        </ResponsiveContainer>
    );
}

function BarChartComponent({
    data,
    xKey,
    bars,
    layout,
    stacked,
    valueFormatter,
}: {
    data: ChartData[];
    xKey: string;
    bars: { key: string; color: string }[];
    layout?: "vertical" | "horizontal";
    stacked?: boolean;
    valueFormatter?: (v: ValueType, n: NameType) => string;
}) {
    const xTick = wrapTick(18);
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout={layout}>
                <CartesianGrid strokeDasharray="3 3" />
                {layout === "vertical" ? (
                    <YAxis
                        dataKey={xKey}
                        type="category"
                        interval={0}
                        width={200}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => String(v)}
                    />
                ) : (
                    <XAxis
                        dataKey={xKey}
                        interval={0}
                        height={80}
                        tick={xTick}
                        tickLine={false}
                        minTickGap={8}
                    />
                )}
                {layout === "vertical" ? (
                    <XAxis type="number" tickFormatter={formatCompactVN} />
                ) : (
                    <YAxis tickFormatter={formatCompactVN} />
                )}
                <Tooltip formatter={valueFormatter} labelFormatter={(label) => `Nhóm: ${label}`} />
                <Legend formatter={(v) => `• ${v}`} />
                {bars.map((b) => (
                    <Bar
                        key={b.key}
                        dataKey={b.key}
                        stackId={stacked ? "a" : undefined}
                        fill={b.color}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

function LineChartComponent({
    data,
    xKey,
    lines,
    valueFormatter,
}: {
    data: ChartData[];
    xKey: string;
    lines: { key: string; color: string }[];
    valueFormatter?: (v: ValueType, n: NameType) => string;
}) {
    const xTick = wrapTick(18);
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xKey}
                    interval={0}
                    height={80}
                    tick={xTick}
                    tickLine={false}
                    minTickGap={8}
                />
                <YAxis tickFormatter={formatCompactVN} />
                <Tooltip formatter={valueFormatter} labelFormatter={(label) => `Mốc: ${label}`} />
                <Legend formatter={(v) => `• ${v}`} />
                {lines.map((l) => (
                    <Line
                        key={l.key}
                        type="monotone"
                        dataKey={l.key}
                        stroke={l.color}
                        strokeWidth={2}
                        dot={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

function LoadingState() {
    return (
        <div className="h-[200px] flex items-center justify-center text-black">
            Đang tải dữ liệu...
        </div>
    );
}
function ErrorState({ message }: { message: string }) {
    return (
        <div className="h-[200px] flex items-center justify-center text-red-600">
            {message}
        </div>
    );
}
