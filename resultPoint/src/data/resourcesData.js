/**
 * ResultPoint Academic Resources Data Authority
 * 
 * Central configuration of study materials, previous papers, syllabi,
 * university guides, and academic result calculation guides.
 * Data-driven architecture supporting Osmania University (OU),
 * JNTU Hyderabad (JNTUH), and general academic resources.
 */

export const RESOURCE_CATEGORIES = [
  {
    id: 'all',
    name: 'All Resources',
    subtitle: 'Browse all resources',
    icon: 'Grid'
  },
  {
    id: 'previous-papers',
    name: 'Previous Papers',
    subtitle: 'Question papers',
    icon: 'FileText'
  },
  {
    id: 'study-materials',
    name: 'Study Materials',
    subtitle: 'Notes and learning',
    icon: 'BookOpen'
  },
  {
    id: 'syllabus-regulations',
    name: 'Syllabus & Regulations',
    subtitle: 'Official documents',
    icon: 'ShieldCheck'
  },
  {
    id: 'university-guides',
    name: 'University Guides',
    subtitle: 'University specific',
    icon: 'GraduationCap'
  },
  {
    id: 'result-guides',
    name: 'Result Guides',
    subtitle: 'SGPA, CGPA and more',
    icon: 'BarChart2'
  }
];

export const FEATURED_RESOURCE_CARDS = [
  {
    id: 'feat-previous-papers',
    title: 'Previous Papers',
    description: 'Find semester-wise question papers for OU and JNTUH.',
    categoryKey: 'previous-papers',
    ctaText: 'Explore Papers',
    iconColor: 'text-accent',
    bgIconColor: 'bg-orange-500/15 border-orange-500/30'
  },
  {
    id: 'feat-study-materials',
    title: 'Study Materials',
    description: 'Subject-wise notes, important topics and learning resources.',
    categoryKey: 'study-materials',
    ctaText: 'Explore Materials',
    iconColor: 'text-brandBlue',
    bgIconColor: 'bg-blue-500/15 border-blue-500/30'
  },
  {
    id: 'feat-syllabus-regulations',
    title: 'Syllabus & Regulations',
    description: 'Official syllabi and academic regulations for your course.',
    categoryKey: 'syllabus-regulations',
    ctaText: 'Browse Documents',
    iconColor: 'text-brandPurple',
    bgIconColor: 'bg-purple-500/15 border-purple-500/30'
  },
  {
    id: 'feat-result-guides',
    title: 'Result & Calculation Guides',
    description: 'Understand SGPA, CGPA, grading system and more.',
    categoryKey: 'result-guides',
    ctaText: 'Read Guides',
    iconColor: 'text-brandGreen',
    bgIconColor: 'bg-emerald-500/15 border-emerald-500/30'
  }
];

