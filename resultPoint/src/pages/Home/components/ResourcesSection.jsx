import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, BookOpen, Compass, Target, ArrowRight } from 'lucide-react';

const resources = [
  {
    title: 'Previous Papers',
    desc: 'Semester-wise university question papers with authentic solutions.',
    to: '/resources/previous-year',
    actionText: 'Browse Papers',
    actionColor: 'text-brandBlue',
    icon: FileText,
    color: 'bg-blue-500/10 text-brandBlue border-brandBlue/20',
    hoverBorder: 'hover:border-brandBlue/40',
  },
  {
    title: 'Study Materials',
    desc: 'Verified lecture notes, core formula sheets, and module summaries.',
    to: '/resources#study-materials',
    actionText: 'View Materials',
    actionColor: 'text-brandGreen',
    icon: BookOpen,
    color: 'bg-emerald-500/10 text-brandGreen border-brandGreen/20',
    hoverBorder: 'hover:border-brandGreen/40',
  },
  {
    title: 'University Guides',
    desc: 'In-depth regulation breakdowns (R18, R22, CBCS) and grading rules.',
    to: '/resources/details',
    actionText: 'Read Guides',
    actionColor: 'text-brandPurple',
    icon: Compass,
    color: 'bg-purple-500/10 text-brandPurple border-brandPurple/20',
    hoverBorder: 'hover:border-brandPurple/40',
  },
  {
    title: 'Exam Preparation',
    desc: 'Proven revision strategies, last-minute checklists, and exam tips.',
    to: '/resources',
    actionText: 'Get Tips',
    actionColor: 'text-brandAmber',
    icon: Target,
    color: 'bg-amber-500/10 text-brandAmber border-brandAmber/20',
    hoverBorder: 'hover:border-brandAmber/40',
  },
];

export default function ResourcesSection() {
  return (
    <section id="resources" className="py-16 sm:py-20 bg-bg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              ACADEMIC RESOURCES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
              Learn. Prepare. Succeed.
            </h2>
            <p className="text-xs sm:text-sm text-text-m">
              Access study materials, previous papers, university guides and more.
            </p>
          </div>

          <Link
            to="/resources"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>Explore Resources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-left">
          {resources.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.title}
                to={r.to}
                className={`group p-5 rounded-2xl bg-card border border-border shadow-subtle ${r.hoverBorder} hover:-translate-y-1 transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text-h group-hover:text-accent transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-text-m mt-1 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
                <div className={`mt-4 pt-2.5 border-t border-border/60 text-xs font-bold ${r.actionColor} flex items-center justify-between`}>
                  <span>{r.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}