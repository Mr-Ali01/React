import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  User,
  Shield,
  Send,
  Trash2,
  Edit3,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  Flame,
  Check,
  X,
  FileText
} from 'lucide-react';
import {
  supportQueryService,
  QUERY_STATUSES,
  QUERY_PRIORITIES,
  QUERY_CATEGORIES,
  QUERY_UPDATED_EVENT
} from '../../services/supportQueryService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';

export default function SupportQueriesManager() {
  const { showToast } = useToast();

  // Queries Data & Stats
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    unassigned: 0,
    pending: 0
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);

  // Response Form State in Detail Modal
  const [responseText, setResponseText] = useState('');
  const [resolveWithResponse, setResolveWithResponse] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    subject: '',
    category: 'Calculator Support',
    message: '',
    priority: 'Medium',
    status: 'Open',
    assignedAdminId: '',
    userId: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  // Load Data
  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      const data = supportQueryService.getAllQueries();
      setQueries(data);
      setStats(supportQueryService.getQueryStats());

      // Load admins for assignment dropdown
      const admins = userService.getAllUsers({ role: 'admin' });
      setAdminUsers(admins);

      // Load students for user-linking dropdown
      const students = userService.getAllUsers({ role: 'student' });
      setAllStudents(students);
    } catch (err) {
      console.error('Failed to load support queries:', err);
      showToast('Failed to load support queries data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(QUERY_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(QUERY_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Keep selected query fresh when data reloads
  useEffect(() => {
    if (selectedQuery && isDetailModalOpen) {
      const refreshed = supportQueryService.getQueryById(selectedQuery.id);
      if (refreshed) setSelectedQuery(refreshed);
    }
  }, [queries, isDetailModalOpen]);

  // Filtered & Sorted List
  const filteredQueries = useMemo(() => {
    return supportQueryService.getAllQueries({
      search: searchTerm,
      status: statusFilter,
      priority: priorityFilter,
      category: categoryFilter,
      assignedAdminId: adminFilter,
      sortBy
    });
  }, [queries, searchTerm, statusFilter, priorityFilter, categoryFilter, adminFilter, sortBy]);

  // Paginated List
  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage) || 1;
  const paginatedQueries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQueries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQueries, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, adminFilter, sortBy]);

  // Format Date Helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  // Status Styling Badge
  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
            <AlertCircle className="w-3 h-3" />
            Open
          </span>
        );
      case 'in progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3 h-3" />
            Closed
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

  // Priority Styling Badge
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

  // Handlers
  const handleOpenDetail = (query) => {
    const fullQuery = supportQueryService.getQueryById(query.id);
    setSelectedQuery(fullQuery || query);
    setResponseText('');
    setResolveWithResponse(false);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedQuery) return;
    try {
      const updated = supportQueryService.setQueryStatus(selectedQuery.id, newStatus);
      setSelectedQuery(updated);
      showToast(`Ticket status updated to ${newStatus}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePriorityChange = (newPriority) => {
    if (!selectedQuery) return;
    try {
      const updated = supportQueryService.setQueryPriority(selectedQuery.id, newPriority);
      setSelectedQuery(updated);
      showToast(`Ticket priority updated to ${newPriority}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAssignAdmin = (adminId) => {
    if (!selectedQuery) return;
    try {
      const updated = supportQueryService.assignQuery(selectedQuery.id, adminId || null);
      setSelectedQuery(updated);
      showToast(
        adminId ? `Ticket assigned to ${updated.assignedAdminName}.` : 'Ticket unassigned.',
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!selectedQuery || !responseText.trim()) return;

    try {
      setIsSubmittingResponse(true);
      const activeAdmin = adminUsers[0] || { id: 'usr_admin_01', fullName: 'Administrator' };

      // 1. Add Response
      const updated = supportQueryService.addResponse(selectedQuery.id, {
        message: responseText.trim(),
        senderId: activeAdmin.id,
        senderName: activeAdmin.fullName,
        senderRole: 'admin'
      });

      // 2. If resolveWithResponse checked, mark Resolved
      if (resolveWithResponse) {
        const resolved = supportQueryService.setQueryStatus(
          selectedQuery.id,
          'Resolved',
          'Resolved with admin response note.'
        );
        setSelectedQuery(resolved);
      } else {
        setSelectedQuery(updated);
      }

      setResponseText('');
      setResolveWithResponse(false);
      showToast('Response successfully added to ticket history.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleDeleteQuery = () => {
    if (!queryToDelete) return;
    try {
      supportQueryService.deleteQuery(queryToDelete.id);
      showToast(`Ticket #${queryToDelete.ticketId} deleted.`, 'success');
      setQueryToDelete(null);
      if (selectedQuery && selectedQuery.id === queryToDelete.id) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Form Handlers
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setIsCreating(true);

    const validation = supportQueryService.validate(createForm);
    if (!validation.isValid) {
      setCreateErrors(validation.errors);
      setIsCreating(false);
      showToast(Object.values(validation.errors)[0], 'error');
      return;
    }

    try {
      const newQuery = supportQueryService.createQuery({
        ...createForm,
        source: 'Admin Desk'
      });
      showToast(`Support Ticket #${newQuery.ticketId} created successfully.`, 'success');
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        subject: '',
        category: 'Calculator Support',
        message: '',
        priority: 'Medium',
        status: 'Open',
        assignedAdminId: '',
        userId: ''
      });
      setCreateErrors({});
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1E2A35]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] border border-orange-100 dark:border-orange-900/30 flex items-center justify-center shrink-0 shadow-2xs">
            <MessageSquare className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Support Queries
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/40">
                Phase 3B
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage student inquiries, calculation verification requests, and technical support tickets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] transition-colors cursor-pointer"
            title="Refresh tickets from storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => {
              setCreateErrors({});
              setIsCreateModalOpen(true);
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Queries */}
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Historical ticket registry
          </div>
        </div>

        {/* Open */}
        <div className="bg-white dark:bg-[#111418] border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Open Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.open}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Awaiting response
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-[#111418] border border-purple-200/60 dark:border-purple-900/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active investigations
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white dark:bg-[#111418] border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.resolved}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Solutions communicated
          </div>
        </div>

        {/* Urgent Attention */}
        <div className="bg-white dark:bg-[#111418] border border-rose-200/60 dark:border-rose-900/30 rounded-2xl p-4 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Urgent Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats.urgent}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Immediate attention
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
              placeholder="Search by ticket ID, requester, subject, or message..."
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
              <option value="all">All Statuses ({queries.length})</option>
              <option value="open">Open ({stats.open})</option>
              <option value="in progress">In Progress ({stats.inProgress})</option>
              <option value="resolved">Resolved ({stats.resolved})</option>
              <option value="closed">Closed ({stats.closed})</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
              <option value="updated">Sort: Last Updated</option>
            </select>
          </div>
        </div>

        {/* Secondary Category and Admin Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#1E2A35]/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Quick Category:</span>
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
            {QUERY_CATEGORIES.slice(0, 4).map((cat) => (
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
            <span>Showing {filteredQueries.length} of {queries.length} total tickets</span>
            {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                  setAdminFilter('all');
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
                <th className="py-3 px-4">Ticket & Status</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Subject & Topic</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Admin</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/60 text-xs text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                    <span>Loading support queries...</span>
                  </td>
                </tr>
              ) : paginatedQueries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No support tickets found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or adjusting filter settings.</p>
                  </td>
                </tr>
              ) : (
                paginatedQueries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#0D141F]/80 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {/* Ticket & Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          #{item.ticketId}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                    </td>

                    {/* Requester */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00] flex items-center justify-center font-bold text-xs shrink-0">
                          {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                              {item.fullName}
                            </span>
                            {item.userId && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                                title="Verified registered student"
                              >
                                <GraduationCap className="w-3 h-3" />
                                Student
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{item.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div>
                        <span className="inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mb-0.5">
                          {item.category || 'General'}
                        </span>
                        <p className="font-medium text-slate-900 dark:text-white truncate">{item.subject}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.message}</p>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </td>

                    {/* Assigned Admin */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {item.assignedAdminName ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          <Shield className="w-3 h-3 text-[#FF6B00]" />
                          <span>{item.assignedAdminName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const admin = adminUsers[0];
                            if (admin) handleAssignAdmin(admin.id);
                          }}
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-[#FF6B00] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      )}
                    </td>

                    {/* Submitted Date & Responses */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.responses?.length ? `${item.responses.length} response${item.responses.length === 1 ? '' : 's'}` : 'No responses'}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#FF6B00] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                          title="View Ticket Details and Thread"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setQueryToDelete(item)}
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Ticket"
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
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                type="button"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-white dark:bg-[#111418] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Detail & Thread Interaction Modal */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      #{selectedQuery.ticketId}
                    </span>
                    {getStatusBadge(selectedQuery.status)}
                    {getPriorityBadge(selectedQuery.priority)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Logged {formatDate(selectedQuery.createdAt)} • Source: {selectedQuery.source || 'Public Form'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2A35] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Linked Requester Details */}
              <div className="bg-slate-50 dark:bg-[#0D141F] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-500/10 text-[#FF6B00] font-bold text-base flex items-center justify-center shrink-0">
                      {selectedQuery.fullName ? selectedQuery.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {selectedQuery.fullName}
                        </h4>
                        {selectedQuery.userSummary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
                            <GraduationCap className="w-3 h-3" />
                            Registered Student
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedQuery.email}</p>
                    </div>
                  </div>

                  {selectedQuery.userSummary && (
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400 sm:border-l sm:border-slate-200 dark:sm:border-[#1E2A35] sm:pl-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedQuery.userSummary.university || 'Enrolled University'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {selectedQuery.userSummary.course || 'Degree Program'}
                        {selectedQuery.userSummary.hallTicketNumber ? ` • HT: ${selectedQuery.userSummary.hallTicketNumber}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Management Controls (Status, Priority, Assign) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/20 rounded-2xl">
                {/* Status Switcher */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Ticket Status
                  </label>
                  <select
                    value={selectedQuery.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                  >
                    {QUERY_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Switcher */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedQuery.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                  >
                    {QUERY_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Admin Switcher */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Assigned Admin
                  </label>
                  <select
                    value={selectedQuery.assignedAdminId || ''}
                    onChange={(e) => handleAssignAdmin(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Query Original Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Original Message</span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Category: {selectedQuery.category || selectedQuery.subject}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-[#1E2A35] text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
                    {selectedQuery.subject}
                  </h4>
                  <p className="whitespace-pre-line">{selectedQuery.message}</p>
                </div>
              </div>

              {/* Resolution Note if Present */}
              {selectedQuery.resolutionDetails && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolution Note</span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    {selectedQuery.resolutionDetails}
                  </p>
                </div>
              )}

              {/* Response Conversation Thread */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#1E2A35] pb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Interaction History ({selectedQuery.responses?.length || 0})
                  </span>
                  <span className="text-[11px] text-slate-400">Threaded responses</span>
                </div>

                {(!selectedQuery.responses || selectedQuery.responses.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No admin responses logged yet. Write the first response below.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedQuery.responses.map((resp) => {
                      const isAdmin = resp.senderRole === 'admin';
                      return (
                        <div
                          key={resp.id}
                          className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                            isAdmin
                              ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/30 ml-4'
                              : 'bg-slate-50 dark:bg-[#161B22] border-slate-200 dark:border-[#1E2A35] mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              {isAdmin ? (
                                <Shield className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span>{resp.senderName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({resp.senderRole})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatRelativeTime(resp.timestamp)}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {resp.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Response Box */}
              <form onSubmit={handleSendResponse} className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-[#1E2A35]">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Write Admin Response / Communication
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type an official reply to the student regarding regulations, calculation formula, or account support..."
                  rows={3}
                  className="w-full p-3 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00] transition-all"
                  required
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resolveWithResponse}
                      onChange={(e) => setResolveWithResponse(e.target.checked)}
                      className="rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <span>Mark query as Resolved upon sending</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingResponse || !responseText.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Official Response</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Create New Support Ticket Modal */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00] flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Log New Support Ticket
                  </h3>
                  <p className="text-xs text-slate-400">Record a student request from phone or admin desk</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Optional Link to Student User */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link to Registered Student (Optional)
                </label>
                <select
                  value={createForm.userId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const student = allStudents.find((s) => s.id === selectedId);
                    if (student) {
                      setCreateForm((prev) => ({
                        ...prev,
                        userId: student.id,
                        fullName: student.fullName,
                        email: student.email
                      }));
                    } else {
                      setCreateForm((prev) => ({ ...prev, userId: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="">-- None (Guest / Public Student) --</option>
                  {allStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Requester Full Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    required
                  />
                  {createErrors.fullName && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{createErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="student@university.edu"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    required
                  />
                  {createErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{createErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic Category *
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {QUERY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {QUERY_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ticket Subject / Title *
                </label>
                <input
                  type="text"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  placeholder="e.g. SGPA discrepancy in Semester 4 CBCS conversion"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  required
                />
                {createErrors.subject && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{createErrors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Query Description *
                </label>
                <textarea
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  placeholder="Provide complete details regarding the student's request or calculation question..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  required
                />
                {createErrors.message && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{createErrors.message}</p>
                )}
              </div>

              {/* Assign Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign To Admin (Optional)
                </label>
                <select
                  value={createForm.assignedAdminId}
                  onChange={(e) => setCreateForm({ ...createForm, assignedAdminId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E2A35] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                >
                  {isCreating ? 'Creating Ticket...' : 'Create Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {queryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Delete Support Ticket?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to permanently delete Ticket{' '}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  #{queryToDelete.ticketId}
                </span>{' '}
                from &quot;{queryToDelete.fullName}&quot;?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQueryToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E2A35] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuery}
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
