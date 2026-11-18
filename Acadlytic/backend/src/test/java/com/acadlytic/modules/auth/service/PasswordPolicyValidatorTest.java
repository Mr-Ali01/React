package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyValidatorTest {

    private PasswordPolicyValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PasswordPolicyValidator();
    }

    @Test
    void acceptsValidStrongPassword() {
        assertThatCode(() -> validator.validate("V3ryStr0ng!AcadlyticPass", "admin@college.edu"))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsMaxLength128Characters() {
        String maxPass = "A1!" + "x".repeat(125);
        assertThat(maxPass.length()).isEqualTo(128);
        assertThatCode(() -> validator.validate(maxPass, "admin@college.edu"))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsPasswordShorterThan12Characters() {
        assertThatThrownBy(() -> validator.validate("ShortPass1!", "admin@college.edu"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getErrorCode()).isEqualTo("PASSWORD_POLICY_VIOLATION");
                });
    }

    @Test
    void rejectsPasswordLongerThan128Characters() {
        String tooLong = "A".repeat(129);
        assertThatThrownBy(() -> validator.validate(tooLong, "admin@college.edu"))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("PASSWORD_POLICY_VIOLATION");
    }

    @Test
    void rejectsCommonCompromisedPasswordCaseInsensitive() {
        assertThatThrownBy(() -> validator.validate("Password123456", "admin@college.edu"))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("PASSWORD_POLICY_VIOLATION");
    }

    @Test
    void rejectsPasswordContainingUserEmail() {
        assertThatThrownBy(() -> validator.validate("my-admin@college.edu-2026", "admin@college.edu"))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("PASSWORD_POLICY_VIOLATION");
    }
}
