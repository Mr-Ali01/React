package com.resultpoint.modules.export.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.student.domain.*;
import com.resultpoint.modules.student.dto.SemesterResultDto;
import com.resultpoint.modules.student.dto.SubjectResultDto;
import com.resultpoint.modules.student.repository.SemesterResultRepository;
import com.resultpoint.modules.student.repository.StudentBacklogRepository;
import com.resultpoint.modules.student.repository.StudentGoalRepository;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import com.resultpoint.modules.student.service.SemesterResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final StudentProfileRepository studentProfileRepository;
    private final SemesterResultRepository semesterResultRepository;
    private final SemesterResultService semesterResultService;
    private final StudentBacklogRepository studentBacklogRepository;
    private final StudentGoalRepository studentGoalRepository;

    private static final Color PRIMARY_NAVY = new Color(30, 58, 138);
    private static final Color BG_LIGHT_SLATE = new Color(241, 245, 249);
    private static final Color BG_ALT_ROW = new Color(248, 250, 252);
    private static final Color BORDER_GRAY = new Color(226, 232, 240);
    private static final Color TEXT_DARK = new Color(15, 23, 42);
    private static final Color TEXT_MUTED = new Color(100, 116, 139);
    private static final Color PASS_GREEN = new Color(5, 150, 105);
    private static final Color FAIL_RED = new Color(220, 38, 38);

    private static final Font FONT_HEADER_TITLE = new Font(Font.HELVETICA, 16, Font.BOLD, PRIMARY_NAVY);
    private static final Font FONT_HEADER_SUBTITLE = new Font(Font.HELVETICA, 10, Font.BOLD, TEXT_MUTED);
    private static final Font FONT_SECTION_TITLE = new Font(Font.HELVETICA, 11, Font.BOLD, PRIMARY_NAVY);
    private static final Font FONT_TH = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);
    private static final Font FONT_CELL = new Font(Font.HELVETICA, 8, Font.NORMAL, TEXT_DARK);
    private static final Font FONT_CELL_BOLD = new Font(Font.HELVETICA, 8, Font.BOLD, TEXT_DARK);
    private static final Font FONT_SMALL_MUTED = new Font(Font.HELVETICA, 7, Font.ITALIC, TEXT_MUTED);
    private static final Font FONT_WARNING = new Font(Font.HELVETICA, 7, Font.BOLD, new Color(180, 83, 9));

    @Transactional(readOnly = true)
    public byte[] generateSemesterScorecardPdf(String userId, int semesterNumber) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        SemesterResultDto resultDto = semesterResultService.getSemesterResultByNumber(userId, semesterNumber);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new ResultPointHeaderFooter("SEMESTER " + semesterNumber + " SCORECARD"));
            document.open();

            // 1. Header Banner
            addHeaderBanner(document, "OFFICIAL SEMESTER SCORECARD", "SEMESTER " + semesterNumber);

            // 2. Student Info Card
            addStudentInfoTable(document, profile, resultDto.getAcademicPeriod());

            // 3. Subject Scorecard Table
            Paragraph subjectTitle = new Paragraph("SUBJECT PERFORMANCE", FONT_SECTION_TITLE);
            subjectTitle.setSpacingBefore(12f);
            subjectTitle.setSpacingAfter(4f);
            document.add(subjectTitle);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{16f, 38f, 10f, 9f, 9f, 9f, 9f});

            addTableHeader(table, "Code", "Subject Title", "Credits", "Grade", "GP", "Marks", "Status");

            int idx = 0;
            for (SubjectResultDto s : resultDto.getSubjects()) {
                Color rowBg = (idx % 2 == 1) ? BG_ALT_ROW : Color.WHITE;
                addTableCell(table, s.getSubjectCode(), FONT_CELL_BOLD, rowBg, Element.ALIGN_LEFT);
                addTableCell(table, s.getSubjectName(), FONT_CELL, rowBg, Element.ALIGN_LEFT);
                addTableCell(table, s.getCredits() != null ? s.getCredits().toPlainString() : "-", FONT_CELL, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, s.getGradeLetter() != null ? s.getGradeLetter() : "-", FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, s.getGradePoints() != null ? s.getGradePoints().toPlainString() : "-", FONT_CELL, rowBg, Element.ALIGN_CENTER);

                String marksStr = s.getTotalMarks() != null ? s.getTotalMarks().toPlainString() : "-";
                addTableCell(table, marksStr, FONT_CELL, rowBg, Element.ALIGN_CENTER);

                Font statusFont = s.isPass()
                        ? new Font(Font.HELVETICA, 8, Font.BOLD, PASS_GREEN)
                        : new Font(Font.HELVETICA, 8, Font.BOLD, FAIL_RED);
                addTableCell(table, s.isPass() ? "PASS" : "FAIL", statusFont, rowBg, Element.ALIGN_CENTER);
                idx++;
            }
            document.add(table);

            // 4. Performance Summary Box
            addPerformanceSummaryBox(document, resultDto);

            // 5. Statutory Transparency Disclaimers
            addTransparencyDisclaimers(document, profile.getRegulation(), resultDto.getRuleVersionSnapshot());

            document.close();
        } catch (Exception ex) {
            log.error("Failed generating scorecard PDF for student {} sem {}: {}", userId, semesterNumber, ex.getMessage(), ex);
            throw new RuntimeException("Could not render semester scorecard PDF: " + ex.getMessage(), ex);
        }

        return baos.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] generateAcademicTranscriptPdf(String userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<SemesterResult> results = semesterResultRepository.findByStudentProfileIdOrderBySemesterNumberAsc(profile.getId());
        List<StudentBacklog> activeBacklogs = studentBacklogRepository.findByStudentProfileIdAndStatusOrderBySemesterNumberAsc(profile.getId(), BacklogStatus.ACTIVE);
        List<StudentBacklog> clearedBacklogs = studentBacklogRepository.findByStudentProfileIdAndStatusOrderBySemesterNumberAsc(profile.getId(), BacklogStatus.CLEARED);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new ResultPointHeaderFooter("ACADEMIC PROGRESSION TRANSCRIPT"));
            document.open();

            addHeaderBanner(document, "ACADEMIC PROGRESSION TRANSCRIPT", "CUMULATIVE PERFORMANCE REPORT");
            addStudentInfoTable(document, profile, "All Recorded Semesters (" + results.size() + ")");

            // Semester Progression Table
            Paragraph semTitle = new Paragraph("SEMESTER-WISE PERFORMANCE TIMELINE", FONT_SECTION_TITLE);
            semTitle.setSpacingBefore(12f);
            semTitle.setSpacingAfter(4f);
            document.add(semTitle);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{12f, 22f, 13f, 13f, 12f, 12f, 16f});

            addTableHeader(table, "Semester", "Academic Period", "Credits", "Earned", "SGPA", "CGPA", "Standing");

            int idx = 0;
            for (SemesterResult r : results) {
                Color rowBg = (idx % 2 == 1) ? BG_ALT_ROW : Color.WHITE;
                addTableCell(table, "Sem " + r.getSemesterNumber(), FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, r.getAcademicPeriod(), FONT_CELL, rowBg, Element.ALIGN_LEFT);
                addTableCell(table, r.getTotalCredits().toPlainString(), FONT_CELL, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, r.getCreditsEarned().toPlainString(), FONT_CELL, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, r.getSgpa().toPlainString(), FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, r.getCgpa().toPlainString(), FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, r.getStandingStatus(), FONT_CELL, rowBg, Element.ALIGN_CENTER);
                idx++;
            }
            document.add(table);

            // Cumulative Summary
            addCumulativeSummary(document, profile, results, activeBacklogs.size(), clearedBacklogs.size());

            // Backlogs Section if any exist
            if (!activeBacklogs.isEmpty() || !clearedBacklogs.isEmpty()) {
                addBacklogSection(document, activeBacklogs, clearedBacklogs);
            }

            addTransparencyDisclaimers(document, profile.getRegulation(), "Cumulative");

            document.close();
        } catch (Exception ex) {
            log.error("Failed generating transcript PDF for student {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Could not render academic transcript PDF: " + ex.getMessage(), ex);
        }

        return baos.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] generateGoalsAndProgressPdf(String userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        List<StudentGoal> goals = studentGoalRepository.findByStudentProfileIdOrderByCreatedAtDesc(profile.getId());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new ResultPointHeaderFooter("ACADEMIC GOALS & PROJECTIONS"));
            document.open();

            addHeaderBanner(document, "ACADEMIC GOALS & TARGET PROJECTIONS", "STRATEGIC HONORS PLANNING");
            addStudentInfoTable(document, profile, "Current CGPA: " + profile.getCumulativeCgpa());

            Paragraph goalsTitle = new Paragraph("TARGET CGPA GOALS & REQUIRED SGPA", FONT_SECTION_TITLE);
            goalsTitle.setSpacingBefore(12f);
            goalsTitle.setSpacingAfter(4f);
            document.add(goalsTitle);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{15f, 15f, 15f, 20f, 15f, 20f});

            addTableHeader(table, "Target Sem", "Target CGPA", "Current CGPA", "Required SGPA", "Feasibility", "Status");

            int idx = 0;
            for (StudentGoal g : goals) {
                Color rowBg = (idx % 2 == 1) ? BG_ALT_ROW : Color.WHITE;
                addTableCell(table, "Semester " + g.getTargetSemester(), FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, g.getTargetCgpa().toPlainString(), FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, profile.getCumulativeCgpa().toPlainString(), FONT_CELL, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, g.getRequiredSgpa().toPlainString(), FONT_CELL_BOLD, rowBg, Element.ALIGN_CENTER);

                Font feasFont;
                if (g.getFeasibilityStatus() == FeasibilityStatus.ACHIEVABLE) {
                    feasFont = new Font(Font.HELVETICA, 8, Font.BOLD, PASS_GREEN);
                } else if (g.getFeasibilityStatus() == FeasibilityStatus.CHALLENGING) {
                    feasFont = new Font(Font.HELVETICA, 8, Font.BOLD, new Color(217, 119, 6));
                } else {
                    feasFont = new Font(Font.HELVETICA, 8, Font.BOLD, FAIL_RED);
                }
                addTableCell(table, g.getFeasibilityStatus().name(), feasFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(table, g.isActive() ? "ACTIVE" : "INACTIVE", FONT_CELL, rowBg, Element.ALIGN_CENTER);
                idx++;
            }
            document.add(table);

            addTransparencyDisclaimers(document, profile.getRegulation(), "Target-CGPA Projections");

            document.close();
        } catch (Exception ex) {
            log.error("Failed generating goals PDF for student {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Could not render goals PDF: " + ex.getMessage(), ex);
        }

        return baos.toByteArray();
    }

    // Helper Layout Methods

    private void addHeaderBanner(Document document, String title, String subtitle) throws DocumentException {
        Paragraph mainTitle = new Paragraph("RESULTPOINT ACADEMIC REPOSITORY", FONT_HEADER_TITLE);
        mainTitle.setAlignment(Element.ALIGN_CENTER);
        document.add(mainTitle);

        Paragraph sub = new Paragraph(title + " — " + subtitle, FONT_HEADER_SUBTITLE);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(10f);
        document.add(sub);
    }

    private void addStudentInfoTable(Document document, StudentProfile profile, String periodText) throws DocumentException {
        PdfPTable infoTable = new PdfPTable(4);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{22f, 28f, 22f, 28f});

        addInfoCell(infoTable, "Student Name:", profile.getUser().getFullName());
        addInfoCell(infoTable, "Hall Ticket / Roll:", profile.getHallTicketNumber());
        addInfoCell(infoTable, "University:", profile.getUniversity().getName());
        addInfoCell(infoTable, "Course:", profile.getCourse().getName() + " (" + profile.getCourse().getShortName() + ")");
        addInfoCell(infoTable, "Academic Regulation:", profile.getRegulation().getName());
        addInfoCell(infoTable, "Batch / Period:", profile.getBatchYear() + " | " + periodText);

        document.add(infoTable);
    }

    private void addInfoCell(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER_GRAY);
        cell.setPadding(4f);
        cell.setBackgroundColor(BG_LIGHT_SLATE);

        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " ", FONT_CELL_BOLD));
        p.add(new Chunk(value != null ? value : "N/A", FONT_CELL));
        cell.addElement(p);
        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FONT_TH));
            cell.setBackgroundColor(PRIMARY_NAVY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(5f);
            cell.setBorderColor(PRIMARY_NAVY);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4f);
        cell.setBorderColor(BORDER_GRAY);
        table.addCell(cell);
    }

    private void addPerformanceSummaryBox(Document document, SemesterResultDto r) throws DocumentException {
        PdfPTable box = new PdfPTable(5);
        box.setWidthPercentage(100);
        box.setWidths(new float[]{20f, 20f, 20f, 20f, 20f});
        box.setSpacingBefore(10f);

        addSummaryMetricCell(box, "REGISTERED CREDITS", r.getTotalCredits().toPlainString());
        addSummaryMetricCell(box, "CREDITS EARNED", r.getCreditsEarned().toPlainString());
        addSummaryMetricCell(box, "SEMESTER SGPA", r.getSgpa().toPlainString());
        addSummaryMetricCell(box, "CUMULATIVE CGPA", r.getCgpa().toPlainString());
        addSummaryMetricCell(box, "ACADEMIC STANDING", r.getStandingStatus());

        document.add(box);
    }

    private void addSummaryMetricCell(PdfPTable table, String title, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(BG_LIGHT_SLATE);
        cell.setBorderColor(PRIMARY_NAVY);
        cell.setPadding(6f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph t = new Paragraph(title, FONT_SMALL_MUTED);
        t.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(t);

        Paragraph v = new Paragraph(value, new Font(Font.HELVETICA, 11, Font.BOLD, PRIMARY_NAVY));
        v.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(v);

        table.addCell(cell);
    }

    private void addCumulativeSummary(Document document, StudentProfile p, List<SemesterResult> results, int activeBacklogs, int clearedBacklogs) throws DocumentException {
        PdfPTable box = new PdfPTable(5);
        box.setWidthPercentage(100);
        box.setWidths(new float[]{20f, 20f, 20f, 20f, 20f});
        box.setSpacingBefore(10f);

        addSummaryMetricCell(box, "RECORDED SEMESTERS", String.valueOf(results.size()));
        addSummaryMetricCell(box, "TOTAL CREDITS EARNED", p.getTotalCreditsEarned().toPlainString());
        addSummaryMetricCell(box, "CUMULATIVE CGPA", p.getCumulativeCgpa().toPlainString());
        addSummaryMetricCell(box, "ACTIVE BACKLOGS", String.valueOf(activeBacklogs));
        addSummaryMetricCell(box, "CLEARED BACKLOGS", String.valueOf(clearedBacklogs));

        document.add(box);
    }

    private void addBacklogSection(Document document, List<StudentBacklog> active, List<StudentBacklog> cleared) throws DocumentException {
        Paragraph title = new Paragraph("BACKLOG & REMEDIATION SUMMARY", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(4f);
        document.add(title);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{18f, 37f, 15f, 15f, 15f});

        addTableHeader(table, "Subject Code", "Subject Name", "Semester", "Credits", "Status");

        for (StudentBacklog b : active) {
            addTableCell(table, b.getSubjectCode(), FONT_CELL_BOLD, Color.WHITE, Element.ALIGN_LEFT);
            addTableCell(table, b.getSubjectName(), FONT_CELL, Color.WHITE, Element.ALIGN_LEFT);
            addTableCell(table, "Sem " + b.getSemesterNumber(), FONT_CELL, Color.WHITE, Element.ALIGN_CENTER);
            addTableCell(table, b.getCredits().toPlainString(), FONT_CELL, Color.WHITE, Element.ALIGN_CENTER);
            addTableCell(table, "ACTIVE", new Font(Font.HELVETICA, 8, Font.BOLD, FAIL_RED), Color.WHITE, Element.ALIGN_CENTER);
        }

        for (StudentBacklog b : cleared) {
            addTableCell(table, b.getSubjectCode(), FONT_CELL_BOLD, BG_ALT_ROW, Element.ALIGN_LEFT);
            addTableCell(table, b.getSubjectName(), FONT_CELL, BG_ALT_ROW, Element.ALIGN_LEFT);
            addTableCell(table, "Sem " + b.getSemesterNumber(), FONT_CELL, BG_ALT_ROW, Element.ALIGN_CENTER);
            addTableCell(table, b.getCredits().toPlainString(), FONT_CELL, BG_ALT_ROW, Element.ALIGN_CENTER);
            addTableCell(table, "CLEARED (" + (b.getClearedGrade() != null ? b.getClearedGrade() : "Pass") + ")",
                    new Font(Font.HELVETICA, 8, Font.BOLD, PASS_GREEN), BG_ALT_ROW, Element.ALIGN_CENTER);
        }

        document.add(table);
    }

    private void addTransparencyDisclaimers(Document document, Regulation regulation, String snapshotText) throws DocumentException {
        Paragraph disclaimers = new Paragraph();
        disclaimers.setSpacingBefore(12f);

        disclaimers.add(new Chunk("REGULATORY & INSTITUTIONAL TRANSPARENCY NOTICE:\n", FONT_WARNING));
        disclaimers.add(new Chunk("1. Rule Version Snapshot: " + snapshotText + " | Governed under: " + regulation.getName() + " (" + regulation.getCode() + ").\n", FONT_SMALL_MUTED));

        if (regulation.getId().toLowerCase().contains("ou") || regulation.getCode().toLowerCase().contains("ou")) {
            disclaimers.add(new Chunk("2. Osmania University CBCS Rule: Top grade is Grade S (Super) with 10 Grade Points for marks >= 85.00%.\n", FONT_SMALL_MUTED));
            disclaimers.add(new Chunk("3. Percentage Conversion Status: Explicitly UNVERIFIED. Any displayed equivalent percentage utilizes the institutional standard multiplier (CGPA * 10) and is not certified by statutory gazette.\n", FONT_WARNING));
        }

        disclaimers.add(new Chunk("4. Verification & Audit: This document was rendered deterministically via ResultPoint Academic Engine at "
                + DateTimeFormatter.ISO_INSTANT.format(Instant.now().atOffset(ZoneOffset.UTC)) + ". Tampering invalidates this record.", FONT_SMALL_MUTED));

        document.add(disclaimers);
    }

    /**
     * Page Event Helper for Headers, Footers and Watermark/Page Numbers.
     */
    private static class ResultPointHeaderFooter extends PdfPageEventHelper {
        private final String reportType;

        public ResultPointHeaderFooter(String reportType) {
            this.reportType = reportType;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfPTable footer = new PdfPTable(2);
            footer.setTotalWidth(document.right() - document.left());
            footer.setWidthPercentage(100);

            PdfPCell left = new PdfPCell(new Phrase("ResultPoint Academic Record | " + reportType, FONT_SMALL_MUTED));
            left.setBorder(Rectangle.TOP);
            left.setBorderColor(BORDER_GRAY);
            left.setHorizontalAlignment(Element.ALIGN_LEFT);

            PdfPCell right = new PdfPCell(new Phrase("Page " + writer.getPageNumber(), FONT_SMALL_MUTED));
            right.setBorder(Rectangle.TOP);
            right.setBorderColor(BORDER_GRAY);
            right.setHorizontalAlignment(Element.ALIGN_RIGHT);

            footer.addCell(left);
            footer.addCell(right);

            footer.writeSelectedRows(0, -1, document.left(), document.bottom() - 5, writer.getDirectContent());
        }
    }
}
