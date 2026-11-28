package com.acadlytic.modules.colleges.dto;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class WebsiteUrlConstraintValidator implements ConstraintValidator<ValidWebsiteUrl, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return WebsiteUrlValidator.isValid(value);
    }
}
