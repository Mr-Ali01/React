import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  ExternalLink,
  Building2,
  BookOpen,
  FileText,
  Download,
  Tag,
  GraduationCap,
  Sparkles,
  Layers,
  X,
  FileCheck,
  Globe,
  Users,
  ShieldAlert,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Pin
} from 'lucide-react';

import {
  resourceManagementService,
  RESOURCE_UPDATED_EVENT,
  RESOURCE_STATUSES,
  RESOURCE_AUDIENCES,
  RESOURCE_TYPES,
  isValidResourceUrl
} from '../../services/resourceManagementService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { RESOURCE_CATEGORIES } from '../../data/resourcesData';
import { useToast } from '../../context/ToastContext';

export default function ResourcesManager() {
  const { showToast } = useToast();

  // State
  const [resources, setResources] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalDownloads: 0,
    totalViews: 0
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form State
  const initialFormState = {
    title: '',
    description: '',
    category: 'study-materials',
    resourceType: 'pdf',
    fileUrl: '',
    detailRoute: '',
    fileType: 'PDF Document',
    fileSize: '2.5 MB',
    targetAudience: 'all',
    universityId: '',
    courseId: '',
    regulation: '',
    semester: 'All Semesters',
    subject: '',
    tagsString: '',
    status: 'published',
    isPinned: false,
    isFeatured: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Loading
  const loadData = useCallback(() => {
    try {
      const all = resourceManagementService.getAllResources();
      setResources(all);
      setStats(resourceManagementService.getResourceStats());

      // Academic catalog universities
      const unis = academicCatalogService.getUniversities() || [];
      setUniversities(unis);
    } catch (err) {
      console.error('Failed to load resources:', err);
      showToast('Error loading resources.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(RESOURCE_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(RESOURCE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Filtered List
  const filteredResources = useMemo(() => {
    return resourceManagementService.getAllResources({
      search: searchTerm,
      category: categoryFilter,
      universityId: universityFilter,
      status: statusFilter,
      audience: audienceFilter,
      sortBy
    });
  }, [searchTerm, categoryFilter, universityFilter, statusFilter, audienceFilter, sortBy, resources]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage) || 1;
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(start, start + itemsPerPage);
  }, [filteredResources, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, universityFilter, statusFilter, audienceFilter, sortBy]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title || '',
      description: resource.description || '',
      category: resource.category || 'study-materials',
      resourceType: resource.resourceType || 'pdf',
      fileUrl: resource.fileUrl || '',
      detailRoute: resource.detailRoute || '',
      fileType: resource.fileType || 'PDF Document',
      fileSize: resource.fileSize || '2.5 MB',
      targetAudience: resource.targetAudience || 'all',
      universityId: resource.universityId || '',
      courseId: resource.courseId || '',
      regulation: resource.regulation || '',
      semester: resource.semester || 'All Semesters',
      subject: resource.subject || '',
      tagsString: Array.isArray(resource.tags) ? resource.tags.join(', ') : '',
      status: resource.status || 'published',
      isPinned: Boolean(resource.isPinned),
      isFeatured: Boolean(resource.isFeatured)
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Resource title is required.';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    } else if (formData.title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters.';
    }

    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Description is required.';
    } else if (formData.description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters.';
    }

    if (!formData.category) {
      errors.category = 'Please select a resource category.';
    }

    if (formData.fileUrl && formData.fileUrl.trim()) {
      if (!isValidResourceUrl(formData.fileUrl)) {
        errors.fileUrl = 'Must be a valid HTTP or HTTPS URL (no script or executable tokens).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = formData.tagsString
        ? formData.tagsString.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        resourceType: formData.resourceType,
        fileUrl: formData.fileUrl ? formData.fileUrl.trim() : null,
        detailRoute: formData.detailRoute ? formData.detailRoute.trim() : null,
        fileType: formData.fileType ? formData.fileType.trim() : 'PDF Document',
        fileSize: formData.fileSize ? formData.fileSize.trim() : '2.0 MB',
        targetAudience: formData.targetAudience,
        universityId: formData.universityId || null,
        courseId: formData.courseId ? formData.courseId.trim() : null,
        regulation: formData.regulation ? formData.regulation.trim() : null,
        semester: formData.semester || null,
        subject: formData.subject ? formData.subject.trim() : null,
        tags: parsedTags,
        status: formData.status,
        isPinned: formData.isPinned,
        isFeatured: formData.isFeatured
      };

      if (editingResource) {
        resourceManagementService.updateResource(editingResource.id, payload);
        showToast(`Resource "${payload.title}" updated successfully!`, 'success');
      } else {
        resourceManagementService.createResource(payload);
        showToast(`New resource "${payload.title}" published successfully!`, 'success');
      }

      setIsEditorModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Toggle (Publish / Archive / Reactivate)
  const handleStatusChange = (resource, newStatus) => {
    try {
      resourceManagementService.setResourceStatus(resource.id, newStatus);
      showToast(`Resource "${resource.title}" status changed to ${newStatus}.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to change status.', 'error');
    }
  };

  // Delete Handlers
  const handleConfirmDelete = () => {
    if (!resourceToDelete) return;
    try {
      resourceManagementService.deleteResource(resourceToDelete.id, true);
      showToast(`Resource "${resourceToDelete.title}" deleted.`, 'success');
      setResourceToDelete(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete resource.', 'error');
    }
  };

  // Reset to Defaults
  const handleConfirmReset = () => {
    try {
      resourceManagementService.resetToDefaults();
      showToast('Restored academic resources to factory baseline defaults.', 'success');
      setIsResetModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Reset failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/15">
              <FolderOpen className="w-3.5 h-3.5 text-accent" />
              <span>Phase 3F: Academic Resources Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Resources & Study Materials Management
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Curate, validate, publish, and scope university syllabi, previous examination papers, lecture notes, and formula sheets across Osmania University and JNTU Hyderabad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold backdrop-blur-md border border-white/10 transition-all flex items-center gap-2"
              title="Restore sample baseline resources"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-lg shadow-accent/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Resources */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Total Resources</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-h">
            {stats.total}
          </div>
          <p className="text-xs text-text-m">
            Across {Object.keys(stats.categoryBreakdown || {}).length} academic categories
          </p>
        </div>

        {/* Published */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Published & Active</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.published}
          </div>
          <p className="text-xs text-text-m">
            Live on student portal & directory
          </p>
        </div>

        {/* Drafts */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Draft / In Review</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.draft}
          </div>
          <p className="text-xs text-text-m">
            Hidden from student view
          </p>
        </div>

        {/* Archived */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Archived Materials</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {stats.archived}
          </div>
          <p className="text-xs text-text-m">
            Safely preserved for reference
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, description, subject, tags..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-bg text-text-h placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Categories</option>
              {RESOURCE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* University Scoping Dropdown */}
          <div className="md:col-span-2">
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Institutions</option>
              <option value="general">General / Common</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.shortName || u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="downloads">Most Downloaded</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Filter Count indicator */}
        <div className="flex items-center justify-between text-[11px] text-text-light pt-1 border-t border-border/50">
          <span>
            Showing <strong className="text-text-h">{filteredResources.length}</strong> of {resources.length} registered resources
          </span>
          {(searchTerm || categoryFilter !== 'all' || universityFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setUniversityFilter('all');
                setStatusFilter('all');
                setAudienceFilter('all');
              }}
              className="text-accent hover:underline font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Resources Table */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-bg-sec/50 border-b border-border text-text-light font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3.5 px-4">Resource Details</th>
                <th className="py-3.5 px-3">Type & Format</th>
                <th className="py-3.5 px-3">Academic Scope</th>
                <th className="py-3.5 px-3">Audience & Status</th>
                <th className="py-3.5 px-3">Engagement</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedResources.length > 0 ? (
                paginatedResources.map((res) => {
                  const isPublished = (res.status || 'published').toLowerCase() === 'published';
                  const isDraft = (res.status || '').toLowerCase() === 'draft';
                  const isArchived = (res.status || '').toLowerCase() === 'archived';

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-bg-sec/30 transition-colors group"
                    >
                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {res.isPinned && (
                              <span className="p-0.5 rounded bg-accent-soft text-accent" title="Pinned to top">
                                <Pin className="w-3 h-3 rotate-45" />
                              </span>
                            )}
                            <span className="font-bold text-text-h text-xs sm:text-[13px] hover:text-accent cursor-pointer" onClick={() => setPreviewResource(res)}>
                              {res.title}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-text-m line-clamp-2 leading-relaxed">
                            {res.description}
                          </p>
                          {res.tags && res.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {res.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-bg text-text-light border border-border"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {res.tags.length > 3 && (
                                <span className="text-[10px] text-text-light font-medium">
                                  +{res.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Type & Format */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-accent-soft text-accent border border-accent/20">
                            <FileText className="w-3 h-3" />
                            <span>{res.categoryLabel || res.category}</span>
                          </span>
                          <div className="text-[11px] text-text-light flex items-center gap-1.5">
                            <span>{res.fileType || 'PDF'}</span>
                            {res.fileSize && <span>• {res.fileSize}</span>}
                          </div>
                          {res.fileUrl && (
                            <a
                              href={res.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] text-blue-500 hover:underline flex items-center gap-1 inline-flex"
                              title={res.fileUrl}
                            >
                              <span>Open URL</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Academic Scope */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11.5px] font-semibold text-text-h">
                            <Building2 className="w-3 h-3 text-text-light" />
                            <span>{res.universityName || 'General'}</span>
                          </div>
                          <div className="text-[11px] text-text-m">
                            {res.courseId ? res.courseId.toUpperCase() : 'All Courses'}
                            {res.regulation && ` • ${res.regulation}`}
                          </div>
                          {res.semester && (
                            <span className="text-[10px] text-text-light">
                              {res.semester}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Audience & Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1.5">
                          {/* Status Badge */}
                          <div>
                            {isPublished && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Published</span>
                              </span>
                            )}
                            {isDraft && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertCircle className="w-3 h-3" />
                                <span>Draft</span>
                              </span>
                            )}
                            {isArchived && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <Archive className="w-3 h-3" />
                                <span>Archived</span>
                              </span>
                            )}
                          </div>

                          {/* Audience */}
                          <div className="flex items-center gap-1 text-[10.5px] text-text-light">
                            <Users className="w-3 h-3" />
                            <span className="capitalize">{res.targetAudience || 'all'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Engagement */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-text-m">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5" title="Total Downloads">
                            <Download className="w-3 h-3 text-text-light" />
                            <span>{res.downloadCount || 0} downloads</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-light" title="Total Views">
                            <Eye className="w-3 h-3" />
                            <span>{res.viewCount || 0} views</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setPreviewResource(res)}
                            className="p-1.5 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
                            title="Preview Resource Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(res)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                            title="Edit Resource"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Status toggle */}
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(res, 'archived')}
                              className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-500/10 transition-colors"
                              title="Archive Resource"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(res, 'published')}
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              title="Publish Resource"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setResourceToDelete(res)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-light">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-text-light/50" />
                    <p className="text-sm font-semibold text-text-h">No resources match the selected criteria</p>
                    <p className="text-xs text-text-m mt-1">Try resetting your filters or search keywords.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-m">
            <div>
              Page <strong className="text-text-h">{currentPage}</strong> of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-bg-sec disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-bg-sec disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal (Create / Edit) */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-bg-sec/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-accent-soft text-accent">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text-h">
                    {editingResource ? 'Edit Academic Resource' : 'Add New Academic Resource'}
                  </h2>
                  <p className="text-xs text-text-light">
                    {editingResource ? `Updating ID: ${editingResource.id}` : 'Fill in the metadata and upload or link your study resource'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorModalOpen(false)}
                className="p-2 rounded-xl text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. JNTUH R18 CSE Semester 3 Previous Question Papers"
                  className={`w-full px-3 py-2.5 rounded-xl border bg-bg text-text-h focus:outline-none focus:ring-2 ${
                    formErrors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                  }`}
                />
                {formErrors.title && <p className="text-red-500 text-[11px] mt-1">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize the resource topics, syllabus chapters covered, or examination pattern..."
                  className={`w-full px-3 py-2 rounded-xl border bg-bg text-text-h focus:outline-none focus:ring-2 ${
                    formErrors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                  }`}
                />
                {formErrors.description && <p className="text-red-500 text-[11px] mt-1">{formErrors.description}</p>}
              </div>

              {/* Row 1: Category & Resource Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-h block mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {RESOURCE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-text-h block mb-1">
                    Format / Type
                  </label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()} Document
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: File URL & Format Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-text-h block mb-1">
                    Download / File URL (HTTPS)
                  </label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    placeholder="https://example.university.edu/papers/cse-sem3.pdf"
                    className={`w-full px-3 py-2 rounded-xl border bg-bg text-text-h focus:outline-none focus:ring-2 ${
                      formErrors.fileUrl ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                    }`}
                  />
                  {formErrors.fileUrl && <p className="text-red-500 text-[11px] mt-1">{formErrors.fileUrl}</p>}
                </div>

                <div>
                  <label className="font-semibold text-text-h block mb-1">
                    Display File Size
                  </label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    placeholder="e.g. 3.2 MB"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Academic Scoping Section */}
              <div className="pt-2 border-t border-border/70 space-y-3">
                <h3 className="font-bold text-text-h text-xs uppercase tracking-wider text-accent">
                  Academic Applicability Scoping
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* University */}
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      University
                    </label>
                    <select
                      value={formData.universityId}
                      onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Common / All Institutions</option>
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course / Branch */}
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Course / Branch Code
                    </label>
                    <input
                      type="text"
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      placeholder="e.g. btech-cse, mca"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  {/* Regulation */}
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Academic Regulation
                    </label>
                    <input
                      type="text"
                      value={formData.regulation}
                      onChange={(e) => setFormData({ ...formData, regulation: e.target.value })}
                      placeholder="e.g. R18, R22, CBCS"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Semester */}
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Target Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="All Semesters">All Semesters</option>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Subject / Topic
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Discrete Mathematics"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Publication Status & Audience */}
              <div className="pt-2 border-t border-border/70 space-y-3">
                <h3 className="font-bold text-text-h text-xs uppercase tracking-wider text-accent">
                  Publication Settings & Audience
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Publication Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="published">Published (Visible to students)</option>
                      <option value="draft">Draft (Hidden from students)</option>
                      <option value="archived">Archived (Preserved in archive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="all">All (Public & Students)</option>
                      <option value="students">Students Only</option>
                      <option value="faculty">Faculty Only</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="font-semibold text-text-h block mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tagsString}
                    onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                    placeholder="e.g. JNTUH, Previous Papers, CSE, R18"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-text-h font-medium">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="rounded text-accent focus:ring-accent"
                    />
                    <span>Pin to top of directory</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-text-h font-medium">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-accent focus:ring-accent"
                    />
                    <span>Show in Featured Cards</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-text-h font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition-all shadow-md shadow-accent/20"
                >
                  {isSubmitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Details Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{previewResource.categoryLabel || previewResource.category}</span>
                </span>
                <h3 className="text-lg font-black text-text-h pt-1">
                  {previewResource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="p-1.5 rounded-xl text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              {previewResource.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-bg-sec/50 p-3.5 rounded-2xl border border-border/60">
              <div>
                <span className="text-text-light block text-[10.5px]">University</span>
                <strong className="text-text-h">{previewResource.universityName || 'General'}</strong>
              </div>
              <div>
                <span className="text-text-light block text-[10.5px]">Course & Regulation</span>
                <strong className="text-text-h">{previewResource.courseId?.toUpperCase() || 'All'} {previewResource.regulation ? `(${previewResource.regulation})` : ''}</strong>
              </div>
              <div>
                <span className="text-text-light block text-[10.5px]">Semester</span>
                <strong className="text-text-h">{previewResource.semester || 'All Semesters'}</strong>
              </div>
              <div>
                <span className="text-text-light block text-[10.5px]">Subject</span>
                <strong className="text-text-h">{previewResource.subject || 'All Subjects'}</strong>
              </div>
              <div>
                <span className="text-text-light block text-[10.5px]">Downloads</span>
                <strong className="text-text-h">{previewResource.downloadCount || 0}</strong>
              </div>
              <div>
                <span className="text-text-light block text-[10.5px]">Publication Status</span>
                <strong className="text-emerald-500 capitalize">{previewResource.status}</strong>
              </div>
            </div>

            {previewResource.fileUrl && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                <div className="truncate max-w-[320px]">
                  <span className="text-blue-500 font-semibold block text-[10.5px]">Resource URL</span>
                  <span className="text-text-m truncate">{previewResource.fileUrl}</span>
                </div>
                <a
                  href={previewResource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="px-5 py-2 rounded-xl bg-accent text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 rounded-2xl bg-red-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Delete Academic Resource</h3>
                <p className="text-xs text-text-light">This action will remove the record from ResultPoint</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-text-h">"{resourceToDelete.title}"</strong>? If you wish to preserve historical reference links, consider <strong>Archiving</strong> instead.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(resourceToDelete, 'archived');
                  setResourceToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 text-xs font-bold"
              >
                Archive Instead
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-3 rounded-2xl bg-amber-500/10">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Restore Factory Baseline</h3>
                <p className="text-xs text-text-light">Reset academic resources catalog</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              This will restore the standard sample resources from the baseline catalogue while recording an audit history trail. Any custom resources created will be replaced with official initial samples.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
