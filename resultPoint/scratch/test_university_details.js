import assert from 'node:assert';
import { UNIVERSITY_DETAILS_DATA, getUniversityDetails } from '../src/data/universityDetailsData.js';

console.log('Testing ResultPoint University Details Data Architecture...\n');

// 1. Resolution Tests
const ou = getUniversityDetails('osmania-university');
assert(ou, 'Osmania University must be resolvable via osmania-university');
assert.strictEqual(ou.id, 'osmania-university');
assert.strictEqual(ou.shortName, 'OU');

const ouAlias = getUniversityDetails('ou');
assert(ouAlias, 'Osmania University must be resolvable via alias "ou"');
assert.strictEqual(ouAlias.id, 'osmania-university');

const jntuh = getUniversityDetails('jntuh');
assert(jntuh, 'JNTUH must be resolvable via "jntuh"');
assert.strictEqual(jntuh.id, 'jntuh');
assert.strictEqual(jntuh.shortName, 'JNTUH');

const invalid = getUniversityDetails('non-existent-university');
assert.strictEqual(invalid, null, 'Invalid university must return null');

console.log('✔ University resolution and alias matching tests passed.');

// 2. OU MCA & BCA S-Grade Verification
const ouMCA = ou.courses.find(c => c.id === 'mca');
assert(ouMCA, 'OU must have MCA course configured');

const ouMCAR22 = ouMCA.regulations.find(r => r.code === 'R22');
assert(ouMCAR22, 'OU MCA must have R22 regulation');
assert.strictEqual(ouMCAR22.isSpecialOUGradeRule, true, 'OU MCA R22 must flag isSpecialOUGradeRule');

const topGradeMCA = ouMCAR22.grades[0];
assert.strictEqual(topGradeMCA.grade, 'S', 'OU MCA top grade MUST be S (Super) instead of O');
assert.strictEqual(topGradeMCA.point, 10, 'OU MCA S grade point must be 10');
assert.strictEqual(topGradeMCA.performance, 'Super', 'OU MCA S grade performance must be Super');
assert(topGradeMCA.range.includes('90'), 'OU MCA S grade range must be >= 90');

const ouBCA = ou.courses.find(c => c.id === 'bca');
assert(ouBCA, 'OU must have BCA course configured');
const topGradeBCA = ouBCA.regulations[0].grades[0];
assert.strictEqual(topGradeBCA.grade, 'S', 'OU BCA top grade MUST be S (Super)');

console.log('✔ OU MCA and BCA S-Grade rules verified (S = Super, 10 pts, >= 90).');

// 3. JNTUH Grading and Percentage Verification
const jntuhCSE = jntuh.courses.find(c => c.id === 'btech-cse');
assert(jntuhCSE, 'JNTUH must have B.Tech (CSE) configured');

const jntuhR22 = jntuhCSE.regulations.find(r => r.code === 'R22');
assert(jntuhR22, 'JNTUH B.Tech must have R22 regulation');

const topGradeJNTUH = jntuhR22.grades[0];
assert.strictEqual(topGradeJNTUH.grade, 'O', 'JNTUH top grade must be O (Outstanding)');
assert.strictEqual(topGradeJNTUH.point, 10, 'JNTUH O grade point must be 10');
assert.strictEqual(topGradeJNTUH.performance, 'Outstanding');

assert.strictEqual(
  jntuhR22.calculationRule.percentageFormula,
  'Percentage = (CGPA - 0.5) × 10',
  'JNTUH percentage formula must be (CGPA - 0.5) × 10'
);

assert.strictEqual(
  ouMCAR22.calculationRule.percentageFormula,
  'Percentage = CGPA × 10',
  'OU MCA percentage formula must be CGPA × 10'
);

console.log('✔ JNTUH O-grade and percentage conversion formulas verified.');

// 4. Related Universities Links
assert(
  ou.relatedUniversities.some(u => u.route === '/universities/jntuh'),
  'OU must have related link to JNTUH'
);
assert(
  jntuh.relatedUniversities.some(u => u.route === '/universities/osmania-university'),
  'JNTUH must have related link to OU'
);

console.log('✔ Cross-linking between OU and JNTUH verified.');

// 5. Full Course and Regulation Completeness Checks
console.log('\nValidating all courses and regulations for Osmania University:');
for (const course of ou.courses) {
  assert(course.id, 'Course must have an id');
  assert(course.name, 'Course must have a name');
  assert(Array.isArray(course.regulations) && course.regulations.length > 0, `Course ${course.name} must have regulations`);
  for (const reg of course.regulations) {
    assert(reg.code, `Regulation under ${course.name} must have a code`);
    assert(Array.isArray(reg.grades) && reg.grades.length > 0, `Regulation ${reg.code} must have grading data`);
    for (const g of reg.grades) {
      assert(g.grade, `Grade row in ${course.name} - ${reg.code} must have grade symbol`);
      assert(typeof g.point === 'number', `Grade row in ${course.name} - ${reg.code} must have numeric grade point`);
      assert(g.performance, `Grade row in ${course.name} - ${reg.code} must have performance string`);
      assert(g.range, `Grade row in ${course.name} - ${reg.code} must have range`);
    }
    // Verify OU S-Grade rule isolation
    if (course.id === 'mca' || course.id === 'bca') {
      assert.strictEqual(reg.grades[0].grade, 'S', `${course.name} must use 'S' for top grade`);
      assert.strictEqual(reg.grades[0].point, 10);
    }
  }
  console.log(`  ✔ Verified ${course.name} (${course.regulations.length} regulations, full grading tables)`);
}

console.log('\nValidating all courses and regulations for JNTU Hyderabad:');
for (const course of jntuh.courses) {
  assert(course.id, 'Course must have an id');
  assert(course.name, 'Course must have a name');
  assert(Array.isArray(course.regulations) && course.regulations.length > 0, `Course ${course.name} must have regulations`);
  for (const reg of course.regulations) {
    assert(reg.code, `Regulation under ${course.name} must have a code`);
    assert(Array.isArray(reg.grades) && reg.grades.length > 0, `Regulation ${reg.code} must have grading data`);
    for (const g of reg.grades) {
      assert(g.grade, `Grade row in ${course.name} - ${reg.code} must have grade symbol`);
      assert(typeof g.point === 'number', `Grade row in ${course.name} - ${reg.code} must have numeric grade point`);
      assert(g.performance, `Grade row in ${course.name} - ${reg.code} must have performance string`);
      assert(g.range, `Grade row in ${course.name} - ${reg.code} must have range`);
    }
    // Verify JNTUH uses O or standard scale, never OU S-rule
    if (reg.code === 'R22' || reg.code === 'R18') {
      assert.strictEqual(reg.grades[0].grade, 'O', `JNTUH ${course.name} ${reg.code} must use 'O' for top grade`);
    }
  }
  console.log(`  ✔ Verified ${course.name} (${course.regulations.length} regulations, full grading tables)`);
}

console.log('\nAll University Details Architecture assertions passed successfully!');
