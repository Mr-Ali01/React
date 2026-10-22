import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Clock,
  ShieldAlert,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { toolManagementService, TOOL_UPDATED_EVENT } from '../../services/toolManagementService';
import { authService } from '../../services/authService';

/**
 * Route guard component that protects calculator pages from executing calculations
 * when a calculator is disabled or not applicable to the user's academic context.
 *
 * Ensures previously saved calculations remain safe and accessible.
 */
export default function CalculatorRouteGuard({ toolId, children }) {
  const location = useLocation();
  const [availability, setAvailability] = useState(() => {
    const user = authService.getCurrentUser();
    const context = user ? { universityId: user.universityId, courseId: user.courseId } : null;
    return toolManagementService.isToolAvailable(toolId || location.pathname, context);
  });

  useEffect(() => {
    const checkStatus = () => {
      const user = authService.getCurrentUser();
      const context = user ? { universityId: user.universityId, courseId: user.courseId } : null;
      setAvailability(toolManagementService.isToolAvailable(toolId || location.pathname, context));
    };

    window.addEventListener(TOOL_UPDATED_EVENT, checkStatus);
    window.addEventListener('storage', checkStatus);

    return () => {
      window.removeEventListener(TOOL_UPDATED_EVENT, checkStatus);
      window.removeEventListener('storage', checkStatus);
    };
  }, [toolId, location.pathname]);

  if (availability.available) {
    return children;
  }

  const tool = availability.tool || {};
  const toolName = tool.name || 'Calculator';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-3xl p-6 sm:p-10 shadow-sm text-center">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Calculator Temporarily Unavailable</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
          {toolName} is Disabled
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
          {availability.reason ||
            'This calculator is currently disabled by platform administrators for updates or scheduled maintenance.'}
        </p>

        {/* Assurance on Saved Calculations */}
        <div className="bg-slate-50 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35] rounded-2xl p-4 max-w-md mx-auto mb-8 text-left flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              Historical Results Protected
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              All previously saved calculations, semester grades, and transcripts for this tool remain completely safe and accessible in your Calculation History.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/student/calculation-history"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1A2332] border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#253245] text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all"
          >
            <FileText className="w-4 h-4 text-[#FF6B00]" />
            <span>View Saved Calculations</span>
          </Link>

          <Link
            to="/calculators"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E56000] text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Active Calculators</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
