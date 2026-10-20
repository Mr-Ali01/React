/**
 * ResultPoint Scorecard Print & PDF Export Utility
 * Provides dedicated printing (isolated to scorecard only) and client-side PDF download.
 */

/**
 * Generates an official, standalone HTML document for the semester scorecard
 */
export function generateScorecardHTML(result, student, { forPrint = false } = {}) {
  const subjects = result.subjects || [];
  const totalSubjectCredits = subjects.length > 0
    ? subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0)
    : (Number(result.totalCredits) || 22);
  const earnedCredits = Number(result.creditsEarned) || totalSubjectCredits;

  const studentName = student?.fullName || 'Samir Ali';
  const hallTicket = student?.hallTicketNumber || '1005-23-772-045';
  const course = student?.course || 'B.Tech - Computer Science & Engineering';
  const university = student?.university || 'Osmania University';
  const regulation = student?.regulation || 'CBCS';
  const semesterTitle = result.semesterTitle || result.semesterLabel || `Semester ${result.semesterNumber}`;
  const academicPeriod = result.academicPeriod || 'Academic Period';
  const sgpa = Number(result.sgpa || 0).toFixed(2);
  const cgpa = Number(result.cgpa || result.sgpa || 0).toFixed(2);
  const status = result.status || 'Passed';

  const rowsHtml = subjects.map((sub, idx) => `
    <tr style="border-bottom: 1px solid #E2E8F0; ${idx % 2 === 1 ? 'background-color: #F8FAFC;' : ''}">
      <td style="padding: 10px 14px; font-weight: 600; color: #475569; font-size: 12px;">${sub.code || `CS${result.semesterNumber}0${idx + 1}`}</td>
      <td style="padding: 10px 14px; font-weight: 700; color: #0F172A; font-size: 13px;">${sub.name}</td>
      <td style="padding: 10px 14px; text-align: center; color: #475569; font-size: 12px;">${sub.credits}</td>
      <td style="padding: 10px 14px; text-align: center;">
        <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; background: #FFF1E8; color: #EA580C; border: 1px solid #FFD8BE;">
          ${sub.grade}
        </span>
      </td>
      <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #0F172A; font-size: 13px;">${sub.points}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${semesterTitle} - Official Scorecard - ResultPoint</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      padding: ${forPrint ? '0' : '24px'};
      line-height: 1.4;
    }
    .scorecard-card {
      border: 1px solid #CBD5E1;
      border-radius: 14px;
      overflow: hidden;
      background: #FFFFFF;
    }
    .header-banner {
      background: linear-gradient(135deg, #FF6B00 0%, #EA580C 100%);
      color: #FFFFFF;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-banner h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }
    .header-banner p {
      font-size: 11px;
      opacity: 0.92;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .badge-verified {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 24px;
      padding: 20px 28px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
    }
    .info-item {
      font-size: 12px;
    }
    .info-label {
      color: #64748B;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
    }
    .metrics-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 20px 28px;
      background: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
    }
    .metric-box {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px 18px;
      background: #FFFFFF;
    }
    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .metric-val {
      font-size: 22px;
      font-weight: 900;
      line-height: 1.1;
    }
    .metric-sub {
      font-size: 10px;
      color: #64748B;
      margin-top: 4px;
      font-weight: 500;
    }
    .table-container {
      padding: 20px 28px;
    }
    .table-title {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: #F1F5F9;
      padding: 10px 14px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 2px solid #CBD5E1;
    }
    .footer-note {
      padding: 16px 28px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      font-size: 10px;
      color: #64748B;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="scorecard-card">
    <!-- Header -->
    <div class="header-banner">
      <div>
        <h1>ResultPoint Academic Portal</h1>
        <p>Official Grade Card & Performance Record</p>
      </div>
      <div class="badge-verified">
        ✓ Verified Academic Record
      </div>
    </div>

    <!-- Student & Semester Metadata -->
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Student Name</div>
        <div class="info-value">${studentName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Hall Ticket / Roll No</div>
        <div class="info-value">${hallTicket}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Degree & Program</div>
        <div class="info-value">${course}</div>
      </div>
      <div class="info-item">
        <div class="info-label">University / Board</div>
        <div class="info-value">${university} [${regulation}]</div>
      </div>
      <div class="info-item">
        <div class="info-label">Semester</div>
        <div class="info-value">${semesterTitle} (${academicPeriod})</div>
      </div>
      <div class="info-item">
        <div class="info-label">Result Status</div>
        <div class="info-value" style="color: #16A34A;">${status}</div>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="metrics-container">
      <div class="metric-box" style="border-left: 4px solid #16A34A; background: #F0FDF4;">
        <div class="metric-label">SGPA</div>
        <div class="metric-val" style="color: #16A34A;">${sgpa}</div>
        <div class="metric-sub">Semester Grade Point Average</div>
      </div>

      <div class="metric-box" style="border-left: 4px solid #FF6B00; background: #FFF7ED;">
        <div class="metric-label">CGPA</div>
        <div class="metric-val" style="color: #EA580C;">${cgpa}</div>
        <div class="metric-sub">Cumulative Grade Point Average</div>
      </div>

      <div class="metric-box" style="border-left: 4px solid #2563EB; background: #EFF6FF;">
        <div class="metric-label">Credits Earned</div>
        <div class="metric-val" style="color: #1D4ED8;">${earnedCredits}/${totalSubjectCredits}</div>
        <div class="metric-sub">Earned / Sum of Subject Credits</div>
      </div>
    </div>

    <!-- Course Table -->
    <div class="table-container">
      <div class="table-title">Course-wise Performance Breakdown</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Subject Code</th>
            <th style="text-align: left;">Subject Title</th>
            <th style="text-align: center;">Credits</th>
            <th style="text-align: center;">Grade</th>
            <th style="text-align: center;">Grade Points</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 20px;">No subject grades recorded.</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer-note">
      <div>
        <strong>ResultPoint Academic Certification</strong> • Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString()}
      </div>
      <div>
        Document ID: RP-${result.semesterNumber || 1}-${Date.now().toString(36).toUpperCase()}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Print only the selected semester scorecard using an isolated hidden iframe
 * Guarantees zero website headers, sidebars, or other dashboard UI elements appear
 */
export function printScorecard(result, student) {
  const existingIframe = document.getElementById('rp-scorecard-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'rp-scorecard-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(generateScorecardHTML(result, student, { forPrint: true }));
  doc.close();

  // Allow styles to evaluate, then focus and trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('Iframe print fallback triggered:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
}

/**
 * Generates and downloads a clean, valid PDF file containing the semester's scorecard
 */
export function exportScorecardPDF(result, student) {
  const safeStr = (str) =>
    String(str || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const subjects = result.subjects || [];
  const totalSubjectCredits = subjects.length > 0
    ? subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0)
    : (Number(result.totalCredits) || 22);
  const earnedCredits = Number(result.creditsEarned) || totalSubjectCredits;

  const studentName = student?.fullName || 'Samir Ali';
  const hallTicket = student?.hallTicketNumber || '1005-23-772-045';
  const course = student?.course || 'B.Tech - Computer Science';
  const university = student?.university || 'Osmania University';
  const regulation = student?.regulation || 'CBCS';
  const semesterTitle = result.semesterTitle || result.semesterLabel || `Semester ${result.semesterNumber}`;
  const academicPeriod = result.academicPeriod || 'Sep 2026';
  const sgpa = Number(result.sgpa || 0).toFixed(2);
  const cgpa = Number(result.cgpa || result.sgpa || 0).toFixed(2);

  const streamOps = [];

  streamOps.push('q');

  // Top Header Banner (ResultPoint Vibrant Orange: #FF6B00 -> 1.0, 0.42, 0.0)
  streamOps.push('1.0 0.42 0.0 rg');
  streamOps.push('40 760 515 50 re f');

  // Banner Titles
  streamOps.push('1.0 1.0 1.0 rg');
  streamOps.push('BT /F2 16 Tf 55 790 Td (RESULTPOINT ACADEMIC PORTAL) ET');
  streamOps.push('BT /F1 9 Tf 55 772 Td (OFFICIAL SEMESTER GRADE REPORT & SCORECARD) ET');

  // Student Info Box (Light Slate background & border)
  streamOps.push('0.96 0.97 0.99 rg');
  streamOps.push('40 675 515 70 re f');
  streamOps.push('0.85 0.88 0.92 RG 1 w');
  streamOps.push('40 675 515 70 re s');

  // Student Details Content
  streamOps.push('0.15 0.20 0.30 rg');
  streamOps.push('BT /F2 10 Tf 55 725 Td (Student Name:) ET');
  streamOps.push(`BT /F1 10 Tf 140 725 Td (${safeStr(studentName)}) ET`);

  streamOps.push('BT /F2 10 Tf 310 725 Td (Hall Ticket No:) ET');
  streamOps.push(`BT /F1 10 Tf 400 725 Td (${safeStr(hallTicket)}) ET`);

  streamOps.push('BT /F2 10 Tf 55 705 Td (Course/Program:) ET');
  streamOps.push(`BT /F1 10 Tf 140 705 Td (${safeStr(course)}) ET`);

  streamOps.push('BT /F2 10 Tf 310 705 Td (Semester:) ET');
  streamOps.push(`BT /F1 10 Tf 400 705 Td (${safeStr(semesterTitle)} - ${safeStr(academicPeriod)}) ET`);

  streamOps.push('BT /F2 10 Tf 55 685 Td (University:) ET');
  streamOps.push(`BT /F1 10 Tf 140 685 Td (${safeStr(university)} [${safeStr(regulation)}]) ET`);

  // Summary Metrics Strip (3 boxes: SGPA, CGPA, Credits Earned: earned/total)
  // Box 1: SGPA
  streamOps.push('0.94 0.99 0.95 rg 40 615 160 45 re f');
  streamOps.push('0.80 0.92 0.82 RG 1 w 40 615 160 45 re s');
  streamOps.push('0.08 0.50 0.24 rg');
  streamOps.push(`BT /F2 14 Tf 55 632 Td (SGPA: ${sgpa}) ET`);
  streamOps.push('0.35 0.45 0.40 rg');
  streamOps.push('BT /F1 8 Tf 55 621 Td (Semester Grade Point Average) ET');

  // Box 2: CGPA
  streamOps.push('0.99 0.96 0.92 rg 215 615 160 45 re f');
  streamOps.push('0.95 0.85 0.70 RG 1 w 215 615 160 45 re s');
  streamOps.push('0.85 0.35 0.0 rg');
  streamOps.push(`BT /F2 14 Tf 230 632 Td (CGPA: ${cgpa}) ET`);
  streamOps.push('0.50 0.40 0.30 rg');
  streamOps.push('BT /F1 8 Tf 230 621 Td (Cumulative Grade Point Average) ET');

  // Box 3: Credits Earned (Earned/Total)
  streamOps.push('0.95 0.96 0.99 rg 390 615 165 45 re f');
  streamOps.push('0.82 0.86 0.95 RG 1 w 390 615 165 45 re s');
  streamOps.push('0.15 0.30 0.70 rg');
  streamOps.push(`BT /F2 14 Tf 405 632 Td (Credits: ${earnedCredits}/${totalSubjectCredits}) ET`);
  streamOps.push('0.40 0.45 0.55 rg');
  streamOps.push('BT /F1 8 Tf 405 621 Td (Credits Earned / Sum of Subject Credits) ET');

  // Table Title
  streamOps.push('0.10 0.15 0.25 rg');
  streamOps.push('BT /F2 11 Tf 40 585 Td (COURSE-WISE PERFORMANCE BREAKDOWN) ET');

  // Table Header
  streamOps.push('0.90 0.93 0.96 rg 40 555 515 22 re f');
  streamOps.push('0.80 0.84 0.90 RG 1 w 40 555 515 22 re s');
  streamOps.push('0.20 0.25 0.35 rg');
  streamOps.push('BT /F2 9 Tf 50 562 Td (CODE) ET');
  streamOps.push('BT /F2 9 Tf 120 562 Td (SUBJECT TITLE) ET');
  streamOps.push('BT /F2 9 Tf 360 562 Td (CREDITS) ET');
  streamOps.push('BT /F2 9 Tf 430 562 Td (GRADE) ET');
  streamOps.push('BT /F2 9 Tf 490 562 Td (POINTS) ET');

  // Table Rows
  let curY = 555;
  subjects.forEach((sub, idx) => {
    curY -= 20;
    const isAlt = idx % 2 === 1;
    if (isAlt) {
      streamOps.push(`0.98 0.98 0.99 rg 40 ${curY} 515 20 re f`);
    }
    streamOps.push(`0.88 0.90 0.94 RG 0.5 w 40 ${curY} 515 20 re s`);

    streamOps.push('0.30 0.35 0.45 rg');
    streamOps.push(`BT /F1 8.5 Tf 50 ${curY + 6} Td (${safeStr(sub.code || `CS${result.semesterNumber}0${idx + 1}`)}) ET`);

    streamOps.push('0.10 0.15 0.25 rg');
    streamOps.push(`BT /F2 8.5 Tf 120 ${curY + 6} Td (${safeStr(sub.name)}) ET`);

    streamOps.push('0.30 0.35 0.45 rg');
    streamOps.push(`BT /F1 8.5 Tf 375 ${curY + 6} Td (${sub.credits}) ET`);

    streamOps.push('1.0 0.42 0.0 rg');
    streamOps.push(`BT /F2 8.5 Tf 440 ${curY + 6} Td (${safeStr(sub.grade)}) ET`);

    streamOps.push('0.10 0.15 0.25 rg');
    streamOps.push(`BT /F2 8.5 Tf 505 ${curY + 6} Td (${sub.points}) ET`);
  });

  // Footer / Verification Notice
  streamOps.push('0.85 0.88 0.92 RG 1 w 40 80 515 0 re s');
  streamOps.push('0.50 0.55 0.65 rg');
  streamOps.push('BT /F1 8 Tf 40 65 Td (This scorecard is an official academic transcript generated by ResultPoint. Authenticity verified electronically.) ET');
  streamOps.push(`BT /F1 8 Tf 40 52 Td (Generated on: ${safeStr(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))} | Student: ${safeStr(studentName)}) ET`);

  streamOps.push('Q');

  const contentStream = streamOps.join('\n');
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(contentStream);

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
  objects.push(`6 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  let offset = 9; // length of "%PDF-1.4\n"
  const xref = ['xref\n0 7\n0000000000 65535 f \n'];
  const body = ['%PDF-1.4\n'];

  for (let i = 0; i < objects.length; i++) {
    const paddedOffset = String(offset).padStart(10, '0');
    xref.push(`${paddedOffset} 00000 n \n`);
    body.push(objects[i]);
    offset += encoder.encode(objects[i]).length;
  }

  const startXref = offset;
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  const pdfString = body.join('') + xref.join('') + trailer;

  // Trigger download
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const sanitizedTitle = semesterTitle.replace(/\s+/g, '_');
  downloadLink.href = url;
  downloadLink.download = `ResultPoint_${sanitizedTitle}_Scorecard.pdf`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
