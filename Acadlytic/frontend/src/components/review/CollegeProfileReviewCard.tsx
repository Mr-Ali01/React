import React from 'react';
import { Building2, Globe, Phone, MapPin, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { SubmittedRevisionResponse } from '@/types';

interface CollegeProfileReviewCardProps {
  profile?: SubmittedRevisionResponse | null;
}

export const CollegeProfileReviewCard: React.FC<CollegeProfileReviewCardProps> = ({
  profile,
}) => {
  if (!profile) {
    return (
      <Card className="p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-sky-600" />
          Institutional Profile
        </h3>
        <p className="text-sm text-slate-500">
          No profile information submitted for this revision.
        </p>
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-sky-600" />
        Institutional Profile
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Legal Entity Name
          </label>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {profile.legalName}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Affiliated University
          </label>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-800">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <span>{profile.affiliatedUniversityName}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Institutional Phone
          </label>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{profile.contactPhone}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Official Website
          </label>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <Globe className="h-4 w-4 text-slate-400" />
            {profile.websiteUrl ? (
              <a
                href={
                  profile.websiteUrl.startsWith('http')
                    ? profile.websiteUrl
                    : `https://${profile.websiteUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline truncate"
              >
                {profile.websiteUrl}
              </a>
            ) : (
              <span className="text-slate-400">None provided</span>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Campus Address
          </label>
          <div className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>{profile.addressLine1}</p>
              {profile.addressLine2 && <p>{profile.addressLine2}</p>}
              <p className="text-slate-500 text-xs mt-0.5">
                {profile.city}, {profile.state}, {profile.country} -{' '}
                {profile.postalCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
