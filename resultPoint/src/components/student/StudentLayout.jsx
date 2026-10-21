import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import StudentHeader from './StudentHeader';
import StudentSidebar from './StudentSidebar';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectSidebarCollapsed,
  selectMobileSidebarOpen,
  toggleSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
} from '../../features/ui/uiSlice';
import { logoutUser } from '../../features/auth/authSlice';
import { useToast } from '../../context/ToastContext';
import { LogOut } from 'lucide-react';

import PendingCalculationBanner from '../common/PendingCalculationBanner';

export default function StudentLayout() {
  const dispatch = useAppDispatch();
  const isCollapsed = useAppSelector(selectSidebarCollapsed);
  const isMobileOpen = useAppSelector(selectMobileSidebarOpen);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      dispatch(toggleMobileSidebar());
    } else {
      dispatch(toggleSidebarCollapsed());
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutUser());
    showToast('Logged out successfully.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-m antialiased transition-colors">
      {/* Top Student Header */}
      <StudentHeader
        onToggleSidebar={handleToggleSidebar}
        onLogoutRequest={() => setShowLogoutModal(true)}
      />

      {/* Main Area with Sidebar and Page Content */}
      <div className="flex-1 flex w-full">
        <StudentSidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => dispatch(setMobileSidebarOpen(false))}
          onLogoutRequest={() => setShowLogoutModal(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-7 overflow-x-hidden space-y-4">
          <PendingCalculationBanner />
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brandPink/15 text-brandPink flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-h">Log Out</h3>
                <p className="text-xs text-text-light">ResultPoint Academic Session</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Are you sure you want to log out of your student account? Your saved semester marks and progress will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-h hover:bg-bg-sec border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brandPink hover:bg-pink-600 shadow-sm transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
