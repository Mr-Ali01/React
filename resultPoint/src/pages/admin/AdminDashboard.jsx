import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  Building2,
  BookOpen,
  FileText,
  BarChart2,
  MessageSquare
} from 'lucide-react';
import { adminDashboardService } from '../../services/adminDashboardService';
import AdminWelcomeBanner from '../../components/admin/AdminWelcomeBanner';
import StatCard from '../../components/admin/StatCard';
import PlatformUsageChart from '../../components/admin/PlatformUsageChart';
import PopularToolsTable from '../../components/admin/PopularToolsTable';
import RecentUsersTable from '../../components/admin/RecentUsersTable';
import RecentActivities from '../../components/admin/RecentActivities';
import SystemOverview from '../../components/admin/SystemOverview';
import QuickManagementActions from '../../components/admin/QuickManagementActions';

export default function AdminDashboard() {
  const [stats, setStats] = useState(() => adminDashboardService.getStats());

  useEffect(() => {
    const handleUpdate = () => {
      setStats(adminDashboardService.getStats());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('rp_catalog_updated', handleUpdate);
    window.addEventListener('activity_history_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('rp_catalog_updated', handleUpdate);
      window.removeEventListener('activity_history_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  // Dynamic Date matching the reference image format ("Monday, 06 Oct 2026")
  const currentDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return 'Monday, 06 Oct 2026';
    }
  }, []);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* Top Bar with Date Indicator at Upper Right */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] text-xs font-semibold text-slate-500 dark:text-slate-400 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Row 1: Welcome Banner & Quote Card */}
      <AdminWelcomeBanner />

      {/* Row 2: Six Primary Platform Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Students"
          value={stats.totalStudents.value}
          growth={stats.totalStudents.growth}
          subtitle={stats.totalStudents.subtitle}
          icon={Users}
          iconBg="bg-blue-600"
          isPositive={true}
        />

        <StatCard
          title="Universities"
          value={stats.universities.value}
          growth={stats.universities.growth}
          subtitle={stats.universities.subtitle}
          icon={Building2}
          iconBg="bg-emerald-600"
          isPositive={true}
        />

        <StatCard
          title="Courses"
          value={stats.courses.value}
          growth={stats.courses.growth}
          subtitle={stats.courses.subtitle}
          icon={BookOpen}
          iconBg="bg-purple-600"
          isPositive={true}
        />

        <StatCard
          title="Calculations"
          value={stats.calculations.value}
          growth={stats.calculations.growth}
          subtitle={stats.calculations.subtitle}
          icon={FileText}
          iconBg="bg-[#FF6B00]"
          isPositive={true}
        />

        <StatCard
          title="Active Users"
          value={stats.activeUsers.value}
          growth={stats.activeUsers.growth}
          subtitle={stats.activeUsers.subtitle}
          icon={BarChart2}
          iconBg="bg-rose-500"
          isPositive={true}
        />

        <StatCard
          title="Support Queries"
          value={stats.supportQueries.value}
          growth={stats.supportQueries.growth}
          subtitle={stats.supportQueries.subtitle}
          icon={MessageSquare}
          iconBg="bg-teal-600"
          isPositive={false}
        />
      </div>

      {/* Row 3: Platform Usage Overview & Popular Calculators & Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <PlatformUsageChart />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <PopularToolsTable />
        </div>
      </div>

      {/* Row 4: Recent Users, Recent Activities, and System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <RecentUsersTable />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <RecentActivities />
        </div>
        <div className="lg:col-span-3 flex flex-col">
          <SystemOverview />
        </div>
      </div>

      {/* Row 5: Quick Management Actions */}
      <div className="pt-2">
        <QuickManagementActions />
      </div>
    </div>
  );
}
