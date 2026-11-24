import React, { useState } from 'react';
import { Mail, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useResendVerification } from '@/hooks/useEmailVerification';
import { isApiError } from '@/services/api';

interface ResendVerificationButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
}

export const ResendVerificationButton: React.FC<ResendVerificationButtonProps> = ({
  className,
  variant = 'outline',
  size = 'sm',
  onSuccess,
}) => {
  const {
    mutate: resend,
    isPending,
    countdown,
    isVerifying,
  } = useResendVerification();

  const [feedback, setFeedback] = useState<{
    variant: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    action?: React.ReactNode;
  } | null>(null);

  const handleClick = () => {
    setFeedback(null);

    resend(undefined, {
      onSuccess: () => {
        setFeedback({
          variant: 'success',
          title: 'Verification Email Sent',
          message:
            'A fresh verification link has been sent to your registered email address. The link remains valid for 48 hours.',
        });
        onSuccess?.();
      },
      onError: (err: unknown) => {
        if (isApiError(err)) {
          const errorCode = err.errorCode;
          const status = err.status;

          // 1. Rate Limit Exceeded (429)
          if (status === 429 || errorCode === 'RATE_LIMIT_EXCEEDED') {
            if (countdown !== null && countdown > 0) {
              setFeedback({
                variant: 'warning',
                title: 'Rate Limit Reached',
                message: `Too many resend requests. Please wait ${countdown} seconds before requesting another email.`,
              });
            } else {
              setFeedback({
                variant: 'warning',
                title: 'Rate Limit Reached',
                message:
                  'Too many verification resend requests from this IP address. Please wait a while before retrying.',
                action: (
                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="font-semibold underline hover:text-amber-950 ml-2"
                  >
                    Dismiss
                  </button>
                ),
              });
            }
            return;
          }

          // 2. Already Verified (400)
          if (errorCode === 'EMAIL_ALREADY_VERIFIED') {
            setFeedback({
              variant: 'info',
              title: 'Email Already Verified',
              message:
                'Your email address is already verified. No additional verification email is needed.',
            });
            return;
          }

          // 3. Unauthenticated Session Expired (401)
          if (status === 401 || errorCode === 'AUTH_UNAUTHENTICATED') {
            setFeedback({
              variant: 'error',
              title: 'Session Expired',
              message:
                'Your session has expired. Please sign in again to request a new verification email.',
              action: (
                <Link
                  to="/auth/login"
                  className="font-semibold underline hover:text-red-950 ml-1"
                >
                  Sign in
                </Link>
              ),
            });
            return;
          }

          // 4. Access Denied (403)
          if (errorCode === 'ACCESS_DENIED') {
            setFeedback({
              variant: 'error',
              title: 'Access Denied',
              message:
                'Only college administrators can request verification email resend.',
            });
            return;
          }

          // 5. Account Inactive (403)
          if (errorCode === 'AUTH_ACCOUNT_INACTIVE') {
            setFeedback({
              variant: 'error',
              title: 'Account Inactive',
              message:
                'Your account has been suspended or deactivated. Please contact Acadlytic platform support.',
            });
            return;
          }

          // 6. CSRF Handshake Failure (403)
          if (errorCode === 'CSRF_TOKEN_INVALID') {
            setFeedback({
              variant: 'error',
              title: 'Security Token Error',
              message:
                'Your security token expired. Please refresh the page and try again.',
            });
            return;
          }

          // 7. Validation Error (400)
          if (errorCode === 'VALIDATION_ERROR') {
            setFeedback({
              variant: 'error',
              title: 'Invalid Request',
              message:
                'Unable to process verification resend. Please contact support.',
            });
            return;
          }

          // Generic server error (500)
          setFeedback({
            variant: 'error',
            title: 'Resend Failed',
            message: err.message || 'An unexpected error occurred while resending email.',
          });
          return;
        }

        // Network error
        setFeedback({
          variant: 'error',
          title: 'Connection Error',
          message:
            'Unable to reach Acadlytic. Please check your internet connection and try again.',
        });
      },
    });
  };

  const isRateLimited = countdown !== null && countdown > 0;
  const isDisabled = isPending || isRateLimited || isVerifying;

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            Sending Email...
          </>
        ) : isRateLimited ? (
          <>
            <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
            Resend in {countdown}s
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-1.5" />
            Resend Verification Email
          </>
        )}
      </Button>

      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          className="text-left text-xs"
        >
          <div>
            <span>{feedback.message}</span>
            {feedback.action && <span className="ml-2">{feedback.action}</span>}
          </div>
        </Alert>
      )}
    </div>
  );
};
