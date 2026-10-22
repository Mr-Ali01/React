import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowLeftRight,
  Clock,
  PieChart,
  FileCheck,
  FileSearch,
  Bookmark,
  Calendar,
  HelpCircle,
  FileDown,
  Bell,
  Calculator,
  GraduationCap,
  Percent,
  Layers,
  Target,
  ArrowLeft,
  Mail,
  Sparkles,
  CheckCircle2,
  Home,
  ChevronRight
} from 'lucide-react';
import { toolManagementService } from '../../services/toolManagementService';
import { TOOLS_DATA } from '../../data/toolsData';
import { useToast } from '../../context/ToastContext';

// Dynamic icon resolver matching TOOLS_DATA icon names
const ICON_MAP = {
  TrendingUp,
  ArrowLeftRight,
  Clock,
  PieChart,
  FileCheck,
  FileSearch,
  Bookmark,
  Calendar,
  HelpCircle,
  FileDown,
  Bell,
  Calculator,
  GraduationCap,
  Percent,
  Layers,
  Target
};

// Four student-profile-dependent tools requiring backend authentication & database persistence
const PROFILE_DEPENDENT_TOOL_IDS = [
  'cgpa-predictor',
  'performance-trend',
  'study-planner',
  'semester-planner'
];

// Rich descriptions of planned capabilities for each tool
const TOOL_CAPABILITIES = {
  'cgpa-predictor': 'Multi-semester GPA forecasting, what-if scenario simulations, and probabilistic cumulative projection based on target performance.',
  'sgpa-to-cgpa': 'Direct aggregation of multiple semester SGPAs and credit weightings into cumulative CGPA without entering individual subject grades.',
  'study-planner': 'Weekly study timetable scheduler, syllabus milestone tracking, and pacing goals ahead of university examination schedules.',
  'performance-trend': 'Visual semester-over-semester grade trajectory, subject credit distributions, and performance velocity analytics.',
  'gpa-scale-converter': 'Instant bidirectional conversion across 10-point Indian, 4.0 US GPA, 5.0, 7.0, and international evaluation scales.',
  'grade-predictor': 'Compute minimum scores required in internal assessments and university end-semester examinations to secure your desired grade.',
  'attendance-calculator': 'Bunk/attendance calculator to track lectures attended, missed classes, and requirements to maintain the statutory 75% threshold.',
  'semester-planner': 'Academic load balancing, elective selection manager, and prerequisite tracking aligned to your degree graduation roadmap.',
  'cgpa-info-finder': 'Interactive knowledge base on university CBCS grading regulations, grace marks criteria, re-evaluation protocols, and honours rules.',
  'result-pdf-generator': 'One-click generation of professional semester grade cards, academic performance summaries, and verified transcripts in PDF format.',
  'cgpa-improvement': 'Personalized academic remediation strategies, grade replacement impact analysis, and backlog clearing plans to boost your standing.'
};

export default function PlaceholderToolPage({ toolId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Resolve tool metadata from prop, route path, or fallback to TOOLS_DATA
  const tool =
    (toolId ? toolManagementService.getToolById(toolId) : null) ||
    toolManagementService.getToolByRoute(location.pathname) ||
    TOOLS_DATA.find((t) => t.id === toolId || t.route === location.pathname) || {
      id: toolId || 'unknown-tool',
      name: 'Academic Tool',
      category: 'Academic Tools',
      description: 'This academic tool is currently under active development.',
      icon: 'Calculator',
      iconColor: 'blue'
    };

  const isProfileDependent = PROFILE_DEPENDENT_TOOL_IDS.includes(tool.id);
  const plannedPhase = isProfileDependent ? 'Phase 4 (Student Profile & Cloud Sync)' : 'Phase 3.1 (Standalone Calculator)';
  const statusBadge = isProfileDependent ? 'Requires Student Profile' : 'Under Development';
  const capabilityText = TOOL_CAPABILITIES[tool.id] || tool.description;

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(() => {
    try {
      return localStorage.getItem(`rp_notify_${tool.id}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }

    try {
      localStorage.setItem(`rp_notify_${tool.id}`, 'true');
    } catch {
      // Ignore storage errors
    }

    setSubscribed(true);
    showToast(`You're on the list! We'll notify you when ${tool.name} launches.`);
  };

  const IconComponent = ICON_MAP[tool.icon] || Calculator;

  return (
    <div className="min-h-[75vh] flex flex-col justify-start">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li>
              <Link to="/calculators" className="hover:text-accent transition-colors">Calculators & Tools</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h truncate max-w-[180px] sm:max-w-none" aria-current="page">
              {tool.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-grow">
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Top Badges & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-[#1E2A35]">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-accent border border-accent/20">
                {tool.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {statusBadge}
              </span>
            </div>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Planned Release: <strong className="text-slate-900 dark:text-slate-100">{plannedPhase}</strong>
            </span>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-accent border border-orange-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {tool.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-3 h-3" />
                  Coming Soon
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {tool.description}
              </p>
            </div>
          </div>

          {/* Planned Capabilities Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] space-y-3 text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Planned Capabilities & Design
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {capabilityText}
            </p>
            {isProfileDependent && (
              <p className="text-xs text-amber-700 dark:text-amber-400/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <strong>Backend Dependency:</strong> This feature requires secure authentication, academic record persistence, and student profile syncing via Spring Boot backend APIs.
              </p>
            )}
          </div>

          {/* Waitlist / Early Notification Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent border border-accent/25 space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Be notified when {tool.name} is ready
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Get early access and updates when this calculator goes live.
                </p>
              </div>
            </div>

            {subscribed ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You're on the early access notification list. We'll email you at launch!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-md">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your student email..."
                  className="calc-input flex-grow px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm shrink-0"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-[#1E2A35]">
            <Link
              to="/calculators"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#222E3C] bg-slate-50 dark:bg-[#161B22] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-accent hover:text-accent transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Calculators Directory</span>
            </Link>

            <Link
              to="/"
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-accent transition-colors"
            >
              Return to Home
            </Link>
          </div>

          {/* Available Core Calculators Section */}
          <div className="pt-4 space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Calculators Available Today
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Link
                to="/calculators/cgpa"
                className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent bg-slate-50/50 dark:bg-[#161B22]/50 hover:bg-orange-500/5 transition-all group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-accent">
                  CGPA Calculator
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculate semester CGPA
                </div>
              </Link>

              <Link
                to="/calculators/sgpa"
                className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent bg-slate-50/50 dark:bg-[#161B22]/50 hover:bg-orange-500/5 transition-all group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-accent">
                  SGPA Calculator
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Single semester GPA
                </div>
              </Link>

              <Link
                to="/calculators/percentage"
                className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent bg-slate-50/50 dark:bg-[#161B22]/50 hover:bg-orange-500/5 transition-all group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-accent">
                  Percentage Calc
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Convert marks to %
                </div>
              </Link>

              <Link
                to="/calculators/credit-calculate"
                className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent bg-slate-50/50 dark:bg-[#161B22]/50 hover:bg-orange-500/5 transition-all group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-accent">
                  Credits Calculator
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Degree credit tracker
                </div>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
