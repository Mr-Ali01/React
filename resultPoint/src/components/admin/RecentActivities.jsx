import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { adminDashboardService } from '../../services/adminDashboardService';

export default function RecentActivities() {
  const [activities, setActivities] = useState(() => adminDashboardService.getRecentActivities());

  useEffect(() => {
    const handleUpdate = () => {
      setActivities(adminDashboardService.getRecentActivities());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('activity_history_updated', handleUpdate);
    window.addEventListener('rp_catalog_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('activity_history_updated', handleUpdate);
      window.removeEventListener('rp_catalog_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Activities
          </h2>
        </div>

        <Link
          to="/admin/settings"
          className="text-xs font-bold text-[#FF6B00] hover:text-[#EA580C] hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Timeline List */}
      <div className="pt-3 space-y-3.5 relative before:absolute before:left-2 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs pl-2">
            No activity events recorded yet.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-3 pl-6 text-xs group">
              {/* Timeline Color Dot */}
              <span
                className={`absolute left-0.5 top-1.5 w-3 h-3 rounded-full ${act.iconColor} ring-4 ring-white dark:ring-[#111418] shrink-0 transition-transform group-hover:scale-125`}
              />

              {/* Event Description & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                    {act.time}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {act.detail}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
