package com.resultpoint.modules.auth.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM Token Encryption Service.
 * Protects cached refresh-token response payloads during the 30-second concurrency grace window.
 */
@Slf4j
@Service
public class TokenEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_NONCE_LENGTH_BYTES = 12; // 96-bit nonce
    private static final int GCM_TAG_LENGTH_BITS = 128;   // 128-bit auth tag

    @Value("${resultpoint.security.token-cache-key:${resultpoint.jwt.secret}}")
    private String rawEncryptionKey;

    private SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    @PostConstruct
    public void init() {
        if (rawEncryptionKey == null || rawEncryptionKey.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: Token cache encryption key is unconfigured.");
        }

        byte[] keyBytes = rawEncryptionKey.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("FATAL: Token cache encryption key must be at least 256 bits (32 bytes).");
        }

        // Use first 32 bytes for AES-256
        byte[] aes256Key = new byte[32];
        System.arraycopy(keyBytes, 0, aes256Key, 0, 32);
        this.secretKey = new SecretKeySpec(aes256Key, "AES");
        log.info("TokenEncryptionService initialized with AES-256-GCM (96-bit nonce, 128-bit tag)");
    }

    /**
     * Encrypts plaintext JSON payload using AES-256-GCM with a unique 96-bit nonce.
     *
     * @param plaintext UTF-8 JSON string
     * @return Base64-encoded string containing [12-byte nonce | ciphertext + 16-byte tag]
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }

        try {
            byte[] nonce = new byte[GCM_NONCE_LENGTH_BYTES];
            secureRandom.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(nonce.length + ciphertext.length);
            byteBuffer.put(nonce);
            byteBuffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception ex) {
            log.error("Failed to encrypt token response payload: {}", ex.getMessage());
            throw new IllegalStateException("Encryption failed", ex);
        }
    }

    /**
     * Decrypts a Base64-encoded AES-256-GCM payload.
     *
     * @param base64Payload Base64 string containing [12-byte nonce | ciphertext + tag]
     * @return Decrypted UTF-8 JSON string
     */
    public String decrypt(String base64Payload) {
        if (base64Payload == null) {
            return null;
        }

        try {
            byte[] cipherMessage = Base64.getDecoder().decode(base64Payload);
            if (cipherMessage.length < GCM_NONCE_LENGTH_BYTES) {
                throw new IllegalArgumentException("Invalid payload length");
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(cipherMessage);
            byte[] nonce = new byte[GCM_NONCE_LENGTH_BYTES];
            byteBuffer.get(nonce);

            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] decrypted = cipher.doFinal(ciphertext);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            log.error("Failed to decrypt token response payload: {}", ex.getMessage());
            throw new IllegalStateException("Decryption failed", ex);
        }
    }
}
