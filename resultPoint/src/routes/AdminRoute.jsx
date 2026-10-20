import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, UserCheck, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';

export default function AdminRoute({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is a student, show permission guard
  if (currentUser.role !== 'admin') {
    const handleSwitchToDemoAdmin = () => {
      const admin = authService.loginAsAdmin();
      setCurrentUser(admin);
    };

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-elevated text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-brandPink/15 border border-brandPink/30 flex items-center justify-center text-brandPink">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-text-h">
              Administrator Access Required
            </h1>
            <p className="text-xs text-text-light leading-relaxed">
              Academic Catalog, Course Durations, and Grading Rules are strictly managed by university administrators to maintain institutional integrity.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-bg-sec border border-border text-xs text-left space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-text-h">
              <KeyRound className="w-4 h-4 text-accent shrink-0" />
              <span>Current Session: Student</span>
            </div>
            <p className="text-[11px] text-text-light">
              Signed in as <strong>{currentUser.email}</strong> with role <span className="font-mono text-accent">"{currentUser.role || 'student'}"</span>.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleSwitchToDemoAdmin}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch to Demo Administrator Role</span>
            </button>

            <Link
              to="/student/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-text-h hover:bg-bg-sec border border-border transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Student Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
