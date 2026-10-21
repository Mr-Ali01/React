/**
 * ResultPoint Calculator PDF Generation Service
 * Generates official, high-quality vector PDF Scorecards matching the ResultPoint design system.
 * Zero external binary dependencies; generates standard PDF-1.4 documents.
 */

// Helper to sanitize text for PDF Type1 fonts
const safePdfStr = (str) =>
  String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

/**
 * Builds the PDF binary document and triggers browser download.
 *
 * @param {Object} calcData
 * @param {string} calcData.calculatorType - e.g. 'CGPA', 'SGPA', 'GPA', 'Percentage', 'Grade', 'Credits', 'Target CGPA', 'Result Analysis', 'Backlog', 'Marks Convert'
 * @param {string} [calcData.title] - Document title e.g. 'CGPA Result Card'
 * @param {string} [calcData.subtitle] - Calculation subtitle
 * @param {string|number} calcData.score - Primary score value
 * @param {string} [calcData.scaleText] - e.g. 'out of 10'
 * @param {string} [calcData.university] - University name
 * @param {string} [calcData.regulation] - Regulation code
 * @param {string} [calcData.course] - Course/branch name
 * @param {string} [calcData.semester] - Semester label
 * @param {string} [calcData.calculationMethod] - Formula/method description
 * @param {Array} [calcData.metrics] - Key-value stat metrics
 * @param {Array} [calcData.subjects] - Array of subject/entry objects
 * @param {Array} [calcData.gradeSystem] - Grading scale definitions
 * @param {Object} [calcData.standing] - Academic standing status
 * @returns {Promise<{ success: boolean, filename?: string, error?: string }>}
 */
export async function downloadCalculatorPdf(calcData = {}) {
  try {
    const pdfBinaryString = generateCalculatorPdfBinary(calcData);
    const blob = new Blob([pdfBinaryString], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const toolSanitized = (calcData.calculatorType || 'Academic')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_');
    const filename = `ResultPoint_${toolSanitized}_Result.pdf`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 10000);

    return { success: true, filename };
  } catch (err) {
    console.error('PDF Generation Error:', err);
    return { success: false, error: err.message || 'Failed to generate PDF.' };
  }
}

/**
 * Generates the raw PDF 1.4 binary string for a calculator scorecard.
 */
