import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ShieldCheck,
  Zap,
  Users,
  Search,
  Wrench,
  Target,
  ThumbsUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  SearchX,
  ArrowRight,
  Lock,
  Mail,
  Lightbulb,
  X,
  Compass,
  MailPlus,
  Calculator,
  GraduationCap,
  Repeat,
  BarChart2,
  FileText,
  Percent,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  ArrowLeftRight,
  Clock,
  PieChart,
  FileCheck,
  FileSearch,
  Bookmark,
  Calendar,
  HelpCircle,
  FileDown,
  Bell,
  Grid
} from 'lucide-react';
import { CATEGORIES_CONFIG } from '../../../data/toolsData';
import { toolManagementService, TOOL_UPDATED_EVENT } from '../../../services/toolManagementService';
import { useToast } from '../../../context/ToastContext';

// Icon Dynamic Resolver
const ICON_COMPONENTS = {
  Grid,
  Calculator,
  GraduationCap,
  Repeat,
  BarChart2,
  FileText,
  Percent,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  ArrowLeftRight,
  Clock,
  PieChart,
  FileCheck,
  FileSearch,
  Bookmark,
  Calendar,
  HelpCircle,
  FileDown,
  Bell
};

const COLOR_MAP = {
  blue: 'bg-blue-500/10 text-brandBlue border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-brandGreen border-emerald-500/20',
  purple: 'bg-purple-500/10 text-brandPurple border-purple-500/20',
  amber: 'bg-amber-500/10 text-brandAmber border-amber-500/20',
  orange: 'bg-orange-500/10 text-accent border-accent/20',
  pink: 'bg-pink-500/10 text-brandPink border-pink-500/20',
  rose: 'bg-rose-500/10 text-brandPink border-rose-500/20',
  cyan: 'bg-cyan-500/10 text-brandCyan border-cyan-500/20'
};

