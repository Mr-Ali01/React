import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Home,
  ChevronRight,
  Calculator,
  ShieldCheck,
  Award,
  Filter
} from 'lucide-react';

const INFO_ARTICLES = [
  {
    id: 'ou-bca-mca-scale',
    title: 'Osmania University BCA & MCA S-Grade 10-Point Scale',
    university: 'Osmania University',
    universityId: 'osmania',
    category: 'Letter Grades & Scales',
    isVerifiedOfficial: true,
    officialReference: 'Osmania University CBCS Curriculum & Examination Regulations for BCA/MCA',
    summary: 'Detailed explanation of the Osmania University S-grade scheme where Grade S stands for "Super" and awards 10 Grade Points.',
    details: [
      'Under Osmania University BCA and MCA regulations, the top 10-point grade tier is officially designated as Grade S (Super), awarding exactly 10 Grade Points for marks ≥ 85%.',
      'This contrasts with standard UGC guidelines that use Grade O (Outstanding). ResultPoint strictly maintains this official distinction for Osmania University candidates.',
      'Tier scale: Grade S (10 pts, Super), Grade A (9 pts, Excellent), Grade B (8 pts, Very Good), Grade C (7 pts, Good), Grade D (6 pts, Fair), Grade E (5 pts, Pass), Grade F (0 pts, Fail).'
    ],
    calculatorLink: '/calculators/cgpa'
  },
  {
    id: 'jntuh-percentage-formula',
    title: 'JNTU Hyderabad (JNTUH) R18/R22 Percentage Conversion Rule',
    university: 'JNTU Hyderabad',
    universityId: 'jntuh',
    category: 'Percentage Conversion',
    isVerifiedOfficial: true,
    officialReference: 'JNTUH Academic Regulations R18/R22 Section 10.4',
    summary: 'Official formula: Percentage = (CGPA - 0.5) * 10 for converting JNTUH cumulative grade points into aggregate percentage.',
    details: [
      'Unlike simple multiplier systems (CGPA × 10), JNTUH formally subtracts 0.5 before multiplying by 10.',
      'Example: For a CGPA of 8.25, JNTUH percentage is (8.25 - 0.5) × 10 = 77.50%.',
      'For a CGPA of 7.00, JNTUH percentage is (7.00 - 0.5) × 10 = 65.00%.',
      'Passing criteria: Minimum 35% in end-semester external exam and 40% aggregate in (Internal + External) combined.'
    ],
    calculatorLink: '/calculators/percentage'
  },
  {
    id: 'sgpa-calculation-formula',
    title: 'Standard SGPA Formula & Course Credit Weighting',
    university: 'All Universities (UGC / AICTE)',
    universityId: 'all',
    category: 'SGPA & CGPA Formulas',
    isVerifiedOfficial: true,
    officialReference: 'UGC Choice Based Credit System (CBCS) Implementation Guidelines',
    summary: 'Semester Grade Point Average (SGPA) is computed as the credit-weighted sum of grade points divided by total registered credits.',
    details: [
      'Mathematical Formula: SGPA = Σ(C_i × G_i) / Σ(C_i), where C_i is course credits and G_i is grade points earned.',
      'Courses with Grade F award 0 grade points, lowering the SGPA while remaining in the denominator of total registered credits.',
      'Audit and non-credit mandatory courses do not affect the SGPA numerator or denominator.'
    ],
    calculatorLink: '/calculators/sgpa'
  },
  {
    id: 'cgpa-calculation-formula',
    title: 'Cumulative Grade Point Average (CGPA) Aggregation',
    university: 'All Universities (UGC / AICTE)',
    universityId: 'all',
    category: 'SGPA & CGPA Formulas',
    isVerifiedOfficial: true,
    officialReference: 'AICTE Examination Reforms Policy & CBCS Guidelines',
    summary: 'CGPA represents the cumulative credit-weighted average across all completed semesters from term 1 to graduation.',
    details: [
      'Formula: CGPA = Σ(Semester_SGPA_i × Semester_Credits_i) / Σ(Semester_Credits_i).',
      'A simple unweighted average of semester SGPAs is mathematically inaccurate if semesters have varying credit totals (e.g. 20 credits in Sem 1 vs 24 credits in Sem 4).',
      'Always use total degree credits to ensure exact transcript alignment.'
    ],
    calculatorLink: '/tools/sgpa-to-cgpa'
  },
  {
    id: 'aicte-percentage-formula',
    title: 'AICTE Standard CGPA to Percentage Formula',
    university: 'AICTE Approved Colleges',
    universityId: 'aicte',
    category: 'Percentage Conversion',
    isVerifiedOfficial: true,
    officialReference: 'AICTE Approval Process Handbook (Section on Equivalence of CGPA)',
    summary: 'Official AICTE conversion: Percentage = (CGPA - 0.75) * 10 for AICTE-affiliated engineering & technical programs.',
    details: [
      'For institutions governed directly by AICTE guidelines without a university-specific override formula: Percentage = (CGPA - 0.75) × 10.',
      'Example: For 8.00 CGPA, AICTE percentage = (8.00 - 0.75) × 10 = 72.50%.',
      'Example: For 9.00 CGPA, AICTE percentage = (9.00 - 0.75) × 10 = 82.50%.'
    ],
    calculatorLink: '/calculators/percentage'
  },
  {
    id: 'degree-division-criteria',
    title: 'Academic Divisions: Distinction, First Class, and Second Class',
    university: 'All Universities (UGC / AICTE)',
    universityId: 'all',
    category: 'Honours & Division',
    isVerifiedOfficial: false,
    officialReference: 'Standard Indian Higher Education Conventions (Subject to Institutional Handbook)',
    summary: 'General criteria for First Class with Distinction (≥ 7.5 or 8.0 CGPA), First Class (≥ 6.5 CGPA), and Second Class (≥ 5.5 CGPA).',
    details: [
      'First Class with Distinction: Typically awarded to students achieving CGPA ≥ 7.50 (or ≥ 8.00 in select universities) who cleared all courses in the first attempt without backlogs.',
      'First Class: Awarded to candidates securing CGPA ≥ 6.50 but less than Distinction threshold.',
      'Second Class: Awarded to candidates securing CGPA ≥ 5.50 but less than 6.50.',
      'Always consult your specific university examination branch for honours eligibility and attempts limits.'
    ],
    calculatorLink: '/calculators/target-cgpa'
  },
  {
    id: 'backlog-impact-rules',
    title: 'Backlog Grading and CGPA Impact',
    university: 'All Universities (UGC / AICTE)',
    universityId: 'all',
    category: 'Backlogs & Revaluation',
    isVerifiedOfficial: false,
    officialReference: 'General CBCS Carry-Forward Guidelines',
    summary: 'How failing grades (F) penalize cumulative grade points and how supplementary exam clearance recovers your CGPA.',
    details: [
      'When you fail a subject, 0 points are assigned, but subject credits remain in the total credit denominator, reducing your SGPA and CGPA.',
      'Upon clearing the subject in supplementary examinations, the new passing grade points replace the 0 in the calculation.',
      'Some universities cap the highest awarded grade in supplementary exams or record a separate attempt mark on the transcript.'
    ],
    calculatorLink: '/calculators/backlog'
  }
];

