import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, SlidersHorizontal, Edit3, ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../../hooks/useAppSelector.js';
import { selectUserProfile } from '../../user/userSlice.js';
import { selectAcademicProfile } from '../../academicProfile/academicProfileSlice.js';
import { studentService } from '../../../services/studentService.js';
import { authService } from '../../../services/authService.js';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import AccountPreferencesModal from './AccountPreferencesModal.jsx';

export default function ProfileAccountSettings() {
  const navigate = useNavigate();
  const reduxProfile = useAppSelector(selectUserProfile);
  const reduxAcademicProfile = useAppSelector(selectAcademicProfile);

  const authUser = authService.getCurrentUser() || {};
  const storedProfile = studentService.getProfile() || {};

  const student = {
    ...storedProfile,
    ...(reduxProfile || {}),
    ...(reduxAcademicProfile || {}),
  };

  const studentName = student.fullName || student.name || authUser.fullName || 'Student User';
  const studentCourse = student.course || student.courseId?.toUpperCase() || 'BCA';
  const studentUniv = student.university || student.universityId || 'Osmania University';
  const studentEmail = student.email || authUser.email || 'samir.ali@example.com';
  const avatarUrl = student.avatar || authUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAccountPrefsOpen, setIsAccountPrefsOpen] = useState(false);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-h tracking-tight">
            Profile & Account
          </h2>
          <p className="text-xs text-text-light mt-0.5">
            Manage your profile information and account settings.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Student Profile Card */}
        <div className="p-4 rounded-xl bg-bg-sec border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={avatarUrl}
              alt={studentName}
              className="w-12 h-12 rounded-full object-cover border-2 border-border flex-shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
              }}
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-text-h truncate">{studentName}</h3>
              <p className="text-xs text-text-light truncate">
                {studentCourse} • {studentUniv}
              </p>
              <p className="text-[11px] text-text-light/80 truncate mt-0.5">{studentEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-h bg-card hover:bg-bg border border-border hover:border-accent flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-accent" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* 2. Change Password */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Change Password</div>
              <div className="text-[11px] text-text-light">Update your account password.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border hover:border-accent flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Change Password</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Account Preferences */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <SlidersHorizontal className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Account Preferences</div>
              <div className="text-[11px] text-text-light">Manage login sessions and preferences.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAccountPrefsOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border hover:border-accent flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Manage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <AccountPreferencesModal
        isOpen={isAccountPrefsOpen}
        onClose={() => setIsAccountPrefsOpen(false)}
      />
    </div>
  );
}
