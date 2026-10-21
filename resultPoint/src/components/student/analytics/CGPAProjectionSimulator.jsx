import React, { useState } from 'react';
import { Target, Calculator, CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';

export default function CGPAProjectionSimulator({
  overview,
  projections,
  targetCGPA = 8.50,
  onTargetChange
}) {
  const [localTarget, setLocalTarget] = useState(targetCGPA);

  const handleSliderChange = (e) => {
    const val = Number(parseFloat(e.target.value).toFixed(2));
    setLocalTarget(val);
    if (onTargetChange) {
      onTargetChange(val);
    }
  };

  if (!overview) return null;

  const currentCGPA = overview.currentCGPA || 0;
  const remainingCredits = overview.creditsRemaining || 0;
  const completedSemesters = overview.completedSemesters || 0;
  const totalSemesters = overview.totalSemesters || 6;
  const semestersLeft = overview.semestersRemaining || 0;

  const {
    requiredAverage = 0,
    feasibility = 'Achievable',
    feasibilityText = '',
    isAchievable = true,
    whatIfScenarios = [],
    semesterTargets = []
  } = projections || {};

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-h flex items-center gap-2">
              <span>CGPA Projection & What-If Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-bold">
                Interactive
              </span>
            </h3>
            <p className="text-[11px] text-text-light">
              Model required semester averages and test future SGPA scenarios against university rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-light font-medium">Target Graduation CGPA:</span>
          <span className="text-sm font-extrabold text-accent px-2.5 py-0.5 rounded-lg bg-accent/15 border border-accent/30 font-mono">
            {localTarget.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Slider & Feasibility */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Slider Box */}
          <div className="p-4 rounded-xl bg-bg border border-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text-h flex items-center gap-1.5">
                <Target className="w-4 h-4 text-accent" />
                <span>Set Your Target CGPA</span>
              </span>
              <span className="font-mono font-bold text-accent">
                {localTarget.toFixed(2)} / 10.0
              </span>
            </div>

            <p className="text-[11px] text-text-light">
              Adjust your desired graduation CGPA and see the required average across your remaining {remainingCredits} credits.
            </p>

            {/* Slider Track */}
            <div className="pt-2 pb-1">
              <input
                type="range"
                min="6.00"
                max="10.00"
                step="0.05"
                value={localTarget}
                onChange={handleSliderChange}
                className="w-full accent-accent h-2 bg-bg-sec rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-semibold text-text-light mt-1.5 font-mono">
                <span>6.00 (First Class)</span>
                <span className="text-accent font-bold">8.50 (Distinction)</span>
                <span>10.00 (Perfect)</span>
              </div>
            </div>
          </div>

          {/* Feasibility Indicator Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
              isAchievable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isAchievable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-text-h">{feasibility}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-card border border-border">
                  {requiredAverage > 0 ? `Required SGPA: ${requiredAverage.toFixed(2)}` : 'Completed'}
                </span>
              </div>
              <p className="text-text-m leading-relaxed">
                {feasibilityText}
              </p>
            </div>
          </div>

          {/* Recommended Targets per Remaining Semester */}
          {semesterTargets.length > 0 && (
            <div className="p-4 rounded-xl bg-bg border border-border space-y-2.5">
              <h4 className="text-xs font-bold text-text-h flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Recommended Semester Targets</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] font-bold text-text-light uppercase tracking-wider">
                      <th className="pb-2">Semester</th>
                      <th className="pb-2">Est. Credits</th>
                      <th className="pb-2">Target SGPA</th>
                      <th className="pb-2">Projected CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {semesterTargets.map((item) => (
                      <tr key={item.semesterNumber} className="hover:bg-bg-sec/50">
                        <td className="py-2 font-bold text-text-h">{item.semesterLabel}</td>
                        <td className="py-2 text-text-light">{item.remainingCredits} credits</td>
                        <td className="py-2 text-amber-400 font-bold font-mono">≥ {item.targetSGPA.toFixed(2)}</td>
                        <td className="py-2 text-emerald-400 font-extrabold font-mono">{item.projectedCGPA.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: What-If Scenario Matrix */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-bg border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-h flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span>What-If Analysis Matrix</span>
              </h4>
              <span className="text-[10px] font-semibold text-text-light">
                Graduation CGPA
              </span>
            </div>
            <p className="text-[11px] text-text-light">
              See how different future SGPA scenarios change your final degree cumulative CGPA.
            </p>

            {/* Matrix Table */}
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-sec/80 text-[10px] font-bold text-text-light uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Assumed SGPA</th>
                    <th className="px-3 py-2">Next Sem CGPA</th>
                    <th className="px-3 py-2 text-right">Final CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {whatIfScenarios.map((scen) => {
                    const isSelected = Math.abs(scen.assumedSGPA - localTarget) < 0.25;
                    return (
                      <tr
                        key={scen.assumedSGPA}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-accent/15 border-l-2 border-accent font-bold'
                            : 'hover:bg-bg-sec/40'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-text-h flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              scen.assumedSGPA >= 8.5
                                ? 'bg-emerald-400'
                                : scen.assumedSGPA >= 7.5
                                ? 'bg-blue-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span>{scen.assumedSGPA.toFixed(1)}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-text-m">
                          {scen.projectedNextCGPA.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 font-mono text-right font-bold text-accent">
                          {scen.projectedFinalCGPA.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Strategy Tip */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-text-h block">Credit Leverage Strategy</span>
              <p className="text-[11px] text-text-light leading-relaxed">
                Prioritize scoring 9+ grade points in 4-credit core theory courses; they carry double the mathematical weight of 2-credit practical electives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
