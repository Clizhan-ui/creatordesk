'use client';

import React, { useState } from 'react';

interface TrendPoint {
  date: string;
  views: number;
  engagement: number;
}

interface PlatformData {
  platform: string;
  count: number;
  views?: number;
}

export function TrendAreaChart({ data }: { data: TrendPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <span>Belum ada data performa tercatat.</span>
        <span className="text-[11px] text-slate-400 mt-1">Catat analitik konten untuk melihat grafik pertumbuhan.</span>
      </div>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views), 10);
  const maxEngagement = Math.max(...data.map((d) => d.engagement), 5);
  const maxVal = Math.max(maxViews, maxEngagement * 1.5);

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const yViews = padding.top + chartHeight - (d.views / maxVal) * chartHeight;
    const yEng = padding.top + chartHeight - (d.engagement / maxVal) * chartHeight;
    return { x, yViews, yEng, ...d };
  });

  const viewsPath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yViews}`, '');
  const viewsArea = `${viewsPath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const engPath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yEng}`, '');
  const engArea = `${engPath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="flex items-center justify-end space-x-4 mb-2 text-xs font-medium">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
          <span className="text-slate-600">Views</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-pink-500 inline-block"></span>
          <span className="text-slate-600">Engagement</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = padding.top + chartHeight * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Filled Areas */}
        <path d={viewsArea} fill="url(#viewsGradient)" />
        <path d={engArea} fill="url(#engGradient)" />

        {/* Stroke lines */}
        <path d={viewsPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={engPath} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & Hover interactions */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.yViews} r={hoveredIdx === i ? 5 : 3.5} fill="#6366f1" className="transition-all" />
            <circle cx={p.x} cy={p.yEng} r={hoveredIdx === i ? 4.5 : 3} fill="#ec4899" className="transition-all" />
            {/* X-axis label */}
            <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {p.date.slice(5)}
            </text>
            {/* Transparent hover capture rect */}
            <rect
              x={p.x - 15}
              y={padding.top}
              width="30"
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          </g>
        ))}
      </svg>

      {/* Floating tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute pointer-events-none bg-slate-900/90 text-white text-[11px] px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm z-20 border border-slate-700/50"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-slate-300 mb-1">{points[hoveredIdx].date}</div>
          <div className="text-indigo-300 font-bold">Views: {points[hoveredIdx].views.toLocaleString()}</div>
          <div className="text-pink-300 font-bold">Engagement: {points[hoveredIdx].engagement.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

export function PlatformBarChart({ 
  data, 
  metric = 'count' 
}: { 
  data: PlatformData[]; 
  metric?: 'count' | 'views';
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <span>Belum ada data tercatat.</span>
      </div>
    );
  }

  const isViews = metric === 'views';
  const getVal = (d: PlatformData) => (isViews ? (Number(d.views) || 0) : (Number(d.count) || 0));
  const maxVal = Math.max(...data.map(getVal), 1);
  const totalVal = data.reduce((acc, d) => acc + getVal(d), 0);

  const getPlatformColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'youtube':
        return 'bg-red-500';
      case 'tiktok':
        return 'bg-slate-900';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default:
        return 'bg-indigo-500';
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {data.map((item, idx) => {
        const val = getVal(item);
        const pct = totalVal > 0 ? Math.round((val / totalVal) * 100) : 0;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">{item.platform}</span>
              <span className="text-slate-500 text-[11px] font-medium">
                {isViews ? `${val.toLocaleString()} tayangan (${pct}%)` : `${val} konten (${pct}%)`}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPlatformColor(item.platform)}`}
                style={{ width: `${Math.max(totalVal > 0 ? (val / maxVal) * 100 : 0, 5)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
