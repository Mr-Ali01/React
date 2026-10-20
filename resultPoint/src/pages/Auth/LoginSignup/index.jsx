import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Calculator,
  BarChart2,
  Star,
  Shield,
  Mail,
  Lock,
  User,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Users,
  Key,
  X,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { authService } from '../../../services/authService';
import ThemeToggle from '../../../components/ThemeToggle';

export default function LoginSignup() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('login');
  const [loginRole, setLoginRole] = useState('student'); // 'student' | 'admin'

  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
  const [signupForm, setSignupForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', terms: false });

  // Error States
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});

  // Visibility Toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modals
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [policyModal, setPolicyModal] = useState({ open: false, title: '', content: '' });

  // Submitting States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setActiveTab('signup');
    }
    if (searchParams.get('role') === 'admin') {
      setLoginRole('admin');
    }
  }, [searchParams]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  // Login Submit Handler
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!loginForm.email.trim()) {
      errors.email = `${loginRole === 'admin' ? 'Administrator' : 'Student'} email is required.`;
    } else if (!validateEmail(loginForm.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!loginForm.password) {
      errors.password = 'Password is required.';
    } else if (loginForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      const res = authService.login({
        email: loginForm.email,
        password: loginForm.password
      });

      if (res.success) {
        if (loginRole === 'admin') {
          if (res.user.role !== 'admin') {
            setLoginErrors({ general: 'This account does not have administrator privileges. Please switch to Student Login.' });
            showToast('Access denied: Administrator privileges required.');
            return;
          }
          showToast(`Welcome to Admin Panel, ${res.user.fullName}!`);
          navigate('/admin/dashboard');
        } else {
          // Student role flow
          if (res.user.role === 'admin') {
            showToast(`Administrator account authenticated. Navigating to Admin Dashboard...`);
            navigate('/admin/dashboard');
          } else {
            showToast(`Welcome back, ${res.user.fullName}!`);
            if (!res.user.hasCompletedProfile) {
              navigate('/student/profile-setup');
            } else {
              navigate('/student/dashboard');
            }
          }
        }
      } else {
        setLoginErrors({ general: res.error });
        showToast(res.error);
      }
    }, 600);
  };

  // Sign Up Submit Handler
  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!signupForm.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (!signupForm.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!validateEmail(signupForm.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!signupForm.password) {
      errors.password = 'Password is required.';
    } else if (signupForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!signupForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (signupForm.confirmPassword !== signupForm.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!signupForm.terms) {
      errors.terms = 'You must accept the terms to create an account.';
    }

    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSigningUp(true);
    setTimeout(() => {
      setIsSigningUp(false);
      const res = authService.register({
        fullName: signupForm.fullName,
        email: signupForm.email,
        password: signupForm.password
      });

      if (res.success) {
        showToast(`Account successfully created! Please configure your academic profile.`);
        if (!res.user.hasCompletedProfile) {
          navigate('/student/profile-setup');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        setSignupErrors({ email: res.error, general: res.error });
        showToast(res.error);
      }
    }, 600);
  };

  const handleSocialLogin = (provider) => {
    showToast(`Connecting to ${provider}...`);
    setTimeout(() => {
      authService.initialize();
      const user = authService.getCurrentUser();
      showToast(`${provider} authorization successful! Welcome, ${user?.fullName || 'Student'}!`);
      navigate('/student/dashboard');
    }, 700);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setForgotModalOpen(false);
    showToast(`Password reset link sent to ${resetEmail || 'your email'}.`);
    setResetEmail('');
  };

  const openPolicy = (type) => {
    setPolicyModal({
      open: true,
      title: type === 'terms' ? 'Terms of Service' : 'Privacy Policy',
      content:
        type === 'terms'
          ? 'By using ResultPoint, you agree to accurate usage of university GPA calculations and our local evaluation tools.'
          : 'ResultPoint respects student academic privacy. Your calculations are performed client-side and never sold to third parties.'
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text-h flex flex-col antialiased selection:bg-accent selection:text-white relative overflow-x-hidden">
      {/* ==================== MINIMAL AUTH HEADER ==================== */}
      <header className="w-full border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Main Logo & ResultPoint Branding */}
          <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none" aria-label="ResultPoint Home">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-accent transition-transform group-hover:scale-105 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="text-[19px] font-extrabold tracking-tight text-text-h leading-none">
                Result<span className="text-accent">Point</span>
              </div>
              <span className="text-[10px] font-medium tracking-tight text-text-light mt-1">
                Calculate. Analyze. Improve.
              </span>
            </div>
          </Link>

          {/* Theme Toggle Button ONLY */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ==================== MAIN AUTHENTICATION CONTAINER ==================== */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-5 lg:p-8 relative">
        {/* Background Ambient Aura */}
        <div className="fixed top-0 right-0 w-[550px] h-[550px] bg-orange-400/5 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="fixed bottom-0 left-0 w-[550px] h-[550px] bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Main Card Container */}
        <div className="w-full max-w-[1440px] bg-card rounded-3xl border border-border shadow-theme overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px] lg:min-h-[740px] relative z-10">

        {/* ==================== LEFT BRAND & PROMOTIONAL PANEL ==================== */}
        <div className="lg:col-span-6 bg-accent-soft/30 dark:bg-amber-950/20 border-b lg:border-b-0 lg:border-r border-border p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between relative overflow-hidden text-left">
          <div className="space-y-4 sm:space-y-5 max-w-xl z-10">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none" aria-label="ResultPoint Home">
              <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-accent transition-transform group-hover:scale-105 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="text-[19px] font-extrabold tracking-tight text-text-h leading-none">
                  Result<span className="text-accent">Point</span>
                </div>
                <span className="text-[10px] font-medium tracking-tight text-text-light mt-1">
                  Calculate. Analyze. Improve.
                </span>
              </div>
            </Link>

            {/* Welcome Pill */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-accent bg-card border border-accent/25 shadow-subtle">
                <span>🎓</span>
                <span>Welcome to ResultPoint</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-text-h tracking-tight leading-[1.12]">
              Your Academic<br />
              <span className="text-accent">Success Partner</span>
            </h1>

            <p className="text-xs sm:text-sm text-text-m leading-relaxed max-w-[500px]">
              Join thousands of students who calculate, analyze, and track their academic performance accurately with official university regulations.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0 border border-accent/20 shadow-subtle transition-transform group-hover:scale-105">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-text-h leading-snug">Access All Calculators</h2>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">University-specific regulation calculators for accurate scores</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0 border border-accent/20 shadow-subtle transition-transform group-hover:scale-105">
                  <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-text-h leading-snug">Track Your Progress</h2>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">Save, model, and analyze multi-semester trends</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0 border border-accent/20 shadow-subtle transition-transform group-hover:scale-105">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-text-h leading-snug">Personalized Planning</h2>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">Plan target graduation GPAs and clearance schedules</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0 border border-accent/20 shadow-subtle transition-transform group-hover:scale-105">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-text-h leading-snug">100% Free to Use</h2>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">All academic conversion and calculation tools are open</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Illustration Banner */}
          <div className="relative mt-8 sm:mt-10 pt-4 flex items-end justify-between">
            <div className="z-20 select-none text-left mb-2 sm:mb-4">
              <span className="text-text-h text-lg sm:text-xl font-bold leading-tight block italic">
                Better Students<br />
                Brighter Futures
              </span>
            </div>
            <div className="w-24 h-24 rounded-2xl bg-accent text-white flex items-center justify-center shadow-accent ml-auto">
              <GraduationCap className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* ==================== RIGHT AUTHENTICATION PANEL ==================== */}
        <div className="lg:col-span-6 bg-card p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between text-left">
          <div>
            {/* Tabs Toggle */}
            <div className="w-full grid grid-cols-2 rounded-2xl bg-bg-sec p-1.5 mb-7 sm:mb-9 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`py-3 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${activeTab === 'login'
                    ? 'shadow-subtle bg-card text-accent border-b-2 border-accent'
                    : 'text-text-m hover:text-text-h'
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`py-3 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${activeTab === 'signup'
                    ? 'shadow-subtle bg-card text-accent border-b-2 border-accent'
                    : 'text-text-m hover:text-text-h'
                  }`}
              >
                Sign Up
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                {/* Role Selection Selector */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-m mb-2 flex items-center justify-between">
                    <span>Select Login Role</span>
                    <span className="text-[10px] font-semibold text-accent capitalize">
                      {loginRole === 'admin' ? 'Admin Portal' : 'Student Portal'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-bg-sec border border-border gap-1.5">
                    <button
                      type="button"
                      id="role-select-student"
                      onClick={() => {
                        setLoginRole('student');
                        setLoginErrors({});
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        loginRole === 'student'
                          ? 'bg-accent text-white shadow-subtle'
                          : 'text-text-m hover:text-text-h hover:bg-card/70'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span>Student Login</span>
                    </button>
                    <button
                      type="button"
                      id="role-select-admin"
                      onClick={() => {
                        setLoginRole('admin');
                        setLoginErrors({});
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        loginRole === 'admin'
                          ? 'bg-text-h text-card dark:text-bg-main shadow-subtle'
                          : 'text-text-m hover:text-text-h hover:bg-card/70'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Admin Login</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-4 sm:mb-5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
                    {loginRole === 'admin' ? 'Admin Portal Login' : 'Welcome Back'}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-m">
                    {loginRole === 'admin'
                      ? 'Sign in to access platform management, academic catalogs, and grading rules'
                      : 'Login to access your student results, calculators, and academic progress'}
                  </p>
                </div>

                {loginErrors.general && (
                  <div className="p-3 rounded-xl bg-brandPink/15 border border-brandPink/30 text-brandPink text-xs font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginErrors.general}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} noValidate className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-text-h mb-1.5">
                      {loginRole === 'admin' ? 'Administrator Email' : 'Student Email'}{' '}
                      <span className="text-brandPink font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-text-light pointer-events-none" />
                      <input
                        type="email"
                        id="login-email-input"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder={
                          loginRole === 'admin'
                            ? 'Enter administrator email address'
                            : 'Enter your student email address'
                        }
                        className="calc-input w-full pl-10 pr-3.5 py-3 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm text-text-h"
                      />
                    </div>
                    {loginErrors.email && <p className="text-[11px] text-brandPink mt-1 font-medium">{loginErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-text-h mb-1.5">
                      Password <span className="text-brandPink font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-text-light pointer-events-none" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        id="login-password-input"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="Enter your password"
                        className="calc-input w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm text-text-h"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-light hover:text-text-h focus:outline-none"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && <p className="text-[11px] text-brandPink mt-1 font-medium">{loginErrors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={loginForm.remember}
                        onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                        className="w-4 h-4 rounded text-accent focus:ring-accent border-border cursor-pointer"
                      />
                      <span className="font-medium text-text-h text-xs">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="font-semibold text-accent hover:underline text-xs focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="pt-1.5">
                    <button
                      type="submit"
                      id="login-submit-button"
                      disabled={isLoggingIn}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 ${
                        loginRole === 'admin'
                          ? 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-subtle'
                          : 'bg-accent hover:bg-accent-hover shadow-accent'
                      }`}
                    >
                      <span>
                        {isLoggingIn
                          ? 'Verifying...'
                          : loginRole === 'admin'
                          ? 'Sign In as Administrator'
                          : 'Sign In as Student'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Divider & Social Login (for Student) */}
                {loginRole === 'student' ? (
                  <>
                    <div className="relative my-5 flex items-center justify-center">
                      <div className="w-full border-t border-border"></div>
                      <span className="absolute px-3 bg-card text-[11px] text-text-light font-bold uppercase tracking-wider">
                        OR
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full py-3 px-3.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h font-semibold transition-all shadow-subtle flex items-center justify-center gap-2.5 active:scale-95"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12 5c1.54 0 2.9.55 3.97 1.45l2.97-2.97C17.15 1.8 14.77 1 12 1 7.42 1 3.51 3.6 1.62 7.37l3.65 2.83C6.15 7.43 8.84 5 12 5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-2 3.71-4.94 3.71-8.7z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.27 14.79c-.25-.74-.39-1.53-.39-2.35 0-.82.14-1.61.39-2.35L1.62 7.26C.59 9.32 0 11.59 0 14c0 2.41.59 4.68 1.62 6.74l3.65-2.83z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.07.72-2.45 1.16-4.22 1.16-3.16 0-5.85-2.43-6.73-5.2l-3.65 2.83C3.51 20.4 7.42 23 12 23z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Microsoft')}
                        className="w-full py-3 px-3.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h font-semibold transition-all shadow-subtle flex items-center justify-center gap-2.5 active:scale-95"
                      >
                        <span>Continue with Microsoft</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 p-3 rounded-xl bg-bg-sec border border-border text-[11px] text-text-m flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                    <span>Administrator login requires verified institution staff credentials.</span>
                  </div>
                )}

                <div className="text-center text-xs text-text-m pt-4">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="font-bold text-accent hover:underline ml-1 inline-flex items-center gap-0.5 focus:outline-none"
                  >
                    <span>Sign Up</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* SIGN UP FORM */}
            {activeTab === 'signup' && (
              <div className="space-y-4">
                <div className="space-y-1 mb-5 sm:mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
                    Create Your Account
                  </h2>
                  <p className="text-xs sm:text-sm text-text-m">
                    Start your academic journey with ResultPoint
                  </p>
                </div>

                <form onSubmit={handleSignupSubmit} noValidate className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-text-h mb-1">
                      Full Name <span className="text-brandPink font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-text-light pointer-events-none" />
                      <input
                        type="text"
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        className="calc-input w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm text-text-h"
                      />
                    </div>
                    {signupErrors.fullName && <p className="text-[11px] text-brandPink mt-1 font-medium">{signupErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-text-h mb-1">
                      Email Address <span className="text-brandPink font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-text-light pointer-events-none" />
                      <input
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        placeholder="Enter your email address"
                        className="calc-input w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm text-text-h"
                      />
                    </div>
                    {signupErrors.email && <p className="text-[11px] text-brandPink mt-1 font-medium">{signupErrors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-text-h mb-1">
                        Password <span className="text-brandPink font-bold">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3 text-text-light pointer-events-none" />
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          placeholder="Password"
                          className="calc-input w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-light hover:text-text-h"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {signupErrors.password && <p className="text-[11px] text-brandPink mt-1 font-medium">{signupErrors.password}</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-text-h mb-1">
                        Confirm <span className="text-brandPink font-bold">*</span>
                      </label>
                      <div className="relative">
                        <CheckCircle className="w-4 h-4 absolute left-3.5 top-3 text-text-light pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                          placeholder="Confirm"
                          className="calc-input w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-light hover:text-text-h"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && <p className="text-[11px] text-brandPink mt-1 font-medium">{signupErrors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={signupForm.terms}
                        onChange={(e) => setSignupForm({ ...signupForm, terms: e.target.checked })}
                        className="w-4 h-4 rounded text-accent focus:ring-accent border-border cursor-pointer mt-0.5"
                      />
                      <span className="text-text-m text-[11.5px] leading-snug">
                        I agree to the{' '}
                        <button type="button" onClick={() => openPolicy('terms')} className="text-accent font-bold hover:underline">
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button type="button" onClick={() => openPolicy('privacy')} className="text-accent font-bold hover:underline">
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                    {signupErrors.terms && <p className="text-[11px] text-brandPink mt-1 font-medium">{signupErrors.terms}</p>}
                  </div>

                  <div className="pt-1.5">
                    <button
                      type="submit"
                      disabled={isSigningUp}
                      className="w-full py-3 px-4 rounded-xl font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60"
                    >
                      <span>{isSigningUp ? 'Creating account...' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-border"></div>
                  <span className="absolute px-3 bg-card text-[11px] text-text-light font-bold uppercase tracking-wider">
                    OR
                  </span>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="w-full py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h font-semibold transition-all shadow-subtle flex items-center justify-center gap-2"
                  >
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Microsoft')}
                    className="w-full py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h font-semibold transition-all shadow-subtle flex items-center justify-center gap-2"
                  >
                    <span>Continue with Microsoft</span>
                  </button>
                </div>

                <div className="text-center text-xs text-text-m pt-3">
                  Already have an account?
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-accent hover:underline ml-1 inline-flex items-center gap-0.5 focus:outline-none"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-border/80">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              <div className="p-3 rounded-2xl bg-bg-sec/70 border border-border flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-h leading-tight">Secure & Private</h3>
                  <p className="text-[10px] text-text-m mt-0.5 leading-snug">
                    Academic records remain safe and confidential.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-bg-sec/70 border border-border flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-h leading-tight">Access Anywhere</h3>
                  <p className="text-[10px] text-text-m mt-0.5 leading-snug">
                    Use ResultPoint on any phone, tablet, or laptop.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-bg-sec/70 border border-border flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-h leading-tight">Student Community</h3>
                  <p className="text-[10px] text-text-m mt-0.5 leading-snug">
                    Trusted by students across Indian universities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-theme text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg text-text-m hover:text-text-h flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center mb-3">
              <Key className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-text-h">Reset Your Password</h3>
            <p className="text-xs text-text-m mt-1 leading-relaxed">
              Enter your registered email address and we will send instructions to reset your password.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="calc-input w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h placeholder:text-text-light"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-m hover:text-text-h"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover shadow-accent"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Privacy Policy Modal */}
      {policyModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
          onClick={() => setPolicyModal({ open: false, title: '', content: '' })}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-theme text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPolicyModal({ open: false, title: '', content: '' })}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg text-text-m hover:text-text-h flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-text-h">{policyModal.title}</h3>
            <p className="mt-2 text-xs text-text-m leading-relaxed">{policyModal.content}</p>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModal({ open: false, title: '', content: '' })}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}