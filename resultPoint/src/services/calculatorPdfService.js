/**
 * ResultPoint Calculator PDF Generation Service
 * Generates official, high-quality vector PDF Scorecards matching the ResultPoint design system.
 * Zero external binary dependencies; generates standard PDF-1.4 documents.
 *
 * Fixes:
 * - Robust ASCII text sanitization for Type 1 fonts (eliminates glyph drop / missing text)
 * - Dynamic layout: never renders empty table shells with "Total 0 - 0" or blank voids when subjects are absent
 * - Uses genuine calculation metrics instead of hardcoded fallback numbers
 * - Centers the visual Result Card prominently on the page
 */

const ASCII_MAP = {
  '\u2014': ' - ', // em-dash
  '\u2013': ' - ', // en-dash
  '\u2018': "'",   // left single quote
  '\u2019': "'",   // right single quote
  '\u201C': '"',   // left double quote
  '\u201D': '"',   // right double quote
  '\u2022': '*',   // bullet
  '\u2026': '...', // ellipsis
  '\u00A0': ' ',   // non-breaking space
  '🏆': '[Mastery] ',
  '📊': '[Good] ',
  '📈': '[Progress] ',
  '⚖️': '[Average] ',
  '⚠️': '[Notice] ',
  '✓': '[Pass] ',
  '★': '*',
};

/**
 * Sanitizes input text for standard PDF Type 1 Helvetica font streams.
 * Replaces non-ASCII symbols with clean ASCII and escapes PDF parentheses.
 */
