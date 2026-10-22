/**
 * ResultPoint - Calculator PDF Export & Visual Result Card Sharing Test Suite
 * Tests both bug fixes:
 * 1. PDF download rendering: Type1 font sanitization, dynamic layout without blank sections or colored blocks, genuine metrics.
 * 2. Visual Result Card Sharing: PNG image generation, Web Share API with files, single URL formatting, localhost handling, and download/clipboard fallback.
 */

import assert from 'assert';
import {
  generateCalculatorPdfBinary,
  sanitizePdfText
} from '../services/calculatorPdfService.js';
import {
  buildResultCardSvg,
  resolveShareableUrl
} from '../services/resultCardImageService.js';
import {
  formatShareSummary,
  shareCalculationResult
} from '../services/calculatorShareService.js';

let passed = 0;
let failed = 0;

async function test(desc, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

function mockNavigator(props) {
  Object.defineProperty(globalThis, 'navigator', {
    value: props,
    configurable: true,
    writable: true
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('ResultPoint - Public Calculator PDF & Share Test Suite');
  console.log('======================================================\n');

  // -----------------------------------------------------------------------------
  // Area 1: Type 1 Font Sanitization & Unicode Handling
  // -----------------------------------------------------------------------------
  console.log('--- Area 1: PDF Font Sanitization & Unicode Defense ---');

  await test('sanitizes em-dash, en-dash, and non-breaking spaces to clean ASCII', () => {
    const input = 'ResultPoint \u2014 Academic Evaluation \u2013 Term 1\u00A0Score';
    const sanitized = sanitizePdfText(input);
    assert(!sanitized.includes('\u2014'), 'Should not contain em-dash');
    assert(!sanitized.includes('\u2013'), 'Should not contain en-dash');
    assert(!sanitized.includes('\u00A0'), 'Should not contain non-breaking space');
    assert(sanitized.includes('ResultPoint  -  Academic Evaluation  -  Term 1 Score'));
  });

  await test('sanitizes smart quotes and apostrophes to standard ASCII', () => {
    const input = '\u2018Student\u2019s Performance\u2019 under \u201CAutonomous\u201D Regulations';
    const sanitized = sanitizePdfText(input);
    assert(!sanitized.includes('\u2018') && !sanitized.includes('\u2019'), 'Should not have curly single quotes');
    assert(!sanitized.includes('\u201C') && !sanitized.includes('\u201D'), 'Should not have curly double quotes');
    assert(sanitized.includes("'Student's Performance' under \"Autonomous\" Regulations"));
  });

  await test('sanitizes emojis (trophy, bar chart, warning) to descriptive ASCII tags', () => {
    const input = '🏆 Outstanding Standing 📊 High Progress ⚠️ Review Needed';
    const sanitized = sanitizePdfText(input);
    assert(sanitized.includes('[Mastery]'), 'Should convert trophy to [Mastery]');
    assert(sanitized.includes('[Good]'), 'Should convert bar chart to [Good]');
    assert(sanitized.includes('[Notice]'), 'Should convert warning to [Notice]');
  });

  await test('properly escapes parentheses and backslashes for PDF Type 1 string literals', () => {
    const input = 'Course (B.Tech) \\ Section (A)';
    const sanitized = sanitizePdfText(input);
    assert(sanitized.includes('\\(') && sanitized.includes('\\)'), 'Parentheses must be escaped');
    assert(sanitized.includes('\\\\'), 'Backslashes must be escaped');
  });

  // -----------------------------------------------------------------------------
  // Area 2: PDF Binary Generation & Layout Adaptability
  // -----------------------------------------------------------------------------
  console.log('\n--- Area 2: PDF Binary Generation & Layout Adaptability ---');

  await test('generates valid PDF-1.4 header and trailer structure', () => {
    const pdfString = generateCalculatorPdfBinary({
      calculatorName: 'SGPA Calculator',
      score: '8.65',
      maxScale: '10'
    });
    assert(pdfString.startsWith('%PDF-1.4'), 'Must start with PDF 1.4 magic bytes');
    assert(pdfString.includes('trailer'), 'Must include trailer dictionary');
    assert(pdfString.includes('startxref'), 'Must include startxref pointer');
    assert(pdfString.endsWith('%%EOF\n') || pdfString.endsWith('%%EOF'), 'Must end with EOF marker');
  });

  await test('renders prominent result card without empty table shells when subjects array is empty', () => {
    const pdfString = generateCalculatorPdfBinary({
      calculatorName: 'Percentage Calculator',
      score: '82.50',
      maxScale: '100',
      metrics: [
        { label: 'Marks Obtained', value: '495' },
        { label: 'Total Marks', value: '600' },
        { label: 'Class', value: 'First Class with Distinction' }
      ]
    });

    assert(!pdfString.includes('(Total 0 - 0)'), 'Must not render empty total row');
    assert(!pdfString.includes('(Credit Pts) ET'), 'Must not render credit points header for non-subject calculator');
    assert(pdfString.includes('(82.50)'), 'Must render the actual calculated score');
    assert(pdfString.includes('(PERCENTAGE CALCULATOR)'), 'Must render calculator title');
    assert(pdfString.includes('(Marks Obtained)'), 'Must render genuine metric label');
    assert(pdfString.includes('(495)'), 'Must render genuine metric value');
  });

  await test('renders subject performance table when subjects are provided', () => {
    const pdfString = generateCalculatorPdfBinary({
      calculatorName: 'SGPA Calculator',
      score: '9.20',
      maxScale: '10',
      subjects: [
        { name: 'Data Structures', credits: 4, grade: 'A+', gradePoints: 9, creditPoints: 36 },
        { name: 'Computer Networks', credits: 3, grade: 'A', gradePoints: 8, creditPoints: 24 }
      ],
      metrics: [
        { label: 'Total Credits', value: '7' },
        { label: 'Total Points', value: '60' }
      ]
    });

    assert(pdfString.includes('(Data Structures)'), 'Must include first subject name');
    assert(pdfString.includes('(Computer Networks)'), 'Must include second subject name');
    assert(pdfString.includes('(Total)'), 'Must include total row');
    assert(pdfString.includes('(7)'), 'Must calculate and include total credits');
    assert(pdfString.includes('(60)'), 'Must calculate and include total credit points');
  });

  await test('uses genuine metrics passed in calcData instead of hardcoded defaults', () => {
    const pdfString = generateCalculatorPdfBinary({
      calculatorName: 'Grade Calculator',
      score: 'A+',
      maxScale: '10 Pts',
      metrics: [
        { label: 'Marks Range', value: '90 - 100' },
        { label: 'Grade Points', value: '10' }
      ]
    });

    assert(pdfString.includes('(Marks Range)'), 'Must include real Marks Range metric');
    assert(pdfString.includes('(90 - 100)'), 'Must include real 90 - 100 metric value');
    assert(!pdfString.includes('(173)'), 'Must NOT include hardcoded 173 dummy points');
  });

  await test('multi-page pagination activates gracefully for more than 8 subjects', () => {
    const tenSubjects = Array.from({ length: 12 }, (_, i) => ({
      name: `Course Module ${i + 1}`,
      credits: 3,
      grade: 'A',
      gradePoints: 8,
      creditPoints: 24
    }));

    const pdfString = generateCalculatorPdfBinary({
      calculatorName: 'CGPA Cumulative Scorecard',
      score: '8.40',
      maxScale: '10',
      subjects: tenSubjects
    });

    assert(pdfString.includes('/Count 2'), 'Must create 2 pages for 12 subjects');
    assert(pdfString.includes('(Page 2 of 2)'), 'Must include page 2 footer');
    assert(pdfString.includes('(Course Module 12)'), 'Must include 12th subject on page 2');
  });

  // -----------------------------------------------------------------------------
  // Area 3: Visual Result Card SVG & Image Pipeline
  // -----------------------------------------------------------------------------
  console.log('\n--- Area 3: Visual Result Card SVG & Image Pipeline ---');

  await test('builds clean, valid standalone SVG markup containing score, gauge, and branding', () => {
    const svg = buildResultCardSvg({
      toolName: 'SGPA Calculator',
      score: '8.65',
      maxScale: '10',
      standing: { text: 'Good Performance', narrative: 'Consistent academic standing.' },
      metrics: [
        { label: 'Total Credits', value: '20' },
        { label: 'Percentage', value: '82.5%' }
      ],
      metadata: {
        university: 'Osmania University',
        regulation: 'CBCS 2024',
        semester: 'Semester 4'
      }
    });

    assert(svg.startsWith('<svg'), 'Must produce valid SVG element');
    assert(svg.includes('Result<tspan fill="#FF6B00">Point</tspan>'), 'Must include ResultPoint logo typography');
    assert(svg.includes('8.65'), 'Must render score number');
    assert(svg.includes('out of 10'), 'Must render scale text');
    assert(svg.includes('Good Performance'), 'Must render standing text');
    assert(svg.includes('Osmania University'), 'Must render university metadata');
    assert(svg.includes('Total Credits'), 'Must render metric label');
    assert(svg.includes('Not an official university marksheet'), 'Must render disclaimer');
  });

  await test('calculates accurate circular gauge stroke offset corresponding to score fraction', () => {
    const svgHalf = buildResultCardSvg({ score: '5.0', maxScale: '10' });
    const svgFull = buildResultCardSvg({ score: '10.0', maxScale: '10' });

    assert(svgHalf.includes('stroke-dasharray="339.29'), 'Must contain gauge circumference');
    assert(svgHalf.includes('stroke-dashoffset="169.64'), 'Must compute 50% stroke offset');
    assert(svgFull.includes('stroke-dashoffset="0'), 'Must compute 100% stroke offset');
  });

  // -----------------------------------------------------------------------------
  // Area 4: URL Resolution & Localhost Handling
  // -----------------------------------------------------------------------------
  console.log('\n--- Area 4: URL Resolution & Localhost Handling ---');

  await test('identifies localhost and 127.0.0.1 origins as local preview URLs', () => {
    const local1 = resolveShareableUrl('http://localhost:5173/calculators/sgpa');
    const local2 = resolveShareableUrl('http://127.0.0.1:3000/calculators/cgpa');
    const prod = resolveShareableUrl('https://resultpoint.app/calculators/sgpa');

    assert(local1.isLocal === true, 'localhost must be flagged as local');
    assert(local2.isLocal === true, '127.0.0.1 must be flagged as local');
    assert(prod.isLocal === false, 'production domain must not be flagged as local');
  });

  await test('formats fallback share text with URL included AT MOST ONCE', () => {
    const summary = formatShareSummary({
      toolName: 'SGPA',
      score: '8.65',
      scaleText: 'out of 10',
      url: 'http://localhost:5173/calculators/sgpa'
    });

    const occurrences = (summary.match(/http:\/\/localhost:5173\/calculators\/sgpa/g) || []).length;
    assert.strictEqual(occurrences, 1, 'Localhost URL must appear at most ONCE in share summary');
    assert(summary.includes('Local Preview: http://localhost:5173/calculators/sgpa'), 'Local URL must be labeled as Local Preview');
    assert(!summary.includes('Calculate yours at: http://localhost:5173'), 'Localhost URL must not be presented as a public calculate link');
  });

  await test('formats public production URLs with "Calculate yours at:"', () => {
    const summary = formatShareSummary({
      toolName: 'CGPA',
      score: '9.10',
      scaleText: 'out of 10',
      url: 'https://resultpoint.app/calculators/cgpa'
    });

    assert(summary.includes('Calculate yours at: https://resultpoint.app/calculators/cgpa'));
    const occurrences = (summary.match(/https:\/\/resultpoint\.app\/calculators\/cgpa/g) || []).length;
    assert.strictEqual(occurrences, 1, 'Production URL must appear at most once');
  });

  // -----------------------------------------------------------------------------
  // Area 5: Share Calculation Result & Fallback Handling
  // -----------------------------------------------------------------------------
  console.log('\n--- Area 5: Web Share API & Image Fallback Workflow ---');

  await test('uses Web Share API file sharing when navigator.canShare({ files }) returns true', async () => {
    let sharedPayload = null;
    mockNavigator({
      canShare: (data) => !!(data && data.files),
      share: async (data) => {
        sharedPayload = data;
      }
    });

    globalThis.File = class MockFile {
      constructor(parts, name, opts) {
        this.parts = parts;
        this.name = name;
        this.type = opts?.type;
      }
    };

    const res = await shareCalculationResult({
      toolName: 'SGPA Calculator',
      score: '8.75',
      scaleText: 'out of 10',
      url: 'https://resultpoint.app/calculators/sgpa'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.method, 'file');
    assert(sharedPayload !== null, 'navigator.share must be invoked');
    assert(sharedPayload.files && sharedPayload.files.length === 1, 'Should share 1 image file');
    assert(sharedPayload.files[0].name.includes('SGPA'), 'Filename must include calculator name');
  });

  await test('handles Web Share API user cancellation without claiming false success', async () => {
    mockNavigator({
      canShare: () => true,
      share: async () => {
        const err = new Error('Share canceled by user');
        err.name = 'AbortError';
        throw err;
      }
    });

    const res = await shareCalculationResult({
      toolName: 'SGPA Calculator',
      score: '8.75'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.cancelled, true);
    assert.strictEqual(res.message, 'Share cancelled');
  });

  await test('triggers fallback to image download & clipboard when file sharing is unavailable', async () => {
    let copiedText = '';
    mockNavigator({
      canShare: () => false,
      share: undefined,
      clipboard: {
        writeText: async (t) => {
          copiedText = t;
        }
      }
    });

    const res = await shareCalculationResult({
      toolName: 'CGPA Evaluation',
      score: '9.40',
      scaleText: 'out of 10',
      url: 'https://resultpoint.app/calculators/cgpa'
    });

    assert.strictEqual(res.success, true);
    assert(copiedText.includes('9.40'), 'Clipboard must receive result summary');
    assert(copiedText.includes('CGPA Evaluation'), 'Clipboard must receive tool title');
  });

  // -----------------------------------------------------------------------------
  // Area 6: Multi-Calculator Result Variants Verification
  // -----------------------------------------------------------------------------
  console.log('\n--- Area 6: Multiple Public Calculator Variants ---');

  const testCalculators = [
    { name: 'SGPA Calculator', score: '8.50', scale: '10' },
    { name: 'CGPA Calculator', score: '8.92', scale: '10' },
    { name: 'GPA Calculator', score: '3.85', scale: '4.0' },
    { name: 'Percentage Calculator', score: '84.60', scale: '100' },
    { name: 'Grade Calculator', score: 'A+', scale: '10 Pts' },
    { name: 'Marks Converter', score: '8.25', scale: 'out of 10' },
    { name: 'Target CGPA', score: '8.80', scale: '10' },
    { name: 'Backlog Calculator', score: '2', scale: 'Active Backlogs' },
    { name: 'Result Analysis', score: '8.15', scale: 'Mean CGPA' }
  ];

  for (const calc of testCalculators) {
    await test(`generates valid PDF and SVG for ${calc.name}`, () => {
      const pdf = generateCalculatorPdfBinary({
        calculatorName: calc.name,
        score: calc.score,
        maxScale: calc.scale
      });
      assert(pdf.length > 2000, `PDF for ${calc.name} must have non-empty length`);
      assert(pdf.includes(calc.score), `PDF for ${calc.name} must include calculated score`);

      const svg = buildResultCardSvg({
        toolName: calc.name,
        score: calc.score,
        maxScale: calc.scale
      });
      assert(svg.includes(calc.score), `SVG for ${calc.name} must include calculated score`);
    });
  }

  // -----------------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All PDF export and visual card sharing tests PASSED successfully!\n');
  }
}

runTests();
