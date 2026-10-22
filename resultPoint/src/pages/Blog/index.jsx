import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Newspaper,
  Search,
  BookOpen,
  Clock,
  User,
  ThumbsUp,
  ArrowRight,
  Pin,
  Sparkles,
  Calendar,
  X,
  ChevronLeft
} from 'lucide-react';

import {
  blogService,
  BLOG_UPDATED_EVENT,
  BLOG_CATEGORIES
} from '../../services/blogService';
import { useToast } from '../../context/ToastContext';

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [articles, setArticles] = useState(() => {
    try {
      return blogService.getPublicArticles();
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Read URL query parameters for direct article lookup
  const articleSlug = searchParams.get('slug');

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setArticles(blogService.getPublicArticles());
      } catch (err) {
        console.warn('Failed to refresh public articles:', err);
      }
    };

    window.addEventListener(BLOG_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(BLOG_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Sync selected article with slug
  useEffect(() => {
    if (articleSlug) {
      const found = blogService.getArticleBySlug(articleSlug);
      // Strictly only allow reading if published
      if (found && (found.status || 'published').toLowerCase() === 'published') {
        setSelectedArticle(found);
        blogService.incrementViewCount(found.id);
      } else {
        setSelectedArticle(null);
      }
    } else {
      setSelectedArticle(null);
    }
  }, [articleSlug]);

  // Filtered public articles
  const filteredArticles = useMemo(() => {
    return blogService.getPublicArticles({
      search: searchTerm,
      category: selectedCategory
    });
  }, [searchTerm, selectedCategory, articles]);

  const handleOpenArticle = (art) => {
    setSearchParams({ slug: art.slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSearchParams({});
    setSelectedArticle(null);
  };

  const handleLike = (e, artId) => {
    e.stopPropagation();
    blogService.incrementLikeCount(artId);
    showToast('Thank you for your feedback!', 'success');
    setArticles(blogService.getPublicArticles());
    if (selectedArticle && selectedArticle.id === artId) {
      setSelectedArticle({
        ...selectedArticle,
        likeCount: (selectedArticle.likeCount || 0) + 1
      });
    }
  };

  // Safe markdown paragraph renderer
  const renderSafeMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-4 text-text-h text-sm sm:text-base leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-2xl sm:text-3xl font-black text-text-h pt-4 pb-2 border-b border-border">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-xl sm:text-2xl font-bold text-text-h pt-4">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-semibold text-accent pt-2">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-text-m">
                {line.replace('- ', '')}
              </li>
            );
          }
          if (line.startsWith('```') || line.endsWith('```')) {
            return null;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
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
    <div className="min-h-screen bg-bg text-text-h transition-colors pb-16">
      {/* Hero Header */}
      <div className="relative border-b border-border bg-gradient-to-b from-bg-sec/80 to-bg py-12 px-4 sm:px-6 lg:px-8 overflow-hidden text-left">
        <div className="max-w-5xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent-soft text-accent border border-accent/20">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Academic Knowledge & Editorial Guides</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text-h">
            ResultPoint Academic Articles
          </h1>
          <p className="text-sm sm:text-base text-text-m max-w-3xl leading-relaxed">
            In-depth guides on SGPA & CGPA calculation methodologies, conversion ordinances across Osmania University and JNTU Hyderabad, backlog strategies, and official grading policies.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {selectedArticle ? (
          /* Single Article Reader View */
          <div className="space-y-6 text-left">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to all articles</span>
            </button>

            {/* Header Card */}
            <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-accent bg-accent-soft border border-accent/20 uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-text-light flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedArticle.readTime}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-h tracking-tight leading-tight">
                {selectedArticle.title}
              </h1>

              {/* Author & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60 text-xs text-text-m">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-text-h block">{selectedArticle.author}</strong>
                    <span className="text-text-light text-[11px]">{selectedArticle.authorRole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => handleLike(e, selectedArticle.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-bg-sec text-text-m transition-colors text-xs"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                    <span>Helpful ({selectedArticle.likeCount || 0})</span>
                  </button>
                </div>
              </div>

              {selectedArticle.featuredImage && (
                <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-border mt-4">
                  <img
                    src={selectedArticle.featuredImage}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Article Content */}
            <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
              {renderSafeMarkdown(selectedArticle.content)}
            </div>
          </div>
        ) : (
          /* Articles List View */
          <div className="space-y-6 text-left">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search articles & guides..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-bg text-text-h placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Categories */}
              <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap font-medium ${
                    selectedCategory === 'all'
                      ? 'bg-accent text-white font-bold'
                      : 'bg-bg text-text-m hover:text-text-h border border-border'
                  }`}
                >
                  All
                </button>
                {BLOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap font-medium ${
                      selectedCategory === cat
                        ? 'bg-accent text-white font-bold'
                        : 'bg-bg text-text-m hover:text-text-h border border-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleOpenArticle(art)}
                    className="rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-accent bg-accent-soft border border-accent/20 uppercase tracking-wider">
                          {art.category}
                        </span>
                        <span className="text-[11px] text-text-light flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{art.readTime}</span>
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-text-h group-hover:text-accent transition-colors leading-snug">
                        {art.title}
                      </h2>

                      <p className="text-xs text-text-m line-clamp-3 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-light">
                      <div className="flex items-center gap-2">
                        <span>By {art.author}</span>
                      </div>

                      <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Read article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-card border border-border p-12 text-center text-text-light">
                <Newspaper className="w-8 h-8 mx-auto mb-2 text-text-light/50" />
                <p className="text-sm font-semibold text-text-h">No articles match your search query</p>
                <p className="text-xs text-text-m mt-1">Try resetting your keywords or category filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
