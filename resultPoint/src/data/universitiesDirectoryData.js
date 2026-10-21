/**
 * ResultPoint Universities Directory Configuration
 * 
 * Central data source for the Universities Listing Page.
 * Data-driven and extensible: To add a new university in the future,
 * append a new configuration entry to UNIVERSITIES_DATA below and configure
 * its corresponding route. No changes to the listing JSX are required.
 */

export const UNIVERSITIES_DATA = [
  {
    id: 'osmania-university',
    slug: 'osmania-university',
    aliases: ['ou', 'osmania'],
    name: 'Osmania University',
    abbreviation: 'OU',
    state: 'Telangana',
    city: 'Hyderabad',
    type: 'State University',
    logo: null,
    description: 'Explore supported courses, academic regulations, grading rules, and result calculators.',
    academicFocus: 'Verified CBCS 10-point S-Grade scale, degree credit evaluation, and CGPA to percentage conversion formula (CGPA × 9.32).',
    detailsRoute: '/universities/osmania-university',
    status: 'available',
    supportedRegulations: ['CBCS'],
    supportedCourses: ['BCA', 'MCA', 'B.Com', 'B.Sc'],
    calculationRules: {
      gradingSystem: '10-Point (S-Grade Scheme)',
      percentageFormula: 'Percentage = CGPA × 9.32',
      sgpaRule: 'Weighted Credit Sum'
    }
  },
  {
    id: 'jntuh',
    slug: 'jntuh',
    aliases: ['jntu-hyderabad', 'jntu'],
    name: 'Jawaharlal Nehru Technological University Hyderabad',
    abbreviation: 'JNTUH',
    state: 'Telangana',
    city: 'Hyderabad',
    type: 'State University',
    logo: null,
    description: 'Explore supported courses, academic regulations, grading rules, and result calculators.',
    academicFocus: 'Official R22, R18, and R16 B.Tech/M.Tech grading matrices, credit distribution guidelines, and backlog planning tools.',
    detailsRoute: '/universities/jntuh',
    status: 'available',
    supportedRegulations: ['R22', 'R18', 'R16'],
    supportedCourses: ['B.Tech (CSE)', 'M.Tech', 'MBA', 'MCA'],
    calculationRules: {
      gradingSystem: '10-Point Scale (O to F)',
      percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
      sgpaRule: 'Weighted Credit Sum'
    }
  }
];

/**
 * Helper to fetch a university by its unique ID or alias slug.
 * @param {string} idOrSlug - The university ID or alias (e.g. 'jntuh', 'osmania-university', 'ou')
 * @returns {object|null}
 */
export function getUniversityById(idOrSlug) {
  if (!idOrSlug) return null;
  const normalized = String(idOrSlug).trim().toLowerCase();
  return (
    UNIVERSITIES_DATA.find(
      (uni) =>
        uni.id.toLowerCase() === normalized ||
        uni.slug.toLowerCase() === normalized ||
        uni.abbreviation.toLowerCase() === normalized ||
        (Array.isArray(uni.aliases) && uni.aliases.some((alias) => alias.toLowerCase() === normalized))
    ) || null
  );
}

/**
 * Helper to retrieve all active universities.
 * @returns {Array<object>}
 */
export function getAllUniversities() {
  return UNIVERSITIES_DATA.filter((uni) => uni.status === 'available');
}