export function generateCalculatorPdfBinary(calcData = {}) {
  const encoder = new TextEncoder();

  const meta = calcData.metadata || {};
  const toolName = calcData.calculatorType || calcData.calculatorName || 'Academic';
  const displayTitle = calcData.title || (calcData.calculatorName ? calcData.calculatorName : `${toolName} Result Card`);
  const subtitle = calcData.subtitle || 'Calculated using your subject credits and grades';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const university = calcData.university || meta.university || 'JNTU Hyderabad';
  const regulation = calcData.regulation || meta.regulation || 'R18';
  const course = calcData.course || meta.course || 'B.Tech - Computer Science';
  const semester = calcData.semester || meta.semester || 'Semester 4';
  const method = calcData.calculationMethod || meta.calculationMethod || 'Weighted Average (Credit Based)';

  const scoreVal = String(calcData.score !== undefined ? calcData.score : '0.00');
  const scaleText = calcData.scaleText || (calcData.maxScale ? (String(calcData.maxScale).startsWith('out of') ? calcData.maxScale : `out of ${calcData.maxScale}`) : (calcData.scale ? `out of ${calcData.scale}` : 'out of 10'));
  const scoreLabel = calcData.scoreLabel || `Calculated ${toolName}`;

  const metrics = Array.isArray(calcData.metrics) ? calcData.metrics : [];
  const subjects = Array.isArray(calcData.subjects) ? calcData.subjects : (Array.isArray(calcData.subjectRows) ? calcData.subjectRows : []);
  const gradeSystem = calcData.gradeSystem || [
    { grade: 'S', points: 10, desc: 'Outstanding' },
    { grade: 'A+', points: 9, desc: 'Excellent' },
    { grade: 'A', points: 8, desc: 'Very Good' },
    { grade: 'B+', points: 7, desc: 'Good' },
    { grade: 'B', points: 6, desc: 'Above Avg' },
    { grade: 'C', points: 5, desc: 'Average' },
    { grade: 'D', points: 4, desc: 'Pass' },
    { grade: 'F', points: 0, desc: 'Fail' },
  ];

  const pagesStreamOps = [];
  const page1Ops = [];

  page1Ops.push('q');

  // --- Outer Border Frame ---
  page1Ops.push('0.92 0.94 0.97 RG 1 w');
  page1Ops.push('25 25 545 792 re s');

  // --- 1. HEADER (Logo & Branding) ---
  // Logo Icon Box
  page1Ops.push('1.0 0.42 0.0 rg');
  page1Ops.push('40 762 34 34 re f');

  // Logo Cap Vector Symbol
  page1Ops.push('1.0 1.0 1.0 rg 1.0 1.0 1.0 RG 1.5 w');
  page1Ops.push('57 786 m 45 779 l 57 773 l 69 779 l 57 786 l b');
  page1Ops.push('51 776 m 51 770 l 57 767 l 63 770 l 63 776 l s');
  page1Ops.push('67 779 m 67 770 l s');

  // Brand Name
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push('BT /F2 18 Tf 82 780 Td (Result) ET');
  page1Ops.push('1.0 0.42 0.0 rg');
  page1Ops.push('BT /F2 18 Tf 134 780 Td (Point) ET');
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push('BT /F1 8.5 Tf 82 768 Td (Calculate. Analyze. Improve.) ET');

  // Right Header: Website & Tagline
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push('BT /F2 10.5 Tf 455 780 Td (resultpoint.app) ET');
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push('BT /F1 8 Tf 435 768 Td (Your Academic Companion) ET');

  // Header Divider Line
  page1Ops.push('0.88 0.91 0.94 RG 1 w');
  page1Ops.push('40 750 515 0 re s');

  // --- 2. TITLE SECTION & DATE BOX ---
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push(`BT /F2 19 Tf 40 722 Td (${safePdfStr(displayTitle)}) ET`);
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push(`BT /F1 9 Tf 40 708 Td (${safePdfStr(subtitle)}) ET`);

  // Date Box on Right
  page1Ops.push('0.97 0.98 0.99 rg 405 698 150 42 re f');
  page1Ops.push('0.88 0.91 0.94 RG 1 w 405 698 150 42 re s');
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push('BT /F2 8.5 Tf 438 726 Td (Date & Time) ET');
  page1Ops.push(`BT /F2 9.5 Tf 438 713 Td (${safePdfStr(dateStr)}) ET`);
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push(`BT /F1 8.5 Tf 438 703 Td (${safePdfStr(timeStr)}) ET`);
  // Mini Calendar Badge
  page1Ops.push('1.0 0.42 0.0 rg 415 710 16 16 re f');
  page1Ops.push('1.0 1.0 1.0 rg BT /F2 7 Tf 417 714 Td (CAL) ET');

  // --- 3. ACADEMIC METADATA PILLS GRID (2 cols x 3 rows) ---
  page1Ops.push('0.97 0.98 0.99 rg 40 615 515 74 re f');
  page1Ops.push('0.88 0.91 0.94 RG 1 w 40 615 515 74 re s');

  // Col 1
  page1Ops.push('0.39 0.45 0.55 rg BT /F1 8 Tf 55 673 Td (University) ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9.5 Tf 55 661 Td (${safePdfStr(university)}) ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 8 Tf 55 645 Td (Regulation) ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9.5 Tf 55 633 Td (${safePdfStr(regulation)}) ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 8 Tf 55 617 Td (Course / Program) ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9.5 Tf 135 617 Td (${safePdfStr(course)}) ET`);

  // Col 2
  page1Ops.push('0.39 0.45 0.55 rg BT /F1 8 Tf 320 673 Td (Semester / Term) ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9.5 Tf 320 661 Td (${safePdfStr(semester)}) ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 8 Tf 320 645 Td (Calculation Method) ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9.5 Tf 320 633 Td (${safePdfStr(method)}) ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 8 Tf 320 617 Td (Total Entries / Subjects) ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9.5 Tf 425 617 Td (${subjects.length || metrics.length || 1}) ET`);

  // --- 4. BREAKDOWN TABLE (Adapted dynamically for calculator type) ---
  const tableTopY = 595;
  const rowHeight = 18;
  let curY = tableTopY;

  // Determine Table Schema based on calculator type
  const isPercentageCalc = toolName.toLowerCase().includes('percentage');
  const isCreditsCalc = toolName.toLowerCase().includes('credits');
  const isBacklogCalc = toolName.toLowerCase().includes('backlog');
  const isAnalysisCalc = toolName.toLowerCase().includes('analysis');
  const isGradeCalc = toolName.toLowerCase().includes('grade') && !toolName.toLowerCase().includes('cgpa') && !toolName.toLowerCase().includes('sgpa');
  const isConvertCalc = toolName.toLowerCase().includes('convert');
  const isTargetCalc = toolName.toLowerCase().includes('target');

  let totalCreditsSum = 0;
  let totalCreditPointsSum = 0;

  if (isPercentageCalc) {
    // Percentage Table Header
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (#) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 75 ${curY - 14} Td (Subject Name) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 270 ${curY - 14} Td (Max Marks) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 350 ${curY - 14} Td (Obtained) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 430 ${curY - 14} Td (Percentage) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 500 ${curY - 14} Td (Grade) ET`);
    curY -= 20;

    let totMax = 0;
    let totObt = 0;
    const pageRows = subjects.slice(0, 8);
    pageRows.forEach((sub, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      const maxM = Number(sub.maxMarks) || 100;
      const obtM = Number(sub.obtainedMarks) || 0;
      const pct = maxM > 0 ? ((obtM / maxM) * 100).toFixed(1) + '%' : '0%';
      totMax += maxM;
      totObt += obtM;

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${curY + 5} Td (${idx + 1}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 75 ${curY + 5} Td (${safePdfStr(sub.name || `Subject ${idx + 1}`).substring(0, 32)}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8.5 Tf 280 ${curY + 5} Td (${maxM}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 360 ${curY + 5} Td (${obtM}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 435 ${curY + 5} Td (${pct}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 505 ${curY + 5} Td (${safePdfStr(sub.grade || 'A')}) ET`);
    });

    curY -= rowHeight;
    page1Ops.push(`0.95 0.96 0.98 rg 40 ${curY} 515 ${rowHeight} re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 1 w 40 ${curY} 515 ${rowHeight} re s`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 200 ${curY + 5} Td (Total) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 280 ${curY + 5} Td (${totMax}) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 360 ${curY + 5} Td (${totObt}) ET`);
    page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 435 ${curY + 5} Td (${totMax > 0 ? ((totObt / totMax) * 100).toFixed(2) + '%' : '-'}) ET`);
  } else if (isCreditsCalc) {
    // Credits Table Header
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (#) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 75 ${curY - 14} Td (Subject Title) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 320 ${curY - 14} Td (Credits) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 430 ${curY - 14} Td (Category) ET`);
    curY -= 20;

    let totCredits = 0;
    const pageRows = subjects.slice(0, 8);
    pageRows.forEach((sub, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      const cr = Number(sub.credits) || 0;
      totCredits += cr;

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${curY + 5} Td (${idx + 1}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 75 ${curY + 5} Td (${safePdfStr(sub.name || `Subject ${idx + 1}`).substring(0, 36)}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 330 ${curY + 5} Td (${cr}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 435 ${curY + 5} Td (${safePdfStr(sub.category || 'Core')}) ET`);
    });

    curY -= rowHeight;
    page1Ops.push(`0.95 0.96 0.98 rg 40 ${curY} 515 ${rowHeight} re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 1 w 40 ${curY} 515 ${rowHeight} re s`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 260 ${curY + 5} Td (Total Credits) ET`);
    page1Ops.push(`1.0 0.42 0.0 rg BT /F2 9 Tf 330 ${curY + 5} Td (${totCredits}) ET`);
  } else if (isBacklogCalc) {
    // Backlog Table Header
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (#) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 75 ${curY - 14} Td (Backlog Subject) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 270 ${curY - 14} Td (Semester) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 340 ${curY - 14} Td (Credits) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 410 ${curY - 14} Td (Study Plan / Recommendation) ET`);
    curY -= 20;

    let totCredits = 0;
    const pageRows = subjects.slice(0, 8);
    pageRows.forEach((sub, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      const cr = Number(sub.credits) || 0;
      totCredits += cr;

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${curY + 5} Td (${idx + 1}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 75 ${curY + 5} Td (${safePdfStr(sub.name).substring(0, 30)}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 270 ${curY + 5} Td (${safePdfStr(sub.semester)}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 350 ${curY + 5} Td (${cr}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F1 7.5 Tf 410 ${curY + 5} Td (${safePdfStr(sub.recommendation || 'Practice past question sets').substring(0, 24)}) ET`);
    });

    curY -= rowHeight;
    page1Ops.push(`0.95 0.96 0.98 rg 40 ${curY} 515 ${rowHeight} re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 1 w 40 ${curY} 515 ${rowHeight} re s`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 200 ${curY + 5} Td (Total Backlog Credits) ET`);
    page1Ops.push(`1.0 0.42 0.0 rg BT /F2 9 Tf 350 ${curY + 5} Td (${totCredits}) ET`);
  } else if (isAnalysisCalc) {
    // Result Analysis Semesters Table
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (Sem) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 110 ${curY - 14} Td (SGPA) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 220 ${curY - 14} Td (Credits) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 340 ${curY - 14} Td (Status) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 450 ${curY - 14} Td (Standing) ET`);
    curY -= 20;

    const pageRows = subjects.slice(0, 8);
    pageRows.forEach((sub, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      const sgpa = sub.sgpa !== '' && sub.sgpa !== null ? Number(sub.sgpa).toFixed(2) : '-';
      const st = safePdfStr(sub.status || 'Cleared');

      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 50 ${curY + 5} Td (Sem ${sub.sem}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 115 ${curY + 5} Td (${sgpa}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8.5 Tf 230 ${curY + 5} Td (${sub.credits || '-'}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 340 ${curY + 5} Td (${st}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 450 ${curY + 5} Td (${st === 'Cleared' ? 'Pass' : st}) ET`);
    });
  } else if (isGradeCalc) {
    // Single Grade Evaluation Breakdown
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (Parameter) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 240 ${curY - 14} Td (Value) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 380 ${curY - 14} Td (Evaluation Standard) ET`);
    curY -= 20;

    const gradeRows = [
      { param: 'Obtained Marks', val: `${calcData.details?.obtainedMarks || calcData.score || 85}`, std: 'Student Input' },
      { param: 'Maximum Marks', val: `${calcData.details?.maxMarks || 100}`, std: 'Examination Maximum' },
      { param: 'Calculated Percentage', val: `${calcData.details?.percentage || '85.00'}%`, std: 'Proportional Score' },
      { param: 'Awarded Letter Grade', val: `${calcData.details?.grade || calcData.score || 'A+'}`, std: 'University Grade Matrix' },
      { param: 'Grade Points', val: `${calcData.details?.points || '9'} Pts`, std: '10-Point Scale Value' },
      { param: 'Academic Performance', val: `${calcData.details?.performance || calcData.standing?.text || 'Excellent'}`, std: 'Standing Descriptor' },
    ];

    gradeRows.forEach((r, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 50 ${curY + 5} Td (${safePdfStr(r.param)}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 240 ${curY + 5} Td (${safePdfStr(r.val)}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 380 ${curY + 5} Td (${safePdfStr(r.std)}) ET`);
    });
  } else if (isTargetCalc) {
    // Target Planning Breakdown Table
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (Calculation Parameter) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 280 ${curY - 14} Td (Value) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 400 ${curY - 14} Td (Algebraic Derivation) ET`);
    curY -= 20;

    const targetRows = [
      { p: 'Total Course Credits (A)', v: String(calcData.details?.totalCourseCredits || 160), d: 'Full Degree Requirement' },
      { p: 'Completed Credits (B)', v: String(calcData.details?.completedCredits || 80), d: 'Accumulated to Date' },
      { p: 'Remaining Credits (C = A - B)', v: String(calcData.details?.remainingCredits || 80), d: 'Pending Semester Credits' },
      { p: 'Current Cumulative CGPA (D)', v: String(calcData.details?.currentCgpa || '7.50'), d: 'Current Performance' },
      { p: 'Target Graduation CGPA (T)', v: String(calcData.details?.targetCgpa || '8.50'), d: 'Desired Graduation Target' },
      { p: 'Required Average (Remaining)', v: String(calcData.score || '9.50'), d: '[(T x A) - (D x B)] / C' },
    ];

    targetRows.forEach((r, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 50 ${curY + 5} Td (${safePdfStr(r.p)}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 280 ${curY + 5} Td (${safePdfStr(r.v)}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 400 ${curY + 5} Td (${safePdfStr(r.d)}) ET`);
    });
  } else if (isConvertCalc) {
    // Marks Convert Breakdown Table
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (Conversion Step) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 220 ${curY - 14} Td (Expression / Value) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 380 ${curY - 14} Td (Regulation Note) ET`);
    curY -= 20;

    const convertRows = [
      { s: 'Conversion Model', e: String(calcData.details?.conversionName || toolName), n: 'Official CBCS Scale' },
      { s: 'Input Value', e: String(calcData.details?.inputDisplay || '-'), n: 'User Provided Score' },
      { s: 'Converted Output', e: String(calcData.details?.outputDisplay || calcData.score || '-'), n: 'Normalized Value' },
      { s: 'Applied Formula', e: String(calcData.details?.formula || '-'), n: 'Official University Formula' },
      { s: 'Calculation Step', e: String(calcData.details?.calculation || '-'), n: 'Resolved Equation' },
    ];

    convertRows.forEach((r, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 50 ${curY + 5} Td (${safePdfStr(r.s)}) ET`);
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 220 ${curY + 5} Td (${safePdfStr(r.e).substring(0, 32)}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 380 ${curY + 5} Td (${safePdfStr(r.n).substring(0, 24)}) ET`);
    });
  } else {
    // Default Subject-Based Layout (CGPA, SGPA, GPA)
    page1Ops.push('0.06 0.09 0.16 rg 40 ' + (curY - 20) + ' 515 20 re f');
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY - 14} Td (#) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 75 ${curY - 14} Td (Subject Name) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 315 ${curY - 14} Td (Credits) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 375 ${curY - 14} Td (Grade) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 435 ${curY - 14} Td (Grade Pts) ET`);
    page1Ops.push(`BT /F2 8.5 Tf 495 ${curY - 14} Td (Credit Pts) ET`);
    curY -= 20;

    const maxRowsPage1 = 8;
    const page1Subjects = subjects.slice(0, maxRowsPage1);

    page1Subjects.forEach((sub, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      const cr = Number(sub.credits) || 0;
      const pts = Number(sub.points !== undefined ? sub.points : (sub.gradePoints || 0));
      const crPts = cr * pts;
      totalCreditsSum += cr;
      totalCreditPointsSum += crPts;

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${curY + 5} Td (${idx + 1}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 75 ${curY + 5} Td (${safePdfStr(sub.name || `Subject ${idx + 1}`).substring(0, 36)}) ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8.5 Tf 325 ${curY + 5} Td (${cr}) ET`);

      const gr = safePdfStr(sub.grade || 'A');
      if (gr === 'S' || gr === 'A+' || gr === 'A' || gr === 'O') {
        page1Ops.push(`0.85 0.96 0.88 rg 370 ${curY + 2} 24 14 re f`);
        page1Ops.push('0.10 0.55 0.20 rg');
      } else if (gr.startsWith('B')) {
        page1Ops.push(`1.0 0.95 0.82 rg 370 ${curY + 2} 24 14 re f`);
        page1Ops.push('0.85 0.45 0.0 rg');
      } else if (gr === 'F') {
        page1Ops.push(`1.0 0.88 0.88 rg 370 ${curY + 2} 24 14 re f`);
        page1Ops.push('0.80 0.10 0.15 rg');
      } else {
        page1Ops.push(`0.90 0.94 1.0 rg 370 ${curY + 2} 24 14 re f`);
        page1Ops.push('0.10 0.35 0.75 rg');
      }
      page1Ops.push(`BT /F2 8 Tf 376 ${curY + 5} Td (${gr}) ET`);

      page1Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 445 ${curY + 5} Td (${pts}) ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 505 ${curY + 5} Td (${crPts}) ET`);
    });

    // Total Row
    curY -= rowHeight;
    page1Ops.push(`0.95 0.96 0.98 rg 40 ${curY} 515 ${rowHeight} re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 1 w 40 ${curY} 515 ${rowHeight} re s`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 265 ${curY + 5} Td (Total) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 325 ${curY + 5} Td (${totalCreditsSum}) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 445 ${curY + 5} Td (-) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 505 ${curY + 5} Td (${totalCreditPointsSum}) ET`);
  }

  // --- 5. RESULT HIGHLIGHT CARD & METRICS ---
  curY -= 14;
  const resultCardH = 76;
  const resultCardY = curY - resultCardH;

  // Left: Vibrant Orange Result Card
  page1Ops.push(`1.0 0.42 0.0 rg 40 ${resultCardY} 190 ${resultCardH} re f`);
  page1Ops.push('1.0 1.0 1.0 rg');
  page1Ops.push(`BT /F2 9.5 Tf 60 ${resultCardY + 58} Td (${safePdfStr(scoreLabel).toUpperCase()}) ET`);
  page1Ops.push(`BT /F2 28 Tf 60 ${resultCardY + 28} Td (${safePdfStr(scoreVal)}) ET`);
  page1Ops.push(`BT /F1 8.5 Tf 60 ${resultCardY + 14} Td (${safePdfStr(scaleText)}) ET`);

  // Right: 4 Metric Cards (2x2 grid)
  const metricBoxW = 155;
  const metricBoxH = 34;
  const metricStartX = 240;

  const defaultMetrics = [
    { label: 'Total Credits', value: String(totalCreditsSum || 22) },
    { label: 'Total Points', value: String(totalCreditPointsSum || 173) },
    { label: 'Percentage', value: `${(Number(scoreVal) * 9.5).toFixed(1)}%` },
    { label: 'Status', value: calcData.standing?.text || 'Good' },
  ];
  const displayMetrics = metrics.length >= 4 ? metrics.slice(0, 4) : defaultMetrics;

  displayMetrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const boxX = metricStartX + col * (metricBoxW + 10);
    const boxY = resultCardY + (1 - row) * (metricBoxH + 8);

    page1Ops.push(`0.97 0.98 0.99 rg ${boxX} ${boxY} ${metricBoxW} ${metricBoxH} re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 1 w ${boxX} ${boxY} ${metricBoxW} ${metricBoxH} re s`);

    page1Ops.push(`0.39 0.45 0.55 rg BT /F1 7 Tf ${boxX + 10} ${boxY + 21} Td (${safePdfStr(m.label)}) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 12 Tf ${boxX + 10} ${boxY + 7} Td (${safePdfStr(m.value)}) ET`);
  });

  // --- 6. GRADE SYSTEM BANNER ---
  const gradeSystemY = resultCardY - 56;
  page1Ops.push(`0.99 0.97 0.94 rg 40 ${gradeSystemY} 515 48 re f`);
  page1Ops.push(`0.95 0.90 0.82 RG 1 w 40 ${gradeSystemY} 515 48 re s`);

  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 50 ${gradeSystemY + 35} Td (Grade System Reference \\(${safePdfStr(regulation)}\\)) ET`);

  const numGrades = gradeSystem.length;
  const gradeSlotW = 495 / numGrades;
  gradeSystem.forEach((g, idx) => {
    const slotX = 50 + idx * gradeSlotW;
    const slotY = gradeSystemY + 7;
    page1Ops.push(`1.0 1.0 1.0 rg ${slotX} ${slotY} ${gradeSlotW - 6} 24 re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 0.5 w ${slotX} ${slotY} ${gradeSlotW - 6} 24 re s`);

    page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8 Tf ${slotX + 4} ${slotY + 14} Td (${safePdfStr(g.grade)}) ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 7.5 Tf ${slotX + 20} ${slotY + 14} Td (${safePdfStr(g.points)}) ET`);
    page1Ops.push(`0.39 0.45 0.55 rg BT /F1 6.5 Tf ${slotX + 4} ${slotY + 4} Td (${safePdfStr(g.desc)}) ET`);
  });

  // --- 7. FOOTER (Official Disclaimer) ---
  const footerY = 35;
  page1Ops.push(`0.94 0.98 1.0 rg 40 ${footerY} 515 38 re f`);
  page1Ops.push(`0.75 0.88 0.98 RG 1 w 40 ${footerY} 515 38 re s`);

  // Blue Info Icon
  page1Ops.push(`0.01 0.52 0.78 rg 48 ${footerY + 12} 14 14 re f`);
  page1Ops.push(`1.0 1.0 1.0 rg BT /F2 8.5 Tf 53 ${footerY + 15} Td (i) ET`);

  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 70 ${footerY + 23} Td (Calculated by ResultPoint — not an official university marksheet.) ET`);
  page1Ops.push(`0.15 0.35 0.55 rg BT /F1 7.5 Tf 70 ${footerY + 11} Td (This academic result scorecard is computed strictly based on data provided by the user.) ET`);

  // Right Branding
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 10.5 Tf 460 ${footerY + 20} Td (Result) ET`);
  page1Ops.push(`1.0 0.42 0.0 rg BT /F2 10.5 Tf 492 ${footerY + 20} Td (Point) ET`);
  page1Ops.push(`0.39 0.45 0.55 rg BT /F1 7 Tf 460 ${footerY + 9} Td (resultpoint.app) ET`);

  page1Ops.push('Q');
  pagesStreamOps.push(page1Ops);

  // Check if Page 2 is needed for remaining subjects (> 8 rows)
  if (subjects.length > 8) {
    const page2Ops = [];
    page2Ops.push('q');
    page2Ops.push('0.92 0.94 0.97 RG 1 w 25 25 545 792 re s');

    // Page 2 Header
    page2Ops.push('0.06 0.09 0.16 rg BT /F2 13 Tf 40 780 Td (ResultPoint) ET');
    page2Ops.push(`0.39 0.45 0.55 rg BT /F1 9 Tf 115 780 Td (- ${safePdfStr(displayTitle)} \\(Continued\\)) ET`);
    page2Ops.push('0.88 0.91 0.94 RG 1 w 40 770 515 0 re s');

    let p2Y = 750;
    // Table Header
    page2Ops.push('0.06 0.09 0.16 rg 40 ' + (p2Y - 20) + ' 515 20 re f');
    page2Ops.push('1.0 1.0 1.0 rg');
    page2Ops.push(`BT /F2 8.5 Tf 48 ${p2Y - 14} Td (#) ET`);
    page2Ops.push(`BT /F2 8.5 Tf 75 ${p2Y - 14} Td (Subject Name) ET`);
    page2Ops.push(`BT /F2 8.5 Tf 315 ${p2Y - 14} Td (Credits) ET`);
    page2Ops.push(`BT /F2 8.5 Tf 375 ${p2Y - 14} Td (Grade) ET`);
    page2Ops.push(`BT /F2 8.5 Tf 435 ${p2Y - 14} Td (Grade Pts) ET`);
    page2Ops.push(`BT /F2 8.5 Tf 495 ${p2Y - 14} Td (Credit Pts) ET`);
    p2Y -= 20;

    const remainingSubjects = subjects.slice(8);
    remainingSubjects.forEach((sub, idx) => {
      p2Y -= rowHeight;
      const actualIdx = 8 + idx;
      if (idx % 2 === 1) page2Ops.push(`0.97 0.98 0.99 rg 40 ${p2Y} 515 ${rowHeight} re f`);
      page2Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${p2Y} 515 ${rowHeight} re s`);

      const cr = Number(sub.credits) || 0;
      const pts = Number(sub.points !== undefined ? sub.points : (sub.gradePoints || 0));
      const crPts = cr * pts;

      page2Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${p2Y + 5} Td (${actualIdx + 1}) ET`);
      page2Ops.push(`0.06 0.09 0.16 rg BT /F2 8 Tf 75 ${p2Y + 5} Td (${safePdfStr(sub.name || `Subject ${actualIdx + 1}`).substring(0, 36)}) ET`);
      page2Ops.push(`0.39 0.45 0.55 rg BT /F1 8.5 Tf 325 ${p2Y + 5} Td (${cr}) ET`);

      const gr = safePdfStr(sub.grade || 'A');
      page2Ops.push('1.0 0.42 0.0 rg');
      page2Ops.push(`BT /F2 8 Tf 376 ${p2Y + 5} Td (${gr}) ET`);

      page2Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 445 ${p2Y + 5} Td (${pts}) ET`);
      page2Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 505 ${p2Y + 5} Td (${crPts}) ET`);
    });

    // Page 2 Footer
    page2Ops.push('0.88 0.91 0.94 RG 1 w 40 60 515 0 re s');
    page2Ops.push('0.39 0.45 0.55 rg');
    page2Ops.push(`BT /F1 8 Tf 40 45 Td (Calculated by ResultPoint - not an official university marksheet.) ET`);
    page2Ops.push('BT /F1 8 Tf 480 45 Td (Page 2 of 2) ET');

    page2Ops.push('Q');
    pagesStreamOps.push(page2Ops);
  }

  // Compile Objects and Byte Offsets
  const objects = [];
  const numPages = pagesStreamOps.length;
  const pageObjectIds = [];
  const contentObjectIds = [];

  let nextId = 6;
  for (let i = 0; i < numPages; i++) {
    pageObjectIds.push(nextId++);
    contentObjectIds.push(nextId++);
  }

  objects.push({ id: 1, content: `<< /Type /Catalog /Pages 2 0 R >>` });
  objects.push({ id: 2, content: `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${numPages} >>` });
  objects.push({ id: 3, content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>` });
  objects.push({ id: 4, content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>` });
  objects.push({ id: 5, content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>` });

  for (let i = 0; i < numPages; i++) {
    const pageId = pageObjectIds[i];
    const contentId = contentObjectIds[i];
    const streamContent = pagesStreamOps[i].join('\n');
    const streamBytes = encoder.encode(streamContent);

    objects.push({
      id: pageId,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`,
    });

    objects.push({
      id: contentId,
      content: `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream`,
    });
  }

  let offset = 9;
  const body = ['%PDF-1.4\n'];
  const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];

  objects.sort((a, b) => a.id - b.id);

  for (const obj of objects) {
    const objHeader = `${obj.id} 0 obj\n`;
    const objFooter = `\nendobj\n`;
    const fullObj = `${objHeader}${obj.content}${objFooter}`;

    const paddedOffset = String(offset).padStart(10, '0');
    xref.push(`${paddedOffset} 00000 n \n`);
    body.push(fullObj);
    offset += encoder.encode(fullObj).length;
  }

  const startXref = offset;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return body.join('') + xref.join('') + trailer;
}

export { generateCalculatorPdfBinary as generateCalculatorPdf };

export const calculatorPdfService = {
  downloadCalculatorPdf,
  generateCalculatorPdfBinary,
  generateCalculatorPdf: generateCalculatorPdfBinary,
};

export default calculatorPdfService;
