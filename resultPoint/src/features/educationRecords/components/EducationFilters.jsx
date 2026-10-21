import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Filter } from 'lucide-react';

export default function EducationFilters({
  activeTab = 'ALL',
  onTabChange,
  stats = { allCount: 4, schoolCount: 2, ugCount: 1, pgCount: 1 },
  searchQuery = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange
}) {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const TABS = [
    { key: 'ALL', label: `All Education (${stats.allCount})` },
    { key: 'SCHOOL', label: `School (${stats.schoolCount})` },
    { key: 'UNDERGRADUATE', label: `Undergraduate (${stats.ugCount})` },
    { key: 'POSTGRADUATE', label: `Postgraduate (${stats.pgCount})` }
  ];

  const STATUS_OPTIONS = [
    { key: 'ALL', label: 'All Status' },
    { key: 'COMPLETED', label: 'Completed Only' },
    { key: 'IN_PROGRESS', label: 'In Progress Only' }
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25'
                  : 'bg-card text-text-light hover:text-text-h border border-border hover:border-slate-300 dark:hover:border-[#2A374A]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input & Status Filter Dropdown */}
      <div className="flex items-center gap-2.5 w-full lg:w-auto">
        {/* Search Bar */}
        <div className="relative flex-1 lg:w-72">
          <Search className="w-4 h-4 text-text-light absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search education records..."
            className="calc-input w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-medium placeholder:text-text-light/50"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
              statusFilter !== 'ALL'
                ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30'
                : 'bg-card text-text-m hover:text-text-h border-border hover:border-slate-300 dark:hover:border-[#2A374A]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-light" />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl py-1.5 z-30 animate-scaleUp">
              <span className="px-3 py-1 text-[10px] font-bold text-text-light uppercase tracking-wider block">
                Completion Status
              </span>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = statusFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onStatusFilterChange(opt.key);
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-left flex items-center justify-between text-text-m hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B00]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
