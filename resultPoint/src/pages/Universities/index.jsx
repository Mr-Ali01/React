import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ShieldCheck,
  Scale,
  Compass,
  GraduationCap,
  Search,
  ChevronDown,
  Building2,
  MapPin,
  Map,
  BookOpen,
  SlidersHorizontal,
  ArrowRight,
  SearchX,
  ChevronLeft,
  Heart,
  X
} from 'lucide-react';
import { UNIVERSITIES_DATA } from '../../data/universitiesDirectoryData';
import { useToast } from '../../context/ToastContext';

const STATES = ['All', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal', 'Telangana'];
const TYPES = ['All', 'Public', 'Private', 'Deemed'];
const NAAC_GRADES = ['All', 'A++', 'A+', 'A'];
const NIRF_OPTIONS = [
  { value: 'All', label: 'All Rankings' },
  { value: 'top5', label: 'Top 5' },
  { value: 'top10', label: 'Top 10' },
  { value: 'top20', label: 'Top 20' }
];
const EST_OPTIONS = [
  { value: 'All', label: 'All Years' },
  { value: 'before1950', label: 'Before 1950' },
  { value: '1950-1980', label: '1950 - 1980' },
  { value: 'after1980', label: 'After 1980' }
];

export default function UniversitiesDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedNaac, setSelectedNaac] = useState('All');
  const [selectedNirf, setSelectedNirf] = useState('All');
  const [selectedEstablished, setSelectedEstablished] = useState('All');
  const [sortOrder, setSortOrder] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('resultpoint_favs') || '[]'));
    } catch {
      return new Set();
    }
  });

  const navigate = useNavigate();
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 9;

  // Toggle Favorite
  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from your favorites');
      } else {
        next.add(id);
        showToast('Saved to your favorites');
      }
      localStorage.setItem('resultpoint_favs', JSON.stringify([...next]));
      return next;
    });
  };

  // Filter & Sort Logic
  const filteredUniversities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const list = UNIVERSITIES_DATA.filter((uni) => {
      if (query) {
        const matchesQuery =
          uni.name.toLowerCase().includes(query) ||
          uni.city.toLowerCase().includes(query) ||
          uni.state.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (selectedState !== 'All' && uni.state !== selectedState) return false;
      if (selectedType !== 'All' && uni.type !== selectedType) return false;
      if (selectedNaac !== 'All' && uni.accreditation !== selectedNaac) return false;

      if (selectedNirf === 'top5' && uni.nirfRank > 5) return false;
      if (selectedNirf === 'top10' && uni.nirfRank > 10) return false;
      if (selectedNirf === 'top20' && uni.nirfRank > 20) return false;

      if (selectedEstablished === 'before1950' && uni.established >= 1950) return false;
      if (selectedEstablished === '1950-1980' && (uni.established < 1950 || uni.established > 1980)) return false;
      if (selectedEstablished === 'after1980' && uni.established <= 1980) return false;

      return true;
    });

    if (sortOrder === 'nirf') {
      return list.sort((a, b) => a.nirfRank - b.nirfRank);
    } else if (sortOrder === 'established') {
      return list.sort((a, b) => a.established - b.established);
    } else if (sortOrder === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => a.nirfRank - b.nirfRank);
  }, [searchTerm, selectedState, selectedType, selectedNaac, selectedNirf, selectedEstablished, sortOrder]);

  // Pagination Slice
  const totalCount = filteredUniversities.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredUniversities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedState('All');
    setSelectedType('All');
    setSelectedNaac('All');
    setSelectedNirf('All');
    setSelectedEstablished('All');
    setSortOrder('popular');
    setCurrentPage(1);
    setMobileDrawerOpen(false);
  };

