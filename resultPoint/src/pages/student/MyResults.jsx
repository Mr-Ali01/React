import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  ChevronDown,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Award,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Percent
} from 'lucide-react';
import { resultService } from '../../services/resultService';
import { studentService } from '../../services/studentService';
import ResultStatusBadge from '../../components/student/ResultStatusBadge';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectResults,
  fetchResults,
  deleteSemesterResult,
} from '../../features/results/resultsSlice';
import {
  selectAcademicProfile,
  selectIsProfileComplete,
  fetchAcademicProfile,
} from '../../features/academicProfile/academicProfileSlice';
import { selectDecimalPrecision } from '../../features/settings/settingsSlice';

export default function MyResults() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const reduxResults = useAppSelector(selectResults);
  const reduxProfile = useAppSelector(selectAcademicProfile);
  const decimalPrecision = useAppSelector(selectDecimalPrecision);

  const isProfileComplete = Boolean(
    useAppSelector(selectIsProfileComplete) || studentService.isProfileComplete()
  );

  // Sync fresh results and profile from store and storage events
  useEffect(() => {
    dispatch(fetchAcademicProfile());
    if (isProfileComplete) {
      dispatch(fetchResults());
    }

    const handleSync = () => {
      dispatch(fetchAcademicProfile());
      if (isProfileComplete) {
        dispatch(fetchResults());
      }
    };

    window.addEventListener('results_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('results_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [dispatch, isProfileComplete]);

  const profile = useMemo(() => ({
    ...studentService.getProfile(),
    ...(reduxProfile || {}),
  }), [reduxProfile]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');

  // Load results from Redux or data-access layer fallback
  const results = Array.isArray(reduxResults) ? reduxResults : resultService.getAllResults();

  // Calculate real-time academic summaries (SGPA, CGPA, GPA, percentage, overall grade)
  const summary = useMemo(() => {
    return studentService.getAcademicSummary(profile, results);
  }, [profile, results]);

  // Modal state for Delete
  const [deletingResult, setDeletingResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter & Sort Logic
  const filteredAndSortedResults = useMemo(() => {
    let list = [...results];

    // 1. Text Search Filter (Semester, Period, Status, Label)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const semNum = String(item.semesterNumber);
        const semLabel = (item.semesterLabel || item.semesterTitle || '').toLowerCase();
        const period = (item.academicPeriod || '').toLowerCase();
        const status = (item.status || '').toLowerCase();
        return (
          semNum.includes(q) ||
          semLabel.includes(q) ||
          period.includes(q) ||
          status.includes(q)
        );
      });
    }

    // 2. Semester Dropdown Filter
    if (semesterFilter !== 'ALL') {
      const semNumber = Number(semesterFilter);
      list = list.filter((item) => item.semesterNumber === semNumber);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'LATEST') return b.semesterNumber - a.semesterNumber;
      if (sortBy === 'OLDEST') return a.semesterNumber - b.semesterNumber;
      if (sortBy === 'HIGHEST_SGPA') return b.sgpa - a.sgpa;
      if (sortBy === 'LOWEST_SGPA') return a.sgpa - b.sgpa;
      return 0;
    });

    return list;
  }, [results, searchQuery, semesterFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSemesterFilter('ALL');
    setSortBy('LATEST');
  };

  // Confirm delete from Delete Dialog
  const handleConfirmDelete = async () => {
    if (!deletingResult) return;
    const title = deletingResult.semesterLabel || deletingResult.semesterTitle || 'Semester result';
    setIsProcessing(true);
    try {
      await dispatch(deleteSemesterResult(deletingResult.id)).unwrap();
      showToast(`${title} deleted from records.`);
      setDeletingResult(null);
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to delete result', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before viewing your semester results and grade scorecards, please complete your Academic Profile Setup to link your course curriculum and grading system."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
      {/* 5. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Orange-accented icon badge, title & description */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-orange-500 shadow-xs shrink-0">
            <FileText className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Results
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              View, edit, and manage all your saved semester results.
            </p>
          </div>
        </div>

        {/* Course & Regulation Badge */}
        {profile.course && (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            {profile.course} • {profile.regulation || 'Regulation'}
          </div>
        )}
      </div>

      {/* Dynamic Academic Summary Cards (CGPA, SGPA/GPA, Converted Percentage, Overall Grade, Degree Credits) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Cumulative CGPA */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Cumulative CGPA
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.currentCGPA}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ 10.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 truncate">
              {summary.performanceBadge}
            </span>
          </div>
        </div>

        {/* Card 2: Term SGPA / GPA */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Latest SGPA / GPA
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {summary.latestSGPA}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">SGPA</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {summary.diffText}
          </div>
        </div>

        {/* Card 3: Converted Percentage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Percentage
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {summary.percentage}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate" title={summary.formulaDescription}>
            {summary.percentageFormula}
          </div>
        </div>

        {/* Card 4: Overall Grade */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Overall Grade
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-accent">
              {summary.overallGrade}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent truncate">
              {summary.overallGradeDesc}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            University Grading Rule
          </div>
        </div>

        {/* Card 5: Degree Credits & Completion */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] shadow-xs relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Degree Credits
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.totalCredits}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ {summary.degreeCredits}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {summary.semestersCompleted} of {summary.totalSemesters} Semesters
          </div>
        </div>
      </div>

      {/* 6. Main Results Card */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-6 shadow-xs">
        {/* Toolbar: Search, Filters & Primary Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 mb-6">
          {/* Filter Controls Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Field */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search semester results..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
              />
            </div>

            {/* Semester Filter Dropdown */}
            <div className="relative">
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="ALL">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="LATEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="HIGHEST_SGPA">Highest SGPA</option>
                <option value="LOWEST_SGPA">Lowest SGPA</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Primary Action Button: + Add Result */}
          <Link
            to="/student/add-result"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all self-stretch sm:self-auto shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Result</span>
          </Link>
        </div>

        {/* 7. Semester Results Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[680px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1E2A35] text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4 font-semibold">Semester</th>
                <th className="py-3 px-4 font-semibold">Academic Period</th>
                <th className="py-3 px-4 font-semibold">Subjects</th>
                <th className="py-3 px-4 font-semibold">Credits</th>
                <th className="py-3 px-4 font-semibold">SGPA / CGPA</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/60 text-xs sm:text-sm">
              {filteredAndSortedResults.length > 0 ? (
                filteredAndSortedResults.map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-[#15202D]/40 transition-colors"
                  >
                    {/* 1. Semester */}
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {result.semesterLabel || `Semester ${result.semesterNumber}`}
                    </td>

                    {/* 2. Academic Period */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {result.academicPeriod}
                    </td>

                    {/* 3. Subjects */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {result.subjectCount}
                    </td>

                    {/* 4. Credits */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {result.totalCredits}
                    </td>

                    {/* 5. SGPA & Progressive CGPA */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#16A34A] dark:text-[#22C55E]">
                        {Number(result.sgpa).toFixed(decimalPrecision || 2)} <span className="text-[10px] font-semibold text-slate-400">SGPA</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        CGPA: <strong className="text-slate-700 dark:text-slate-200">{Number(result.cgpa || result.sgpa).toFixed(decimalPrecision || 2)}</strong>
                      </div>
                    </td>

                    {/* 6. Status Badge */}
                    <td className="py-4 px-4">
                      <ResultStatusBadge
                        status={result.status}
                        semesterNumber={result.semesterNumber}
                      />
                    </td>

                    {/* 7. Action Column: 3 Buttons (View, Edit, Delete) */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        {/* 1. View Button */}
                        <Link
                          to={`/student/results/${result.id}`}
                          title="View semester details"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFE4E6] hover:bg-[#FECDD3] dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-[#F43F5E] dark:text-rose-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>

                        {/* 2. Edit Button - Navigates to AddResult in edit mode */}
                        <Link
                          to={`/student/edit-result/${result.id}`}
                          title="Edit semester result"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>

                        {/* 3. Delete Button */}
                        <button
                          onClick={() => setDeletingResult(result)}
                          title="Delete semester result"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty search state */
                <tr>
                  <td colSpan="7" className="py-12 px-4 text-center">
                    <div className="max-w-xs mx-auto space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        No results found
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Try adjusting your search or semester filter.
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors mt-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Semester Result?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to delete{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {deletingResult.semesterLabel || deletingResult.semesterTitle} (
                    {deletingResult.academicPeriod})
                  </strong>
                  ? This record and its subject scores will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Deleting...' : 'Delete Result'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AcademicProfileGate>
  );
}
