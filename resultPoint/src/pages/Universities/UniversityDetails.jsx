import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UniversityEmblem from './UniversityEmblem';
import { getUniversityDetails } from '../../data/universityDetailsData';
import { academicCatalogService } from '../../services/academicCatalogService';
import {
  Home,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  CheckCircle,
  Landmark,
  Calendar,
  MapPin,
  Globe,
  ExternalLink,
  BookOpen,
  Layers,
  FileCheck,
  BarChart2,
  Calculator,
  Percent,
  GraduationCap,
  Award,
  ShieldCheck,
  ClipboardList,
  TrendingUp,
  Target,
  Binary,
  ArrowRight,
  Info,
  HelpCircle,
  Sparkles,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import ExploreMoreTools from '../Calculators/ExploreMoreTools';
import { useToast } from '../../context/ToastContext';

export default function UniversityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Live synchronization with catalog updates and storage events
  useEffect(() => {
    const handleUpdate = () => setCatalogVersion((v) => v + 1);
    window.addEventListener('rp_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('rp_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  // Resolve University Data via centralized configuration + live academic catalog mutations
  const university = useMemo(() => {
    const staticUni = getUniversityDetails(id || 'osmania-university');
    const catalog = academicCatalogService.getCatalog();
    const liveUni = catalog.universities.find((u) => {
      const target = (id || 'osmania-university').toLowerCase();
      return (
        u.id.toLowerCase() === target ||
        u.shortName.toLowerCase() === target ||
        (staticUni && u.id.toLowerCase() === staticUni.id.toLowerCase()) ||
        (staticUni && u.shortName.toLowerCase() === staticUni.shortName.toLowerCase())
      );
    });

    if (!staticUni && !liveUni) return null;

    if (staticUni && liveUni) {
      const mergedCourses = (liveUni.courses || []).map((catCourse) => {
        const staticMatch = (staticUni.courses || []).find(
          (sc) => sc.id.toLowerCase() === catCourse.id.toLowerCase() || sc.name.toLowerCase() === catCourse.shortName.toLowerCase()
        );
        return {
          id: catCourse.id,
          name: catCourse.shortName,
          fullName: catCourse.name,
          category: catCourse.level === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)',
          degreeLevel: catCourse.level || staticMatch?.degreeLevel || 'UG',
          durationYears: `${catCourse.durationYears || 4} Years`,
          semesterCount: catCourse.totalSemesters || 8,
          iconColor: staticMatch?.iconColor || 'blue',
          status: catCourse.status || 'active',
          regulations: (catCourse.regulations || []).map((r) => {
            const staticRegMatch = staticMatch?.regulations?.find((sr) => sr.id === r.id || sr.code === r.code);
            return {
              id: r.id,
              name: r.name,
              code: r.code,
              ruleVersion: r.ruleVersion,
              effectiveBatches: r.effectiveBatches || staticRegMatch?.effectiveBatches || [],
              gradingScale: r.gradingScale || staticRegMatch?.gradingScale || [],
              calculationMethod: r.calculationRule || staticRegMatch?.calculationMethod || {}
            };
          })
        };
      });

      return {
        ...staticUni,
        name: liveUni.name || staticUni.name,
        fullName: liveUni.name ? `${liveUni.name} (${liveUni.shortName || staticUni.shortName})` : staticUni.fullName,
        shortName: liveUni.shortName || staticUni.shortName,
        city: liveUni.city || staticUni.city,
        state: liveUni.state || staticUni.state,
        location: `${liveUni.city || staticUni.city}, ${liveUni.state || staticUni.state}`,
        officialWebsite: liveUni.website || staticUni.officialWebsite,
        websiteDisplay: liveUni.website ? liveUni.website.replace(/^https?:\/\//, '') : staticUni.websiteDisplay,
        status: liveUni.status || 'active',
        courses: mergedCourses.length > 0 ? mergedCourses : staticUni.courses
      };
    }

    if (!staticUni && liveUni) {
      return {
        id: liveUni.id,
        slug: liveUni.id,
        aliases: [liveUni.shortName.toLowerCase()],
        name: liveUni.name,
        shortName: liveUni.shortName,
        fullName: `${liveUni.name} (${liveUni.shortName})`,
        badge: liveUni.type || 'University',
        verified: true,
        type: liveUni.type || 'State Public University',
        location: `${liveUni.city}, ${liveUni.state}`,
        city: liveUni.city,
        state: liveUni.state,
        officialWebsite: liveUni.website || '#',
        websiteDisplay: liveUni.website ? liveUni.website.replace(/^https?:\/\//, '') : 'N/A',
        description: liveUni.description || `${liveUni.name} academic catalog and regulations.`,
        courseCategories: ['All', 'Undergraduate (UG)', 'Postgraduate (PG)'],
        courses: (liveUni.courses || []).map((c) => ({
          id: c.id,
          name: c.shortName,
          fullName: c.name,
          category: c.level === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)',
          degreeLevel: c.level || 'UG',
          durationYears: `${c.durationYears || 4} Years`,
          semesterCount: c.totalSemesters || 8,
          iconColor: 'blue',
          regulations: (c.regulations || []).map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            ruleVersion: r.ruleVersion,
            effectiveBatches: r.effectiveBatches || [],
            gradingScale: r.gradingScale || [],
            calculationMethod: r.calculationRule || {}
          }))
        })),
        gradingScale: [],
        faqs: [],
        relatedResources: liveUni.website ? [{ name: 'Official Website', url: liveUni.website, linkText: liveUni.website.replace(/^https?:\/\//, '') }] : []
      };
    }

    return staticUni;
  }, [id, catalogVersion]);

  // Track selected category (All, UG, PG, Diploma, PhD)
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Track active course
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Track active regulation
  const [selectedRegulationId, setSelectedRegulationId] = useState('');

  // Track sub-nav active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Track header description expansion
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);

  // Track campus photo carousel index
  const [photoIdx, setPhotoIdx] = useState(0);

  // Track FAQ open accordion
  const [openFaq, setOpenFaq] = useState(1);

  // Initialize and synchronize course & regulation when university changes
  useEffect(() => {
    if (university && Array.isArray(university.courses) && university.courses.length > 0) {
      // Default to MCA for OU to match reference design, or first course
      const initialCourse =
        university.id === 'osmania-university'
          ? university.courses.find((c) => c.id === 'mca') || university.courses[0]
          : university.courses[0];

      setSelectedCourseId(initialCourse.id);
      setSelectedCategory('All');

      // Set initial regulation for the chosen course
      if (Array.isArray(initialCourse.regulations) && initialCourse.regulations.length > 0) {
        setSelectedRegulationId(initialCourse.regulations[0].id);
      }
    }
  }, [university?.id]);

  // Handle invalid university URL with a graceful Not Found UI
  if (!university) {
    return (
      <div className="min-h-screen bg-bg-dark text-text-h flex flex-col">
        <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <ol className="flex items-center gap-2 text-xs text-text-m">
              <li className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-text-light" />
                <Link to="/" className="hover:text-accent transition-colors">Home</Link>
              </li>
              <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
              <li><Link to="/universities" className="hover:text-accent transition-colors">Universities</Link></li>
              <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
              <li className="font-bold text-text-h" aria-current="page">Not Found</li>
            </ol>
          </div>
        </nav>

        <main className="flex-grow max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-subtle flex items-center justify-center mx-auto text-accent">
            <Landmark className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-text-h">University Not Found</h1>
            <p className="text-sm text-text-m max-w-md mx-auto leading-relaxed">
              We couldn't locate academic records for <code className="text-accent px-2 py-0.5 rounded bg-bg-sec border border-border font-mono">{id}</code>. Please explore the verified universities directory.
            </p>
          </div>
          <div>
            <Link
              to="/universities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Universities Directory</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Derive active course object
  const activeCourse =
    university.courses.find((c) => c.id === selectedCourseId) || university.courses[0];

  // Derive active regulation object
  const activeRegulation =
    activeCourse?.regulations?.find((r) => r.id === selectedRegulationId) ||
    activeCourse?.regulations?.[0] ||
    null;

  // Filter courses by category
  const filteredCourses = useMemo(() => {
    if (!university.courses) return [];
    if (selectedCategory === 'All') return university.courses;
    return university.courses.filter((c) => c.category === selectedCategory);
  }, [university.courses, selectedCategory]);

  // Tab smooth scrolling helper
  const handleTabScroll = (tabKey, elementId) => {
    setActiveTab(tabKey);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll to grading section helper
  const handleScrollToGrading = () => {
    setActiveTab('grading');
    const el = document.getElementById('sec-grading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Switch Course Handler (Stays on details page, does NOT navigate to calculator)
  const handleSelectCourse = (course) => {
    setSelectedCourseId(course.id);
    if (Array.isArray(course.regulations) && course.regulations.length > 0) {
      setSelectedRegulationId(course.regulations[0].id);
    }
    showToast(`Selected ${course.name} (${course.fullName})`);
  };

  // Switch Regulation Handler
  const handleSelectRegulation = (reg) => {
    setSelectedRegulationId(reg.id);
    showToast(`Loaded ${reg.code} academic grading and calculation rules`);
  };

  // Campus Carousel controls
  const campusImages = university.campusImages || [];
  const handlePrevPhoto = () => {
    setPhotoIdx((prev) => (prev === 0 ? campusImages.length - 1 : prev - 1));
  };
  const handleNextPhoto = () => {
    setPhotoIdx((prev) => (prev === campusImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-h flex flex-col">
      {/* 1. Breadcrumb Navigation */}
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
            <li className="font-bold text-text-h truncate" aria-current="page">{university.name}</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-5">
        {/* 2. University Header Card (Matches Screenshot Reference) */}
        <section
          className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle relative overflow-hidden"
          aria-label="University Overview Header"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Emblem, Info & Description */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-5">
              <UniversityEmblem
                university={university}
                className="w-24 h-24 sm:w-28 sm:h-28"
                lightBg={true}
              />

              <div className="space-y-2.5 flex-1 min-w-0 text-left">
                <div>
                  {/* Category Pill with Dot */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{university.badge || university.type}</span>
                  </div>

                  {/* University Title */}
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    {university.fullName}
                  </h1>

                  {/* Location & Verified Status */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-m">
                    <span>{university.location}</span>
                    {university.verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Verified Information</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata 4-Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-sec/70 border border-border/80">
                    <Calendar className="w-4 h-4 text-accent shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Established</span>
                      <span className="font-bold text-text-h truncate block">{university.established}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-sec/70 border border-border/80">
                    <Landmark className="w-4 h-4 text-brandBlue shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Type</span>
                      <span className="font-bold text-text-h truncate block">{university.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-sec/70 border border-border/80">
                    <MapPin className="w-4 h-4 text-brandPink shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Location</span>
                      <span className="font-bold text-text-h truncate block">{university.city}, TS</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-sec/70 border border-border/80">
                    <Globe className="w-4 h-4 text-brandGreen shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-text-light block uppercase font-bold tracking-wider">Official Website</span>
                      <a
                        href={university.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-accent hover:underline flex items-center gap-0.5 truncate"
                      >
                        <span className="truncate">{university.websiteDisplay}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Expandable Overview Paragraph */}
                <div className="pt-1 text-xs text-text-m leading-relaxed">
                  <p className={isHeroExpanded ? '' : 'line-clamp-2'}>
                    {university.description}
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

            {/* Right Column: Campus Photograph Card with Carousel */}
            <div className="lg:col-span-4 relative rounded-2xl overflow-hidden border border-border bg-bg-sec aspect-[16/10] shadow-subtle group">
              {campusImages.length > 0 ? (
                <>
                  <img
                    src={campusImages[photoIdx]?.url}
                    alt={campusImages[photoIdx]?.caption || `${university.name} Campus`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black tracking-tight block">
                          {campusImages[photoIdx]?.caption}
                        </span>
                        <span className="text-[10px] text-slate-300 block">
                          {campusImages[photoIdx]?.location}
                        </span>
                      </div>

                      {/* Pagination Dots & Navigation Arrows */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {campusImages.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPhotoIdx(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                photoIdx === i ? 'w-3 bg-accent' : 'bg-white/50'
                              }`}
                              aria-label={`Go to photo ${i + 1}`}
                            />
                          ))}
                        </div>

                        {campusImages.length > 1 && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={handlePrevPhoto}
                              className="w-5 h-5 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                              aria-label="Previous photo"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNextPhoto}
                              className="w-5 h-5 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                              aria-label="Next photo"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-text-m">
                  <Landmark className="w-8 h-8 text-accent/60 mb-2" />
                  <span className="text-xs font-bold text-text-h">{university.name}</span>
                  <span className="text-[11px] text-text-light">Main Campus</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. University Sub-Navigation Tabs Bar */}
        <section
          className="border border-border bg-card rounded-xl p-1.5 shadow-subtle overflow-x-auto"
          aria-label="University Sub Navigation"
        >
          <div className="flex items-center gap-1.5 min-w-max text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview', target: 'sec-overview', icon: BookOpen },
              { id: 'courses', label: 'Courses', target: 'sec-courses', icon: Layers },
              { id: 'regulations', label: 'Regulations', target: 'sec-regulations', icon: FileCheck },
              { id: 'grading', label: 'Grading System', target: 'sec-grading', icon: GraduationCap },
              { id: 'calculators', label: 'Calculators', target: 'sec-calculators', icon: Calculator },
              { id: 'guidelines', label: 'Results & Guidelines', target: 'sec-guidelines', icon: ClipboardList },
              { id: 'faq', label: 'FAQ', target: 'sec-faq', icon: HelpCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabScroll(tab.id, tab.target)}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    isActive
                      ? 'text-orange-400 bg-orange-500/15 border border-orange-500/30 font-bold shadow-sm'
                      : 'text-text-m hover:text-text-h hover:bg-bg-sec'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-text-light'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Left Column (8 of 12) */}
          <div className="lg:col-span-8 space-y-5">
            {/* 4.1 Section: Supported Courses at University */}
            <section
              id="sec-courses"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-accent border border-orange-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text-h">
                      Supported Courses at {university.shortName}
                    </h2>
                    <p className="text-[11px] text-text-m">
                      Select a course to view its regulations, grading system and calculation rules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {(university.courseCategories || ['All', 'Undergraduate (UG)', 'Postgraduate (PG)']).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-accent text-white font-bold shadow-sm'
                          : 'bg-bg-sec border border-border/80 text-text-m hover:text-text-h hover:border-accent/40'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Course Cards Grid (3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCourses.map((course) => {
                  const isSelected = activeCourse?.id === course.id;
                  const isUG = course.degreeLevel === 'UG';

                  return (
                    <div
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30 shadow-subtle'
                          : 'border-border bg-bg-sec hover:border-accent/60 hover:bg-bg-sec/70'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-orange-500/20 text-accent'
                                : 'bg-blue-500/10 text-brandBlue'
                            }`}
                          >
                            <GraduationCap className="w-4 h-4" />
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isUG
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                            }`}
                          >
                            {course.degreeLevel || 'DEGREE'}
                          </span>
                        </div>

                        <div>
                          <h3
                            className={`text-sm font-bold transition-colors ${
                              isSelected ? 'text-accent' : 'text-text-h group-hover:text-accent'
                            }`}
                          >
                            {course.name}
                          </h3>
                          <p className="text-[11px] text-text-m mt-0.5 line-clamp-1">
                            {course.fullName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-text-light font-medium">{course.durationYears}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCourse(course);
                            handleScrollToGrading();
                          }}
                          className="inline-flex items-center gap-1 font-bold text-accent hover:text-accent-hover hover:underline transition-colors focus:outline-none"
                          aria-label={`View grading system for ${course.name}`}
                        >
                          <span>View Grading System</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Selected Course Banner with Scroll Action */}
              {activeCourse && (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                    <div>
                      <span className="text-text-m">Selected Course: </span>
                      <strong className="text-accent font-bold">{activeCourse.name}</strong>
                      <span className="text-text-light ml-1">({activeCourse.fullName})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleScrollToGrading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all shrink-0 self-start sm:self-auto"
                  >
                    <span>View Grading System</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </section>

            {/* 4.2 Section: Regulations for Selected Course */}
            <section
              id="sec-regulations"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-accent border border-orange-500/30 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text-h">
                      Regulations for {activeCourse?.name} ({university.shortName})
                    </h2>
                    <p className="text-[11px] text-text-m">
                      Select the regulation/batch to view grading system and calculation rules.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleScrollToGrading}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Inspect Grades</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Regulation Cards (Horizontal Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(activeCourse?.regulations || []).map((reg) => {
                  const isSelected = activeRegulation?.id === reg.id;
                  const isActiveStatus = reg.status === 'active';

                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleSelectRegulation(reg)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30 shadow-subtle'
                          : 'border-border bg-bg-sec hover:border-accent/60'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-base font-black block tracking-tight ${
                            isSelected ? 'text-accent' : 'text-text-h'
                          }`}
                        >
                          {reg.code}
                        </span>
                        <span className="text-[10px] text-text-m mt-0.5 block">
                          {reg.applicableBatches}
                        </span>
                      </div>

                      <div className="mt-4 pt-2 border-t border-border/60 flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            isActiveStatus
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                          }`}
                        >
                          {isActiveStatus ? 'Active' : 'Archived'}
                        </span>
                        <ArrowRight
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-accent' : 'text-text-light'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4.3 Section: Grading System Table */}
            <section
              id="sec-grading"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-accent border border-orange-500/30 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text-h">
                      Grading System ({activeCourse?.name} - {activeRegulation?.code})
                    </h2>
                    <p className="text-[11px] text-text-m">
                      {activeRegulation?.isSpecialOUGradeRule
                        ? "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA."
                        : activeRegulation?.gradingSchemeNote ||
                          `Official grading scheme for ${activeCourse?.name} under ${activeRegulation?.code}.`}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 shrink-0 self-start sm:self-center">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official (As per {university.shortName})</span>
                </div>
              </div>

              {/* Grading Table */}
              {(!activeRegulation?.grades || activeRegulation.grades.length === 0) ? (
                <div className="p-8 text-center text-text-m text-xs bg-bg-sec/50 rounded-xl border border-border">
                  Grading information not configured yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/80">
                        <th className="py-2.5 px-4 text-left">Grade</th>
                        <th className="py-2.5 px-4 text-center">Grade Point</th>
                        <th className="py-2.5 px-4 text-left">Performance</th>
                        <th className="py-2.5 px-4 text-right">Marks Range (Indicative)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {activeRegulation.grades.map((row) => (
                        <tr key={row.grade} className="hover:bg-bg-sec/50 transition-colors">
                          <td className="py-2.5 px-4 text-left">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-7 rounded-md font-black text-xs ${
                                row.badgeColor || 'bg-bg-sec text-text-h border border-border'
                              }`}
                            >
                              {row.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-text-h">
                            {row.point}
                          </td>
                          <td className="py-2.5 px-4 text-left text-text-h font-medium">
                            {row.performance}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-text-m">
                            {row.range}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 4.4 Section: Calculation Method */}
            <section
              id="sec-calculation"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-border/70">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-accent border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text-h">Calculation Method</h2>
                  <p className="text-[11px] text-text-m">
                    Official formulas for SGPA, CGPA, and degree percentage conversion.
                  </p>
                </div>
              </div>

              {/* 3 Formula Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. SGPA Formula */}
                <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-serif text-sm font-bold shrink-0">
                      Σ
                    </div>
                    <span className="text-xs font-bold text-text-h">SGPA Formula</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/80 font-mono text-[11px] text-purple-300 font-semibold leading-relaxed">
                    {activeRegulation?.calculationRule?.sgpaFormula ||
                      'SGPA = Σ (Credit × Grade Point) / Σ Credits'}
                  </div>
                  <p className="text-[11px] text-text-m leading-snug">
                    {activeRegulation?.calculationRule?.sgpaDesc ||
                      'Semester Grade Point Average based on subject credits and grade points.'}
                  </p>
                </div>

                {/* 2. CGPA Formula */}
                <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-serif text-sm font-bold shrink-0">
                      Σ
                    </div>
                    <span className="text-xs font-bold text-text-h">CGPA Formula</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/80 font-mono text-[11px] text-blue-300 font-semibold leading-relaxed">
                    {activeRegulation?.calculationRule?.cgpaFormula ||
                      'CGPA = Σ (Total Credit Points) / Σ (Total Credits)'}
                  </div>
                  <p className="text-[11px] text-text-m leading-snug">
                    {activeRegulation?.calculationRule?.cgpaDesc ||
                      'Cumulative Grade Point Average of all completed semesters.'}
                  </p>
                </div>

                {/* 3. Percentage Conversion */}
                <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-sm shrink-0">
                      %
                    </div>
                    <span className="text-xs font-bold text-text-h">Percentage Conversion</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/80 font-mono text-[11px] text-violet-300 font-semibold leading-relaxed">
                    {activeRegulation?.calculationRule?.percentageFormula ||
                      'Percentage = CGPA × 10'}
                  </div>
                  <p className="text-[11px] text-text-m leading-snug">
                    {activeRegulation?.calculationRule?.percentageDesc ||
                      `Applicable for ${activeCourse?.name} (${university.shortName}).`}
                  </p>
                </div>
              </div>
            </section>

            {/* 4.5 Section: Available Calculators for University */}
            <section
              id="sec-calculators"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-accent border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text-h">
                      Available Calculators for {university.shortName}
                    </h2>
                    <p className="text-[11px] text-text-m">
                      Contextual tools pre-configured for {university.shortName} {activeCourse?.name} ({activeRegulation?.code}).
                    </p>
                  </div>
                </div>

                <Link
                  to="/calculators"
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <span>All Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    name: 'CGPA Calculator',
                    desc: `For ${university.shortName} ${activeCourse?.name} (${activeRegulation?.code})`,
                    icon: GraduationCap,
                    color: 'text-orange-400 bg-orange-500/15',
                    route: `/calculators/cgpa?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`
                  },
                  {
                    name: 'SGPA Calculator',
                    desc: 'For all semesters',
                    icon: FileCheck,
                    color: 'text-emerald-400 bg-emerald-500/15',
                    route: `/calculators/sgpa?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`
                  },
                  {
                    name: 'Grade Calculator',
                    desc: 'Check grade from marks',
                    icon: Award,
                    color: 'text-blue-400 bg-blue-500/15',
                    route: `/calculators/grade?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`
                  },
                  {
                    name: 'Percentage Calculator',
                    desc: 'Convert CGPA to percentage',
                    icon: Percent,
                    color: 'text-violet-400 bg-violet-500/15',
                    route: `/calculators/percentage?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.route}
                      className="group p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:shadow-subtle transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-text-h group-hover:text-accent transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-[10.5px] text-text-m mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-accent font-bold">
                        <span>Open Tool</span>
                        <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 4.6 Section: Results & Academic Guidelines */}
            <section
              id="sec-guidelines"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="pb-2 border-b border-border/70">
                <h2 className="text-base sm:text-lg font-bold text-text-h">
                  Results & Academic Guidelines
                </h2>
                <p className="text-[11px] text-text-m">
                  Essential academic ordinances, degree requirements, and examination regulations for {university.shortName}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(university.guidelines || []).map((guide, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-bg-sec border border-border/80 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-text-h">{guide.title}</h3>
                    </div>
                    <p className="text-[11px] text-text-m leading-relaxed">
                      {guide.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4.7 Section: Frequently Asked Questions (FAQ) */}
            <section
              id="sec-faq"
              className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle space-y-4 text-left"
            >
              <div className="pb-2 border-b border-border/70">
                <h2 className="text-base sm:text-lg font-bold text-text-h">
                  Frequently Asked Questions
                </h2>
                <p className="text-[11px] text-text-m">
                  Common queries regarding {university.shortName} courses, grading scales, and calculators.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {(university.faqs || []).map((faq) => {
                  const isOpen = openFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="border border-border rounded-xl overflow-hidden bg-bg-sec"
                    >
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

          {/* Right Sidebar Column (4 of 12 - Matches Reference Design) */}
          <aside
            className="lg:col-span-4 space-y-5 lg:sticky lg:top-20 text-left"
            aria-label="University Side Actions"
          >
            {/* Sidebar Card 1: Quick Actions */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3.5">
              <div className="pb-2 border-b border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
                    Quick Actions
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <Link
                  to={`/calculators/cgpa?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`}
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-accent flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">
                        Try CGPA Calculator
                      </span>
                      <span className="text-[11px] text-text-m leading-snug">
                        Calculate your cumulative grade point average
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>

                <Link
                  to={`/calculators/sgpa?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`}
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-brandGreen flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">
                        Try SGPA Calculator
                      </span>
                      <span className="text-[11px] text-text-m leading-snug">
                        Calculate semester grade point average
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>

                <Link
                  to={`/calculators/percentage?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`}
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">
                        Try Percentage Calculator
                      </span>
                      <span className="text-[11px] text-text-m leading-snug">
                        Convert your CGPA to percentage
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>

                <Link
                  to={`/calculators/grade?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`}
                  className="p-3 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-brandBlue flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs">
                        Try Grade Calculator
                      </span>
                      <span className="text-[11px] text-text-m leading-snug">
                        Find your letter grade from marks
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              </div>
            </div>

            {/* Sidebar Card 2: University Information */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3.5">
              <div className="pb-2 border-b border-border/70 flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
                  University Information
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-light">Full Name</span>
                  <span className="font-bold text-text-h text-right">{university.name}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-light">Established</span>
                  <span className="font-bold text-text-h">{university.established}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-light">Type</span>
                  <span className="font-bold text-text-h">{university.type}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-light">Location</span>
                  <span className="font-bold text-text-h">{university.city}, {university.state}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-light">Official Website</span>
                  <a
                    href={university.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <span>{university.websiteDisplay}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-light">Accreditation</span>
                  <span className="font-bold text-emerald-400">{university.accreditation}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-light">Academic Calendar</span>
                  <a
                    href={university.academicCalendarUrl || university.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <span>View Calendar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Sidebar Card 3: Related Resources */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="pb-2 border-b border-border/70 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
                  Related Resources
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {(university.relatedResources || []).map((res) => (
                  <a
                    key={res.name}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-border bg-bg-sec hover:border-accent flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">
                          {res.name}
                        </span>
                        <span className="text-[10px] text-text-m block truncate">
                          {res.linkText}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-text-light group-hover:text-accent transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            {/* Sidebar Card 4: Related Universities */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="pb-2 border-b border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
                    Related Universities
                  </h3>
                </div>
                <Link to="/universities" className="text-[10.5px] font-bold text-accent hover:underline">
                  View All →
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                {(university.relatedUniversities || []).map((rel) => (
                  <Link
                    key={rel.name}
                    to={rel.route}
                    className="p-2.5 rounded-xl border border-border bg-bg-sec hover:border-accent flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] ${
                          rel.color || 'bg-accent-soft text-accent'
                        }`}
                      >
                        {rel.short}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-text-h group-hover:text-accent transition-colors block text-xs truncate">
                          {rel.name}
                        </span>
                        <span className="text-[10px] text-text-m block truncate">
                          {rel.state}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* 5. High-Impact Horizontal CTA Banner */}
        <section
          className="rounded-3xl bg-gradient-to-r from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-6 sm:p-8 shadow-accent relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
          aria-label={`Calculate ${university.shortName} Results`}
        >
          <div className="flex items-center gap-4 text-left z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Understand Your {university.shortName} Results Better
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                Calculate your semester SGPA, cumulative CGPA, and degree conversion using official {university.shortName} {activeCourse?.name} ({activeRegulation?.code}) regulations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10 w-full sm:w-auto">
            <Link
              to={`/calculators/cgpa?uni=${university.id}&course=${activeCourse?.id}&reg=${activeRegulation?.code}`}
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

        {/* 6. Reusable Bottom Explore Tools */}
        <ExploreMoreTools />
      </main>
    </div>
  );
}