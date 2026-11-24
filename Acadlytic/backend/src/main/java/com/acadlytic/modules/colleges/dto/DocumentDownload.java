package com.acadlytic.modules.colleges.dto;

import org.springframework.core.io.Resource;

/**
 * Encapsulates a safely streamed document file and metadata for download responses.
 */
public record DocumentDownload(
        Resource resource,
        String filename,
        String mimeType,
        long contentLength
) {}
