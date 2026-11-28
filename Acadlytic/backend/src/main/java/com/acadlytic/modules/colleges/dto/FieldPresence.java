package com.acadlytic.modules.colleges.dto;

/**
 * Tracks property presence in JSON payloads to distinguish:
 * 1. Omitted from JSON (!isPresent)
 * 2. Explicitly submitted as null (isPresent && value == null)
 * 3. Explicitly submitted with a value (isPresent && value != null)
 */
public record FieldPresence<T>(boolean isPresent, T value) {

    public static <T> FieldPresence<T> omitted() {
        return new FieldPresence<>(false, null);
    }

    public static <T> FieldPresence<T> of(T value) {
        return new FieldPresence<>(true, value);
    }

    public boolean isOmitted() {
        return !isPresent;
    }

    public boolean isExplicitNull() {
        return isPresent && value == null;
    }

    public boolean hasValue() {
        return isPresent && value != null;
    }

    public T orElse(T defaultValue) {
        return isPresent ? value : defaultValue;
    }
}
