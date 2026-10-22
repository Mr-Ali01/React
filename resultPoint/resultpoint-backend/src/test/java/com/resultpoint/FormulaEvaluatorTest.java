package com.resultpoint;

import com.resultpoint.modules.calculation.formula.FormulaEvaluator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("FormulaEvaluator Unit Tests")
public class FormulaEvaluatorTest {

    private FormulaEvaluator formulaEvaluator;

    @BeforeEach
    void setUp() {
        formulaEvaluator = new FormulaEvaluator();
    }

    @Test
    @DisplayName("Should evaluate Osmania University formula: CGPA * 10")
    void shouldEvaluateOuFormula() {
        BigDecimal cgpa = new BigDecimal("8.55");
        BigDecimal result = formulaEvaluator.evaluateCgpaFormula("CGPA * 10", cgpa, 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("85.50"), result);
    }

    @Test
    @DisplayName("Should evaluate JNTUH formula: (CGPA - 0.5) * 10")
    void shouldEvaluateJntuhFormula() {
        BigDecimal cgpa = new BigDecimal("8.50");
        BigDecimal result = formulaEvaluator.evaluateCgpaFormula("(CGPA - 0.5) * 10", cgpa, 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("80.00"), result);
    }

    @Test
    @DisplayName("Should evaluate Standard UGC formula: (CGPA - 0.75) * 10")
    void shouldEvaluateStandardUgcFormula() {
        BigDecimal cgpa = new BigDecimal("8.50");
        BigDecimal result = formulaEvaluator.evaluateCgpaFormula("(CGPA - 0.75) * 10", cgpa, 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("77.50"), result);
    }

    @Test
    @DisplayName("Should evaluate CBSE style formula: CGPA * 9.5")
    void shouldEvaluateMultiplierWithDecimal() {
        BigDecimal cgpa = new BigDecimal("8.00");
        BigDecimal result = formulaEvaluator.evaluateCgpaFormula("CGPA * 9.5", cgpa, 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("76.00"), result);
    }

    @Test
    @DisplayName("Should handle case-insensitive variable names (cgpa, SGPA)")
    void shouldHandleCaseInsensitivity() {
        BigDecimal value = new BigDecimal("9.00");
        BigDecimal result1 = formulaEvaluator.evaluateCgpaFormula("cgpa * 10", value, 2, RoundingMode.HALF_UP);
        BigDecimal result2 = formulaEvaluator.evaluateCgpaFormula("SGPA * 10", value, 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("90.00"), result1);
        assertEquals(new BigDecimal("90.00"), result2);
    }

    @Test
    @DisplayName("Should reject unknown variables or unauthorized identifiers")
    void shouldRejectUnknownVariables() {
        BigDecimal cgpa = new BigDecimal("8.00");
        assertThrows(IllegalArgumentException.class, () ->
                formulaEvaluator.evaluateCgpaFormula("System.exit(0) + CGPA", cgpa, 2, RoundingMode.HALF_UP));
    }

    @Test
    @DisplayName("Should reject mismatched parentheses")
    void shouldRejectMismatchedParentheses() {
        BigDecimal cgpa = new BigDecimal("8.00");
        assertThrows(IllegalArgumentException.class, () ->
                formulaEvaluator.evaluateCgpaFormula("(CGPA - 0.5 * 10", cgpa, 2, RoundingMode.HALF_UP));
    }

    @Test
    @DisplayName("Should reject division by zero")
    void shouldRejectDivisionByZero() {
        BigDecimal cgpa = new BigDecimal("8.00");
        assertThrows(ArithmeticException.class, () ->
                formulaEvaluator.evaluateCgpaFormula("CGPA / 0", cgpa, 2, RoundingMode.HALF_UP));
    }

    @Test
    @DisplayName("Should reject null or blank expression")
    void shouldRejectNullOrBlankExpression() {
        BigDecimal cgpa = new BigDecimal("8.00");
        assertThrows(IllegalArgumentException.class, () ->
                formulaEvaluator.evaluateCgpaFormula("", cgpa, 2, RoundingMode.HALF_UP));
        assertThrows(IllegalArgumentException.class, () ->
                formulaEvaluator.evaluateCgpaFormula(null, cgpa, 2, RoundingMode.HALF_UP));
    }
}
