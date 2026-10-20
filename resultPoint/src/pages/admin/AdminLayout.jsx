import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleToggleSidebar = () => {
    // If mobile, toggle mobile drawer, otherwise toggle desktop collapsed mode
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleConfirmLogout = () => {
    authService.logout();
    setIsLogoutModalOpen(false);
    showToast('Administrator session ended.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D10] text-slate-800 dark:text-slate-200 flex antialiased">
      {/* 1. Left Navy Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* 2. Main Right Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <AdminHeader
          onToggleSidebar={handleToggleSidebar}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoutRequest={() => setIsLogoutModalOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Log Out of Admin Panel?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You will need to sign in again to manage universities, rules, and student records.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
