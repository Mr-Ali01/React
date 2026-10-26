import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Search,
  X,
  FileText,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  BarChart2,
  Calendar,
  Clock,
  Download,
  ChevronDown,
  ArrowRight,
  Lightbulb,
  SearchX,
  FileCheck,
  CheckCircle,
  ExternalLink,
  Layers,
  LayoutGrid
} from 'lucide-react';
import {
  RESOURCE_CATEGORIES,
  FEATURED_RESOURCE_CARDS,
  RESOURCES_DATA,
  filterResources
} from '../../data/resourcesData';
import {
  resourceManagementService,
  RESOURCE_UPDATED_EVENT
} from '../../services/resourceManagementService';
import { useToast } from '../../context/ToastContext';

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // Dynamic published resources from canonical service
  const [publishedResources, setPublishedResources] = useState(() => {
    try {
      return resourceManagementService.getPublicResources();
    } catch {
      return RESOURCES_DATA;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setPublishedResources(resourceManagementService.getPublicResources());
      } catch (err) {
        console.warn('Failed to refresh resources:', err);
      }
    };

    window.addEventListener(RESOURCE_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(RESOURCE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Filtered & sorted resources
  const visibleResources = useMemo(() => {
    return filterResources(publishedResources, {
      category: selectedCategory,
      searchQuery: submittedSearch,
      sortBy
    });
  }, [publishedResources, selectedCategory, submittedSearch, sortBy]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSubmittedSearch(searchTerm.trim());
    if (searchTerm.trim()) {
      showToast(`Searching resources for: "${searchTerm.trim()}"`);
    }
  };

  // Clear Search
  const handleClearSearch = () => {
    setSearchTerm('');
    setSubmittedSearch('');
  };

  // Category switch helper
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Featured card click helper
  const handleFeaturedCardClick = (categoryKey) => {
    setSelectedCategory(categoryKey);
    const el = document.getElementById('sec-latest-resources');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showToast(`Filtered by ${categoryKey.replace('-', ' ')}`);
  };

  // View All click helper
  const handleViewAll = () => {
    setSelectedCategory('all');
    handleClearSearch();
    const el = document.getElementById('sec-latest-resources');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Download Action Handler
  const handleDownload = (e, resource) => {
    e.stopPropagation();
    if (resource.id) {
      resourceManagementService.incrementDownloadCount(resource.id);
    }
    if (resource.fileUrl) {
      showToast(`Opening download portal for: ${resource.title}`);
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('Document file is being prepared by our academic editorial team.');
    }
  };

  // Read Action Handler
  const handleRead = (resource) => {
    if (resource.id) {
      resourceManagementService.incrementViewCount(resource.id);
    }
    if (resource.detailRoute) {
      navigate(resource.detailRoute);
    } else {
      navigate(`/resources/details?id=${resource.id}`);
    }
  };

  // Category Icon resolver
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'FileText':
        return FileText;
      case 'BookOpen':
        return BookOpen;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'GraduationCap':
        return GraduationCap;
      case 'BarChart2':
        return BarChart2;
      case 'Grid':
      default:
        return LayoutGrid;
    }
  };

  // Resource Icon Theme resolver
  const renderResourceIcon = (iconTheme, resourceType) => {
    switch (iconTheme) {
      case 'red':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'blue':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-brandBlue border border-blue-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'purple':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-brandPurple border border-purple-500/30 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        );
      case 'orange':
        return (
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-accent border border-orange-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        );
      case 'green':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-brandGreen border border-emerald-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-h flex flex-col selection:bg-accent selection:text-white">
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h" aria-current="page">Resources</li>
          </ol>
        </div>
      </nav>

      {/* Main Page Container */}
      <main className="flex-grow max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-9">
        {/* 2. Compact Hero Section */}
        <section
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          aria-label="Academic Resources Hero"
        >
          {/* Left Text */}
          <div className="space-y-2 text-left max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight">
              Academic{' '}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Resources
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-text-m leading-relaxed">
              Study materials, guides, previous papers and everything you need for academic success — all in one place.
            </p>
          </div>

          {/* Right Compact Illustration Card (Matches Screenshot Reference) */}
          <div
            className="w-full md:w-[350px] lg:w-[370px] h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-[#121929] via-[#0D1424] to-[#0A0E1A] border border-border/80 shadow-subtle relative overflow-hidden flex items-center justify-between px-5 select-none shrink-0"
            aria-hidden="true"
          >
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Left Books with Graduation Cap */}
            <div className="relative flex flex-col items-center z-10">
              {/* Graduation Cap on top */}
              <div className="w-10 h-3 bg-slate-900 border border-slate-700 rounded-sm relative -mb-1 shadow-sm">
                <div className="w-5 h-5 bg-slate-800 rotate-45 border border-slate-600 -top-2 left-2.5 absolute" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent absolute -top-1 left-4" />
                <div className="w-3 h-0.5 bg-accent absolute top-0.5 left-5 rotate-45" />
              </div>

              {/* Stack of 3 Books */}
              <div className="w-14 h-3 bg-gradient-to-r from-orange-600 to-amber-600 rounded-t-sm shadow-sm border-t border-orange-400/30" />
              <div className="w-16 h-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 shadow-sm border-t border-blue-400/30" />
              <div className="w-18 h-4 bg-gradient-to-r from-slate-700 to-slate-800 rounded-b-sm shadow-md border-t border-slate-500/30" />
            </div>

            {/* Middle Open Laptop with Display */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-16 bg-[#0B1120] border-2 border-slate-600 rounded-t-md p-1.5 flex flex-col items-center justify-center text-center shadow-lg">
                <GraduationCap className="w-3 h-3 text-accent mb-0.5" />
                <span className="text-[7.5px] font-black tracking-wide text-accent block leading-tight">
                  Learn
                </span>
                <span className="text-[7px] font-bold text-white block leading-tight">
                  Calculate
                </span>
                <span className="text-[7px] font-semibold text-slate-300 block leading-tight">
                  Improve
                </span>
              </div>
              {/* Laptop Keyboard Base */}
              <div className="w-28 h-1.5 bg-slate-600 rounded-b-md shadow-sm" />
            </div>

            {/* Right Glowing Lightbulb */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse">
                <Lightbulb className="w-5 h-5 fill-amber-400/30 text-amber-300" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Search Bar */}
        <section aria-label="Search Academic Resources">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full rounded-2xl bg-card border border-border p-1.5 shadow-subtle hover:border-accent/50 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-all"
          >
            <Search className="w-5 h-5 text-text-light ml-3 mr-2 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSubmittedSearch(e.target.value);
              }}
              placeholder="Search papers, syllabi, guides, regulations..."
              className="w-full bg-transparent text-xs sm:text-sm text-text-h placeholder:text-text-m/60 focus:outline-none py-2 px-1"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 rounded-full text-text-light hover:text-text-h hover:bg-bg-sec mr-2 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-accent hover:bg-accent-hover shadow-accent transition-all shrink-0 active:scale-95"
            >
              Search
            </button>
          </form>
        </section>

        {/* 4. Resource Category Navigation (6 Horizontal Tabs Matching Screenshot) */}
        <section aria-label="Resource Categories">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto pb-1">
            {RESOURCE_CATEGORIES.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white border-transparent shadow-accent'
                      : 'bg-card border-border hover:border-accent/50 hover:bg-bg-sec/50 text-text-h'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-orange-500/15 text-accent border border-orange-500/25'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-text-h'}`}>
                      {cat.name}
                    </h3>
                    <p
                      className={`text-[10.5px] mt-0.5 line-clamp-1 ${
                        isSelected ? 'text-white/85' : 'text-text-m'
                      }`}
                    >
                      {cat.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Featured Resources (4 Compact Cards Grid) */}
        <section className="space-y-4 text-left" aria-label="Featured Resources Section">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-h">Featured Resources</h2>
              <p className="text-[11px] text-text-m">
                Quick access to the most helpful resources for your academic journey.
              </p>
            </div>
            <button
              type="button"
              onClick={handleViewAll}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {FEATURED_RESOURCE_CARDS.map((card) => {
              let Icon = FileText;
              if (card.categoryKey === 'study-materials') Icon = BookOpen;
              if (card.categoryKey === 'syllabus-regulations') Icon = ShieldCheck;
              if (card.categoryKey === 'result-guides') Icon = GraduationCap;

              return (
                <div
                  key={card.id}
                  onClick={() => handleFeaturedCardClick(card.categoryKey)}
                  className="group p-5 rounded-2xl bg-card border border-border hover:border-accent/60 hover:shadow-subtle transition-all cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="space-y-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${card.bgIconColor}`}
                    >
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-text-h group-hover:text-accent transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-text-m mt-1 leading-snug">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>{card.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Latest Resources (Horizontal Cards Matching Reference Screenshot) */}
        <section
          id="sec-latest-resources"
          className="space-y-4 text-left"
          aria-label="Latest Academic Resources"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/70">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-h">Latest Resources</h2>
              <p className="text-[11px] text-text-m">
                Recently added and updated study materials, guides and documents.
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              <span className="text-text-light font-medium">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-bg-sec border border-border rounded-xl px-3 py-1.5 text-text-h text-xs font-semibold focus:outline-none focus:border-accent pr-7 cursor-pointer appearance-none"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title (A - Z)</option>
                </select>
                <ChevronDown className="w-3 h-3 text-text-light absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Resources List Container */}
          {visibleResources.length > 0 ? (
            <div className="space-y-2.5">
              {visibleResources.map((item) => {
                const isPDF = item.resourceType === 'pdf';
                const isArticle = item.resourceType === 'article';

                return (
                  <div
                    key={item.id}
                    onClick={() => (isArticle ? handleRead(item) : null)}
                    className={`group p-3.5 sm:p-4 rounded-2xl bg-card border border-border hover:border-accent/60 hover:bg-bg-sec/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                      isArticle ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Left Icon & Information */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {renderResourceIcon(item.iconTheme, item.resourceType)}

                      <div className="space-y-1 min-w-0">
                        {/* Title and Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-text-h group-hover:text-accent transition-colors truncate">
                            {item.title}
                          </h3>

                          {/* Category Badge */}
                          {item.categoryLabel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                              {item.categoryLabel}
                            </span>
                          )}

                          {/* University Badge */}
                          {item.universityName && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/30 text-slate-300 border border-slate-600/30 shrink-0">
                              {item.universityName}
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 text-[11px] text-text-m">
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-text-light" />
                            <span>{item.publishedAt}</span>
                          </span>

                          <span className="flex items-center gap-1 shrink-0">
                            {isArticle ? (
                              <Clock className="w-3.5 h-3.5 text-text-light" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-text-light" />
                            )}
                            <span>{item.fileType || (isArticle ? 'Guide' : 'PDF Document')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button & Chevron */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      {isPDF ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, item)}
                          className="px-3.5 py-1.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 text-xs font-bold text-text-h hover:text-accent flex items-center gap-1.5 transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-accent" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRead(item)}
                          className="px-3.5 py-1.5 rounded-xl border border-border bg-bg-sec hover:border-accent hover:bg-accent-soft/20 text-xs font-bold text-text-h hover:text-accent flex items-center gap-1.5 transition-all"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-accent" />
                          <span>Read</span>
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center mx-auto">
                <SearchX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text-h">No resources found</h3>
                <p className="text-xs text-text-m max-w-md mx-auto">
                  {submittedSearch
                    ? `No materials matched "${submittedSearch}" under the selected category.`
                    : 'No documents configured for this category yet.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  handleClearSearch();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* 7. Bottom University Guide CTA Banner (Matches Screenshot Reference) */}
        <section
          className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-5 text-left"
          aria-label="Need a specific resource callout"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Lightbulb className="w-6 h-6 fill-amber-400/30" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                Need a specific resource?
              </h3>
              <p className="text-xs text-text-m leading-snug">
                Can't find what you're looking for? Check our university guides or explore resources for your specific course.
              </p>
            </div>
          </div>

          <Link
            to="/universities"
            className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF6B00] to-[#EA580C] hover:opacity-95 shadow-accent transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Explore University Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>
    </div>
  );
}