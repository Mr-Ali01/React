import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Users,
  Wrench,
  FolderOpen,
  Newspaper,
  Bell,
  BarChart2,
  MessageSquare,
  Settings,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AdminManagementPage({
  title = 'Management Portal',
  description = 'Manage platform configurations and records.',
  icon: Icon = Settings,
  badge = 'Active'
}) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = () => {
    showToast(`Action executed for ${title}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1E2A35]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] border border-orange-100 dark:border-orange-900/30 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                {badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={handleAction}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-4 h-4 text-[#FF6B00]" />
          <span>Synced with Platform Registry • Demo Environment</span>
        </div>
      </div>

      {/* Content Table / Data Placeholder */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 text-center space-y-4 shadow-2xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center">
          <Icon className="w-7 h-7 stroke-[1.8]" />
        </div>

        <div className="max-w-md mx-auto space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {title} Data Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All records for this module are configured and linked to the ResultPoint centralized data architecture.
            Future Spring Boot REST API controllers will bind directly to this administration view.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] hover:underline"
          >
            <span>Return to Admin Dashboard Overview →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
