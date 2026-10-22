import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart2,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Building2,
  BookOpen,
  FileText,
  MessageSquare,
  Bell,
  HardDrive,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Check,
  ShieldCheck,
  Award
} from 'lucide-react';
import {
  reportsAnalyticsService,
  DATE_RANGES,
  REPORTS_UPDATED_EVENT
} from '../../services/reportsAnalyticsService';
import { TOOLS_DATA } from '../../data/toolsData';

export default function ReportsAnalyticsManager() {
  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'calculators' | 'academic' | 'support'

  // Filter States
  const [selectedRange, setSelectedRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [toolFilter, setToolFilter] = useState('all');

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [calculatorData, setCalculatorData] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [supportData, setSupportData] = useState(null);
  const [announcementData, setAnnouncementData] = useState(null);
  const [exportNotice, setExportNotice] = useState(null);

  // Fetch all analytics data
  const loadAnalytics = useCallback(() => {
    setIsLoading(true);
    try {
      const filterOpts = {
        range: selectedRange,
        customStart: selectedRange === 'custom' ? customStart : null,
        customEnd: selectedRange === 'custom' ? customEnd : null,
        tool: toolFilter
      };

      const overview = reportsAnalyticsService.getOverviewMetrics(filterOpts);
      const calculators = reportsAnalyticsService.getCalculatorUsageAnalytics(filterOpts);
      const academic = reportsAnalyticsService.getAcademicDistributionAnalytics(filterOpts);
      const support = reportsAnalyticsService.getSupportAnalytics(filterOpts);
      const announcements = reportsAnalyticsService.getAnnouncementAnalytics(filterOpts);

      setOverviewData(overview);
      setCalculatorData(calculators);
      setAcademicData(academic);
      setSupportData(support);
      setAnnouncementData(announcements);
    } catch (err) {
      console.error('Failed to load reports analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange, customStart, customEnd, toolFilter]);

  // Initial load and real-time subscription
  useEffect(() => {
    loadAnalytics();

    const handleUpdate = () => {
      loadAnalytics();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('rp_users_updated', handleUpdate);
    window.addEventListener('rp_queries_updated', handleUpdate);
    window.addEventListener('rp_announcements_updated', handleUpdate);
    window.addEventListener('rp_catalog_updated', handleUpdate);
    window.addEventListener('calculation_history_updated', handleUpdate);
    window.addEventListener('activity_history_updated', handleUpdate);
    window.addEventListener(REPORTS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('rp_users_updated', handleUpdate);
      window.removeEventListener('rp_queries_updated', handleUpdate);
      window.removeEventListener('rp_announcements_updated', handleUpdate);
      window.removeEventListener('rp_catalog_updated', handleUpdate);
      window.removeEventListener('calculation_history_updated', handleUpdate);
      window.removeEventListener('activity_history_updated', handleUpdate);
      window.removeEventListener(REPORTS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [loadAnalytics]);

  // Export handlers
  const handleExport = (reportType) => {
    try {
      const filterOpts = {
        range: selectedRange,
        customStart: selectedRange === 'custom' ? customStart : null,
        customEnd: selectedRange === 'custom' ? customEnd : null,
        tool: toolFilter
      };
      const res = reportsAnalyticsService.exportReportToCSV(reportType, filterOpts);
      setExportNotice(`Exported ${res.filename} successfully!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportNotice('Export failed. Please check storage records.');
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Reports & Analytics
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited platform usage, calculator activity, academic distribution, and support metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Date Range Selector & Master Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0D141F] p-1 rounded-xl overflow-x-auto max-w-full">
            {DATE_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRange(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedRange === r.id
                    ? 'bg-[#FF6B00] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF6B00]' : ''}`} />
          </button>

          {/* Quick Export Master CSV */}
          <button
            onClick={() => handleExport(activeTab)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Row (visible only when 'custom' is active) */}
      {selectedRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#FF6B00]" />
            Specify Custom Window:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 dark:text-slate-400">Start Date:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 dark:text-slate-400">End Date:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>
          <button
            onClick={loadAnalytics}
            className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg font-semibold hover:bg-[#E56000] transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Students */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {overviewData?.users.students ?? 0}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {overviewData?.users.active ?? 0} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {overviewData?.users.joinedInPeriod ?? 0} joined in selected period
          </p>
        </div>

        {/* Card 2: Recorded Calculations */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recorded Calculations</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {overviewData?.calculations.totalRecorded ?? 0}
            </span>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              {overviewData?.calculations.periodRecorded ?? 0} in period
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {calculatorData?.toolRows.length ?? 0} distinct tools utilized
          </p>
        </div>

        {/* Card 3: Academic Catalog Coverage */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Universities with Enrolled</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {academicData?.enrolledUniversitiesCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              of {academicData?.catalogUniversitiesCount ?? 0} Configured
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {academicData?.enrolledCoursesCount ?? 0} active courses with students
          </p>
        </div>

        {/* Card 4: Support Query Status */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Support Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {overviewData?.support.total ?? 0}
            </span>
            <span className={`text-xs font-medium ${(overviewData?.support.pending ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {(overviewData?.support.pending ?? 0) > 0 ? `${overviewData?.support.pending} Pending` : 'All Resolved'}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {overviewData?.support.resolved ?? 0} resolved in this period
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#1E2A35] overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('calculators')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'calculators'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Calculator Usage Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'academic'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>University & Course Distribution</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'support'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support & Announcements</span>
        </button>
      </div>

      {/* 4. Tab 1: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row: Calculation Activity Timeline & Summary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Activity Timeline Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Calculation Activity Over Time
                  </h2>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Range: {DATE_RANGES.find((r) => r.id === selectedRange)?.label || selectedRange}
                </span>
              </div>

              {/* Timeline SVG Chart */}
              {calculatorData && calculatorData.timeline.some((t) => t.count > 0) ? (
                <div>
                  <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-[#1E2A35]">
                    {calculatorData.timeline.map((point, idx) => {
                      const maxVal = Math.max(...calculatorData.timeline.map((t) => t.count), 1);
                      const barPercent = Math.max(8, Math.round((point.count / maxVal) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 bg-slate-900 text-white text-[10px] rounded pointer-events-none whitespace-nowrap z-10">
                            {point.count} calculations ({point.label})
                          </div>
                          <div
                            style={{ height: `${barPercent}%` }}
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400 hover:from-orange-500 hover:to-amber-300 transition-all cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center px-2 pt-2 text-[10px] text-slate-400">
                    {calculatorData.timeline.map((p, idx) => (
                      <span key={idx} className="truncate max-w-[40px] text-center">
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-[#0D141F] rounded-xl border border-dashed border-slate-200 dark:border-[#1E2A35]">
                  <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No Recorded Calculations in Selected Window
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                    Calculations are captured when students evaluate results and save them to their account.
                  </p>
                </div>
              )}

              {/* Timestamp disclosure notice */}
              {overviewData?.calculations.missingTimestampsCount > 0 && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {overviewData.calculations.missingTimestampsCount} legacy calculation records lack ISO timestamps and were excluded from time filtering to avoid fabrication.
                  </span>
                </div>
              )}
            </div>

            {/* Right: User Status & System Distribution */}
            <div className="lg:col-span-4 space-y-4">
              {/* User Account Breakdown */}
              <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  User Account Health
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Active Students</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {overviewData?.users.active ?? 0}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#1E2A35] rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            (overviewData?.users.total ?? 0) > 0
                              ? Math.round(((overviewData?.users.active ?? 0) / overviewData.users.total) * 100)
                              : 0
                          }%`
                        }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Inactive / Deactivated</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {overviewData?.users.inactive ?? 0}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#1E2A35] rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            (overviewData?.users.total ?? 0) > 0
                              ? Math.round(((overviewData?.users.inactive ?? 0) / overviewData.users.total) * 100)
                              : 0
                          }%`
                        }}
                        className="h-full bg-slate-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Administrators</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {overviewData?.users.admins ?? 0}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#1E2A35] rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            (overviewData?.users.total ?? 0) > 0
                              ? Math.round(((overviewData?.users.admins ?? 0) / overviewData.users.total) * 100)
                              : 0
                          }%`
                        }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Storage & System Info */}
              <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Runtime Storage Quota
                  </h3>
                  <HardDrive className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {overviewData?.system.storage?.used || '0 KB'}
                  </span>
                  <span className="text-xs text-slate-400">
                    of {overviewData?.system.storage?.total || '5 MB'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-[#1E2A35] rounded-full overflow-hidden mb-2">
                  <div
                    style={{ width: `${overviewData?.system.storage?.percentage || 1}%` }}
                    className="h-full bg-[#FF6B00] rounded-full"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {overviewData?.system.auditEventsCount ?? 0} total platform mutations audited in audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Master Overview KPI Table with CSV Export */}
          <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Platform Metrics Summary Table
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Independently verified aggregates across all ResultPoint system modules.
                </p>
              </div>
              <button
                onClick={() => handleExport('overview')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Export Overview CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200/80 dark:border-[#1E2A35]">
                  <tr>
                    <th className="py-2.5 px-4">Domain</th>
                    <th className="py-2.5 px-4">Metric</th>
                    <th className="py-2.5 px-4">Value</th>
                    <th className="py-2.5 px-4">Selected Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/80 text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Users</td>
                    <td className="py-2.5 px-4 font-semibold">Registered Students</td>
                    <td className="py-2.5 px-4">{overviewData?.users.students ?? 0}</td>
                    <td className="py-2.5 px-4 text-slate-400">All Time</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Users</td>
                    <td className="py-2.5 px-4 font-semibold">Active Student Accounts</td>
                    <td className="py-2.5 px-4">{overviewData?.users.active ?? 0}</td>
                    <td className="py-2.5 px-4 text-slate-400">All Time</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Users</td>
                    <td className="py-2.5 px-4 font-semibold">New Registrations in Period</td>
                    <td className="py-2.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      +{overviewData?.users.joinedInPeriod ?? 0}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{selectedRange}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Calculators</td>
                    <td className="py-2.5 px-4 font-semibold">Calculations Recorded</td>
                    <td className="py-2.5 px-4">{overviewData?.calculations.periodRecorded ?? 0}</td>
                    <td className="py-2.5 px-4 text-slate-400">{selectedRange}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Academic</td>
                    <td className="py-2.5 px-4 font-semibold">Configured Universities in Catalog</td>
                    <td className="py-2.5 px-4">{overviewData?.academic.catalogUniversities ?? 0}</td>
                    <td className="py-2.5 px-4 text-slate-400">Catalog</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Support</td>
                    <td className="py-2.5 px-4 font-semibold">Total Tickets in Window</td>
                    <td className="py-2.5 px-4">{overviewData?.support.total ?? 0}</td>
                    <td className="py-2.5 px-4 text-slate-400">{selectedRange}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-500">Announcements</td>
                    <td className="py-2.5 px-4 font-semibold">Published Notices</td>
                    <td className="py-2.5 px-4">{overviewData?.announcements.published ?? 0}</td>
                    <td className="py-2.5 px-4 text-slate-400">{selectedRange}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Calculator Usage Analytics */}
      {activeTab === 'calculators' && (
        <div className="space-y-6">
          {/* Header Controls for Calculator Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter by Tool:</label>
              <select
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Available Tools</option>
                {TOOLS_DATA.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleExport('calculators')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-semibold hover:bg-[#E56000] transition-colors self-start sm:self-auto shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Calculator CSV</span>
            </button>
          </div>

          {/* Calculator Usage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Calculations in Window</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {calculatorData?.totalCalculations ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Genuinely recorded evaluation events</p>
            </div>

            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Most Utilized Calculator</span>
              <div className="text-lg font-bold text-[#FF6B00] truncate mt-1">
                {calculatorData?.mostUsedTool?.toolName || 'None Recorded'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {calculatorData?.mostUsedTool ? `${calculatorData.mostUsedTool.count} uses (${calculatorData.mostUsedTool.percentage}%)` : 'No events yet'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Active Evaluated Tools</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {calculatorData?.toolRows.length ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across {TOOLS_DATA.length} platform tools</p>
            </div>
          </div>

          {/* Calculator Usage Table */}
          <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Recorded Usage by Calculator Tool
            </h3>

            {calculatorData && calculatorData.toolRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200/80 dark:border-[#1E2A35]">
                    <tr>
                      <th className="py-2.5 px-4">Tool Name</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Usage Count</th>
                      <th className="py-2.5 px-4">Share (%)</th>
                      <th className="py-2.5 px-4">Distribution Bar</th>
                      <th className="py-2.5 px-4">Average Output</th>
                      <th className="py-2.5 px-4">Last Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/80 text-slate-800 dark:text-slate-200">
                    {calculatorData.toolRows.map((row) => (
                      <tr key={row.toolId} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2332]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.toolName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{row.category}</td>
                        <td className="py-3 px-4 font-bold">{row.count}</td>
                        <td className="py-3 px-4 font-semibold text-[#FF6B00]">{row.percentage}%</td>
                        <td className="py-3 px-4 w-36">
                          <div className="h-2 w-full bg-slate-100 dark:bg-[#1E2A35] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(5, row.percentage)}%` }}
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{row.averageScore || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {row.lastUsed ? new Date(row.lastUsed).toLocaleDateString('en-GB') : 'Recorded'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-[#0D141F] rounded-xl border border-dashed border-slate-200 dark:border-[#1E2A35]">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No Calculator Events Found for Selected Filters
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                  Adjust your date window or select "All Time" to view previously saved calculation logs.
                </p>
              </div>
            )}

            {/* Privacy & Instrumentation Notice */}
            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{calculatorData?.instrumentationGapNotice}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: University & Course Distribution */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Header Controls for Academic Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Academic Catalog vs. Actual Enrollment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distinguishes configured administrative catalog entries from verified registered students.
              </p>
            </div>

            <button
              onClick={() => handleExport('academic')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-semibold hover:bg-[#E56000] transition-colors self-start sm:self-auto shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Academic CSV</span>
            </button>
          </div>

          {/* Academic Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Total Enrolled Students</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {academicData?.totalStudents ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Verified registered student accounts</p>
            </div>

            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Profile Completeness</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {academicData?.profileCompleteness.completenessRate ?? 0}%
                </span>
                <span className="text-xs text-slate-500">
                  ({academicData?.profileCompleteness.completeCount ?? 0} complete)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {academicData?.profileCompleteness.incompleteCount ?? 0} students have missing academic fields
              </p>
            </div>

            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Catalog Size vs Enrolled</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {academicData?.enrolledUniversitiesCount} of {academicData?.catalogUniversitiesCount} Universities
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {academicData?.enrolledCoursesCount} of {academicData?.catalogCoursesCount} Courses active
              </p>
            </div>
          </div>

          {/* University Distribution Table */}
          <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Student Enrollment by University
            </h3>

            {academicData && academicData.universityRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200/80 dark:border-[#1E2A35]">
                    <tr>
                      <th className="py-2.5 px-4">University</th>
                      <th className="py-2.5 px-4">Short Code</th>
                      <th className="py-2.5 px-4">Enrolled Students</th>
                      <th className="py-2.5 px-4">Share of Total</th>
                      <th className="py-2.5 px-4">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/80 text-slate-800 dark:text-slate-200">
                    {academicData.universityRows.map((row) => (
                      <tr key={row.universityId} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2332]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.universityName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{row.shortName}</td>
                        <td className="py-3 px-4 font-bold">{row.studentCount}</td>
                        <td className="py-3 px-4 font-semibold text-[#FF6B00]">{row.percentage}%</td>
                        <td className="py-3 px-4 w-48">
                          <div className="h-2 w-full bg-slate-100 dark:bg-[#1E2A35] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(5, row.percentage)}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-[#0D141F] rounded-xl border border-dashed border-slate-200 dark:border-[#1E2A35]">
                <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No Enrolled Students In System
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Students will appear here as accounts register and select their university.
                </p>
              </div>
            )}
          </div>

          {/* Course Distribution Table */}
          {academicData && academicData.courseRows.length > 0 && (
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Student Enrollment by Course / Program
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200/80 dark:border-[#1E2A35]">
                    <tr>
                      <th className="py-2.5 px-4">Course Name</th>
                      <th className="py-2.5 px-4">Affiliated University</th>
                      <th className="py-2.5 px-4">Enrolled Students</th>
                      <th className="py-2.5 px-4">Share of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/80 text-slate-800 dark:text-slate-200">
                    {academicData.courseRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2332]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.courseName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{row.universityName}</td>
                        <td className="py-3 px-4 font-bold">{row.count}</td>
                        <td className="py-3 px-4 font-semibold text-[#FF6B00]">{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Tab 4: Support & Announcements */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Support Queries Section */}
          <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Support Queries Performance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status, priority, and genuine resolution timeline tracking.
                </p>
              </div>

              <button
                onClick={() => handleExport('support')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-semibold hover:bg-[#E56000] transition-colors self-start sm:self-auto shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Queries CSV</span>
              </button>
            </div>

            {/* Support Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Open Tickets</span>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                  {supportData?.statusCounts.open ?? 0}
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">In Progress</span>
                <div className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-0.5">
                  {supportData?.statusCounts.inProgress ?? 0}
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Resolved</span>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {supportData?.statusCounts.resolved ?? 0}
                </div>
              </div>

              <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-400">Average Resolution</span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-300 mt-1 truncate">
                  {supportData?.resolutionMetrics.avgResolutionFormatted}
                </div>
              </div>
            </div>

            {/* Support Categories Breakdown */}
            {supportData && supportData.categoryRows.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Queries by Category
                </h4>
                <div className="space-y-2">
                  {supportData.categoryRows.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{cat.count}</span>
                        <span className="text-[11px] text-slate-400 w-10 text-right">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Announcements Section */}
          <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Announcements & Notices Overview
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Publication volume, audience distribution, and active banners.
                </p>
              </div>

              <button
                onClick={() => handleExport('announcements')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-semibold hover:bg-[#E56000] transition-colors self-start sm:self-auto shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Notices CSV</span>
              </button>
            </div>

            {/* Announcement Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Published</span>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {announcementData?.statusCounts.published ?? 0}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Drafts</span>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                  {announcementData?.statusCounts.draft ?? 0}
                </div>
              </div>

              <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-400">Archived</span>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-0.5">
                  {announcementData?.statusCounts.archived ?? 0}
                </div>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">Active Banners</span>
                <div className="text-xl font-bold text-orange-800 dark:text-orange-300 mt-0.5">
                  {announcementData?.activeBanners ?? 0}
                </div>
              </div>
            </div>

            {/* Audience Scopes */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-[#0D141F] rounded-xl border border-slate-200/80 dark:border-[#1E2A35]">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 block">
                Audience Scopes Breakdown:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-white dark:bg-[#111418] border border-slate-200/60 dark:border-[#1E2A35]">
                  <span className="text-slate-500">All Users:</span>
                  <span className="font-semibold">{announcementData?.audienceCounts.all ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-[#111418] border border-slate-200/60 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Students Only:</span>
                  <span className="font-semibold">{announcementData?.audienceCounts.students ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-[#111418] border border-slate-200/60 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Admins Only:</span>
                  <span className="font-semibold">{announcementData?.audienceCounts.admins ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-[#111418] border border-slate-200/60 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Target University:</span>
                  <span className="font-semibold">{announcementData?.audienceCounts.university ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-[#111418] border border-slate-200/60 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Target Course:</span>
                  <span className="font-semibold">{announcementData?.audienceCounts.course ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white dark:bg-[#111418] border border-slate-200/60 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Target Regulation:</span>
                  <span className="font-semibold">{announcementData?.audienceCounts.regulation ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer on Read Receipts */}
            <div className="mt-3 text-[11px] text-slate-400">
              {announcementData?.noticeAnalyticsDisclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
