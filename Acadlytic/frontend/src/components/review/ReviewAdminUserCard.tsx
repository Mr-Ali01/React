import React from 'react';
import { Mail, Phone, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ReviewAdminUserResponse } from '@/types';

interface ReviewAdminUserCardProps {
  adminUser?: ReviewAdminUserResponse | null;
}

export const ReviewAdminUserCard: React.FC<ReviewAdminUserCardProps> = ({
  adminUser,
}) => {
  if (!adminUser) {
    return (
      <Card className="p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Proposed College Administrator
        </h3>
        <p className="text-sm text-slate-500">
          No administrator credentials recorded for this institution.
        </p>
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
        Proposed College Administrator
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Full Name
          </label>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {adminUser.fullName}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Account Status
          </label>
          <div className="mt-1 flex items-center gap-1.5">
            {adminUser.emailVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                <AlertCircle className="h-3 w-3" />
                Verification Pending
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Email Address
          </label>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <Mail className="h-4 w-4 text-slate-400" />
            <a
              href={`mailto:${adminUser.email}`}
              className="hover:text-sky-600 hover:underline"
            >
              {adminUser.email}
            </a>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Contact Phone
          </label>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{adminUser.phone || 'Not provided'}</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Registered On
          </label>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              {adminUser.registeredAt
                ? new Date(adminUser.registeredAt).toLocaleString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
