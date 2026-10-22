/**
 * ResultPoint Blog & Content Management Service
 *
 * Canonical administrative service and data authority for academic articles,
 * calculation methodology guides, study tips, and university regulation advisories.
 *
 * Architecture Highlights:
 * - Single canonical storage key: STORAGE_KEYS.BLOGS ('resultpoint_blogs')
 * - Idempotent initialization and schema normalization
 * - Slug generation with automatic collision avoidance
 * - Strict URL protocol validation (HTTP/HTTPS only; blocks javascript:, data:, eval)
 * - XSS defenses & safe text parsing
 * - Event-driven reactivity: emits 'rp_blogs_updated'
 * - Audit history logging via auditHistoryService
 * - Public visibility enforcement: drafts and archived articles strictly hidden from public listings
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { auditHistoryService } from './auditHistoryService.js';
import { academicCatalogService } from './academicCatalogService.js';

export const BLOG_UPDATED_EVENT = 'rp_blogs_updated';
export const BLOG_STATUSES = ['published', 'draft', 'archived'];
export const BLOG_CATEGORIES = [
  'Calculations & Formulas',
  'Academic Guides',
  'University Policies',
  'Student Tips',
  'Exam Preparation',
  'Placements & Careers'
];

// Baseline seed articles
export const BASELINE_ARTICLES = [
  {
    id: 'art_01_sgpa_cgpa_guide',
    slug: 'understanding-sgpa-and-cgpa-calculation',
    title: 'Understanding SGPA and CGPA Calculation: Complete Academic Guide',
    excerpt: 'A comprehensive breakdown of credit-weighted SGPA, semester grade points, and cumulative CGPA formulas with step-by-step examples.',
    content: `# Understanding SGPA and CGPA Calculation

Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) are the foundational evaluation metrics across modern Choice Based Credit System (CBCS) universities.

## 1. What is SGPA?
SGPA measures a student's academic performance in a specific semester. It is computed as the credit-weighted sum of grade points earned divided by the total semester credits registered:

\`\`\`
SGPA = Σ (Course Credits × Grade Points) / Σ (Course Credits)
\`\`\`

## 2. What is CGPA?
CGPA represents your aggregate performance across all completed semesters:

\`\`\`
CGPA = Σ (All Semester Credits × SGPA) / Σ (Total Registered Credits)
\`\`\`

## 3. Practical Example
If you registered for 5 courses in Semester 1:
- Mathematics (4 credits) - Grade O (10 pts) = 40
- Data Structures (4 credits) - Grade A+ (9 pts) = 36
- Digital Electronics (3 credits) - Grade A (8 pts) = 24
- Environmental Science (2 credits) - Grade B+ (7 pts) = 14
- Programming Lab (2 credits) - Grade O (10 pts) = 20

Total Grade Points Earned = 134  
Total Registered Credits = 15  
**SGPA = 134 / 15 = 8.93**

Keep this reference in mind while planning your academic targets!`,
    category: 'Calculations & Formulas',
    tags: ['SGPA', 'CGPA', 'Calculations', 'CBCS', 'Formulas'],
    author: 'ResultPoint Academic Editorial',
    authorRole: 'Academic Advisory Board',
    featuredImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    readTime: '5 min read',
    isPinned: true,
    isFeatured: true,
    viewCount: 342,
    likeCount: 88,
    targetAudience: 'all',
    universityId: null,
    universityName: 'General',
    courseId: null,
    regulation: null,
    publishedAt: '2026-10-15T10:00:00.000Z',
    archivedAt: null,
    createdAt: '2026-10-15T09:30:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    createdBy: 'Administrator'
  },
  {
    id: 'art_02_cgpa_percentage_conversion',
    slug: 'how-to-convert-cgpa-to-percentage-ou-jntuh',
    title: 'How to Convert CGPA to Percentage Across OU and JNTUH',
    excerpt: 'Official formula breakdown for Osmania University (CGPA × 10 for MCA/BCA, × 9.32 for CBCS) and JNTU Hyderabad ((CGPA - 0.5) × 10).',
    content: `# How to Convert CGPA to Percentage Across OU and JNTUH

Students frequently need their official percentage equivalent for government examinations, UPSC, SSC, and corporate job drives.

## 1. Jawaharlal Nehru Technological University Hyderabad (JNTUH)
Under JNTUH academic council regulations (including R18 and R22):

\`\`\`
Equivalent Percentage (%) = (CGPA - 0.5) × 10
\`\`\`

**Example:** If your JNTUH CGPA is 8.25:
- Percentage = (8.25 - 0.5) × 10 = 7.75 × 10 = **77.50%**

## 2. Osmania University (OU)
Osmania University applies program-specific ordinances:
- **MCA and BCA Programs:** Standard Linear Formula: \`Percentage = CGPA × 10\`
- **General Undergraduate CBCS:** Standard Linear Formula: \`Percentage = CGPA × 9.32\`

Always check your official marks transcript or institutional notification before submitting academic forms.`,
    category: 'Calculations & Formulas',
    tags: ['CGPA to Percentage', 'OU', 'JNTUH', 'Conversion', 'Rules'],
    author: 'ResultPoint Academic Editorial',
    authorRole: 'Senior Academic Advisor',
    featuredImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    readTime: '4 min read',
    isPinned: true,
    isFeatured: true,
    viewCount: 295,
    likeCount: 74,
    targetAudience: 'all',
    universityId: 'jntuh',
    universityName: 'JNTUH & OU',
    courseId: null,
    regulation: 'R18 / R22 / CBCS',
    publishedAt: '2026-10-10T08:00:00.000Z',
    archivedAt: null,
    createdAt: '2026-10-10T07:45:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
    createdBy: 'Administrator'
  },
  {
    id: 'art_03_jntuh_r18_grading_guide',
    slug: 'jntuh-r18-grading-system-and-regulations',
    title: 'JNTU Hyderabad Grading System (R18 & R22 Regulations)',
    excerpt: 'Complete guide to understand the grading system, grade points, SGPA, and credit progression rules for JNTU Hyderabad.',
    content: `# JNTU Hyderabad Grading System (R18 & R22 Regulations)

JNTU Hyderabad evaluates students on an absolute grading 10-point scale:

| Marks Range | Grade | Description | Grade Points |
|-------------|-------|-------------|--------------|
| ≥ 90% | O | Outstanding | 10 |
| 80% - 89% | A+ | Excellent | 9 |
| 70% - 79% | A | Very Good | 8 |
| 60% - 69% | B+ | Good | 7 |
| 50% - 59% | B | Average | 6 |
| 40% - 49% | C | Pass | 5 |
| < 40% | F | Fail / Backlog | 0 |

## Credit Detention & Promotion Thresholds
To be promoted from:
- **1st Year to 2nd Year:** Students must secure at least 50% of the total credits offered in the first year.
- **2nd Year to 3rd Year:** Students must earn at least 60% of the credits specified across Semesters 1 through 4.

Review your semester grade cards carefully to maintain continuous academic standing.`,
    category: 'University Policies',
    tags: ['JNTUH', 'Grading Scale', 'R18', 'R22', 'Promotion'],
    author: 'Prof. K. Ramanathan',
    authorRole: 'Curriculum Consultant',
    featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    readTime: '6 min read',
    isPinned: false,
    isFeatured: true,
    viewCount: 218,
    likeCount: 52,
    targetAudience: 'students',
    universityId: 'jntuh',
    universityName: 'JNTUH',
    courseId: 'btech-cse',
    regulation: 'R18',
    publishedAt: '2026-10-05T11:00:00.000Z',
    archivedAt: null,
    createdAt: '2026-10-05T10:15:00.000Z',
    updatedAt: '2026-10-05T11:00:00.000Z',
    createdBy: 'Administrator'
  },
  {
    id: 'art_04_clearing_backlogs_strategy',
    slug: 'strategic-guide-how-to-clear-backlogs',
    title: 'Strategic Guide: How to Clear Engineering & MCA Backlogs',
    excerpt: 'Actionable study frameworks, credit requirements, and examination planning to clear backlogs without falling behind in regular semesters.',
    content: `# Strategic Guide: How to Clear Engineering & MCA Backlogs

Experiencing a backlog can feel overwhelming, but structured planning turns the semester around.

## 1. Prioritize Core Prerequisites
Identify subjects that act as prerequisites for subsequent semesters (such as Mathematics, Data Structures, or Analog Circuits). Clearing these prevents cascading credit detentions.

## 2. Review Past Question Papers (PQPs)
Over 65% of semester university questions follow recurring structural patterns. Focus on:
- 5-year question trends
- High-yield modules carrying mandatory 15-mark questions
- Derivations and clean architectural diagrams

## 3. Form a Time-Block Study Routine
Dedicate an extra 90 minutes each evening specifically to backlog revision while keeping your regular semester assignments on track. Consistent daily effort beats last-minute cramming.`,
    category: 'Student Tips',
    tags: ['Backlogs', 'Study Tips', 'Strategy', 'Exams'],
    author: 'ResultPoint Student Advisory',
    authorRole: 'Academic Mentorship Group',
    featuredImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    readTime: '5 min read',
    isPinned: false,
    isFeatured: false,
    viewCount: 184,
    likeCount: 63,
    targetAudience: 'students',
    universityId: null,
    universityName: 'General',
    courseId: null,
    regulation: null,
    publishedAt: '2026-09-28T14:00:00.000Z',
    archivedAt: null,
    createdAt: '2026-09-28T13:00:00.000Z',
    updatedAt: '2026-09-28T14:00:00.000Z',
    createdBy: 'Administrator'
  },
  {
    id: 'art_05_ou_s_grade_distinction',
    slug: 'osmania-university-grading-s-grade-policy',
    title: 'Osmania University Grading Policy: The S-Grade Distinction',
    excerpt: 'Understanding the 10-point scale in Osmania University where Grade S represents Super (10 grade points) and Grade A represents Very Good.',
    content: `# Osmania University Grading Policy: The S-Grade Distinction

Osmania University follows a distinctive grade nomenclature that sets it apart from standard UGC grading.

## 1. The Grade S (Super) Tier
In Osmania University MCA and BCA programs, the top score tier (90% and above) is designated as:
- **Grade Symbol:** S
- **Qualitative Standing:** Super
- **Grade Points:** 10

Standard UGC guidelines use 'O' (Outstanding). ResultPoint honors this official OU ordinance directly without converting Grade S to Grade O.

## 2. Full OU Grade Spectrum
- Grade S (90-100%): 10 points
- Grade A (80-89%): 9 points
- Grade B (70-79%): 8 points
- Grade C (60-69%): 7 points
- Grade D (50-59%): 6 points
- Grade E (40-49%): 5 points
- Grade F (< 40%): 0 points (Fail)

Keep this in mind when calculating your semester GPA for Osmania examinations!`,
    category: 'University Policies',
    tags: ['Osmania', 'OU', 'S-Grade', 'Grading Scale', 'MCA', 'BCA'],
    author: 'ResultPoint Academic Editorial',
    authorRole: 'Curriculum Specialist',
    featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    readTime: '4 min read',
    isPinned: false,
    isFeatured: false,
    viewCount: 167,
    likeCount: 45,
    targetAudience: 'students',
    universityId: 'osmania-university',
    universityName: 'Osmania University',
    courseId: 'mca',
    regulation: 'CBCS / R22',
    publishedAt: '2026-09-20T09:00:00.000Z',
    archivedAt: null,
    createdAt: '2026-09-20T08:30:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z',
    createdBy: 'Administrator'
  }
];

// Helper: safe storage accessors
function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key ${key}:`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key ${key}:`, err);
  }
}

function dispatchBlogUpdated(action, article) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(BLOG_UPDATED_EVENT, {
          detail: { action, article, timestamp: new Date().toISOString() }
        })
      );
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.warn('Failed to dispatch blog update event:', err);
  }
}

/**
 * Validates external image URL strictly.
 * Only HTTP or HTTPS protocols allowed; blocks script execution, eval, data: schemes.
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.includes('<script') ||
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('vbscript:') ||
    lower.includes('eval(') ||
    lower.includes('onload=') ||
    lower.includes('onerror=')
  ) {
    return false;
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generates a clean URL slug from article title and resolves collisions
 */
