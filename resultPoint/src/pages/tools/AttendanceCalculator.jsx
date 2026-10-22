import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Info,
  Home,
  ChevronRight,
  TrendingUp,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { roundAcademic } from '../../services/academicCalculationEngine';
import { useToast } from '../../context/ToastContext';

export default function AttendanceCalculator() {
  const { showToast } = useToast();
  const [attended, setAttended] = useState('42');
  const [total, setTotal] = useState('55');
  const [target, setTarget] = useState('75');

  const handleReset = () => {
    setAttended('42');
    setTotal('55');
    setTarget('75');
    showToast('Reset to default values.');
  };

  const calculation = useMemo(() => {
    const attNum = parseInt(attended, 10);
    const totNum = parseInt(total, 10);
    const tgtNum = parseFloat(target);

    const errors = [];
    if (attended === '' || isNaN(attNum) || attNum < 0) {
      errors.push('Attended classes must be a non-negative whole number.');
    }

    if (total === '' || isNaN(totNum) || totNum <= 0) {
      errors.push('Total conducted classes must be greater than zero.');
    }

    if (!isNaN(attNum) && !isNaN(totNum) && attNum > totNum) {
      errors.push('Attended classes cannot be greater than total conducted classes.');
    }

    if (target === '' || isNaN(tgtNum) || tgtNum <= 0 || tgtNum > 100) {
      errors.push('Target attendance must be between 1% and 100%.');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const currentPercentage = roundAcademic((attNum / totNum) * 100, 2);
    const T = tgtNum / 100;

    let status = 'on-track'; // 'on-track' | 'shortage' | 'critical'
    let classesToAttend = 0;
    let classesCanMiss = 0;
    let narrative = '';

    if (currentPercentage >= tgtNum) {
      status = 'on-track';
      // Max classes you can miss without falling below T
      // attended / (total + y) >= T => y = floor((attended - T * total) / T)
      classesCanMiss = Math.max(0, Math.floor((attNum - T * totNum) / T));
      narrative = classesCanMiss > 0
        ? `You are in the safe zone! You can afford to miss up to ${classesCanMiss} upcoming ${classesCanMiss === 1 ? 'class' : 'classes'} and still maintain ${tgtNum}% attendance.`
        : `You are exactly on target at ${currentPercentage}%. You cannot miss any upcoming classes without falling below ${tgtNum}%.`;
    } else {
      status = currentPercentage < 65 ? 'critical' : 'shortage';
      // Classes to attend consecutively:
      // (attended + x) / (total + x) >= T => x = ceil((T * total - attended) / (1 - T))
      if (T >= 1.0) {
        classesToAttend = Infinity;
        narrative = `Because you have already missed classes, achieving 100% overall attendance is mathematically impossible.`;
      } else {
        const requiredX = (T * totNum - attNum) / (1 - T);
        classesToAttend = Math.max(1, Math.ceil(requiredX));
        narrative = `You currently have an attendance shortage. You need to attend the next ${classesToAttend} consecutive ${classesToAttend === 1 ? 'class' : 'classes'} to reach ${tgtNum}%.`;
      }
    }

    return {
      isValid: true,
      errors: [],
      currentPercentage,
      status,
      classesToAttend,
      classesCanMiss,
      narrative,
      attNum,
      totNum,
      tgtNum,
      missedCount: totNum - attNum
    };
  }, [attended, total, target]);

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
            <li className="font-semibold text-text-h" aria-current="page">Attendance Calculator</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 bg-pink-500/10 border border-pink-500/20 mb-3">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Student Academic Compliance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Attendance & Bunk Calculator
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Check your current lecture attendance percentage and calculate how many classes you must attend or can safely miss to satisfy university requirements.
              </p>
            </div>

            {/* Input Card */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="attended-classes-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Classes Attended
                  </label>
                  <input
                    id="attended-classes-input"
                    type="number"
                    min="0"
                    step="1"
                    value={attended}
                    onChange={(e) => setAttended(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Total lectures you were present for</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="total-classes-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Total Classes Conducted
                  </label>
                  <input
                    id="total-classes-input"
                    type="number"
                    min="1"
                    step="1"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="e.g. 55"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Total lectures held to date</span>
                </div>
              </div>

              {/* Target Threshold Slider & Input */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                <div className="flex items-center justify-between">
                  <label htmlFor="target-attendance-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Required Attendance Target (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="target-attendance-input"
                      type="number"
                      min="50"
                      max="100"
                      step="1"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-bold text-slate-900 dark:text-white text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full accent-pink-500 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>65% (Condonation)</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">75% (Standard Norm)</span>
                  <span>85% (Distinction)</span>
                </div>
              </div>

              {/* Validation errors */}
              {!calculation.isValid && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-0.5">
                  {calculation.errors.map((e, idx) => (
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
                  <span>Reset to 75% Target</span>
                </button>
              </div>
            </div>

            {/* University Statutory Regulations Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] shadow-sm space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent" />
                <span>Attendance Guidelines & Condonation</span>
              </h3>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px] leading-relaxed">
                <li>
                  <strong>75% Mandatory Norm:</strong> Most universities (JNTUH, Osmania, VTU, Mumbai Univ) mandate a minimum 75% aggregate attendance to be eligible for end-semester exams.
                </li>
                <li>
                  <strong>Condonation Range (65% – 74%):</strong> Universities may permit candidates having between 65% and 75% to appear for exams upon medical certificate approval and payment of condonation fee.
                </li>
                <li>
                  <strong>Below 65% (Detention):</strong> Candidates falling below 65% are typically detained from writing semester exams and must repeat the semester.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Attendance Status Card */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-3">
                Attendance Standing
              </h2>

              {calculation.isValid ? (
                <div
                  className={`p-6 rounded-2xl border text-center space-y-3 ${
                    calculation.status === 'on-track'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-100'
                      : calculation.status === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-900 dark:text-rose-100'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-100'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Attendance
                  </span>

                  <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {calculation.currentPercentage.toFixed(1)}%
                  </div>

                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    {calculation.status === 'on-track' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Eligible (Safe Zone)
                      </span>
                    ) : calculation.status === 'critical' ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Critical Shortage (&lt; 65%)
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Shortage (Needs Attention)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pt-2 border-t border-slate-200/50 dark:border-[#222E3C]">
                    {calculation.narrative}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  Enter attended and total classes to calculate your standing.
                </div>
              )}

              {/* Metrics Breakdown */}
              {calculation.isValid && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Missed Classes</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {calculation.missedCount}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Target Required</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {calculation.tgtNum}%
                    </div>
                  </div>
                </div>
              )}

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
