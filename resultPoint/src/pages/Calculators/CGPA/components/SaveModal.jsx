import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Lock, CheckCircle2, AlertCircle, ArrowRight, Sparkles, User, Mail, Key } from 'lucide-react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { loginUser, registerUser } from '../../../../features/auth/authSlice';
import {
  saveCalculationToHistory,
  setPendingCalculation,
  clearPendingCalculation,
  selectPendingCalculation,
} from '../../../../features/calculation/calculationSlice';
import { calculationSaveService } from '../../../../services/calculationSaveService';
import { useToast } from '../../../../context/ToastContext';

export default function SaveModal({
  isOpen,
  onClose,
  calculationData = null,
  onSaveSuccess = null,
}) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const reduxPending = useAppSelector(selectPendingCalculation);
  const activeCalc = calculationData || reduxPending;

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // When modal opens with calculationData, ensure it is committed to Redux and storage
  useEffect(() => {
    if (isOpen && calculationData) {
      dispatch(setPendingCalculation(calculationData));
    }
  }, [isOpen, calculationData, dispatch]);

  if (!isOpen) return null;

  const handleUseDemo = () => {
    setEmail('student@resultpoint.edu');
    setPassword('password123');
    setFormError('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (authMode === 'signup' && !fullName.trim()) {
      setFormError('Please enter your full student name.');
      return;
    }

    setSubmitting(true);

    try {
      let authResult;
      if (authMode === 'login') {
        authResult = await dispatch(
          loginUser({
            email: email.trim(),
            password,
            expectedRole: 'student',
          })
        ).unwrap();
      } else {
        authResult = await dispatch(
          registerUser({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
          })
        ).unwrap();
      }

      // Authentication succeeded! Now save the pending calculation for this user
      if (activeCalc) {
        const saveRes = calculationSaveService.saveCalculation(activeCalc, authResult.user);
        if (saveRes.success) {
          dispatch(saveCalculationToHistory(saveRes.record));
          dispatch(clearPendingCalculation());
          showToast(`Welcome ${authResult.user?.fullName || ''}! Calculation saved to your Calculation History.`);
          if (onSaveSuccess) onSaveSuccess(saveRes.record);
        } else {
          // If saving fails, preserve the calculation in Redux/storage for retry
          dispatch(setPendingCalculation(activeCalc));
          showToast(saveRes.error || 'Authenticated, but could not save calculation.', 'error');
        }
      } else {
        showToast(`Welcome ${authResult.user?.fullName || ''}!`);
      }

      setSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitting(false);
      setFormError(typeof err === 'string' ? err : err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleOpenFullLoginPage = () => {
    if (activeCalc) {
      dispatch(setPendingCalculation(activeCalc));
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl text-text-light hover:text-text-h hover:bg-bg-sec flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-h tracking-tight">
              Save Academic Record
            </h3>
            <p className="text-xs text-text-light mt-0.5">
              Sign in or create an account to save this calculation to your Calculation History.
            </p>
          </div>
        </div>

        {/* Calculation Snapshot Preview */}
        {activeCalc && (
          <div className="mt-4 p-3 rounded-xl bg-bg-sec border border-border flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <span className="font-bold text-text-h block truncate">
                {activeCalc.title || activeCalc.calculatorType || activeCalc.tool || 'Academic Calculation'}
              </span>
              <span className="text-[11px] text-text-light truncate block">
                {activeCalc.summary || activeCalc.query || activeCalc.result || 'Evaluation Snapshot'}
              </span>
            </div>
            {(activeCalc.score || activeCalc.result) && (
              <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-accent/15 text-accent border border-accent/20">
                {activeCalc.score || activeCalc.result}
              </span>
            )}
          </div>
        )}

        {/* Auth Mode Toggle Tabs */}
        <div className="mt-4 grid grid-cols-2 p-1 rounded-xl bg-bg-sec border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setFormError('');
            }}
            className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'login'
                ? 'bg-card text-text-h shadow-xs border border-border'
                : 'text-text-light hover:text-text-h'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setFormError('');
            }}
            className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'signup'
                ? 'bg-card text-text-h shadow-xs border border-border'
                : 'text-text-light hover:text-text-h'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mt-3 p-2.5 rounded-xl bg-brandPink/10 border border-brandPink/25 text-brandPink text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
          {authMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-text-light mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Student User"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-bg border border-border text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
                />
                <User className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-text-light mb-1">
              Student Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@resultpoint.edu"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-bg border border-border text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
              />
              <Mail className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-text-light">
                Password
              </label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={handleUseDemo}
                  className="text-[10px] text-accent font-semibold hover:underline cursor-pointer"
                >
                  Use Demo Student
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-bg border border-border text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
              />
              <Key className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-accent flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {authMode === 'login' ? 'Sign In & Save Result' : 'Create Account & Save Result'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-light">
          <span>Calculation is kept on this page.</span>
          <Link
            to="/login"
            state={{ from: window.location.pathname }}
            onClick={handleOpenFullLoginPage}
            className="text-accent font-semibold hover:underline flex items-center gap-1"
          >
            <span>Full Login Page</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}