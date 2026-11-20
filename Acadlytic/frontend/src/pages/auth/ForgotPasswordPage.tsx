import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeft, MailCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authService.forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to submit password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your registered email address and we will send you a password reset link.
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <MailCheck className="h-6 w-6" />
          </div>
          <Alert variant="success" title="Check your email">
            If an account exists with <span className="font-semibold">{email}</span>, a reset token has been dispatched.
          </Alert>
          <div className="pt-2">
            <Link to="/auth/login">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

          <Input
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@college.edu"
            required
            autoComplete="email"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Reset Instructions
          </Button>

          <div className="pt-2 text-center">
            <Link
              to="/auth/login"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
