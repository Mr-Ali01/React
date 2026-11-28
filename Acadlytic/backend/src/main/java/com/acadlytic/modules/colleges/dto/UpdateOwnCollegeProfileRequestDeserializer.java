package com.acadlytic.modules.colleges.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

public class UpdateOwnCollegeProfileRequestDeserializer extends JsonDeserializer<UpdateOwnCollegeProfileRequest> {

    @Override
    public UpdateOwnCollegeProfileRequest deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node == null || node.isNull()) {
            return null;
        }

        FieldPresence<String> name = extractPresence(node, "name");
        FieldPresence<String> code = extractPresence(node, "code");
        FieldPresence<String> affiliatedUniversityName = extractPresence(node, "affiliatedUniversityName");
        FieldPresence<String> accreditationDetails = extractPresence(node, "accreditationDetails");

        String addressLine1 = extractString(node, "addressLine1");
        String addressLine2 = extractString(node, "addressLine2");
        String city = extractString(node, "city");
        String state = extractString(node, "state");
        String country = extractString(node, "country");
        String postalCode = extractString(node, "postalCode");
        String contactPhone = extractString(node, "contactPhone");
        String contactEmail = extractString(node, "contactEmail");
        String websiteUrl = extractString(node, "websiteUrl");
        Integer establishedYear = extractInteger(node, "establishedYear");
        Long version = extractLong(node, "version");

        return new UpdateOwnCollegeProfileRequest(
                name,
                code,
                addressLine1,
                addressLine2,
                city,
                state,
                country,
                postalCode,
                contactPhone,
                contactEmail,
                websiteUrl,
                affiliatedUniversityName,
                establishedYear,
                accreditationDetails,
                version
        );
    }

    private FieldPresence<String> extractPresence(JsonNode node, String fieldName) {
        if (!node.has(fieldName)) {
            return FieldPresence.omitted();
        }
        JsonNode fieldNode = node.get(fieldName);
        if (fieldNode.isNull()) {
            return FieldPresence.of(null);
        }
        String text = fieldNode.asText();
        return FieldPresence.of(text != null && !text.isBlank() ? text.trim() : (text != null && text.isBlank() ? "" : null));
    }

    private String extractString(JsonNode node, String fieldName) {
        if (!node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        return node.get(fieldName).asText();
    }

    private Integer extractInteger(JsonNode node, String fieldName) {
        if (!node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        JsonNode fieldNode = node.get(fieldName);
        if (fieldNode.isNumber()) {
            return fieldNode.intValue();
        }
        if (fieldNode.isTextual()) {
            try {
                return Integer.parseInt(fieldNode.asText().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private Long extractLong(JsonNode node, String fieldName) {
        if (!node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        JsonNode fieldNode = node.get(fieldName);
        if (fieldNode.isNumber()) {
            return fieldNode.longValue();
        }
        if (fieldNode.isTextual()) {
            try {
                return Long.parseLong(fieldNode.asText().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
