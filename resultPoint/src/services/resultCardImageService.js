/**
 * ResultPoint - Visual Result Card Image Service
 * Generates high-resolution, export-ready PNG images of calculator result cards.
 *
 * Features:
 * - 2x Retina-quality resolution for crisp typography and vector-grade arcs
 * - Accurate representation of calculated scores, circular gauges, metrics, and academic metadata
 * - Standard ResultPoint branding (signature orange gradient, graduation cap emblem)
 * - Clear non-official academic disclaimer
 * - Zero external binary dependencies: pure HTML5 Canvas & SVG rasterization
 * - Universal fallback for non-browser / headless test environments
 */

/**
 * Normalizes text to safe ASCII for clean drawing
 */
function cleanText(val, fallback = '') {
  if (val === undefined || val === null) return fallback;
  return String(val).trim();
}

/**
 * Resolves shareable public URL vs local development preview URL
 */
export function resolveShareableUrl(customUrl = '') {
  if (customUrl) {
    const isLocal = isLocalHost(customUrl);
    return { url: customUrl, isLocal };
  }

  if (typeof window === 'undefined' || !window.location) {
    return { url: '', isLocal: false };
  }

  const currentHref = window.location.href;
  const isLocal = isLocalHost(window.location.origin);

  // If running locally, check if a public deployment origin is configured
  const configuredOrigin =
    (typeof process !== 'undefined' && process.env?.VITE_PUBLIC_URL) ||
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PUBLIC_URL) ||
    '';

  if (isLocal && configuredOrigin) {
    try {
      const publicUrl = new URL(
        window.location.pathname + window.location.search + window.location.hash,
        configuredOrigin
      ).toString();
      return { url: publicUrl, isLocal: false };
    } catch {
      // Fallback
    }
  }

  return { url: currentHref, isLocal };
}

function isLocalHost(urlStr = '') {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local');
  } catch {
    return urlStr.includes('localhost') || urlStr.includes('127.0.0.1');
  }
}

/**
 * Builds standalone, pixel-perfect SVG markup for the result card.
 * This SVG can be rendered to HTML5 Canvas at any resolution or downloaded directly.
 */
