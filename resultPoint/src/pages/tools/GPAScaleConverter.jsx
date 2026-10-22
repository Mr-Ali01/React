import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  ArrowRightLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { roundAcademic } from '../../services/academicCalculationEngine';
import { useToast } from '../../context/ToastContext';

const SCALES = [
  { id: '10', name: '10.0 Scale', max: 10, passing: 4.0, region: 'India (UGC / AICTE / CBCS)' },
  { id: '4', name: '4.0 Scale', max: 4, passing: 2.0, region: 'United States & Canada' },
  { id: '5', name: '5.0 Scale', max: 5, passing: 2.5, region: 'Singapore & UK Institutions' },
  { id: '7', name: '7.0 Scale', max: 7, passing: 4.0, region: 'Australia & New Zealand' }
];

export default function GPAScaleConverter() {
  const { showToast } = useToast();
  const [sourceScaleId, setSourceScaleId] = useState('10');
  const [targetScaleId, setTargetScaleId] = useState('4');
  const [inputValue, setInputValue] = useState('8.40');

  const sourceScale = SCALES.find((s) => s.id === sourceScaleId) || SCALES[0];
  const targetScale = SCALES.find((s) => s.id === targetScaleId) || SCALES[1];

  const handleSwap = () => {
    setSourceScaleId(targetScaleId);
    setTargetScaleId(sourceScaleId);
    // Adjust input value if exceeding new source max
    const newSource = targetScale;
    const currentNum = parseFloat(inputValue);
    if (!isNaN(currentNum) && currentNum > newSource.max) {
      setInputValue(String(newSource.max));
    }
    showToast('Swapped source and target scales.');
  };

  const handleReset = () => {
    setSourceScaleId('10');
    setTargetScaleId('4');
    setInputValue('8.40');
    showToast('Reset to default scales.');
  };

  // Conversion computations
  const result = useMemo(() => {
    const rawVal = parseFloat(inputValue);

    if (inputValue === '' || isNaN(rawVal)) {
      return { isValid: false, error: 'Please enter a valid GPA score.' };
    }

    if (rawVal < 0) {
      return { isValid: false, error: 'GPA cannot be negative.' };
    }

    if (rawVal > sourceScale.max) {
      return {
        isValid: false,
        error: `Value exceeds ${sourceScale.name} maximum (${sourceScale.max}).`
      };
    }

    // Direct Linear Proportional Estimate
    const linearConverted = (rawVal / sourceScale.max) * targetScale.max;
    const roundedLinear = roundAcademic(linearConverted, 2, 'HALF_UP');

    // Percentage of Max
    const percentage = roundAcademic((rawVal / sourceScale.max) * 100, 2);

    // US 4.0 Scale Tier Mapping (if converting to or from 4.0 / 10.0)
    let tierEstimate = null;
    if (sourceScaleId === '10' && targetScaleId === '4') {
      if (rawVal >= 9.0) tierEstimate = '4.00 (Grade A / Outstanding)';
      else if (rawVal >= 8.0) tierEstimate = '3.50 – 3.80 (Grade A / Very Good)';
      else if (rawVal >= 7.0) tierEstimate = '3.00 – 3.49 (Grade B+ / Good)';
      else if (rawVal >= 6.0) tierEstimate = '2.50 – 2.99 (Grade B / Average)';
      else if (rawVal >= 5.0) tierEstimate = '2.00 – 2.49 (Grade C / Passing)';
      else tierEstimate = '< 2.00 (Below Passing)';
    }

    return {
      isValid: true,
      error: null,
      rawVal,
      converted: roundedLinear,
      percentage,
      tierEstimate
    };
  }, [inputValue, sourceScale, targetScale, sourceScaleId, targetScaleId]);

  return (
    <div className="min-h-[80vh] flex flex-col justify-start">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li>
              <Link to="/calculators" className="hover:text-accent transition-colors">Calculators & Tools</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">GPA Scale Converter</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <FileCheck className="w-3.5 h-3.5" />
                <span>International Scale Conversion</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                GPA Scale Converter
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Convert academic GPA scores across Indian 10-point, US 4.0, 5.0, and Australian 7.0 scales using verified proportional formulas and reference standards.
              </p>
            </div>

            {/* Scale Selector Box */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                {/* Source Scale */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="source-scale-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Source Scale
                  </label>
                  <select
                    id="source-scale-select"
                    value={sourceScaleId}
                    onChange={(e) => setSourceScaleId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {SCALES.map((scale) => (
                      <option key={scale.id} value={scale.id}>
                        {scale.name} ({scale.region})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap Button */}
                <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent hover:text-accent bg-slate-50 dark:bg-[#161B22] text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                    title="Swap Source and Target Scales"
                    aria-label="Swap Source and Target Scales"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Scale */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="target-scale-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Target Scale
                  </label>
                  <select
                    id="target-scale-select"
                    value={targetScaleId}
                    onChange={(e) => setTargetScaleId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {SCALES.map((scale) => (
                      <option key={scale.id} value={scale.id}>
                        {scale.name} ({scale.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GPA Input */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                <div className="flex items-center justify-between">
                  <label htmlFor="gpa-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Your {sourceScale.name} Score
                  </label>
                  <span className="text-xs text-slate-400">
                    Range: 0.0 – {sourceScale.max}.0
                  </span>
                </div>
                <input
                  id="gpa-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={sourceScale.max}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`e.g. ${(sourceScale.max * 0.8).toFixed(2)}`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-base font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Error Message */}
              {!result.isValid && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{result.error}</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to 10.0 → 4.0</span>
                </button>
              </div>
            </div>

            {/* Standard Reference Table */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent" />
                <span>Standard Equivalency Matrix</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#222E3C] text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-[#161B22] text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200/80 dark:border-[#222E3C]">
                    <tr>
                      <th className="p-2.5">Performance Grade</th>
                      <th className="p-2.5">10.0 Scale (India)</th>
                      <th className="p-2.5">4.0 Scale (US)</th>
                      <th className="p-2.5">5.0 Scale</th>
                      <th className="p-2.5">7.0 Scale (AU)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#222E3C] text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">Outstanding (O)</td>
                      <td className="p-2.5">9.0 – 10.0</td>
                      <td className="p-2.5">4.00</td>
                      <td className="p-2.5">4.5 – 5.0</td>
                      <td className="p-2.5">6.5 – 7.0</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">Very Good (A+)</td>
                      <td className="p-2.5">8.0 – 8.9</td>
                      <td className="p-2.5">3.50 – 3.80</td>
                      <td className="p-2.5">4.0 – 4.4</td>
                      <td className="p-2.5">5.5 – 6.4</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">Good (A)</td>
                      <td className="p-2.5">7.0 – 7.9</td>
                      <td className="p-2.5">3.00 – 3.49</td>
                      <td className="p-2.5">3.5 – 3.9</td>
                      <td className="p-2.5">4.5 – 5.4</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">Above Average (B+)</td>
                      <td className="p-2.5">6.0 – 6.9</td>
                      <td className="p-2.5">2.50 – 2.99</td>
                      <td className="p-2.5">3.0 – 3.4</td>
                      <td className="p-2.5">3.5 – 4.4</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-amber-600">Pass Threshold</td>
                      <td className="p-2.5">4.0 – 4.9</td>
                      <td className="p-2.5">2.00</td>
                      <td className="p-2.5">2.50</td>
                      <td className="p-2.5">4.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Result Card & Disclaimer */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-3">
                Conversion Result
              </h2>

              {/* Main Converted Output */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border border-emerald-500/20 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estimated {targetScale.name} Value
                </span>
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {result.isValid ? result.converted.toFixed(2) : '—'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {result.isValid ? (
                    <span>
                      out of <strong>{targetScale.max}.0</strong> ({result.percentage.toFixed(1)}% of scale max)
                    </span>
                  ) : (
                    <span className="text-rose-500">Awaiting valid score</span>
                  )}
                </div>
              </div>

              {/* Tier Matrix Estimate if applicable */}
              {result.isValid && result.tierEstimate && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">US WES Evaluation Guideline:</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {result.tierEstimate}
                  </div>
                </div>
              )}

              {/* Conversion Formula */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="font-bold text-slate-800 dark:text-slate-200">Mathematical Formula:</div>
                <code className="text-[11px] block bg-white dark:bg-[#111418] p-2 rounded border border-slate-200 dark:border-[#222E3C] font-mono text-emerald-600 dark:text-emerald-400">
                  Target = (Score / {sourceScale.max}) × {targetScale.max}
                </code>
              </div>

              {/* Important Institutional Disclaimer */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400/90 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Important Equivalency Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This mathematical scale conversion is provided as an informative estimate. Official evaluations for university admissions (such as WES, ECE, or individual foreign admissions committees) assess individual course credits and syllabi rather than using simple proportional scaling.
                </p>
              </div>

              {/* Navigation Links */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  to="/calculators/percentage"
                  className="text-accent hover:underline font-semibold"
                >
                  Percentage Calculator
                </Link>
                <Link
                  to="/calculators"
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  All Tools
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
