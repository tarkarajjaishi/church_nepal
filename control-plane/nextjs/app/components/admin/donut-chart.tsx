"use client";

interface DonutChartProps {
  data: { label: string; value: number }[];
}

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

export default function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted text-sm">No data available</p>
      </div>
    );
  }

  let cumulativePercent = 0;

  const segments = data.map((d, i) => {
    const percent = d.value / total;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const outerR = 40;
    const x1 = 50 + outerR * Math.cos(startRad);
    const y1 = 50 + outerR * Math.sin(startRad);
    const x2 = 50 + outerR * Math.cos(endRad);
    const y2 = 50 + outerR * Math.sin(endRad);

    const largeArc = percent > 0.5 ? 1 : 0;

    const path =
      data.length === 1
        ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
        : `M 50 50 L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      path,
      color: COLORS[i % COLORS.length],
      label: d.label,
      value: d.value,
      percent: Math.round(percent * 100),
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-48 h-48">
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} stroke="var(--card, #fff)" strokeWidth="0.5" />
        ))}
        <circle cx="50" cy="50" r="24" className="fill-card" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-text-strong text-[8px] font-bold"
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-muted">{seg.label}</span>
            <span className="font-medium">
              {seg.value} ({seg.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
