import React, { useEffect } from 'react';
import { X, Bookmark, Download, Share2, Loader2, Lightbulb, AlertCircle, TrendingUp } from 'lucide-react';

export default function MobileResultModal({
  isOpen,
  onClose,
  title = 'Calculation Result',
  score = 0,
  maxScale = 10,
  metrics = [],
  standing = null,
  metadata = {},
  onSaveClick,
  onDownloadPdf,
  onShare,
  isGeneratingPdf = false,
  isSharing = false,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numScore = parseFloat(score) || 0;
  const numMax = parseFloat(maxScale) || 10;
  const circumference = 2 * Math.PI * 64; // 402.12
  const fraction = Math.max(0, Math.min(1, numScore / numMax));
  const strokeDashoffset = circumference - fraction * circumference;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-result-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl relative p-4 sm:p-5 text-left my-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shadow-subtle shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 id="mobile-result-modal-title" className="text-sm font-bold text-text-h leading-none">
                Calculation Result
              </h2>
              <span className="text-[10.5px] font-semibold text-accent mt-0.5 block">
                {title}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-text-light hover:text-text-h hover:bg-bg-sec flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close calculation result"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Orange Hero Result Card */}
        <div className="rounded-2xl bg-gradient-to-b from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-4 sm:p-5 shadow-accent text-center relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
            {title}
          </h3>

          {/* SVG Circular Progress Gauge */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto my-3 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="64"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                fill="transparent"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
                className="progress-ring-circle"
                strokeDasharray="402.12"
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {typeof score === 'number' ? score.toFixed(2) : score}
              </span>
              <span className="text-[10px] font-semibold text-white/80">out of {maxScale}</span>
            </div>
          </div>

          {/* Standing Badge */}
          {standing && (
            <>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  <span>{standing.icon}</span>
                  <span>{standing.text}</span>
                </span>
              </div>
              {standing.narrative && (
                <p className="text-[11px] text-white/90 leading-relaxed px-1">
                  {standing.narrative}
                </p>
              )}
            </>
          )}

          {/* Breakdown Metrics */}
          {metrics && metrics.length > 0 && (
            <div className="mt-3.5 p-3 rounded-xl bg-card text-text-h border border-white/20 space-y-1.5 text-xs text-left shadow-subtle">
              {metrics.map((m, idx) => (
                <div key={m.label || idx} className="flex items-center justify-between text-text-m text-[11px]">
                  <span>{m.label || m.name}</span>
                  <span className={`font-bold ${m.highlight ? 'text-accent font-extrabold' : 'text-text-h'}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Button Cluster */}
          <div className="mt-3.5 space-y-2">
            <button
              type="button"
              onClick={onSaveClick}
              className="w-full py-2.5 px-3 rounded-xl bg-white text-accent hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-subtle active:scale-95 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Result</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={onDownloadPdf}
                className="py-2.5 px-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                disabled={isSharing}
                onClick={onShare}
                className="py-2.5 px-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSharing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calculation Method (if available) */}
        {metadata.calculationMethod && (
          <div className="p-2.5 rounded-xl bg-bg-sec border border-border text-[11px] text-text-m flex items-center justify-between">
            <span className="font-semibold text-text-h">Method:</span>
            <span>{metadata.calculationMethod}</span>
          </div>
        )}

        {/* Official University Disclaimer */}
        <div className="p-3 rounded-xl bg-bg-sec border border-border/80 flex items-start gap-2 text-text-m text-[10.5px] leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-text-h">Disclaimer:</strong> This calculation is generated by ResultPoint for academic planning purposes and is not an official university marksheet or transcript.
          </span>
        </div>

        {/* Tips to Improve Card (if present) */}
        {standing?.tips && (
          <div className="rounded-xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5 text-left">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-h block">Tips to Improve</span>
              <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                {standing.tips}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Close Action */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-border bg-bg-sec hover:bg-card text-text-m hover:text-text-h text-xs font-semibold transition-colors cursor-pointer"
          >
            Close & Keep Editing
          </button>
        </div>
      </div>
    </div>
  );
}
