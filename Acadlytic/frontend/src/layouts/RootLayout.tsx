import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, ShieldCheck, Database, LayoutDashboard } from 'lucide-react';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              A
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">Acadlytic</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 bg-sky-100 text-sky-800 rounded">
                Foundation v1.0
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>
            <Link
              to="/health"
              className="text-sm font-medium text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Activity className="h-4 w-4 text-emerald-600" />
              Health Test
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Acadlytic Platform. Academic Intelligence for Affiliated Colleges.</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> Multi-Tenant Ready</span>
            <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5 text-emerald-600" /> MySQL 8</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
