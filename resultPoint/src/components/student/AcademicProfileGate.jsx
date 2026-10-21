import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectIsProfileComplete } from '../../features/academicProfile/academicProfileSlice';
import { studentService } from '../../services/studentService';

/**
 * AcademicProfileGate
 * Wraps or renders the standard "Academic Profile Setup Required" screen when a student
 * has not yet configured their University, Course, and Regulation.
 */
export default function AcademicProfileGate({
  children,
  title = "Academic Profile Setup Required",
  description = "Before accessing this feature, please configure your University, Course, and Regulation so ResultPoint can load your curriculum subjects, credit weights, and grading rules."
}) {
  const isCompleteRedux = useAppSelector(selectIsProfileComplete);
  const isComplete = isCompleteRedux || studentService.isProfileComplete();

  if (!isComplete) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-subtle">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-h">{title}</h2>
        <p className="text-xs sm:text-sm text-text-light max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="pt-2">
          <Link
            to="/student/profile-setup"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer active:scale-95"
          >
            <span>Complete Academic Profile Setup</span>
          </Link>
        </div>
      </div>
    );
  }

  return children || null;
}
