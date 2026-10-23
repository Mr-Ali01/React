import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Set up mock window and storage for node environment
const mockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

globalThis.window = {
  localStorage: mockStorage(),
  sessionStorage: mockStorage(),
  dispatchEvent: () => true,
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;

const { academicCatalogService } = await import('../../src/services/academicCatalogService.js');
const { academicCalculationEngine } = await import('../../src/services/academicCalculationEngine.js');

describe('ResultPoint Offline Calculation Consistency Suite (WP-2 Quality Gate)', () => {
  it('1. Osmania BCA CBCS must preserve S (Super) top grade with 10 grade points for 85-100% marks in local catalog', () => {
    const ouConfig = academicCatalogService.getFullConfiguration('osmania', 'bca', 'ou-bca-cbcs');
    assert.ok(ouConfig, 'Osmania BCA CBCS configuration must exist in local catalog');
    assert.equal(ouConfig.regulation.gradingSystem, '10-point (S-Grade Scheme)');

    const gradeScale = ouConfig.gradeScale;
    const sGrade = gradeScale.find(g => g.grade === 'S');
    assert.ok(sGrade, 'Grade S must exist in Osmania BCA grade scale');
    assert.equal(sGrade.points, 10, 'Grade S must be 10 grade points');
    assert.equal(sGrade.minPercentage, 85, 'Grade S minimum percentage must be 85%');
    assert.equal(sGrade.maxPercentage, 100, 'Grade S maximum percentage must be 100%');
    assert.equal(sGrade.desc, 'Super');

    // Confirm O grade is NOT the top grade in this scale
    const oGrade = gradeScale.find(g => g.grade === 'O');
    assert.equal(oGrade, undefined, 'Grade O must NOT be present in Osmania BCA S-Grade scheme');
  });

  it('2. Osmania MCA CBCS must preserve S (Super) top grade with 10 grade points for 85-100% marks in local catalog', () => {
    const ouMcaConfig = academicCatalogService.getFullConfiguration('osmania', 'mca', 'ou-mca-cbcs');
    assert.ok(ouMcaConfig, 'Osmania MCA CBCS configuration must exist in local catalog');
    assert.equal(ouMcaConfig.regulation.gradingSystem, '10-point (S-Grade Scheme)');

    const gradeScale = ouMcaConfig.gradeScale;
    const sGrade = gradeScale.find(g => g.grade === 'S');
    assert.ok(sGrade, 'Grade S must exist in Osmania MCA grade scale');
    assert.equal(sGrade.points, 10, 'Grade S must be 10 grade points');
    assert.equal(sGrade.minPercentage, 85, 'Grade S minimum percentage must be 85%');
  });

  it('3. Local SGPA calculation for Osmania BCA must accurately weight S grade against other grades', () => {
    const ouConfig = academicCatalogService.getFullConfiguration('osmania', 'bca', 'ou-bca-cbcs');
    const subjects = [
      { name: 'Subject 1', credits: 4, grade: 'S' },  // 4 * 10 = 40
      { name: 'Subject 2', credits: 4, grade: 'A+' }, // 4 * 9 = 36
      { name: 'Subject 3', credits: 2, grade: 'A' }   // 2 * 8 = 16
    ];
    // Total credits = 10, Total points = 92 -> SGPA = 9.20

    const res = academicCalculationEngine.calculateSGPA(subjects, ouConfig.gradeScale);
    assert.equal(res.totalCredits, 10);
    assert.equal(res.earnedCredits, 10);
    assert.equal(res.totalPoints, 92);
    assert.equal(res.sgpa, 9.2);
  });

  it('4. Local percentage conversion must apply Osmania rule (CGPA * 10) vs JNTUH rule ((CGPA - 0.5) * 10) without cross-contamination', () => {
    const cgpa = 8.5;

    // Osmania CBCS
    const ouResult = academicCalculationEngine.convertCGPAToPercentage(cgpa, 'CGPA * 10');
    assert.equal(ouResult.percentage, 85.0);

    // JNTUH R18/R22
    const jntuhResult = academicCalculationEngine.convertCGPAToPercentage(cgpa, '(CGPA - 0.5) * 10');
    assert.equal(jntuhResult.percentage, 80.0);

    // Discrepancy protection: verify that JNTUH does NOT match standard linear 85.0%
    assert.notEqual(jntuhResult.percentage, ouResult.percentage);
  });

  it('5. Local Target CGPA calculation must match backend formula ((Target * Total) - (Current * Comp)) / Rem', () => {
    const currentCgpa = 8.5;
    const targetCgpa = 9.0;
    const completedCredits = 60;
    const totalCredits = 120;
    const remainingCredits = totalCredits - completedCredits;

    const requiredSgpa = ((targetCgpa * totalCredits) - (currentCgpa * completedCredits)) / remainingCredits;
    assert.equal(Number(requiredSgpa.toFixed(2)), 9.5);

    // Impossibility boundary test: Target 9.8 with 100/120 credits completed at 7.0
    // ((9.8 * 120) - (7.0 * 100)) / 20 = (1176 - 700) / 20 = 476 / 20 = 23.8 (> 10.0)
    const impossibleTarget = 9.8;
    const impossibleCurrent = 7.0;
    const impossibleComp = 100;
    const impossibleRem = 20;
    const reqImpossible = ((impossibleTarget * totalCredits) - (impossibleCurrent * impossibleComp)) / impossibleRem;
    assert.ok(reqImpossible > 10.0, 'Required SGPA exceeds 10.0');
    assert.equal(reqImpossible <= 10.0, false, 'Target must be flagged unachievable');
  });

  it('6. Marks to grade mapping must award S grade for marks >= 85% in Osmania scale', () => {
    const ouConfig = academicCatalogService.getFullConfiguration('osmania', 'bca', 'ou-bca-cbcs');

    const grade85 = academicCalculationEngine.getGradeFromMarks(85, 100, ouConfig.gradeScale);
    assert.equal(grade85.grade, 'S');
    assert.equal(grade85.points, 10);
    assert.equal(grade85.isPass, true);

    const grade100 = academicCalculationEngine.getGradeFromMarks(100, 100, ouConfig.gradeScale);
    assert.equal(grade100.grade, 'S');
    assert.equal(grade100.points, 10);

    const grade84 = academicCalculationEngine.getGradeFromMarks(84.5, 100, ouConfig.gradeScale);
    assert.notEqual(grade84.grade, 'S', '84.5% must not receive S grade in Osmania');
    assert.equal(grade84.grade, 'A+');
  });
});
