import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Search,
  MapPin,
  Building2,
  BookOpen,
  FileCheck,
  Calculator,
  Award,
  ArrowRight,
  SearchX,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import { UNIVERSITIES_DATA } from '../../data/universitiesDirectoryData';
import { academicCatalogService } from '../../services/academicCatalogService';
import UniversityEmblem from './UniversityEmblem';

export default function UniversitiesDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedType, setSelectedType] = useState('All Types');
  const [catalogVersion, setCatalogVersion] = useState(0);

  const navigate = useNavigate();

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

  // Centralized dataset merged from academic catalog and static directory metadata
  const allUniversities = useMemo(() => {
    const catalog = academicCatalogService.getCatalog();
    const catalogUnivs = catalog?.universities || [];

    const dirMap = new Map();
    UNIVERSITIES_DATA.forEach((u) => {
      dirMap.set(u.id.toLowerCase(), u);
      if (u.abbreviation) dirMap.set(u.abbreviation.toLowerCase(), u);
      if (Array.isArray(u.aliases)) {
        u.aliases.forEach((a) => dirMap.set(a.toLowerCase(), u));
      }
    });

    const merged = [];
    const seenIds = new Set();

    // 1. Process all catalog universities (single source of truth for administrative mutations)
    catalogUnivs.forEach((catUniv) => {
      const match =
        dirMap.get((catUniv.id || '').toLowerCase()) ||
        dirMap.get((catUniv.shortName || '').toLowerCase());

      const status = catUniv.status || 'active';
      const isArchived = status === 'archived';
      const isInactive = status === 'inactive';

      const entry = {
        id: catUniv.id,
        slug: catUniv.id,
        aliases: [catUniv.shortName.toLowerCase()],
        name: catUniv.name || match?.name || catUniv.id,
        abbreviation: catUniv.shortName || match?.abbreviation || 'UNI',
        state: catUniv.state || match?.state || 'Telangana',
        city: catUniv.city || match?.city || 'Hyderabad',
        type: catUniv.type || match?.type || 'State University',
        logo: catUniv.logo || match?.logo || null,
        description:
          catUniv.description ||
          match?.description ||
          `Explore supported courses, academic regulations, grading rules, and result calculators for ${catUniv.name}.`,
        academicFocus:
          match?.academicFocus ||
          `Official ${catUniv.shortName} degree credit evaluation, regulation rules, and CGPA calculators.`,
        detailsRoute: match?.detailsRoute || `/universities/${catUniv.id}`,
        status: isArchived ? 'archived' : isInactive ? 'inactive' : 'available',
        supportedRegulations:
          match?.supportedRegulations ||
          Array.from(new Set((catUniv.courses || []).flatMap((c) => (c.regulations || []).map((r) => r.code)))),
        supportedCourses:
          match?.supportedCourses || (catUniv.courses || []).map((c) => c.shortName || c.name),
        calculationRules: match?.calculationRules || {
          gradingSystem: '10-Point Scale',
          percentageFormula: 'Standard Academic Conversion',
          sgpaRule: 'Weighted Credit Sum'
        }
      };

      merged.push(entry);
      seenIds.add(entry.id.toLowerCase());
      if (entry.abbreviation) seenIds.add(entry.abbreviation.toLowerCase());
    });

    // 2. Include any static directory items not yet represented in catalog
    UNIVERSITIES_DATA.forEach((staticUni) => {
      if (!seenIds.has(staticUni.id.toLowerCase()) && (!staticUni.abbreviation || !seenIds.has(staticUni.abbreviation.toLowerCase()))) {
        merged.push(staticUni);
      }
    });

    return merged;
  }, [catalogVersion]);

  // Dynamic filter lists derived from configured data
  const availableStates = useMemo(() => {
    const states = Array.from(new Set(allUniversities.map((u) => u.state).filter(Boolean)));
    return ['All States', ...states];
  }, [allUniversities]);

  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(allUniversities.map((u) => u.type).filter(Boolean)));
    return ['All Types', ...types];
  }, [allUniversities]);

  // Real-time search and filter logic
  const filteredUniversities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allUniversities.filter((uni) => {
      // 1. Text Search matching full name, abbreviation, city, or aliases
      if (query) {
        const matchesName = uni.name.toLowerCase().includes(query);
        const matchesAbbr = uni.abbreviation.toLowerCase().includes(query);
        const matchesCity = uni.city ? uni.city.toLowerCase().includes(query) : false;
        const matchesState = uni.state ? uni.state.toLowerCase().includes(query) : false;
        const matchesAlias = Array.isArray(uni.aliases)
          ? uni.aliases.some((alias) => alias.toLowerCase().includes(query))
          : false;

        if (!matchesName && !matchesAbbr && !matchesCity && !matchesState && !matchesAlias) {
          return false;
        }
      }

      // 2. State Filter
      if (selectedState !== 'All States' && uni.state !== selectedState) {
        return false;
      }

      // 3. Type Filter
      if (selectedType !== 'All Types' && uni.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [allUniversities, searchTerm, selectedState, selectedType]);

  const hasActiveFilters = searchTerm.trim() !== '' || selectedState !== 'All States' || selectedType !== 'All Types';

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedState('All States');
    setSelectedType('All Types');
  };

  const handleCardClick = (route) => {
    if (route) {
      navigate(route);
    }
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
            <li className="font-bold text-text-h" aria-current="page">Universities</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* ========================================================= */}
        {/* SECTION A: PAGE HEADER & ACADEMIC FEATURE HIGHLIGHTS     */}
        {/* ========================================================= */}
        <section aria-label="Universities Directory Header" className="space-y-5 pt-1">
          <div className="space-y-2.5 text-left max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-accent bg-accent-soft border border-accent/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Academic Curricula & Calculation Rules</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold text-text-h tracking-tight leading-tight">
              Universities in <span className="text-accent">India</span>
            </h1>
            <p className="text-sm sm:text-base text-text-m leading-relaxed">
              Explore university grading systems, regulations, supported courses, and calculation rules.
            </p>
          </div>

          {/* 4 Compact Academic Feature Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-text-h truncate">University Grading Systems</div>
                <div className="text-[11px] text-text-m truncate">10-point, CBCS & scales</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-text-h truncate">Supported Courses</div>
                <div className="text-[11px] text-text-m truncate">B.Tech, BCA, MCA programs</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-text-h truncate">Academic Regulations</div>
                <div className="text-[11px] text-text-m truncate">R22, R18, R16 & CBCS rules</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-text-h truncate">Result Calculators</div>
                <div className="text-[11px] text-text-m truncate">SGPA, CGPA & backlog tools</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION B: SEARCH AND COMPACT FILTERS                    */}
        {/* ========================================================= */}
        <section aria-label="Search and Filter Universities" className="rounded-2xl bg-card border border-border p-3 sm:p-4 shadow-subtle">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by university name or abbreviation (e.g. OU, JNTUH, Osmania)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm text-text-h placeholder:text-text-light focus:outline-none focus:border-accent transition-colors"
                aria-label="Search universities by name or abbreviation"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-light hover:text-text-h"
                  aria-label="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Compact Filters & Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* State Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm font-medium text-text-h focus:outline-none focus:border-accent cursor-pointer transition-colors"
                  aria-label="Filter universities by state"
                >
                  {availableStates.map((state) => (
                    <option key={state} value={state} className="bg-card text-text-h">
                      {state}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-text-light">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Type Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-border bg-bg-sec text-xs sm:text-sm font-medium text-text-h focus:outline-none focus:border-accent cursor-pointer transition-colors"
                  aria-label="Filter universities by type"
                >
                  {availableTypes.map((type) => (
                    <option key={type} value={type} className="bg-card text-text-h">
                      {type}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-text-light">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Clear Filters Action */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-xs font-semibold text-accent hover:bg-accent/10 hover:border-accent/40 active:scale-95 transition-all"
                  aria-label="Clear all applied filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Counter Bar */}
          <div className="mt-3 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-text-m">
            <span>
              Showing <strong className="text-text-h font-bold">{filteredUniversities.length}</strong> {filteredUniversities.length === 1 ? 'university' : 'universities'}
              {hasActiveFilters && ` (filtered from ${allUniversities.length})`}
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] text-accent">Filters applied</span>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION C & D: UNIVERSITY CARDS & INTERACTION            */}
        {/* ========================================================= */}
        {filteredUniversities.length > 0 ? (
          <section aria-label="Configured Universities" className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {filteredUniversities.map((uni) => {
              const locationText = [uni.city, uni.state].filter(Boolean).join(', ');

              return (
                <article
                  key={uni.id}
                  onClick={() => handleCardClick(uni.detailsRoute)}
                  className="group rounded-2xl bg-card border border-border hover:border-accent/50 p-5 sm:p-6 shadow-subtle hover:shadow-theme transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Header Row: Emblem + Names + Abbr Badge */}
                    <div className="flex items-start gap-4">
                      <UniversityEmblem university={uni} className="w-16 h-16 sm:w-20 sm:h-20" />

                      <div className="flex-1 min-w-0 space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
                            {uni.abbreviation}
                          </span>
                          {uni.type && (
                            <span className="text-[11px] font-medium text-text-m">
                              {uni.type}
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg sm:text-xl font-bold text-text-h group-hover:text-accent transition-colors leading-snug">
                          {uni.name}
                        </h2>

                        {locationText && (
                          <div className="flex items-center gap-1.5 text-xs text-text-m">
                            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>{locationText}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic Description Focused on Calculation & Grading */}
                    <p className="text-xs sm:text-sm text-text-m leading-relaxed text-left">
                      {uni.academicFocus || uni.description}
                    </p>

                    {/* Configured Courses & Regulations Tags */}
                    <div className="space-y-2 pt-1 border-t border-border/70 text-left">
                      {Array.isArray(uni.supportedRegulations) && uni.supportedRegulations.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-text-m">Regulations:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {uni.supportedRegulations.map((reg) => (
                              <span
                                key={reg}
                                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-bg-sec border border-border text-text-h"
                              >
                                {reg}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(uni.supportedCourses) && uni.supportedCourses.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-text-m">Supported Courses:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {uni.supportedCourses.map((course) => (
                              <span
                                key={course}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-bg-sec border border-border text-text-m"
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: CTA Action */}
                  <div className="mt-5 pt-4 border-t border-border/70 flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-m group-hover:text-text-h transition-colors">
                      Grading & Calculators
                    </span>

                    <Link
                      to={uni.detailsRoute}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-accent hover:bg-accent-hover shadow-accent active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={`View details for ${uni.name}`}
                    >
                      <span>View University Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          /* Empty State when no university matches filters */
          <div className="rounded-2xl bg-card border border-border p-8 sm:p-12 text-center space-y-4 shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-bg-sec border border-border flex items-center justify-center mx-auto text-text-light">
              <SearchX className="w-7 h-7 text-accent" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-text-h">No universities found</h3>
              <p className="text-xs sm:text-sm text-text-m leading-relaxed">
                We couldn't find any universities matching &ldquo;{searchTerm || selectedState || selectedType}&rdquo;. Try adjusting your search term or reset all filters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Configured Universities</span>
            </button>
          </div>
        )}
      </main>
    </>
  );
}