package com.resultpoint;

import com.resultpoint.security.UserPrincipal;
import com.resultpoint.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private static final String VALID_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", VALID_SECRET);
        ReflectionTestUtils.setField(tokenProvider, "accessTokenExpirationSeconds", 900L);
        tokenProvider.init();
    }

    @Test
    void testTokenGenerationAndClaimExtraction() {
        UserPrincipal principal = UserPrincipal.create("usr_student_test", "student@resultpoint.edu", "STUDENT");

        String token = tokenProvider.generateAccessToken(principal);
        Assertions.assertNotNull(token);
        Assertions.assertTrue(tokenProvider.validateToken(token));

        Assertions.assertEquals("usr_student_test", tokenProvider.getUserIdFromToken(token));
        Assertions.assertEquals("student@resultpoint.edu", tokenProvider.getEmailFromToken(token));
        Assertions.assertEquals("ROLE_STUDENT", tokenProvider.getRoleFromToken(token));
    }

    @Test
    void testTamperedTokenFailsValidation() {
        UserPrincipal principal = UserPrincipal.create("usr_student_test", "student@resultpoint.edu", "STUDENT");
        String token = tokenProvider.generateAccessToken(principal);

        // Tamper with the signature portion
        String tamperedToken = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";
        Assertions.assertFalse(tokenProvider.validateToken(tamperedToken), "Tampered token must fail validation");
    }

    @Test
    void testExpiredTokenFailsValidation() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortLivedProvider, "jwtSecret", VALID_SECRET);
        ReflectionTestUtils.setField(shortLivedProvider, "accessTokenExpirationSeconds", -10L); // Already expired
        shortLivedProvider.init();

        UserPrincipal principal = UserPrincipal.create("usr_student_test", "student@resultpoint.edu", "STUDENT");
        String expiredToken = shortLivedProvider.generateAccessToken(principal);

        Assertions.assertFalse(tokenProvider.validateToken(expiredToken), "Expired token must fail validation");
    }

    @Test
    void testNullOrMalformedTokenFailsValidation() {
        Assertions.assertFalse(tokenProvider.validateToken(null));
        Assertions.assertFalse(tokenProvider.validateToken(""));
        Assertions.assertFalse(tokenProvider.validateToken("random.malformed.jwt.string"));
    }

    @Test
    void testInsecureSecretFailsFastOnInit() {
        JwtTokenProvider insecureProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(insecureProvider, "jwtSecret", "too-short-secret"); // Under 32 bytes
        Assertions.assertThrows(IllegalStateException.class, insecureProvider::init,
                "Provider must throw IllegalStateException if secret is less than 256 bits");
    }
}
