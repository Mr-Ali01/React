package com.resultpoint.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when business validation fails on input data.
 */
public class InvalidRequestException extends ApiException {

    public InvalidRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message);
    }

    public InvalidRequestException(String errorCode, String message) {
        super(HttpStatus.BAD_REQUEST, errorCode, message);
    }
}
