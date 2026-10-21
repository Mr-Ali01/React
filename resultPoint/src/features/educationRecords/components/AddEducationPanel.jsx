import React from 'react';
import {
  Plus,
  School,
  BookOpen,
  Layers,
  GraduationCap,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

const EDUCATION_LEVEL_OPTIONS = [
  {
    key: 'school_early',
    title: 'Classes 1 – 9',
    description: 'Add your school education records with subjects, marks, and grades.',
    icon: School,
    iconWrapper: 'bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-[#38BDF8]'
  },
  {
    key: 'school_10',
    title: 'Class 10 (High School)',
    description: 'Add your 10th board details, subjects, marks, and percentage.',
    icon: BookOpen,
    iconWrapper: 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400'
  },
  {
    key: 'school_12',
    title: 'Class 12 (Intermediate)',
    description: 'Add your 12th board details, stream, subjects, marks, and percentage.',
    icon: Layers,
    iconWrapper: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
  },
  {
    key: 'ug',
    title: 'Undergraduate (UG)',
    description: "Add your bachelor's degree (e.g., BCA, B.Tech, B.Sc, B.Com, etc.) with semester results.",
    icon: GraduationCap,
    iconWrapper: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
  },
  {
    key: 'pg',
    title: 'Postgraduate (PG)',
    description: "Add your master's degree (e.g., MCA, MBA, M.Sc, M.Com, etc.) with semester results.",
    icon: Award,
    iconWrapper: 'bg-teal-500/10 border-teal-500/25 text-teal-600 dark:text-teal-400'
  }
];

export default function AddEducationPanel({ onSelectLevel }) {
  return (
    <div className="space-y-4">
      {/* Selection Card Container */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-[#FF6B00]/25">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-h tracking-tight">
              Add Your Education
            </h3>
            <p className="text-xs text-text-light mt-0.5 leading-relaxed">
              Add a new academic qualification to your profile. Choose the education level to get started.
            </p>
          </div>
        </div>

        {/* Level Options List */}
        <div className="space-y-2.5 pt-1">
          {EDUCATION_LEVEL_OPTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectLevel(item.key)}
                className="w-full p-3.5 rounded-xl bg-bg-sec hover:bg-card border border-border hover:border-slate-300 dark:hover:border-[#2A374A] flex items-center justify-between gap-3 text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${item.iconWrapper}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-text-h group-hover:text-[#FF6B00] transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-text-light leading-relaxed line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-text-light group-hover:text-text-h group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Callout Card */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed space-y-0.5">
          <span className="font-bold text-amber-700 dark:text-[#FBBF24] block">Note</span>
          <p className="text-text-m text-[11px]">
            Each education type has a different form and calculation method based on its academic structure.
          </p>
        </div>
      </div>
    </div>
  );
}
