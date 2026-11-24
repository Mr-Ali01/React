package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.dto.PageResponse;
import com.acadlytic.common.exception.AppException;
import com.acadlytic.common.exception.GlobalExceptionHandler;
import com.acadlytic.modules.colleges.dto.CollegeReviewDetailResponse;
import com.acadlytic.modules.colleges.dto.CollegeReviewSummaryResponse;
import com.acadlytic.modules.colleges.dto.DocumentDownload;
import com.acadlytic.modules.colleges.dto.DocumentResponse;
import com.acadlytic.modules.colleges.dto.ReviewAdminUserResponse;
import com.acadlytic.modules.colleges.dto.ReviewDecisionAction;
import com.acadlytic.modules.colleges.dto.ReviewDecisionRequest;
import com.acadlytic.modules.colleges.dto.ReviewDecisionResponse;
import com.acadlytic.modules.colleges.dto.ReviewHistoryItemResponse;
import com.acadlytic.modules.colleges.dto.ReviewQueueItemResponse;
import com.acadlytic.modules.colleges.dto.SubmittedRevisionResponse;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.service.CollegeReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CollegeReviewControllerUnitTest {

    @Mock
    private CollegeReviewService collegeReviewService;

    @InjectMocks
    private CollegeReviewController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /reviews - 200 OK with default pagination and queue payload")
    void getReviewQueue_defaultParams_returns200() throws Exception {
        ReviewQueueItemResponse item = new ReviewQueueItemResponse(
                101L, "OU-TECH", "Osmania University", 205L, 1,
                CollegeApprovalStatus.PENDING, Instant.now(), "Sarah Jenkins",
                "admin@outech.ac.in", 0, 0, 2L);

        PageResponse<ReviewQueueItemResponse> pageResponse = new PageResponse<>(
                List.of(item), 0, 20, 1L, 1, true);

        when(collegeReviewService.getPendingReviewQueue(any(), any(), any(), anyInt(), anyInt(), anyString()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].collegeId").value(101))
                .andExpect(jsonPath("$.data.content[0].collegeCode").value("OU-TECH"))
                .andExpect(jsonPath("$.data.content[0].documentCount").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /reviews - 400 Bad Request on invalid date range (from > to)")
    void getReviewQueue_invalidDateRange_returns400() throws Exception {
        when(collegeReviewService.getPendingReviewQueue(any(), any(), any(), anyInt(), anyInt(), anyString()))
                .thenThrow(new AppException("INVALID_DATE_RANGE", "'from' date cannot be after 'to' date.", HttpStatus.BAD_REQUEST));

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews")
                        .param("from", "2026-11-25T00:00:00Z")
                        .param("to", "2026-11-20T00:00:00Z"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_DATE_RANGE"));
    }

    @Test
    @DisplayName("GET /reviews - 400 Bad Request on invalid sort property")
    void getReviewQueue_invalidSortProperty_returns400() throws Exception {
        when(collegeReviewService.getPendingReviewQueue(any(), any(), any(), anyInt(), anyInt(), anyString()))
                .thenThrow(new AppException("INVALID_SORT_PROPERTY", "Invalid sort property.", HttpStatus.BAD_REQUEST));

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews")
                        .param("sort", "unapprovedField,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_SORT_PROPERTY"));
    }

    @Test
    @DisplayName("GET /reviews/{collegeId} - 200 OK returns full review detail")
    void getReviewDetail_validCollege_returns200() throws Exception {
        CollegeReviewSummaryResponse college = new CollegeReviewSummaryResponse(
                101L, "Osmania Tech", "OU-TECH", CollegeApprovalStatus.PENDING,
                CollegeStatus.PENDING_VERIFICATION, false, 0, 0, Instant.now());
        ReviewAdminUserResponse admin = new ReviewAdminUserResponse(
                55L, "admin@outech.ac.in", "Sarah", "Jenkins", Instant.now(), Instant.now());
        SubmittedRevisionResponse rev = new SubmittedRevisionResponse(
                205L, 1, CollegeApprovalStatus.PENDING, "Osmania Tech", "Main Road",
                null, "Hyderabad", "Telangana", "India", "500007", "https://outech.ac.in",
                "+914027098243", "Osmania University", Instant.now());
        DocumentResponse doc = new DocumentResponse(
                501L, 205L, DocumentCategory.UNIVERSITY_AFFILIATION_CERTIFICATE,
                "cert.pdf", "application/pdf", 2048L, "hash123", null, Instant.now());
        ReviewHistoryItemResponse hist = new ReviewHistoryItemResponse(
                205L, 1, CollegeApprovalStatus.PENDING, "Osmania Tech", Instant.now(),
                null, null, null, false, null, Instant.now());

        CollegeReviewDetailResponse detail = new CollegeReviewDetailResponse(
                college, admin, rev, List.of(doc), List.of(hist), 0L);

        when(collegeReviewService.getReviewDetail(101L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.college.id").value(101))
                .andExpect(jsonPath("$.data.submittedRevision.id").value(205))
                .andExpect(jsonPath("$.data.activeDocuments[0].id").value(501))
                .andExpect(jsonPath("$.data.concurrencyVersion").value(0));
    }

    @Test
    @DisplayName("GET /reviews/{collegeId} - 404 NOT_FOUND for non-existent college")
    void getReviewDetail_notFound_returns404() throws Exception {
        when(collegeReviewService.getReviewDetail(999L))
                .thenThrow(new AppException("COLLEGE_NOT_FOUND", "Target college not found.", HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("COLLEGE_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /reviews/{collegeId} - 409 Conflict when application not awaiting review")
    void getReviewDetail_notAwaitingReview_returns409() throws Exception {
        when(collegeReviewService.getReviewDetail(101L))
                .thenThrow(new AppException("APPLICATION_NOT_AWAITING_REVIEW", "Application is not currently pending review.", HttpStatus.CONFLICT));

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/101"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));
    }

    @Test
    @DisplayName("GET /reviews/{collegeId}/documents/{documentId} - 200 OK streaming resource with safe headers")
    void downloadDocument_valid_streamsFile() throws Exception {
        byte[] content = "dummy pdf content".getBytes(StandardCharsets.UTF_8);
        ByteArrayResource resource = new ByteArrayResource(content);
        DocumentDownload download = new DocumentDownload(resource, "cert.pdf", "application/pdf", content.length);

        when(collegeReviewService.downloadDocument(101L, 501L)).thenReturn(download);

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/101/documents/501"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cert.pdf\""))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-cache, no-store, must-revalidate"))
                .andExpect(content().bytes(content));
    }

    @Test
    @DisplayName("GET /reviews/{collegeId}/documents/{documentId} - 404 NOT_FOUND when document belongs to another college")
    void downloadDocument_crossTenant_returns404() throws Exception {
        when(collegeReviewService.downloadDocument(101L, 999L))
                .thenThrow(new AppException("DOCUMENT_NOT_FOUND", "Verification document not found.", HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/v1/super-admin/colleges/reviews/101/documents/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 200 OK on valid APPROVE")
    void recordDecision_approve_returns200() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Documents verified successfully.", null);

        ReviewDecisionResponse response = new ReviewDecisionResponse(
                101L, 205L, 1, CollegeApprovalStatus.APPROVED, Instant.now(), 1L);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 200 OK on valid REQUEST_ACTION")
    void recordDecision_requestAction_returns200() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, 0L, "Please upload a clearer affiliation certificate.", null);

        ReviewDecisionResponse response = new ReviewDecisionResponse(
                101L, 205L, 1, CollegeApprovalStatus.ACTION_REQUIRED, Instant.now(), 1L);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("ACTION_REQUIRED"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 200 OK on valid REJECT")
    void recordDecision_reject_returns200() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, 0L, null, "College does not meet UGC criteria.");

        ReviewDecisionResponse response = new ReviewDecisionResponse(
                101L, 205L, 1, CollegeApprovalStatus.REJECTED, Instant.now(), 1L);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 400 Bad Request on REQUEST_ACTION with short notes (<10 chars)")
    void recordDecision_requestActionShortNotes_returns400() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, 0L, "Too short", null);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenThrow(new AppException("VALIDATION_ERROR", "Review notes are required for action request (between 10 and 2000 characters).", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 400 Bad Request on REJECT with short reason (<10 chars)")
    void recordDecision_rejectShortReason_returns400() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REJECT, 0L, null, "Bad docs");

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenThrow(new AppException("VALIDATION_ERROR", "Rejection reason is required (between 10 and 2000 characters).", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 409 Conflict on stale expectedVersion")
    void recordDecision_staleVersion_returns409() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approved", null);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenThrow(new AppException("STALE_APPLICATION_VERSION", "College application was updated by another transaction.", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("STALE_APPLICATION_VERSION"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 409 Conflict when application not awaiting review")
    void recordDecision_notAwaitingReview_returns409() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.APPROVE, 0L, "Approved", null);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenThrow(new AppException("APPLICATION_NOT_AWAITING_REVIEW", "Application is not currently pending review.", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("APPLICATION_NOT_AWAITING_REVIEW"));
    }

    @Test
    @DisplayName("POST /reviews/{collegeId}/decision - 400 Bad Request when 10 action rounds exhausted")
    void recordDecision_maxActionRequiredExceeded_returns400() throws Exception {
        ReviewDecisionRequest request = new ReviewDecisionRequest(
                ReviewDecisionAction.REQUEST_ACTION, 0L, "Correction round 11 not allowed.", null);

        when(collegeReviewService.recordDecision(eq(101L), any(ReviewDecisionRequest.class)))
                .thenThrow(new AppException("MAX_ACTION_REQUIRED_LIMIT_EXCEEDED", "Maximum correction limit (10 rounds) exceeded.", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/v1/super-admin/colleges/reviews/101/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MAX_ACTION_REQUIRED_LIMIT_EXCEEDED"));
    }
}
