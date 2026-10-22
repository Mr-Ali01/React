package com.resultpoint.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Domain-level access denied exception for FERPA and resource-ownership violations.
 */
public class AccessDeniedException extends ApiException {

    public AccessDeniedException(String message) {
        super(HttpStatus.FORBIDDEN, "ACCESS_DENIED", message);
    }
}