export const RESOURCES_DATA = [
  {
    id: 'jntuh-r18-syllabus-cse',
    title: 'JNTUH R18 Syllabus (Computer Science)',
    description: 'Official course structure, semester subjects, and syllabus for B.Tech Computer Science & Engineering under R18 regulation.',
    category: 'syllabus-regulations',
    categoryLabel: 'Syllabus',
    resourceType: 'pdf',
    universityId: 'jntuh',
    universityName: 'JNTUH',
    courseId: 'btech-cse',
    regulation: 'R18',
    semester: 'All Semesters',
    subject: 'Computer Science & Engineering',
    fileUrl: 'https://jntuh.ac.in/academics',
    fileType: 'PDF Document',
    publishedAt: 'Oct 20, 2026',
    updatedAt: '2026-10-20',
    tags: ['JNTUH', 'Syllabus', 'B.Tech', 'CSE', 'R18'],
    status: 'published',
    iconTheme: 'red'
  },
  {
    id: 'ou-mca-previous-papers-sem1',
    title: 'OU MCA Previous Papers (Semester 1)',
    description: 'Archive of previous examination question papers for Osmania University MCA Semester 1 including Discrete Maths and Data Structures.',
    category: 'previous-papers',
    categoryLabel: 'Previous Paper',
    resourceType: 'pdf',
    universityId: 'osmania-university',
    universityName: 'OU',
    courseId: 'mca',
    regulation: 'R22',
    semester: 'Semester 1',
    subject: 'MCA Core Courses',
    fileUrl: 'https://www.osmania.ac.in',
    fileType: 'PDF Document',
    publishedAt: 'Oct 18, 2026',
    updatedAt: '2026-10-18',
    tags: ['OU', 'MCA', 'Previous Papers', 'Semester 1', 'R22'],
    status: 'published',
    iconTheme: 'blue'
  },
  {
    id: 'understanding-sgpa-and-cgpa-calculation',
    title: 'Understanding SGPA and CGPA Calculation',
    description: 'Complete academic guide explaining credit-weighted SGPA and CGPA calculation formulas with step-by-step examples.',
    category: 'result-guides',
    categoryLabel: 'Guide',
    resourceType: 'article',
    universityId: null,
    universityName: 'General',
    courseId: null,
    regulation: null,
    semester: null,
    subject: 'Calculation Methodology',
    fileUrl: null,
    detailRoute: '/resources/resource-details',
    fileType: '5 min read',
    publishedAt: 'Oct 15, 2026',
    updatedAt: '2026-10-15',
    tags: ['SGPA', 'CGPA', 'Calculations', 'Formulas', 'Guide'],
    status: 'published',
    iconTheme: 'green'
  },
  {
    id: 'jntuh-academic-regulations-r22',
    title: 'JNTUH Academic Regulations (R22)',
    description: 'Official academic regulations, evaluation norms, credit matrices, and degree requirements for JNTU Hyderabad R22 batches.',
    category: 'syllabus-regulations',
    categoryLabel: 'Regulations',
    resourceType: 'pdf',
    universityId: 'jntuh',
    universityName: 'JNTUH',
    courseId: 'btech',
    regulation: 'R22',
    semester: 'All Semesters',
    subject: 'Academic Ordinances',
    fileUrl: 'https://jntuh.ac.in/academics',
    fileType: 'PDF Document',
    publishedAt: 'Oct 12, 2026',
    updatedAt: '2026-10-12',
    tags: ['JNTUH', 'Regulations', 'R22', 'B.Tech'],
    status: 'published',
    iconTheme: 'purple'
  },
  {
    id: 'how-to-convert-cgpa-to-percentage',
    title: 'How to Convert CGPA to Percentage',
    description: 'Comprehensive guide covering verified percentage conversion formulas for OU (CGPA × 10 for MCA/BCA, × 9.32 for CBCS) and JNTUH ((CGPA - 0.5) × 10).',
    category: 'result-guides',
    categoryLabel: 'Guide',
    resourceType: 'article',
    universityId: null,
    universityName: 'General',
    courseId: null,
    regulation: null,
    semester: null,
    subject: 'Conversion Formulas',
    fileUrl: null,
    detailRoute: '/resources/resource-details',
    fileType: '4 min read',
    publishedAt: 'Oct 10, 2026',
    updatedAt: '2026-10-10',
    tags: ['CGPA', 'Percentage', 'Conversion', 'OU', 'JNTUH'],
    status: 'published',
    iconTheme: 'orange'
  },
  {
    id: 'dsa-complete-study-notes',
    title: 'Data Structures & Algorithms Complete Notes',
    description: 'Module-wise structured revision notes for linear and non-linear data structures, searching, sorting, and dynamic programming.',
    category: 'study-materials',
    categoryLabel: 'Study Material',
    resourceType: 'notes',
    universityId: null,
    universityName: 'General',
    courseId: 'cs',
    regulation: null,
    semester: 'Semester 3',
    subject: 'Data Structures',
    fileUrl: 'https://www.osmania.ac.in',
    fileType: 'PDF Document',
    publishedAt: 'Oct 08, 2026',
    updatedAt: '2026-10-08',
    tags: ['DSA', 'Notes', 'Computer Science'],
    status: 'published',
    iconTheme: 'blue'
  },
  {
    id: 'ou-academic-grading-guide',
    title: 'Osmania University Grading & S-Grade Policy Guide',
    description: 'Comprehensive academic ordinance breakdown explaining CBCS 10-point scale and the special S-Grade allocation for MCA and BCA programs.',
    category: 'university-guides',
    categoryLabel: 'University Guide',
    resourceType: 'article',
    universityId: 'osmania-university',
    universityName: 'OU',
    courseId: 'mca',
    regulation: 'CBCS / R22',
    semester: null,
    subject: 'Grading System',
    fileUrl: null,
    detailRoute: '/resources/resource-details',
    fileType: '6 min read',
    publishedAt: 'Oct 05, 2026',
    updatedAt: '2026-10-05',
    tags: ['OU', 'S-Grade', 'Grading', 'MCA', 'BCA'],
    status: 'published',
    iconTheme: 'orange'
  },
  {
    id: 'jntuh-r18-r22-promotion-guide',
    title: 'JNTUH R18 & R22 Promotion and Detention Guide',
    description: 'Official rules on minimum credits required for promotion from 1st to 2nd year and 2nd to 3rd year under JNTUH academic council.',
    category: 'university-guides',
    categoryLabel: 'University Guide',
    resourceType: 'article',
    universityId: 'jntuh',
    universityName: 'JNTUH',
    courseId: 'btech',
    regulation: 'R18 / R22',
    semester: null,
    subject: 'Promotion Rules',
    fileUrl: null,
    detailRoute: '/resources/resource-details',
    fileType: '7 min read',
    publishedAt: 'Oct 02, 2026',
    updatedAt: '2026-10-02',
    tags: ['JNTUH', 'Promotion', 'Detention', 'Credits'],
    status: 'published',
    iconTheme: 'purple'
  },
  {
    id: 'os-core-handwritten-notes',
    title: 'Operating Systems Handwritten Core Notes',
    description: 'Concise lecture notes on processes, threads, CPU scheduling, synchronization, and virtual memory management.',
    category: 'study-materials',
    categoryLabel: 'Study Material',
    resourceType: 'notes',
    universityId: 'osmania-university',
    universityName: 'OU',
    courseId: 'mca',
    regulation: 'R22',
    semester: 'Semester 2',
    subject: 'Operating Systems',
    fileUrl: 'https://www.osmania.ac.in',
    fileType: 'PDF Document',
    publishedAt: 'Sep 29, 2026',
    updatedAt: '2026-10-01',
    tags: ['Operating Systems', 'Notes', 'OU'],
    status: 'published',
    iconTheme: 'blue'
  },
  {
    id: 'jntuh-btech-cse-sem3-papers',
    title: 'JNTUH B.Tech CSE Semester 3 Previous Question Papers',
    description: 'Official previous question paper archive covering Data Structures, Discrete Mathematics, and Computer Organization.',
    category: 'previous-papers',
    categoryLabel: 'Previous Paper',
    resourceType: 'pdf',
    universityId: 'jntuh',
    universityName: 'JNTUH',
    courseId: 'btech-cse',
    regulation: 'R18',
    semester: 'Semester 3',
    subject: 'Computer Science',
    fileUrl: 'https://exams.jntuh.ac.in',
    fileType: 'PDF Document',
    publishedAt: 'Sep 27, 2026',
    updatedAt: '2026-09-27',
    tags: ['JNTUH', 'Previous Papers', 'B.Tech', 'CSE'],
    status: 'published',
    iconTheme: 'red'
  },
  {
    id: 'ou-bca-sem2-papers',
    title: 'OU BCA Semester 2 Question Papers',
    description: 'Previous examination papers for Osmania University BCA semester 2 programming and mathematics examinations.',
    category: 'previous-papers',
    categoryLabel: 'Previous Paper',
    resourceType: 'pdf',
    universityId: 'osmania-university',
    universityName: 'OU',
    courseId: 'bca',
    regulation: 'CBCS',
    semester: 'Semester 2',
    subject: 'Computer Applications',
    fileUrl: 'https://www.osmania.ac.in',
    fileType: 'PDF Document',
    publishedAt: 'Sep 25, 2026',
    updatedAt: '2026-09-25',
    tags: ['OU', 'BCA', 'Previous Papers'],
    status: 'published',
    iconTheme: 'blue'
  }
];

