import React, { useState, useEffect } from 'react';
import {
  Calendar,
  GraduationCap,
  Building2,
  CalendarDays,
  Layers,
  Sparkles
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { resultService } from '../../services/resultService';
import { goalService } from '../../services/goalService';
import StatCard from '../../components/student/StatCard';
import PerformanceChart from '../../components/student/PerformanceChart';
import RecentResults from '../../components/student/RecentResults';
import AcademicGoalCard from '../../components/student/AcademicGoalCard';
import PerformanceInsights from '../../components/student/PerformanceInsights';
import QuickActions from '../../components/student/QuickActions';
import RecommendedForYou from '../../components/student/RecommendedForYou';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(() => studentService.getProfile());
  const [summary, setSummary] = useState(() => studentService.getAcademicSummary());
  const [results, setResults] = useState(() => resultService.getAllResults());
  const [goalMetrics, setGoalMetrics] = useState(() =>
    goalService.calculateGoalMetrics(
      Number(summary.currentCGPA),
      summary.semestersCompleted,
      summary.totalSemesters
    )
  );
  const [insights, setInsights] = useState(() => studentService.getPerformanceInsights());

  // Refresh data on mount or when storage updates
  useEffect(() => {
    const prof = studentService.getProfile();
    const sum = studentService.getAcademicSummary();
    const res = resultService.getAllResults();
    const goals = goalService.calculateGoalMetrics(
      Number(sum.currentCGPA),
      sum.semestersCompleted,
      sum.totalSemesters
    );
    const ins = studentService.getPerformanceInsights();

    setProfile(prof);
    setSummary(sum);
    setResults(res);
    setGoalMetrics(goals);
    setInsights(ins);
  }, []);

  // Format current date nicely e.g., "Monday, 06 Oct 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before accessing your student dashboard and academic metrics, please configure your University, Course, and Regulation so ResultPoint can calculate your SGPA, CGPA, and degree credits accurately."
    >
      <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Bar with Date (No breadcrumbs as explicitly instructed) */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-text-light shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Wide Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card to-accent/10 dark:from-[#0D141F] dark:via-[#111A26] dark:to-[#1f1915] border border-border p-4 sm:p-6 shadow-subtle">
        
        {/* Ambient background glow on right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-accent/15 via-accent/5 to-transparent pointer-events-none rounded-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          
          {/* Left Student Info & Welcome */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="relative shrink-0">
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-accent/40 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-brandGreen ring-2 ring-card" />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-text-h tracking-tight">
                Good morning, {profile.fullName} <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="text-xs sm:text-[13px] text-text-light">
                Here's a quick overview of your academic progress.
              </p>

              {/* Compact Academic Info Chips */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg-sec border border-border text-text-h">
                  <GraduationCap className="w-3.5 h-3.5 text-accent" />
                  <span>{profile.course}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg-sec border border-border text-text-h">
                  <Building2 className="w-3.5 h-3.5 text-brandBlue" />
                  <span>{profile.university}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg-sec border border-border text-text-h">
                  <CalendarDays className="w-3.5 h-3.5 text-brandGreen" />
                  <span>Current Semester: {profile.currentSemester}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg-sec border border-border text-text-h">
                  <Layers className="w-3.5 h-3.5 text-brandPurple" />
                  <span>Regulation: {profile.regulation}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Banner Graphics: 3D Graduation Cap & Stacked Books with Slogan */}
          <div className="hidden lg:flex items-center gap-4 shrink-0 pl-4">
            <div className="text-right">
              <span className="text-sm font-bold italic tracking-wide bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent block">
                Track. Understand. Improve.
              </span>
              <span className="text-[10px] text-text-light font-medium block mt-0.5">
                ResultPoint Academic Engine
              </span>
            </div>

            {/* Premium Graduation Cap & Books SVG Illustration */}
            <div className="relative w-28 h-20 shrink-0">
              <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="bookCoverGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="bookCoverGrad2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#312E81" />
                    <stop offset="100%" stopColor="#1E1B4B" />
                  </linearGradient>
                  <linearGradient id="goldCapGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF8A00" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>
                  <radialGradient id="capGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ambient glow behind books */}
                <circle cx="85" cy="65" r="45" fill="url(#capGlow)" />

                {/* Bottom Book */}
                <polygon points="25,92 125,78 145,86 45,102" fill="url(#bookCoverGrad)" />
                <polygon points="25,92 45,102 45,110 25,100" fill="#0F172A" />
                <polygon points="45,102 145,86 145,94 45,110" fill="url(#pageGrad)" />
                <polygon points="125,78 145,86 145,94 125,86" fill="#0F172A" />

                {/* Middle Book */}
                <polygon points="32,80 120,68 138,75 50,88" fill="url(#bookCoverGrad2)" />
                <polygon points="32,80 50,88 50,95 32,87" fill="#1E1B4B" />
                <polygon points="50,88 138,75 138,82 50,95" fill="url(#pageGrad)" />
                <polygon points="120,68 138,75 138,82 120,75" fill="#1E1B4B" />

                {/* Graduation Cap Diamond */}
                <polygon points="85,24 140,40 85,56 30,40" fill="url(#bookCoverGrad)" stroke="#3B82F6" strokeWidth="1" />
                
                {/* Cap Skull Base */}
                <path d="M 52,48 Q 85,62 118,48 L 118,58 Q 85,74 52,58 Z" fill="#0F172A" />

                {/* Cap Button */}
                <ellipse cx="85" cy="40" rx="3.5" ry="2" fill="#F59E0B" />

                {/* Golden Tassel */}
                <path d="M 85,40 Q 112,42 116,56 Q 118,66 120,74" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
                <polygon points="117,73 123,73 121,84 119,84" fill="#F59E0B" />
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* 4 Academic Summary Cards (Row of 4 on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard type="cgpa" data={summary} />
        <StatCard type="credits" data={summary} />
        <StatCard type="semesters" data={summary} />
        <StatCard type="backlogs" data={summary} />
      </div>

      {/* Middle Row: Performance Chart, Recent Results, Academic Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Academic Performance Chart (Large, 6 cols on xl) */}
        <div className="lg:col-span-12 xl:col-span-6 flex flex-col">
          <PerformanceChart results={results} />
        </div>

        {/* Recent Results (3 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-3 flex flex-col">
          <RecentResults results={results} />
        </div>

        {/* Your Academic Goal (3 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-3 flex flex-col">
          <AcademicGoalCard metrics={goalMetrics} />
        </div>

      </div>

      {/* Bottom Row: Insights, Quick Actions, Recommended Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <PerformanceInsights insights={insights} />
        <QuickActions />
        <RecommendedForYou />
      </div>

      </div>
    </AcademicProfileGate>
  );
}
