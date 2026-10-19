import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  GraduationCap,
  ChevronDown,
  Calculator,
  Binary,
  Percent,
  Target,
  FileCheck,
  PieChart,
  AlertTriangle,
  Layers,
  Award,
  FileText,
  BookOpen,
  Sun,
  Moon,
  ArrowRight,
  Menu,
  LayoutDashboard
} from 'lucide-react';
import { authService } from '../../services/authService';

export default function Header({ onOpenMobileMenu }) {
  const { theme, toggleTheme } = useTheme();
  const isAuthenticated = authService.isAuthenticated();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
          aria-label="ResultPoint Home"
        >
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white shadow-accent transition-transform duration-300 group-hover:scale-105 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[17px] font-extrabold tracking-tight text-text-h leading-none">
              Result<span className="text-accent">Point</span>
            </span>
            <span className="text-[9.5px] font-medium tracking-tight text-text-light mt-0.5">
              Calculate. Analyze. Improve.
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 text-[13.5px] font-medium" aria-label="Primary Navigation">
          <div className="relative group">
            <Link to="/calculators" className="text-text-m hover:text-text-h flex items-center gap-1 py-1.5 transition-colors">
              <span>Calculators</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </Link>
            <div className="absolute left-0 top-full mt-1.5 w-56 rounded-2xl bg-card border border-border p-2 shadow-theme opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <Link to="/calculators/cgpa" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <Calculator className="w-4 h-4 text-accent" />
                <span>CGPA Calculator</span>
              </Link>
              <Link to="/calculators/sgpa" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <GraduationCap className="w-4 h-4 text-brandGreen" />
                <span>SGPA Calculator</span>
              </Link>
              <Link to="/calculators/gpa" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <Binary className="w-4 h-4 text-brandPurple" />
                <span>GPA Calculator</span>
              </Link>
              <Link to="/calculators/percentage" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <Percent className="w-4 h-4 text-brandAmber" />
                <span>Percentage Calculator</span>
              </Link>
              <Link to="/calculators/target-cgpa" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <Target className="w-4 h-4 text-brandPink" />
                <span>Target CGPA Calculator</span>
              </Link>
              <Link to="/calculators/grade" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <FileCheck className="w-4 h-4 text-brandBlue" />
                <span>Grade Calculator</span>
              </Link>
            </div>
          </div>

          <Link to="/universities" className="text-text-m hover:text-text-h transition-colors">
            Universities
          </Link>

          {/* <div className="relative group">
            <Link to="/tools" className="text-text-m hover:text-text-h flex items-center gap-1 py-1.5 transition-colors">
              <span>Tools</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </Link>
            <div className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl bg-card border border-border p-2 shadow-theme opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <Link to="/calculators/result-analysis" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <PieChart className="w-4 h-4 text-brandAmber" />
                <span>Result Analyzer</span>
              </Link>
              <Link to="/calculators/backlog" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <AlertTriangle className="w-4 h-4 text-brandPink" />
                <span>Backlog Calculator</span>
              </Link>
              <Link to="/calculators/credite-calculate" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <Layers className="w-4 h-4 text-brandBlue" />
                <span>Credits Calculator</span>
              </Link>
              <Link to="/calculators/marks-grade" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <Award className="w-4 h-4 text-brandGreen" />
                <span>Marks to Grade</span>
              </Link>
            </div>
          </div> */}

          <div className="relative group">
            <Link to="/resources" className="text-text-m hover:text-text-h flex items-center gap-1 py-1.5 transition-colors">
              <span>Resources</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </Link>
            <div className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl bg-card border border-border p-2 shadow-theme opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <Link to="/resources/previous-year" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <FileText className="w-4 h-4 text-accent" />
                <span>Previous Papers</span>
              </Link>
              <Link to="/resources#study-materials" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <BookOpen className="w-4 h-4 text-brandBlue" />
                <span>Study Materials</span>
              </Link>
              <Link to="/resources/details" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors">
                <BookOpen className="w-4 h-4 text-brandBlue" />
                <span>University Guides</span>
              </Link>
            </div>
          </div>

          <Link to="/about" className="text-text-m hover:text-text-h transition-colors">About</Link>
          <Link to="/contact" className="text-text-m hover:text-text-h transition-colors">Contact</Link>
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-accent" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-white bg-accent hover:bg-accent-hover shadow-accent active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Student Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex text-xs sm:text-[13px] font-semibold text-text-h hover:text-accent px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
              >
                Login
              </Link>

              <Link
                to="/signup?tab=signup"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-4.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-white bg-accent hover:bg-accent-hover shadow-accent active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}

          <button
            onClick={onOpenMobileMenu}
            type="button"
            aria-label="Open navigation menu"
            className="lg:hidden w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-text-h hover:border-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}