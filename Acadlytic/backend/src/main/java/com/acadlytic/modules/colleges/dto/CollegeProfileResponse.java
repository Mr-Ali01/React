package com.acadlytic.modules.colleges.dto;

/**
 * Institution profile details captured in a registration revision.
 */
public record CollegeProfileResponse(
        String legalName,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String country,
        String postalCode,
        String websiteUrl,
        String contactPhone,
        String affiliatedUniversityName
) {}
