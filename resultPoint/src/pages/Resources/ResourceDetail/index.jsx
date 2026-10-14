import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  GraduationCap,
  Bookmark,
  Share2,
  CheckCircle,
  Calculator,
  Award,
  Globe,
  FileText,
  Calendar,
  ExternalLink,
  Search,
  BookOpen,
  Briefcase,
  Lightbulb,
  HelpCircle,
  Mail,
  MessageCircle,
  ArrowRight,
  X
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const R18_GRADES = [
  { range: '≥ 90%', grade: 'S', point: 10, performance: 'Outstanding', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
  { range: '80% – 89%', grade: 'A', point: 9, performance: 'Excellent', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
  { range: '70% – 79%', grade: 'B+', point: 8, performance: 'Very Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
  { range: '60% – 69%', grade: 'B', point: 7, performance: 'Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
  { range: '50% – 59%', grade: 'C', point: 6, performance: 'Average', badgeClass: 'bg-amber-500/10 text-brandAmber' },
  { range: '40% – 49%', grade: 'D', point: 5, performance: 'Pass', badgeClass: 'bg-amber-500/10 text-brandAmber' },
  { range: '< 40%', grade: 'F', point: 0, performance: 'Fail', badgeClass: 'bg-pink-500/10 text-brandPink' }
];

const RELATED_ARTICLES = [
  {
    title: 'JNTU Hyderabad CGPA Calculation (R18)',
    meta: 'Sep 8, 2025 • 6 min read',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=150&q=80',
    link: '/resources/resource-details'
  },
  {
    title: 'Difference Between SGPA and CGPA',
    meta: 'Sep 5, 2025 • 5 min read',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=150&q=80',
    link: '/resources/resource-details'
  },
  {
    title: 'How to Clear Backlogs in JNTU',
    meta: 'Sep 1, 2025 • 7 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=150&q=80',
    link: '/resources/resource-details'
  },
  {
    title: 'JNTU R18 vs R16: Key Differences',
    meta: 'Aug 28, 2025 • 5 min read',
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=150&q=80',
    link: '/resources/resource-details'
  },
  {
    title: 'Tips to Improve Your Semester Results',
    meta: 'Aug 20, 2025 • 6 min read',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=150&q=80',
    link: '/resources/resource-details'
  }
];

export default function ResourceDetail() {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ title: '', university: '', email: '' });
  const [sideEmail, setSideEmail] = useState('');

  const { showToast } = useToast();

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    showToast(isBookmarked ? 'Guide removed from bookmarks.' : 'Guide saved to your academic bookmarks!');
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'JNTU Hyderabad Grading System (R18)',
        text: 'Complete guide to understand the grading system, grade points, SGPA, and CGPA calculation for JNTU Hyderabad.',
        url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        showToast('Guide link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(url);
      showToast('Guide link copied to clipboard!');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Please enter search keywords.');
      return;
    }
    showToast(`Searching resources for: "${searchQuery}"`);
  };

  const handleSideNewsletter = (e) => {
    e.preventDefault();
    if (sideEmail.includes('@')) {
      showToast('Subscribed to JNTUH academic alerts!');
      setSideEmail('');
    }
  };

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    setSuggestModalOpen(false);
    showToast(`Topic "${suggestForm.title}" submitted to editorial team!`);
    setSuggestForm({ title: '', university: '', email: '' });
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/resources" className="hover:text-accent transition-colors">Resources</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h truncate max-w-[220px] sm:max-w-none" aria-current="page">
              JNTU Hyderabad Grading System (R18)
            </li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Article Column (8 of 12) */}
          <article className="lg:col-span-8 space-y-6 text-left" aria-labelledby="article-main-heading">
            {/* 1. Article Header Card */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
                  <GraduationCap className="w-3.5 h-3.5 text-accent" />
                  <span>University Guide</span>
                </span>
              </div>

              <h1 id="article-main-heading" className="text-2xl sm:text-3xl lg:text-[34px] font-black text-text-h tracking-tight leading-tight">
                JNTU Hyderabad Grading System (R18)
              </h1>

              <p className="text-xs sm:text-[13.5px] text-text-m leading-relaxed">
                Complete guide to understand the grading system, grade points, SGPA, CGPA calculation and academic rules for JNTU Hyderabad (R18 Regulation).
              </p>

              <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent text-white font-black text-xs flex items-center justify-center shrink-0 shadow-subtle">
                    RP
                  </div>
                  <div>
                    <span className="font-bold text-text-h block text-xs">By ResultPoint Academic Team</span>
                    <span className="text-[11px] text-text-light">Verified regulations • 8 min read</span>
                  </div>
                </div>

                {/* Bookmark & Share Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleToggleBookmark}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isBookmarked
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-border bg-bg-sec text-text-h hover:border-accent hover:text-accent'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-accent text-accent' : 'text-text-light'}`} />
                    <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-bg-sec text-text-h hover:border-accent hover:text-accent text-xs font-semibold transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5 text-text-light" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Visual Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-bg-sec shadow-subtle">
              <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                <div className="md:col-span-7 p-6 sm:p-8 flex items-center gap-5 z-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border border-border p-1.5 flex items-center justify-center shrink-0 shadow-subtle">
                    <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="54" stroke="#EA580C" strokeWidth="2.5" strokeDasharray="3 3" />
                      <circle cx="60" cy="60" r="48" stroke="#FF7300" strokeWidth="2" />
                      <circle cx="60" cy="60" r="42" fill="#FFF1E8" className="dark:fill-orange-950/40" />
                      <path d="M60 26 C52 38 42 50 42 62 C42 74 52 82 60 82 C68 82 78 74 78 62 C78 50 68 38 60 26 Z" fill="#E11D48" opacity="0.85" />
                      <path d="M60 38 C56 46 50 56 50 64 C50 70 54 74 60 74 C66 74 70 70 70 64 C70 56 64 46 60 38 Z" fill="#BE123C" />
                      <path d="M60 48 L60 70 M54 58 L66 58" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="60" cy="30" r="4" fill="#FF7300" />
                      <path d="M30 90 Q60 98 90 90 L86 100 Q60 106 34 100 Z" fill="#0F172A" />
                      <text x="60" y="97" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#F8FAFC">योगः कर्मसु कौशलम्</text>
                      <text x="60" y="112" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#64748B">GATEWAY TO EXCELLENCE</text>
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-text-h tracking-tight leading-tight">
                      JNTU Hyderabad
                    </h2>
                    <div className="text-sm font-bold text-accent">
                      Grading System (R18)
                    </div>
                    <div className="w-16 h-1 rounded-full bg-accent mt-1"></div>
                    <p className="text-[11px] font-semibold text-text-m pt-2 flex items-center gap-1.5">
                      <span>Understand</span>
                      <span>•</span>
                      <span>Calculate</span>
                      <span>•</span>
                      <span>Improve</span>
                    </p>
                  </div>
                </div>

                <div className="md:col-span-5 relative aspect-[16/10] md:aspect-auto md:h-full min-h-[180px] overflow-hidden bg-slate-900">
                  <img
  src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80"
  alt="JNTU Hyderabad Administration Building Entrance"
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  loading="lazy"
/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white pointer-events-none">
                    <span className="text-xs sm:text-sm font-bold text-accent italic">
                      Building Better Futures
                    </span>
                    <span className="text-[10px] text-slate-200 mt-0.5">Kukatpally, Hyderabad</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Section 1: Introduction */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-3" aria-labelledby="heading-sec-1">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-subtle">
                  1
                </div>
                <h2 id="heading-sec-1" class="text-base sm:text-lg font-bold text-text-h tracking-tight">
                  Introduction
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-text-m leading-relaxed">
                Jawaharlal Nehru Technological University Hyderabad (JNTUH) follows a Choice Based Credit System (CBCS) under the R18 regulation. The university uses a letter grading system to evaluate the performance of students in each subject. This comprehensive guide explains the complete grading system, grade points, SGPA, CGPA calculation method, and academic guidelines.
              </p>
              <p className="text-xs sm:text-[13px] text-text-m leading-relaxed">
                Whether you are calculating your current semester result, planning backlog clearance, or estimating your final graduation division, understanding this credit-weighted framework ensures you can manage and optimize your academic progress effectively.
              </p>
            </section>

            {/* 4. Section 2: Grading System (R18) Table */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4" aria-labelledby="heading-sec-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-subtle">
                  2
                </div>
                <h2 id="heading-sec-2" className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                  Grading System (R18)
                </h2>
              </div>

              <p className="text-xs sm:text-[13px] text-text-m leading-relaxed">
                JNTU Hyderabad uses a 10-point grading system. The grades are awarded based on the percentage of marks obtained in each theory, practical, or seminar subject as listed in the official academic criteria below:
              </p>

              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light bg-bg-sec border-b border-border/80">
                      <th className="py-3 px-4">Percentage Range</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Grade Point</th>
                      <th className="py-3 px-4 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {R18_GRADES.map((item) => (
                      <tr key={item.range} className="hover:bg-bg-sec/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-text-h">{item.range}</td>
                        <td className="py-3 px-4 text-center font-black text-accent text-sm">{item.grade}</td>
                        <td className="py-3 px-4 text-center font-bold text-text-h">{item.point}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold ${item.badgeClass}`}>
                            {item.performance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Section 3: SGPA and CGPA Calculation Formulas */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4" aria-labelledby="heading-sec-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-subtle">
                  3
                </div>
                <h2 id="heading-sec-3" className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                  SGPA and CGPA Calculation
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SGPA Box */}
                <div className="p-4 rounded-xl border border-border bg-bg-sec flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-text-h">
                        SGPA (Semester Grade Point Average)
                      </h3>
                    </div>

                    <div className="my-3 py-3 px-4 rounded-lg bg-card border border-border/80 text-center font-mono text-xs font-bold text-text-h">
                      <span>SGPA = </span>
                      <span className="inline-block align-middle text-center mx-1">
                        <span className="border-b border-text-h pb-0.5 block">Σ(Cᵢ × Gᵢ)</span>
                        <span className="pt-0.5 block">ΣCᵢ</span>
                      </span>
                    </div>

                    <ul className="space-y-1 text-[11px] text-text-m leading-snug">
                      <li className="flex items-start gap-1.5">
                        <span className="text-accent font-bold">•</span>
                        <span><strong className="text-text-h">Cᵢ</strong> = Credits for the subject</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-accent font-bold">•</span>
                        <span><strong className="text-text-h">Gᵢ</strong> = Grade point for the subject</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-accent font-bold">•</span>
                        <span>Calculated for each individual semester</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <Link to="/calculators/sgpa" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-accent hover:underline">
                      <span>Calculate SGPA Online</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* CGPA Box */}
                <div className="p-4 rounded-xl border border-border bg-bg-sec flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-text-h">
                        CGPA (Cumulative Grade Point Average)
                      </h3>
                    </div>

                    <div className="my-3 py-3 px-4 rounded-lg bg-card border border-border/80 text-center font-mono text-xs font-bold text-text-h">
                      <span>CGPA = </span>
                      <span className="inline-block align-middle text-center mx-1">
                        <span className="border-b border-text-h pb-0.5 block">Σ(Cᵢ × Sᵢ)</span>
                        <span className="pt-0.5 block">ΣCᵢ</span>
                      </span>
                    </div>

                    <ul className="space-y-1 text-[11px] text-text-m leading-snug">
                      <li className="flex items-start gap-1.5">
                        <span className="text-accent font-bold">•</span>
                        <span><strong className="text-text-h">Cᵢ</strong> = Total credits of the semester</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-accent font-bold">•</span>
                        <span><strong className="text-text-h">Sᵢ</strong> = SGPA of the respective semester</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-accent font-bold">•</span>
                        <span>Calculated from 1st semester to current semester</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <Link to="/calculators/cgpa" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-accent hover:underline">
                      <span>Calculate CGPA Online</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Section 4: Important Academic Rules */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-3" aria-labelledby="heading-sec-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-subtle">
                  4
                </div>
                <h2 id="heading-sec-4" className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                  Important Academic Rules
                </h2>
              </div>

              <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2.5 text-xs text-text-h font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>A minimum of 40% marks is required in each subject (internal + external) to pass.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Students must earn all mandatory credits allocated across 8 semesters to be eligible for degree award.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>CGPA is computed strictly across all cleared subjects with credit-weight multipliers.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Subjects with letter grade 'F' are considered backlog subjects and carry 0 grade points until cleared.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Always refer to the official JNTUH R18 academic curriculum for specific exemption and grace mark rules.</span>
                </div>
              </div>
            </section>

            {/* 7. Section 5: Useful Links */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-3" aria-labelledby="heading-sec-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-subtle">
                  5
                </div>
                <h2 id="heading-sec-5" className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                  Useful Links
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="https://jntuh.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">Official Website</span>
                      <span className="text-[10px] text-text-m block truncate">www.jntuh.ac.in</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-light group-hover:text-accent transition-colors shrink-0" />
                </a>

                <a
                  href="https://jntuh.ac.in/academic-regulations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">Academic Regulations</span>
                      <span className="text-[10px] text-text-m block truncate">Download PDF</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-light group-hover:text-accent transition-colors shrink-0" />
                </a>

                <a
                  href="https://jntuh.ac.in/academics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">Academic Calendar</span>
                      <span className="text-[10px] text-text-m block truncate">View Calendar</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-light group-hover:text-accent transition-colors shrink-0" />
                </a>
              </div>
            </section>
          </article>

          {/* Right Sidebar Column (4 of 12) */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 text-left" aria-label="Resource Sidebar Tools">
            {/* Search Box */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle space-y-2.5">
              <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">Search Resources</h3>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-light" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles, guides, FAQs..."
                    className="calc-input w-full pl-8 pr-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shrink-0 active:scale-95"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Categories Card */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle space-y-2.5">
              <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">Resource Categories</h3>
              <div className="space-y-1 text-xs">
                <Link to="/resources" className="flex items-center justify-between p-2 rounded-xl bg-accent-soft border border-accent/25 text-accent font-bold transition-colors">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-accent" />
                    <span>University Guides</span>
                  </span>
                  <span className="text-[11px] font-black text-accent">12</span>
                </Link>

                {[
                  { name: 'Academic Guides', icon: BookOpen, count: 8, color: 'text-brandBlue' },
                  { name: 'Exam Preparation', icon: FileText, count: 10, color: 'text-brandPink' },
                  { name: 'Career Guidance', icon: Briefcase, count: 6, color: 'text-brandPurple' },
                  { name: 'Student Tips', icon: Lightbulb, count: 9, color: 'text-brandAmber' },
                  { name: 'General FAQs', icon: HelpCircle, count: 15, color: 'text-brandCyan' }
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.name}
                      to="/resources"
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-bg-sec text-text-h font-medium transition-colors group"
                    >
                      <span className="flex items-center gap-2 text-text-m group-hover:text-text-h">
                        <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[11px] text-text-light">{cat.count}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Related Articles */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">Related Articles</h3>
                <Link to="/resources" className="text-[11px] font-bold text-accent hover:underline">View All</Link>
              </div>

              <div className="space-y-2.5 divide-y divide-border/60 text-xs">
                {RELATED_ARTICLES.map((article) => (
                  <Link key={article.title} to={article.link} className="pt-2.5 first:pt-0 flex items-center gap-2.5 group">
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-bg-sec shrink-0">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block truncate text-[11.5px]">{article.title}</span>
                      <span className="text-[10px] text-text-light">{article.meta}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stay Updated Newsletter Box */}
            <div className="rounded-2xl border border-accent/25 bg-accent-soft/40 p-4 shadow-subtle space-y-2.5">
              <div className="flex items-center gap-2 text-accent font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>Stay Updated</span>
              </div>
              <p className="text-[11px] text-text-m leading-snug">
                Get the latest guides, tips and academic resources directly in your inbox.
              </p>
              <form onSubmit={handleSideNewsletter} className="space-y-2">
                <input
                  type="email"
                  value={sideEmail}
                  onChange={(e) => setSideEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="calc-input w-full px-3 py-2 rounded-xl text-xs bg-card border border-border"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-subtle"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Need Help? Box */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-subtle space-y-2">
              <div className="flex items-center gap-2 text-brandGreen font-bold text-xs">
                <MessageCircle className="w-4 h-4 text-brandGreen" />
                <span>Need Help?</span>
              </div>
              <p className="text-[11px] text-text-m leading-snug">
                Can't find what you're looking for? Check our guides or suggest a new topic.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-1 text-[11px] font-bold text-brandGreen hover:underline pt-1">
                <span>Contact Us</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Suggest a Topic Box */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 shadow-subtle space-y-2">
              <div className="flex items-center gap-2 text-brandBlue font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-brandBlue" />
                <span>Suggest a Topic</span>
              </div>
              <p className="text-[11px] text-text-m leading-snug">
                Have an academic regulation or syllabus you would like covered? Let us know.
              </p>
              <button
                type="button"
                onClick={() => setSuggestModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brandBlue hover:underline pt-1"
              >
                <span>Suggest Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </aside>
        </div>

        {/* Explore More Resources Full-Width Banner */}
        <section className="rounded-2xl bg-accent-soft border border-accent/25 p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-text-h tracking-tight">
                Explore More Resources
              </h3>
              <p className="text-xs text-text-m mt-0.5">
                Check out our comprehensive guides, tips and study resources to excel in your academic journey.
              </p>
            </div>
          </div>

          <Link
            to="/resources"
            className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 shrink-0"
          >
            Browse All Resources →
          </Link>
        </section>
      </main>

      {/* Suggest a Topic Modal Dialog */}
      {suggestModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSuggestModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-theme text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSuggestModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-m hover:text-text-h"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center mb-3">
              <Lightbulb className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-text-h">Suggest an Academic Guide Topic</h3>
            <p className="text-xs text-text-m mt-1">
              Tell us which syllabus, university regulation, or calculation method you would like covered next.
            </p>

            <form onSubmit={handleSuggestSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text-h mb-1">Guide Topic / Question</label>
                <input
                  type="text"
                  required
                  value={suggestForm.title}
                  onChange={(e) => setSuggestForm({ ...suggestForm, title: e.target.value })}
                  placeholder="e.g. JNTU Kakinada R20 Credit Grace Rules"
                  className="calc-input w-full px-3 py-2 rounded-xl text-xs bg-bg-sec border border-border"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-h mb-1">Target University (Optional)</label>
                <input
                  type="text"
                  value={suggestForm.university}
                  onChange={(e) => setSuggestForm({ ...suggestForm, university: e.target.value })}
                  placeholder="e.g. JNTUH, Anna Univ, VTU"
                  className="calc-input w-full px-3 py-2 rounded-xl text-xs bg-bg-sec border border-border"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-h mb-1">Your Email (for notification when published)</label>
                <input
                  type="email"
                  value={suggestForm.email}
                  onChange={(e) => setSuggestForm({ ...suggestForm, email: e.target.value })}
                  placeholder="name@university.edu"
                  className="calc-input w-full px-3 py-2 rounded-xl text-xs bg-bg-sec border border-border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuggestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-m hover:text-text-h"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover shadow-accent"
                >
                  Submit Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}