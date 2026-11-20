import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Activity,
  Layers,
  ShieldCheck,
  Database,
  CheckCircle2,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-950 rounded-2xl p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-semibold uppercase tracking-wider">
            Foundation Ready
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Acadlytic Platform Foundation
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            The multi-tenant academic intelligence and longitudinal records platform for university-affiliated colleges.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            {isAuthenticated && user ? (
              <Link
                to={user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/college/dashboard'}
              >
                <Button
                  size="lg"
                  className="bg-sky-500 hover:bg-sky-600 focus:ring-sky-400 font-semibold gap-2 shadow-lg"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Open {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'College'} Portal
                </Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button
                  size="lg"
                  className="bg-sky-500 hover:bg-sky-600 focus:ring-sky-400 font-semibold gap-2 shadow-lg"
                >
                  <LogIn className="h-5 w-5" />
                  Sign In to Portal
                </Button>
              </Link>
            )}

            <Link to="/health">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 font-semibold gap-2"
              >
                <Activity className="h-5 w-5" />
                Live API &amp; Database Health
              </Button>
            </Link>

            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="border-sky-400/40 text-white hover:bg-white/10"
              >
                OpenAPI Docs
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Grid of Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Modular Monolith Backend">
          <div className="flex items-start gap-3 mt-2 text-sm text-slate-600">
            <Layers className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <p>
              Spring Boot 3 + Java 21 REST API foundation with clean package modularity, OpenAPI documentation, and centralized exception handling.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Profile: dev / prod</span>
            <span className="font-mono text-sky-600 font-medium">port: 8080</span>
          </div>
        </Card>

        <Card title="Modern React Frontend">
          <div className="flex items-start gap-3 mt-2 text-sm text-slate-600">
            <ShieldCheck className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p>
              React 18 + Vite + TypeScript + Tailwind CSS with TanStack Query server-state synchronization and layout routing.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Axios Interceptors</span>
            <span className="font-mono text-indigo-600 font-medium">port: 5173</span>
          </div>
        </Card>

        <Card title="Transactional MySQL 8">
          <div className="flex items-start gap-3 mt-2 text-sm text-slate-600">
            <Database className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              InnoDB transactional storage engine, utf8mb4 unicode charset, UTC timestamps, and Flyway migration versioning.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Flyway Migrations</span>
            <span className="font-mono text-emerald-600 font-medium">port: 3306</span>
          </div>
        </Card>
      </div>

      {/* MVP Scope Summary */}
      <Card title="Active MVP Implementation Baseline">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Two Active User Roles: SUPER_ADMIN &amp; COLLEGE_ADMIN</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Multi-Tenant College Isolation (college_id)</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Stateful Session Cookies + CSRF Protection</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Post-MVP Extensions Preserved (Staff &amp; Student Portal)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
