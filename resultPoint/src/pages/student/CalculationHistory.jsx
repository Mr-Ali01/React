import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator,
  FileText,
  GraduationCap,
  Target,
  Layers,
  Search,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  Eye,
  Trash2,
  Download,
  RotateCcw,
  ExternalLink,
  X,
  CheckCircle2,
  Pencil,
  Plus,
  Percent,
  Check,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectActivities,
  selectSelectedActivity,
  selectSearchQuery,
  selectTypeFilter,
  selectSemesterFilter,
  selectDateFilter,
  selectSortOrder,
  selectCurrentPage,
  selectItemsPerPage,
  selectActivitySummary,
  fetchActivities,
  setSelectedActivity,
  setSearchQuery,
  setTypeFilter,
  setSemesterFilter,
  setDateFilter,
  setSortOrder,
  setCurrentPage,
  deleteActivityItem,
  clearAllActivities,
  resetFilters
} from '../../features/activityHistory/activityHistorySlice';
import { studentService } from '../../services/studentService';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';

// Helper to format timestamps consistently into "Oct 20, 2026" and "10:45 AM"
function formatDateTime(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: 'Recent', time: '10:00 AM', full: 'Recent' };
    const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time, full: `${date} ${time}` };
  } catch {
    return { date: 'Recent', time: '10:00 AM', full: 'Recent' };
  }
}

