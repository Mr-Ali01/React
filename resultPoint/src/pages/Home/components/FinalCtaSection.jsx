import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth/authSlice';
import { authService } from '../../../services/authService';

export default function FinalCtaSection() {
  const reduxIsAuth = useAppSelector(selectIsAuthenticated);
  const reduxUser = useAppSelector(selectCurrentUser);
  const serviceUser = authService.getCurrentUser();
  const currentUser = reduxUser || serviceUser;
  const isAuthenticated = Boolean((reduxIsAuth && currentUser) || authService.isAuthenticated());

  const isStudent = isAuthenticated && currentUser?.role === 'student';
  const isAdmin = isAuthenticated && currentUser?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';
  const dashboardLabel = isAdmin ? 'Go to Admin' : 'Go to Dashboard';

  return (
    <section id="final-cta" className="py-12 sm:py-16 bg-bg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FF6B00] via-[#FF7A18] to-[#EA580C] p-6 sm:p-10 lg:p-12 text-white shadow-brand">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl text-left space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10.5px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>START YOUR ACADEMIC JOURNEY</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Ready to Understand Your Results?
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xl">
                Calculate your academic performance and explore tools designed for your university.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {isStudent || isAdmin ? (
                <>
                  <Link
                    to={dashboardPath}
                    id="cta-go-to-dashboard-btn"
                    className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-text-h bg-white hover:bg-slate-50 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-accent" />
                    <span>{dashboardLabel}</span>
                  </Link>

                  <Link
                    to="/calculators"
                    className="px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-white border border-white/40 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Calculate Results →</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/calculators"
                    className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-text-h bg-white hover:bg-slate-50 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Calculate Your Result</span>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </Link>

                  <Link
                    to="/signup?tab=signup"
                    id="cta-signup-btn"
                    className="px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-white border border-white/40 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign Up Free →</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}