const CATEGORIES = [
  'All Topics',
  'SGPA & CGPA Formulas',
  'Letter Grades & Scales',
  'Percentage Conversion',
  'Backlogs & Revaluation',
  'Honours & Division'
];

export default function CGPAInfoFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedUni, setSelectedUni] = useState('all');
  const [expandedId, setExpandedId] = useState('ou-bca-mca-scale');

  const filteredArticles = useMemo(() => {
    return INFO_ARTICLES.filter((art) => {
      // University filter
      if (selectedUni !== 'all' && art.universityId !== 'all' && art.universityId !== selectedUni) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All Topics' && art.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = art.title.toLowerCase().includes(q);
        const inSummary = art.summary.toLowerCase().includes(q);
        const inDetails = art.details.some((d) => d.toLowerCase().includes(q));
        const inUni = art.university.toLowerCase().includes(q);
        return inTitle || inSummary || inDetails || inUni;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedUni]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-start">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li>
              <Link to="/calculators" className="hover:text-accent transition-colors">Calculators & Tools</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">CGPA Information Finder</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Academic Regulations & Knowledge Base</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              CGPA & Grading Regulations Finder
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Search verified university academic regulations, official SGPA/CGPA formulas, grade point scales, and percentage conversion rules.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search regulations, formulas, JNTUH, Osmania S-grade..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#222E3C] bg-slate-50 dark:bg-[#161B22] text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-accent"
              />
            </div>

            {/* University & Category Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              {/* University Selector */}
              <select
                value={selectedUni}
                onChange={(e) => setSelectedUni(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">All Universities</option>
                <option value="jntuh">JNTU Hyderabad (JNTUH)</option>
                <option value="osmania">Osmania University (OU)</option>
                <option value="aicte">AICTE Standard</option>
              </select>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-[#161B22] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {filteredArticles.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No regulations found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No reference articles match your search query. Try broadening your keywords or resetting filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Topics');
                    setSelectedUni('all');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-bold mt-2"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isExpanded = expandedId === art.id;

                return (
                  <div
                    key={art.id}
                    className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl shadow-sm transition-all overflow-hidden"
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(art.id)}
                      className="w-full p-4 sm:p-5 flex items-start justify-between text-left gap-4 hover:bg-slate-50/50 dark:hover:bg-[#161B22]/50 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {art.university}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-accent">
                            {art.category}
                          </span>
                          {art.isVerifiedOfficial ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Official Rule
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              General Guideline
                            </span>
                          )}
                        </div>

                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {art.title}
                        </h2>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                          {art.summary}
                        </p>
                      </div>

                      <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="px-4 pb-5 sm:px-5 pt-2 border-t border-slate-100 dark:border-[#1E2A35] space-y-4">
                        <div className="space-y-2 pt-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Regulation Details & Mathematical Proof:
                          </h3>
                          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed list-disc list-inside">
                            {art.details.map((d, idx) => (
                              <li key={idx}>{d}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Citation Reference */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>Official Source Reference:</strong> {art.officialReference}
                        </div>

                        {/* Action Link to Calculator */}
                        <div className="flex items-center justify-between pt-1">
                          <Link
                            to={art.calculatorLink}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Launch Calculator for this Regulation</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Callout */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200">Have an unlisted university rule?</div>
            <p className="text-[11px] leading-relaxed">
              If your university or autonomous college follows a specific custom grading scale or percentage formula, you can configure it directly inside the ResultPoint Academic Catalog Manager or submit a rule request to the platform administrators.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