export default function CalculationHistory() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const activities = useAppSelector(selectActivities);
  const selectedActivity = useAppSelector(selectSelectedActivity);
  const searchQuery = useAppSelector(selectSearchQuery);
  const typeFilter = useAppSelector(selectTypeFilter);
  const semesterFilter = useAppSelector(selectSemesterFilter);
  const dateFilter = useAppSelector(selectDateFilter);
  const sortOrder = useAppSelector(selectSortOrder);
  const currentPage = useAppSelector(selectCurrentPage);
  const itemsPerPage = useAppSelector(selectItemsPerPage);
  const summary = useAppSelector(selectActivitySummary);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch activities & listen for real-time updates
  useEffect(() => {
    dispatch(fetchActivities());

    const handleSync = () => {
      dispatch(fetchActivities());
    };

    window.addEventListener('activity_history_updated', handleSync);
    window.addEventListener('results_data_updated', handleSync);
    window.addEventListener('academic_goals_updated', handleSync);
    window.addEventListener('backlogs_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('activity_history_updated', handleSync);
      window.removeEventListener('results_data_updated', handleSync);
      window.removeEventListener('academic_goals_updated', handleSync);
      window.removeEventListener('backlogs_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [dispatch]);

  // Available semesters present in the activities list
  const availableSemesters = useMemo(() => {
    const set = new Set();
    activities.forEach((a) => {
      if (a.metadata?.semesterNumber) {
        set.add(Number(a.metadata.semesterNumber));
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [activities]);

  // Filtered & Sorted Activities
  const filteredActivities = useMemo(() => {
    let list = Array.isArray(activities) ? [...activities] : [];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const tool = (item.metadata?.tool || '').toLowerCase();
        const sem = String(item.metadata?.semester || item.metadata?.semesterNumber || '').toLowerCase();
        const sub = (item.metadata?.subjectCode || item.metadata?.subjectName || '').toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          tool.includes(q) ||
          sem.includes(q) ||
          sub.includes(q)
        );
      });
    }

    // 2. Activity Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter((item) => item.type === typeFilter);
    }

    // 3. Semester Filter
    if (semesterFilter !== 'ALL') {
      list = list.filter((item) => {
        const itemSem = Number(item.metadata?.semesterNumber || String(item.metadata?.semester).replace(/\D/g, ''));
        return itemSem === Number(semesterFilter);
      });
    }

    // 4. Date Range Filter
    if (dateFilter !== 'ALL') {
      const now = new Date().getTime();
      list = list.filter((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        const diffDays = (now - itemTime) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'TODAY') return diffDays <= 1;
        if (dateFilter === '7_DAYS') return diffDays <= 7;
        if (dateFilter === '30_DAYS') return diffDays <= 30;
        if (dateFilter === 'THIS_SEMESTER') return diffDays <= 180;
        return true;
      });
    }

    // 5. Sort Order
    list.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return sortOrder === 'OLDEST_FIRST' ? tA - tB : tB - tA;
    });

    return list;
  }, [activities, searchQuery, typeFilter, semesterFilter, dateFilter, sortOrder]);

  // Pagination calculation
  const totalItems = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  // Auto-select first activity if none selected
  useEffect(() => {
    if ((!selectedActivity || !filteredActivities.some((a) => a.id === selectedActivity.id)) && paginatedActivities.length > 0) {
      dispatch(setSelectedActivity(paginatedActivities[0]));
    }
  }, [paginatedActivities, selectedActivity, filteredActivities, dispatch]);

  const handleSelectActivity = (item) => {
    dispatch(setSelectedActivity(item));
  };

  const handleDeleteSelected = async (activityId) => {
    try {
      await dispatch(deleteActivityItem(activityId)).unwrap();
      showToast('Activity record removed from history.');
    } catch {
      showToast('Failed to delete activity entry.', 'error');
    }
  };

  const handleConfirmClearHistory = async () => {
    try {
      await dispatch(clearAllActivities()).unwrap();
      setShowClearConfirm(false);
      showToast('Activity history cleared successfully.');
    } catch {
      showToast('Failed to clear activity history.', 'error');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    setIsExportMenuOpen(false);
    if (filteredActivities.length === 0) {
      showToast('No activities to export.', 'error');
      return;
    }

    const headers = ['Timestamp', 'Activity Type', 'Title', 'Description', 'Semester', 'Result Metric', 'Remarks'];
    const rows = filteredActivities.map((a) => {
      const dt = formatDateTime(a.timestamp);
      return [
        `"${dt.full}"`,
        `"${a.metadata?.activityType || a.type}"`,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        `"${(a.description || '').replace(/"/g, '""')}"`,
        `"${a.metadata?.semester || '-'}"`,
        `"${a.resultMetric ? `${a.resultMetric.label}: ${a.resultMetric.value}` : '-'}"`,
        `"${(a.metadata?.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ResultPoint_Activity_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Activity history exported to CSV.');
  };

  // Printable PDF Export
  const handleExportPDF = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  // Navigation action helpers
  const handleViewFullResult = (semId, semNumber) => {
    if (semId) {
      navigate(`/student/results/${semId}`);
    } else {
      navigate('/student/results');
    }
  };

  const handleGoToSemester = (semNum) => {
    navigate(`/student/results?sem=${semNum || 1}`);
  };

  const handleReuseCalculation = (path) => {
    navigate(path || '/calculators');
  };

  // Activity type icon helper
  const getActivityIcon = (type, action) => {
    if (type === 'goal') {
      return { icon: Target, bg: 'bg-amber-500/15 text-amber-500 border-amber-500/30' };
    }
    if (type === 'backlog') {
      return { icon: CheckCircle2, bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
    if (type === 'calculation') {
      return { icon: Calculator, bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    }
    // Result
    if (action === 'created') {
      return { icon: Plus, bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
    }
    if (action === 'deleted') {
      return { icon: Trash2, bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    }
    return { icon: Pencil, bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before reviewing calculation logs, semester edits, and academic activity timelines, please complete your Academic Profile Setup."
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0 shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">
                Calculation & Activity History
              </h1>
              <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
                Track all your calculations and academic activities in one place. View, reuse, and manage your history.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-h bg-card border border-border hover:bg-bg-sec transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-text-light" />
                <span>Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-light" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full text-left px-3.5 py-2 text-xs text-text-h hover:bg-bg-sec flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full text-left px-3.5 py-2 text-xs text-text-h hover:bg-bg-sec flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Clear History Button */}
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={activities.length === 0}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                activities.length === 0
                  ? 'opacity-40 cursor-not-allowed border-border text-text-light'
                  : 'text-rose-500 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Top 5 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Total Activities */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-blue-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                ↑ 12%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
                Total Activities
              </span>
              <span className="text-2xl font-extrabold text-text-h mt-0.5 block font-mono">
                {summary.totalActivities}
              </span>
              <span className="text-[11px] text-text-light mt-0.5 block truncate">
                All calculations & academic updates
              </span>
            </div>
          </div>

          {/* Card 2: Calculator Usage */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                ↑ 18%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
                Calculator Usage
              </span>
              <span className="text-2xl font-extrabold text-text-h mt-0.5 block font-mono">
                {summary.calculatorUsage}
              </span>
              <span className="text-[11px] text-text-light mt-0.5 block truncate">
                Calculator tool calculations
              </span>
            </div>
          </div>

          {/* Card 3: Result Updates */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-purple-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                ↑ 8%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
                Result Updates
              </span>
              <span className="text-2xl font-extrabold text-text-h mt-0.5 block font-mono">
                {summary.resultUpdates}
              </span>
              <span className="text-[11px] text-text-light mt-0.5 block truncate">
                Add / Edit semester results
              </span>
            </div>
          </div>

          {/* Card 4: Goal Updates */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-amber-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                ↑ 25%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
                Goal Updates
              </span>
              <span className="text-2xl font-extrabold text-text-h mt-0.5 block font-mono">
                {summary.goalUpdates}
              </span>
              <span className="text-[11px] text-text-light mt-0.5 block truncate">
                Set or update academic goals
              </span>
            </div>
          </div>

          {/* Card 5: Backlogs Cleared */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-rose-500/30 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                ↑ 40%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
                Backlogs Cleared
              </span>
              <span className="text-2xl font-extrabold text-text-h mt-0.5 block font-mono">
                {summary.backlogsCleared}
              </span>
              <span className="text-[11px] text-text-light mt-0.5 block truncate">
                Backlog status updated
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Controls Bar */}
        <div className="p-3 bg-card border border-border rounded-2xl shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search by activity, subject, semester, or tool..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-bg border border-border text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Activity Types Filter */}
              <select
                value={typeFilter}
                onChange={(e) => dispatch(setTypeFilter(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs bg-bg border border-border text-text-h font-medium focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Activity Types</option>
                <option value="result">Result Updates</option>
                <option value="calculation">Calculator Usage</option>
                <option value="goal">Goal Updates</option>
                <option value="backlog">Backlogs Cleared</option>
              </select>

              {/* Semesters Filter */}
              <select
                value={semesterFilter}
                onChange={(e) => dispatch(setSemesterFilter(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs bg-bg border border-border text-text-h font-medium focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Semesters</option>
                {availableSemesters.map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => dispatch(setDateFilter(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs bg-bg border border-border text-text-h font-medium focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="7_DAYS">Last 7 Days</option>
                <option value="30_DAYS">Last 30 Days</option>
                <option value="THIS_SEMESTER">This Semester</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => dispatch(setSortOrder(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs bg-bg border border-border text-text-h font-medium focus:outline-none focus:border-accent"
              >
                <option value="LATEST_FIRST">Latest First</option>
                <option value="OLDEST_FIRST">Oldest First</option>
              </select>

              {(searchQuery || typeFilter !== 'ALL' || semesterFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => dispatch(resetFilters())}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout: Timeline on Left + Details Panel on Right */}
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* Left Column: Chronological Activities Timeline */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-7 space-y-3.5">
            {paginatedActivities.length > 0 ? (
              <div className="relative pl-6 sm:pl-8 space-y-3">
                {/* Vertical connecting line */}
                <div className="absolute left-[11px] sm:left-[15px] top-4 bottom-4 w-0.5 bg-border/80 pointer-events-none" />

                {paginatedActivities.map((item) => {
                  const dt = formatDateTime(item.timestamp);
                  const iconInfo = getActivityIcon(item.type, item.action);
                  const IconComp = iconInfo.icon;
                  const isSelected = selectedActivity?.id === item.id;

                  // Metric pill badge color
                  const metricColor = item.resultMetric?.color || 'emerald';
                  const metricClasses =
                    metricColor === 'orange'
                      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                      : metricColor === 'blue'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : metricColor === 'cyan'
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : metricColor === 'purple'
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      : metricColor === 'rose'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[23px] sm:-left-[27px] top-5 w-4 h-4 rounded-full border-2 bg-card transition-all z-10 ${
                          isSelected
                            ? 'border-blue-500 scale-125 ring-4 ring-blue-500/20'
                            : 'border-border group-hover:border-text-light'
                        }`}
                      />

                      {/* Timestamp above card */}
                      <div className="text-[10px] sm:text-[11px] font-mono text-text-light mb-1 flex items-center gap-2">
                        <span>{dt.date}</span>
                        <span>•</span>
                        <span>{dt.time}</span>
                      </div>

                      {/* Activity Row Card */}
                      <div
                        onClick={() => handleSelectActivity(item)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#10192A] border-blue-500/60 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
                            : 'bg-card border-border hover:border-border/90 hover:bg-bg-sec/40'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconInfo.bg}`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-text-h truncate">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-text-light truncate mt-0.5">
                              {item.description}
                            </p>

                            {/* Badges */}
                            {item.badgeValues && item.badgeValues.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {item.badgeValues.map((b, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg border border-border/80 text-text-light"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side: Metric Pill + View Details */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          {item.resultMetric && (
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${metricClasses}`}
                            >
                              {item.resultMetric.label ? `${item.resultMetric.label}: ` : ''}
                              {item.resultMetric.value}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectActivity(item);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-bg text-text-h border-border hover:border-blue-500/50 hover:text-blue-400'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-card border border-border rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-text-h">No activity records found</h3>
                <p className="text-xs text-text-light max-w-sm mx-auto">
                  {searchQuery || typeFilter !== 'ALL' || semesterFilter !== 'ALL' || dateFilter !== 'ALL'
                    ? 'No activities match your current filter settings. Try clearing your filters.'
                    : 'Perform calculator operations, edit semester results, or clear arrears to begin recording activity history.'}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(resetFilters())}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/80 text-xs">
                <span className="text-text-light font-medium text-[11px]">
                  Showing {startIndex + 1} to {endIndex} of {totalItems} activities
                </span>

                <div className="flex items-center gap-1 self-center sm:self-auto">
                  <button
                    type="button"
                    disabled={validCurrentPage <= 1}
                    onClick={() => dispatch(setCurrentPage(validCurrentPage - 1))}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                      validCurrentPage <= 1
                        ? 'opacity-40 cursor-not-allowed border-border text-text-light'
                        : 'border-border text-text-h hover:bg-bg-sec'
                    }`}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Show compact page numbers
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - validCurrentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => dispatch(setCurrentPage(pageNum))}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            validCurrentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-text-light hover:text-text-h hover:bg-bg-sec'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 2 && validCurrentPage > 3) {
                      return <span key="dots-1" className="text-text-light px-1">...</span>;
                    }
                    if (pageNum === totalPages - 1 && validCurrentPage < totalPages - 2) {
                      return <span key="dots-2" className="text-text-light px-1">...</span>;
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={validCurrentPage >= totalPages}
                    onClick={() => dispatch(setCurrentPage(validCurrentPage + 1))}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                      validCurrentPage >= totalPages
                        ? 'opacity-40 cursor-not-allowed border-border text-text-light'
                        : 'border-border text-text-h hover:bg-bg-sec'
                    }`}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Activity Details Panel (Matching Reference Image) */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-5">
            {selectedActivity ? (
              <div className="p-5 rounded-2xl bg-card border border-border shadow-theme space-y-4 lg:sticky lg:top-20">
                {/* Panel Header */}
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-text-light">
                        Activity Details
                      </h2>
                      <h3 className="text-sm font-extrabold text-text-h mt-0.5">
                        {selectedActivity.title}
                      </h3>
                      <p className="text-[11px] text-text-light mt-0.5">
                        {selectedActivity.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSelected(selectedActivity.id)}
                    className="p-1 rounded-lg text-text-light hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete this history entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Key-Value Details */}
                <div className="space-y-2 text-xs divide-y divide-border/40">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-text-light font-medium">Date & Time</span>
                    <span className="font-semibold text-text-h font-mono">
                      {formatDateTime(selectedActivity.timestamp).full}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-text-light font-medium">Activity Type</span>
                    <span className="font-semibold text-text-h">
                      {selectedActivity.metadata?.activityType || selectedActivity.type}
                    </span>
                  </div>

                  {selectedActivity.metadata?.course && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Course</span>
                      <span className="font-semibold text-text-h">
                        {selectedActivity.metadata.course}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.university && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">University</span>
                      <span className="font-semibold text-text-h truncate max-w-[200px] text-right">
                        {selectedActivity.metadata.university}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.semester && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Semester</span>
                      <span className="font-semibold text-text-h">
                        {selectedActivity.metadata.semester}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.totalSubjects && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Total Subjects</span>
                      <span className="font-semibold text-text-h font-mono">
                        {selectedActivity.metadata.totalSubjects}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.previousSGPA && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Previous SGPA</span>
                      <span className="font-semibold text-text-h font-mono">
                        {selectedActivity.metadata.previousSGPA}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.updatedSGPA && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Updated SGPA</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {selectedActivity.metadata.updatedSGPA}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.previousTarget && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Previous Target</span>
                      <span className="font-semibold text-text-h font-mono">
                        {selectedActivity.metadata.previousTarget}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.updatedTarget && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Updated Target</span>
                      <span className="font-bold text-amber-500 font-mono">
                        {selectedActivity.metadata.updatedTarget}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.tool && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Calculator Tool</span>
                      <span className="font-bold text-purple-400">
                        {selectedActivity.metadata.tool}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.output && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Computed Score</span>
                      <span className="font-bold text-blue-400 font-mono">
                        {selectedActivity.metadata.output}
                      </span>
                    </div>
                  )}

                  {selectedActivity.metadata?.clearedGrade && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-light font-medium">Cleared Grade</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {selectedActivity.metadata.clearedGrade} ({selectedActivity.metadata.clearedPoints || 5} pts)
                      </span>
                    </div>
                  )}
                </div>

                {/* Subject Changes Table (Shown if present in metadata) */}
                {selectedActivity.metadata?.subjectChanges && selectedActivity.metadata.subjectChanges.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-light flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Subject Changes</span>
                    </h4>

                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg text-text-light text-[10px] uppercase font-bold border-b border-border">
                          <tr>
                            <th className="py-2 px-3">Subject</th>
                            <th className="py-2 px-3 text-center">Previous Grade</th>
                            <th className="py-2 px-3 text-right">Updated Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedActivity.metadata.subjectChanges.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-bg/40">
                              <td className="py-2 px-3 font-semibold text-text-h">
                                <div>{sub.subject}</div>
                                {sub.name && <span className="text-[10px] text-text-light truncate block">{sub.name}</span>}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-text-light">
                                {sub.previousGrade || '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                {sub.updatedGrade}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {selectedActivity.metadata?.remarks && (
                  <div className="p-3 bg-bg rounded-xl border border-border/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-light block">
                      Remarks
                    </span>
                    <p className="text-xs text-text-m leading-relaxed">
                      {selectedActivity.metadata.remarks}
                    </p>
                  </div>
                )}

                {/* Action Buttons at bottom */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-border">
                  {selectedActivity.type === 'result' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleViewFullResult(
                            selectedActivity.entityId,
                            selectedActivity.metadata?.semesterNumber
                          )
                        }
                        className="w-full sm:flex-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>View Full Result</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGoToSemester(selectedActivity.metadata?.semesterNumber || 1)}
                        className="w-full sm:flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-text-h bg-bg border border-border hover:bg-bg-sec transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-text-light" />
                        <span>Go to {selectedActivity.metadata?.semester || 'Semester'}</span>
                      </button>
                    </>
                  )}

                  {selectedActivity.type === 'calculation' && (
                    <button
                      type="button"
                      onClick={() => handleReuseCalculation(selectedActivity.metadata?.path)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reuse Calculation</span>
                    </button>
                  )}

                  {selectedActivity.type === 'goal' && (
                    <Link
                      to="/student/goals"
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Manage Goals</span>
                    </Link>
                  )}

                  {selectedActivity.type === 'backlog' && (
                    <Link
                      to="/student/backlogs"
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Backlog Tracker</span>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-2">
                <p className="text-xs text-text-light">Select any activity to view complete audit information.</p>
              </div>
            )}
          </div>
        </div>

        {/* Clear History Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-h">Clear Activity History?</h3>
                  <p className="text-xs text-text-light">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-text-m leading-relaxed">
                Clearing your activity history will remove all logged calculations, result update logs, and goal audit events.
                <span className="block font-bold text-text-h mt-1.5">
                  Note: Your saved semester results, current CGPA, academic goals, and backlog records will NOT be deleted.
                </span>
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearHistory}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Confirm Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AcademicProfileGate>
  );
}
