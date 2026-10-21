import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  Wrench,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  ArrowUpRight,
  Quote,
  LayoutDashboard
} from 'lucide-react';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth/authSlice';
import { authService } from '../../../services/authService';

function Counter({ target, decimals = 0, duration = 1500 }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = null;
    let frame;
    const animate = (time) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setVal(target);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <span>{val.toFixed(decimals)}</span>;
}

export default function Hero() {
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
    <section id="hero" className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {isStudent || isAdmin ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold text-text-h bg-accent/10 border border-accent/30 shadow-xs mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Logged in as {currentUser.fullName || (isAdmin ? 'Administrator' : 'Student')} • {isAdmin ? 'Admin' : 'Student'} Session</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25 shadow-xs mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>ACADEMIC PERFORMANCE PLATFORM</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-black text-text-h tracking-tight leading-[1.14]">
              Calculate Your <span className="text-accent">Results.</span><br />
              Understand Your <span className="text-accent">Performance.</span><br />
              Improve Your <span className="text-accent">Academic Journey.</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-text-m max-w-xl leading-relaxed">
              Calculate SGPA, CGPA, GPA and percentage using university-specific grading systems. Understand your
              academic performance and discover the right tools to improve.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              {isStudent || isAdmin ? (
                <>
                  <Link
                    to={dashboardPath}
                    id="hero-go-to-dashboard-btn"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-accent hover:bg-accent-hover shadow-accent active:scale-95 transition-all text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{dashboardLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/calculators"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-text-h border border-border bg-card hover:bg-bg-sec active:scale-95 transition-all text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span>Calculate Your Result</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/calculators"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-accent hover:bg-accent-hover shadow-accent active:scale-95 transition-all text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span>Calculate Your Result</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/login"
                    id="hero-login-btn"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-text-h border border-border bg-card hover:bg-bg-sec active:scale-95 transition-all text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span>Login / Sign Up</span>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-border/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-text-h leading-tight">
                    <Counter target={10} />+
                  </div>
                  <div className="text-[11px] text-text-light">Calculators</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-text-h leading-tight">
                    <Counter target={20} />+
                  </div>
                  <div className="text-[11px] text-text-light">Academic Tools</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-text-h leading-tight">
                    <Counter target={50} />+
                  </div>
                  <div className="text-[11px] text-text-light">University Resources</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-text-h leading-tight flex items-center gap-1">
                    <Counter target={4.8} decimals={1} />
                    <span className="text-xs text-brandGreen font-bold">★</span>
                  </div>
                  <div className="text-[11px] text-text-light">Student Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-theme p-5 sm:p-6 overflow-hidden text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center text-white text-[10px]">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-text-h tracking-tight">ResultPoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-light">Academic Progress</span>
                  <span className="w-2 h-2 rounded-full bg-brandGreen animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-m">Your Academic Overview</h3>
                <div className="text-[10.5px] text-text-light">Last updated: Semester 5 Final</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-bg-sec border border-border/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-text-m">CGPA</span>
                    <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-brandGreen flex items-center justify-center text-[10px]">
                      <Award className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-brandGreen font-mono leading-none">8.24</div>
                  <div className="text-[9.5px] font-bold text-brandGreen flex items-center gap-0.5">
                    <ArrowUpRight className="w-2.5 h-2.5" /> +0.42 from Sem 4
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-bg-sec border border-border/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-text-m">SGPA</span>
                    <span className="w-5 h-5 rounded-md bg-purple-500/10 text-brandPurple flex items-center justify-center text-[10px]">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-brandPurple font-mono leading-none">8.18</div>
                  <div className="text-[9.5px] font-bold text-brandGreen flex items-center gap-0.5">
                    <ArrowUpRight className="w-2.5 h-2.5" /> +0.36 from Sem 4
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-bg-sec/70 border border-border/70 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-h">Semester Performance</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-brandGreen border border-brandGreen/20">
                    +15% Improving
                  </span>
                </div>

                <div className="h-28 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 320 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7300" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#FF7300" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="#FF7300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="20,82 85,74 150,56 215,42 280,26" />
                    <polygon points="20,82 85,74 150,56 215,42 280,26 280,95 20,95" fill="url(#heroChartGradient)" opacity="0.25" />
                    <circle cx="20" cy="82" r="3.5" fill="#FF7300" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="85" cy="74" r="3.5" fill="#FF7300" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="150" cy="56" r="3.5" fill="#FF7300" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="215" cy="42" r="3.5" fill="#FF7300" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="280" cy="26" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.8" />
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] text-text-light font-medium px-2">
                  <span>S1</span>
                  <span>S2</span>
                  <span>S3</span>
                  <span>S4</span>
                  <span className="text-brandGreen font-bold">S5</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-bg-sec border border-border/50">
                  <span className="text-[9px] text-text-light block font-semibold">Target CGPA</span>
                  <span className="font-extrabold text-accent text-sm">8.50</span>
                </div>
                <div className="p-2 rounded-xl bg-bg-sec border border-border/50">
                  <span className="text-[9px] text-text-light block font-semibold">Best Sem</span>
                  <span className="font-extrabold text-brandBlue text-sm">8.92</span>
                </div>
                <div className="p-2 rounded-xl bg-bg-sec border border-border/50">
                  <span className="text-[9px] text-text-light block font-semibold">Total Credits</span>
                  <span className="font-extrabold text-text-h text-sm">106</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[10.5px]">
                <span className="text-accent font-semibold italic flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  "Small Steps, Big Academic Progress."
                </span>
                <GraduationCap className="w-4 h-4 text-text-light" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}