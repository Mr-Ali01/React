import assert from 'node:assert';
import {
  RESOURCE_CATEGORIES,
  FEATURED_RESOURCE_CARDS,
  RESOURCES_DATA,
  filterResources
} from '../src/data/resourcesData.js';

console.log('Testing ResultPoint Academic Resources Page Data & Logic...\n');

// 1. Verify Category Structure
assert.strictEqual(RESOURCE_CATEGORIES.length, 6, 'Must have exactly 6 resource categories');
const categoryIds = RESOURCE_CATEGORIES.map(c => c.id);
assert(categoryIds.includes('all'));
assert(categoryIds.includes('previous-papers'));
assert(categoryIds.includes('study-materials'));
assert(categoryIds.includes('syllabus-regulations'));
assert(categoryIds.includes('university-guides'));
assert(categoryIds.includes('result-guides'));
console.log('✔ All 6 resource categories verified.');

// 2. Verify Featured Cards
assert.strictEqual(FEATURED_RESOURCE_CARDS.length, 4, 'Must have 4 featured resource cards');
const featKeys = FEATURED_RESOURCE_CARDS.map(f => f.categoryKey);
assert(featKeys.includes('previous-papers'));
assert(featKeys.includes('study-materials'));
assert(featKeys.includes('syllabus-regulations'));
assert(featKeys.includes('result-guides'));
console.log('✔ 4 featured resource cards verified.');

// 3. Verify Initial Resources (Screenshot items)
const jntuhR18 = RESOURCES_DATA.find(r => r.id === 'jntuh-r18-syllabus-cse');
assert(jntuhR18, 'JNTUH R18 Syllabus must be present');
assert.strictEqual(jntuhR18.universityName, 'JNTUH');
assert.strictEqual(jntuhR18.fileType, 'PDF Document');

const ouMCA = RESOURCES_DATA.find(r => r.id === 'ou-mca-previous-papers-sem1');
assert(ouMCA, 'OU MCA Previous Papers must be present');
assert.strictEqual(ouMCA.universityName, 'OU');
assert.strictEqual(ouMCA.fileType, 'PDF Document');

const sgpaGuide = RESOURCES_DATA.find(r => r.id === 'understanding-sgpa-and-cgpa-calculation');
assert(sgpaGuide, 'Understanding SGPA & CGPA must be present');
assert.strictEqual(sgpaGuide.resourceType, 'article');
assert.strictEqual(sgpaGuide.fileType, '5 min read');

const jntuhR22Reg = RESOURCES_DATA.find(r => r.id === 'jntuh-academic-regulations-r22');
assert(jntuhR22Reg, 'JNTUH R22 Regulations must be present');
assert.strictEqual(jntuhR22Reg.universityName, 'JNTUH');

const cgpaConvertGuide = RESOURCES_DATA.find(r => r.id === 'how-to-convert-cgpa-to-percentage');
assert(cgpaConvertGuide, 'How to Convert CGPA to Percentage must be present');
assert.strictEqual(cgpaConvertGuide.fileType, '4 min read');
console.log('✔ Screenshot featured and latest items verified.');

// 4. Test Category Filtering
const allFiltered = filterResources(RESOURCES_DATA, { category: 'all' });
assert.strictEqual(allFiltered.length, RESOURCES_DATA.length);

const previousPapers = filterResources(RESOURCES_DATA, { category: 'previous-papers' });
assert(previousPapers.length > 0);
assert(previousPapers.every(r => r.category === 'previous-papers'));

const studyMaterials = filterResources(RESOURCES_DATA, { category: 'study-materials' });
assert(studyMaterials.length > 0);
assert(studyMaterials.every(r => r.category === 'study-materials'));

const syllabusRegs = filterResources(RESOURCES_DATA, { category: 'syllabus-regulations' });
assert(syllabusRegs.length > 0);
assert(syllabusRegs.every(r => r.category === 'syllabus-regulations'));

const uniGuides = filterResources(RESOURCES_DATA, { category: 'university-guides' });
assert(uniGuides.length > 0);
assert(uniGuides.every(r => r.category === 'university-guides'));

const resultGuides = filterResources(RESOURCES_DATA, { category: 'result-guides' });
assert(resultGuides.length > 0);
assert(resultGuides.every(r => r.category === 'result-guides'));
console.log('✔ Category filtering verified across all 6 categories.');

// 5. Test Search Filtering
const searchOU = filterResources(RESOURCES_DATA, { searchQuery: 'Osmania' });
assert(searchOU.length > 0);
assert(searchOU.every(r => r.universityName === 'OU' || r.title.includes('OU') || r.description.includes('Osmania')));

const searchJNTUH = filterResources(RESOURCES_DATA, { searchQuery: 'JNTUH' });
assert(searchJNTUH.length > 0);
assert(searchJNTUH.every(r => r.universityName === 'JNTUH' || r.tags.includes('JNTUH')));

const searchSGPA = filterResources(RESOURCES_DATA, { searchQuery: 'sgpa' });
assert(searchSGPA.length > 0);

const searchCombined = filterResources(RESOURCES_DATA, { category: 'previous-papers', searchQuery: 'MCA' });
assert.strictEqual(searchCombined.length, 1);
assert.strictEqual(searchCombined[0].id, 'ou-mca-previous-papers-sem1');

console.log('✔ Search matching & combined category filtering verified.');

// 6. Test Sorting
const sortedLatest = filterResources(RESOURCES_DATA, { sortBy: 'latest' });
assert(new Date(sortedLatest[0].updatedAt) >= new Date(sortedLatest[sortedLatest.length - 1].updatedAt));

const sortedOldest = filterResources(RESOURCES_DATA, { sortBy: 'oldest' });
assert(new Date(sortedOldest[0].updatedAt) <= new Date(sortedOldest[sortedOldest.length - 1].updatedAt));

const sortedTitle = filterResources(RESOURCES_DATA, { sortBy: 'title' });
assert(sortedTitle[0].title.localeCompare(sortedTitle[sortedTitle.length - 1].title) <= 0);

console.log('✔ Sorting by latest, oldest, and title verified.');

console.log('\nAll Academic Resources Page tests passed successfully!');
