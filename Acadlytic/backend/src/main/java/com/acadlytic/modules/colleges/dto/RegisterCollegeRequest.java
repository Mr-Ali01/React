package com.acadlytic.modules.colleges.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterCollegeRequest(
        @NotBlank(message = "College legal name is required")
        @Size(max = 255, message = "College legal name must not exceed 255 characters")
        String legalName,

        @NotBlank(message = "College code is required")
        @Size(min = 2, max = 50, message = "College code must be between 2 and 50 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "College code must contain only letters, numbers, underscores, and hyphens")
        String code,

        @NotBlank(message = "Affiliated university name is required")
        @Size(max = 255, message = "Affiliated university name must not exceed 255 characters")
        String affiliatedUniversityName,

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

        @Size(max = 255, message = "Website URL must not exceed 255 characters")
        String websiteUrl,

        @NotBlank(message = "Contact phone is required")
        @Size(max = 50, message = "Contact phone must not exceed 50 characters")
        String contactPhone,

        @NotBlank(message = "Administrator first name is required")
        @Size(max = 100, message = "Administrator first name must not exceed 100 characters")
        String adminFirstName,

        @NotBlank(message = "Administrator last name is required")
        @Size(max = 100, message = "Administrator last name must not exceed 100 characters")
        String adminLastName,

        @NotBlank(message = "Administrator email is required")
        @Email(message = "A valid administrator email address is required")
        @Size(max = 255, message = "Administrator email must not exceed 255 characters")
        String adminEmail,

        @NotBlank(message = "Password is required")
        String password
) {
}
