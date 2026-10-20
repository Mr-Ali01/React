import { academicCatalogService } from '../src/services/academicCatalogService.js';
import { academicCalculationEngine } from '../src/services/academicCalculationEngine.js';

console.log('Testing Academic Catalog Service...');

const universities = academicCatalogService.getUniversities();
console.log('Universities count:', universities.length);

const osmania = universities.find(u => u.id === 'osmania');
console.log('Osmania University found:', !!osmania);

const courses = academicCatalogService.getCoursesByUniversity('osmania');
console.log('Osmania Courses count:', courses.length);
console.log('Course list:', courses.map(c => `${c.id} (${c.level}) - ${c.name}`));

// Verify all 10 courses exist
const expectedCourses = [
  'bca', 'bcom-gen', 'bcom-ca', 'bsc', 'bba',
  'mca', 'mba', 'mcom', 'msc-cs', 'ma-eng'
];

for (const id of expectedCourses) {
  const c = courses.find(course => course.id === id);
  if (!c) {
    throw new Error(`Missing expected course: ${id}`);
  }
}
console.log('✓ All 10 courses verified!');

// Test BCA grading scale
const bcaConfig = academicCatalogService.getFullConfiguration('osmania', 'bca', 'ou-bca-cbcs');
console.log('BCA Grade scale:', bcaConfig.gradeScale.map(g => `${g.grade}:${g.points}`));
const bcaHasO = bcaConfig.gradeScale.some(g => g.grade === 'O');
const bcaHasS = bcaConfig.gradeScale.some(g => g.grade === 'S');
if (bcaHasO || !bcaHasS) {
  throw new Error(`BCA grading rule failure: hasO=${bcaHasO}, hasS=${bcaHasS}`);
}
console.log('✓ BCA uses S and does NOT use O!');

// Test MCA grading scale
const mcaConfig = academicCatalogService.getFullConfiguration('osmania', 'mca', 'ou-mca-cbcs');
console.log('MCA Grade scale:', mcaConfig.gradeScale.map(g => `${g.grade}:${g.points}`));
const mcaHasO = mcaConfig.gradeScale.some(g => g.grade === 'O');
const mcaHasS = mcaConfig.gradeScale.some(g => g.grade === 'S');
if (mcaHasO || !mcaHasS) {
  throw new Error(`MCA grading rule failure: hasO=${mcaHasO}, hasS=${mcaHasS}`);
}
console.log('✓ MCA uses S and does NOT use O!');

// Test other 8 courses have O
const otherCourses = ['bcom-gen', 'bcom-ca', 'bsc', 'bba', 'mba', 'mcom', 'msc-cs', 'ma-eng'];
for (const cid of otherCourses) {
  const regs = academicCatalogService.getRegulationsByCourse('osmania', cid);
  const cfg = academicCatalogService.getFullConfiguration('osmania', cid, regs[0].id);
  const hasO = cfg.gradeScale.some(g => g.grade === 'O');
  const hasS = cfg.gradeScale.some(g => g.grade === 'S');
  if (!hasO || hasS) {
    throw new Error(`Course ${cid} grading rule failure: hasO=${hasO}, hasS=${hasS}`);
  }
}
console.log('✓ All remaining 8 courses use verified O-grade CBCS scale!');

// Test calculation engine with S grade
const testSubjects = [
  { code: 'BCA101', name: 'Math', credits: 4, grade: 'S' },
  { code: 'BCA102', name: 'Programming in C', credits: 4, grade: 'A+' }
];
const calcRes = academicCalculationEngine.calculateSGPA(testSubjects, bcaConfig.gradeScale);
console.log('SGPA with S grade (4*10 + 4*9)/8 = 9.5:', calcRes.sgpa);
if (calcRes.sgpa !== 9.5) {
  throw new Error(`SGPA calculation mismatch: expected 9.5, got ${calcRes.sgpa}`);
}
console.log('✓ Calculation engine works seamlessly with S grade (10 pts)!');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
