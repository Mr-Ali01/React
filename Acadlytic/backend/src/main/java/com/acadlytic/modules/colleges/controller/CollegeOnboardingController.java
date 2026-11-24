package com.acadlytic.modules.colleges.controller;

import com.acadlytic.common.response.ApiResponse;
import com.acadlytic.modules.colleges.dto.CurrentRevisionResponse;
import com.acadlytic.modules.colleges.dto.DocumentDownload;
import com.acadlytic.modules.colleges.dto.DocumentResponse;
import com.acadlytic.modules.colleges.dto.MyApplicationResponse;
import com.acadlytic.modules.colleges.dto.SubmitApplicationResponse;
import com.acadlytic.modules.colleges.dto.UpdateApplicationRequest;
import com.acadlytic.modules.colleges.entity.DocumentCategory;
import com.acadlytic.modules.colleges.service.CollegeOnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller providing Restricted Dashboard, Document Management,
 * and Review Submission endpoints for COLLEGE_ADMIN (Phase 03, Module 3.3).
 */
@RestController
@RequestMapping("/api/v1/college-registrations/my-application")
@Tag(name = "College Onboarding", description = "College Admin restricted dashboard, document management, and review submission")
public class CollegeOnboardingController {

    private final CollegeOnboardingService collegeOnboardingService;

    public CollegeOnboardingController(CollegeOnboardingService collegeOnboardingService) {
        this.collegeOnboardingService = collegeOnboardingService;
    }

    @GetMapping
    @Operation(summary = "Get current application details, active draft, review feedback, checklist, and active documents")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Application details retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied or permanently rejected")
    })
    public ApiResponse<MyApplicationResponse> getMyApplication() {
        return ApiResponse.success(collegeOnboardingService.getMyApplication());
    }

    @PostMapping("/correction-draft")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an immutable correction draft revision (v+1) for eligible ACTION_REQUIRED or REJECTED applications")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Correction draft created or returned idempotently"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid correction state or resubmission limit exceeded"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Application is currently frozen under review")
    })
    public ApiResponse<CurrentRevisionResponse> createCorrectionDraft() {
        return ApiResponse.success("Correction draft ready.", collegeOnboardingService.createCorrectionDraft());
    }

    @PutMapping
    @Operation(summary = "Update profile details of an active unsubmitted registration draft")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Draft profile updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Application is frozen under review")
    })
    public ApiResponse<CurrentRevisionResponse> updateDraftProfile(@Valid @RequestBody UpdateApplicationRequest request) {
        return ApiResponse.success("Application profile updated successfully.", collegeOnboardingService.updateDraftProfile(request));
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a verification document into the active draft")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Document uploaded successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid document format, magic byte mismatch, or document limit exceeded"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Application is frozen under review")
    })
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentCategory") DocumentCategory documentCategory,
            @RequestParam(value = "replacesDocumentId", required = false) Long replacesDocumentId) {
        DocumentResponse response = collegeOnboardingService.uploadDocument(file, documentCategory, replacesDocumentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded successfully.", response));
    }

    @GetMapping("/documents")
    @Operation(summary = "List active (non-superseded) verification documents for the active revision")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Active documents listed successfully")
    })
    public ApiResponse<List<DocumentResponse>> listActiveDocuments() {
        return ApiResponse.success(collegeOnboardingService.getActiveDraftDocuments());
    }

    @GetMapping("/documents/{documentId}")
    @Operation(summary = "Download a verification document with safe streaming headers")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document streamed successfully",
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE)),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied to other tenant document"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<Resource> downloadDocument(@PathVariable("documentId") Long documentId) {
        DocumentDownload download = collegeOnboardingService.downloadDocument(documentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.mimeType()))
                .contentLength(download.contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.filename() + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(download.resource());
    }

    @DeleteMapping("/documents/{documentId}")
    @Operation(summary = "Delete an active document from the draft revision and restore any predecessor")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot delete historical or superseded document"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Application is frozen under review")
    })
    public ApiResponse<Void> deleteDocument(@PathVariable("documentId") Long documentId) {
        collegeOnboardingService.deleteDocument(documentId);
        return ApiResponse.success("Document deleted successfully.", null);
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit or resubmit the application for Super Admin review")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Application submitted for review successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email not verified, mandatory documents missing, or resubmission limit exceeded"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Revision already submitted for review")
    })
    public ApiResponse<SubmitApplicationResponse> submitApplication() {
        return ApiResponse.success("Application submitted for review successfully.", collegeOnboardingService.submitApplicationForReview());
    }
}
