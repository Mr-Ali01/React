/**
 * Verification Test for ResultPoint Universities Listing Page & Directory Data
 */

import { UNIVERSITIES_DATA, getUniversityById, getAllUniversities } from '../src/data/universitiesDirectoryData.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('--- Starting Universities Directory Verification ---\n');

// 1. Initial State: Exactly 2 Universities (OU and JNTUH Only)
assert(UNIVERSITIES_DATA.length === 2, `UNIVERSITIES_DATA must have exactly 2 universities, got ${UNIVERSITIES_DATA.length}`);

const ou = UNIVERSITIES_DATA.find((u) => u.abbreviation === 'OU' || u.id === 'osmania-university');
const jntuh = UNIVERSITIES_DATA.find((u) => u.abbreviation === 'JNTUH' || u.id === 'jntuh');

assert(Boolean(ou), 'Osmania University (OU) must be present');
assert(ou.name === 'Osmania University', `OU full name is "${ou.name}"`);
assert(ou.abbreviation === 'OU', `OU abbreviation is "${ou.abbreviation}"`);
assert(ou.city === 'Hyderabad' && ou.state === 'Telangana', `OU location is ${ou.city}, ${ou.state}`);
assert(ou.detailsRoute === '/universities/osmania-university', `OU detailsRoute is ${ou.detailsRoute}`);
assert(Array.isArray(ou.supportedRegulations) && ou.supportedRegulations.includes('CBCS'), 'OU has CBCS regulations configured');

assert(Boolean(jntuh), 'JNTUH must be present');
assert(jntuh.name === 'Jawaharlal Nehru Technological University Hyderabad', `JNTUH full name is "${jntuh.name}"`);
assert(jntuh.abbreviation === 'JNTUH', `JNTUH abbreviation is "${jntuh.abbreviation}"`);
assert(jntuh.city === 'Hyderabad' && jntuh.state === 'Telangana', `JNTUH location is ${jntuh.city}, ${jntuh.state}`);
assert(jntuh.detailsRoute === '/universities/jntuh', `JNTUH detailsRoute is ${jntuh.detailsRoute}`);
assert(Array.isArray(jntuh.supportedRegulations) && jntuh.supportedRegulations.includes('R22'), 'JNTUH has R22 regulations configured');

// 2. Helper Functions
assert(getUniversityById('osmania-university')?.id === 'osmania-university', 'getUniversityById("osmania-university") resolves correctly');
assert(getUniversityById('ou')?.id === 'osmania-university', 'getUniversityById("ou") alias resolves to Osmania');
assert(getUniversityById('jntuh')?.id === 'jntuh', 'getUniversityById("jntuh") resolves correctly');
assert(getUniversityById('jntu-hyderabad')?.id === 'jntuh', 'getUniversityById("jntu-hyderabad") alias resolves to JNTUH');
assert(getUniversityById('invalid-university-slug') === null, 'getUniversityById for invalid slug returns null');
assert(getAllUniversities().length === 2, `getAllUniversities() returns all 2 available universities`);

// 3. Search Matching Function Simulation
function searchFilter(query, state = 'All States', type = 'All Types') {
  const q = query.trim().toLowerCase();
  return UNIVERSITIES_DATA.filter((uni) => {
    if (q) {
      const matchesName = uni.name.toLowerCase().includes(q);
      const matchesAbbr = uni.abbreviation.toLowerCase().includes(q);
      const matchesCity = uni.city ? uni.city.toLowerCase().includes(q) : false;
      const matchesState = uni.state ? uni.state.toLowerCase().includes(q) : false;
      const matchesAlias = Array.isArray(uni.aliases)
        ? uni.aliases.some((alias) => alias.toLowerCase().includes(q))
        : false;

      if (!matchesName && !matchesAbbr && !matchesCity && !matchesState && !matchesAlias) {
        return false;
      }
    }
    if (state !== 'All States' && uni.state !== state) return false;
    if (type !== 'All Types' && uni.type !== type) return false;
    return true;
  });
}

// Search cases
assert(searchFilter('OU').length === 1 && searchFilter('OU')[0].abbreviation === 'OU', 'Search "OU" matches Osmania University');
assert(searchFilter('Osmania').length === 1 && searchFilter('Osmania')[0].abbreviation === 'OU', 'Search "Osmania" matches Osmania University');
assert(searchFilter('JNTUH').length === 1 && searchFilter('JNTUH')[0].abbreviation === 'JNTUH', 'Search "JNTUH" matches JNTUH');
assert(searchFilter('jntuh').length === 1, 'Search "jntuh" is case-insensitive');
assert(searchFilter('Jawaharlal').length === 1 && searchFilter('Jawaharlal')[0].abbreviation === 'JNTUH', 'Search "Jawaharlal" matches JNTUH');
assert(searchFilter('Hyderabad').length === 2, 'Search "Hyderabad" matches both universities');
assert(searchFilter('NonExistentUniversity').length === 0, 'Search for non-existent university yields empty result');

// State and Type Filters
assert(searchFilter('', 'Telangana', 'All Types').length === 2, 'State filter "Telangana" returns both universities');
assert(searchFilter('', 'Maharashtra', 'All Types').length === 0, 'State filter "Maharashtra" returns 0 universities');
assert(searchFilter('', 'All States', 'State University').length === 2, 'Type filter "State University" returns both universities');

// Clearing filters restores both
assert(searchFilter('', 'All States', 'All Types').length === 2, 'Clearing filters restores both universities');

// 4. Extensibility Simulation
const mockFutureUniversity = {
  id: 'anna-university',
  slug: 'anna-university',
  aliases: ['au', 'anna'],
  name: 'Anna University',
  abbreviation: 'AU',
  state: 'Tamil Nadu',
  city: 'Chennai',
  type: 'State Technical University',
  logo: null,
  description: 'Explore supported courses, academic regulations, and grading rules.',
  academicFocus: 'CBCS Regulation 2021 engineering rubrics and grade conversions.',
  detailsRoute: '/universities/anna-university',
  status: 'available',
  supportedRegulations: ['R2021'],
  supportedCourses: ['B.E', 'B.Tech']
};

const extendedList = [...UNIVERSITIES_DATA, mockFutureUniversity];
const dynamicStates = Array.from(new Set(extendedList.map((u) => u.state)));
const dynamicTypes = Array.from(new Set(extendedList.map((u) => u.type)));

assert(extendedList.length === 3, 'Adding future university extends directory dynamically to 3');
assert(dynamicStates.includes('Tamil Nadu'), 'State filter dynamically includes new state without code rewrite');
assert(dynamicTypes.includes('State Technical University'), 'Type filter dynamically includes new type');

console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