/**
 * Filter and search helper for resources
 */
export function filterResources(resources, { category = 'all', searchQuery = '', sortBy = 'latest' } = {}) {
  let list = [...resources];

  // 1. Category Filter
  if (category && category !== 'all') {
    list = list.filter((r) => r.category === category);
  }

  // 2. Search Query (Case-insensitive matching across title, desc, university, subject, tags, regulation)
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter((r) => {
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description ? r.description.toLowerCase().includes(q) : false;
      const matchUni = r.universityName ? r.universityName.toLowerCase().includes(q) : false;
      const matchCat = r.categoryLabel ? r.categoryLabel.toLowerCase().includes(q) : false;
      const matchSub = r.subject ? r.subject.toLowerCase().includes(q) : false;
      const matchReg = r.regulation ? r.regulation.toLowerCase().includes(q) : false;
      const matchTags = Array.isArray(r.tags) ? r.tags.some((t) => t.toLowerCase().includes(q)) : false;

      return matchTitle || matchDesc || matchUni || matchCat || matchSub || matchReg || matchTags;
    });
  }

  // 3. Sorting
  if (sortBy === 'latest') {
    list.sort((a, b) => new Date(b.updatedAt || b.publishedAt) - new Date(a.updatedAt || a.publishedAt));
  } else if (sortBy === 'oldest') {
    list.sort((a, b) => new Date(a.updatedAt || a.publishedAt) - new Date(b.updatedAt || b.publishedAt));
  } else if (sortBy === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return list;
}