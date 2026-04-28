"use client";

import { ScoreBreakdown } from "@/lib/types";

type Props = {
  score: number;
  breakdown?: ScoreBreakdown;
  locale?: "it" | "en";
};

export default function ScoreGauge({ score, breakdown, locale = "en" }: Props) {
  const isIt = locale === "it";
  const radius = 80;
  const stroke = 16;
  const circumference = Math.PI * radius;           // half-circle arc length
  const filled = (score / 100) * circumference;
  const color = score >= 70 ? "#2dd4bf" : score >= 45 ? "#fbbf24" : "#fb7185";
  const label = score >= 70 ? (isIt ? "Buono" : "Good") : score >= 45 ? (isIt ? "Moderato" : "Moderate") : (isIt ? "Critico" : "Critical");
  const title = isIt ? "GEO Score Complessivo" : "Overall GEO Score";

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        {title}
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* SVG half-circle gauge */}
        <div className="relative flex items-end justify-center shrink-0">
          <svg width="200" height="112" viewBox="0 0 200 112" aria-label={`${title}: ${score}/100`}>
            {/* Background arc */}
            <path
              d={`M 10 100 A ${radius} ${radius} 0 0 1 190 100`}
              fill="none"
              stroke="rgba(71, 85, 105, 0.5)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d={`M 10 100 A ${radius} ${radius} 0 0 1 190 100`}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              style={{ transition: "stroke-dasharray 1s ease-out" }}
            />
          </svg>
          {/* Score overlay */}
          <div className="absolute bottom-1 text-center pointer-events-none">
            <p className="text-4xl font-bold leading-none" style={{ color }}>{score}</p>
            <p className="text-xs text-slate-400 mt-0.5">/100 · {label}</p>
          </div>
        </div>

        {/* Category breakdown bars */}
        {breakdown && (
          <div className="flex-1 w-full space-y-2.5">
            {Object.entries(breakdown).map(([cat, { score: s, weight }]) => {
              const barColor = s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";
              return (
                <div key={cat}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-300 truncate max-w-[60%]">{cat}</span>
                    <span className="text-xs text-slate-300/90 shrink-0">
                      {s}<span className="text-slate-500">/100</span>
                      <span className="ml-1 text-slate-500 text-[10px]">({weight})</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
