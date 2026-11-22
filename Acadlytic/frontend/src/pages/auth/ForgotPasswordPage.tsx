import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';

import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid institutional email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authService.forgotPassword({ email: values.email });
    } catch {
      // Intentionally suppress error display to maintain strict account non-enumeration
    } finally {
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your registered institutional email to receive a password
          recovery link.
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-2 space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <MailCheck className="h-6 w-6" />
          </div>
          <Alert variant="success" title="Check your email">
            If an eligible account exists for{' '}
            <span className="font-semibold">{submittedEmail}</span>, a password
            reset link has been sent. Please check your inbox within 1 hour.
          </Alert>
          <div className="pt-2">
            <Link to="/auth/login">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Institutional Email"
            type="email"
            placeholder="admin@college.edu"
            autoComplete="email"
            error={errors.email?.message}
            disabled={isSubmitting}
            required
            {...register('email')}
          />

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            <Send className="h-4 w-4" />
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
