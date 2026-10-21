import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Calculator, Percent, TrendingUp, Target, Scale } from 'lucide-react';
import { adminDashboardService } from '../../services/adminDashboardService';

export default function PopularToolsTable() {
  const [tools, setTools] = useState(() => adminDashboardService.getPopularTools());

  useEffect(() => {
    const handleUpdate = () => {
      setTools(adminDashboardService.getPopularTools());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('activity_history_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('activity_history_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const getToolIcon = (id) => {
    switch (id) {
      case 'cgpa-calculator':
      case 'cgpa-calc':
        return <Calculator className="w-3.5 h-3.5 text-blue-500" />;
      case 'sgpa-calculator':
      case 'sgpa-calc':
        return <Scale className="w-3.5 h-3.5 text-sky-500" />;
      case 'cgpa-converter':
      case 'percentage-to-cgpa':
        return <Percent className="w-3.5 h-3.5 text-emerald-500" />;
      case 'cgpa-to-percentage':
      case 'percentage-calculator':
        return <TrendingUp className="w-3.5 h-3.5 text-purple-500" />;
      case 'target-cgpa':
        return <Target className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Calculator className="w-3.5 h-3.5 text-[#FF6B00]" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Popular Calculators & Tools
          </h2>
        </div>

        <Link
          to="/admin/tools"
          className="text-xs font-bold text-[#FF6B00] hover:text-[#EA580C] hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#1E2A35]/60 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <th className="py-2.5 px-2 font-semibold w-8">#</th>
              <th className="py-2.5 px-2 font-semibold">Tool Name</th>
              <th className="py-2.5 px-2 font-semibold text-right">Usage</th>
              <th className="py-2.5 px-2 font-semibold text-right">Growth</th>
              <th className="py-2.5 px-3 font-semibold w-24 sm:w-28 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-[#1E2A35]/40 font-medium">
            {tools.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                  No calculators configured or active in registry.
                </td>
              </tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0D141F]/40 transition-colors">
                  <td className="py-3 px-2 text-slate-400 text-[11px] font-semibold">
                    {tool.rank}
                  </td>

                  <td className="py-3 px-2">
                    <Link
                      to={tool.path}
                      className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold hover:text-[#FF6B00] transition-colors"
                    >
                      <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                        {getToolIcon(tool.id)}
                      </span>
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  </td>

                  <td className="py-3 px-2 text-right font-bold text-slate-900 dark:text-white">
                    {tool.usage}
                  </td>

                  <td className="py-3 px-2 text-right">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {tool.growth}
                    </span>
                  </td>

                  {/* Relative usage visual bar */}
                  <td className="py-3 px-3">
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tool.barColor}`}
                        style={{ width: `${tool.barPercent}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
