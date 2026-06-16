import React, { useMemo, useState } from "react";
import { fillChartDays, formatChartDate } from "../utils/chartData";

const RevenueChart = ({ data, days = 7 }) => {
  const [hovered, setHovered] = useState(null);
  const series = useMemo(() => fillChartDays(data, days), [data, days]);

  const total = series.reduce((sum, d) => sum + d.revenue, 0);
  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-14 text-center">
        <p className="text-slate-400 text-sm">No revenue in the last {days} days</p>
        <p className="text-slate-600 text-xs mt-1">Orders will appear here once customers checkout</p>
      </div>
    );
  }

  const w = 640;
  const h = 220;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const max = Math.max(...series.map((d) => d.revenue), 1);

  const yTicks = [0, max / 2, max].map((v) => Math.round(v));

  const points = series.map((d, i) => {
    const x = padL + (i / Math.max(series.length - 1, 1)) * chartW;
    const y = padT + chartH - (d.revenue / max) * chartH;
    return { x, y, ...d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padL},${padT + chartH} ${line} ${padL + chartW},${padT + chartH}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Last {days} days</p>
          <p className="text-2xl font-semibold text-white">₹{total.toLocaleString("en-IN")}</p>
        </div>
        {hovered != null && (
          <div className="text-right text-sm">
            <p className="text-slate-400">{formatChartDate(series[hovered].date)}</p>
            <p className="text-red-400 font-semibold">₹{series[hovered].revenue.toLocaleString("en-IN")}</p>
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" role="img" aria-label="Revenue chart">
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = padT + chartH - (tick / max) * chartH;
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="rgb(51 65 85)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                ₹{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
              </text>
            </g>
          );
        })}

        <polygon fill="url(#revenueFill)" points={area} />
        <polyline
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
          points={line}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g key={p.date}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill={hovered === i ? "#fca5a5" : "#ef4444"}
              stroke="#0f172a"
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            <text
              x={p.x}
              y={h - 10}
              textAnchor="middle"
              className={`text-[9px] ${hovered === i ? "fill-slate-200" : "fill-slate-500"}`}
            >
              {formatChartDate(p.date).split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default RevenueChart;
