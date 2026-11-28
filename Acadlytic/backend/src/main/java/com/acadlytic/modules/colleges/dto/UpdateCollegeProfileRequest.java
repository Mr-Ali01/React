package com.acadlytic.modules.colleges.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCollegeProfileRequest(
        @NotBlank(message = "College name is required")
        @Size(max = 255, message = "College name must not exceed 255 characters")
        String name,

        String code,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 255, message = "Address line 1 must not exceed 255 characters")
        String addressLine1,

        @Size(max = 255, message = "Address line 2 must not exceed 255 characters")
        String addressLine2,

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @NotBlank(message = "State is required")
        @Size(max = 100, message = "State must not exceed 100 characters")
        String state,

        @NotBlank(message = "Country is required")
        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country,

        @NotBlank(message = "Postal code is required")
        @Size(max = 30, message = "Postal code must not exceed 30 characters")
        String postalCode,

        @Size(max = 50, message = "Contact phone must not exceed 50 characters")
        String contactPhone,

        @Email(message = "Contact email must be a valid email address")
        @Size(max = 255, message = "Contact email must not exceed 255 characters")
        String contactEmail,

        @Size(max = 255, message = "Website URL must not exceed 255 characters")
        String websiteUrl,

        @Size(max = 255, message = "Affiliated university name must not exceed 255 characters")
        String affiliatedUniversityName,

        @Min(value = 1800, message = "Established year must be at least 1800")
        @Max(value = 2100, message = "Established year must be at most 2100")
        Integer establishedYear,

        @Size(max = 255, message = "Accreditation details must not exceed 255 characters")
        String accreditationDetails,

        @NotNull(message = "Record version is required for optimistic locking")
        Long version
) {
    public UpdateCollegeProfileRequest {
        name = normalizeRequired(name);
        code = normalizeOptional(code);
        addressLine1 = normalizeRequired(addressLine1);
        addressLine2 = normalizeOptional(addressLine2);
        city = normalizeRequired(city);
        state = normalizeRequired(state);
        country = normalizeRequired(country);
        postalCode = normalizeRequired(postalCode);
        contactPhone = normalizeOptional(contactPhone);
        contactEmail = normalizeOptional(contactEmail);
        websiteUrl = normalizeOptional(websiteUrl);
        affiliatedUniversityName = normalizeOptional(affiliatedUniversityName);
        accreditationDetails = normalizeOptional(accreditationDetails);
    }

    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String normalizeRequired(String value) {
        return value != null ? value.trim() : null;
    }
}
