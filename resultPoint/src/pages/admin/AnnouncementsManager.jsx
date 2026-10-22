import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Send,
  Sparkles,
  ExternalLink,
  Building2,
  GraduationCap,
  Layers,
  Shield,
  Pin,
  Megaphone,
  X,
  Calendar,
  AlertTriangle,
  Flame,
  FileText
} from 'lucide-react';
import {
  announcementService,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_UPDATED_EVENT
} from '../../services/announcementService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { useToast } from '../../context/ToastContext';

export default function AnnouncementsManager() {
  const { showToast } = useToast();

  // Announcements Data & Stats
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    urgent: 0,
    pinned: 0,
    banners: 0
  });
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  // Form State
  const initialForm = {
    title: '',
    content: '',
    category: 'Academic Notification',
    priority: 'Medium',
    status: 'Published',
    targetAudience: 'all',
    targetUniversityId: '',
    targetCourseId: '',
    targetRegulationId: '',
    isPinned: false,
    isBanner: false,
    actionLink: '',
    actionText: '',
    expiresAt: '',
    scheduledPublishAt: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Data
  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      const data = announcementService.getAllAnnouncements();
      setAnnouncements(data);
      setStats(announcementService.getAnnouncementStats());

      // Load catalog entities for target audience selectors
      const unvs = academicCatalogService.getUniversities();
      setUniversities(unvs || []);

      const cat = academicCatalogService.getCatalog();
      const allCourses = [];
      const allRegs = [];

      (cat?.universities || []).forEach((u) => {
        (u.courses || []).forEach((c) => {
          allCourses.push({
            ...c,
            universityName: u.shortName || u.name
          });
          (c.regulations || []).forEach((r) => {
            allRegs.push({
              ...r,
              courseName: c.shortName || c.name,
              universityName: u.shortName || u.name
            });
          });
        });
      });

      setCourses(allCourses);
      setRegulations(allRegs);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      showToast('Failed to load announcements data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Filtered List
  const filteredAnnouncements = useMemo(() => {
    return announcementService.getAllAnnouncements({
      search: searchTerm,
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      targetAudience: audienceFilter,
      sortBy
    });
  }, [announcements, searchTerm, statusFilter, categoryFilter, priorityFilter, audienceFilter, sortBy]);

  // Paginated List
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAnnouncements.slice(start, start + itemsPerPage);
  }, [filteredAnnouncements, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, priorityFilter, audienceFilter, sortBy]);

  // Helper Formatters
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  // Status Styling
  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
            <FileText className="w-3 h-3" />
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Priority Styling
  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
            <Flame className="w-3 h-3 fill-rose-500/20" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] border border-orange-200 dark:border-orange-900/40">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Low
          </span>
        );
    }
  };

  // Audience Chip
  const getAudienceChip = (item) => {
    const aud = (item.targetAudience || 'all').toLowerCase();
    if (aud === 'all') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Sparkles className="w-3 h-3 text-[#FF6B00]" />
          All Users
        </span>
      );
    }
    if (aud === 'students') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
          <GraduationCap className="w-3 h-3" />
          Students Only
        </span>
      );
    }
    if (aud === 'admins') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40">
          <Shield className="w-3 h-3" />
          Admins Only
        </span>
      );
    }
    if (aud === 'university') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/50 text-[#FF6B00] border border-orange-200/60 dark:border-orange-900/40 truncate max-w-[170px]"
          title={item.targetUniversityName || item.targetUniversityId}
        >
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{item.targetUniversityName || item.targetUniversityId}</span>
        </span>
      );
    }
    if (aud === 'course') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
          <GraduationCap className="w-3 h-3" />
          {item.targetCourseName || item.targetCourseId}
        </span>
      );
    }
    if (aud === 'regulation') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
          <Layers className="w-3 h-3" />
          {item.targetRegulationName || item.targetRegulationId}
        </span>
      );
    }
    return <span className="text-xs text-slate-500">{item.targetAudience}</span>;
  };

  // Open Create / Edit Modal
  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData(initialForm);
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingAnnouncement(item);
    setFormData({
      title: item.title || '',
      content: item.content || '',
      category: item.category || 'Academic Notification',
      priority: item.priority || 'Medium',
      status: item.status || 'Published',
      targetAudience: item.targetAudience || 'all',
      targetUniversityId: item.targetUniversityId || '',
      targetCourseId: item.targetCourseId || '',
      targetRegulationId: item.targetRegulationId || '',
      isPinned: Boolean(item.isPinned),
      isBanner: Boolean(item.isBanner),
      actionLink: item.actionLink || '',
      actionText: item.actionText || '',
      expiresAt: item.expiresAt ? item.expiresAt.substring(0, 16) : '',
      scheduledPublishAt: item.scheduledPublishAt ? item.scheduledPublishAt.substring(0, 16) : ''
    });
    setFormErrors({});
    setIsEditorModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      ...(formData.expiresAt ? { expiresAt: new Date(formData.expiresAt).toISOString() } : { expiresAt: null }),
      ...(formData.scheduledPublishAt
        ? { scheduledPublishAt: new Date(formData.scheduledPublishAt).toISOString() }
        : { scheduledPublishAt: null })
    };

    const validation = announcementService.validate(payload, Boolean(editingAnnouncement));
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setIsSubmitting(false);
      showToast(Object.values(validation.errors)[0], 'error');
      return;
    }

    try {
      if (editingAnnouncement) {
        announcementService.updateAnnouncement(editingAnnouncement.id, payload);
        showToast(`Announcement "${payload.title}" updated successfully.`, 'success');
      } else {
        const created = announcementService.createAnnouncement(payload);
        showToast(
          created.status === 'Published'
            ? `Announcement "${created.title}" published successfully.`
            : `Draft announcement "${created.title}" saved.`,
          'success'
        );
      }
      setIsEditorModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Action Handlers
  const handleTogglePublish = (item) => {
    try {
      if (item.status === 'Published') {
        announcementService.archiveAnnouncement(item.id);
        showToast(`Announcement "${item.title}" moved to Archive.`, 'success');
      } else {
        announcementService.publishAnnouncement(item.id);
        showToast(`Announcement "${item.title}" is now Published!`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = () => {
    if (!announcementToDelete) return;
    try {
      announcementService.deleteAnnouncement(announcementToDelete.id);
      showToast(`Announcement "${announcementToDelete.title}" deleted.`, 'success');
      setAnnouncementToDelete(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1E2A35]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] border border-orange-100 dark:border-orange-900/30 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Announcements Management
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/40">
                Phase 3C
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Broadcast institutional notices, examination circulars, regulation changes, and top banner alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] transition-colors cursor-pointer"
            title="Sync announcements from storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleOpenCreate}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Announcements */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Notices</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Registered announcements
          </div>
        </div>

        {/* Published */}
        <div className="bg-white dark:bg-[#111418] border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Published</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.published}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Live on student dashboard
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white dark:bg-[#111418] border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Drafts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.draft}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Unpublished working notices
          </div>
        </div>

        {/* Archived */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Archived</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">
            {stats.archived}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Historical retired notices
          </div>
        </div>

        {/* Active Banners */}
        <div className="bg-white dark:bg-[#111418] border border-orange-200/60 dark:border-orange-900/30 rounded-2xl p-4 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF6B00]">Active Banners</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#FF6B00] mt-2">
            {stats.banners}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Prominent top alerts
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, body, or university..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00] transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="all">All Statuses ({announcements.length})</option>
              <option value="published">Published ({stats.published})</option>
              <option value="draft">Drafts ({stats.draft})</option>
              <option value="archived">Archived ({stats.archived})</option>
            </select>
          </div>

          {/* Audience Filter */}
          <div>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="all">All Audiences</option>
              <option value="all">General / All Users</option>
              <option value="students">Students Only</option>
              <option value="admins">Administrators Only</option>
              <option value="university">University-Specific</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="priority">Sort: By Priority</option>
              <option value="status">Sort: By Status</option>
              <option value="published">Sort: Publication Date</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#1E2A35]/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Categories:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              type="button"
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {ANNOUNCEMENT_CATEGORIES.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                type="button"
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#FF6B00] text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>Showing {filteredAnnouncements.length} of {announcements.length} total</span>
            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || audienceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setAudienceFilter('all');
                  setPriorityFilter('all');
                }}
                type="button"
                className="text-[#FF6B00] hover:underline font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Title & Notice</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/60 text-xs text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                    <span>Loading announcements...</span>
                  </td>
                </tr>
              ) : paginatedAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No announcements found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your filters or creating a new notice.</p>
                  </td>
                </tr>
              ) : (
                paginatedAnnouncements.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#0D141F]/80 transition-colors cursor-pointer"
                    onClick={() => setPreviewAnnouncement(item)}
                  >
                    {/* Title & Notice */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isPinned && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200">
                              <Pin className="w-2.5 h-2.5 fill-amber-500" />
                              Pinned
                            </span>
                          )}
                          {item.isBanner && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-orange-50 dark:bg-orange-950/50 text-[#FF6B00] border border-orange-200">
                              <Megaphone className="w-2.5 h-2.5" />
                              Banner
                            </span>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white truncate block">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.content}</p>
                      </div>
                    </td>

                    {/* Target Audience */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getAudienceChip(item)}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Published Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {item.publishedAt ? formatDate(item.publishedAt) : 'Not published'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.publishedAt ? formatRelativeTime(item.publishedAt) : 'Draft state'}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewAnnouncement(item)}
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2A35] transition-colors cursor-pointer"
                          title="Preview Announcement"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF6B00] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(item)}
                          type="button"
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            item.status === 'Published'
                              ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold'
                          }`}
                          title={item.status === 'Published' ? 'Archive Notice' : 'Publish Notice'}
                        >
                          {item.status === 'Published' ? 'Archive' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setAnnouncementToDelete(item)}
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-[#1E2A35] bg-slate-50/50 dark:bg-[#0D141F]/50 text-xs text-slate-500">
            <span>
              Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </span>

            <div className="inline-flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                type="button"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                type="button"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Create / Edit Announcement Modal */}
      {/* ========================================================================= */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00] flex items-center justify-center">
                  <Bell className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure institutional announcements, target audience, and banner settings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorModalOpen(false)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Osmania University Examination Schedule 2026"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  required
                />
                {formErrors.title && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.title}</p>
                )}
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {ANNOUNCEMENT_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Audience Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience Scope *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="all">All Users (Public Visitors, Students & Admins)</option>
                    <option value="students">All Registered Students</option>
                    <option value="admins">Platform Administrators Only</option>
                    <option value="university">Specific University Audience</option>
                    <option value="course">Specific Course Program</option>
                    <option value="regulation">Specific Academic Regulation</option>
                  </select>
                </div>

                {/* Conditional University Selector */}
                {formData.targetAudience === 'university' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target University *
                    </label>
                    <select
                      value={formData.targetUniversityId}
                      onChange={(e) => setFormData({ ...formData, targetUniversityId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      <option value="">-- Select University --</option>
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.shortName})
                        </option>
                      ))}
                    </select>
                    {formErrors.targetUniversityId && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.targetUniversityId}</p>
                    )}
                  </div>
                )}

                {/* Conditional Course Selector */}
                {formData.targetAudience === 'course' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Course Program *
                    </label>
                    <select
                      value={formData.targetCourseId}
                      onChange={(e) => setFormData({ ...formData, targetCourseId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      <option value="">-- Select Course Program --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.universityName} • {c.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.targetCourseId && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.targetCourseId}</p>
                    )}
                  </div>
                )}

                {/* Conditional Regulation Selector */}
                {formData.targetAudience === 'regulation' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Academic Regulation *
                    </label>
                    <select
                      value={formData.targetRegulationId}
                      onChange={(e) => setFormData({ ...formData, targetRegulationId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      <option value="">-- Select Regulation --</option>
                      {regulations.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.universityName} • {r.code || r.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.targetRegulationId && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.targetRegulationId}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details & Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide comprehensive details regarding the institutional circular, examination dates, or syllabus changes..."
                  rows={4}
                  className="w-full p-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  required
                />
                {formErrors.content && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.content}</p>
                )}
              </div>

              {/* Call to Action Button Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Action Button Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.actionLink}
                    onChange={(e) => setFormData({ ...formData, actionLink: e.target.value })}
                    placeholder="/calculators/sgpa or https://..."
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Action Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.actionText}
                    onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                    placeholder="e.g. Check Timetable"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Display & Status Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 dark:border-[#1E2A35]">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Publication State
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Published">Published (Live)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Archived">Archived (Retired)</option>
                  </select>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                  {formErrors.expiresAt && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.expiresAt}</p>
                  )}
                </div>

                {/* Checkbox Options */}
                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <span>Pin to top of lists</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBanner}
                      onChange={(e) => setFormData({ ...formData, isBanner: e.target.checked })}
                      className="rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <span>Display as top banner alert</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E2A35] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingAnnouncement
                    ? 'Update Announcement'
                    : formData.status === 'Published'
                    ? 'Publish Announcement'
                    : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Live Preview Modal */}
      {/* ========================================================================= */}
      {previewAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl shadow-2xl overflow-hidden my-8 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#FF6B00]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Announcement Preview
                </h3>
              </div>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Audience Badge */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Audience:</span>
              {getAudienceChip(previewAnnouncement)}
            </div>

            {/* Top Banner Simulation (If banner is enabled) */}
            {previewAnnouncement.isBanner && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 dark:border-orange-900/40 flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {previewAnnouncement.title}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    {previewAnnouncement.content}
                  </p>
                </div>
              </div>
            )}

            {/* Full Dashboard Notice Card Simulation */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {getStatusBadge(previewAnnouncement.status)}
                  {getPriorityBadge(previewAnnouncement.priority)}
                </div>
                <span className="text-[11px] text-slate-400">
                  {previewAnnouncement.publishedAt
                    ? `Published ${formatDate(previewAnnouncement.publishedAt)}`
                    : 'Draft'}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {previewAnnouncement.title}
              </h4>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {previewAnnouncement.content}
              </p>

              {previewAnnouncement.actionLink && (
                <div className="pt-2">
                  <a
                    href={previewAnnouncement.actionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all"
                  >
                    <span>{previewAnnouncement.actionText || 'View Details'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewAnnouncement(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E2A35] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {announcementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Delete Announcement?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to permanently delete &quot;{announcementToDelete.title}&quot;?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAnnouncementToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E2A35] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
