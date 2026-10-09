import React from 'react';

interface DemographicsChartProps {
  femaleVotes: number;
  maleVotes: number;
  otherVotes?: number;
  ageDistribution: {
    '16-21': number;
    '21-25': number;
    '25-30': number;
    '30-40+': number;
  };
}

export const DemographicsChart: React.FC<DemographicsChartProps> = ({
  femaleVotes,
  maleVotes,
  ageDistribution
}) => {
  const totalGender = femaleVotes + maleVotes;
  const malePct = totalGender > 0 ? Math.round((maleVotes / totalGender) * 100) : 66;
  const femalePct = totalGender > 0 ? 100 - malePct : 34;

  // Max age bracket count to normalize capsule height
  const maxAgeCount = Math.max(
    1,
    ageDistribution['16-21'],
    ageDistribution['21-25'],
    ageDistribution['25-30'],
    ageDistribution['30-40+']
  );

  const ageGroups = [
    { label: '16-21', count: ageDistribution['16-21'] },
    { label: '21-25', count: ageDistribution['21-25'] },
    { label: '25-30', count: ageDistribution['25-30'] },
    { label: '30-40', count: ageDistribution['30-40+'] },
  ];

  return (
    <div className="space-y-7">
      {/* GENDER SECTION (Intersecting Venn bubbles matching Screen 3) */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 tracking-wide mb-3">
          Gender
        </h3>

        <div className="relative flex items-center justify-between px-2">
          {/* Female label & count on left */}
          <div className="flex flex-col items-start z-10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4a6e]" />
              <span>Female</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 ml-4">
              {femaleVotes}
            </span>
          </div>

          {/* Intersecting Venn circles in center */}
          <div className="relative flex flex-col items-center justify-center my-1 w-32 h-36">
            {/* Top Green circle (Male / Majority) */}
            <div className="w-24 h-24 rounded-full bg-[#00b87c] text-white flex items-center justify-center font-extrabold text-lg shadow-sm z-10 -mb-7">
              {malePct}%
            </div>

            {/* Bottom Coral circle (Female / Alternate) overlapping */}
            <div className="w-20 h-20 rounded-full bg-[#ff4a6e] text-white flex items-center justify-center font-extrabold text-sm shadow-sm z-20">
              {femalePct}%
            </div>
          </div>

          {/* Male label & count on right */}
          <div className="flex flex-col items-end z-10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00b87c]" />
              <span>Male</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 mr-4">
              {maleVotes}
            </span>
          </div>
        </div>
      </div>

      {/* AGE SECTION (Capsule bar chart matching Screen 3) */}
      <div className="pt-2">
        <h3 className="text-xs font-bold text-slate-800 tracking-wide mb-4">
          Age
        </h3>

        <div className="relative">
          {/* Y-axis background guidelines */}
          <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pl-8 pr-1">
            {[100, 75, 50, 25].map((level) => (
              <div key={level} className="w-full border-b border-slate-100 flex items-center">
                <span className="text-[10px] font-mono text-slate-400 -ml-8 w-6 text-right">
                  {level}
                </span>
              </div>
            ))}
            <div className="w-full border-b border-slate-200" />
          </div>

          {/* Capsule pillars */}
          <div className="relative pl-8 pr-2 pt-2 pb-1 flex justify-around items-end h-44">
            {ageGroups.map((group) => {
              // Percentage height relative to chart
              const heightPct = Math.max(16, Math.min(100, Math.round((group.count / maxAgeCount) * 90)));
              return (
                <div key={group.label} className="flex flex-col items-center gap-2 group">
                  {/* Full track background capsule */}
                  <div className="w-6 h-36 bg-[#f4f7f5] rounded-full relative flex items-end p-0.5">
                    {/* Filled active pillar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-[#00b87c] rounded-full transition-all duration-500 group-hover:bg-emerald-400 relative"
                    >
                      {/* Tooltip on hover */}
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none transition-opacity">
                        {group.count}
                      </span>
                    </div>
                  </div>
                  {/* X-axis label */}
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                    {group.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-right text-[10px] text-slate-400 font-medium pr-2 -mt-1">
            years
          </div>
        </div>
      </div>

      {/* Pagination dots matching mockup bottom */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
      </div>
    </div>
  );
};