export function sanitizePdfText(str) {
  let s = String(str ?? '');
  for (const [char, repl] of Object.entries(ASCII_MAP)) {
    s = s.replaceAll(char, repl);
  }
  // Strip any remaining non-printable or non-ASCII characters that break Type 1 fonts
  s = s.replace(/[^\x20-\x7E]/g, '');
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

const safePdfStr = sanitizePdfText;

/**
 * Builds the PDF binary document and triggers browser download.
 */
export async function downloadCalculatorPdf(calcData = {}) {
  try {
    const pdfBinaryString = generateCalculatorPdfBinary(calcData);
    const blob = new Blob([pdfBinaryString], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const toolName = calcData.calculatorName || calcData.calculatorType || 'Academic';
    const toolSanitized = toolName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_');
    const filename = calcData.filename || `ResultPoint_${toolSanitized}_Result.pdf`;

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
  const toolName = calcData.calculatorName || calcData.calculatorType || 'Academic Calculator';
  const displayTitle = calcData.title || calcData.calculatorName || `${toolName} Result Card`;
  const subtitle = calcData.subtitle || 'Academic calculation evaluated based on provided parameters';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const university = calcData.university || meta.university || 'ResultPoint Academic Portal';
  const regulation = calcData.regulation || meta.regulation || 'CBCS';
  const course = calcData.course || meta.course || 'Undergraduate Curriculum';
  const semester = calcData.semester || meta.semester || 'Current Term';
  const method = calcData.calculationMethod || meta.calculationMethod || 'Standard Weighted Average';

  const scoreVal = String(calcData.score !== undefined ? calcData.score : '0.00');
  const scaleText = calcData.scaleText || (calcData.maxScale ? `out of ${calcData.maxScale}` : (calcData.scale ? `out of ${calcData.scale}` : 'out of 10'));
  const scoreLabel = calcData.scoreLabel || toolName.toUpperCase();

  const rawMetrics = Array.isArray(calcData.metrics) ? calcData.metrics : [];
  const metrics = rawMetrics.filter((m) => m && (m.label || m.name) && m.value !== undefined);

  const rawSubjects = Array.isArray(calcData.subjects)
    ? calcData.subjects
    : (Array.isArray(calcData.subjectRows) ? calcData.subjectRows : []);

  // Filter out empty or placeholder rows
  const subjects = rawSubjects.filter((s) => s && (s.name || s.param || s.credits !== undefined || s.val !== undefined));

  const hasSubjects = subjects.length > 0;

  const standingText = typeof calcData.standing === 'object' ? calcData.standing?.text : (calcData.standing || 'Good Performance');
  const standingNarrative = typeof calcData.standing === 'object' ? calcData.standing?.narrative : 'Evaluation completed successfully.';

  const pagesStreamOps = [];
  const page1Ops = [];

  page1Ops.push('q');

  // --- Outer Border Frame ---
  page1Ops.push('0.92 0.94 0.97 RG 1 w');
  page1Ops.push('25 25 545 792 re s');

  // --- 1. HEADER (Logo & Branding) ---
  // Logo Icon Box (Orange)
  page1Ops.push('1.0 0.42 0.0 rg');
  page1Ops.push('40 762 34 34 re f');

  // Logo Cap Vector Symbol
  page1Ops.push('1.0 1.0 1.0 rg 1.0 1.0 1.0 RG 1.5 w');
  page1Ops.push('57 786 m 45 779 l 57 773 l 69 779 l 57 786 l b');
  page1Ops.push('51 776 m 51 770 l 57 767 l 63 770 l 63 776 l s');
  page1Ops.push('67 779 m 67 770 l S');

  // Brand Name
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push('BT /F2 18 Tf 82 780 Td (Result) Tj ET');
  page1Ops.push('1.0 0.42 0.0 rg');
  page1Ops.push('BT /F2 18 Tf 134 780 Td (Point) Tj ET');
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push('BT /F1 8.5 Tf 82 768 Td (Calculate. Analyze. Improve.) Tj ET');

  // Right Header: Website & Tagline
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push('BT /F2 10.5 Tf 455 780 Td (resultpoint.app) Tj ET');
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push('BT /F1 8 Tf 435 768 Td (Your Academic Companion) Tj ET');

  // Header Divider Line (Using standard moveto/lineto stroke)
  page1Ops.push('0.88 0.91 0.94 RG 1 w');
  page1Ops.push('40 750 m 555 750 l S');

  // --- 2. TITLE SECTION & DATE BOX ---
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push(`BT /F2 18 Tf 40 722 Td (${safePdfStr(displayTitle)}) Tj ET`);
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push(`BT /F1 9 Tf 40 708 Td (${safePdfStr(subtitle)}) Tj ET`);

  // Date Box on Right
  page1Ops.push('0.97 0.98 0.99 rg 405 698 150 42 re f');
  page1Ops.push('0.88 0.91 0.94 RG 1 w 405 698 150 42 re s');
  page1Ops.push('0.06 0.09 0.16 rg');
  page1Ops.push('BT /F2 8.5 Tf 438 726 Td (Date & Time) Tj ET');
  page1Ops.push(`BT /F2 9.5 Tf 438 713 Td (${safePdfStr(dateStr)}) Tj ET`);
  page1Ops.push('0.39 0.45 0.55 rg');
  page1Ops.push(`BT /F1 8.5 Tf 438 703 Td (${safePdfStr(timeStr)}) Tj ET`);

  // Mini Calendar Badge
  page1Ops.push('1.0 0.42 0.0 rg 415 710 16 16 re f');
  page1Ops.push('1.0 1.0 1.0 rg BT /F2 7 Tf 417 714 Td (CAL) Tj ET');

  // --- 3. ACADEMIC METADATA PILLS GRID ---
  page1Ops.push('0.97 0.98 0.99 rg 40 622 515 66 re f');
  page1Ops.push('0.88 0.91 0.94 RG 1 w 40 622 515 66 re s');

  // Col 1
  page1Ops.push('0.39 0.45 0.55 rg BT /F1 7.5 Tf 55 672 Td (University) Tj ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9 Tf 55 660 Td (${safePdfStr(university).substring(0, 34)}) Tj ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 7.5 Tf 55 644 Td (Course / Program) Tj ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9 Tf 55 632 Td (${safePdfStr(course).substring(0, 34)}) Tj ET`);

  // Col 2
  page1Ops.push('0.39 0.45 0.55 rg BT /F1 7.5 Tf 300 672 Td (Regulation) Tj ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9 Tf 300 660 Td (${safePdfStr(regulation)}) Tj ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 7.5 Tf 400 672 Td (Semester / Term) Tj ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 9 Tf 400 660 Td (${safePdfStr(semester)}) Tj ET`);

  page1Ops.push('0.39 0.45 0.55 rg BT /F1 7.5 Tf 300 644 Td (Calculation Method) Tj ET');
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 300 632 Td (${safePdfStr(method).substring(0, 36)}) Tj ET`);

  let curY = 605;

  if (hasSubjects) {
    // =========================================================================
    // CASE A: SUBJECT BREAKDOWN TABLE IS AVAILABLE (e.g. CGPA, SGPA, GPA)
    // =========================================================================

    // Top: Compact Hero Card (Score on left, Metrics on right)
    curY -= 92;
    const heroCardY = curY;

    // Vibrant Orange Hero Score Card
    page1Ops.push(`1.0 0.42 0.0 rg 40 ${heroCardY} 190 85 re f`);
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 9 Tf 56 ${heroCardY + 68} Td (${safePdfStr(scoreLabel).substring(0, 24)}) Tj ET`);
    page1Ops.push(`BT /F2 26 Tf 56 ${heroCardY + 36} Td (${safePdfStr(scoreVal)}) Tj ET`);
    page1Ops.push(`BT /F1 8.5 Tf 56 ${heroCardY + 20} Td (${safePdfStr(scaleText)}) Tj ET`);
    if (standingText) {
      page1Ops.push(`BT /F2 8 Tf 56 ${heroCardY + 8} Td ([${safePdfStr(standingText).substring(0, 22)}]) Tj ET`);
    }

    // Right: 4 Metrics Grid (or up to 4 metrics)
    const metricBoxW = 155;
    const metricBoxH = 38;
    const metricStartX = 240;

    const displayMetrics = metrics.length > 0 ? metrics.slice(0, 4) : [
      { label: 'Evaluation Status', value: standingText || 'Completed' },
      { label: 'Score Scale', value: scaleText }
    ];

    displayMetrics.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const boxX = metricStartX + col * (metricBoxW + 10);
      const boxY = heroCardY + 45 - row * (metricBoxH + 7);

      page1Ops.push(`0.97 0.98 0.99 rg ${boxX} ${boxY} ${metricBoxW} ${metricBoxH} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 1 w ${boxX} ${boxY} ${metricBoxW} ${metricBoxH} re s`);

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 7.5 Tf ${boxX + 10} ${boxY + 24} Td (${safePdfStr(m.label || m.name)}) Tj ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 11.5 Tf ${boxX + 10} ${boxY + 9} Td (${safePdfStr(m.value)}) Tj ET`);
    });

    // Subject Performance Table Header
    curY -= 28;
    page1Ops.push(`0.06 0.09 0.16 rg 40 ${curY} 515 22 re f`);
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 8.5 Tf 48 ${curY + 7} Td (#) Tj ET`);
    page1Ops.push(`BT /F2 8.5 Tf 75 ${curY + 7} Td (Subject / Course Title) Tj ET`);
    page1Ops.push(`BT /F2 8.5 Tf 315 ${curY + 7} Td (Credits) Tj ET`);
    page1Ops.push(`BT /F2 8.5 Tf 375 ${curY + 7} Td (Grade) Tj ET`);
    page1Ops.push(`BT /F2 8.5 Tf 435 ${curY + 7} Td (Grade Pts) Tj ET`);
    page1Ops.push(`BT /F2 8.5 Tf 495 ${curY + 7} Td (Credit Pts) Tj ET`);

    const rowHeight = 20;
    const page1Subjects = subjects.slice(0, 8);
    let totalCredits = 0;
    let totalCreditPoints = 0;

    page1Subjects.forEach((sub, idx) => {
      curY -= rowHeight;
      if (idx % 2 === 1) page1Ops.push(`0.97 0.98 0.99 rg 40 ${curY} 515 ${rowHeight} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${curY} 515 ${rowHeight} re s`);

      const cr = Number(sub.credits) || 0;
      const pts = Number(sub.gradePoints !== undefined ? sub.gradePoints : (sub.points || 0));
      const crPts = Number(sub.creditPoints !== undefined ? sub.creditPoints : (cr * pts));
      totalCredits += cr;
      totalCreditPoints += crPts;

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${curY + 6} Td (${idx + 1}) Tj ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 75 ${curY + 6} Td (${safePdfStr(sub.name || `Subject ${idx + 1}`).substring(0, 36)}) Tj ET`);
      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8.5 Tf 325 ${curY + 6} Td (${cr}) Tj ET`);

      const gr = safePdfStr(sub.grade || 'A');
      page1Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 376 ${curY + 6} Td (${gr}) Tj ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 445 ${curY + 6} Td (${pts}) Tj ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 505 ${curY + 6} Td (${crPts}) Tj ET`);
    });

    // Total Row
    curY -= rowHeight;
    page1Ops.push(`0.95 0.96 0.98 rg 40 ${curY} 515 ${rowHeight} re f`);
    page1Ops.push(`0.88 0.91 0.94 RG 1 w 40 ${curY} 515 ${rowHeight} re s`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 265 ${curY + 6} Td (Total) Tj ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 325 ${curY + 6} Td (${totalCredits}) Tj ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 445 ${curY + 6} Td (-) Tj ET`);
    page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 505 ${curY + 6} Td (${totalCreditPoints}) Tj ET`);

  } else {
    // =========================================================================
    // CASE B: SINGLE-SCORE / METRICS-ONLY CALCULATOR (Grade, Percentage, Target, MarksConvert)
    // =========================================================================

    // Large, Centered Hero Visual Result Card (Matches on-screen ResultGaugeCard)
    curY -= 175;
    const heroCardY = curY;

    // Signature Orange Gradient Box
    page1Ops.push(`1.0 0.42 0.0 rg 40 ${heroCardY} 515 165 re f`);
    page1Ops.push(`0.92 0.35 0.0 RG 1.5 w 40 ${heroCardY} 515 165 re s`);

    // Title Tag
    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 12 Tf 65 ${heroCardY + 138} Td (${safePdfStr(toolName).toUpperCase()}) Tj ET`);

    // Circular Gauge Representation drawn with standard PDF ISO 32000-1 cubic Bezier curves
    const cx = 110;
    const cy = heroCardY + 75;
    const r = 38;
    const k = r * 0.55228475;
    page1Ops.push('1.0 1.0 1.0 RG 6 w');
    page1Ops.push(`${cx + r} ${cy} m ` +
      `${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} c ` +
      `${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} c ` +
      `${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} c ` +
      `${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} c h S`);

    page1Ops.push('1.0 1.0 1.0 rg');
    page1Ops.push(`BT /F2 26 Tf 90 ${heroCardY + 72} Td (${safePdfStr(scoreVal)}) Tj ET`);
    page1Ops.push(`BT /F1 9 Tf 82 ${heroCardY + 54} Td (${safePdfStr(scaleText)}) Tj ET`);

    // Standing Badge & Narrative
    page1Ops.push(`BT /F2 13 Tf 185 ${heroCardY + 105} Td ([${safePdfStr(standingText)}]) Tj ET`);
    page1Ops.push(`BT /F1 9.5 Tf 185 ${heroCardY + 84} Td (${safePdfStr(standingNarrative).substring(0, 52)}) Tj ET`);

    // Academic Context Inside Hero Card
    page1Ops.push(`BT /F1 8.5 Tf 185 ${heroCardY + 58} Td (Evaluation Standard: ${safePdfStr(method).substring(0, 48)}) Tj ET`);
    page1Ops.push(`BT /F1 8.5 Tf 185 ${heroCardY + 42} Td (Curriculum Basis: ${safePdfStr(regulation)} | ${safePdfStr(university).substring(0, 36)}) Tj ET`);

    // Evaluation Metrics Section
    curY -= 30;
    page1Ops.push('0.06 0.09 0.16 rg');
    page1Ops.push(`BT /F2 11 Tf 40 ${curY + 12} Td (DETAILED EVALUATION METRICS) Tj ET`);
    page1Ops.push('0.88 0.91 0.94 RG 1 w');
    page1Ops.push(`40 ${curY + 4} m 555 ${curY + 4} l S`);

    // Display all passed metrics in a structured grid
    const displayMetrics = metrics.length > 0 ? metrics : [
      { label: 'Calculated Result', value: scoreVal },
      { label: 'Evaluation Standing', value: standingText },
      { label: 'Scale Standard', value: scaleText },
      { label: 'Regulation', value: regulation }
    ];

    const cardW = 250;
    const cardH = 46;
    const numCols = 2;

    displayMetrics.forEach((m, idx) => {
      const col = idx % numCols;
      const row = Math.floor(idx / numCols);
      const bX = 40 + col * (cardW + 15);
      const bY = curY - 14 - (row + 1) * (cardH + 10);

      page1Ops.push(`0.97 0.98 0.99 rg ${bX} ${bY} ${cardW} ${cardH} re f`);
      page1Ops.push(`0.88 0.91 0.94 RG 1 w ${bX} ${bY} ${cardW} ${cardH} re s`);

      page1Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf ${bX + 12} ${bY + 28} Td (${safePdfStr(m.label || m.name)}) Tj ET`);
      page1Ops.push(`0.06 0.09 0.16 rg BT /F2 13 Tf ${bX + 12} ${bY + 11} Td (${safePdfStr(m.value)}) Tj ET`);
    });

    curY -= (Math.ceil(displayMetrics.length / 2) * (cardH + 10) + 20);
  }

  // --- FOOTER (Official Disclaimer) ---
  const footerY = 38;
  page1Ops.push(`0.94 0.98 1.0 rg 40 ${footerY} 515 42 re f`);
  page1Ops.push(`0.75 0.88 0.98 RG 1 w 40 ${footerY} 515 42 re s`);

  // Blue Info Icon
  page1Ops.push(`0.01 0.52 0.78 rg 48 ${footerY + 14} 14 14 re f`);
  page1Ops.push(`1.0 1.0 1.0 rg BT /F2 8.5 Tf 53 ${footerY + 18} Td (i) Tj ET`);

  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 70 ${footerY + 26} Td (Calculated by ResultPoint - not an official university marksheet.) Tj ET`);
  page1Ops.push(`0.15 0.35 0.55 rg BT /F1 7.5 Tf 70 ${footerY + 13} Td (This academic result scorecard is computed strictly based on data entered by the user.) Tj ET`);

  // Right Branding
  page1Ops.push(`0.06 0.09 0.16 rg BT /F2 10.5 Tf 460 ${footerY + 23} Td (Result) Tj ET`);
  page1Ops.push(`1.0 0.42 0.0 rg BT /F2 10.5 Tf 492 ${footerY + 23} Td (Point) Tj ET`);
  page1Ops.push(`0.39 0.45 0.55 rg BT /F1 7 Tf 460 ${footerY + 11} Td (resultpoint.app) Tj ET`);

  page1Ops.push('Q');
  pagesStreamOps.push(page1Ops);

  // Check if Page 2 is needed for remaining subjects (> 8 rows)
  if (subjects.length > 8) {
    const page2Ops = [];
    page2Ops.push('q');
    page2Ops.push('0.92 0.94 0.97 RG 1 w 25 25 545 792 re s');

    // Page 2 Header
    page2Ops.push('0.06 0.09 0.16 rg BT /F2 13 Tf 40 780 Td (ResultPoint) Tj ET');
    page2Ops.push(`0.39 0.45 0.55 rg BT /F1 9 Tf 115 780 Td (- ${safePdfStr(displayTitle)} \\(Continued\\)) Tj ET`);
    page2Ops.push('0.88 0.91 0.94 RG 1 w 40 770 m 555 770 l S');

    let p2Y = 750;
    page2Ops.push(`0.06 0.09 0.16 rg 40 ${p2Y - 20} 515 20 re f`);
    page2Ops.push('1.0 1.0 1.0 rg');
    page2Ops.push(`BT /F2 8.5 Tf 48 ${p2Y - 14} Td (#) Tj ET`);
    page2Ops.push(`BT /F2 8.5 Tf 75 ${p2Y - 14} Td (Subject Name) Tj ET`);
    page2Ops.push(`BT /F2 8.5 Tf 315 ${p2Y - 14} Td (Credits) Tj ET`);
    page2Ops.push(`BT /F2 8.5 Tf 375 ${p2Y - 14} Td (Grade) Tj ET`);
    page2Ops.push(`BT /F2 8.5 Tf 435 ${p2Y - 14} Td (Grade Pts) Tj ET`);
    page2Ops.push(`BT /F2 8.5 Tf 495 ${p2Y - 14} Td (Credit Pts) Tj ET`);
    p2Y -= 20;

    const remainingSubjects = subjects.slice(8);
    const rowHeight = 20;
    remainingSubjects.forEach((sub, idx) => {
      p2Y -= rowHeight;
      const actualIdx = 8 + idx;
      if (idx % 2 === 1) page2Ops.push(`0.97 0.98 0.99 rg 40 ${p2Y} 515 ${rowHeight} re f`);
      page2Ops.push(`0.88 0.91 0.94 RG 0.5 w 40 ${p2Y} 515 ${rowHeight} re s`);

      const cr = Number(sub.credits) || 0;
      const pts = Number(sub.gradePoints !== undefined ? sub.gradePoints : (sub.points || 0));
      const crPts = Number(sub.creditPoints !== undefined ? sub.creditPoints : (cr * pts));

      page2Ops.push(`0.39 0.45 0.55 rg BT /F1 8 Tf 50 ${p2Y + 6} Td (${actualIdx + 1}) Tj ET`);
      page2Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 75 ${p2Y + 6} Td (${safePdfStr(sub.name || `Subject ${actualIdx + 1}`).substring(0, 36)}) Tj ET`);
      page2Ops.push(`0.39 0.45 0.55 rg BT /F1 8.5 Tf 325 ${p2Y + 6} Td (${cr}) Tj ET`);

      const gr = safePdfStr(sub.grade || 'A');
      page2Ops.push(`1.0 0.42 0.0 rg BT /F2 8.5 Tf 376 ${p2Y + 6} Td (${gr}) Tj ET`);
      page2Ops.push(`0.06 0.09 0.16 rg BT /F1 8.5 Tf 445 ${p2Y + 6} Td (${pts}) Tj ET`);
      page2Ops.push(`0.06 0.09 0.16 rg BT /F2 8.5 Tf 505 ${p2Y + 6} Td (${crPts}) Tj ET`);
    });

    // Page 2 Footer
    page2Ops.push('0.88 0.91 0.94 RG 1 w 40 60 m 555 60 l S');
    page2Ops.push('0.39 0.45 0.55 rg');
    page2Ops.push('BT /F1 8 Tf 40 45 Td (Calculated by ResultPoint - not an official university marksheet.) Tj ET');
    page2Ops.push('BT /F1 8 Tf 480 45 Td (Page 2 of 2) Tj ET');

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
  sanitizePdfText
};

export default calculatorPdfService;
