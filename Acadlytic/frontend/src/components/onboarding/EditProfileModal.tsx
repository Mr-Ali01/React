import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useUpdateDraftProfile } from '@/hooks/useOnboarding';
import { updateApplicationSchema } from '@/schemas/onboardingSchema';
import { CollegeProfileResponse, UpdateApplicationRequest } from '@/types';
import { isApiError } from '@/services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CollegeProfileResponse;
  collegeCode: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  collegeCode,
}) => {
  const { mutate: updateProfile, isPending } = useUpdateDraftProfile();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateApplicationRequest>({
    resolver: zodResolver(updateApplicationSchema),
    defaultValues: {
      legalName: profile.legalName,
      contactPhone: profile.contactPhone || '',
      websiteUrl: profile.websiteUrl || '',
      affiliatedUniversityName: profile.affiliatedUniversityName || '',
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2 || '',
      city: profile.city,
      state: profile.state,
      postalCode: profile.postalCode,
      country: profile.country,
    },
  });

  const onSubmit = (data: UpdateApplicationRequest) => {
    setServerError(null);
    updateProfile(data, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: unknown) => {
        if (isApiError(err)) {
          if (err.errors && typeof err.errors === 'object') {
            Object.entries(err.errors).forEach(([field, msg]) => {
              setError(field as keyof UpdateApplicationRequest, {
                type: 'server',
                message: String(msg),
              });
            });
          }
          setServerError(
            err.message || 'Failed to update institutional profile details.'
          );
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Institutional Profile"
      description="Update profile information for the unsubmitted draft revision. College code is permanent and cannot be modified."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="error" title="Submission Error">
            {serverError}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="College Code"
            value={collegeCode}
            disabled
            helperText="Permanent identifier assigned upon initial registration."
          />

          <Input
            label="Legal Institution Name"
            required
            {...register('legalName')}
            error={errors.legalName?.message}
          />

          <Input
            label="Contact Phone"
            required
            {...register('contactPhone')}
            error={errors.contactPhone?.message}
          />

          <Input
            label="Website URL"
            type="url"
            placeholder="https://example.edu"
            {...register('websiteUrl')}
            error={errors.websiteUrl?.message}
          />

          <div className="md:col-span-2">
            <Input
              label="Affiliated University Name"
              required
              placeholder="e.g. State University"
              {...register('affiliatedUniversityName')}
              error={errors.affiliatedUniversityName?.message}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Address Line 1"
              required
              {...register('addressLine1')}
              error={errors.addressLine1?.message}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Address Line 2"
              placeholder="Suite, building, floor, etc. (optional)"
              {...register('addressLine2')}
              error={errors.addressLine2?.message}
            />
          </div>

          <Input
            label="City"
            required
            {...register('city')}
            error={errors.city?.message}
          />

          <Input
            label="State / Province"
            required
            {...register('state')}
            error={errors.state?.message}
          />

          <Input
            label="Postal / Zip Code"
            required
            {...register('postalCode')}
            error={errors.postalCode?.message}
          />

          <Input
            label="Country"
            required
            {...register('country')}
            error={errors.country?.message}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
