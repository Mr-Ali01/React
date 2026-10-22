import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Edit3,
  ExternalLink,
  Shield,
  Layers,
  Building2,
  BookOpen,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  Info,
  Clock,
  Sparkles,
  Tag,
  Hash,
  RefreshCw,
  Power,
  PowerOff
} from 'lucide-react';
import {
  toolManagementService,
  TOOL_UPDATED_EVENT,
  TOOL_STATUSES
} from '../../services/toolManagementService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { useToast } from '../../context/ToastContext';
import { CATEGORIES_CONFIG } from '../../data/toolsData';

export default function ToolsManager() {
  const { showToast } = useToast();

  // Data & Stats State
  const [tools, setTools] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    enabled: 0,
    disabled: 0,
    mostUsedTool: null
  });
  const [catalogUniversities, setCatalogUniversities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  // Modals State
  const [editingTool, setEditingTool] = useState(null);
  const [configTool, setConfigTool] = useState(null);
  const [scopingTool, setScopingTool] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Form States for Modals
  const [metadataForm, setMetadataForm] = useState({
    name: '',
    category: '',
    description: '',
    keywords: ''
  });
  const [configForm, setConfigForm] = useState({});
  const [scopingForm, setScopingForm] = useState({
    allUniversities: true,
    selectedUniversities: []
  });
  const [formError, setFormError] = useState('');

  // Load Data
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const all = toolManagementService.getAllTools({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
        sortBy
      });
      setTools(all);
      setStats(toolManagementService.getToolStats());

      const univs = academicCatalogService.getUniversities();
      setCatalogUniversities(univs);
    } catch (err) {
      console.error('Failed to load tools management data:', err);
      showToast('Failed to load tools registry', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, statusFilter, sortBy, showToast]);

  // Initial load and subscription
  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(TOOL_UPDATED_EVENT, handleUpdate);
    window.addEventListener('rp_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(TOOL_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('rp_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Handle Quick Status Toggle
  const handleToggleStatus = (tool) => {
    try {
      const newStatus = tool.status === 'enabled' ? 'disabled' : 'enabled';
      toolManagementService.setToolStatus(
        tool.id,
        newStatus,
        `Toggled to ${newStatus} via Admin Tools Management dashboard`
      );
      showToast(
        `Calculator "${tool.name}" is now ${newStatus.toUpperCase()}`,
        newStatus === 'enabled' ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Toggle status failed:', err);
      showToast(err.message || 'Failed to change tool status', 'error');
    }
  };

  // Open Metadata Edit Modal
  const handleOpenEdit = (tool) => {
    setEditingTool(tool);
    setMetadataForm({
      name: tool.name || '',
      category: tool.category || 'Academic Performance',
      description: tool.description || '',
      keywords: Array.isArray(tool.keywords) ? tool.keywords.join(', ') : ''
    });
    setFormError('');
  };

  // Save Metadata Edit
  const handleSaveMetadata = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const keywordsArray = metadataForm.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      toolManagementService.updateToolMetadata(editingTool.id, {
        name: metadataForm.name,
        category: metadataForm.category,
        description: metadataForm.description,
        keywords: keywordsArray
      });

      showToast(`Updated metadata for "${editingTool.name}"`, 'success');
      setEditingTool(null);
    } catch (err) {
      setFormError(err.message || 'Validation error saving metadata');
    }
  };

  // Open Parameter Config Modal
  const handleOpenConfig = (tool) => {
    setConfigTool(tool);
    setConfigForm({ ...(tool.config || {}) });
    setFormError('');
  };

  // Save Parameter Config
  const handleSaveConfig = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      toolManagementService.updateToolConfig(configTool.id, configForm);
      showToast(`Configuration updated for "${configTool.name}"`, 'success');
      setConfigTool(null);
    } catch (err) {
      setFormError(err.message || 'Configuration validation error');
    }
  };

  // Open Scoping Modal
  const handleOpenScoping = (tool) => {
    setScopingTool(tool);
    const univs = tool.applicability?.universities || ['all'];
    const isAll = univs.includes('all');
    setScopingForm({
      allUniversities: isAll,
      selectedUniversities: isAll ? [] : univs
    });
    setFormError('');
  };

  // Save Scoping
  const handleSaveScoping = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const finalUnivs = scopingForm.allUniversities ? ['all'] : scopingForm.selectedUniversities;
      if (!scopingForm.allUniversities && finalUnivs.length === 0) {
        throw new Error('Please select at least one university or enable "All Universities".');
      }

      toolManagementService.updateToolApplicability(scopingTool.id, {
        universities: finalUnivs,
        courses: ['all'],
        regulations: ['all']
      });

      showToast(`Applicability updated for "${scopingTool.name}"`, 'success');
      setScopingTool(null);
    } catch (err) {
      setFormError(err.message || 'Scoping error');
    }
  };

  // Handle Reset to Defaults
  const handleConfirmReset = () => {
    try {
      toolManagementService.resetToDefaults();
      showToast('Calculator registry restored to factory defaults', 'success');
      setResetConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to reset registry', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Tools & Calculators Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure platform calculators, availability toggles, institutional applicability, and parameter bounds.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF6B00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Platform Tools */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Calculators</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Across {Object.keys(stats.categoryCounts || {}).length} functional categories
          </p>
        </div>

        {/* Card 2: Enabled Tools */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active & Enabled</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.enabled}</span>
            <span className="text-xs text-slate-400">
              ({stats.total > 0 ? Math.round((stats.enabled / stats.total) * 100) : 0}%)
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Available for new calculations</p>
        </div>

        {/* Card 3: Disabled Tools */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Disabled / Inactive</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.disabled}</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {stats.disabled > 0 ? 'Showing unavailable notice to visitors' : 'All platform calculators active'}
          </p>
        </div>

        {/* Card 4: Most Utilized Tool */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Calculator</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {stats.mostUsedTool?.name || 'CGPA Calculator'}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {stats.mostUsedTool?.usageCount?.toLocaleString() || 0} lifetime usages
          </p>
        </div>
      </div>

      {/* 3. Search and Multi-Criteria Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by tool name, ID, or keywords..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            {CATEGORIES_CONFIG.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="popularity">Sort by Popularity</option>
            <option value="usage">Sort by Usage Count</option>
            <option value="name">Sort by Name</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      </div>

      {/* 4. Tools Registry Table */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl shadow-2xs overflow-hidden">
        {tools.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-[#1E2A35]">
                <tr>
                  <th className="py-3 px-4">Tool Name & Identifier</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status & Switch</th>
                  <th className="py-3 px-4">Applicability</th>
                  <th className="py-3 px-4">Parameters</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/80 text-slate-800 dark:text-slate-200">
                {tools.map((tool) => {
                  const isEnabled = tool.status === 'enabled';
                  const isScoped =
                    tool.applicability?.universities && !tool.applicability.universities.includes('all');

                  return (
                    <tr
                      key={tool.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-[#1A2332]/40 transition-colors"
                    >
                      {/* Name & Route */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isEnabled
                                ? 'bg-orange-500/10 text-[#FF6B00]'
                                : 'bg-slate-200 dark:bg-[#1E2A35] text-slate-400'
                            }`}
                          >
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{tool.name}</span>
                              {tool.isNew && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono text-[10px]">{tool.id}</span>
                              <span>•</span>
                              <span className="text-slate-500 truncate max-w-[180px]">{tool.route}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1E2A35] text-slate-700 dark:text-slate-300 font-medium">
                          {tool.category}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(tool)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            title={`Click to ${isEnabled ? 'disable' : 'enable'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      {/* Institutional Applicability */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenScoping(tool)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            isScoped
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
                              : 'bg-slate-100 dark:bg-[#1E2A35] border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>
                            {isScoped
                              ? `${tool.applicability.universities.length} Universities`
                              : 'All Universities'}
                          </span>
                        </button>
                      </td>

                      {/* Config Summary */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {tool.config?.defaultScale ? `Scale ${tool.config.defaultScale}` : ''}
                        {tool.config?.decimalPrecision !== undefined
                          ? ` • ${tool.config.decimalPrecision} dec`
                          : ''}
                        {tool.config?.roundingMode ? ` (${tool.config.roundingMode})` : ''}
                        {tool.config?.defaultConversionFormula ? tool.config.defaultConversionFormula : ''}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Configure Parameters Button */}
                          <button
                            onClick={() => handleOpenConfig(tool)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-100 dark:hover:bg-[#1A2332] text-slate-600 dark:text-slate-300 transition-colors"
                            title="Configure Parameters"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Metadata Button */}
                          <button
                            onClick={() => handleOpenEdit(tool)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-100 dark:hover:bg-[#1A2332] text-slate-600 dark:text-slate-300 transition-colors"
                            title="Edit Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview Link */}
                          <a
                            href={tool.route}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-100 dark:hover:bg-[#1A2332] text-slate-600 dark:text-slate-300 transition-colors"
                            title="Open Calculator"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Calculators Found Matching Filter Criteria
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Adjust your search term or select "All Categories" to view the complete calculator registry.
            </p>
          </div>
        )}
      </div>

      {/* 5. Edit Metadata Modal */}
      {editingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Tool Metadata: {editingTool.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTool(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveMetadata} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tool Identifier (Immutable)
                </label>
                <input
                  type="text"
                  value={editingTool.id}
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-100 dark:bg-[#0D141F] text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tool Display Name *
                </label>
                <input
                  type="text"
                  value={metadataForm.name}
                  onChange={(e) => setMetadataForm({ ...metadataForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <select
                  value={metadataForm.category}
                  onChange={(e) => setMetadataForm({ ...metadataForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                >
                  {CATEGORIES_CONFIG.filter((c) => c.name !== 'All Tools').map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  value={metadataForm.description}
                  onChange={(e) => setMetadataForm({ ...metadataForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Search Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={metadataForm.keywords}
                  onChange={(e) => setMetadataForm({ ...metadataForm, keywords: e.target.value })}
                  placeholder="cgpa, marks, credits, semester"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setEditingTool(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold shadow-2xs"
                >
                  Save Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Configure Parameters Modal */}
      {configTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Configure Parameters: {configTool.name}
                </h3>
              </div>
              <button
                onClick={() => setConfigTool(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4 mt-4 text-xs">
              {/* Scale parameter if applicable */}
              {configForm.defaultScale !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Grading Scale
                  </label>
                  <select
                    value={configForm.defaultScale}
                    onChange={(e) => setConfigForm({ ...configForm, defaultScale: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white"
                  >
                    <option value="10.0">10.0 Point Scale (Standard UGC / CBCS)</option>
                    <option value="4.0">4.0 Point Scale (US / International GPA)</option>
                  </select>
                </div>
              )}

              {/* Decimal Precision */}
              {configForm.decimalPrecision !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Decimal Output Precision (0 to 4 places)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={configForm.decimalPrecision}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, decimalPrecision: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Rounding Mode */}
              {configForm.roundingMode !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Rounding Mode
                  </label>
                  <select
                    value={configForm.roundingMode}
                    onChange={(e) => setConfigForm({ ...configForm, roundingMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white"
                  >
                    <option value="round">Standard Half-Up Rounding (e.g. 8.755 &rarr; 8.76)</option>
                    <option value="floor">Floor / Truncate (e.g. 8.759 &rarr; 8.75)</option>
                    <option value="ceil">Ceil (e.g. 8.751 &rarr; 8.76)</option>
                  </select>
                </div>
              )}

              {/* Max Credits */}
              {configForm.maxCreditsPerSubject !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Maximum Credits Allowed per Subject
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={configForm.maxCreditsPerSubject}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, maxCreditsPerSubject: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Conversion Formula */}
              {configForm.defaultConversionFormula !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Standard Conversion Formula
                  </label>
                  <input
                    type="text"
                    value={configForm.defaultConversionFormula}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, defaultConversionFormula: e.target.value })
                    }
                    placeholder="CGPA * 10 or (CGPA - 0.5) * 10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must follow standard linear expression format.
                  </span>
                </div>
              )}

              {/* Passing Marks Threshold */}
              {configForm.passingMarksThreshold !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Passing Marks Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.passingMarksThreshold}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, passingMarksThreshold: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setConfigTool(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold shadow-2xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Scoping Modal (Universities Applicability) */}
      {scopingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  University Applicability: {scopingTool.name}
                </h3>
              </div>
              <button
                onClick={() => setScopingTool(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveScoping} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopingForm.allUniversities}
                    onChange={(e) =>
                      setScopingForm({
                        ...scopingForm,
                        allUniversities: e.target.checked
                      })
                    }
                    className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span>Applicable to All Configured Universities (Open Public Access)</span>
                </label>
              </div>

              {!scopingForm.allUniversities && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Enabled Universities:
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-[#0D141F] rounded-xl border border-slate-200 dark:border-[#1E2A35]">
                    {catalogUniversities.map((u) => {
                      const isChecked = scopingForm.selectedUniversities.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-[#111418] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScopingForm({
                                  ...scopingForm,
                                  selectedUniversities: [...scopingForm.selectedUniversities, u.id]
                                });
                              } else {
                                setScopingForm({
                                  ...scopingForm,
                                  selectedUniversities: scopingForm.selectedUniversities.filter(
                                    (id) => id !== u.id
                                  )
                                });
                              }
                            }}
                            className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {u.name} ({u.shortName})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setScopingTool(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold shadow-2xs"
                >
                  Save Applicability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-2xl w-full max-w-md p-6 shadow-xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Restore Tools Factory Defaults?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              This will re-enable all calculators and reset parameter configurations back to baseline values.
              Historical saved calculations and student result transcripts remain completely untouched.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#1A2332] text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
