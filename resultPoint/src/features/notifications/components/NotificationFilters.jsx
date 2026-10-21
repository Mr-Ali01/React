import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { NOTIFICATION_CATEGORIES } from '../../../services/notificationService.js';

export default function NotificationFilters({
  activeFilter = 'ALL',
  onSelectFilter,
  searchQuery = '',
  onSearchChange,
  sortBy = 'newest',
  onSortChange
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sort menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const FILTER_TABS = [
    { key: 'ALL', label: 'All' },
    { key: 'UNREAD', label: 'Unread' },
    { key: NOTIFICATION_CATEGORIES.RESULT, label: 'Results' },
    { key: NOTIFICATION_CATEGORIES.GOAL, label: 'Goals' },
    { key: NOTIFICATION_CATEGORIES.BACKLOG, label: 'Backlogs' },
    { key: NOTIFICATION_CATEGORIES.ACADEMIC_UPDATE, label: 'Academic Updates' },
    { key: NOTIFICATION_CATEGORIES.SYSTEM, label: 'System' }
  ];

  const SORT_OPTIONS = [
    { key: 'newest', label: 'Newest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'unread_first', label: 'Unread First' }
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectFilter(tab.key)}
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

      {/* Search Input & Sort Dropdown */}
      <div className="flex items-center gap-2.5 w-full lg:w-auto">
        {/* Search Bar */}
        <div className="relative flex-1 lg:w-72">
          <Search className="w-4 h-4 text-text-light absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notifications..."
            className="calc-input w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-medium placeholder:text-text-light/50"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-card text-text-m hover:text-text-h border border-border hover:border-slate-300 dark:hover:border-[#2A374A] flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-light" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl py-1.5 z-30 animate-scaleUp">
              <span className="px-3 py-1 text-[10px] font-bold text-text-light uppercase tracking-wider block">
                Order By
              </span>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onSortChange(opt.key);
                      setIsSortOpen(false);
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
