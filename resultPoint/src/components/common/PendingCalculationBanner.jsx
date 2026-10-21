import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Bookmark, CheckCircle2, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectPendingCalculation,
  clearPendingCalculation,
  savePendingCalculation,
  restorePendingCalculation,
} from '../../features/calculation/calculationSlice';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export default function PendingCalculationBanner() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const pending = useAppSelector(selectPendingCalculation);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with storage events and active user changes
  useEffect(() => {
    dispatch(restorePendingCalculation(user));

    const handlePendingUpdated = () => {
      dispatch(restorePendingCalculation(user));
    };

    window.addEventListener('pending_calculation_updated', handlePendingUpdated);
    window.addEventListener('storage', handlePendingUpdated);

    return () => {
      window.removeEventListener('pending_calculation_updated', handlePendingUpdated);
      window.removeEventListener('storage', handlePendingUpdated);
    };
  }, [dispatch, user]);

  if (!pending) return null;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const resultAction = await dispatch(savePendingCalculation());
      if (savePendingCalculation.fulfilled.match(resultAction)) {
        showToast(`Your ${resultAction.payload?.tool || 'calculation'} has been saved to your Calculation History!`);
      } else {
        showToast(resultAction.payload || 'Failed to save calculation. You can try again.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred while saving.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    dispatch(clearPendingCalculation());
    showToast('Pending calculation discarded.');
  };

  const isAuthPage = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup') || location.pathname.startsWith('/auth');
  const isCalcPage = location.pathname.startsWith('/calculators');

  return (
    <div
      role="region"
      aria-label="Pending Calculation Notification"
      className={`w-full bg-accent-soft/80 border-b border-accent/25 backdrop-blur-md px-4 py-3 sm:px-6 transition-all animate-fadeIn relative z-30 ${isCalcPage ? 'hidden lg:block' : ''}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left: Icon & Description */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
            {isAuthenticated ? <Sparkles className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-text-h text-xs sm:text-sm">
                {isAuthenticated ? 'Your calculation is ready to save.' : 'Calculation Preserved'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-accent/15 text-accent border border-accent/25">
                {pending.tool || pending.calculatorType || 'Academic Calculation'}
              </span>
              <span className="font-extrabold text-accent">
                {pending.score || pending.result}
              </span>
            </div>
            <p className="text-[11px] text-text-m truncate mt-0.5">
              {isAuthenticated
                ? `${pending.query || pending.summary || 'Ready to record to your account history.'}`
                : isAuthPage
                ? 'Sign in or create an account to attach this calculation to your Calculation History.'
                : 'You chose Save Result while logged out. Sign in to save this evaluation to your account.'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="py-1.5 px-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition-all flex items-center gap-1.5 shadow-accent active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save to History</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDiscard}
                className="py-1.5 px-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-m hover:text-text-h font-medium transition-all cursor-pointer"
                title="Discard this calculation"
              >
                Discard
              </button>
            </>
          ) : !isAuthPage ? (
            <>
              <Link
                to="/login"
                state={{ from: pending.path || location.pathname }}
                className="py-1.5 px-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition-all flex items-center gap-1.5 shadow-accent active:scale-95 cursor-pointer"
              >
                <span>Sign In to Save</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleDiscard}
                className="py-1.5 px-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-m hover:text-text-h font-medium transition-all cursor-pointer"
                title="Discard this calculation"
              >
                Discard
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDiscard}
              className="py-1 px-2 rounded-lg text-text-light hover:text-text-h hover:bg-card transition-all flex items-center gap-1 text-[11px]"
              title="Discard preserved calculation"
            >
              <X className="w-3 h-3" />
              <span>Discard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