//   const handleCardClick = (uniId) => {
//     showToast(`Loading curriculum for ${uniId.replace('-', ' ').toUpperCase()}`);
//     navigate(`/calculators/cgpa#${uniId}`);
//   };
const handleCardClick = (uniId) => {
  // Navigate to the details route
  navigate(`/universities/details`);
  // Or dynamic: navigate(`/universities/${uniId}`);
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
            <li className="font-semibold text-text-h" aria-current="page">Universities</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-1">
          <div className="lg:col-span-7 space-y-4 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-text-h tracking-tight leading-[1.18]">
              Universities in <span className="text-accent">India</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-text-m leading-relaxed max-w-xl">
              Find and explore top universities across India. Get details about courses, regulations, grading systems and more.
            </p>

            {/* 3 Compact Benefit Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">Verified Information</div>
                  <div className="text-[10.5px] text-text-m">Accurate & up to date</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">Compare Easily</div>
                  <div className="text-[10.5px] text-text-m">Make informed choices</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border shadow-subtle">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">Plan Your Future</div>
                  <div className="text-[10.5px] text-text-m">Find the right university</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Campus Showcase Graphic */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-3 lg:pt-0">
            <div className="relative w-full max-w-[430px] rounded-3xl overflow-hidden shadow-theme border border-border bg-card p-2.5">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-bg-sec">
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80"
                  alt="Indian University Campus Hall"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-2 left-6 z-20 bg-card border border-border shadow-subtle px-3.5 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-accent text-white flex items-center justify-center text-[10px]">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-xs font-extrabold text-text-h">100+</span>
                  <span className="text-[9px] text-text-m block">Universities</span>
                </div>
              </div>

              <div className="mt-2 text-right px-2">
                <span className="text-text-h font-bold text-xs tracking-wide italic">
                  “Better Education, Brighter Futures”
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Filter Bar */}
        <section className="rounded-2xl bg-card border border-border p-3.5 sm:p-4 shadow-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
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
                placeholder="Search universities by name, city or state..."
                className="calc-input w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h placeholder:text-text-light"
              />
            </div>

            {/* State Select */}
            <div className="sm:col-span-3 relative">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setCurrentPage(1);
                }}
                className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h cursor-pointer appearance-none pr-8 font-medium"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-text-light" />
            </div>

            {/* Type Select */}
            <div className="sm:col-span-2 relative">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h cursor-pointer appearance-none pr-8 font-medium"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-text-light" />
            </div>

            {/* Sort Order */}
            <div className="sm:col-span-2 relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-xs text-text-h cursor-pointer appearance-none pr-8 font-medium"
              >
                <option value="popular">Popular</option>
                <option value="nirf">NIRF Rank</option>
                <option value="established">Established</option>
                <option value="name">Name (A–Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-text-light" />
            </div>
          </div>
        </section>

        {/* 4 Statistics Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-m">Total Universities</div>
              <div className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">100+</div>
              <div className="text-[10.5px] text-text-light">Across India</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-m">States Covered</div>
              <div className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">28</div>
              <div className="text-[10.5px] text-text-light">States & UTs</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-m">Top Rated</div>
              <div className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">50+</div>
              <div className="text-[10.5px] text-text-light">NAAC A+ / A++</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-m">Curricula & Rules</div>
              <div className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">1000+</div>
              <div className="text-[10.5px] text-text-light">UG & PG Regulations</div>
            </div>
          </div>
        </section>

        {/* Directory Workspace (Grid + Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Grid Column */}
          <section className="lg:col-span-8 xl:col-span-9 space-y-4" aria-label="Universities List">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-text-h tracking-tight">
                  Popular Universities
                </h2>
                <p className="text-xs text-text-m mt-0.5">
                  Explore top universities based on NIRF rankings and verified grading matrices.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-text-h hover:border-accent"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                  <span>Filters</span>
                </button>

                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Filters Chips Bar */}
            {(searchTerm || selectedState !== 'All' || selectedType !== 'All' || selectedNaac !== 'All' || selectedNirf !== 'All' || selectedEstablished !== 'All') && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/25">
                    <span>"{searchTerm}"</span>
                    <button type="button" onClick={() => setSearchTerm('')}>×</button>
                  </span>
                )}
                {selectedState !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/25">
                    <span>State: {selectedState}</span>
                    <button type="button" onClick={() => setSelectedState('All')}>×</button>
                  </span>
                )}
                {selectedType !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/25">
                    <span>Type: {selectedType}</span>
                    <button type="button" onClick={() => setSelectedType('All')}>×</button>
                  </span>
                )}
                {selectedNaac !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/25">
                    <span>NAAC: {selectedNaac}</span>
                    <button type="button" onClick={() => setSelectedNaac('All')}>×</button>
                  </span>
                )}
                {selectedNirf !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/25">
                    <span>Rank: {selectedNirf.replace('top', 'Top ')}</span>
                    <button type="button" onClick={() => setSelectedNirf('All')}>×</button>
                  </span>
                )}
                {selectedEstablished !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/25">
                    <span>Est: {selectedEstablished}</span>
                    <button type="button" onClick={() => setSelectedEstablished('All')}>×</button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] font-semibold text-accent hover:underline ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Empty State */}
            {totalCount === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-12 text-center space-y-3 shadow-subtle">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-accent mx-auto flex items-center justify-center">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-text-h">No universities found</h3>
                <p className="text-xs text-text-m max-w-sm mx-auto">
                  Try adjusting your search query, state criteria, or clear the applied filters.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-accent"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pageItems.map((uni) => {
                  const isFav = favorites.has(uni.id);

                  return (
                    <div
                      key={uni.id}
                      onClick={() => handleCardClick(uni.id)}
                      className="group rounded-2xl bg-card border border-border shadow-subtle hover:border-accent hover:shadow-theme transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                    >
                      <div>
                        {/* Image Banner */}
                        <div className="relative aspect-[16/8] sm:aspect-[16/7.5] w-full overflow-hidden bg-bg-sec">
                          <img
                            src={uni.image}
                            alt={uni.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-[#0B0D10]/90 text-white backdrop-blur-sm border border-white/20">
                              NAAC {uni.accreditation}
                            </span>
                          </div>

                          <button
                            type="button"
                            aria-label={`Favorite ${uni.name}`}
                            onClick={(e) => toggleFavorite(uni.id, e)}
                            className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center transition-transform active:scale-90 hover:scale-105 ${
                              isFav ? 'text-rose-500' : 'text-text-m'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                        </div>

                        {/* Card Content */}
                        <div className="p-3.5 space-y-2 text-left">
                          <h3 className="text-sm font-bold text-text-h group-hover:text-accent transition-colors leading-snug line-clamp-1" title={uni.name}>
                            {uni.name}
                          </h3>

                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <div className="flex items-center gap-1 text-text-m truncate">
                              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">{uni.city}, {uni.state}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-brandBlue shrink-0 border border-brandBlue/20">
                              {uni.type}
                            </span>
                          </div>

                          <p className="text-[11px] text-text-m leading-relaxed line-clamp-2 min-h-[32px]">
                            {uni.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Stats */}
                      <div className="px-3.5 py-2.5 border-t border-border/80 bg-bg-sec/40 grid grid-cols-3 text-center divide-x divide-border text-xs">
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-text-light block">Courses</span>
                          <span className="font-extrabold text-text-h text-[11.5px]">{uni.courses}</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-text-light block">Established</span>
                          <span className="font-extrabold text-text-h text-[11.5px]">{uni.established}</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-text-light block">NIRF Rank</span>
                          <span className="font-extrabold text-text-h text-[11.5px]">#{uni.nirfRank}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-text-m">
                  Showing <span className="font-bold text-text-h">{startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold text-text-h">{totalCount}</span> universities
                </div>

                <nav aria-label="Universities pagination" className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
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
                        onClick={() => {
                          setCurrentPage(p);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
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
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </nav>
              </div>
            )}
          </section>

          {/* Right Sidebar: Filters & States */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4" aria-label="Sidebar Filters">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle text-left">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-h">
                  Filter Universities
                </h3>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-text-m font-medium mb-1">State / UT</label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="calc-input w-full px-2.5 py-2 rounded-xl border border-border bg-bg-sec text-text-h cursor-pointer"
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-m font-medium mb-1">University Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="calc-input w-full px-2.5 py-2 rounded-xl border border-border bg-bg-sec text-text-h cursor-pointer"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-m font-medium mb-1">NAAC Accreditation</label>
                  <select
                    value={selectedNaac}
                    onChange={(e) => {
                      setSelectedNaac(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="calc-input w-full px-2.5 py-2 rounded-xl border border-border bg-bg-sec text-text-h cursor-pointer"
                  >
                    {NAAC_GRADES.map((g) => (
                      <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-m font-medium mb-1">NIRF Ranking</label>
                  <select
                    value={selectedNirf}
                    onChange={(e) => {
                      setSelectedNirf(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="calc-input w-full px-2.5 py-2 rounded-xl border border-border bg-bg-sec text-text-h cursor-pointer"
                  >
                    {NIRF_OPTIONS.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-m font-medium mb-1">Established Year</label>
                  <select
                    value={selectedEstablished}
                    onChange={(e) => {
                      setSelectedEstablished(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="calc-input w-full px-2.5 py-2 rounded-xl border border-border bg-bg-sec text-text-h cursor-pointer"
                  >
                    {EST_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="w-full py-2 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-m hover:text-text-h text-xs font-semibold transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Popular States Shortcuts */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle text-left">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                <h3 className="text-xs font-bold text-text-h">Popular States</h3>
                <button type="button" onClick={() => setSelectedState('All')} className="text-[11px] font-semibold text-accent hover:underline">
                  View All
                </button>
              </div>

              <div className="space-y-1 text-xs">
                {['Maharashtra', 'Delhi', 'Uttar Pradesh', 'Karnataka', 'Tamil Nadu'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSelectedState(st);
                      setCurrentPage(1);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                      selectedState === st
                        ? 'bg-accent-soft text-accent font-bold'
                        : 'text-text-m hover:text-text-h hover:bg-bg-sec'
                    }`}
                  >
                    <span>{st}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                ))}
              </div>
            </div>

            {/* Why Choose ResultPoint Card */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle space-y-3.5 text-left">
              <h3 className="text-xs font-bold text-text-h">Why Choose ResultPoint?</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-text-h block">Accurate Information</span>
                    <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                      All university data is verified against UGC and university circulars.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-text-h block">Easy Comparison</span>
                    <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                      Compare courses, credit requirements, and grading systems easily.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/calculators"
                className="w-full py-2 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-accent hover:border-accent text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Explore Calculators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Filters Drawer Modal */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 max-w-lg w-full shadow-theme max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-text-h">Filter Universities</h3>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-text-m hover:text-text-h"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-left">
              <div>
                <label className="block font-semibold text-text-h mb-1">State / UT</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-h mb-1">University Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-h mb-1">NAAC Accreditation</label>
                <select
                  value={selectedNaac}
                  onChange={(e) => setSelectedNaac(e.target.value)}
                  className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h"
                >
                  {NAAC_GRADES.map((g) => (
                    <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text-h mb-1">NIRF Ranking</label>
                <select
                  value={selectedNirf}
                  onChange={(e) => setSelectedNirf(e.target.value)}
                  className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h"
                >
                  {NIRF_OPTIONS.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="w-1/2 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-h hover:bg-bg-sec"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-accent hover:bg-accent-hover"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}