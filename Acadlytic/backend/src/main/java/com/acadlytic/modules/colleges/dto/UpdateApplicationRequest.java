package com.acadlytic.modules.colleges.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for PUT /api/v1/college-registrations/my-application.
 * Updates profile fields of an unsubmitted draft revision.
 */
public record UpdateApplicationRequest(
        @NotBlank(message = "Legal name is required.")
        @Size(max = 255, message = "Legal name must not exceed 255 characters.")
        String legalName,

        @NotBlank(message = "Address line 1 is required.")
        @Size(max = 255, message = "Address line 1 must not exceed 255 characters.")
        String addressLine1,

        @Size(max = 255, message = "Address line 2 must not exceed 255 characters.")
        String addressLine2,

        @NotBlank(message = "City is required.")
        @Size(max = 100, message = "City must not exceed 100 characters.")
        String city,

        @NotBlank(message = "State is required.")
        @Size(max = 100, message = "State must not exceed 100 characters.")
        String state,

        @NotBlank(message = "Country is required.")
        @Size(max = 100, message = "Country must not exceed 100 characters.")
        String country,

        @NotBlank(message = "Postal code is required.")
        @Size(max = 30, message = "Postal code must not exceed 30 characters.")
        String postalCode,

        @Size(max = 255, message = "Website URL must not exceed 255 characters.")
        String websiteUrl,

        @NotBlank(message = "Contact phone is required.")
        @Size(max = 50, message = "Contact phone must not exceed 50 characters.")
        String contactPhone,

        @NotBlank(message = "Affiliated university name is required.")
        @Size(max = 255, message = "Affiliated university name must not exceed 255 characters.")
        String affiliatedUniversityName
) {}
