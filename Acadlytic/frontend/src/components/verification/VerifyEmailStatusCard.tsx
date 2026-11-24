import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { VerifyEmailResponse } from '@/types';
import { ResendVerificationButton } from './ResendVerificationButton';

export type VerificationUIState =
  | 'LOADING'
  | 'SUCCESS'
  | 'ALREADY_VERIFIED'
  | 'INVALID_OR_EXPIRED'
  | 'MISSING_TOKEN'
  | 'ACCOUNT_INACTIVE'
  | 'SERVER_ERROR';

interface VerifyEmailStatusCardProps {
  state: VerificationUIState;
  data?: VerifyEmailResponse | null;
  errorMessage?: string | null;
  isAuthenticated?: boolean;
  onRetry?: () => void;
}

export const VerifyEmailStatusCard: React.FC<VerifyEmailStatusCardProps> = ({
  state,
  data,
  errorMessage,
  isAuthenticated = false,
  onRetry,
}) => {
  // 1. Loading State
  if (state === 'LOADING') {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-sm border border-sky-100">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Verifying Email Address
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Please wait while we validate your single-use 48-hour security token...
          </p>
        </div>
      </div>
    );
  }

  // 2. Success State
  if (state === 'SUCCESS' && data) {
    const formattedDate = data.verifiedAt
      ? new Date(data.verifiedAt).toLocaleString()
      : 'Just now';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-100 mb-3">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Email Verified Successfully
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The administrator email address{' '}
            <strong className="text-slate-900">{data.email}</strong> has been
            verified.
          </p>
        </div>

        {/* Verification Metadata Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Verified Email:</span>
            <span className="font-semibold text-slate-800">{data.email}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Verified At:</span>
            <span className="font-mono text-slate-700">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Account Status:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Email Confirmed
            </span>
          </div>
        </div>

        {/* Separation Notice Alert */}
        <Alert
          variant="info"
          title="College Approval Workflow Separate"
          className="text-left text-xs leading-relaxed"
        >
          Email verification confirms your administrator identity. Your institution
          registration remains in <strong>PENDING</strong> status awaiting Super Admin
          accreditation review. Full academic management features unlock upon formal
          approval.
        </Alert>

        {/* Primary Action Button */}
        <div className="pt-2">
          {isAuthenticated ? (
            <Link to="/onboarding-status" className="w-full block">
              <Button variant="primary" className="w-full gap-2 py-2.5">
                Go to Onboarding Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth/login" className="w-full block">
              <Button variant="primary" className="w-full gap-2 py-2.5">
                Proceed to Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 3. Already Verified State
  if (state === 'ALREADY_VERIFIED') {
    return (
      <div className="space-y-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-sm border border-sky-100">
          <CheckCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Email Already Verified
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">
            Your administrator email address has already been confirmed. You do not
            need to verify it again.
          </p>
        </div>

        <div className="pt-2">
          {isAuthenticated ? (
            <Link to="/onboarding-status" className="w-full block">
              <Button variant="primary" className="w-full gap-2 py-2.5">
                Go to Onboarding Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth/login" className="w-full block">
              <Button variant="primary" className="w-full gap-2 py-2.5">
                Sign In to Your Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 4. Invalid or Expired Token State
  if (state === 'INVALID_OR_EXPIRED') {
    return (
      <div className="space-y-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm border border-amber-100">
          <Clock className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Verification Link Invalid or Expired
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            This verification link has expired (tokens are valid for 48 hours), has
            already been used, or was superseded by a newer link.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-3">
            <p className="text-xs text-amber-900 font-medium">
              You are currently signed in. You can request a fresh verification link
              below:
            </p>
            <ResendVerificationButton variant="primary" className="w-full" />
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">
              Need a fresh verification link?
            </p>
            <p>
              Sign in with your administrator email and password. Your restricted
              onboarding dashboard will provide a one-click option to resend the
              verification email.
            </p>
            <Link to="/auth/login" className="w-full block pt-1">
              <Button variant="primary" className="w-full gap-2 py-2">
                Sign In to Request New Link
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // 5. Missing Token State (Direct URL access without query param)
  if (state === 'MISSING_TOKEN') {
    return (
      <div className="space-y-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm border border-amber-100">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            No Verification Token Found
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            The verification URL did not include a valid token parameter. Please click
            the full link in your verification email.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link to="/auth/login" className="w-full">
            <Button variant="primary" className="w-full py-2.5">
              Sign In to Your Account
            </Button>
          </Link>
          <Link to="/auth/register-college" className="w-full">
            <Button variant="outline" className="w-full py-2.5">
              Register an Institution
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 6. Account Inactive State
  if (state === 'ACCOUNT_INACTIVE') {
    return (
      <div className="space-y-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm border border-rose-100">
          <XCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Account Inactive
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            Your administrator account has been deactivated or suspended. Please
            contact Acadlytic support for assistance.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/" className="w-full block">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 7. Generic Server / Connection Error
  return (
    <div className="space-y-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm border border-rose-100">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Verification Failed
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          {errorMessage ||
            'Unable to communicate with the verification server. Please check your internet connection and try again.'}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="w-full gap-2 py-2.5"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        <Link to="/auth/login" className="w-full">
          <Button variant="outline" className="w-full py-2.5">
            Proceed to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
};
