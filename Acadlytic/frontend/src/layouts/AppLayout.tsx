import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { ShieldCheck, Database } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="flex-1 flex w-full">
        {isAuthenticated && <Sidebar />}

        <main className="flex-1 min-w-0 py-6">
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            &copy; {new Date().getFullYear()} Acadlytic Platform. Academic
            Intelligence for Affiliated Colleges.
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> Multi-Tenant
              Ready
            </span>
            <span className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-emerald-600" /> MySQL 8
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
