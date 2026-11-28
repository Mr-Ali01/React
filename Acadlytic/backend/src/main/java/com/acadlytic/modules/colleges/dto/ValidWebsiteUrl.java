package com.acadlytic.modules.colleges.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = WebsiteUrlConstraintValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidWebsiteUrl {
    String message() default "Website URL must be a valid HTTP or HTTPS URL";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
