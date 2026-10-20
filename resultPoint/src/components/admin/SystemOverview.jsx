import React from 'react';
import { Settings, Wrench, Database, Activity, HardDrive } from 'lucide-react';
import { SYSTEM_METRICS } from '../../services/adminDashboardService';

export default function SystemOverview() {
  const { activeTools, universitiesData, uptime, totalStorage } = SYSTEM_METRICS;

  return (
    <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Settings className="w-4 h-4 stroke-[2.2]" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          System Overview
        </h2>
      </div>

      {/* 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 pt-3">
        {/* Card 1: Active Tools */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/60 dark:border-[#1E2A35] space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">
              {activeTools.label}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              {activeTools.current} / {activeTools.total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${activeTools.percentage}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {activeTools.percentage}%
            </span>
          </div>
        </div>

        {/* Card 2: Universities Data */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/60 dark:border-[#1E2A35] space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">
              {universitiesData.label}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              {universitiesData.percentage}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${universitiesData.percentage}%` }}
            />
          </div>
        </div>

        {/* Card 3: Uptime */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/60 dark:border-[#1E2A35] space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">
              {uptime.label}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              {uptime.value}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${uptime.percentage}%` }}
            />
          </div>
        </div>

        {/* Card 4: Total Storage */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/60 dark:border-[#1E2A35] space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">
              {totalStorage.label}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              {totalStorage.used} / {totalStorage.total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${totalStorage.percentage}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {totalStorage.percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
