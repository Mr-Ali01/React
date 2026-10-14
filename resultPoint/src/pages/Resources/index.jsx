import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  BookOpen,
  Grid,
  RefreshCw,
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  SearchX,
  Crown,
  Bell,
  Mail,
  Sparkles,
  CheckCircle,
  Gift,
  Smartphone,
  FileText,
  Compass,
  ClipboardList,
  Briefcase,
  Clock,
  Download,
  ArrowRight
} from 'lucide-react';
import { RESOURCES_DATA } from '../../data/resourcesData';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  { name: 'All Resources', icon: Grid },
  { name: 'Study Materials', icon: BookOpen },
  { name: 'Previous Papers', icon: FileText },
  { name: 'Guides & Tips', icon: Compass },
  { name: 'Exam Info', icon: ClipboardList },
  { name: 'Career Resources', icon: Briefcase },
  { name: 'News & Updates', icon: Bell }
];

const RESOURCE_TYPES = [
  { name: 'Study Material', count: 156 },
  { name: 'Previous Papers', count: 432 },
  { name: 'Career Guide', count: 87 },
  { name: 'Exam Information', count: 54 },
  { name: 'General Knowledge', count: 32 },
  { name: 'News & Updates', count: 28 }
];

const EDUCATION_LEVELS = [
  { value: 'All', label: 'All Levels' },
  { value: 'UG', label: 'Undergraduate (UG)' },
  { value: 'PG', label: 'Postgraduate (PG)' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'PhD', label: 'PhD' }
];

const STREAMS = [
  'All',
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'General'
];

const FILE_FORMATS = ['PDF', 'Notes', 'Articles', 'Videos', 'Infographics'];

const BADGE_STYLES = {
  Featured: 'bg-accent text-white',
  New: 'bg-emerald-600 text-white',
  Career: 'bg-blue-600 text-white',
  Popular: 'bg-purple-600 text-white',
  Important: 'bg-amber-600 text-white'
};

