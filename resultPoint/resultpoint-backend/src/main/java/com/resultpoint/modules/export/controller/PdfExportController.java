package com.resultpoint.modules.export.controller;

import com.resultpoint.security.UserPrincipal;
import com.resultpoint.modules.export.service.PdfExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student")
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student PDF Export", description = "Endpoints for downloading official academic scorecards, transcripts, and goal reports in PDF format")
public class PdfExportController {

    private final PdfExportService pdfExportService;

    public PdfExportController(PdfExportService pdfExportService) {
        this.pdfExportService = pdfExportService;
    }

    @GetMapping("/results/{semesterNumber}/pdf")
    @Operation(summary = "Download Semester Scorecard PDF", description = "Streams a formatted PDF scorecard for a specific semester result.")
    public ResponseEntity<byte[]> downloadSemesterScorecard(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer semesterNumber) {

        byte[] pdfBytes = pdfExportService.generateSemesterScorecardPdf(principal.getId(), semesterNumber);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "semester-" + semesterNumber + "-scorecard.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/results/history/pdf")
    @Operation(summary = "Download Academic Transcript PDF", description = "Streams a consolidated academic history and transcript summary in PDF format.")
    public ResponseEntity<byte[]> downloadAcademicTranscript(
            @AuthenticationPrincipal UserPrincipal principal) {

        byte[] pdfBytes = pdfExportService.generateAcademicTranscriptPdf(principal.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "academic-transcript.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/goals/report/pdf")
    @Operation(summary = "Download Goals & Academic Progress Report PDF", description = "Streams an academic goal progress and trajectory summary in PDF format.")
    public ResponseEntity<byte[]> downloadGoalsReport(
            @AuthenticationPrincipal UserPrincipal principal) {

        byte[] pdfBytes = pdfExportService.generateGoalsAndProgressPdf(principal.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "academic-goals-progress.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
