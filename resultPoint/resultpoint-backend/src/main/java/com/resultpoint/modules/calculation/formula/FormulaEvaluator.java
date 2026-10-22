package com.resultpoint.modules.calculation.formula;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.*;

/**
 * Safe, deterministic arithmetic formula evaluator for academic conversion expressions (e.g. "CGPA * 10", "(CGPA - 0.5) * 10").
 * Avoids any scripting engines or dynamic code execution to ensure zero remote code execution vulnerabilities.
 */
@Slf4j
@Component
public class FormulaEvaluator {

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);

    /**
     * Evaluates a mathematical formula expression substituting the variable "CGPA".
     *
     * @param expression Formula string, e.g. "(CGPA - 0.5) * 10" or "CGPA * 10"
     * @param cgpa Value of CGPA
     * @param decimalPlaces Rounding decimal scale
     * @param roundingMode Rounding mode
     * @return Computed percentage
     */
    public BigDecimal evaluateCgpaFormula(String expression, BigDecimal cgpa, int decimalPlaces, RoundingMode roundingMode) {
        if (expression == null || expression.isBlank()) {
            throw new IllegalArgumentException("Formula expression cannot be null or empty");
        }
        if (cgpa == null) {
            throw new IllegalArgumentException("CGPA value cannot be null");
        }

        List<String> tokens = tokenize(expression, cgpa);
        List<String> rpn = toRpn(tokens);
        BigDecimal result = evaluateRpn(rpn);

        if (decimalPlaces >= 0 && roundingMode != null) {
            result = result.setScale(decimalPlaces, roundingMode);
        }
        return result;
    }

    private List<String> tokenize(String expression, BigDecimal cgpa) {
        List<String> tokens = new ArrayList<>();
        String normalized = expression.replaceAll("\\s+", "");
        int len = normalized.length();
        int i = 0;

        while (i < len) {
            char c = normalized.charAt(i);

            if (c == '+' || c == '-' || c == '*' || c == '/' || c == '(' || c == ')') {
                tokens.add(String.valueOf(c));
                i++;
            } else if (Character.isLetter(c)) {
                int start = i;
                while (i < len && Character.isLetterOrDigit(normalized.charAt(i))) {
                    i++;
                }
                String identifier = normalized.substring(start, i);
                if (identifier.equalsIgnoreCase("CGPA") || identifier.equalsIgnoreCase("SGPA")) {
                    tokens.add(cgpa.toPlainString());
                } else {
                    throw new IllegalArgumentException("Unsupported variable in formula: " + identifier);
                }
            } else if (Character.isDigit(c) || c == '.') {
                int start = i;
                while (i < len && (Character.isDigit(normalized.charAt(i)) || normalized.charAt(i) == '.')) {
                    i++;
                }
                tokens.add(normalized.substring(start, i));
            } else {
                throw new IllegalArgumentException("Invalid character in formula: '" + c + "'");
            }
        }
        return tokens;
    }

    private List<String> toRpn(List<String> tokens) {
        List<String> output = new ArrayList<>();
        Deque<String> operators = new ArrayDeque<>();

        for (int i = 0; i < tokens.size(); i++) {
            String token = tokens.get(i);

            if (isNumber(token)) {
                output.add(token);
            } else if (token.equals("(")) {
                operators.push(token);
            } else if (token.equals(")")) {
                while (!operators.isEmpty() && !operators.peek().equals("(")) {
                    output.add(operators.pop());
                }
                if (operators.isEmpty()) {
                    throw new IllegalArgumentException("Mismatched parentheses in formula");
                }
                operators.pop(); // remove "("
            } else if (isOperator(token)) {
                // Handle unary minus if needed
                if (token.equals("-") && (i == 0 || tokens.get(i - 1).equals("(") || isOperator(tokens.get(i - 1)))) {
                    // Unary negation: push "0" before
                    output.add("0");
                }
                while (!operators.isEmpty() && isOperator(operators.peek()) &&
                        precedence(operators.peek()) >= precedence(token)) {
                    output.add(operators.pop());
                }
                operators.push(token);
            } else {
                throw new IllegalArgumentException("Unrecognized token: " + token);
            }
        }

        while (!operators.isEmpty()) {
            String op = operators.pop();
            if (op.equals("(") || op.equals(")")) {
                throw new IllegalArgumentException("Mismatched parentheses in formula");
            }
            output.add(op);
        }

        return output;
    }

    private BigDecimal evaluateRpn(List<String> rpn) {
        Deque<BigDecimal> stack = new ArrayDeque<>();

        for (String token : rpn) {
            if (isNumber(token)) {
                stack.push(new BigDecimal(token));
            } else if (isOperator(token)) {
                if (stack.size() < 2) {
                    throw new IllegalArgumentException("Invalid expression syntax near " + token);
                }
                BigDecimal b = stack.pop();
                BigDecimal a = stack.pop();
                BigDecimal res;

                switch (token) {
                    case "+":
                        res = a.add(b, MC);
                        break;
                    case "-":
                        res = a.subtract(b, MC);
                        break;
                    case "*":
                        res = a.multiply(b, MC);
                        break;
                    case "/":
                        if (b.compareTo(BigDecimal.ZERO) == 0) {
                            throw new ArithmeticException("Division by zero in percentage formula");
                        }
                        res = a.divide(b, MC);
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported operator: " + token);
                }
                stack.push(res);
            }
        }

        if (stack.size() != 1) {
            throw new IllegalArgumentException("Malformed formula expression");
        }
        return stack.pop();
    }

    private boolean isOperator(String s) {
        return s.equals("+") || s.equals("-") || s.equals("*") || s.equals("/");
    }

    private int precedence(String op) {
        if (op.equals("*") || op.equals("/")) return 2;
        if (op.equals("+") || op.equals("-")) return 1;
        return 0;
    }

    private boolean isNumber(String s) {
        try {
            new BigDecimal(s);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
