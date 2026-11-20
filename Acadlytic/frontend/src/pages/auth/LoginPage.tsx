import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromLocation = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    try {
      const user = await loginMutation.mutateAsync({ email, password });
      if (fromLocation) {
        navigate(fromLocation, { replace: true });
      } else if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/college/dashboard', { replace: true });
      }
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign in to Acadlytic
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your institutional credentials to access your dashboard.
        </p>
      </div>

      {validationError && (
        <Alert variant="error">{validationError}</Alert>
      )}

      {loginMutation.isError && (
        <Alert variant="error">
          {loginMutation.error?.message || 'Invalid email or password. Please try again.'}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@college.edu"
          required
          autoComplete="email"
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          isLoading={loginMutation.isPending}
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Need to onboard a college? </span>
        <Link
          to="/auth/register-college"
          className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          Register College
        </Link>
      </div>
    </div>
  );
};
