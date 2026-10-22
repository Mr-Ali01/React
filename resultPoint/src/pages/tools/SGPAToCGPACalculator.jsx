import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
  Calculator,
  Share2
} from 'lucide-react';
import { roundAcademic } from '../../services/academicCalculationEngine';
import { useToast } from '../../context/ToastContext';

const DEFAULT_SEMESTERS = [
  { id: '1', name: 'Semester 1', sgpa: '8.20', credits: '20' },
  { id: '2', name: 'Semester 2', sgpa: '8.50', credits: '22' },
  { id: '3', name: 'Semester 3', sgpa: '7.80', credits: '21' },
  { id: '4', name: 'Semester 4', sgpa: '8.10', credits: '21' }
];

export default function SGPAToCGPACalculator() {
  const { showToast } = useToast();
  const [method, setMethod] = useState('weighted'); // 'weighted' | 'equal'
  const [semesters, setSemesters] = useState(DEFAULT_SEMESTERS);

  const addSemester = () => {
    if (semesters.length >= 12) {
      showToast('Maximum 12 semesters allowed.');
      return;
    }
    const nextIdx = semesters.length + 1;
    setSemesters([
      ...semesters,
      { id: String(Date.now()), name: `Semester ${nextIdx}`, sgpa: '', credits: '20' }
    ]);
  };

  const removeSemester = (id) => {
    if (semesters.length <= 1) {
      showToast('At least one semester is required.');
      return;
    }
    setSemesters(semesters.filter((s) => s.id !== id));
  };

  const updateSemester = (id, field, value) => {
    setSemesters(
      semesters.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const resetAll = () => {
    setSemesters(DEFAULT_SEMESTERS);
    setMethod('weighted');
    showToast('Reset to default values.');
  };

  // Calculation computation & validation
  const calculation = useMemo(() => {
    const errors = [];
    let totalCredits = 0;
    let totalCreditPoints = 0;
    let totalSgpaSum = 0;
    let validCount = 0;

    const rowDetails = semesters.map((sem, idx) => {
      const sgpaNum = parseFloat(sem.sgpa);
      const creditsNum = parseFloat(sem.credits);

      let rowError = null;
      if (sem.sgpa === '' || isNaN(sgpaNum)) {
        rowError = 'SGPA is required';
      } else if (sgpaNum < 0 || sgpaNum > 10) {
        rowError = 'SGPA must be 0 – 10';
      }

      if (method === 'weighted') {
        if (sem.credits === '' || isNaN(creditsNum)) {
          rowError = rowError || 'Credits required';
        } else if (creditsNum <= 0) {
          rowError = rowError || 'Credits must be > 0';
        }
      }

      if (rowError) {
        errors.push(`${sem.name || `Semester ${idx + 1}`}: ${rowError}`);
      } else {
        validCount++;
        const pts = sgpaNum * (method === 'weighted' ? creditsNum : 1);
        totalCreditPoints += pts;
        totalCredits += method === 'weighted' ? creditsNum : 1;
        totalSgpaSum += sgpaNum;
      }

      return {
        ...sem,
        sgpaNum,
        creditsNum,
        creditPoints: (!rowError && method === 'weighted') ? roundAcademic(sgpaNum * creditsNum, 2) : null,
        isValid: !rowError,
        error: rowError
      };
    });

    let cgpa = 0;
    if (validCount > 0 && errors.length === 0) {
      if (method === 'weighted') {
        if (totalCredits > 0) {
          cgpa = roundAcademic(totalCreditPoints / totalCredits, 2, 'HALF_UP');
        }
      } else {
        cgpa = roundAcademic(totalSgpaSum / validCount, 2, 'HALF_UP');
      }
    }

    const percentage = cgpa > 0 ? roundAcademic(cgpa * 10, 2) : 0;

    return {
      isValid: errors.length === 0 && validCount === semesters.length,
      errors,
      cgpa,
      percentage,
      totalCredits,
      totalCreditPoints: roundAcademic(totalCreditPoints, 2),
      rowDetails,
      validCount
    };
  }, [semesters, method]);

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
            <li className="font-semibold text-text-h" aria-current="page">SGPA to CGPA Calculator</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Calculator Form */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 mb-3">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Converters & Cumulative GPA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                SGPA to CGPA Calculator
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Convert and aggregate your individual semester grade point averages (SGPA) into your official cumulative grade point average (CGPA).
              </p>
            </div>

            {/* Calculation Method Selector */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Calculation Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('weighted')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    method === 'weighted'
                      ? 'border-accent bg-orange-500/5 dark:bg-orange-500/10 text-slate-900 dark:text-white shadow-sm'
                      : 'border-slate-200 dark:border-[#222E3C] hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Credit-Weighted CGPA</span>
                    {method === 'weighted' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Standard university rule: weights each semester by total earned credits.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('equal')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    method === 'equal'
                      ? 'border-accent bg-orange-500/5 dark:bg-orange-500/10 text-slate-900 dark:text-white shadow-sm'
                      : 'border-slate-200 dark:border-[#222E3C] hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Simple Unweighted Average</span>
                    {method === 'equal' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Equal-weight average. Quick estimate when semester credits are unknown.
                  </p>
                </button>
              </div>

              {method === 'equal' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Disclaimer:</strong> Simple average treats all semesters equally. Most universities (including JNTUH, Osmania, VTU, and Anna University) require credit weighting.
                  </span>
                </div>
              )}
            </div>

            {/* Semester Inputs Table */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E2A35]">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Semester Details</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {semesters.length} {semesters.length === 1 ? 'Semester' : 'Semesters'}
                </span>
              </div>

              <div className="space-y-3">
                {semesters.map((sem, idx) => (
                  <div
                    key={sem.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]"
                  >
                    <div className="w-full sm:w-1/3">
                      <input
                        type="text"
                        value={sem.name}
                        onChange={(e) => updateSemester(sem.id, 'name', e.target.value)}
                        placeholder={`Semester ${idx + 1}`}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="w-full sm:w-1/3">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        SGPA (0 – 10)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={sem.sgpa}
                        onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                        placeholder="e.g. 8.45"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    {method === 'weighted' && (
                      <div className="w-full sm:w-1/3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                          Credits
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="50"
                          value={sem.credits}
                          onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                          placeholder="e.g. 21"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeSemester(sem.id)}
                      disabled={semesters.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:pointer-events-none transition-colors self-end sm:self-center mt-1 sm:mt-0"
                      title="Remove Semester"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addSemester}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-[#222E3C] hover:border-accent text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-accent transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Semester</span>
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              </div>

              {/* Error messages if any */}
              {calculation.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Please correct the following:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                    {calculation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calculated Results & Details */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-3">
                Calculated CGPA Result
              </h2>

              {/* CGPA Display */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-orange-500/5 to-transparent border border-purple-500/20 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cumulative Grade Point Average
                </span>
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {calculation.isValid ? calculation.cgpa.toFixed(2) : '—'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {calculation.isValid ? (
                    <span>
                      Equivalent Percentage: <strong className="text-accent">{calculation.percentage.toFixed(2)}%</strong> (approx)
                    </span>
                  ) : (
                    <span className="text-rose-500">Enter valid SGPA values</span>
                  )}
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total Semesters</div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {calculation.validCount} / {semesters.length}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {method === 'weighted' ? 'Total Credits' : 'Calculation Mode'}
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {method === 'weighted' ? calculation.totalCredits : 'Equal Weight'}
                  </div>
                </div>
              </div>

              {/* Semester Breakdown Table */}
              {calculation.isValid && method === 'weighted' && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Credit Weight Contribution
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-[#222E3C] text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-[#161B22] text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200/80 dark:border-[#222E3C]">
                        <tr>
                          <th className="p-2">Semester</th>
                          <th className="p-2">SGPA</th>
                          <th className="p-2">Credits</th>
                          <th className="p-2 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#222E3C]">
                        {calculation.rowDetails.map((row) => (
                          <tr key={row.id}>
                            <td className="p-2 font-medium">{row.name}</td>
                            <td className="p-2">{row.sgpaNum.toFixed(2)}</td>
                            <td className="p-2">{row.creditsNum}</td>
                            <td className="p-2 text-right font-semibold">{row.creditPoints?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Formula & Reference Note */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="font-bold text-slate-800 dark:text-slate-200">Applied Formula:</div>
                <code className="text-[11px] block bg-white dark:bg-[#111418] p-2 rounded border border-slate-200 dark:border-[#222E3C] font-mono text-purple-600 dark:text-purple-400">
                  {method === 'weighted'
                    ? 'CGPA = Σ(SGPA × Credits) / Σ(Credits)'
                    : 'CGPA = Σ(SGPA) / Number of Semesters'}
                </code>
              </div>

              {/* Navigation Links */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  to="/calculators/cgpa"
                  className="text-accent hover:underline font-semibold flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Subject-Level CGPA Calculator</span>
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
