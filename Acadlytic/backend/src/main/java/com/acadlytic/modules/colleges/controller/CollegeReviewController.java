package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.dto.PageResponse;
import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.colleges.dto.CollegeReviewDetailResponse;
import com.acadlytic.modules.colleges.dto.DocumentDownload;
import com.acadlytic.modules.colleges.dto.DocumentReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.DocumentReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.DocumentReviewHistoryItemResponse;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.ReviewQueueItemResponse;
import com.acadlytic.modules.colleges.service.CollegeReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * Super Admin controller for pending review queue inspection, detailed revision analysis,
 * secure verification document downloads, and review decision execution (Phase 03, Module 3.4).
 */
@RestController
@RequestMapping("/api/v1/super-admin/colleges/reviews")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin Review", description = "Review and decision workflow for college registration applications")
public class CollegeReviewController {

    private final CollegeReviewService collegeReviewService;

    public CollegeReviewController(CollegeReviewService collegeReviewService) {
        this.collegeReviewService = collegeReviewService;
    }

    @GetMapping
    @Operation(summary = "List pending college registration applications awaiting Super Admin review")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review queue retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid search query, date range, or sort property"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role")
    })
    public ApiResponse<PageResponse<ReviewQueueItemResponse>> getReviewQueue(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "from", required = false) Instant from,
            @RequestParam(name = "to", required = false) Instant to,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "submittedForReviewAt,asc") String sort) {

        PageResponse<ReviewQueueItemResponse> response = collegeReviewService.getPendingReviewQueue(
                search, from, to, page, size, sort);
        return ApiResponse.success("Review queue retrieved successfully.", response);
    }

    @GetMapping("/{collegeId}")
    @Operation(summary = "Get full application review detail, submitted revision, and revision history")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review detail retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Target college not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Application is not currently pending review")
    })
    public ApiResponse<CollegeReviewDetailResponse> getReviewDetail(@PathVariable("collegeId") Long collegeId) {
        CollegeReviewDetailResponse response = collegeReviewService.getReviewDetail(collegeId);
        return ApiResponse.success("Review detail retrieved successfully.", response);
    }

    @GetMapping("/{collegeId}/documents/{documentId}")
    @Operation(summary = "Download verification document with safe streaming headers")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document streamed successfully",
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE)),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Document or college not found")
    })
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable("collegeId") Long collegeId,
            @PathVariable("documentId") Long documentId) {

        DocumentDownload download = collegeReviewService.downloadDocument(collegeId, documentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.mimeType()))
                .contentLength(download.contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.filename() + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-cache, no-store, must-revalidate")
                .body(download.resource());
    }

    @PostMapping("/{collegeId}/decision")
    @Operation(summary = "Record Super Admin review decision (APPROVE, REQUEST_ACTION, REJECT)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review decision recorded successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or max action required limit exceeded"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Target college not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Stale application version or application not awaiting review")
    })
    public ApiResponse<ReviewDecisionResponse> recordDecision(
            @PathVariable("collegeId") Long collegeId,
            @Valid @RequestBody ReviewDecisionRequest request) {

        ReviewDecisionResponse response = collegeReviewService.recordDecision(collegeId, request);
        return ApiResponse.success("Application review decision recorded successfully.", response);
    }

    @PostMapping("/{collegeId}/documents/{documentId}/decision")
    @Operation(summary = "Record Super Admin review decision for an individual document (ACCEPT, REJECT)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document review decision recorded successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error in decision request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Target college or document not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Stale document version or application not awaiting review")
    })
    public ApiResponse<DocumentReviewDecisionResponse> recordDocumentDecision(
            @PathVariable("collegeId") Long collegeId,
            @PathVariable("documentId") Long documentId,
            @Valid @RequestBody DocumentReviewDecisionRequest request) {

        DocumentReviewDecisionResponse response = collegeReviewService.recordDocumentDecision(
                collegeId, documentId, request);
        return ApiResponse.success("Document review decision recorded successfully.", response);
    }

    @GetMapping("/{collegeId}/documents/{documentId}/history")
    @Operation(summary = "Get review decision history for an individual document")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document review history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires SUPER_ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Target college or document not found")
    })
    public ApiResponse<List<DocumentReviewHistoryItemResponse>> getDocumentReviewHistory(
            @PathVariable("collegeId") Long collegeId,
            @PathVariable("documentId") Long documentId) {

        List<DocumentReviewHistoryItemResponse> response = collegeReviewService.getDocumentReviewHistory(
                collegeId, documentId);
        return ApiResponse.success("Document review history retrieved successfully.", response);
    }
}
