import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Newspaper,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Tag,
  Pin,
  Sparkles,
  X,
  FileText,
  Users,
  Building2,
  Calendar,
  ThumbsUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

import {
  blogService,
  BLOG_UPDATED_EVENT,
  BLOG_CATEGORIES,
  BLOG_STATUSES,
  isValidImageUrl,
  estimateReadTime
} from '../../services/blogService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { useToast } from '../../context/ToastContext';

export default function BlogsManager() {
  const { showToast } = useToast();

  // State
  const [articles, setArticles] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
    totalLikes: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form State
  const initialFormState = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Calculations & Formulas',
    tagsString: '',
    author: 'ResultPoint Academic Editorial',
    authorRole: 'Academic Advisory Board',
    featuredImage: '',
    status: 'published',
    targetAudience: 'all',
    universityId: '',
    courseId: '',
    regulation: '',
    isPinned: false,
    isFeatured: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'

  // Data Loading
  const loadData = useCallback(() => {
    try {
      const all = blogService.getAllArticles();
      setArticles(all);
      setStats(blogService.getBlogStats());

      const unis = academicCatalogService.getUniversities() || [];
      setUniversities(unis);
    } catch (err) {
      console.error('Failed to load blog articles:', err);
      showToast('Error loading articles.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(BLOG_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(BLOG_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Filtered List
  const filteredArticles = useMemo(() => {
    return blogService.getAllArticles({
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      sortBy
    });
  }, [searchTerm, categoryFilter, statusFilter, sortBy, articles]);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArticles.slice(start, start + itemsPerPage);
  }, [filteredArticles, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, sortBy]);

  // Open Create
  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setFormData(initialFormState);
    setFormErrors({});
    setActiveTab('edit');
    setIsEditorModalOpen(true);
  };

  // Open Edit
  const handleOpenEditModal = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.category || 'Calculations & Formulas',
      tagsString: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      author: article.author || 'ResultPoint Academic Editorial',
      authorRole: article.authorRole || 'Academic Advisory Board',
      featuredImage: article.featuredImage || '',
      status: article.status || 'published',
      targetAudience: article.targetAudience || 'all',
      universityId: article.universityId || '',
      courseId: article.courseId || '',
      regulation: article.regulation || '',
      isPinned: Boolean(article.isPinned),
      isFeatured: Boolean(article.isFeatured)
    });
    setFormErrors({});
    setActiveTab('edit');
    setIsEditorModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Article title is required.';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    } else if (formData.title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters.';
    }

    if (!formData.excerpt || !formData.excerpt.trim()) {
      errors.excerpt = 'Short excerpt summary is required.';
    } else if (formData.excerpt.trim().length > 300) {
      errors.excerpt = 'Excerpt cannot exceed 300 characters.';
    }

    if (!formData.content || !formData.content.trim()) {
      errors.content = 'Article body content is required.';
    }

    if (!formData.category) {
      errors.category = 'Please select a category.';
    }

    if (formData.featuredImage && formData.featuredImage.trim()) {
      if (!isValidImageUrl(formData.featuredImage)) {
        errors.featuredImage = 'Must be a valid HTTP or HTTPS image URL without script expressions.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
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
        slug: formData.slug ? formData.slug.trim() : '',
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: parsedTags,
        author: formData.author ? formData.author.trim() : 'ResultPoint Academic Editorial',
        authorRole: formData.authorRole ? formData.authorRole.trim() : 'Academic Advisory Board',
        featuredImage: formData.featuredImage ? formData.featuredImage.trim() : null,
        status: formData.status,
        targetAudience: formData.targetAudience,
        universityId: formData.universityId || null,
        courseId: formData.courseId ? formData.courseId.trim() : null,
        regulation: formData.regulation ? formData.regulation.trim() : null,
        isPinned: formData.isPinned,
        isFeatured: formData.isFeatured
      };

      if (editingArticle) {
        blogService.updateArticle(editingArticle.id, payload);
        showToast(`Article "${payload.title}" updated successfully!`, 'success');
      } else {
        blogService.createArticle(payload);
        showToast(`New article "${payload.title}" published successfully!`, 'success');
      }

      setIsEditorModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change
  const handleStatusChange = (article, newStatus) => {
    try {
      blogService.setArticleStatus(article.id, newStatus);
      showToast(`Article "${article.title}" marked as ${newStatus}.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  // Delete
  const handleConfirmDelete = () => {
    if (!articleToDelete) return;
    try {
      blogService.deleteArticle(articleToDelete.id, true);
      showToast(`Article "${articleToDelete.title}" deleted.`, 'success');
      setArticleToDelete(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete article.', 'error');
    }
  };

  // Reset Defaults
  const handleConfirmReset = () => {
    try {
      blogService.resetToDefaults();
      showToast('Restored baseline academic articles.', 'success');
      setIsResetModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Reset failed.', 'error');
    }
  };

  // Render markdown paragraphs safely without innerHTML
  const renderSafeMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-3 text-text-h text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl sm:text-2xl font-black text-text-h pt-2 pb-1 border-b border-border">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-base sm:text-lg font-bold text-text-h pt-2">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm sm:text-base font-semibold text-accent pt-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-text-m">
                {line.replace('- ', '')}
              </li>
            );
          }
          if (line.startsWith('```') || line.endsWith('```')) {
            return null;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-text-m">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/15">
              <Newspaper className="w-3.5 h-3.5 text-accent" />
              <span>Phase 3G: Editorial & Content Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Blog & Article Management
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Publish university calculation guides, grading policy breakdowns, student study tips, and academic performance advisories across Osmania University and JNTU Hyderabad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold backdrop-blur-md border border-white/10 transition-all flex items-center gap-2"
              title="Restore standard sample articles"
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
              <span>Write Article</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Articles */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2 text-left">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Total Articles</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Newspaper className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-h">
            {stats.total}
          </div>
          <p className="text-xs text-text-m">
            Across {Object.keys(stats.categoryBreakdown || {}).length} editorial categories
          </p>
        </div>

        {/* Published */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2 text-left">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Published & Live</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.published}
          </div>
          <p className="text-xs text-text-m">
            Accessible on public student site
          </p>
        </div>

        {/* Drafts */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2 text-left">
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
            Hidden from public readers
          </p>
        </div>

        {/* Archived */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-2 text-left">
          <div className="flex items-center justify-between text-text-light">
            <span className="text-xs font-bold uppercase tracking-wider">Archived Content</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {stats.archived}
          </div>
          <p className="text-xs text-text-m">
            Safely retained for reference
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3 text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, slug, excerpt, author, tags..."
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
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Categories</option>
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
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
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Status Count Line */}
        <div className="flex items-center justify-between text-[11px] text-text-light pt-1 border-t border-border/50">
          <span>
            Showing <strong className="text-text-h">{filteredArticles.length}</strong> of {articles.length} articles
          </span>
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="text-accent hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-bg-sec/50 border-b border-border text-text-light font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-3">Category & Read Time</th>
                <th className="py-3.5 px-3">Author</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Engagement</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedArticles.length > 0 ? (
                paginatedArticles.map((art) => {
                  const isPublished = (art.status || 'published').toLowerCase() === 'published';
                  const isDraft = (art.status || '').toLowerCase() === 'draft';
                  const isArchived = (art.status || '').toLowerCase() === 'archived';

                  return (
                    <tr key={art.id} className="hover:bg-bg-sec/30 transition-colors group">
                      {/* Title & Excerpt */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {art.isPinned && (
                              <span className="p-0.5 rounded bg-accent-soft text-accent" title="Pinned article">
                                <Pin className="w-3 h-3 rotate-45" />
                              </span>
                            )}
                            <span
                              className="font-bold text-text-h text-xs sm:text-[13px] hover:text-accent cursor-pointer"
                              onClick={() => setPreviewArticle(art)}
                            >
                              {art.title}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-text-m line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5 text-[10.5px] text-text-light">
                            <span className="font-mono text-text-light/70">/{art.slug}</span>
                            {art.universityName && art.universityName !== 'General' && (
                              <span>• {art.universityName}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Read Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-accent-soft text-accent border border-accent/20">
                            <BookOpen className="w-3 h-3" />
                            <span>{art.category}</span>
                          </span>
                          <div className="text-[11px] text-text-light flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{art.readTime || '5 min read'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <strong className="text-text-h text-[11.5px] block">{art.author}</strong>
                          <span className="text-[10.5px] text-text-light block">{art.authorRole}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
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
                          <span className="text-[10.5px] text-text-light block capitalize">
                            Audience: {art.targetAudience || 'all'}
                          </span>
                        </div>
                      </td>

                      {/* Engagement */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1 text-[11px] text-text-m">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-text-light" />
                            <span>{art.viewCount || 0} views</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-light">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{art.likeCount || 0} likes</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewArticle(art)}
                            className="p-1.5 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
                            title="Preview Article"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(art)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                            title="Edit Article"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(art, 'archived')}
                              className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-500/10 transition-colors"
                              title="Archive Article"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(art, 'published')}
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              title="Publish Article"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setArticleToDelete(art)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Article"
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
                    <Newspaper className="w-8 h-8 mx-auto mb-2 text-text-light/50" />
                    <p className="text-sm font-semibold text-text-h">No articles match your search criteria</p>
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
          <div className="w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-bg-sec/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-accent-soft text-accent">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text-h">
                    {editingArticle ? 'Edit Academic Article' : 'Write New Academic Article'}
                  </h2>
                  <p className="text-xs text-text-light">
                    {editingArticle ? `Editing: ${editingArticle.id}` : 'Compose guides, study strategies, and regulation advisories'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2">
                <div className="bg-bg p-1 rounded-xl border border-border flex items-center text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      activeTab === 'edit' ? 'bg-accent text-white' : 'text-text-m hover:text-text-h'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      activeTab === 'preview' ? 'bg-accent text-white' : 'text-text-m hover:text-text-h'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="p-2 rounded-xl text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {activeTab === 'edit' ? (
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="font-semibold text-text-h block mb-1">
                    Article Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Strategic Guide: How to Clear Engineering Backlogs"
                    className={`w-full px-3 py-2.5 rounded-xl border bg-bg text-text-h focus:outline-none focus:ring-2 ${
                      formErrors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                    }`}
                  />
                  {formErrors.title && <p className="text-red-500 text-[11px] mt-1">{formErrors.title}</p>}
                </div>

                {/* Slug & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      URL Slug (Auto-generated if empty)
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. how-to-clear-backlogs"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {BLOG_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="font-semibold text-text-h block mb-1">
                    Short Excerpt / Meta Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Provide a 1-2 sentence preview for search cards and social previews..."
                    className={`w-full px-3 py-2 rounded-xl border bg-bg text-text-h focus:outline-none focus:ring-2 ${
                      formErrors.excerpt ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                    }`}
                  />
                  {formErrors.excerpt && <p className="text-red-500 text-[11px] mt-1">{formErrors.excerpt}</p>}
                </div>

                {/* Article Body (Markdown) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-text-h block">
                      Article Body (Markdown Supported) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-text-light font-mono">
                      Estimated: {estimateReadTime(formData.content)}
                    </span>
                  </div>
                  <textarea
                    rows={9}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="# Main Heading&#10;&#10;Write your article paragraphs here...&#10;&#10;## Subheading&#10;- Key bullet point 1&#10;- Key bullet point 2"
                    className={`w-full px-3 py-2.5 rounded-xl border bg-bg text-text-h font-mono text-xs focus:outline-none focus:ring-2 ${
                      formErrors.content ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                    }`}
                  />
                  {formErrors.content && <p className="text-red-500 text-[11px] mt-1">{formErrors.content}</p>}
                </div>

                {/* Author Details & Featured Image */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Author Role / Title
                    </label>
                    <input
                      type="text"
                      value={formData.authorRole}
                      onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-text-h block mb-1">
                      Featured Image URL (HTTPS)
                    </label>
                    <input
                      type="url"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className={`w-full px-3 py-2 rounded-xl border bg-bg text-text-h focus:outline-none focus:ring-2 ${
                        formErrors.featuredImage ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-accent'
                      }`}
                    />
                    {formErrors.featuredImage && (
                      <p className="text-red-500 text-[11px] mt-1">{formErrors.featuredImage}</p>
                    )}
                  </div>
                </div>

                {/* Academic Context & Publication Settings */}
                <div className="pt-2 border-t border-border/70 space-y-3">
                  <h3 className="font-bold text-text-h text-xs uppercase tracking-wider text-accent">
                    Audience & Academic Scoping
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <option value="draft">Draft (Private editorial)</option>
                        <option value="archived">Archived (Preserved)</option>
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

                    <div>
                      <label className="font-semibold text-text-h block mb-1">
                        University Scope (Optional)
                      </label>
                      <select
                        value={formData.universityId}
                        onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">General / All Institutions</option>
                        {universities.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.shortName})
                          </option>
                        ))}
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
                      placeholder="e.g. CGPA, JNTUH, Backlogs, Study Tips"
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
                      <span>Pin to top of blog directory</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-text-h font-medium">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded text-accent focus:ring-accent"
                      />
                      <span>Feature in article carousel</span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
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
                    {isSubmitting ? 'Saving...' : editingArticle ? 'Save Changes' : 'Publish Article'}
                  </button>
                </div>
              </form>
            ) : (
              /* Preview Tab */
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{formData.category}</span>
                  </span>
                  <h1 className="text-2xl font-black text-text-h">
                    {formData.title || 'Untitled Article Preview'}
                  </h1>
                  <p className="text-xs text-text-m italic border-l-2 border-accent pl-3">
                    {formData.excerpt || 'Excerpt preview will appear here...'}
                  </p>
                </div>

                {formData.featuredImage && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-border">
                    <img
                      src={formData.featuredImage}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  {renderSafeMarkdown(formData.content || '*No content written yet.*')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Article Reader Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl p-6 overflow-y-auto space-y-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{previewArticle.category}</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-text-h pt-1">
                  {previewArticle.title}
                </h2>
                <div className="flex items-center gap-3 text-[11px] text-text-light pt-1">
                  <span>By {previewArticle.author} ({previewArticle.authorRole})</span>
                  <span>• {previewArticle.readTime}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 rounded-xl text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewArticle.featuredImage && (
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-border">
                <img
                  src={previewArticle.featuredImage}
                  alt={previewArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-bg-sec/50 border border-border/60 text-xs italic text-text-m">
              {previewArticle.excerpt}
            </div>

            <div className="pt-2">
              {renderSafeMarkdown(previewArticle.content)}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-text-light">
              <div className="flex items-center gap-2">
                <span className="capitalize font-semibold text-emerald-500">{previewArticle.status}</span>
                <span>• /{previewArticle.slug}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="px-5 py-2 rounded-xl bg-accent text-white font-bold text-xs"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 rounded-2xl bg-red-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Delete Academic Article</h3>
                <p className="text-xs text-text-light">This removes the publication record</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-text-h">"{articleToDelete.title}"</strong>? To preserve historical study bookmarks and student links, consider <strong>Archiving</strong> instead.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(articleToDelete, 'archived');
                  setArticleToDelete(null);
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
                <h3 className="text-base font-bold text-text-h">Restore Baseline Articles</h3>
                <p className="text-xs text-text-light">Reset editorial content catalog</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              This will restore standard baseline guides (including SGPA/CGPA formulas and OU/JNTUH policies) while preserving a full audit trail.
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
