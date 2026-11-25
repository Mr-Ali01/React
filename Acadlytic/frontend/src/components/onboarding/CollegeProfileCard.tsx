import React from 'react';
import { Building2, Edit2, Globe, MapPin, Phone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CollegeProfileResponse } from '@/types';

interface CollegeProfileCardProps {
  profile: CollegeProfileResponse;
  collegeCode: string;
  isEditable: boolean;
  onEdit: () => void;
}

export const CollegeProfileCard: React.FC<CollegeProfileCardProps> = ({
  profile,
  collegeCode,
  isEditable,
  onEdit,
}) => {
  const formattedAddress = [
    profile.addressLine1,
    profile.addressLine2,
    `${profile.city}, ${profile.state} ${profile.postalCode}`,
    profile.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Institutional Profile
          </h3>
        </div>
        {isEditable && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="text-xs"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Legal Institution Name
          </span>
          <span className="text-slate-900 font-medium">{profile.legalName}</span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            College Code (Permanent)
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded text-xs border border-slate-200">
              {collegeCode}
            </span>
            <span className="text-xs text-slate-400">(Immutable)</span>
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Contact Phone
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 text-slate-700">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{profile.contactPhone || 'Not specified'}</span>
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Website URL
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 text-slate-700">
            <Globe className="h-4 w-4 text-slate-400" />
            {profile.websiteUrl ? (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-indigo-600 hover:underline truncate max-w-xs"
              >
                {profile.websiteUrl}
              </a>
            ) : (
              <span className="text-slate-400">Not specified</span>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Affiliated University Name
          </span>
          <span className="text-slate-700 font-medium">
            {profile.affiliatedUniversityName || 'Autonomous / Independent'}
          </span>
        </div>

        <div className="md:col-span-2">
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Physical Registered Address
          </span>
          <div className="flex items-start gap-1.5 mt-0.5 text-slate-700">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <span>{formattedAddress || 'No address provided'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
