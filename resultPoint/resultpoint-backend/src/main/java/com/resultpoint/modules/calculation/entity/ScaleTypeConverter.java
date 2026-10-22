package com.resultpoint.modules.calculation.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ScaleTypeConverter implements AttributeConverter<ScaleType, String> {

    @Override
    public String convertToDatabaseColumn(ScaleType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getDbValue();
    }

    @Override
    public ScaleType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return ScaleType.fromDbValue(dbData);
    }
}
