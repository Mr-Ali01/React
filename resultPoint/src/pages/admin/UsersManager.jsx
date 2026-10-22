import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  Shield,
  ShieldAlert,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userService } from '../../services/userService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { useToast } from '../../context/ToastContext';

export default function UsersManager() {
  const { showToast } = useToast();

  const [users, setUsers] = useState(() => userService.getAllUsers());
  const [catalog, setCatalog] = useState(() => academicCatalogService.getCatalog());

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [univFilter, setUnivFilter] = useState('all');
  const [sortBy, setSortBy] = useState('joinedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Active user selection for Edit / Delete / Status
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteRefCheck, setDeleteRefCheck] = useState(null);

  // Form states for Create User
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    status: 'Active',
    universityId: '',
    courseId: '',
    regulationId: '',
    currentSemester: 1,
    hallTicketNumber: '',
    batch: '',
    phoneNumber: '',
    dob: '',
    gender: 'Male'
  });
  const [createError, setCreateError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states for Edit User
  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    email: '',
    role: 'student',
    status: 'Active',
    universityId: '',
    courseId: '',
    regulationId: '',
    currentSemester: 1,
    hallTicketNumber: '',
    batch: '',
    phoneNumber: '',
    dob: '',
    gender: 'Male',
    password: ''
  });
  const [editError, setEditError] = useState('');

  // Status Change state
  const [targetStatus, setTargetStatus] = useState('Active');
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState('');

  // Live synchronization with storage and user events
  const refreshUsers = () => {
    setUsers(userService.getAllUsers());
  };

  useEffect(() => {
    window.addEventListener('rp_users_updated', refreshUsers);
    window.addEventListener('storage', refreshUsers);
    window.addEventListener('focus', refreshUsers);

    return () => {
      window.removeEventListener('rp_users_updated', refreshUsers);
      window.removeEventListener('storage', refreshUsers);
      window.removeEventListener('focus', refreshUsers);
    };
  }, []);

  // Sync catalog updates
  useEffect(() => {
    const handleCatalogUpdate = () => {
      setCatalog(academicCatalogService.getCatalog());
    };
    window.addEventListener('rp_catalog_updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('rp_catalog_updated', handleCatalogUpdate);
    };
  }, []);

  // Universities list for dropdowns
  const universitiesList = useMemo(() => {
    return academicCatalogService.getUniversities() || [];
  }, [catalog]);

  // Cascading courses for create form
  const createCourses = useMemo(() => {
    if (!newUser.universityId) return [];
    const univ = academicCatalogService.getUniversityById(newUser.universityId);
    return univ?.courses || [];
  }, [newUser.universityId, catalog]);

  // Cascading regulations for create form
  const createRegulations = useMemo(() => {
    if (!newUser.universityId || !newUser.courseId) return [];
    const course = academicCatalogService.getCourse(newUser.universityId, newUser.courseId);
    return course?.regulations || [];
  }, [newUser.universityId, newUser.courseId, catalog]);

  // Cascading courses for edit form
  const editCourses = useMemo(() => {
    if (!editForm.universityId) return [];
    const univ = academicCatalogService.getUniversityById(editForm.universityId);
    return univ?.courses || [];
  }, [editForm.universityId, catalog]);

  // Cascading regulations for edit form
  const editRegulations = useMemo(() => {
    if (!editForm.universityId || !editForm.courseId) return [];
    const course = academicCatalogService.getCourse(editForm.universityId, editForm.courseId);
    return course?.regulations || [];
  }, [editForm.universityId, editForm.courseId, catalog]);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return userService.getAllUsers({
      search: searchTerm,
      role: roleFilter,
      status: statusFilter,
      universityId: univFilter,
      sortBy,
      sortOrder
    });
  }, [users, searchTerm, roleFilter, statusFilter, univFilter, sortBy, sortOrder]);

  // Summary counts
  const summaryStats = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => u.role === 'student').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const active = users.filter((u) => (u.status || 'Active').toLowerCase() === 'active').length;
    return { total, students, admins, active };
  }, [users]);

  // Paginated records
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, univFilter, pageSize]);

  // Handlers for Create User
  const handleOpenCreateModal = () => {
    setNewUser({
      fullName: '',
      email: '',
      password: '',
      role: 'student',
      status: 'Active',
      universityId: universitiesList[0]?.id || '',
      courseId: universitiesList[0]?.courses?.[0]?.id || '',
      regulationId: universitiesList[0]?.courses?.[0]?.regulations?.[0]?.id || '',
      currentSemester: 1,
      hallTicketNumber: '',
      batch: '2025-2027',
      phoneNumber: '',
      dob: '',
      gender: 'Male'
    });
    setCreateError('');
    setShowPassword(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setCreateError('');

    try {
      userService.createUser(newUser);
      showToast(`User account created successfully for ${newUser.fullName}`);
      setIsCreateModalOpen(false);
      refreshUsers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create user account.');
    }
  };

  // Handlers for Edit User
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'student',
      status: user.status || 'Active',
      universityId: user.universityId || '',
      courseId: user.courseId || '',
      regulationId: user.regulationId || '',
      currentSemester: user.currentSemester || 1,
      hallTicketNumber: user.hallTicketNumber || '',
      batch: user.batch || '',
      phoneNumber: user.phoneNumber || '',
      dob: user.dob || '',
      gender: user.gender || 'Male',
      password: ''
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditError('');

    try {
      userService.updateUser(editForm.id, editForm);
      showToast(`Updated profile for ${editForm.fullName}`);
      setIsEditModalOpen(false);
      refreshUsers();
    } catch (err) {
      setEditError(err.message || 'Failed to update user profile.');
    }
  };

  // Handlers for Status Change
  const handleOpenStatusModal = (user) => {
    setSelectedUser(user);
    setTargetStatus(user.status || 'Active');
    setStatusReason('');
    setStatusError('');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    setStatusError('');

    try {
      userService.setUserStatus(selectedUser.id, targetStatus, statusReason);
      showToast(`Account status for ${selectedUser.fullName} updated to ${targetStatus}`);
      setIsStatusModalOpen(false);
      refreshUsers();
    } catch (err) {
      setStatusError(err.message || 'Failed to update account status.');
    }
  };

  // Handlers for Delete / Deactivate
  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    const check = userService.checkUserReferences(user.id);
    setDeleteRefCheck(check);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    try {
      userService.deleteUser(selectedUser.id);
      showToast(`Permanently deleted user "${selectedUser.fullName}"`);
      setIsDeleteModalOpen(false);
      refreshUsers();
    } catch (err) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  const handleSwitchToDeactivate = () => {
    if (!selectedUser) return;
    try {
      userService.deactivateUser(selectedUser.id, 'Deactivated via guarded delete check');
      showToast(`User "${selectedUser.fullName}" deactivated safely. Academic records preserved.`);
      setIsDeleteModalOpen(false);
      refreshUsers();
    } catch (err) {
      showToast(err.message || 'Deactivation failed', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setUnivFilter('all');
    setSortBy('joinedDate');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1E2A35]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] border border-orange-100 dark:border-orange-900/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Users Management
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                Phase 3A
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage student accounts, credentials, academic profiles, verification statuses, and account lifecycles.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Row of Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{summaryStats.total}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">All registered accounts</div>
        </div>

        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Students</span>
            <GraduationCap className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{summaryStats.students}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Undergraduate & Postgraduate</div>
        </div>

        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Users</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.active}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Permitted platform access</div>
        </div>

        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Administrators</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{summaryStats.admins}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Staff & platform owners</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or hall ticket..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="md:col-span-2 relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* University Filter */}
          <div className="md:col-span-2 relative">
            <select
              value={univFilter}
              onChange={(e) => setUnivFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
            >
              <option value="all">All Universities</option>
              {universitiesList.map((u) => (
                <option key={u.id} value={u.id}>{u.shortName || u.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Sort By Filter */}
          <div className="md:col-span-2 flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
              >
                <option value="joinedDate">Joined Date</option>
                <option value="fullName">Full Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="status">Status</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Toggle sort order (current: ${sortOrder})`}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {/* Filter Badges and Reset */}
        {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || univFilter !== 'all') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]/60 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Active Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] text-[11px] font-medium border border-orange-200/40">
                Query: "{searchTerm}"
              </span>
            )}
            {roleFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[11px] font-medium border border-purple-200/40">
                Role: {roleFilter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200/40">
                Status: {statusFilter}
              </span>
            )}
            {univFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-medium border border-blue-200/40">
                Univ: {univFilter}
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6B00] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      {/* Users Data Table */}
      <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-[#0D141F] border-b border-slate-200/80 dark:border-[#1E2A35] text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Academic Affiliation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/60 font-medium">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#0D141F] flex items-center justify-center text-slate-400">
                      <Users className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No users match the specified criteria
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Try adjusting your search query, status, or role filter.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FF6B00] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isStudent = user.role === 'student';
                  const isPrimaryAdmin = user.id === 'usr_admin_01';

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  );
                  if (user.status === 'Inactive') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Inactive
                      </span>
                    );
                  } else if (user.status === 'Suspended') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Suspended
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#0D141F]/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-semibold">
                        {globalIdx}
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isStudent
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                          }`}>
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {user.fullName}
                              </span>
                              {isPrimaryAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                          isStudent
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/40'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/40'
                        }`}>
                          {isStudent ? <GraduationCap className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          <span className="capitalize">{user.role}</span>
                        </span>
                      </td>

                      {/* Academic Affiliation */}
                      <td className="py-3 px-4">
                        {isStudent ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {user.university || 'General Student'}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                              {user.course ? `${user.course} • Sem ${user.currentSemester || 1}` : 'No course bound'}
                            </div>
                            {user.hallTicketNumber && (
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                HT: {user.hallTicketNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                            ResultPoint Administration
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {statusBadge}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {user.joinedDate || 'Standard Seed'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            title="Edit user profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-[#0D141F] dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Status Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(user)}
                            title="Change account status"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:text-slate-400 dark:hover:text-orange-400 transition-colors cursor-pointer"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(user)}
                            title="Delete or de-activate user"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#1E2A35] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredUsers.length)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900 dark:text-white">{filteredUsers.length}</span>
            <span>users</span>

            <div className="ml-4 flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-slate-900 dark:text-white text-xs cursor-pointer font-medium"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#0D141F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-xs text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-semibold text-slate-700 dark:text-slate-300 text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E2A35] hover:bg-slate-50 dark:hover:bg-[#0D141F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-xs text-slate-700 dark:text-slate-300"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: CREATE USER                                         */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Create New User Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Register a new student or administrator profile into the platform.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. john.doe@university.edu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <div className="relative">
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newUser.phoneNumber}
                    onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Student Academic Section */}
              {newUser.role === 'student' && (
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E2A35] space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                    <GraduationCap className="w-4 h-4 text-[#FF6B00]" />
                    <span>Academic Affiliation (Optional / Catalog Binding)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        University
                      </label>
                      <div className="relative">
                        <select
                          value={newUser.universityId}
                          onChange={(e) => setNewUser({ ...newUser, universityId: e.target.value, courseId: '', regulationId: '' })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
                        >
                          <option value="">None / Unassigned</option>
                          {universitiesList.map((u) => (
                            <option key={u.id} value={u.id}>{u.name || u.shortName}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Course
                      </label>
                      <div className="relative">
                        <select
                          value={newUser.courseId}
                          disabled={!newUser.universityId}
                          onChange={(e) => setNewUser({ ...newUser, courseId: e.target.value, regulationId: '' })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium disabled:opacity-40"
                        >
                          <option value="">Select Course</option>
                          {createCourses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Regulation
                      </label>
                      <div className="relative">
                        <select
                          value={newUser.regulationId}
                          disabled={!newUser.courseId}
                          onChange={(e) => setNewUser({ ...newUser, regulationId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium disabled:opacity-40"
                        >
                          <option value="">Select Regulation</option>
                          {createRegulations.map((r) => (
                            <option key={r.id} value={r.id}>{r.name || r.code}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hall Ticket / Roll No
                      </label>
                      <input
                        type="text"
                        value={newUser.hallTicketNumber}
                        onChange={(e) => setNewUser({ ...newUser, hallTicketNumber: e.target.value })}
                        placeholder="e.g. 21071A0501"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Semester
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={newUser.currentSemester}
                        onChange={(e) => setNewUser({ ...newUser, currentSemester: Number(e.target.value) || 1 })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Batch
                      </label>
                      <input
                        type="text"
                        value={newUser.batch}
                        onChange={(e) => setNewUser({ ...newUser, batch: e.target.value })}
                        placeholder="e.g. 2024-2028"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT USER                                           */}
      {/* ============================================================ */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <Edit2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit User Profile
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modifying user ID: <code className="font-mono text-[#FF6B00]">{selectedUser.id}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.role}
                      disabled={selectedUser.id === 'usr_admin_01'}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium disabled:opacity-50"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      disabled={selectedUser.id === 'usr_admin_01'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium disabled:opacity-50"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to preserve current"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Academic Details for Student */}
              {editForm.role === 'student' && (
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E2A35] space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                    <GraduationCap className="w-4 h-4 text-[#FF6B00]" />
                    <span>Academic Configuration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        University
                      </label>
                      <div className="relative">
                        <select
                          value={editForm.universityId}
                          onChange={(e) => setEditForm({ ...editForm, universityId: e.target.value, courseId: '', regulationId: '' })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium"
                        >
                          <option value="">None / Unassigned</option>
                          {universitiesList.map((u) => (
                            <option key={u.id} value={u.id}>{u.name || u.shortName}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Course
                      </label>
                      <div className="relative">
                        <select
                          value={editForm.courseId}
                          disabled={!editForm.universityId}
                          onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value, regulationId: '' })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium disabled:opacity-40"
                        >
                          <option value="">Select Course</option>
                          {editCourses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Regulation
                      </label>
                      <div className="relative">
                        <select
                          value={editForm.regulationId}
                          disabled={!editForm.courseId}
                          onChange={(e) => setEditForm({ ...editForm, regulationId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white appearance-none cursor-pointer pr-8 font-medium disabled:opacity-40"
                        >
                          <option value="">Select Regulation</option>
                          {editRegulations.map((r) => (
                            <option key={r.id} value={r.id}>{r.name || r.code}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hall Ticket / Roll No
                      </label>
                      <input
                        type="text"
                        value={editForm.hallTicketNumber}
                        onChange={(e) => setEditForm({ ...editForm, hallTicketNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Semester
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={editForm.currentSemester}
                        onChange={(e) => setEditForm({ ...editForm, currentSemester: Number(e.target.value) || 1 })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Batch
                      </label>
                      <input
                        type="text"
                        value={editForm.batch}
                        onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/70 dark:bg-[#0D141F] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1E2A35]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: STATUS CHANGE MODAL                                 */}
      {/* ============================================================ */}
      {isStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]">
              <div className="flex items-center gap-2">
                <Power className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Change Account Status
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400">
                {statusError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">User Account:</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {selectedUser.fullName} ({selectedUser.email})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select New Status
                </label>
                <div className="relative">
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-8"
                  >
                    <option value="Active">Active — Full Platform Access</option>
                    <option value="Inactive">Inactive — Account Deactivated</option>
                    <option value="Suspended">Suspended — Temporarily Blocked</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Status Change (Recorded in Audit History)
                </label>
                <textarea
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Completed degree, student transfer, administrative request..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50 dark:bg-[#0D141F] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {targetStatus !== 'Active' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    Setting this account to <strong>{targetStatus}</strong> will prevent the user from logging in. Existing results, calculation logs, and academic records remain safely preserved.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2A35] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0D141F] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-white bg-[#FF6B00] hover:bg-[#EA580C] shadow-sm transition-all"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: DELETE / DEACTIVATE MODAL                           */}
      {/* ============================================================ */}
      {isDeleteModalOpen && selectedUser && deleteRefCheck && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
              {deleteRefCheck.canDelete ? (
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {deleteRefCheck.canDelete ? 'Permanently Delete User?' : 'Deletion Blocked: Dependencies Detected'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                User: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.fullName}</span> ({selectedUser.email})
              </p>
            </div>

            {/* If Referenced / Protected */}
            {!deleteRefCheck.canDelete && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Referential Integrity Safeguard</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                    {deleteRefCheck.reason}
                  </p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0D141F] border border-slate-200/80 dark:border-[#1E2A35] p-3 rounded-2xl space-y-1.5">
                  <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                    Recommended Safe Alternative:
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deactivate this student account instead. Deactivation revokes login privileges while maintaining transcripts, audit trails, and semester results.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] transition-colors"
                  >
                    Cancel
                  </button>

                  {!deleteRefCheck.isPrimaryAdmin && (
                    <button
                      type="button"
                      onClick={handleSwitchToDeactivate}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all"
                    >
                      Deactivate User
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If Safe to Delete */}
            {deleteRefCheck.canDelete && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                  This user has no associated academic results, calculation records, or tracked dependencies. Are you sure you want to permanently delete this account?
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
