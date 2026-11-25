import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useVerifyEmail } from '@/hooks/useEmailVerification';
import { useAuthStore } from '@/stores/authStore';
import { isApiError } from '@/services/api';
import { VerifyEmailResponse } from '@/types';
import {
  VerifyEmailStatusCard,
  VerificationUIState,
} from '@/components/verification/VerifyEmailStatusCard';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { mutate: verifyEmail } = useVerifyEmail();

  // Read raw token once into memory
  const initialToken = searchParams.get('token');
  const tokenToVerifyRef = useRef<string | null>(initialToken);
  const hasExecutedRef = useRef<boolean>(false);

  const [uiState, setUiState] = useState<VerificationUIState>(() => {
    return initialToken ? 'LOADING' : 'MISSING_TOKEN';
  });
  const [verificationData, setVerificationData] =
    useState<VerifyEmailResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeVerification = useCallback(
    (token: string) => {
      // 1. Client-side length validation (20-255 chars)
      if (token.trim().length < 20 || token.trim().length > 255) {
        setUiState('INVALID_OR_EXPIRED');
        setErrorMessage('Verification token length is invalid.');
        return;
      }

      setUiState('LOADING');
      setErrorMessage(null);

      verifyEmail(
        { token: token.trim() },
        {
          onSuccess: (data) => {
            setVerificationData(data);
            setUiState('SUCCESS');
          },
          onError: (err: unknown) => {
            if (isApiError(err)) {
              const errorCode = err.errorCode;

              if (errorCode === 'EMAIL_ALREADY_VERIFIED') {
                setUiState('ALREADY_VERIFIED');
                return;
              }

              if (errorCode === 'INVALID_OR_EXPIRED_TOKEN') {
                setUiState('INVALID_OR_EXPIRED');
                setErrorMessage(
                  err.message ||
                    'The verification token is invalid, has expired, or was superseded by a newer link.'
                );
                return;
              }

              if (errorCode === 'VALIDATION_ERROR') {
                setUiState('INVALID_OR_EXPIRED');
                setErrorMessage(
                  err.message || 'The verification token format is invalid.'
                );
                return;
              }

              if (errorCode === 'AUTH_ACCOUNT_INACTIVE') {
                setUiState('ACCOUNT_INACTIVE');
                setErrorMessage(err.message || 'Your account is inactive.');
                return;
              }

              if (errorCode === 'CSRF_TOKEN_INVALID') {
                setUiState('SERVER_ERROR');
                setErrorMessage(
                  'Your security session token expired. Please refresh the page and try again.'
                );
                return;
              }

              setUiState('SERVER_ERROR');
              setErrorMessage(
                err.message || 'An unexpected verification error occurred.'
              );
              return;
            }

            setUiState('SERVER_ERROR');
            setErrorMessage(
              'Unable to reach Acadlytic. Please verify your connection and try again.'
            );
          },
        }
      );
    },
    [verifyEmail]
  );

  useEffect(() => {
    const rawToken = tokenToVerifyRef.current;

    // Execute once and sanitize URL
    if (rawToken && !hasExecutedRef.current) {
      hasExecutedRef.current = true;

      // Sanitize URL: Remove ONLY the 'token' param, preserving other query params and location.state
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('token');
      setSearchParams(nextParams, {
        replace: true,
        state: location.state,
      });

      // Dispatch verification request
      executeVerification(rawToken);
    }
  }, [searchParams, setSearchParams, location.state, executeVerification]);

  const handleRetry = () => {
    if (tokenToVerifyRef.current) {
      executeVerification(tokenToVerifyRef.current);
    }
  };

  return (
    <div className="w-full">
      <VerifyEmailStatusCard
        state={uiState}
        data={verificationData}
        errorMessage={errorMessage}
        isAuthenticated={isAuthenticated}
        onRetry={tokenToVerifyRef.current ? handleRetry : undefined}
      />
    </div>
  );
};
