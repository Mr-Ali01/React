import { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  Edit3,
  Trash2,
  Calendar,
  Download
} from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  fetchAcademicHistory,
  selectAuditEvents
} from '../../features/academicHistory/academicHistorySlice';
import { selectResults } from '../../features/results/resultsSlice';
import { exportApi, triggerBlobDownload } from '../../services/api/exportApi';
import { useToast } from '../../context/ToastContext';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';

export default function AcademicHistory() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const rawAuditEvents = useAppSelector(selectAuditEvents);
  const results = useAppSelector(selectResults);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('LATEST_FIRST');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadTranscript = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showToast('Downloading consolidated academic transcript...');
    try {
      const blob = await exportApi.downloadAcademicTranscriptPdf();
      triggerBlobDownload(blob, 'academic-transcript.pdf');
      showToast('Academic transcript PDF downloaded successfully!');
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to download transcript PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAcademicHistory());

    const handleSync = () => {
      dispatch(fetchAcademicHistory());
    };
    window.addEventListener('academic_history_updated', handleSync);
    window.addEventListener('results_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('academic_history_updated', handleSync);
      window.removeEventListener('results_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [dispatch]);

  // Available semesters present in audit events
  const availableSemesters = useMemo(() => {
    const semSet = new Set();
    (rawAuditEvents || []).forEach((ev) => {
      if (ev.semesterNumber) semSet.add(Number(ev.semesterNumber));
    });
    return Array.from(semSet).sort((a, b) => a - b);
  }, [rawAuditEvents]);

  // Filtered & Sorted Audit Events
  const filteredEvents = useMemo(() => {
    let list = Array.isArray(rawAuditEvents) ? [...rawAuditEvents] : [];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ev) => {
        const sem = String(ev.semesterNumber || '');
        const semLabel = (ev.semesterLabel || '').toLowerCase();
        const action = (ev.action || '').toLowerCase();
        const details = (ev.details || '').toLowerCase();
        const period = (ev.academicPeriod || '').toLowerCase();
        return (
          sem.includes(q) ||
          semLabel.includes(q) ||
          action.includes(q) ||
          details.includes(q) ||
          period.includes(q)
        );
      });
    }

    // 2. Action Filter
    if (actionFilter !== 'ALL') {
      list = list.filter((ev) => (ev.action || '').toUpperCase() === actionFilter);
    }

    // 3. Semester Filter
    if (semesterFilter !== 'ALL') {
      const num = Number(semesterFilter);
      list = list.filter((ev) => Number(ev.semesterNumber) === num);
    }

    // 4. Sort
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return sortOrder === 'LATEST_FIRST' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [rawAuditEvents, searchQuery, actionFilter, semesterFilter, sortOrder]);

  const stats = useMemo(() => {
    const total = (rawAuditEvents || []).length;
    const created = (rawAuditEvents || []).filter((e) => e.action === 'CREATED').length;
    const updated = (rawAuditEvents || []).filter((e) => e.action === 'UPDATED').length;
    const deleted = (rawAuditEvents || []).filter((e) => e.action === 'DELETED').length;
    return { total, created, updated, deleted };
  }, [rawAuditEvents]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setActionFilter('ALL');
    setSemesterFilter('ALL');
    setSortOrder('LATEST_FIRST');
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Date unavailable';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before inspecting your historical semester audit records and activity timeline, please complete your Academic Profile Setup."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-brandPurple" />
              <span>Academic History</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
              Immutable audit timeline of all semester result creations, revisions, and academic updates.
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadTranscript}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-text-h bg-card border border-border hover:bg-bg-sec shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download consolidated academic transcript in PDF format"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>{isExporting ? 'Downloading...' : 'Download Transcript (PDF)'}</span>
            </button>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
              {stats.total} Total Event{stats.total === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Audit Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Total Logged Events
            </span>
            <span className="text-2xl font-extrabold text-text-h mt-1 block">
              {stats.total}
            </span>
            <span className="text-[11px] text-text-light mt-1 block">
              Continuous Audit Trail
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Results Created
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats.created}
            </span>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
              Initial Submissions
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Revisions & Updates
            </span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
              {stats.updated}
            </span>
            <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1 block">
              Preserved Edits
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Active Semesters
            </span>
            <span className="text-2xl font-extrabold text-accent mt-1 block">
              {results.length}
            </span>
            <span className="text-[11px] text-text-light mt-1 block">
              Current Saved Records
            </span>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-text-light absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by semester, action, or details..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-bg border border-border text-text-h placeholder:text-text-light focus:outline-none focus:border-accent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-light hover:text-text-h"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Action Filter */}
              <div className="flex items-center gap-1.5 bg-bg border border-border rounded-xl px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-text-light" />
                <span className="text-text-light hidden sm:inline">Action:</span>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-transparent text-text-h font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATED">Created</option>
                  <option value="UPDATED">Updated</option>
                  <option value="DELETED">Deleted</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div className="flex items-center gap-1.5 bg-bg border border-border rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-text-light hidden sm:inline">Semester:</span>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="bg-transparent text-text-h font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Semesters</option>
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex items-center gap-1.5 bg-bg border border-border rounded-xl px-2.5 py-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-text-light" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-transparent text-text-h font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="LATEST_FIRST">Latest First</option>
                  <option value="OLDEST_FIRST">Oldest First</option>
                </select>
              </div>

              {(searchQuery || actionFilter !== 'ALL' || semesterFilter !== 'ALL' || sortOrder !== 'LATEST_FIRST') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Timeline */}
        {filteredEvents.length > 0 ? (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
            {filteredEvents.map((event, idx) => {
              const isCreated = event.action === 'CREATED';
              const isUpdated = event.action === 'UPDATED';

              return (
                <div key={event.id || idx} className="relative group">
                  {/* Timeline Dot Node */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 border-card flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
                      isCreated
                        ? 'bg-emerald-500 text-white'
                        : isUpdated
                        ? 'bg-blue-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isCreated ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isUpdated ? (
                      <Edit3 className="w-3 h-3" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </div>

                  {/* Timeline Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-accent/40 transition-all space-y-3">
                    {/* Top Row: Action Tag, Semester, Timestamp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/70">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                            isCreated
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isUpdated
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {event.action}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-text-h">
                          {event.semesterLabel || `Semester ${event.semesterNumber}`}
                        </h3>
                        {event.academicPeriod && (
                          <span className="text-xs text-text-light font-medium">
                            • {event.academicPeriod}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-text-light font-mono self-start sm:self-auto">
                        <Calendar className="w-3.5 h-3.5 text-text-light" />
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>
                    </div>

                    {/* Event Description */}
                    <p className="text-xs sm:text-sm text-text-m leading-relaxed">
                      {event.details}
                    </p>

                    {/* Metric Pills (if present) */}
                    {(event.sgpa !== undefined || event.credits !== undefined) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {event.sgpa !== undefined && (
                          <div className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 flex items-center gap-1.5">
                            <span className="text-text-light font-medium">SGPA:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {Number(event.sgpa).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {event.cgpa !== undefined && (
                          <div className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 flex items-center gap-1.5">
                            <span className="text-text-light font-medium">CGPA:</span>
                            <span className="font-extrabold text-text-h">
                              {Number(event.cgpa).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {event.credits !== undefined && (
                          <div className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 flex items-center gap-1.5">
                            <span className="text-text-light font-medium">Credits:</span>
                            <span className="font-bold text-text-h">
                              {event.credits}
                            </span>
                          </div>
                        )}

                        {event.subjectCount !== undefined && (
                          <div className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 flex items-center gap-1.5">
                            <span className="text-text-light font-medium">Subjects:</span>
                            <span className="font-bold text-text-h">
                              {event.subjectCount}
                            </span>
                          </div>
                        )}

                        <span className="ml-auto text-[11px] text-text-light italic">
                          Logged by: {event.actor || 'Student'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-card border border-border text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-text-h">
              {searchQuery || actionFilter !== 'ALL' || semesterFilter !== 'ALL'
                ? 'No matching audit records'
                : 'No academic history recorded yet'}
            </h3>
            <p className="text-xs text-text-light max-w-sm mx-auto">
              {searchQuery || actionFilter !== 'ALL' || semesterFilter !== 'ALL'
                ? 'Try adjusting your search criteria or resetting your active filters.'
                : 'When you save, edit, or manage semester results, an audit trail tracking every modification will be captured here.'}
            </p>
            {(searchQuery || actionFilter !== 'ALL' || semesterFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 transition-colors mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        )}
      </div>
    </AcademicProfileGate>
  );
}
