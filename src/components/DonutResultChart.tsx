import React from 'react';
import { Flame, Trophy, Award } from 'lucide-react';

interface DonutResultChartProps {
  labelA: string;
  votesA: number;
  labelB: string;
  votesB: number;
  colorScheme?: 'green-pink' | 'green-yellow';
  centerDisplay?: 'percentage' | 'winner-letter';
  winnerLetter?: 'A' | 'B';
  size?: number;
}

export const DonutResultChart: React.FC<DonutResultChartProps> = ({
  labelA,
  votesA,
  labelB,
  votesB,
  colorScheme = 'green-pink',
  centerDisplay = 'percentage',
  winnerLetter,
  size = 180
}) => {
  const total = votesA + votesB;
  const pctA = total > 0 ? (votesA / total) * 100 : 50;
  const pctB = total > 0 ? (votesB / total) * 100 : 50;

  // Leading candidate
  const isBLeading = votesB >= votesA;
  const leadPct = Math.round(isBLeading ? pctB : pctA);
  const resolvedLetter = winnerLetter || (isBLeading ? 'B' : 'A');

  // Palette from reference image:
  // Green: #00b87c, Pink/Coral: #ff4a6e, Warm Yellow: #f59e0b
  const colorA = colorScheme === 'green-pink' ? '#ff4a6e' : '#00b87c'; // pink or green
  const colorB = colorScheme === 'green-pink' ? '#00b87c' : '#f59e0b'; // green or warm yellow

  // SVG parameters
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Gap between arcs
  const gap = total > 0 ? 8 : 0;
  const arcLengthA = Math.max(0, (circumference * (pctA / 100)) - gap);
  const arcLengthB = Math.max(0, (circumference * (pctB / 100)) - gap);

  // Rotation offset so it splits smoothly like the reference
  const strokeDashoffsetA = 0;
  const strokeDashoffsetB = -(circumference * (pctA / 100));

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size + 110, height: size }}>
        {/* Left count indicator with dot */}
        <div className="absolute left-0 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: colorA }}
            />
            <span className="truncate max-w-[70px]">{labelA}</span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
            {votesA}
          </span>
        </div>

        {/* Center circular SVG Donut */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f3"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Segment A */}
            {total > 0 && pctA > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colorA}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${arcLengthA} ${circumference}`}
                strokeDashoffset={strokeDashoffsetA}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Segment B */}
            {total > 0 && pctB > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colorB}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${arcLengthB} ${circumference}`}
                strokeDashoffset={strokeDashoffsetB}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Donut Center Icon & Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {centerDisplay === 'winner-letter' ? (
              <>
                <span
                  className="text-lg font-black tracking-tight"
                  style={{ color: isBLeading ? colorB : colorA }}
                >
                  {resolvedLetter}
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {total > 0 ? `${leadPct}%` : '0%'}
                </span>
              </>
            ) : (
              <>
                <div className="text-emerald-500 mb-0.5">
                  <Flame className="w-5 h-5 fill-emerald-500 text-emerald-500 animate-pulse" />
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {total > 0 ? `${leadPct}%` : '0%'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right count indicator with dot */}
        <div className="absolute right-0 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: colorB }}
            />
            <span className="truncate max-w-[70px]">{labelB}</span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
            {votesB}
          </span>
        </div>
      </div>
    </div>
  );
};
