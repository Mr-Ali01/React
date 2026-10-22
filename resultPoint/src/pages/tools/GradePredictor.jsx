import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  Target,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Info,
  Home,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { roundAcademic } from '../../services/academicCalculationEngine';
import { useToast } from '../../context/ToastContext';

const PRESET_TARGETS = [
  { id: 'O', name: 'Grade O (Outstanding)', minPct: 85 },
  { id: 'A+', name: 'Grade A+ (Excellent)', minPct: 75 },
  { id: 'A', name: 'Grade A (Very Good)', minPct: 65 },
  { id: 'B+', name: 'Grade B+ (Good)', minPct: 55 },
  { id: 'B', name: 'Grade B (Above Average)', minPct: 50 },
  { id: 'P', name: 'Passing Grade', minPct: 40 }
];

export default function GradePredictor() {
  const { showToast } = useToast();

  // Assessment configurations (fully customizable)
  const [internalObtained, setInternalObtained] = useState('22');
  const [internalMax, setInternalMax] = useState('25');
  const [externalMax, setExternalMax] = useState('75');
  const [externalPassingPct, setExternalPassingPct] = useState('35'); // minimum in external to pass
  const [overallPassingPct, setOverallPassingPct] = useState('40'); // minimum overall (internal+external)
  const [selectedTargetId, setSelectedTargetId] = useState('A+');
  const [customTargetPct, setCustomTargetPct] = useState('');

  const handleReset = () => {
    setInternalObtained('22');
    setInternalMax('25');
    setExternalMax('75');
    setExternalPassingPct('35');
    setOverallPassingPct('40');
    setSelectedTargetId('A+');
    setCustomTargetPct('');
    showToast('Reset to standard assessment defaults.');
  };

  // Prediction calculations
  const prediction = useMemo(() => {
    const intObt = parseFloat(internalObtained);
    const intMax = parseFloat(internalMax);
    const extMax = parseFloat(externalMax);
    const extPassPct = parseFloat(externalPassingPct) || 0;
    const ovrPassPct = parseFloat(overallPassingPct) || 0;

    const errors = [];
    if (internalObtained === '' || isNaN(intObt)) errors.push('Internal marks obtained is required.');
    else if (intObt < 0) errors.push('Internal marks cannot be negative.');

    if (internalMax === '' || isNaN(intMax) || intMax <= 0) errors.push('Maximum internal marks must be > 0.');
    else if (intObt > intMax) errors.push('Internal marks obtained cannot exceed maximum internal marks.');

    if (externalMax === '' || isNaN(extMax) || extMax <= 0) errors.push('Maximum external marks must be > 0.');

    let targetPct = 0;
    if (selectedTargetId === 'custom') {
      const cust = parseFloat(customTargetPct);
      if (customTargetPct === '' || isNaN(cust) || cust < 0 || cust > 100) {
        errors.push('Enter a valid custom target percentage (0 – 100%).');
      } else {
        targetPct = cust;
      }
    } else {
      const preset = PRESET_TARGETS.find((p) => p.id === selectedTargetId);
      targetPct = preset ? preset.minPct : 75;
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const totalMax = intMax + extMax;
    const requiredTotalMarks = roundAcademic((targetPct / 100) * totalMax, 2);
    const minExternalPassingMarks = roundAcademic((extPassPct / 100) * extMax, 2);
    const minOverallTotalMarks = roundAcademic((ovrPassPct / 100) * totalMax, 2);

    // Raw required in external for target
    const rawRequiredExternal = Math.max(0, requiredTotalMarks - intObt);

    // Also enforce external passing minimum if target is passing or higher
    const effectiveRequiredExternal = roundAcademic(
      Math.max(rawRequiredExternal, minExternalPassingMarks),
      2,
      'CEILING'
    );

    const requiredExternalPct = roundAcademic((effectiveRequiredExternal / extMax) * 100, 1);

    // Status classification
    let status = 'achievable'; // 'achieved' | 'achievable' | 'impossible'
    let narrative = '';

    if (intObt >= requiredTotalMarks && intObt >= minOverallTotalMarks && minExternalPassingMarks <= 0) {
      status = 'achieved';
      narrative = `You have already secured enough internal marks (${intObt} / ${totalMax}) to satisfy this target!`;
    } else if (effectiveRequiredExternal > extMax) {
      status = 'impossible';
      const maxPossibleMarks = intObt + extMax;
      const maxPossiblePct = roundAcademic((maxPossibleMarks / totalMax) * 100, 1);
      narrative = `Target requires ${requiredTotalMarks} total marks, but the maximum score you can achieve is ${maxPossibleMarks} (${maxPossiblePct}%).`;
    } else {
      status = 'achievable';
      narrative = `You need ${effectiveRequiredExternal} out of ${extMax} marks (${requiredExternalPct}%) in your final semester examination to achieve this target.`;
    }

    return {
      isValid: true,
      errors: [],
      status,
      narrative,
      intObt,
      intMax,
      extMax,
      totalMax,
      targetPct,
      requiredTotalMarks,
      effectiveRequiredExternal,
      requiredExternalPct,
      minExternalPassingMarks
    };
  }, [
    internalObtained,
    internalMax,
    externalMax,
    externalPassingPct,
    overallPassingPct,
    selectedTargetId,
    customTargetPct
  ]);

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
            <li className="font-semibold text-text-h" aria-current="page">Grade Predictor</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 mb-3">
                <FileSearch className="w-3.5 h-3.5" />
                <span>Final Exam Target Calculator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Semester Grade Predictor
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Determine the exact marks you need in your upcoming end-semester external exam to achieve your desired course grade.
              </p>
            </div>

            {/* Assessment Input Section */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-2">
                1. Internal & External Marks Weighting
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="internal-marks-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Internal Marks Obtained
                  </label>
                  <input
                    id="internal-marks-input"
                    type="number"
                    step="0.5"
                    min="0"
                    max={internalMax}
                    value={internalObtained}
                    onChange={(e) => setInternalObtained(e.target.value)}
                    placeholder="e.g. 22"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Marks secured in midterms / lab / assignments</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="max-internal-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Maximum Internal Marks
                  </label>
                  <input
                    id="max-internal-input"
                    type="number"
                    step="1"
                    min="1"
                    value={internalMax}
                    onChange={(e) => setInternalMax(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Typical: 25 (JNTUH), 30 (OU), 40 (Autonomous)</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="max-external-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Final Exam Maximum Marks
                  </label>
                  <input
                    id="max-external-input"
                    type="number"
                    step="1"
                    min="1"
                    value={externalMax}
                    onChange={(e) => setExternalMax(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Typical: 75 (JNTUH), 70 (OU), 60 (Autonomous)</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="min-external-pass-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    External Passing Criteria (%)
                  </label>
                  <input
                    id="min-external-pass-input"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={externalPassingPct}
                    onChange={(e) => setExternalPassingPct(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Minimum % required in external exam to clear course</span>
                </div>
              </div>
            </div>

            {/* Target Grade Selection */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-2">
                2. Select Target Grade or Percentage
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_TARGETS.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => {
                      setSelectedTargetId(target.id);
                      setCustomTargetPct('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTargetId === target.id
                        ? 'border-accent bg-orange-500/10 text-slate-900 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-[#222E3C] hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{target.name}</div>
                    <div className="text-[11px] text-accent font-semibold mt-0.5">≥ {target.minPct}% total</div>
                  </button>
                ))}
              </div>

              {/* Custom Target Percentage */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTargetId('custom')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                    selectedTargetId === 'custom'
                      ? 'border-accent bg-orange-500/10 text-accent'
                      : 'border-slate-200 dark:border-[#222E3C] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Custom Target %
                </button>
                {selectedTargetId === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={customTargetPct}
                    onChange={(e) => setCustomTargetPct(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-32 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-bold text-slate-900 dark:text-white"
                  />
                )}
              </div>

              {/* Errors */}
              {!prediction.isValid && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-0.5">
                  {prediction.errors.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Prediction Results Card */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-3">
                Final Exam Target
              </h2>

              {prediction.isValid ? (
                <div
                  className={`p-6 rounded-2xl border text-center space-y-3 ${
                    prediction.status === 'impossible'
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-900 dark:text-rose-100'
                      : prediction.status === 'achieved'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-100'
                      : 'bg-gradient-to-br from-blue-500/10 via-orange-500/5 to-transparent border-blue-500/25'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Required External Marks
                  </span>

                  <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {prediction.status === 'impossible' ? (
                      <span className="text-rose-600 dark:text-rose-400 text-3xl font-extrabold flex items-center justify-center gap-2">
                        <XCircle className="w-8 h-8" />
                        Target Unreachable
                      </span>
                    ) : prediction.status === 'achieved' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-3xl font-extrabold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8" />
                        Target Secured!
                      </span>
                    ) : (
                      <span>{prediction.effectiveRequiredExternal}</span>
                    )}
                  </div>

                  {prediction.status === 'achievable' && (
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      out of <strong>{prediction.extMax}</strong> marks ({prediction.requiredExternalPct}%)
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200/50 dark:border-[#222E3C]">
                    {prediction.narrative}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  Enter assessment details on the left to compute target marks.
                </div>
              )}

              {/* Breakdown Metrics */}
              {prediction.isValid && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Target Total Marks</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {prediction.requiredTotalMarks} / {prediction.totalMax}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Min External Pass</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {prediction.minExternalPassingMarks} / {prediction.extMax}
                    </div>
                  </div>
                </div>
              )}

              {/* Important Advisory */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-4 h-4 text-accent shrink-0" />
                  <span>University Regulation Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Grading thresholds and minimum pass criteria are configurable to accommodate your specific university or autonomous college rules. Always confirm exact course rules in your official academic regulation handbook.
                </p>
              </div>

              {/* Navigation Links */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  to="/calculators/target-cgpa"
                  className="text-accent hover:underline font-semibold"
                >
                  Target CGPA Calculator
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
