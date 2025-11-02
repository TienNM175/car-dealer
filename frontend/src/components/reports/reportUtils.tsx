// File: src/components/reports/reportUtils.tsx

import React from "react";
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
import type { ReportPayload } from "@/lib/api/reportApi";

// --- Hằng số và Types ---
export const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];
export const VN_LABELS: Record<string, string> = {
  // ... (giữ nguyên toàn bộ VN_LABELS từ file gốc)
  sales: "Doanh số",
  revenue: "Doanh thu",
  count: "Số lượng",
  staff: "Nhân viên",
  available: "Còn hàng",
  reserved: "Được đặt trước",
  sold: "Đã bán",
  type: "Hình thức",
  status: "Trạng thái",
  vehicle: "Xe",
  dealer: "Đại lý",
  inventory: "Tồn kho",
  testDrives: "Lái thử",
  staffCount: "Nhân viên",
  total: "Tổng",
  value: "Giá trị",
  date: "Ngày",
  month: "Tháng",
  completed: "Hoàn thành",
  delivering: "Đang giao",
  draft: "Nháp",
  singed: "Đã ký",
  totalSold: "Tổng bán",
  totalStock: "Tổng tồn kho",
  CANCELLED: "Đã hủy",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  SIGNED: "Đã ký nhận",
  FULL: "Thanh toán toàn bộ",
  INSTALLMENT: "Trả góp",
  totalRevenue: "Tổng doanh thu",
  COLD: "Bỏ qua",
  CONTACTED: "Đã liên hệ",
  INTERESTED: "Quan tâm",
  PURCHASED: "Đã mua",
  QUOTED: "Đã báo giá",
  TEST_DRIVE: "Lái thử",
  interested: "Quan tâm",
  contacted: "Đã liên hệ",
  testDrive: "Lái thử",
  quoted: "Đã báo giá",
  purchased: "Đã mua",
  salesCount: "Số hợp đồng",
  salesRevenue: "Doanh thu hợp đồng",
  inventorySold: "Đã bán",
  inventoryTotal: "Tổng tồn",
  achievedAmount: "Số đạt được",
  targetAmount: "Mục tiêu",
  achievementRate: "Tỉ lệ đạt",
  DRAFT: "Bản nháp",
};

export type ChartData = Record<string, string | number>;
type URec = Record<string, unknown>;

export const toNum = (v: unknown): number =>
  (typeof v === "number" ? v : Number(v ?? 0)) || 0;

export const toStr = (v: unknown): string => {
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

export const vehicleLabel = (v: unknown): string => {
  if (!v || typeof v !== "object") return toStr(v);
  const r = v as URec;
  const manu = (r.manufacturer as URec | undefined)?.name;
  return [manu, r.model, r.variant].map(toStr).filter(Boolean).join(" ");
};

export const dealerLabel = (d: unknown): string => {
  if (!d || typeof d !== "object") return toStr(d);
  const r = d as URec;
  return [r.name, r.code, r.city].map(toStr).filter(Boolean).join(" - ");
};

export const formatCompactVN = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

export const makeValueFormatter =
  (unit?: string) =>
  (value: ValueType, _name: NameType): string => {
    if (typeof value !== "number") return String(value);
    if (unit === "VND" || unit === "")
      return new Intl.NumberFormat("vi-VN").format(value) + " ";
    if (unit === "%") return `${value.toFixed(1)}%`;
    return new Intl.NumberFormat("vi-VN").format(value);
  };

export function ChartCard({
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

export function PieChartComponent({
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
        <Tooltip
          formatter={(value, name) => [
            valueFormatter ? valueFormatter(value, name) : value,
            VN_LABELS[name as string] ?? name,
          ]}
          labelFormatter={(label) => `Nhóm: ${VN_LABELS[label] ?? label}`}
        />
        <Legend formatter={(v) => `• ${VN_LABELS[v] ?? v}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarChartComponent({
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
  const wrapTick = (maxChars: number) => {
    const Tick = ({
      x = 0,
      y = 0,
      payload,
    }: any): React.ReactElement<SVGElement> => {
      const raw = String(payload?.value ?? "");
      if (!raw) return <></>;

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
            tickFormatter={(v) => VN_LABELS[v] ?? String(v)}
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
        {/* <Tooltip formatter={(value, name) => [valueFormatter ? valueFormatter(value, name) : value, VN_LABELS[name as string] ?? name]} labelFormatter={(label) => `Nhóm: ${VN_LABELS[label] ?? label}`} /> */}
        <Tooltip
          formatter={(value, name) => [
            valueFormatter ? valueFormatter(value, name) : value,
            VN_LABELS[name as string] ?? name,
          ]}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              const rec = payload[0].payload as any;
              if (rec.email) {
                return `Nhóm: ${rec.email}`;
              }
            }
            return `Nhóm: ${VN_LABELS[label] ?? label}`;
          }}
        />

        <Legend formatter={(v) => `• ${VN_LABELS[v] ?? v}`} />
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

export function LineChartComponent({
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
  const wrapTick = (maxChars: number) => {
    const Tick = ({
      x = 0,
      y = 0,
      payload,
    }: any): React.ReactElement<SVGElement> => {
      const raw = String(payload?.value ?? "");
      if (!raw) return <></>;

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
        <Tooltip
          formatter={(value, name) => [
            valueFormatter ? valueFormatter(value, name) : value,
            VN_LABELS[name as string] ?? name,
          ]}
          labelFormatter={(label) => `Nhóm: ${VN_LABELS[label] ?? label}`}
        />
        <Legend formatter={(v) => `• ${VN_LABELS[v] ?? v}`} />
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

export function LoadingState() {
  return (
    <div className="h-[200px] flex items-center justify-center text-black">
      Đang tải dữ liệu...
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-red-600">
      {message}
    </div>
  );
}

export const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) => (
  <div className={`shadow rounded-xl p-6 text-center ${color ?? "bg-white"}`}>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-xl font-bold text-black">
      {toNum(value).toLocaleString()}
    </p>
  </div>
);

export const SectionCard = ({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color?: string;
}) => (
  <div>
    <div
      className={`bg-gradient-to-r ${color} text-white px-4 py-2 rounded-t-lg font-semibold`}
    >
      {title}
    </div>
    <div className="bg-white p-4 rounded-b-lg shadow">{children}</div>
  </div>
);
