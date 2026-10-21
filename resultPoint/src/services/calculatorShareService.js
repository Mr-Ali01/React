/**
 * ResultPoint - Calculator Share Service
 * Provides Web Share API integration with automatic fallback to clipboard copy.
 * Strictly respects student privacy: never includes emails, user IDs, or private records.
 */

/**
 * Formats a clean, readable text summary for sharing or copying
 */
export function formatShareSummary({
  toolName = 'Calculation',
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
    .filter((m) => m && (m.label || m.name) && (m.value !== undefined && m.value !== null))
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

  const targetUrl = url || (typeof window !== 'undefined' && window.location?.href ? window.location.href : '');
  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    lines.push(`Calculate yours at: ${targetUrl}`);
  }

  return lines.join('\n');
}

/**
 * Copies plain text to clipboard with legacy fallback
 */
export async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback for browsers / environments where navigator.clipboard might be restricted
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Share result using Web Share API if supported, otherwise copy to clipboard
 * @param {Object} params
 * @param {string} params.toolName
 * @param {string|number} params.score
 * @param {string} [params.scaleText]
 * @param {Array<{label: string, value: string|number}>} [params.metrics]
 * @param {Object} [params.metadata]
 * @param {string} [params.url]
 * @returns {Promise<{success: boolean, method: 'native'|'clipboard'|'none', cancelled?: boolean, message: string}>}
 */
export async function shareCalculationResult(params) {
  const shareText = formatShareSummary(params);
  const title = `ResultPoint - ${params.toolName || 'Academic Result'}`;
  const targetUrl = params.url || (typeof window !== 'undefined' && window.location?.href ? window.location.href : '');

  // 1. Try Web Share API if supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const shareData = {
        title,
        text: shareText
      };
      if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
        shareData.url = targetUrl;
      }
      await navigator.share(shareData);
      return {
        success: true,
        method: 'native',
        message: 'Result shared successfully!'
      };
    } catch (err) {
      // If user cancelled the share sheet, return cancelled without error
      if (err.name === 'AbortError') {
        return {
          success: false,
          cancelled: true,
          method: 'native',
          message: 'Share cancelled'
        };
      }
      // Otherwise fall through to clipboard fallback
      console.warn('Web Share failed, falling back to clipboard copy:', err);
    }
  }

  // 2. Fallback to copy-to-clipboard
  const copied = await copyToClipboard(shareText);
  if (copied) {
    return {
      success: true,
      method: 'clipboard',
      message: 'Result summary copied to clipboard!'
    };
  }

  return {
    success: false,
    method: 'none',
    message: 'Unable to share or copy result summary.'
  };
}

export default {
  formatShareSummary,
  copyToClipboard,
  shareCalculationResult
};
