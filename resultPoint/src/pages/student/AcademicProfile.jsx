import React, { useState } from 'react';
import { UserCheck, Save, CheckCircle, GraduationCap, Building2, Layers, Calendar, Mail } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';

export default function AcademicProfile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(() => studentService.getProfile());

  const handleChange = (field, val) => {
    setProfile((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    studentService.updateProfile(profile);
    showToast('Student academic profile updated successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 text-accent" />
          <span>Academic Profile</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
          Manage your verified enrollment details, course regulations, and institution information.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Card Header */}
        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center gap-4">
          <img
            src={profile.avatar}
            alt={profile.fullName}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-accent/30"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-text-h">{profile.fullName}</h2>
            <p className="text-xs text-text-light">{profile.email}</p>
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent">
              {profile.course} • {profile.university}
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-card border border-border">
          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Full Student Name
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Course / Degree
            </label>
            <input
              type="text"
              value={profile.course}
              onChange={(e) => handleChange('course', e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              University / Institute
            </label>
            <input
              type="text"
              value={profile.university}
              onChange={(e) => handleChange('university', e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Current Semester
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={profile.currentSemester}
              onChange={(e) => handleChange('currentSemester', Number(e.target.value))}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Academic Regulation
            </label>
            <input
              type="text"
              value={profile.regulation}
              onChange={(e) => handleChange('regulation', e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