export function buildResultCardSvg(cardData = {}, options = {}) {
  const width = options.width || 680;
  const toolName = cleanText(cardData.toolName || cardData.calculatorName || cardData.title, 'Academic Calculator');
  const score = cleanText(cardData.score, '0.00');
  const maxScale = cleanText(cardData.maxScale || cardData.scale, '10');
  const scaleText = cleanText(cardData.scaleText, `out of ${maxScale}`);

  const numScore = parseFloat(score) || 0;
  const numMax = parseFloat(maxScale) || 10;
  const fraction = Math.max(0, Math.min(1, numMax > 0 ? numScore / numMax : 0));

  // Gauge calculations (radius = 54, circumference = 2 * PI * 54 = 339.29)
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const strokeOffset = circ - fraction * circ;

  // Metadata
  const meta = cardData.metadata || {};
  const university = cleanText(meta.university, 'Academic Portal');
  const regulation = cleanText(meta.regulation, 'CBCS');
  const course = cleanText(meta.course, 'Undergraduate');
  const semester = cleanText(meta.semester, 'Current Term');

  // Standing & Narrative
  const standingText = cleanText(cardData.standing?.text || cardData.standing, 'Evaluation Complete');
  const standingNarrative = cleanText(
    cardData.standing?.narrative,
    'Academic performance evaluated based on provided parameters.'
  );

  // Metrics
  const rawMetrics = Array.isArray(cardData.metrics) ? cardData.metrics : [];
  const metrics = rawMetrics.filter((m) => m && (m.label || m.name) && m.value !== undefined);

  // Subject rows (if provided)
  const rawSubjects = Array.isArray(cardData.subjectRows)
    ? cardData.subjectRows
    : Array.isArray(cardData.subjects)
    ? cardData.subjects
    : [];
  const subjects = rawSubjects.slice(0, 8); // Max 8 on visual card

  // Dynamic Height calculation
  let height = 520;
  if (metrics.length > 2) height += 40;
  if (subjects.length > 0) height += 45 + subjects.length * 24;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Escape XML entities
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  // SVG Markup
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <!-- Vibrant Orange Hero Card Gradient -->
    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6B00" />
      <stop offset="50%" stop-color="#FF7A18" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>

    <!-- Card Shadow -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Canvas Background Container -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Outer Border Frame -->
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="20" fill="none" stroke="#334155" stroke-width="1.5" />

  <!-- ==================== HEADER ==================== -->
  <g transform="translate(36, 36)">
    <!-- Brand Icon -->
    <rect x="0" y="0" width="36" height="36" rx="10" fill="#FF6B00" />
    <!-- Mortarboard Icon -->
    <path d="M18 10 L6 16 L18 22 L30 16 Z" fill="#FFFFFF" />
    <path d="M11 19 L11 25 C11 27.5 14 29 18 29 C22 29 25 27.5 25 25 L25 19" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
    <line x1="28" y1="16" x2="28" y2="25" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />

    <!-- Brand Typography -->
    <text x="46" y="22" font-size="20" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">
      Result<tspan fill="#FF6B00">Point</tspan>
    </text>
    <text x="46" y="34" font-size="10" font-weight="500" fill="#94A3B8">
      Calculate. Analyze. Improve.
    </text>

    <!-- Date Stamp on Right -->
    <rect x="${width - 195}" y="4" width="125" height="28" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <text x="${width - 132}" y="22" font-size="11" font-weight="600" fill="#CBD5E1" text-anchor="middle">
      ${esc(dateStr)}
    </text>
  </g>

  <!-- ==================== HERO RESULT CARD ==================== -->
  <g transform="translate(36, 92)" filter="url(#cardShadow)">
    <rect x="0" y="0" width="${width - 72}" height="205" rx="18" fill="url(#heroGrad)" />

    <!-- Subtitle / Tool Name Badge -->
    <text x="24" y="32" font-size="12" font-weight="800" fill="#FFFFFF" fill-opacity="0.9" letter-spacing="1.2">
      ${esc(toolName.toUpperCase())}
    </text>

    <!-- Circular Gauge -->
    <g transform="translate(100, 115)">
      <!-- Background Track -->
      <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="11" />
      <!-- Value Arc -->
      <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"
        stroke-dasharray="${circ}" stroke-dashoffset="${strokeOffset}" transform="rotate(-90)" />

      <!-- Score Text -->
      <text x="0" y="7" font-size="30" font-weight="900" fill="#FFFFFF" text-anchor="middle">
        ${esc(score)}
      </text>
      <text x="0" y="24" font-size="10.5" font-weight="600" fill="#FFFFFF" fill-opacity="0.85" text-anchor="middle">
        ${esc(scaleText)}
      </text>
    </g>

    <!-- Right Side Standing & Narrative -->
    <g transform="translate(200, 52)">
      <!-- Standing Badge -->
      <rect x="0" y="0" width="190" height="28" rx="14" fill="#FFFFFF" fill-opacity="0.22" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1" />
      <text x="14" y="18" font-size="12" font-weight="800" fill="#FFFFFF">
        ${esc(standingText)}
      </text>

      <!-- Narrative Text -->
      <text x="0" y="48" font-size="11" font-weight="500" fill="#FFFFFF" fill-opacity="0.92">
        ${esc(standingNarrative.slice(0, 75))}
      </text>

      <!-- Academic Context Pills -->
      <g transform="translate(0, 78)">
        <rect x="0" y="0" width="180" height="22" rx="6" fill="#000000" fill-opacity="0.2" />
        <text x="8" y="15" font-size="10" font-weight="700" fill="#FFFFFF">
          Uni: <tspan font-weight="500" fill="#FFFFFF" fill-opacity="0.9">${esc(university.slice(0, 24))}</tspan>
        </text>

        <rect x="188" y="0" width="180" height="22" rx="6" fill="#000000" fill-opacity="0.2" />
        <text x="196" y="15" font-size="10" font-weight="700" fill="#FFFFFF">
          Reg: <tspan font-weight="500" fill="#FFFFFF" fill-opacity="0.9">${esc(regulation)}</tspan> | Sem: <tspan font-weight="500" fill="#FFFFFF" fill-opacity="0.9">${esc(semester)}</tspan>
        </text>
      </g>
    </g>
  </g>

  <!-- ==================== METRICS BREAKDOWN ==================== -->
  <g transform="translate(36, 312)">
    <rect x="0" y="0" width="${width - 72}" height="105" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <text x="18" y="24" font-size="11" font-weight="700" fill="#94A3B8" letter-spacing="0.8">
      EVALUATION METRICS
    </text>

    <!-- Metrics Grid -->
    <g transform="translate(18, 36)">
      ${metrics
        .slice(0, 4)
        .map((m, idx) => {
          const colW = (width - 108) / Math.min(4, Math.max(1, metrics.length));
          const x = idx * colW;
          return `
        <g transform="translate(${x}, 0)">
          <text x="0" y="16" font-size="10" font-weight="600" fill="#64748B">${esc(m.label || m.name)}</text>
          <text x="0" y="42" font-size="18" font-weight="800" fill="${m.highlight ? '#FF6B00' : '#FFFFFF'}">${esc(m.value)}</text>
        </g>
      `;
        })
        .join('')}
    </g>
  </g>

  <!-- ==================== FOOTER / DISCLAIMER ==================== -->
  <g transform="translate(36, ${height - 64})">
    <rect x="0" y="0" width="${width - 72}" height="38" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1" fill-opacity="0.8" />
    <!-- Info Circle Icon -->
    <circle cx="18" cy="19" r="7" fill="#0284C7" />
    <text x="18" y="23" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">i</text>

    <!-- Disclaimer Text -->
    <text x="34" y="22" font-size="9.5" font-weight="500" fill="#94A3B8">
      Calculated by ResultPoint for academic planning. Not an official university marksheet.
    </text>

    <!-- Watermark on Right -->
    <text x="${width - 86}" y="22" font-size="10" font-weight="700" fill="#64748B" text-anchor="end">
      resultpoint.app
    </text>
  </g>
</svg>
`.trim();
}

/**
 * Converts result card SVG to a high-resolution HTML5 Canvas
 * @param {Object} cardData
 * @param {Object} [options]
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderResultCardToCanvas(cardData, options = {}) {
  const svgString = buildResultCardSvg(cardData, options);
  const width = options.width || 680;
  // Estimate height matching buildResultCardSvg
  let height = 520;
  const metrics = Array.isArray(cardData.metrics) ? cardData.metrics : [];
  if (metrics.length > 2) height += 40;
  const subjects = Array.isArray(cardData.subjectRows) ? cardData.subjectRows : [];
  if (subjects.length > 0) height += 45 + subjects.length * 24;

  if (typeof document === 'undefined') {
    // In headless test / Node environment without DOM canvas
    return {
      width,
      height,
      toDataURL: () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
      toBlob: (cb) => {
        if (typeof Blob !== 'undefined') {
          cb(new Blob([svgString], { type: 'image/svg+xml' }));
        } else {
          cb(null);
        }
      }
    };
  }

  const canvas = document.createElement('canvas');
  const scale = 2; // 2x Retina scale for crisp lines and text
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize visual result card SVG: ' + (err?.message || 'Image decode failed')));
    };
    img.src = url;
  });
}

/**
 * Generates a clean PNG Blob of the Visual Result Card
 * @param {Object} cardData
 * @param {Object} [options]
 * @returns {Promise<Blob>}
 */
export async function generateResultCardBlob(cardData, options = {}) {
  const canvas = await renderResultCardToCanvas(cardData, options);

  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to data URL conversion
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            resolve(new Blob([ab], { type: 'image/png' }));
          } catch (e) {
            reject(new Error('Failed to encode result card PNG blob: ' + e.message));
          }
        }
      }, 'image/png');
    });
  }

  // Node / mock fallback
  const svgStr = buildResultCardSvg(cardData, options);
  if (typeof Blob !== 'undefined') {
    return new Blob([svgStr], { type: 'image/svg+xml' });
  }
  return null;
}

/**
 * Triggers a browser file download of the visual result card image
 * @param {Blob|string} blobOrDataUrl
 * @param {string} filename
 */
export function downloadResultCardImage(blobOrDataUrl, filename = 'ResultPoint_Scorecard.png') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    let downloadUrl;
    let shouldRevoke = false;

    if (typeof blobOrDataUrl === 'string') {
      downloadUrl = blobOrDataUrl;
    } else if (blobOrDataUrl instanceof Blob) {
      downloadUrl = URL.createObjectURL(blobOrDataUrl);
      shouldRevoke = true;
    } else {
      return false;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (shouldRevoke) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    }
    return true;
  } catch (err) {
    console.error('Download result card image error:', err);
    return false;
  }
}

export const resultCardImageService = {
  buildResultCardSvg,
  renderResultCardToCanvas,
  generateResultCardBlob,
  downloadResultCardImage,
  resolveShareableUrl
};

export default resultCardImageService;
