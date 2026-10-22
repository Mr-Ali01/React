import { useState } from 'react';
import { Bookmark, Lightbulb, TrendingUp, Download, Share2, Loader2, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAuth } from '../../hooks/useAuth';
import { saveCalculationToHistory } from '../../features/calculation/calculationSlice';
import { calculationSaveService } from '../../services/calculationSaveService';
import { downloadCalculatorPdf } from '../../services/calculatorPdfService';
import { shareCalculationResult } from '../../services/calculatorShareService';
import { useToast } from '../../context/ToastContext';
import MobileResultModal from './MobileResultModal';

export default function ResultGaugeCard({
  score = 0,
  maxScale = 10,
  title = 'YOUR GPA RESULT',
  metrics = [],
  standing,
  onSave,
  pdfData,
  shareData,
  onDownloadPdf,
  onShareResult,
  metadata = {},
  subjectRows = [],
  isMobileModalOpen = false,
  onCloseMobileModal = null,
}) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const numScore = parseFloat(score) || 0;
  const numMax = parseFloat(maxScale) || 10;
  const circumference = 2 * Math.PI * 64; // 402.12
  const fraction = Math.max(0, Math.min(1, numScore / numMax));
  const strokeDashoffset = circumference - fraction * circumference;

  const handleSaveClick = () => {
    const calcRecord = {
      tool: title,
      query: `Evaluation score: ${numScore.toFixed(2)} / ${numMax}`,
      score: `${numScore.toFixed(2)}`,
      metrics: metrics.map((m) => ({ label: m.label || m.name, value: String(m.value) })),
      details: {
        score: numScore,
        maxScale: numMax,
        metadata,
        metrics,
        subjectRows
      },
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      path: window.location.pathname,
    };

    if (isAuthenticated) {
      // Logged-in Student -> Save directly, do NOT open auth modal
      try {
        const result = calculationSaveService.saveCalculation(calcRecord);
        if (result.success) {
          dispatch(saveCalculationToHistory(result.record));
          showToast('Calculation saved to your calculation history!');
        } else {
          showToast(result.error || 'Failed to save calculation.', 'error');
        }
      } catch (err) {
        showToast('Failed to save calculation. Please try again.', 'error');
      }
    } else {
      // Logged-out Visitor -> preserve pending calc and open modal
      calculationSaveService.setPendingCalculation(calcRecord);
      if (onSave) {
        onSave(calcRecord);
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      if (onDownloadPdf) {
        await onDownloadPdf();
      } else {
        const dataToExport = pdfData || {
          calculatorName: title,
          subtitle: `Academic calculation evaluation (${numScore.toFixed(2)} / ${numMax})`,
          filename: `ResultPoint_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          score: numScore.toFixed(2),
          maxScale: numMax,
          standing: standing?.text,
          metadata: {
            university: metadata.university || 'ResultPoint Academic Calculator',
            regulation: metadata.regulation || 'Standard 10-Point',
            course: metadata.course || 'Undergraduate Curriculum',
            semester: metadata.semester || 'Current Semester',
            calculationMethod: metadata.calculationMethod || 'Standard Weighted Average',
            totalSubjects: subjectRows.length || metrics.length
          },
          subjectRows: subjectRows,
          metrics: metrics.map((m) => ({
            label: m.label || m.name,
            value: m.value
          }))
        };
        downloadCalculatorPdf(dataToExport);
        showToast('PDF downloaded successfully!');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showToast(err.message || 'Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (onShareResult) {
        await onShareResult();
      } else {
        const payload = shareData || {
          toolName: title,
          score: numScore.toFixed(2),
          maxScale: numMax,
          scaleText: `out of ${numMax}`,
          standing: standing,
          metrics: metrics.map((m) => ({ label: m.label || m.name, value: m.value })),
          metadata: metadata,
          subjectRows: subjectRows
        };
        const result = await shareCalculationResult(payload);
        if (result.success) {
          showToast(result.message);
        } else if (!result.cancelled) {
          showToast(result.message || 'Unable to share result.', 'error');
        }
      }
    } catch (err) {
      console.error('Share result error:', err);
      showToast('Failed to share result.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* Mobile-Only Modal Popup (Opens on Mobile when Calculate is clicked) */}
      <MobileResultModal
        isOpen={isMobileModalOpen}
        onClose={onCloseMobileModal || (() => {})}
        title={title}
        score={score}
        maxScale={maxScale}
        metrics={metrics}
        standing={standing}
        metadata={metadata}
        onSaveClick={handleSaveClick}
        onDownloadPdf={handleDownloadPdf}
        onShare={handleShare}
        isGeneratingPdf={isGeneratingPdf}
        isSharing={isSharing}
      />

      {/* Desktop & Tablet Sidebar (Hidden on Mobile screens < lg) */}
      <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20" aria-label="Evaluation Results">
        {/* Orange Gradient Hero Card */}
        <div className="rounded-2xl bg-gradient-to-b from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-5 shadow-accent text-center relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
            {title}
          </h3>

          {/* Circular SVG Gauge */}
          <div className="relative w-36 h-36 mx-auto my-3 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="64" fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="12" />
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
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {typeof score === 'number' ? score.toFixed(2) : score}
              </span>
              <span className="text-[10px] font-semibold text-white/80">out of {maxScale}</span>
            </div>
          </div>

          {standing && (
            <>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  <span>{standing.icon}</span>
                  <span>{standing.text}</span>
                </span>
              </div>
              <p className="text-[11px] text-white/90 leading-relaxed px-1">
                {standing.narrative}
              </p>
            </>
          )}

          {/* Inner Metrics Breakdown */}
          {metrics.length > 0 && (
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

          {/* Action Button Cluster: Save, Download PDF, Share */}
          <div className="mt-3.5 space-y-2">
            <button
              type="button"
              onClick={handleSaveClick}
              className="w-full py-2 px-3 rounded-xl bg-white text-accent hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-subtle active:scale-95 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Result</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="py-2 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download result as a clean PDF"
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
                onClick={handleShare}
                className="py-2 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                title="Share result or copy summary"
              >
                {isSharing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>{isSharing ? 'Sharing...' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Official University Disclaimer */}
          <div className="mt-3 p-2.5 rounded-xl bg-black/15 border border-white/20 text-[10px] text-white/85 leading-snug text-left flex items-start gap-1.5">
            <AlertCircle className="w-3 h-3 text-white shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> Generated by ResultPoint for academic planning purposes. Not an official university marksheet.
            </span>
          </div>
        </div>

        {/* Tips Card */}
        {standing?.tips && (
          <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-h block">Tips to Improve</span>
              <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                {standing.tips}
              </p>
            </div>
          </div>
        )}

        {/* Keep Going Card */}
        <div className="rounded-2xl bg-accent-soft/60 border border-accent/20 p-3 flex items-start gap-2.5 text-left">
          <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-h block">Keep Going!</span>
            <p className="text-[11px] text-text-m mt-0.5 leading-snug">
              Every subject contributes to your overall performance.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}