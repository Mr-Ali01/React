import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { adminDashboardService } from '../../services/adminDashboardService';

export default function RecentUsersTable() {
  const [users, setUsers] = useState(() => adminDashboardService.getRecentUsers());

  useEffect(() => {
    const handleUpdate = () => {
      setUsers(adminDashboardService.getRecentUsers());
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

  return (
    <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Users
          </h2>
        </div>

        <Link
          to="/admin/users"
          className="text-xs font-bold text-[#FF6B00] hover:text-[#EA580C] hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#1E2A35]/60 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <th className="py-2.5 px-2 font-semibold w-8">#</th>
              <th className="py-2.5 px-2 font-semibold">Name</th>
              <th className="py-2.5 px-2 font-semibold">Email</th>
              <th className="py-2.5 px-2 font-semibold">University</th>
              <th className="py-2.5 px-2 font-semibold">Join Date</th>
              <th className="py-2.5 px-2 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-[#1E2A35]/40 font-medium">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                  No registered users found in local records.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0D141F]/40 transition-colors">
                  <td className="py-3 px-2 text-slate-400 text-[11px] font-semibold">
                    {idx + 1}
                  </td>

                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${user.avatarBg}`}
                      >
                        {user.name.charAt(0)}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                    {user.email}
                  </td>

                  <td className="py-3 px-2 text-slate-700 dark:text-slate-300 truncate">
                    {user.university}
                  </td>

                  <td className="py-3 px-2 text-slate-400 dark:text-slate-500 text-[11px] whitespace-nowrap">
                    {user.joinDate}
                  </td>

                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {user.status}
                    </span>
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
