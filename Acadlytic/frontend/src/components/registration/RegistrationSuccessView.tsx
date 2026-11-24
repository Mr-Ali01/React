import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Mail,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CollegeRegistrationResponse } from '@/types';

interface RegistrationSuccessViewProps {
  registration: CollegeRegistrationResponse;
}

export const RegistrationSuccessView: React.FC<
  RegistrationSuccessViewProps
> = ({ registration }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="text-center sm:text-left">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-sm border border-emerald-100">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Application Received
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          The registration application for{' '}
          <strong className="text-slate-900">{registration.collegeName}</strong>{' '}
          has been initiated in{' '}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
            {registration.status}
          </span>{' '}
          status.
        </p>
      </div>

      {/* Registration Details Card */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
          <span className="text-slate-500 font-medium">College Code:</span>
          <span className="font-mono font-semibold text-slate-800">
            {registration.collegeCode}
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
          <span className="text-slate-500 font-medium">
            Primary Administrator:
          </span>
          <span className="font-semibold text-slate-800">
            {registration.adminEmail}
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 font-medium">Session Status:</span>
          <span className="text-slate-700 font-medium">
            Not Authenticated (Unverified Account)
          </span>
        </div>
      </div>

      {/* Email Verification Advisory */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs space-y-3">
        <div className="flex items-start gap-2.5">
          <Mail className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sky-950">
              Check Your Inbox and Spam Folder
            </h4>
            <p className="text-sky-900 leading-relaxed">
              A verification email has been queued for processing. Delivery may
              take a few minutes depending on your email provider. Please check
              your <strong>Inbox</strong> and <strong>Spam / Junk</strong> folder
              at{' '}
              <strong className="underline text-sky-950">
                {registration.adminEmail}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-sky-200/60 flex items-start gap-2 text-sky-800 text-[11px]">
          <Clock className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>48-Hour Expiration:</strong> For institutional security, the
            email verification link is valid for <strong>48 hours</strong> from
            submission. Unverified applications that remain incomplete are
            subject to automated cleanup after 7 days under platform rules.
          </span>
        </div>
      </div>

      {/* Onboarding Roadmap */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Next Onboarding Stages
        </h4>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-medium text-slate-800">
                Verify Administrator Email (Active)
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Click the single-use verification link sent to your administrator
                email address.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-medium text-slate-800">
                Restricted Dashboard &amp; Document Submission
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Sign in to your restricted onboarding dashboard to upload
                accreditation and recognition documents, then submit for review.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-medium text-slate-800">Super Admin Review</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Platform administrators review your institution details and
                accreditation credentials.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
              4
            </span>
            <div>
              <p className="font-medium text-slate-800">
                Operational Activation
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Upon review approval, your college account transitions to Active
                status, unlocking full academic management features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
        <Link to="/auth/login" className="w-full">
          <Button variant="primary" className="w-full gap-2 py-2.5">
            Proceed to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-center text-[11px] text-slate-400">
          Note: You will be able to sign in once your email address is verified.
        </p>
      </div>
    </div>
  );
};
