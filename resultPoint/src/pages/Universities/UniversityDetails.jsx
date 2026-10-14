import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Landmark,
  Calendar,
  MapPin,
  Globe,
  ExternalLink,
  BookOpen,
  Users,
  GraduationCap,
  Award,
  Layers,
  FileCheck,
  BarChart2,
  Calculator,
  Percent,
  Binary,
  Target,
  ShieldCheck,
  ClipboardList,
  TrendingUp,
  ChevronUp,
  FileText,
  Bell,
  ArrowRight
} from 'lucide-react';
import ExploreMoreTools from '../../pages/Calculators/ExploreMoreTools';
import { useToast } from '../../context/ToastContext';

const JNTUH_REGULATIONS = {
  r22: {
    name: 'Grading System (R22)',
    subtitle: 'Applicable for B.Tech batches admitted from 2022-23 onwards',
    grades: [
      { range: '≥ 90%', grade: 'O', point: 10, performance: 'Outstanding', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '80% – 89%', grade: 'A+', point: 9, performance: 'Excellent', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '70% – 79%', grade: 'A', point: 8, performance: 'Very Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '60% – 69%', grade: 'B+', point: 7, performance: 'Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '50% – 59%', grade: 'B', point: 6, performance: 'Above Average', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '40% – 49%', grade: 'C', point: 5, performance: 'Pass', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '< 40%', grade: 'F', point: 0, performance: 'Fail', badgeClass: 'bg-pink-500/10 text-brandPink' }
    ]
  },
  r20: {
    name: 'Grading System (R20)',
    subtitle: 'Applicable for Lateral Entry & PG programs admitted from 2020',
    grades: [
      { range: '≥ 90%', grade: 'S', point: 10, performance: 'Outstanding', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '80% – 89%', grade: 'A', point: 9, performance: 'Excellent', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '70% – 79%', grade: 'B+', point: 8, performance: 'Very Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '60% – 69%', grade: 'B', point: 7, performance: 'Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '50% – 59%', grade: 'C', point: 6, performance: 'Average', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '40% – 49%', grade: 'D', point: 5, performance: 'Pass', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '< 40%', grade: 'F', point: 0, performance: 'Fail', badgeClass: 'bg-pink-500/10 text-brandPink' }
    ]
  },
  r18: {
    name: 'Grading System (R18)',
    subtitle: 'Applicable for B.Tech batches admitted from 2018 to 2021 (Default)',
    grades: [
      { range: '≥ 90%', grade: 'S', point: 10, performance: 'Outstanding', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '80% – 89%', grade: 'A', point: 9, performance: 'Excellent', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '70% – 79%', grade: 'B+', point: 8, performance: 'Very Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '60% – 69%', grade: 'B', point: 7, performance: 'Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '50% – 59%', grade: 'C', point: 6, performance: 'Average', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '40% – 49%', grade: 'D', point: 5, performance: 'Pass', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '< 40%', grade: 'F', point: 0, performance: 'Fail', badgeClass: 'bg-pink-500/10 text-brandPink' }
    ]
  },
  r16: {
    name: 'Grading System (R16)',
    subtitle: 'Applicable for B.Tech batches admitted from 2016',
    grades: [
      { range: '≥ 90%', grade: 'O', point: 10, performance: 'Outstanding', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '80% – 89%', grade: 'A', point: 9, performance: 'Excellent', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '70% – 79%', grade: 'B', point: 8, performance: 'Very Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '60% – 69%', grade: 'C', point: 7, performance: 'Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '50% – 59%', grade: 'D', point: 6, performance: 'Fair', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '40% – 49%', grade: 'P', point: 5, performance: 'Pass', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '< 40%', grade: 'F', point: 0, performance: 'Fail', badgeClass: 'bg-pink-500/10 text-brandPink' }
    ]
  },
  r13: {
    name: 'Grading System (R13 Archive)',
    subtitle: 'Applicable for legacy B.Tech batches',
    grades: [
      { range: '≥ 70%', grade: 'Distinction', point: 10, performance: 'First Class With Dist.', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
      { range: '60% – 69%', grade: 'First Class', point: 8, performance: 'First Division', badgeClass: 'bg-blue-500/10 text-brandBlue' },
      { range: '50% – 59%', grade: 'Second Class', point: 6, performance: 'Second Division', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '40% – 49%', grade: 'Pass Class', point: 5, performance: 'Passed', badgeClass: 'bg-amber-500/10 text-brandAmber' },
      { range: '< 40%', grade: 'Fail', point: 0, performance: 'Failed', badgeClass: 'bg-pink-500/10 text-brandPink' }
    ]
  }
};

const FAQ_ITEMS = [
  {
    id: 1,
    q: '1. Which JNTU regulations are supported on ResultPoint?',
    a: 'ResultPoint supports all major JNTU Hyderabad regulations including R22, R20, R18, R16, and R13 for B.Tech, M.Tech, MBA, and MCA degrees, with verified credit allocations.'
  },
  {
    id: 2,
    q: '2. Can I calculate SGPA and CGPA specifically for JNTU Hyderabad?',
    a: 'Yes, our calculators let you select JNTU Hyderabad and your exact regulation (e.g., R18). Grade points from S (10) to F (0) are automatically mapped based on official academic guidelines.'
  },
  {
    id: 3,
    q: '3. How does ResultPoint convert JNTUH CGPA to percentage?',
    a: 'Under JNTUH regulations, equivalent percentage can be computed as: Percentage = (CGPA - 0.5) × 10 or direct 10-point scaling as required by specific recruitment portals. Both conversion options are accessible on our Percentage Calculator.'
  },
  {
    id: 4,
    q: '4. Can I plan and calculate backlog clearance for JNTU?',
    a: 'Yes! Our specialized Backlog Calculator allows you to add uncleared subjects, compute backlog credits, and model required CGPA recovery targets for upcoming semesters.'
  },
  {
    id: 5,
    q: '5. Are my calculated results saved securely?',
    a: 'Calculations on public tools are stored locally in your browser storage. You can also sign up for a free student profile to record and download semester reports.'
  }
];

export default function UniversityDetail() {
  const [activeRegulation, setActiveRegulation] = useState('r18');
  const [activeTab, setActiveTab] = useState('overview');
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState(1);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleTabScroll = (tabKey, elementId) => {
    setActiveTab(tabKey);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectRegulation = (regKey) => {
    setActiveRegulation(regKey);
    showToast(`Switched to JNTUH ${regKey.toUpperCase()} grading standards`);
  };

  const handleCourseClick = (courseKey) => {
    showToast(`Loading JNTUH ${courseKey.toUpperCase()} template...`);
    navigate(`/calculators/cgpa#jntuh-${courseKey}`);
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
            <li><Link to="/universities" className="hover:text-accent transition-colors">Universities</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h" aria-current="page">JNTU Hyderabad</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-5">
        {/* University Hero Header */}
        <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle relative overflow-hidden" aria-label="University Overview Header">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Emblem, Info & Description */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-bg-sec border border-border p-2 flex items-center justify-center shrink-0 shadow-subtle">
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

              <div className="space-y-2.5 flex-1 min-w-0 text-left">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    <span>STATE TECHNOLOGICAL UNIVERSITY</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-text-h tracking-tight leading-snug">
                    Jawaharlal Nehru Technological University Hyderabad <span className="text-accent">(JNTU Hyderabad)</span>
                  </h1>
                  <p className="text-xs text-text-m font-medium flex items-center gap-1.5 mt-0.5">
                    <span>Kukatpally, Hyderabad, Telangana, India</span>
                    <span className="text-border">•</span>
                    <span className="text-brandGreen font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified Institution
                    </span>
                  </p>
                </div>

                {/* Metadata 4-Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-sec border border-border/70">
                    <Landmark className="w-4 h-4 text-accent shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Type</span>
                      <span className="font-bold text-text-h truncate block">State University</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-sec border border-border/70">
                    <Calendar className="w-4 h-4 text-brandBlue shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Established</span>
                      <span className="font-bold text-text-h truncate block">2008 (Act) / 1972</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-sec border border-border/70">
                    <MapPin className="w-4 h-4 text-brandPink shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Location</span>
                      <span className="font-bold text-text-h truncate block">Hyderabad, TS</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-sec border border-border/70">
                    <Globe className="w-4 h-4 text-brandGreen shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Website</span>
                      <a href="https://jntuh.ac.in" target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline flex items-center gap-0.5 truncate">
                        <span>jntuh.ac.in</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Expandable Overview Paragraph */}
                <div className="pt-1 text-xs text-text-m leading-relaxed">
                  <p className={isHeroExpanded ? '' : 'line-clamp-2'}>
                    Jawaharlal Nehru Technological University Hyderabad (JNTUH) is a premier state university in Telangana, India. It offers a wide range of undergraduate, postgraduate, and doctoral programs in engineering, technology, pharmacy, and management sciences across Telangana with standard grading regulations (R18 & R22).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsHeroExpanded(!isHeroExpanded)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline mt-1 focus:outline-none"
                  >
                    <span>{isHeroExpanded ? 'Read Less' : 'Read More'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHeroExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Campus Photograph Card */}
            <div className="lg:col-span-4 relative rounded-2xl overflow-hidden border border-border bg-bg-sec aspect-[16/10] shadow-subtle group">
              {/* ✅ Clean, native HTML image tag */}
<img
  src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80"
  alt="JNTU Hyderabad Administration Building Entrance"
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  loading="lazy"
/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">MAIN CAMPUS ENTRANCE</span>
                <span className="text-sm font-black tracking-tight">JNTU Hyderabad</span>
                <span className="text-[10.5px] text-slate-200">Kukatpally, Hyderabad - 500085</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Navigation Tabs Bar */}
        <section className="border-b border-border bg-card rounded-xl px-2 py-1 shadow-subtle overflow-x-auto" aria-label="University Sub Navigation">
          <div className="flex items-center gap-1.5 min-w-max text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview', target: 'sec-overview' },
              { id: 'courses', label: 'Courses', target: 'sec-courses' },
              { id: 'regulations', label: 'Regulations', target: 'sec-regulations' },
              { id: 'grading', label: 'Grading System', target: 'sec-grading' },
              { id: 'calculators', label: 'Calculators', target: 'sec-calculators' },
              { id: 'faq', label: 'FAQs', target: 'sec-faq' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabScroll(tab.id, tab.target)}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent bg-accent-soft font-bold'
                    : 'text-text-m hover:text-text-h hover:bg-bg-sec'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Left Column (8 of 12) */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Overview & Stat Badges Card */}
            <section id="sec-overview" className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left">
              <div className="flex items-center gap-3 pb-3 border-b border-border/70">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-h">About JNTU Hyderabad</h2>
                  <p className="text-[11px] text-text-m">Academic history, affiliation footprint, and technical mission</p>
                </div>
              </div>

              <p className="text-xs text-text-m leading-relaxed">
                Jawaharlal Nehru Technological University Hyderabad (JNTUH) was reconstituted in 2008 under the JNTU Act by the Government of Telangana. The university aims to provide quality technical education, promote research and innovation, and contribute to the development of skilled professionals for industry and society. JNTUH is affiliated with a vast network of engineering, pharmacy, and management colleges across Telangana.
              </p>

              {/* 4 Stat Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-bg-sec border border-border/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-black text-text-h block leading-none">500+</span>
                    <span className="text-[10.5px] text-text-m mt-0.5 block truncate">Affiliated Colleges</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-sec border border-border/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-black text-text-h block leading-none">3.5+ Lakh</span>
                    <span className="text-[10.5px] text-text-m mt-0.5 block truncate">Enrolled Students</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-sec border border-border/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-black text-text-h block leading-none">100+</span>
                    <span className="text-[10.5px] text-text-m mt-0.5 block truncate">Academic Programs</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-sec border border-border/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-brandPink flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-black text-text-h block leading-none">A+</span>
                    <span className="text-[10.5px] text-text-m mt-0.5 block truncate">NAAC Grade</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Popular Courses Card */}
            <section id="sec-courses" className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-h">Popular Courses</h2>
                    <p className="text-[11px] text-text-m">Undergraduate and postgraduate degrees supported on ResultPoint</p>
                  </div>
                </div>
                <Link to="/calculators" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                  <span>View Calculators</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { tag: 'UG', name: 'B.Tech', desc: 'Bachelor of Technology', years: '4 Years', key: 'btech' },
                  { tag: 'PG', name: 'M.Tech', desc: 'Master of Technology', years: '2 Years', key: 'mtech' },
                  { tag: 'PG', name: 'MBA', desc: 'Master of Business Admin', years: '2 Years', key: 'mba' },
                  { tag: 'PG', name: 'M.Pharm', desc: 'Master of Pharmacy', years: '2 Years', key: 'mpharm' }
                ].map((course) => (
                  <div
                    key={course.name}
                    onClick={() => handleCourseClick(course.key)}
                    className="group p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/30 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-brandBlue">
                        {course.tag}
                      </span>
                      <h3 className="text-sm font-bold text-text-h mt-2 group-hover:text-accent transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-text-m mt-0.5">{course.desc}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-text-m font-semibold">{course.years}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-accent -rotate-45 group-hover:rotate-0 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Regulations Card */}
            <section id="sec-regulations" className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-h">Regulations</h2>
                    <p className="text-[11px] text-text-m">Select your curriculum cohort to preview grading cutoffs</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { key: 'r22', year: '2022' },
                  { key: 'r20', year: '2020' },
                  { key: 'r18', year: '2018', isDefault: true },
                  { key: 'r16', year: '2016' },
                  { key: 'r13', year: '2013', isArchive: true }
                ].map((reg) => {
                  const isSelected = activeRegulation === reg.key;
                  return (
                    <button
                      key={reg.key}
                      type="button"
                      onClick={() => handleSelectRegulation(reg.key)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-2 border-accent bg-accent-soft/40 shadow-subtle'
                          : 'border-border bg-bg-sec hover:border-accent'
                      }`}
                    >
                      <div>
                        <span className={`text-base font-black block ${isSelected ? 'text-accent' : 'text-text-h'}`}>
                          {reg.key.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-text-m mt-0.5 block">From {reg.year}</span>
                      </div>
                      <span className={`mt-3 text-[9.5px] font-bold ${
                        isSelected ? 'text-accent' : (reg.isArchive ? 'text-text-light' : 'text-brandGreen')
                      }`}>
                        {isSelected ? 'Active' : (reg.isArchive ? 'Archive' : 'Available')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. Grading System Table Card */}
            <section id="sec-grading" className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-h">
                      {JNTUH_REGULATIONS[activeRegulation]?.name}
                    </h2>
                    <p className="text-[11px] text-text-m">Official grade point cutoffs and performance criteria</p>
                  </div>
                </div>
                <Link to="/calculators/grade" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                  <span>Grade Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/80">
                      <th className="py-2.5 px-3">Percentage Range</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">Grade Point</th>
                      <th className="py-2.5 px-3 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {JNTUH_REGULATIONS[activeRegulation]?.grades.map((item) => (
                      <tr key={item.range} className="hover:bg-bg-sec/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-text-h">{item.range}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-accent">{item.grade}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-text-h">{item.point}</td>
                        <td className="py-2.5 px-3 text-right">
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

            {/* 5. Pre-configured Calculators for JNTU Hyderabad */}
            <section id="sec-calculators" className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div>
                  <h2 className="text-base font-bold text-text-h">Calculators for JNTU Hyderabad</h2>
                  <p className="text-[11px] text-text-m">Pre-configured with JNTUH R18 and R22 grade parameters</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-accent-soft text-accent border border-accent/20">
                  6 Online Tools
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { to: '/calculators/cgpa', name: 'CGPA Calculator', desc: 'Calculate cumulative grade point average across completed terms.', icon: Calculator, color: 'text-brandBlue bg-blue-500/10' },
                  { to: '/calculators/sgpa', name: 'SGPA Calculator', desc: 'Calculate semester grade point average with exact credit multipliers.', icon: GraduationCap, color: 'text-brandGreen bg-emerald-500/10' },
                  { to: '/calculators/gpa', name: 'GPA Calculator', desc: 'Calculate weighted GPA using subject credits and letter grades.', icon: Binary, color: 'text-brandPurple bg-purple-500/10' },
                  { to: '/calculators/percentage', name: 'Percentage Calculator', desc: 'Convert total marks into exact aggregate percentages.', icon: Percent, color: 'text-brandPink bg-pink-500/10' },
                  { to: '/calculators/grade', name: 'Grade Calculator', desc: 'Find your letter grade based on university exam marks.', icon: Award, color: 'text-brandCyan bg-cyan-500/10' },
                  { to: '/calculators/target-cgpa', name: 'Target CGPA', desc: 'Find required CGPA in upcoming terms to reach your goal.', icon: Target, color: 'text-accent bg-orange-500/10' }
                ].map((calc) => {
                  const Icon = calc.icon;
                  return (
                    <Link
                      key={calc.name}
                      to={calc.to}
                      className="group p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:shadow-subtle transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${calc.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-text-h mt-2 group-hover:text-accent transition-colors">{calc.name}</h3>
                        <p className="text-[11px] text-text-m mt-0.5">{calc.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-accent font-bold">
                        <span>Calculate Now</span>
                        <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 6. Academic Benefits */}
            <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left">
              <div className="pb-2 border-b border-border/70">
                <h2 className="text-base font-bold text-text-h">Everything You Need for Your Academic Journey</h2>
                <p className="text-[11px] text-text-m">Built specifically to address JNTU exam structures and grading norms</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-bg-sec border border-border/70 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-text-h">Calculate Accurately</h3>
                  <p className="text-[11px] text-text-m leading-snug">Uses authentic JNTUH-specific credit multipliers and rules.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-sec border border-border/70 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-text-h">Track Results</h3>
                  <p className="text-[11px] text-text-m leading-snug">Save and track semester performance securely in your browser.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-sec border border-border/70 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-brandPurple flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-text-h">Analyze Trends</h3>
                  <p className="text-[11px] text-text-m leading-snug">Understand academic trends and address weak subjects early.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-sec border border-border/70 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-text-h">Plan Your Future</h3>
                  <p className="text-[11px] text-text-m leading-snug">Set target graduation goals and plan your clearance schedule.</p>
                </div>
              </div>
            </section>

            {/* 7. FAQs Accordion */}
            <section id="sec-faq" className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-3 text-left">
              <div className="pb-2 border-b border-border/70">
                <h2 className="text-base font-bold text-text-h">Frequently Asked Questions</h2>
                <p className="text-[11px] text-text-m">Common queries regarding JNTUH grading, regulations, and calculators</p>
              </div>

              <div className="space-y-2 text-xs">
                {FAQ_ITEMS.map((faq) => {
                  const isOpen = openFaq === faq.id;
                  return (
                    <div key={faq.id} className="border border-border rounded-xl overflow-hidden bg-bg-sec">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        className="w-full p-3.5 text-left font-bold text-text-h flex items-center justify-between gap-2 hover:text-accent transition-colors"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-accent shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-m shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-3.5 text-text-m leading-relaxed border-t border-border/60 pt-2">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Sidebar Column (4 of 12) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20 text-left" aria-label="University Side Actions">
            {/* Quick Actions Card */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3.5">
              <div className="pb-2 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">Quick Actions</h3>
                <span className="w-2 h-2 rounded-full bg-accent"></span>
              </div>

              <div className="space-y-2 text-xs">
                <Link
                  to="/calculators/cgpa"
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">Try CGPA Calculator</span>
                    <span className="text-[11px] text-text-m leading-snug">Calculate your cumulative grade point average</span>
                  </div>
                </Link>

                <Link
                  to="/calculators/sgpa"
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">Try SGPA Calculator</span>
                    <span className="text-[11px] text-text-m leading-snug">Calculate semester grade point average</span>
                  </div>
                </Link>

                <Link
                  to="/calculators/percentage"
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-brandPink flex items-center justify-center shrink-0">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">Try Percentage Calculator</span>
                    <span className="text-[11px] text-text-m leading-snug">Convert your CGPA to percentage</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Official External Links Card */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="pb-2 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">Important Links</h3>
                <span className="text-[10px] text-text-light font-bold">OFFICIAL</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Official Website', url: 'https://jntuh.ac.in', linkText: 'www.jntuh.ac.in', icon: Globe, color: 'text-brandBlue bg-blue-500/10' },
                  { name: 'Examination Portal', url: 'https://exams.jntuh.ac.in', linkText: 'exams.jntuh.ac.in', icon: FileText, color: 'text-brandGreen bg-emerald-500/10' },
                  { name: 'Results Portal', url: 'https://results.jntuh.ac.in', linkText: 'results.jntuh.ac.in', icon: BarChart2, color: 'text-brandPurple bg-purple-500/10' },
                  { name: 'Academic Calendar', url: 'https://jntuh.ac.in/academics', linkText: 'jntuh.ac.in/academics', icon: Calendar, color: 'text-accent bg-orange-500/10' },
                  { name: 'Notifications', url: 'https://jntuh.ac.in/notifications', linkText: 'jntuh.ac.in/notifications', icon: Bell, color: 'text-brandPink bg-pink-500/10' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-border bg-bg-sec hover:border-accent flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">{item.name}</span>
                          <span className="text-[10px] text-text-m block truncate">{item.linkText}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-text-light group-hover:text-accent transition-colors shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Related Universities Card */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="pb-2 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">Related Universities</h3>
                <Link to="/universities" className="text-[10.5px] font-bold text-accent hover:underline">View All →</Link>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'JNTU Kakinada', state: 'Andhra Pradesh', short: 'JK', color: 'bg-orange-500/10 text-accent' },
                  { name: 'Anna University', state: 'Tamil Nadu', short: 'AU', color: 'bg-blue-500/10 text-brandBlue' },
                  { name: 'Osmania University', state: 'Telangana', short: 'OU', color: 'bg-emerald-500/10 text-brandGreen' },
                  { name: 'Andhra University', state: 'Andhra Pradesh', short: 'AN', color: 'bg-purple-500/10 text-brandPurple' }
                ].map((uni) => (
                  <Link
                    key={uni.name}
                    to="/universities"
                    className="p-2.5 rounded-xl border border-border bg-bg-sec hover:border-accent flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] ${uni.color}`}>
                        {uni.short}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">{uni.name}</span>
                        <span className="text-[10px] text-text-m block truncate">{uni.state}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-light group-hover:text-accent transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* High-Impact Horizontal CTA Banner */}
        <section className="rounded-3xl bg-gradient-to-r from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-6 sm:p-8 shadow-accent relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6" aria-label="Calculate JNTU Results">
          <div className="flex items-center gap-4 text-left z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Understand Your JNTU Results Better
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                Calculate your semester SGPA, cumulative CGPA, and backlog clearance plans using official regulations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10 w-full sm:w-auto">
            <Link
              to="/calculators/cgpa"
              className="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-white text-text-h hover:bg-slate-50 text-xs font-bold shadow-subtle transition-all active:scale-95"
            >
              Start Calculating →
            </Link>
            <Link
              to="/universities"
              className="hidden sm:inline-block px-5 py-3 rounded-xl border border-white/40 hover:bg-white/10 text-white text-xs font-bold transition-all"
            >
              Explore Universities
            </Link>
          </div>
        </section>

        {/* Reusable Bottom Explore Tools */}
        <ExploreMoreTools />
      </main>
    </>
  );
}