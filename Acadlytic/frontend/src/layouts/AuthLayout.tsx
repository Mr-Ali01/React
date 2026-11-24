import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isRegisterCollege = location.pathname.includes('/auth/register-college');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Link */}
      <div
        className={clsx(
          'text-center sm:mx-auto sm:w-full',
          isRegisterCollege ? 'sm:max-w-3xl' : 'sm:max-w-md'
        )}
      >
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md group-hover:bg-sky-700 transition-colors">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
            Acadlytic
          </span>
        </Link>
        <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          Academic Intelligence Platform
        </p>
      </div>

      {/* Main Form Outlet */}
      <div
        className={clsx(
          'mt-6 sm:mx-auto sm:w-full transition-all duration-200',
          isRegisterCollege ? 'sm:max-w-3xl' : 'sm:max-w-md'
        )}
      >
        <div className="bg-white py-8 px-4 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          <Outlet />
        </div>
      </div>

      {/* Security Footer */}
      <div className="text-center text-xs text-slate-400 mt-8 space-y-1">
        <div className="inline-flex items-center gap-1.5 text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Stateful HTTP-only session cookies with CSRF defense</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Acadlytic. All rights reserved.
        </div>
      </div>
    </div>
  );
};
