import React, { useState } from 'react';
import {
  Settings,
  Target,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

export default function TargetSetterAndFeasibility({
  details,
  targetCGPA = 8.50,
  onTargetChange,
  onSaveGoal
}) {
  const [localTarget, setLocalTarget] = useState(targetCGPA);

  const handleSliderChange = (e) => {
    const val = Number(parseFloat(e.target.value).toFixed(2));
    setLocalTarget(val);
    if (onTargetChange) {
      onTargetChange(val);
    }
  };

  const handleSave = () => {
    if (onSaveGoal) {
      onSaveGoal(localTarget);
    }
  };

  if (!details) return null;

  const {
    currentCGPA = 8.14,
    remainingCredits = 64,
    requiredAverage = 8.92,
    isAchievable = true,
    feasibilityStatus = 'Achievable',
    feasibilityBadge = 'Achievable',
    feasibilityBadgeColor = 'emerald',
    feasibilityDescription = '',
    maxPossibleCGPA = 10.0,
    whatIfScenarios = [],
    universityName = 'OU'
  } = details;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Set Your Target CGPA Slider */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-text-h">Set Your Target CGPA</h3>
                <p className="text-[11px] text-text-light">
                  Adjust your desired graduation CGPA and see the required average.
                </p>
              </div>
            </div>
          </div>

          {/* Slider with visual bubble */}
          <div className="pt-6 pb-2 px-1 space-y-3">
            <div className="relative flex justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-accent text-white shadow-accent shadow-sm font-mono">
                {localTarget.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="6.00"
              max="10.00"
              step="0.05"
              value={localTarget}
              onChange={handleSliderChange}
              onMouseUp={handleSave}
              onTouchEnd={handleSave}
              className="w-full accent-accent h-2.5 bg-bg-sec rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-semibold text-text-light font-mono pt-1">
              <span>6.0 (First Class)</span>
              <span className="text-accent font-bold">8.50 (Distinction)</span>
              <span>10.0 (Perfect 10)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-text-light">
          <span>Target auto-saves to your profile</span>
          <button
            type="button"
            onClick={handleSave}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-accent bg-accent/15 hover:bg-accent hover:text-white transition-all"
          >
            Save Target
          </button>
        </div>
      </div>

      {/* 2. Goal Feasibility Card */}
      <div className="col-span-12 lg:col-span-5 xl:col-span-3 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/70">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text-h">Goal Feasibility</h3>
            </div>
          </div>

          <div className="pt-3 space-y-3">
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                feasibilityBadgeColor === 'emerald'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : feasibilityBadgeColor === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : feasibilityBadgeColor === 'purple'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isAchievable ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-extrabold text-xs">
                {feasibilityBadge}
              </span>
            </div>

            <p className="text-[11px] text-text-m leading-relaxed">
              {feasibilityDescription}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center gap-1.5 text-[10px] text-text-light font-mono">
          <Info className="w-3.5 h-3.5 shrink-0 text-text-light" />
          <span>Maximum possible CGPA: {maxPossibleCGPA.toFixed(2)} (as per {universityName} grading scale)</span>
        </div>
      </div>

      {/* 3. What-If Analysis Matrix */}
      <div className="col-span-12 lg:col-span-12 xl:col-span-4 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-text-h">What-If Analysis</h3>
                <p className="text-[11px] text-text-light">
                  See how different future SGPA values affect your final CGPA.
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="pt-2 overflow-hidden rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 text-[10px] font-bold text-text-light uppercase tracking-wider">
                  <th className="pb-1.5 px-2">Next Sem SGPA</th>
                  <th className="pb-1.5 px-2 text-right">Projected CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {whatIfScenarios.map((scen) => {
                  const isHighlighted = Math.abs(scen.assumedSGPA - localTarget) < 0.26;
                  return (
                    <tr
                      key={scen.assumedSGPA}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-accent/20 font-extrabold text-accent'
                          : 'hover:bg-bg-sec/50 text-text-m'
                      }`}
                    >
                      <td className="py-1.5 px-2 font-bold flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHighlighted ? 'bg-accent' : 'bg-text-light'
                          }`}
                        />
                        <span>{scen.assumedSGPA.toFixed(1)}</span>
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right ${
                          isHighlighted ? 'text-accent font-extrabold' : 'text-emerald-400 font-semibold'
                        }`}
                      >
                        {scen.projectedNextCGPA.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