export function generateSlug(title, existingArticles = [], currentArticleId = null) {
  if (!title || typeof title !== 'string') return `article-${Date.now()}`;

  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseSlug) baseSlug = `article-${Date.now()}`;

  let candidate = baseSlug;
  let counter = 1;

  while (
    existingArticles.some(
      (a) => a.slug === candidate && a.id !== currentArticleId
    )
  ) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidate;
}

/**
 * Estimates read time based on word count (~200 words per minute)
 */
export function estimateReadTime(content) {
  if (!content || typeof content !== 'string') return '1 min read';
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Normalizes article data to canonical schema
 */
function normalizeArticle(raw, index = 0) {
  const now = new Date(Date.now() - index * 86400000).toISOString();
  return {
    id: raw.id || `art_${Date.now()}_${index}`,
    slug: raw.slug || `article-${index}`,
    title: String(raw.title || '').trim(),
    excerpt: String(raw.excerpt || '').trim(),
    content: String(raw.content || '').trim(),
    category: raw.category || 'Academic Guides',
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    author: raw.author || 'ResultPoint Academic Editorial',
    authorRole: raw.authorRole || 'Academic Advisory Board',
    featuredImage: raw.featuredImage || null,
    status: raw.status || 'published',
    readTime: raw.readTime || estimateReadTime(raw.content),
    isPinned: Boolean(raw.isPinned),
    isFeatured: Boolean(raw.isFeatured),
    viewCount: typeof raw.viewCount === 'number' ? raw.viewCount : 150 + index * 25,
    likeCount: typeof raw.likeCount === 'number' ? raw.likeCount : 35 + index * 8,
    targetAudience: raw.targetAudience || 'all',
    universityId: raw.universityId || null,
    universityName: raw.universityName || 'General',
    courseId: raw.courseId || null,
    regulation: raw.regulation || null,
    scheduledPublishAt: raw.scheduledPublishAt || null,
    publishedAt: raw.publishedAt || now,
    archivedAt: raw.status === 'archived' ? now : null,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    createdBy: raw.createdBy || 'Administrator'
  };
}

export const blogService = {
  /**
   * Idempotent initialization of the blog store.
   * Preserves existing stored articles and migrates baseline if empty.
   */
  initialize() {
    const existing = safeGet(STORAGE_KEYS.BLOGS, null);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }

    const seeded = BASELINE_ARTICLES.map((a, i) => normalizeArticle(a, i));
    safeSet(STORAGE_KEYS.BLOGS, seeded);
    return seeded;
  },

  /**
   * Retrieve all articles with administrative filters and sorting
   */
  getAllArticles(options = {}) {
    const articles = this.initialize();
    const {
      search = '',
      category = 'all',
      status = 'all',
      universityId = 'all',
      audience = 'all',
      sortBy = 'latest'
    } = options;

    let filtered = [...articles];

    // Status filter
    if (status && status !== 'all') {
      filtered = filtered.filter((a) => (a.status || 'published').toLowerCase() === status.toLowerCase());
    }

    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    // University filter
    if (universityId && universityId !== 'all') {
      filtered = filtered.filter((a) => {
        if (!a.universityId) return universityId === 'general';
        return a.universityId.toLowerCase() === universityId.toLowerCase();
      });
    }

    // Audience filter
    if (audience && audience !== 'all') {
      filtered = filtered.filter((a) => (a.targetAudience || 'all').toLowerCase() === audience.toLowerCase());
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((a) => {
        const inTitle = (a.title || '').toLowerCase().includes(q);
        const inExcerpt = (a.excerpt || '').toLowerCase().includes(q);
        const inSlug = (a.slug || '').toLowerCase().includes(q);
        const inAuthor = (a.author || '').toLowerCase().includes(q);
        const inCat = (a.category || '').toLowerCase().includes(q);
        const inTags = Array.isArray(a.tags) && a.tags.some((t) => t.toLowerCase().includes(q));
        return inTitle || inExcerpt || inSlug || inAuthor || inCat || inTags;
      });
    }

    // Sorting
    if (sortBy === 'latest' || sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt) - new Date(a.publishedAt || a.updatedAt || a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt || a.publishedAt) - new Date(b.createdAt || b.publishedAt));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'likes') {
      filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }

    return filtered;
  },

  /**
   * Retrieve single article by ID
   */
  getArticleById(id) {
    if (!id) return null;
    const articles = this.initialize();
    return articles.find((a) => a.id === id) || null;
  },

  /**
   * Retrieve single article by URL slug
   */
  getArticleBySlug(slug) {
    if (!slug) return null;
    const articles = this.initialize();
    return articles.find((a) => a.slug === slug) || null;
  },

  /**
   * Public-facing article retrieval:
   * STRICTLY returns published articles only. Drafts and archived are excluded.
   */
  getPublicArticles(options = {}, userContext = null) {
    const articles = this.initialize();
    const {
      search = '',
      category = 'all',
      universityId = 'all',
      sortBy = 'latest'
    } = options;

    // 1. Strictly published articles only
    let published = articles.filter((a) => (a.status || 'published').toLowerCase() === 'published');

    // 2. Audience scoping
    if (userContext && typeof userContext === 'object') {
      const { role = 'student', universityId: userUni } = userContext;

      published = published.filter((a) => {
        const aud = (a.targetAudience || 'all').toLowerCase();
        if (role === 'student' && aud === 'faculty') return false;

        if (a.universityId && a.universityId !== 'all') {
          if (userUni && a.universityId.toLowerCase() !== userUni.toLowerCase()) {
            return false;
          }
        }
        return true;
      });
    } else {
      // Guest visitors only see 'all' or 'students' audience
      published = published.filter((a) => {
        const aud = (a.targetAudience || 'all').toLowerCase();
        return aud === 'all' || aud === 'students';
      });
    }

    // 3. Category filter
    if (category && category !== 'all') {
      published = published.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    // 4. University filter
    if (universityId && universityId !== 'all') {
      published = published.filter((a) => {
        if (!a.universityId) return universityId === 'general';
        return a.universityId.toLowerCase() === universityId.toLowerCase();
      });
    }

    // 5. Search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      published = published.filter((a) => {
        const inTitle = (a.title || '').toLowerCase().includes(q);
        const inExcerpt = (a.excerpt || '').toLowerCase().includes(q);
        const inAuthor = (a.author || '').toLowerCase().includes(q);
        const inCat = (a.category || '').toLowerCase().includes(q);
        const inTags = Array.isArray(a.tags) && a.tags.some((t) => t.toLowerCase().includes(q));
        return inTitle || inExcerpt || inAuthor || inCat || inTags;
      });
    }

    // 6. Sorting
    if (sortBy === 'latest') {
      published.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    } else if (sortBy === 'oldest') {
      published.sort((a, b) => new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt));
    } else if (sortBy === 'title') {
      published.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'views') {
      published.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return published;
  },

  /**
   * Create new article with validation, slug collision avoidance, and audit history
   */
  createArticle(data = {}) {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new Error('Article title is required.');
    }
    const trimmedTitle = data.title.trim();
    if (trimmedTitle.length < 3) {
      throw new Error('Article title must be at least 3 characters.');
    }
    if (trimmedTitle.length > 150) {
      throw new Error('Article title cannot exceed 150 characters.');
    }

    if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
      throw new Error('Article content is required.');
    }

    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      throw new Error('Article category is required.');
    }

    if (data.featuredImage && !isValidImageUrl(data.featuredImage)) {
      throw new Error('Invalid image URL. Must be a valid HTTP or HTTPS URL without executable script expressions.');
    }

    const status = data.status ? String(data.status).toLowerCase() : 'published';
    if (!BLOG_STATUSES.includes(status)) {
      throw new Error(`Invalid status "${data.status}". Allowed values: ${BLOG_STATUSES.join(', ')}.`);
    }

    const articles = this.initialize();

    // Unique Slug Generation
    const candidateSlug = data.slug && data.slug.trim()
      ? data.slug.trim().toLowerCase().replace(/[^\w-]/g, '')
      : trimmedTitle;
    const finalSlug = generateSlug(candidateSlug, articles);

    const newId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newArticle = {
      id: newId,
      slug: finalSlug,
      title: trimmedTitle,
      excerpt: data.excerpt ? data.excerpt.trim() : trimmedTitle.slice(0, 150),
      content: data.content.trim(),
      category: data.category.trim(),
      tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      author: data.author ? data.author.trim() : 'ResultPoint Academic Editorial',
      authorRole: data.authorRole ? data.authorRole.trim() : 'Academic Advisory Board',
      featuredImage: data.featuredImage ? data.featuredImage.trim() : null,
      status,
      readTime: estimateReadTime(data.content),
      isPinned: Boolean(data.isPinned),
      isFeatured: Boolean(data.isFeatured),
      viewCount: 0,
      likeCount: 0,
      targetAudience: data.targetAudience ? String(data.targetAudience).toLowerCase() : 'all',
      universityId: data.universityId || null,
      universityName: data.universityName || 'General',
      courseId: data.courseId || null,
      regulation: data.regulation || null,
      scheduledPublishAt: data.scheduledPublishAt || null,
      publishedAt: status === 'published' ? now : null,
      archivedAt: status === 'archived' ? now : null,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || 'Administrator'
    };

    const updatedArticles = [newArticle, ...articles];
    safeSet(STORAGE_KEYS.BLOGS, updatedArticles);

    // Audit history logging
    try {
      auditHistoryService.recordEvent({
        action: 'BLOG_CREATED',
        entityType: 'blog',
        entityId: newId,
        entityName: newArticle.title,
        details: `Created new academic article "${newArticle.title}" (slug: ${finalSlug}). Status: ${status}.`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchBlogUpdated('CREATE', newArticle);
    return newArticle;
  },

  /**
   * Update article details with immutable ID enforcement and slug collision checking
   */
  updateArticle(id, updateData = {}) {
    if (!id) throw new Error('Article ID is required.');

    const articles = this.initialize();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with ID "${id}" does not exist.`);
    }

    // Immutable ID check
    if (updateData.id && updateData.id !== id) {
      throw new Error('Article ID is immutable and cannot be modified.');
    }

    const existing = articles[idx];

    // Allowed fields
    const allowedFields = [
      'title',
      'slug',
      'excerpt',
      'content',
      'category',
      'tags',
      'author',
      'authorRole',
      'featuredImage',
      'status',
      'isPinned',
      'isFeatured',
      'targetAudience',
      'universityId',
      'universityName',
      'courseId',
      'regulation',
      'scheduledPublishAt',
      'viewCount',
      'likeCount'
    ];

    Object.keys(updateData).forEach((field) => {
      if (!allowedFields.includes(field) && field !== 'id') {
        throw new Error(`Unsupported field "${field}" for article.`);
      }
    });

    // Validate title if supplied
    if (updateData.title !== undefined) {
      if (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim()) {
        throw new Error('Article title cannot be empty.');
      }
      if (updateData.title.trim().length < 3) {
        throw new Error('Article title must be at least 3 characters.');
      }
      if (updateData.title.trim().length > 150) {
        throw new Error('Article title cannot exceed 150 characters.');
      }
    }

    // Validate content if supplied
    if (updateData.content !== undefined) {
      if (!updateData.content || typeof updateData.content !== 'string' || !updateData.content.trim()) {
        throw new Error('Article content cannot be empty.');
      }
    }

    // Validate image URL if supplied
    if (updateData.featuredImage !== undefined && updateData.featuredImage !== null && updateData.featuredImage !== '') {
      if (!isValidImageUrl(updateData.featuredImage)) {
        throw new Error('Invalid image URL. Must be a valid HTTP or HTTPS URL without executable script expressions.');
      }
    }

    // Validate status if supplied
    if (updateData.status !== undefined) {
      const normStatus = String(updateData.status).toLowerCase();
      if (!BLOG_STATUSES.includes(normStatus)) {
        throw new Error(`Invalid status "${updateData.status}". Allowed values: ${BLOG_STATUSES.join(', ')}.`);
      }
    }

    // Slug management: check collision or generate from new title
    let newSlug = existing.slug;
    if (updateData.slug && updateData.slug.trim()) {
      const candidate = updateData.slug.trim().toLowerCase().replace(/[^\w-]/g, '');
      newSlug = generateSlug(candidate, articles, id);
    } else if (updateData.title && updateData.title !== existing.title) {
      newSlug = generateSlug(updateData.title, articles, id);
    }

    const now = new Date().toISOString();
    const newStatus = updateData.status !== undefined ? String(updateData.status).toLowerCase() : existing.status;

    let publishedAt = existing.publishedAt;
    let archivedAt = existing.archivedAt;

    if (newStatus === 'published' && existing.status !== 'published') {
      publishedAt = now;
      archivedAt = null;
    } else if (newStatus === 'archived' && existing.status !== 'archived') {
      archivedAt = now;
    }

    const newContent = updateData.content !== undefined ? updateData.content.trim() : existing.content;

    const updatedArticle = {
      ...existing,
      slug: newSlug,
      title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
      excerpt: updateData.excerpt !== undefined ? updateData.excerpt.trim() : existing.excerpt,
      content: newContent,
      readTime: estimateReadTime(newContent),
      category: updateData.category !== undefined ? updateData.category.trim() : existing.category,
      tags: Array.isArray(updateData.tags) ? updateData.tags.map((t) => String(t).trim()).filter(Boolean) : existing.tags,
      author: updateData.author !== undefined ? updateData.author.trim() : existing.author,
      authorRole: updateData.authorRole !== undefined ? updateData.authorRole.trim() : existing.authorRole,
      featuredImage: updateData.featuredImage !== undefined ? (updateData.featuredImage ? updateData.featuredImage.trim() : null) : existing.featuredImage,
      status: newStatus,
      isPinned: updateData.isPinned !== undefined ? Boolean(updateData.isPinned) : existing.isPinned,
      isFeatured: updateData.isFeatured !== undefined ? Boolean(updateData.isFeatured) : existing.isFeatured,
      targetAudience: updateData.targetAudience !== undefined ? String(updateData.targetAudience).toLowerCase() : existing.targetAudience,
      universityId: updateData.universityId !== undefined ? updateData.universityId : existing.universityId,
      universityName: updateData.universityName || existing.universityName,
      courseId: updateData.courseId !== undefined ? updateData.courseId : existing.courseId,
      regulation: updateData.regulation !== undefined ? updateData.regulation : existing.regulation,
      scheduledPublishAt: updateData.scheduledPublishAt !== undefined ? updateData.scheduledPublishAt : existing.scheduledPublishAt,
      publishedAt,
      archivedAt,
      updatedAt: now
    };

    articles[idx] = updatedArticle;
    safeSet(STORAGE_KEYS.BLOGS, articles);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: 'BLOG_UPDATED',
        entityType: 'blog',
        entityId: id,
        entityName: updatedArticle.title,
        details: `Updated article "${updatedArticle.title}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchBlogUpdated('UPDATE', updatedArticle);
    return updatedArticle;
  },

  /**
   * Transition article status (published, draft, archived)
   */
  setArticleStatus(id, newStatus) {
    if (!id) throw new Error('Article ID is required.');
    const normalizedStatus = String(newStatus).toLowerCase();
    if (!BLOG_STATUSES.includes(normalizedStatus)) {
      throw new Error(`Invalid status "${newStatus}". Allowed values: ${BLOG_STATUSES.join(', ')}.`);
    }

    const articles = this.initialize();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with ID "${id}" does not exist.`);
    }

    const existing = articles[idx];
    if (existing.status === normalizedStatus) {
      return existing;
    }

    const now = new Date().toISOString();
    let publishedAt = existing.publishedAt;
    let archivedAt = existing.archivedAt;

    let auditAction = 'BLOG_STATUS_CHANGED';
    if (normalizedStatus === 'published') {
      publishedAt = now;
      archivedAt = null;
      auditAction = existing.status === 'archived' ? 'BLOG_RESTORED' : 'BLOG_PUBLISHED';
    } else if (normalizedStatus === 'archived') {
      archivedAt = now;
      auditAction = 'BLOG_ARCHIVED';
    }

    const updatedArticle = {
      ...existing,
      status: normalizedStatus,
      publishedAt,
      archivedAt,
      updatedAt: now
    };

    articles[idx] = updatedArticle;
    safeSet(STORAGE_KEYS.BLOGS, articles);

    try {
      auditHistoryService.recordEvent({
        action: auditAction,
        entityType: 'blog',
        entityId: id,
        entityName: updatedArticle.title,
        details: `Article "${updatedArticle.title}" status changed from "${existing.status}" to "${normalizedStatus}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchBlogUpdated(auditAction, updatedArticle);
    return updatedArticle;
  },

  /**
   * Check if an article can be safely deleted
   */
  canDeleteArticle(id) {
    if (!id) return { canDelete: false, reasons: ['Article ID is required'] };

    const articles = this.initialize();
    const existing = articles.find((a) => a.id === id);
    if (!existing) {
      return { canDelete: false, reasons: ['Article does not exist'] };
    }

    const reasons = [];

    // Core baseline check
    const isBaseline = BASELINE_ARTICLES.some((a) => a.id === id);
    if (isBaseline) {
      reasons.push('This is a baseline platform article. Archiving is recommended to preserve existing student bookmarks and external links.');
    }

    // Pinned check
    if (existing.isPinned) {
      reasons.push('This article is currently pinned to the top of the publication portal.');
    }

    const canDelete = reasons.length === 0;
    return {
      canDelete,
      reasons,
      message: canDelete
        ? 'Article can be safely deleted.'
        : `Cannot permanently delete: ${reasons.join(' ')}`
    };
  },

  /**
   * Delete article with safety guard
   */
  deleteArticle(id, force = false) {
    if (!id) throw new Error('Article ID is required.');

    const articles = this.initialize();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with ID "${id}" does not exist.`);
    }

    const target = articles[idx];

    if (!force) {
      const check = this.canDeleteArticle(id);
      if (!check.canDelete) {
        throw new Error(check.message);
      }
    }

    const deletedArticle = articles.splice(idx, 1)[0];
    safeSet(STORAGE_KEYS.BLOGS, articles);

    try {
      auditHistoryService.recordEvent({
        action: 'BLOG_DELETED',
        entityType: 'blog',
        entityId: id,
        entityName: deletedArticle.title,
        details: `Permanently deleted article "${deletedArticle.title}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchBlogUpdated('DELETE', deletedArticle);
    return deletedArticle;
  },

  /**
   * Safely increment view count
   */
  incrementViewCount(id) {
    if (!id) return;
    const articles = this.initialize();
    const target = articles.find((a) => a.id === id);
    if (target) {
      target.viewCount = (target.viewCount || 0) + 1;
      safeSet(STORAGE_KEYS.BLOGS, articles);
    }
  },

  /**
   * Safely increment like count
   */
  incrementLikeCount(id) {
    if (!id) return;
    const articles = this.initialize();
    const target = articles.find((a) => a.id === id);
    if (target) {
      target.likeCount = (target.likeCount || 0) + 1;
      safeSet(STORAGE_KEYS.BLOGS, articles);
    }
  },

  /**
   * Aggregate statistics for administrative dashboard and KPI cards
   */
  getBlogStats() {
    const articles = this.initialize();
    const total = articles.length;
    const published = articles.filter((a) => (a.status || 'published').toLowerCase() === 'published').length;
    const draft = articles.filter((a) => (a.status || '').toLowerCase() === 'draft').length;
    const archived = articles.filter((a) => (a.status || '').toLowerCase() === 'archived').length;

    const totalViews = articles.reduce((acc, a) => acc + (a.viewCount || 0), 0);
    const totalLikes = articles.reduce((acc, a) => acc + (a.likeCount || 0), 0);

    const categoryBreakdown = {};
    articles.forEach((a) => {
      const cat = a.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    return {
      total,
      published,
      draft,
      archived,
      totalViews,
      totalLikes,
      categoryBreakdown
    };
  },

  /**
   * Safe factory reset of the blog catalog
   */
  resetToDefaults() {
    const freshSeeded = BASELINE_ARTICLES.map((a, i) => normalizeArticle(a, i));
    safeSet(STORAGE_KEYS.BLOGS, freshSeeded);

    try {
      auditHistoryService.recordEvent({
        action: 'BLOG_REGISTRY_RESET',
        entityType: 'blog',
        entityId: 'all_articles',
        entityName: 'Blog Catalog',
        details: 'Restored academic articles catalog to factory baseline defaults.',
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchBlogUpdated('RESET', null);
    return freshSeeded;
  }
};

// Auto-initialize on module import
blogService.initialize();
