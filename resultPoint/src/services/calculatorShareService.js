/**
 * ResultPoint - Calculator Share Service
 * Prioritizes sharing the actual visual result card as an image.
 *
 * Sharing Strategy:
 * 1. Web Share API with image file if `navigator.canShare({ files: [...] })` is supported.
 * 2. If file sharing is unsupported or fails:
 *    - Automatically downloads the visual result card PNG image.
 *    - Copies clean text summary to clipboard with public URL included at most ONCE.
 * 3. Never reports false success on cancellation.
 * 4. Strictly protects student privacy: never includes passwords, emails, or personal identifiers.
 */

import {
  generateResultCardBlob,
  downloadResultCardImage,
  resolveShareableUrl
} from './resultCardImageService.js';

/**
 * Formats a clean, readable text summary for sharing or copying.
 * Guarantees that the calculator URL is included AT MOST ONCE.
 */
export function formatShareSummary({
  toolName = 'Academic Calculation',
  score = '0.00',
  scaleText = '',
  metrics = [],
  metadata = {},
  url = ''
}) {
  const lines = [
    `ResultPoint — ${toolName} Result`,
    '━'.repeat(35),
    `Result: ${score}${scaleText ? ` ${scaleText}` : ''}`
  ];

  // Add metrics if available
  const metricPairs = metrics
    .filter((m) => m && (m.label || m.name) && m.value !== undefined && m.value !== null)
    .map((m) => `${m.label || m.name}: ${m.value}`);

  if (metricPairs.length > 0) {
    lines.push(metricPairs.join(' | '));
  }

  // Add academic metadata if provided (non-private only: University, Regulation, Semester)
  const metaPairs = [];
  if (metadata.university) metaPairs.push(`University: ${metadata.university}`);
  if (metadata.semester) metaPairs.push(`Semester: ${metadata.semester}`);
  if (metadata.regulation) metaPairs.push(`Regulation: ${metadata.regulation}`);
  if (metaPairs.length > 0) {
    lines.push(metaPairs.join(' | '));
  }

  lines.push('');
  lines.push('Calculated by ResultPoint — not an official university marksheet.');

  // URL resolution (Included AT MOST ONCE, cleanly formatted)
  const { url: targetUrl, isLocal } = resolveShareableUrl(url);
  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    if (isLocal) {
      lines.push(`Local Preview: ${targetUrl}`);
    } else {
      lines.push(`Calculate yours at: ${targetUrl}`);
    }
  }

  return lines.join('\n');
}

/**
 * Copies plain text to clipboard with universal legacy fallback
 */
export async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to DOM fallback
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return !!successful;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Share calculation result prioritizing visual result card image file sharing
 *
 * @param {Object} params
 * @param {string} [params.toolName]
 * @param {string|number} params.score
 * @param {string} [params.scaleText]
 * @param {Array<{label: string, value: string|number}>} [params.metrics]
 * @param {Object} [params.metadata]
 * @param {Object} [params.standing]
 * @param {string} [params.url]
 * @returns {Promise<{success: boolean, method: 'file'|'download_and_clipboard'|'clipboard'|'none', cancelled?: boolean, message: string}>}
 */
export async function shareCalculationResult(params = {}) {
  const toolName = params.toolName || params.calculatorName || 'Academic Result';
  const cleanTitle = `ResultPoint - ${toolName}`;
  const shareText = formatShareSummary(params);
  const sanitizedFilename = `ResultPoint_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}_Result.png`;

  // 1. Generate Visual Result Card Image Blob
  let imageBlob = null;
  try {
    imageBlob = await generateResultCardBlob(params);
  } catch (err) {
    console.warn('Could not generate visual card image blob:', err);
  }

  // 2. Try Web Share API with File if supported
  if (
    imageBlob &&
    typeof File !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      const imageFile = new File([imageBlob], sanitizedFilename, { type: 'image/png' });
      const canShareFile = navigator.canShare({ files: [imageFile] });

      if (canShareFile) {
        // Build concise share text without duplicating the URL if share sheet adds url
        const { url: targetUrl, isLocal } = resolveShareableUrl(params.url);
        const shareData = {
          title: cleanTitle,
          text: shareText,
          files: [imageFile]
        };

        // Note: Do not attach url property if shareText already contains it, to prevent duplicate display
        if (targetUrl && !isLocal && !shareText.includes(targetUrl)) {
          shareData.url = targetUrl;
        }

        await navigator.share(shareData);
        return {
          success: true,
          method: 'file',
          message: 'Visual result card shared successfully!'
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          cancelled: true,
          method: 'file',
          message: 'Share cancelled'
        };
      }
      console.warn('File share via Web Share API failed, falling back:', err);
    }
  }

  // 3. Fallback: Download Visual Card Image + Copy Text Summary to Clipboard
  let imageDownloaded = false;
  if (imageBlob) {
    imageDownloaded = downloadResultCardImage(imageBlob, sanitizedFilename);
  }

  const textCopied = await copyToClipboard(shareText);

  if (imageDownloaded && textCopied) {
    return {
      success: true,
      method: 'download_and_clipboard',
      message: 'Visual result card downloaded & summary copied to clipboard!'
    };
  }

  if (imageDownloaded) {
    return {
      success: true,
      method: 'download_and_clipboard',
      message: 'Visual result card downloaded!'
    };
  }

  if (textCopied) {
    return {
      success: true,
      method: 'clipboard',
      message: 'Result summary copied to clipboard!'
    };
  }

  return {
    success: false,
    method: 'none',
    message: 'Unable to share or export result.'
  };
}

export default {
  formatShareSummary,
  copyToClipboard,
  shareCalculationResult
};
