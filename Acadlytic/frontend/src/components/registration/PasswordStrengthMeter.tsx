import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password?: string;
  adminEmail?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  adminEmail = '',
}) => {
  if (!password) {
    return (
      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <span>
          Must be 12 to 128 characters and must not contain your email address.
        </span>
      </div>
    );
  }

  // Exact structural backend rules
  const hasMinLength = password.length >= 12;
  const hasMaxLength = password.length <= 128;
  const isLengthValid = hasMinLength && hasMaxLength;

  const normalizedEmail = adminEmail.trim().toLowerCase();
  const containsEmail =
    normalizedEmail.length >= 3 &&
    password.toLowerCase().includes(normalizedEmail);

  // Advisory complexity indicators (recommended for entropy, but non-blocking)
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  const advisoryScore =
    (hasLetters ? 1 : 0) + (hasDigits ? 1 : 0) + (hasSymbols ? 1 : 0);

  return (
    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
      <div className="font-medium text-slate-700">Password Policy</div>

      <div className="space-y-1">
        {/* Required Structural Rule: Length */}
        <div className="flex items-center gap-2">
          {isLengthValid ? (
            <Check
              className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0"
              data-testid="length-rule-passed"
            />
          ) : (
            <AlertCircle
              className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"
              data-testid="length-rule-pending"
            />
          )}
          <span
            className={isLengthValid ? 'text-emerald-700 font-medium' : 'text-slate-600'}
          >
            Between 12 and 128 characters (current: {password.length})
          </span>
        </div>

        {/* Required Structural Rule: Email exclusion */}
        <div className="flex items-center gap-2">
          {!containsEmail ? (
            <Check
              className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0"
              data-testid="email-rule-passed"
            />
          ) : (
            <AlertCircle
              className="h-3.5 w-3.5 text-red-500 flex-shrink-0"
              data-testid="email-rule-failed"
            />
          )}
          <span
            className={
              containsEmail
                ? 'text-red-700 font-medium'
                : 'text-slate-600'
            }
          >
            Must not contain your administrator email address
          </span>
        </div>
      </div>

      {/* Advisory Entropy Guidance (Non-blocking) */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>Recommended complexity:</span>
        <span
          className={
            advisoryScore >= 3
              ? 'text-emerald-600 font-medium'
              : advisoryScore === 2
                ? 'text-amber-600 font-medium'
                : 'text-slate-500'
          }
        >
          {advisoryScore >= 3
            ? 'Strong (Letters + Numbers + Symbols)'
            : advisoryScore === 2
              ? 'Moderate'
              : 'Basic passphrase (acceptable)'}
        </span>
      </div>

      <div className="text-[10px] text-slate-400 italic">
        * Common breached passwords are automatically verified against the platform security denylist upon submission.
      </div>
    </div>
  );
};