export default function ResourcesDirectory() {
  const [currentCategory, setCurrentCategory] = useState('All Resources');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedStream, setSelectedStream] = useState('All');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [sortOrder, setSortOrder] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [sideEmail, setSideEmail] = useState('');

  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 9;

  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const handleFormatToggle = (format) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setCurrentCategory('All Resources');
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedLevel('All');
    setSelectedStream('All');
    setSelectedFormats([]);
    setSortOrder('latest');
    setCurrentPage(1);
    showToast('All filters and searches have been reset.');
  };

  const handleSideNewsletterSubmit = (e) => {
    e.preventDefault();
    if (sideEmail.includes('@')) {
      showToast('Thank you for subscribing to academic updates!');
      setSideEmail('');
    }
  };

  // Filter & Sort Logic
  const filteredResources = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const list = RESOURCES_DATA.filter((res) => {
      // Category Pill
      if (currentCategory !== 'All Resources' && res.category !== currentCategory) {
        return false;
      }

      // Search Query
      if (query) {
        const inTitle = res.title.toLowerCase().includes(query);
        const inCat = res.category.toLowerCase().includes(query);
        const inTags = res.tags.some((t) => t.toLowerCase().includes(query));
        const inStream = res.stream.toLowerCase().includes(query);
        if (!inTitle && !inCat && !inTags && !inStream) return false;
      }

      // Resource Type Checkboxes
      if (selectedTypes.length > 0 && !selectedTypes.includes(res.resourceType)) {
        return false;
      }

      // Education Level Radio
      if (selectedLevel !== 'All' && res.educationLevel !== 'All' && res.educationLevel !== selectedLevel) {
        return false;
      }

      // Stream Select
      if (selectedStream !== 'All' && res.stream !== 'General' && res.stream !== selectedStream) {
        return false;
      }

      // File Format Checkboxes
      if (selectedFormats.length > 0 && !selectedFormats.includes(res.fileFormat)) {
        return false;
      }

      return true;
    });

    if (sortOrder === 'popular') {
      return list.sort((a, b) => b.views - a.views);
    } else if (sortOrder === 'downloads') {
      return list.sort((a, b) => b.downloads - a.downloads);
    } else if (sortOrder === 'views') {
      return list.sort((a, b) => b.views - a.views);
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [currentCategory, searchTerm, selectedTypes, selectedLevel, selectedStream, selectedFormats, sortOrder]);

  const totalCount = filteredResources.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredResources.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">Resources</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-1">
          <div className="lg:col-span-7 space-y-4 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-text-h tracking-tight leading-[1.15]">
              Academic <span className="text-accent">Resources</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-text-m leading-relaxed max-w-xl">
              Study materials, guides, tips and everything you need for your academic success — in one place.
            </p>

            {/* 4 Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h leading-none">1000+ Resources</div>
                  <div className="text-[10px] text-text-light mt-0.5">Quality content</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h leading-none">Free Access</div>
                  <div className="text-[10px] text-text-light mt-0.5">Always free to use</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h leading-none">Updated Weekly</div>
                  <div className="text-[10px] text-text-light mt-0.5">Fresh syllabus notes</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h leading-none">Student Friendly</div>
                  <div className="text-[10px] text-text-light mt-0.5">Trusted by students</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Illustration Composition */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-2 lg:pt-0">
            <div className="relative w-full max-w-[460px] rounded-3xl overflow-hidden shadow-theme border border-border bg-card p-4 sm:p-5 flex items-center justify-center min-h-[220px]">
              <div className="relative w-full flex items-center justify-center">
                {/* Book Stack */}
                <div className="relative shrink-0 flex flex-col items-center mr-2 z-10">
                  <div className="w-14 sm:w-16 h-4 bg-brandGreen rounded-sm shadow-subtle mb-[-2px] transform -rotate-2"></div>
                  <div className="w-16 sm:w-18 h-4 bg-accent rounded-sm shadow-subtle mb-[-2px] transform rotate-1"></div>
                  <div className="w-18 sm:w-20 h-5 bg-brandBlue rounded-sm shadow-subtle"></div>
                </div>

                {/* Laptop Display */}
                <div className="relative z-20 w-48 sm:w-56 bg-slate-900 rounded-t-xl p-1.5 border border-slate-700 shadow-xl">
                  <div className="w-1 h-1 rounded-full bg-slate-600 mx-auto mb-1"></div>
                  <div className="bg-bg-sec rounded-md p-2 text-text-h shadow-inner border border-border text-left overflow-hidden space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-border text-[7px] text-text-light">
                      <span className="font-bold text-accent flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" /> ResultPoint
                      </span>
                      <span>Resource Portal</span>
                    </div>

                    <div className="p-1.5 rounded bg-card border border-border/80 flex items-center justify-center gap-2">
                      <div className="w-6 h-8 bg-blue-500/10 rounded-xs border border-blue-500/20 p-0.5 space-y-0.5">
                        <div className="w-full h-0.5 bg-brandBlue"></div>
                        <div className="w-3/4 h-0.5 bg-blue-300"></div>
                        <div className="w-4/5 h-0.5 bg-blue-300"></div>
                      </div>
                      <div className="w-6 h-8 bg-orange-500/10 rounded-xs border border-accent/20 p-0.5 space-y-0.5">
                        <div className="w-full h-0.5 bg-accent"></div>
                        <div className="w-3/4 h-0.5 bg-orange-300"></div>
                        <div className="w-4/5 h-0.5 bg-orange-300"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[6.5px] text-center">
                      <div className="p-0.5 rounded bg-emerald-500/10 text-brandGreen font-bold">
                        ✓ Verified Notes
                      </div>
                      <div className="p-0.5 rounded bg-blue-500/10 text-brandBlue font-bold">
                        100% Free
                      </div>
                    </div>
                  </div>
                  <div className="w-56 sm:w-64 h-2 bg-slate-800 rounded-b-md mx-auto relative -mb-1 border-t border-slate-700"></div>
                </div>
              </div>

              {/* Handwritten Note Annotation */}
              <div className="absolute top-3 right-4 select-none transform rotate-[-4deg] text-right pointer-events-none">
                <span className="text-text-h text-xs sm:text-sm font-bold leading-tight block italic">
                  Learn • Grow<br />Achieve Together
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="rounded-2xl bg-card border border-border p-3.5 sm:p-4 shadow-subtle">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-grow w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search resources, guides, papers, and subjects..."
                className="calc-input w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h placeholder:text-text-light"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-accent active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Search</span>
            </button>
          </form>
        </section>

        {/* Category Navigation Horizontal Pills */}
        <section className="overflow-x-auto pb-1" aria-label="Resource Categories">
          <div className="flex items-center gap-2 min-w-max text-xs font-semibold">
            {CATEGORIES.map((cat) => {
              const isActive = cat.name === currentCategory;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setCurrentCategory(cat.name);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-accent text-white font-bold border-accent shadow-accent'
                      : 'bg-card text-text-h border border-border hover:bg-bg-sec hover:border-accent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-text-light'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Workspace (Sidebar + Resource Grid + Popular Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Left Filter Sidebar */}
          <aside className="lg:col-span-3 space-y-4" aria-label="Resource Filters">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle text-left">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-h">
                  Filter Resources
                </h2>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Resource Type */}
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-text-m mb-2">
                    Resource Type
                  </span>
                  <div className="space-y-1.5 text-text-h">
                    {RESOURCE_TYPES.map((type) => (
                      <label key={type.name} className="flex items-center justify-between cursor-pointer group">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type.name)}
                            onChange={() => handleTypeToggle(type.name)}
                            className="w-3.5 h-3.5 rounded text-accent focus:ring-accent border-border bg-bg-sec cursor-pointer"
                          />
                          <span className="group-hover:text-accent transition-colors">{type.name}</span>
                        </span>
                        <span className="text-[10px] text-text-light">({type.count})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Education Level */}
                <div className="pt-3 border-t border-border">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-text-m mb-2">
                    Education Level
                  </span>
                  <div className="space-y-1.5 text-text-h">
                    {EDUCATION_LEVELS.map((lvl) => (
                      <label key={lvl.value} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="educationLevel"
                          value={lvl.value}
                          checked={selectedLevel === lvl.value}
                          onChange={(e) => {
                            setSelectedLevel(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-3.5 h-3.5 text-accent focus:ring-accent border-border bg-bg-sec cursor-pointer"
                        />
                        <span className="group-hover:text-accent transition-colors">{lvl.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stream / Branch */}
                <div className="pt-3 border-t border-border">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-m mb-1.5">
                    Stream / Branch
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStream}
                      onChange={(e) => {
                        setSelectedStream(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="calc-input w-full px-3 py-2 rounded-xl border border-border bg-bg-sec text-xs text-text-h cursor-pointer appearance-none pr-8 font-medium"
                    >
                      {STREAMS.map((st) => (
                        <option key={st} value={st}>{st === 'All' ? 'All Streams' : st}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                {/* File Format */}
                <div className="pt-3 border-t border-border">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-text-m mb-2">
                    File Format
                  </span>
                  <div className="space-y-1.5 text-text-h">
                    {FILE_FORMATS.map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFormats.includes(fmt)}
                          onChange={() => handleFormatToggle(fmt)}
                          className="w-3.5 h-3.5 rounded text-accent focus:ring-accent border-border bg-bg-sec cursor-pointer"
                        />
                        <span className="group-hover:text-accent transition-colors">{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('Filters applied successfully.')}
                    className="w-full py-2.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-accent active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Apply Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Column 2: Center Resource Cards Grid */}
          <section className="lg:col-span-6 space-y-4" aria-label="Latest Resources Grid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-extrabold text-text-h tracking-tight">
                  {currentCategory === 'All Resources' ? 'Latest Resources' : currentCategory}
                </h2>
                <p className="text-[11px] text-text-m mt-0.5">
                  Discover verified study materials, question papers, and guidelines.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label className="text-[11px] text-text-m font-medium hidden sm:inline-block">Sort by:</label>
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="calc-input px-3 py-1.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h font-semibold cursor-pointer appearance-none pr-7"
                  >
                    <option value="latest">Latest</option>
                    <option value="popular">Popular</option>
                    <option value="downloads">Most Downloaded</option>
                    <option value="views">Most Viewed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-2.5 pointer-events-none text-text-light" />
                </div>
              </div>
            </div>

            {/* Empty State */}
            {totalCount === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-12 text-center space-y-3 shadow-subtle">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-accent mx-auto flex items-center justify-center">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-text-h">No resources found</h3>
                <p className="text-xs text-text-m max-w-sm mx-auto">
                  Try another search query or clear your filter parameters.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-accent"
                >
                  Clear Search & Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {pageItems.map((res) => (
                  <article
                    key={res.id}
                    onClick={() => showToast(`Opening resource: "${res.title}"`)}
                    className="group rounded-2xl bg-card border border-border overflow-hidden shadow-subtle hover:border-accent hover:shadow-theme hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Thumbnail Banner */}
                      <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-bg-sec">
                        <img
                          src={res.image}
                          alt={res.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {res.badge && (
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide ${BADGE_STYLES[res.badge] || 'bg-accent text-white'}`}>
                              {res.badge}
                            </span>
                          </div>
                        )}
                        {res.mediaType && (
                          <div className="absolute bottom-2 right-2 z-10">
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase bg-black/75 text-white backdrop-blur-xs flex items-center gap-0.5">
                              {res.mediaType}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="p-3.5 space-y-2 text-left">
                        <h3 className="text-xs sm:text-sm font-bold text-text-h group-hover:text-accent transition-colors leading-snug line-clamp-2 min-h-[34px]" title={res.title}>
                          {res.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {res.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md font-medium text-[9.5px] bg-bg-sec text-text-m border border-border/70">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="px-3.5 py-2.5 border-t border-border/80 bg-bg-sec/30 flex items-center justify-between text-[10.5px] text-text-light">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-text-light" />
                        <span>{res.metaLeft}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-text-m">
                        <span>{res.metaRight}</span>
                        <ArrowRight className="w-3 h-3 text-accent -rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="text-text-m">
                  Showing <span className="font-bold text-text-h">{startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold text-text-h">{totalCount}</span> resources
                </div>

                <nav aria-label="Resource pages" className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setCurrentPage(p);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors ${
                          p === currentPage
                            ? 'bg-accent text-white shadow-accent'
                            : 'border border-border bg-card text-text-m hover:text-accent hover:border-accent'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </nav>
              </div>
            )}
          </section>

          {/* Column 3: Right Sidebar (Popular Downloads & News) */}
          <aside className="lg:col-span-3 space-y-4 text-left" aria-label="Popular Downloads and Updates">
            {/* Popular Downloads Card */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle">
              <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-border">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-text-h">Popular Downloads</h3>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { rank: 1, name: 'JNTU Previous Papers', count: '28.3K downloads', cat: 'Previous Papers' },
                  { rank: 2, name: 'DSA Notes (Complete)', count: '25.7K downloads', cat: 'Study Materials' },
                  { rank: 3, name: 'CGPA Guide PDF', count: '22.1K downloads', cat: 'Guides & Tips' },
                  { rank: 4, name: 'Web Dev Roadmap', count: '18.9K downloads', cat: 'Career Resources' },
                  { rank: 5, name: 'Engineering Syllabus', count: '16.4K downloads', cat: 'Exam Info' }
                ].map((item) => (
                  <div
                    key={item.name}
                    onClick={() => {
                      setCurrentCategory(item.cat);
                      setCurrentPage(1);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-bg-sec transition-colors cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500/10 text-accent font-extrabold flex items-center justify-center text-[10px] shrink-0">
                      {item.rank}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-text-h group-hover:text-accent transition-colors block truncate">{item.name}</span>
                      <span className="text-[10px] text-text-light">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentCategory('Previous Papers');
                    setCurrentPage(1);
                  }}
                  className="w-full py-1.5 rounded-xl border border-accent/40 text-accent hover:bg-accent-soft text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <span>View All Downloads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recent Updates */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-brandBlue" />
                  <h3 className="text-xs font-bold text-text-h">Recent Updates</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentCategory('News & Updates')}
                  className="text-[10px] font-semibold text-accent hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="border-b border-border/60 pb-2">
                  <span className="font-bold text-text-h hover:text-accent transition-colors block text-xs cursor-pointer">
                    JNTU R18 Syllabus Updated
                  </span>
                  <span className="text-[10px] text-text-light">May 20, 2026</span>
                </div>
                <div className="border-b border-border/60 pb-2">
                  <span className="font-bold text-text-h hover:text-accent transition-colors block text-xs cursor-pointer">
                    New CGPA Calculator Guide
                  </span>
                  <span className="text-[10px] text-text-light">May 18, 2026</span>
                </div>
                <div>
                  <span className="font-bold text-text-h hover:text-accent transition-colors block text-xs cursor-pointer">
                    Campus Placement Tips Added
                  </span>
                  <span className="text-[10px] text-text-light">May 15, 2026</span>
                </div>
              </div>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="rounded-2xl bg-[#071426] border border-[#272B32] p-4 text-white shadow-card space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-accent flex items-center justify-center mb-1">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide">Stay Updated!</h3>
              <p className="text-[11px] text-[#A1A1AA] leading-snug">
                Get the latest study notes, exam circulars and tips directly in your inbox.
              </p>

              <form onSubmit={handleSideNewsletterSubmit} className="space-y-2">
                <input
                  type="email"
                  value={sideEmail}
                  onChange={(e) => setSideEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#171A1F] border border-[#272B32] text-white placeholder-[#71717A] focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>

        {/* Quality Guarantee Benefits Banner */}
        <section className="mt-8 rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-subtle">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 text-accent text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>QUALITY GUARANTEE</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-text-h tracking-tight">
              Why Use ResultPoint Resources?
            </h3>
            <p className="text-xs text-text-m mt-0.5">
              Your trusted platform for authentic university resources.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-bg-sec border border-border/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Verified Content</h4>
                <p className="text-[10.5px] text-text-m mt-0.5 leading-snug">All resources reviewed by academic mentors.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-bg-sec border border-border/80">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">100% Free</h4>
                <p className="text-[10.5px] text-text-m mt-0.5 leading-snug">Zero paywalls or hidden membership fees.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-bg-sec border border-border/80">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Regular Updates</h4>
                <p className="text-[10.5px] text-text-m mt-0.5 leading-snug">Fresh materials added across academic semesters.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-bg-sec border border-border/80">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Active Community</h4>
                <p className="text-[10.5px] text-text-m mt-0.5 leading-snug">Trusted by thousands of university students.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-bg-sec border border-border/80">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-brandCyan flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Mobile Friendly</h4>
                <p className="text-[10.5px] text-text-m mt-0.5 leading-snug">Read and review study guides on any screen.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}