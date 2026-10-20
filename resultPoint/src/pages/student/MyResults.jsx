import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  ChevronDown,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { resultService, DEMO_STUDENT_RESULTS } from '../../services/resultService';
import ResultStatusBadge from '../../components/student/ResultStatusBadge';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';

/**
 * Standard Demo Results definition (prepared for future API swap)
 */
export const demoResults = DEMO_STUDENT_RESULTS.map((r) => ({
  id: r.id,
  semesterNumber: r.semesterNumber,
  semesterLabel: r.semesterLabel || `Semester ${r.semesterNumber}`,
  semesterTitle: r.semesterTitle || r.semesterLabel || `Semester ${r.semesterNumber}`,
  academicPeriod: r.academicPeriod,
  subjectCount: r.subjectCount || (r.subjects ? r.subjects.length : 6),
  totalCredits: r.totalCredits || r.creditsEarned || 21,
  creditsEarned: r.creditsEarned || r.totalCredits || 21,
  sgpa: Number(r.sgpa) || 0,
  cgpa: Number(r.cgpa || r.sgpa) || 0,
  status: r.status || 'Good',
  subjects: r.subjects || []
}));

/**
 * Data-access function - bridges to resultService or backend API
 */
export function getStudentResults() {
  if (typeof resultService !== 'undefined' && resultService.getStudentResults) {
    return resultService.getStudentResults();
  }
  return demoResults;
}

export default function MyResults() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');

  // Load results from data-access layer
  const [results, setResults] = useState(() => getStudentResults());

  // Modal states for Edit and Delete
  const [editingResult, setEditingResult] = useState(null);
  const [deletingResult, setDeletingResult] = useState(null);

  // Dynamic Date Display matching the reference image ("Sunday, 04 Oct 2026")
  const currentDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return 'Sunday, 04 Oct 2026';
    }
  }, []);

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

  // Save changes from Edit Modal
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingResult) return;

    const updated = {
      semesterTitle: editingResult.semesterTitle || editingResult.semesterLabel,
      semesterLabel: editingResult.semesterLabel || editingResult.semesterTitle,
      academicPeriod: editingResult.academicPeriod,
      sgpa: Number(editingResult.sgpa) || 0,
      cgpa: Number(editingResult.cgpa || editingResult.sgpa) || 0,
      creditsEarned: Number(editingResult.creditsEarned) || 20,
      totalCredits: Number(editingResult.totalCredits) || 20,
      status: editingResult.status
    };

    resultService.updateResult(editingResult.id, updated);
    setResults(getStudentResults());
    showToast(`${updated.semesterLabel} updated successfully!`);
    setEditingResult(null);
  };

  // Confirm delete from Delete Dialog
  const handleConfirmDelete = () => {
    if (!deletingResult) return;
    const title = deletingResult.semesterLabel || deletingResult.semesterTitle || 'Semester result';
    resultService.deleteResult(deletingResult.id);
    setResults(getStudentResults());
    showToast(`${title} deleted from records.`);
    setDeletingResult(null);
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

        {/* Right Side: Current Date Display */}
        <div className="text-xs sm:text-[13px] font-medium text-slate-400 dark:text-slate-500 self-start sm:self-center">
          {currentDate}
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
                <th className="py-3 px-4 font-semibold">SGPA</th>
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

                    {/* 5. SGPA */}
                    <td className="py-4 px-4 font-bold text-[#16A34A] dark:text-[#22C55E]">
                      {Number(result.sgpa).toFixed(2)}
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

                        {/* 2. Edit Button */}
                        <button
                          onClick={() => setEditingResult({ ...result })}
                          title="Edit semester result"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

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

      {/* ================= EDIT SEMESTER MODAL ================= */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Semester Result
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Update score and performance details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingResult(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester Title
                  </label>
                  <input
                    type="text"
                    value={editingResult.semesterLabel || editingResult.semesterTitle || ''}
                    onChange={(e) =>
                      setEditingResult({
                        ...editingResult,
                        semesterLabel: e.target.value,
                        semesterTitle: e.target.value
                      })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Period
                  </label>
                  <input
                    type="text"
                    value={editingResult.academicPeriod || ''}
                    onChange={(e) =>
                      setEditingResult({ ...editingResult, academicPeriod: e.target.value })
                    }
                    required
                    placeholder="e.g. Sep 2026"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editingResult.sgpa || ''}
                    onChange={(e) =>
                      setEditingResult({ ...editingResult, sgpa: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editingResult.cgpa || editingResult.sgpa || ''}
                    onChange={(e) =>
                      setEditingResult({ ...editingResult, cgpa: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold text-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credits Earned
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editingResult.creditsEarned || editingResult.totalCredits || ''}
                    onChange={(e) =>
                      setEditingResult({ ...editingResult, creditsEarned: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Subject Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editingResult.totalCredits || ''}
                    onChange={(e) =>
                      setEditingResult({ ...editingResult, totalCredits: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Result Status
                </label>
                <select
                  value={editingResult.status || 'Good'}
                  onChange={(e) =>
                    setEditingResult({ ...editingResult, status: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover shadow-sm transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Result</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AcademicProfileGate>
  );
}