export default function ToolsDirectory() {
  const [currentCategory, setCurrentCategory] = useState('All Tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [finderModalOpen, setFinderModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqToolName, setReqToolName] = useState('');

  // Dynamic tool registry integration
  const [activeTools, setActiveTools] = useState(() => toolManagementService.getActiveTools());

  useEffect(() => {
    const handleUpdate = () => {
      setActiveTools(toolManagementService.getActiveTools());
    };
    window.addEventListener(TOOL_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(TOOL_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 12;

  // Filter & Search Logic
  const filteredTools = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const list = activeTools.filter((tool) => {
      if (currentCategory !== 'All Tools' && tool.category !== currentCategory) {
        return false;
      }
      if (query) {
        const inName = tool.name.toLowerCase().includes(query);
        const inDesc = tool.description.toLowerCase().includes(query);
        const inCat = tool.category.toLowerCase().includes(query);
        const inKeywords = tool.keywords?.some((k) => k.toLowerCase().includes(query));
        return inName || inDesc || inCat || inKeywords;
      }
      return true;
    });

    if (sortOrder === 'used') {
      return list.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortOrder === 'newest') {
      return list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortOrder === 'az') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  }, [activeTools, currentCategory, searchTerm, sortOrder]);

  // Pagination calculation
  const totalItems = filteredTools.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSelectCategory = (catName) => {
    setCurrentCategory(catName);
    setCurrentPage(1);
    setMobileDrawerOpen(false);
  };

  const handleToolClick = (tool) => {
    showToast(`Opening ${tool.name}...`);
    navigate(tool.route);
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setRequestModalOpen(false);
    showToast(`Request for "${reqToolName}" submitted successfully!`);
    setReqToolName('');
  };

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
            <li className="font-semibold text-text-h" aria-current="page">Calculators & Tools</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-1">
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span>ACADEMIC TOOLS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-text-h tracking-tight leading-[1.15]">
              Academic <span className="text-accent">Tools & Calculators</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-text-m leading-relaxed max-w-xl">
              Smart tools and utilities to simplify your academic journey. Calculate, convert, analyze and achieve more with ResultPoint.
            </p>

            {/* 3 Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">Verified & Accurate</div>
                  <div className="text-[10px] text-text-m">Built with official rules</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">Free for Everyone</div>
                  <div className="text-[10px] text-text-m">All tools are 100% free</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">Student Focused</div>
                  <div className="text-[10px] text-text-m">Designed for your success</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Showcase Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-2 lg:pt-0">
            <div className="relative w-full max-w-[440px] rounded-3xl overflow-hidden shadow-theme border border-border bg-card p-4 sm:p-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/5 via-orange-500/5 to-purple-500/5 border border-border p-4 flex items-center justify-center min-h-[220px]">
                {/* Mini Tools Dashboard Simulation */}
                <div className="w-48 sm:w-56 bg-card border border-border rounded-xl shadow-subtle p-3 relative z-10 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border text-[9px] text-text-m">
                    <span className="font-bold text-text-h flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span> Workspace
                    </span>
                    <span>Active 2026</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[8.5px] font-semibold text-text-h">
                    <div className="p-1.5 rounded-lg bg-bg-sec border border-border/70 flex flex-col items-center gap-1">
                      <Calculator className="w-3 h-3 text-brandBlue" />
                      <span>Calculate</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-sec border border-border/70 flex flex-col items-center gap-1">
                      <BarChart2 className="w-3 h-3 text-brandGreen" />
                      <span>Analyze</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-sec border border-border/70 flex flex-col items-center gap-1">
                      <Calendar className="w-3 h-3 text-brandPurple" />
                      <span>Plan</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-sec border border-border/70 flex flex-col items-center gap-1">
                      <Repeat className="w-3 h-3 text-accent" />
                      <span>Convert</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-sec border border-border/70 flex flex-col items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-brandPink" />
                      <span>Track</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-sec border border-border/70 flex flex-col items-center gap-1">
                      {/* <Award className="w-3 h-3 text-brandAmber" /> */}
                      <span>Improve</span>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-3 right-5 z-20 w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center shadow-accent transform rotate-12">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="mt-2.5 text-right px-2">
                <span className="text-accent font-bold text-xs tracking-wide italic">
                  “Smarter Tools, Brighter Futures”
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Fast Stats Bar */}
        <section className="rounded-2xl bg-card border border-border p-3.5 sm:p-4 shadow-subtle">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 relative">
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
                placeholder="Search tools by name or category..."
                className="calc-input w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h placeholder:text-text-light"
              />
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-text-h block text-sm leading-none">20+</span>
                  <span className="text-[10.5px] text-text-m">Powerful Tools</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-text-h block text-sm leading-none">100%</span>
                  <span className="text-[10.5px] text-text-m">Free to Use</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-text-h block text-sm leading-none">Accurate</span>
                  <span className="text-[10.5px] text-text-m">Results</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-text-h block text-sm leading-none">Easy</span>
                  <span className="text-[10.5px] text-text-m">to Use</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4" aria-label="Tools Directory Filters">
            {/* Categories */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="pb-2.5 mb-2.5 border-b border-border flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-h">Categories</h2>
                <span className="text-[10.5px] font-semibold text-text-light">{activeTools.length}</span>
              </div>

              <div className="space-y-1 text-xs font-medium">
                {CATEGORIES_CONFIG.map((cat) => {
                  const count = cat.name === 'All Tools' ? activeTools.length : activeTools.filter((t) => t.category === cat.name).length;
                  const isActive = cat.name === currentCategory;
                  const Icon = ICON_COMPONENTS[cat.icon] || Grid;

                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleSelectCategory(cat.name)}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-accent-soft text-accent font-bold border border-accent/25'
                          : 'text-text-m hover:bg-bg-sec hover:text-text-h'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-text-light'}`} />
                        <span>{cat.name}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-accent text-white font-bold' : 'bg-bg-sec text-text-light border border-border/80'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Need Help Wizard Card */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-h">Need Help Choosing?</h3>
                  <p className="text-[11px] text-text-m mt-1 leading-snug">
                    Not sure which tool you need? Answer a question to get recommendations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFinderModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-accent-soft hover:bg-accent hover:text-white text-accent text-xs font-bold border border-accent/25 transition-all flex items-center justify-center gap-1.5 shadow-subtle"
              >
                <span>Find My Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Popular Shortcut Links */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="pb-2 mb-2 border-b border-border">
                <h3 className="text-xs font-bold text-text-h">Popular Tools</h3>
              </div>

              <div className="space-y-1.5 text-xs">
                <Link
                  to="/calculators/cgpa"
                  className="w-full p-2 rounded-xl hover:bg-bg-sec flex items-start gap-2.5 text-left text-text-m hover:text-accent transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0 mt-0.5">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-text-h group-hover:text-accent text-xs block truncate">CGPA Calculator</span>
                    <span className="text-[10px] text-text-light block truncate">Calculate your CGPA instantly</span>
                  </div>
                </Link>

                <Link
                  to="/calculators/cgpa#converter"
                  className="w-full p-2 rounded-xl hover:bg-bg-sec flex items-start gap-2.5 text-left text-text-m hover:text-accent transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0 mt-0.5">
                    <Repeat className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-text-h group-hover:text-accent text-xs block truncate">CGPA Converter</span>
                    <span className="text-[10px] text-text-light block truncate">Convert CGPA to Percentage</span>
                  </div>
                </Link>

                <Link
                  to="/calculators/target-cgpa"
                  className="w-full p-2 rounded-xl hover:bg-bg-sec flex items-start gap-2.5 text-left text-text-m hover:text-accent transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-orange-500/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-text-h group-hover:text-accent text-xs block truncate">Target CGPA Calculator</span>
                    <span className="text-[10px] text-text-light block truncate">Required GPA planning</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Request a Tool Box */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-text-h">Can't find a tool?</h4>
              </div>
              <p className="text-[11px] text-text-m leading-snug">
                Tell us what university regulation or tool you need.
              </p>
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec hover:border-accent text-accent text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Request a Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* Right Content: Grid & Pagination */}
          <section className="lg:col-span-9 space-y-4" aria-label="Tools Grid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-text-h tracking-tight">
                  {currentCategory}
                </h2>
                <p className="text-xs text-text-m mt-0.5">
                  {currentCategory === 'All Tools'
                    ? 'Explore all academic calculators, converters, and student planners.'
                    : `Handpicked academic tools specialized in ${currentCategory}.`}
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-text-h hover:border-accent"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                  <span>Categories</span>
                </button>

                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs text-text-m font-medium hidden sm:inline-block">Sort By:</label>
                  <div className="relative">
                    <select
                      id="sort-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="calc-input px-3 py-1.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h font-semibold cursor-pointer appearance-none pr-8"
                    >
                      <option value="popular">Popular</option>
                      <option value="used">Most Used</option>
                      <option value="newest">Newest</option>
                      <option value="az">A–Z</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-text-light">
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {totalItems === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-12 text-center space-y-3 shadow-subtle">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-accent mx-auto flex items-center justify-center">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-text-h">No tools found</h3>
                <p className="text-xs text-text-m max-w-sm mx-auto">
                  Try another keyword or reset category filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentCategory('All Tools');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-accent"
                >
                  View All Tools
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {pageItems.map((tool) => {
                  const Icon = ICON_COMPONENTS[tool.icon] || Calculator;
                  const colorClass = COLOR_MAP[tool.iconColor] || COLOR_MAP.orange;

                  return (
                    <div
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className="group rounded-2xl bg-card border border-border p-4 shadow-subtle hover:border-accent hover:shadow-theme hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {tool.isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 text-brandGreen border border-brandGreen/20">
                              NEW
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-text-h group-hover:text-accent transition-colors leading-snug">
                          {tool.name}
                        </h3>

                        <p className="text-[11px] text-text-m mt-1.5 leading-relaxed line-clamp-2 min-h-[32px]">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-border/80 flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-bg-sec text-text-m border border-border/80 truncate max-w-[120px]">
                          {tool.category}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-bg-sec group-hover:bg-accent group-hover:text-white text-accent flex items-center justify-center transition-colors">
                          <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-text-m">
                  Showing <span className="font-bold text-text-h">{startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-text-h">{totalItems}</span> tools
                </div>

                <nav aria-label="Tools pagination" className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </nav>
              </div>
            )}
          </section>
        </div>

        {/* Value Proposition Grid */}
        <section className="mt-8 rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-subtle">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h3 className="text-base sm:text-lg font-extrabold text-text-h tracking-tight">
              How Our Tools Help You Succeed?
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Accurate Calculations</h4>
                <p className="text-[11px] text-text-m mt-1 leading-snug">
                  All tools are built with accurate academic formulas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Save Time</h4>
                <p className="text-[11px] text-text-m mt-1 leading-snug">
                  Get results in seconds and plan smarter.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">Improve Performance</h4>
                <p className="text-[11px] text-text-m mt-1 leading-snug">
                  Analyze and improve your academic performance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-h">100% Private & Secure</h4>
                <p className="text-[11px] text-text-m mt-1 leading-snug">
                  Your data is computed client-side. We value your privacy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Category Mobile Drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 max-w-md w-full shadow-theme max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-text-h">Select Category</h3>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-text-m hover:text-text-h"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-1.5 text-xs">
              {CATEGORIES_CONFIG.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleSelectCategory(cat.name)}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between ${
                    cat.name === currentCategory ? 'bg-accent-soft text-accent font-bold' : 'hover:bg-bg-sec text-text-h'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool Finder Wizard Modal */}
      {finderModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFinderModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-theme text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFinderModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-m hover:text-text-h"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-text-h">Tool Recommendation Wizard</h3>
            <p className="text-xs text-text-m mt-1">What do you want to accomplish today?</p>

            <div className="mt-4 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFinderModalOpen(false);
                  navigate('/calculators/cgpa');
                }}
                className="w-full p-2.5 rounded-xl border border-border hover:border-accent hover:bg-accent-soft text-left font-medium text-text-h flex items-center justify-between transition-colors"
              >
                <span>Calculate Semester / Cumulative CGPA</span>
                <ChevronRight className="w-3.5 h-3.5 text-accent" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setFinderModalOpen(false);
                  navigate('/calculators/cgpa#converter');
                }}
                className="w-full p-2.5 rounded-xl border border-border hover:border-accent hover:bg-accent-soft text-left font-medium text-text-h flex items-center justify-between transition-colors"
              >
                <span>Convert CGPA to Percentage or vice-versa</span>
                <ChevronRight className="w-3.5 h-3.5 text-accent" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setFinderModalOpen(false);
                  navigate('/calculators/target-cgpa');
                }}
                className="w-full p-2.5 rounded-xl border border-border hover:border-accent hover:bg-accent-soft text-left font-medium text-text-h flex items-center justify-between transition-colors"
              >
                <span>Plan Required GPA for graduation honors</span>
                <ChevronRight className="w-3.5 h-3.5 text-accent" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Tool Modal */}
      {requestModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRequestModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-theme text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-m hover:text-text-h"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center mb-3">
              <MailPlus className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-text-h">Request an Academic Tool</h3>
            <p className="text-xs text-text-m mt-1">Have a specific regulation or formula? Let us know!</p>

            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text-h mb-1">Tool Name</label>
                <input
                  type="text"
                  required
                  value={reqToolName}
                  onChange={(e) => setReqToolName(e.target.value)}
                  placeholder="e.g. Relative Grading Normalizer"
                  className="calc-input w-full px-3 py-2 rounded-xl border border-border bg-bg-sec text-text-h placeholder:text-text-light"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-h mb-1">Description / Formula</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain how the calculation works or share your university regulation link..."
                  className="calc-input w-full px-3 py-2 rounded-xl border border-border bg-bg-sec text-text-h placeholder:text-text-light"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-m hover:text-text-h"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover shadow-accent"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}