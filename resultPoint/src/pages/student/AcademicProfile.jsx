import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Save,
  RotateCcw,
  Sparkles,
  Camera,
  Upload,
  Check,
  Copy,
  Pencil,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  FileText,
  Calculator,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Info,
  ShieldAlert
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { catalogApi } from '../../services/api/catalogApi';
import { resultService } from '../../services/resultService';
import { activityHistoryService } from '../../services/activityHistoryService';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectAcademicProfile,
  saveAcademicProfile,
  fetchAcademicProfile
} from '../../features/academicProfile/academicProfileSlice';
import {
  selectUserProfile,
  updateUserProfile
} from '../../features/user/userSlice';
import { updateAuthProfileStatus } from '../../features/auth/authSlice';
import { clearResults, fetchResults } from '../../features/results/resultsSlice';
import { resetBacklogsState, fetchBacklogs } from '../../features/backlog/backlogSlice';
import { fetchAcademicGoal } from '../../features/academicGoals/academicGoalsSlice';
import { fetchPerformanceData } from '../../features/performance/performanceSlice';
import { fetchAcademicHistory } from '../../features/academicHistory/academicHistorySlice';
import { fetchActivities } from '../../features/activityHistory/activityHistorySlice';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AcademicProfile() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const reduxUserProfile = useAppSelector(selectUserProfile);
  const reduxAcademicProfile = useAppSelector(selectAcademicProfile);

  // Consolidated persisted profile
  const baseProfile = useMemo(() => {
    const fromService = studentService.getProfile() || {};
    return {
      ...fromService,
      ...(reduxUserProfile || {}),
      ...(reduxAcademicProfile || {})
    };
  }, [reduxUserProfile, reduxAcademicProfile]);

  // Read actual saved semester results to dynamically synchronize active semester
  const [completedResults, setCompletedResults] = useState(() => {
    try {
      return resultService.getAllResults() || [];
    } catch {
      return [];
    }
  });

  // Re-sync results when result storage event fires
  useEffect(() => {
    const handleResultsSync = () => {
      try {
        setCompletedResults(resultService.getAllResults() || []);
      } catch {
        setCompletedResults([]);
      }
    };
    window.addEventListener('results_data_updated', handleResultsSync);
    window.addEventListener('storage', handleResultsSync);
    return () => {
      window.removeEventListener('results_data_updated', handleResultsSync);
      window.removeEventListener('storage', handleResultsSync);
    };
  }, []);

  // Ensure authoritative academic profile is synchronized from backend on mount
  useEffect(() => {
    dispatch(fetchAcademicProfile());
  }, [dispatch]);

  // Form State initialized directly from loaded student profile & results
  const getInitialFormData = () => {
    const totalSem = Number(baseProfile?.totalSemesters || 6);
    const semCalc = studentService.calculateActiveSemesterInfo(
      completedResults,
      totalSem,
      baseProfile?.currentSemester
    );
    const hasConfig = Boolean(baseProfile?.universityId && baseProfile?.courseId);
    return {
      fullName: baseProfile?.fullName || '',
      email: baseProfile?.email || '',
      hallTicketNumber: baseProfile?.hallTicketNumber || '',
      phoneNumber: baseProfile?.phoneNumber || '',
      dob: baseProfile?.dob || '',
      gender: baseProfile?.gender || 'Male',
      avatar: baseProfile?.avatar || DEFAULT_AVATAR,
      universityId: baseProfile?.universityId || (hasConfig ? 'osmania' : ''),
      courseId: baseProfile?.courseId || (hasConfig ? 'bca' : ''),
      regulationId: baseProfile?.regulationId || (hasConfig ? 'ou-bca-cbcs' : ''),
      batch: baseProfile?.batch || '',
      currentSemester: semCalc.activeSemester || 1,
      totalSemesters: totalSem
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [savedBaseline, setSavedBaseline] = useState(getInitialFormData);
  const [syncedKey, setSyncedKey] = useState(
    () => `${baseProfile?.hallTicketNumber || ''}_${baseProfile?.courseId || ''}_${baseProfile?.universityId || ''}`
  );

  // Synchronize state when baseProfile updates asynchronously from backend fetch
  const currentKey = `${baseProfile?.hallTicketNumber || ''}_${baseProfile?.courseId || ''}_${baseProfile?.universityId || ''}`;
  if (currentKey && currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    const refreshed = getInitialFormData();
    setFormData(refreshed);
    setSavedBaseline(refreshed);
    setPreviewAvatar(refreshed.avatar);
  }

  // Section Editing Flags
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);

  // Photo & Action Feedback State
  const [previewAvatar, setPreviewAvatar] = useState(() => baseProfile?.avatar || DEFAULT_AVATAR);
  const [copiedRoll, setCopiedRoll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Catalog Data Lists backed by catalogApi with offline fallback
  const [universities, setUniversities] = useState(() => academicCatalogService.getUniversities() || []);
  const [courses, setCourses] = useState(() => {
    return formData.universityId ? academicCatalogService.getCoursesByUniversity(formData.universityId) || [] : [];
  });
  const [regulations, setRegulations] = useState(() => {
    return (formData.universityId && formData.courseId)
      ? academicCatalogService.getRegulationsByCourse(formData.universityId, formData.courseId) || []
      : [];
  });

  // Fetch universities from catalogApi
  useEffect(() => {
    let ignore = false;
    async function loadUniversities() {
      try {
        const res = await catalogApi.getUniversities();
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setUniversities(list);
          }
        }
      } catch {
        // Fallback already initialized from academicCatalogService
      }
    }
    loadUniversities();
    return () => { ignore = true; };
  }, []);

  // Fetch courses when university selection changes
  useEffect(() => {
    let ignore = false;
    async function loadCourses() {
      if (!formData.universityId) {
        setCourses([]);
        return;
      }
      try {
        const res = await catalogApi.getCoursesByUniversity(formData.universityId);
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setCourses(list);
          } else {
            setCourses(academicCatalogService.getCoursesByUniversity(formData.universityId) || []);
          }
        }
      } catch {
        if (!ignore) {
          setCourses(academicCatalogService.getCoursesByUniversity(formData.universityId) || []);
        }
      }
    }
    loadCourses();
    return () => { ignore = true; };
  }, [formData.universityId]);

  // Fetch regulations when university or course changes
  useEffect(() => {
    let ignore = false;
    async function loadRegulations() {
      if (!formData.universityId || !formData.courseId) {
        setRegulations([]);
        return;
      }
      try {
        const res = await catalogApi.getRegulationsByCourse(formData.courseId);
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setRegulations(list);
          } else {
            setRegulations(academicCatalogService.getRegulationsByCourse(formData.universityId, formData.courseId) || []);
          }
        }
      } catch {
        if (!ignore) {
          setRegulations(academicCatalogService.getRegulationsByCourse(formData.universityId, formData.courseId) || []);
        }
      }
    }
    loadRegulations();
    return () => { ignore = true; };
  }, [formData.universityId, formData.courseId]);

  // Active Catalog Configuration
  const activeConfig = useMemo(() => {
    if (!formData.universityId || !formData.courseId || !formData.regulationId) return null;
    return academicCatalogService.getFullConfiguration(
      formData.universityId,
      formData.courseId,
      formData.regulationId
    );
  }, [formData.universityId, formData.courseId, formData.regulationId]);

  // Dynamic active semester calculation derived strictly from actual valid semester results
  const semesterInfo = useMemo(() => {
    const totalSems = Number(activeConfig?.course?.totalSemesters || formData.totalSemesters || 6);
    return studentService.calculateActiveSemesterInfo(
      completedResults,
      totalSems,
      formData.currentSemester
    );
  }, [completedResults, activeConfig, formData.totalSemesters, formData.currentSemester]);

  // Batches for selected regulation
  const availableBatches = useMemo(() => {
    if (activeConfig?.regulation?.effectiveBatches && activeConfig.regulation.effectiveBatches.length > 0) {
      const list = [...activeConfig.regulation.effectiveBatches];
      if (formData.batch && !list.includes(formData.batch)) {
        list.push(formData.batch);
      }
      return list;
    }
    return ['2022-2025', '2023-2026', '2024-2027', '2025-2027', '2025-2028', '2026-2029'];
  }, [activeConfig, formData.batch]);

  // Keep dependent dropdown selections in sync when university changes
  const handleUniversityChange = (newUnivId) => {
    const availCourses = academicCatalogService.getCoursesByUniversity(newUnivId);
    const firstCourse = availCourses[0];
    const availRegs = firstCourse
      ? academicCatalogService.getRegulationsByCourse(newUnivId, firstCourse.id)
      : [];
    const firstReg = availRegs[0];
    const newTotalSems = firstCourse?.totalSemesters || 6;
    const newBatches = firstReg?.effectiveBatches || ['2024-2027', '2025-2027'];

    setFormData((prev) => ({
      ...prev,
      universityId: newUnivId,
      courseId: firstCourse?.id || '',
      regulationId: firstReg?.id || '',
      totalSemesters: newTotalSems,
      currentSemester: 1, // New program starts at semester 1
      batch: newBatches.includes(prev.batch) ? prev.batch : newBatches[0] || prev.batch
    }));
    setHasUnsavedChanges(true);
  };

  // Keep dependent dropdown selections in sync when course changes
  const handleCourseChange = (newCourseId) => {
    const selCourse = courses.find((c) => c.id === newCourseId);
    const availRegs = academicCatalogService.getRegulationsByCourse(formData.universityId, newCourseId);
    const firstReg = availRegs[0];
    const newTotalSems = selCourse?.totalSemesters || 6;
    const newBatches = firstReg?.effectiveBatches || ['2024-2027', '2025-2027'];

    setFormData((prev) => ({
      ...prev,
      courseId: newCourseId,
      regulationId: firstReg?.id || '',
      totalSemesters: newTotalSems,
      currentSemester: 1, // New program starts at semester 1
      batch: newBatches.includes(prev.batch) ? prev.batch : newBatches[0] || prev.batch
    }));
    setHasUnsavedChanges(true);
  };

  // Regulation change handler
  const handleRegulationChange = (newRegId) => {
    const reg = regulations.find((r) => r.id === newRegId);
    const batches = reg?.effectiveBatches || [];
    setFormData((prev) => ({
      ...prev,
      regulationId: newRegId,
      batch: batches.length > 0 && !batches.includes(prev.batch) ? batches[0] : prev.batch
    }));
    setHasUnsavedChanges(true);
  };

  // Profile Status Determination
  const profileStatus = useMemo(() => {
    const hasRequiredFields =
      Boolean(formData.fullName?.trim()) &&
      Boolean(formData.email?.trim()) &&
      Boolean(formData.hallTicketNumber?.trim()) &&
      Boolean(formData.universityId) &&
      Boolean(formData.courseId) &&
      Boolean(formData.regulationId) &&
      Boolean(formData.currentSemester);

    if (!hasRequiredFields || !activeConfig) {
      return {
        label: 'Incomplete',
        color: 'text-[#F59E0B]',
        icon: AlertCircle,
        description: 'Required academic information is missing. Complete setup to unlock all curriculum features.'
      };
    }

    // Check if user changed university/course/regulation from their saved baseline while results exist
    const hasCatalogChanged =
      savedBaseline &&
      (formData.universityId !== savedBaseline.universityId ||
        formData.courseId !== savedBaseline.courseId ||
        formData.regulationId !== savedBaseline.regulationId);

    const hasRecordedResults = completedResults.length > 0;

    if (hasCatalogChanged && hasRecordedResults) {
      return {
        label: 'Needs Review',
        color: 'text-[#38BDF8]',
        icon: HelpCircle,
        description: 'Configuration changes detected. Verify your academic mapping with existing semester results.'
      };
    }

    return {
      label: 'Completed',
      color: 'text-[#10B981]',
      icon: CheckCircle2,
      description: 'Your academic profile is configured and verified. Keep it updated for accurate calculations.'
    };
  }, [formData, activeConfig, savedBaseline, completedResults.length]);

  // Profile Photo Upload & Validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Invalid file format. Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('File size exceeds 2MB limit. Please choose a smaller image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setPreviewAvatar(dataUrl);
        setFormData((prev) => ({ ...prev, avatar: dataUrl }));
        setHasUnsavedChanges(true);
        showToast('Photo uploaded preview ready. Click "Save Profile Changes" to persist.');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read image file. Please try another photo.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setPreviewAvatar(DEFAULT_AVATAR);
    setFormData((prev) => ({ ...prev, avatar: DEFAULT_AVATAR }));
    setHasUnsavedChanges(true);
    showToast('Photo removed. Click "Save Profile Changes" to apply.');
  };

  const handleCopyRoll = () => {
    if (!formData.hallTicketNumber) return;
    navigator.clipboard.writeText(formData.hallTicketNumber);
    setCopiedRoll(true);
    showToast(`Copied roll number: ${formData.hallTicketNumber}`);
    setTimeout(() => setCopiedRoll(false), 2000);
  };

  // Reset Changes button
  const handleReset = () => {
    if (savedBaseline) {
      setFormData({ ...savedBaseline });
      setPreviewAvatar(savedBaseline.avatar || DEFAULT_AVATAR);
      setIsEditingPersonal(false);
      setIsEditingAcademic(false);
      setHasUnsavedChanges(false);
      showToast('Changes reverted to latest saved profile.');
    }
  };

  // Save Validation & Invalidation Check
  const handleSaveClick = (e) => {
    e?.preventDefault();

    if (!formData.fullName?.trim()) {
      showToast('Full Student Name cannot be empty.', 'error');
      return;
    }
    if (!formData.email?.trim() || !formData.email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!formData.hallTicketNumber?.trim()) {
      showToast('Hall ticket / roll number cannot be empty.', 'error');
      return;
    }
    if (!activeConfig) {
      showToast('Please select a valid university, course, and regulation.', 'error');
      return;
    }

    const maxSem = activeConfig.course?.totalSemesters || 6;
    if (formData.currentSemester < 1 || formData.currentSemester > maxSem) {
      showToast(`Current active semester must be between 1 and ${maxSem}.`, 'error');
      return;
    }

    // Check if configuration changed and results exist (destructive change that invalidates records)
    const hasExistingResults = (resultService.getAllResults() || []).length > 0;
    const isDestructiveConfigChange =
      savedBaseline &&
      hasExistingResults &&
      (formData.universityId !== savedBaseline.universityId ||
        formData.courseId !== savedBaseline.courseId ||
        formData.regulationId !== savedBaseline.regulationId);

    if (isDestructiveConfigChange) {
      setShowConfirmModal(true);
      return;
    }

    // Harmless change or same-course active semester change
    commitSave();
  };

  // Destructive Save: Reset all dependent academic data and reinitialize
  const commitDestructiveReset = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);

    const cleanCourseName = activeConfig.course.name.startsWith(activeConfig.course.shortName)
      ? activeConfig.course.name
      : `${activeConfig.course.shortName} — ${activeConfig.course.name}`;

    const newConfig = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      hallTicketNumber: formData.hallTicketNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      dob: formData.dob.trim(),
      gender: formData.gender,
      avatar: formData.avatar || DEFAULT_AVATAR,
      universityId: activeConfig.university.id,
      university: `${activeConfig.university.name} (${activeConfig.university.shortName})`,
      universityName: `${activeConfig.university.name} (${activeConfig.university.shortName})`,
      universityShortName: activeConfig.university.shortName,
      courseId: activeConfig.course.id,
      course: cleanCourseName,
      courseName: cleanCourseName,
      courseShortName: activeConfig.course.shortName,
      regulationId: activeConfig.regulation.id,
      regulation: activeConfig.regulation.name,
      regulationName: activeConfig.regulation.name,
      regulationCode: activeConfig.regulation.code,
      ruleVersion: activeConfig.regulation.ruleVersion,
      batch: formData.batch,
      batchYear: formData.batch,
      currentSemester: 1,
      totalSemesters: Number(activeConfig.course.totalSemesters),
      totalDegreeCredits: Number(activeConfig.course.totalDegreeCredits || 150),
      hasCompletedProfile: true
    };

    try {
      // 1. Save profile to backend & academicProfileSlice
      const saved = await dispatch(saveAcademicProfile(newConfig)).unwrap();

      // 2. Reset all academic data for the student atomically via studentService
      const updated = studentService.resetAcademicDataForNewProgram(saved || newConfig);

      // 3. Dispatch across Redux slices atomically
      dispatch(clearResults());
      dispatch(fetchResults());
      dispatch(resetBacklogsState());
      dispatch(fetchBacklogs());
      dispatch(fetchAcademicGoal());
      dispatch(fetchPerformanceData());
      dispatch(fetchAcademicHistory());
      dispatch(fetchActivities());
      dispatch(updateUserProfile(updated));
      dispatch(updateAuthProfileStatus(true));

      // 4. Update local state
      setCompletedResults([]);
      setFormData((prev) => ({
        ...prev,
        currentSemester: 1,
        totalSemesters: updated.totalSemesters
      }));
      setSavedBaseline({
        ...formData,
        universityId: updated.universityId,
        courseId: updated.courseId,
        regulationId: updated.regulationId,
        batch: updated.batch,
        currentSemester: 1,
        totalSemesters: updated.totalSemesters
      });
      setHasUnsavedChanges(false);
      setIsEditingPersonal(false);
      setIsEditingAcademic(false);

      showToast('Academic configuration updated and curriculum data reinitialized successfully.');
    } catch (err) {
      showToast(err?.message || 'Failed to update academic configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Standard (Non-destructive) Save
  const commitSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);

    const cleanCourseName = activeConfig.course.name.startsWith(activeConfig.course.shortName)
      ? activeConfig.course.name
      : `${activeConfig.course.shortName} — ${activeConfig.course.name}`;

    const updatedProfile = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      hallTicketNumber: formData.hallTicketNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      dob: formData.dob.trim(),
      gender: formData.gender,
      avatar: formData.avatar || DEFAULT_AVATAR,
      universityId: activeConfig.university.id,
      university: `${activeConfig.university.name} (${activeConfig.university.shortName})`,
      universityShortName: activeConfig.university.shortName,
      courseId: activeConfig.course.id,
      course: cleanCourseName,
      courseShortName: activeConfig.course.shortName,
      regulationId: activeConfig.regulation.id,
      regulation: activeConfig.regulation.name,
      ruleVersion: activeConfig.regulation.ruleVersion,
      batch: formData.batch,
      batchYear: formData.batch,
      currentSemester: Number(formData.currentSemester),
      totalSemesters: Number(activeConfig.course.totalSemesters),
      totalDegreeCredits: Number(activeConfig.course.totalDegreeCredits || 150),
      hasCompletedProfile: true
    };

    try {
      // 1. Dispatch saveAcademicProfile thunk (syncs with backend API)
      const saved = await dispatch(saveAcademicProfile(updatedProfile)).unwrap();
      const finalProfile = saved || updatedProfile;

      // 2. Update Student Service & authService
      studentService.updateProfile(finalProfile);
      authService.updateCurrentUser(finalProfile);

      // 3. Dispatch to Redux Store
      dispatch(updateUserProfile(finalProfile));
      dispatch(updateAuthProfileStatus(true));

      // 4. Log into Calculation & Activity History
      try {
        activityHistoryService.recordActivity({
          type: 'result',
          action: 'updated',
          title: 'Academic Profile Updated',
          description: `Saved profile details (${activeConfig.university.shortName} - ${activeConfig.course.shortName}, Regulation: ${activeConfig.regulation.code})`,
          entityId: 'profile-update',
          badgeValues: [
            activeConfig.course.shortName,
            activeConfig.university.shortName,
            activeConfig.regulation.code
          ],
          metadata: {
            universityId: activeConfig.university.id,
            courseId: activeConfig.course.id,
            regulationId: activeConfig.regulation.id,
            batch: formData.batch,
            currentSemester: formData.currentSemester
          }
        });
      } catch (err) {
        console.warn('Could not record activity history for profile update:', err);
      }

      // 5. Update local saved baseline & UI flags
      setSavedBaseline({ ...formData, avatar: finalProfile.avatar });
      setHasUnsavedChanges(false);
      setIsEditingPersonal(false);
      setIsEditingAcademic(false);

      showToast('Academic profile updated successfully.');
    } catch (err) {
      showToast(err?.message || 'Failed to update academic profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine grading details
  const isOU = formData.universityId === 'osmania';
  const isOUBCA = isOU && (formData.courseId === 'bca' || formData.courseId === 'mca');
  const isSGradeScheme = activeConfig?.regulation?.gradingSystem?.includes('S-Grade') || isOUBCA;

  // Grade scale representation string
  const gradeScaleDisplay = useMemo(() => {
    if (activeConfig?.gradeScale && activeConfig.gradeScale.length > 0) {
      return activeConfig.gradeScale
        .map((g) => `${g.grade} = ${g.desc || g.grade} (${g.points})`)
        .join(', ');
    }
    return isSGradeScheme
      ? 'S = Super (10), A+ = 9, A = 8, B+ = 7, B = 6, C = 5, D = 4, F = 0'
      : 'O = Outstanding (10), A+ = 9, A = 8, B+ = 7, B = 6, C = 5, F = 0';
  }, [activeConfig, isSGradeScheme]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">
              Academic Profile
            </h1>
            <p className="text-xs sm:text-sm text-text-light mt-0.5">
              Manage your personal details, academic information, and course configuration.
            </p>
          </div>
        </div>

        <Link
          to="/student/profile-setup"
          id="launch-setup-wizard-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-accent border border-accent/70 hover:bg-accent/10 transition-all self-start sm:self-center cursor-pointer shadow-sm active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Launch Setup Wizard</span>
        </Link>
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Upload Student Avatar"
      />

      {/* SECTION 1: Top Hero Card + Profile Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Student Profile Card & Photo Controls (8 cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar and Student Info Group */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 w-full text-center sm:text-left">
            {/* Avatar with Camera Icon Overlay */}
            <div className="relative flex-shrink-0">
              <img
                src={previewAvatar || DEFAULT_AVATAR}
                alt={formData.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-border shadow-md"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-card hover:bg-bg-sec border border-border text-text-h flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-90"
                title="Change Photo"
                id="avatar-camera-btn"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-h" />
              </button>
            </div>

            {/* Info and Tags */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-text-h tracking-tight truncate">
                  {formData.fullName}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(true)}
                  className="p-1 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
                  title="Edit Personal Information"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-text-light mt-0.5 truncate">
                {formData.email}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs sm:text-sm text-text-light font-mono">
                <span>{formData.hallTicketNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyRoll}
                  className="p-1 rounded-md text-text-light hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
                  title="Copy Roll Number"
                  id="copy-roll-btn"
                >
                  {copiedRoll ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                {activeConfig?.course ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm">
                    {activeConfig.course.shortName} –{' '}
                    {activeConfig.course.name?.split('—')?.[1]?.trim() || activeConfig.course.name}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm">
                    Program Not Configured
                  </span>
                )}
                {activeConfig?.university ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                    {activeConfig.university.name} ({activeConfig.university.shortName})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm">
                    University Not Selected
                  </span>
                )}
                {activeConfig?.regulation ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm">
                    {activeConfig.regulation.code}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm">
                    Setup Required
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Photo Controls Column */}
          <div className="flex flex-col items-center md:items-start md:border-l md:border-border md:pl-6 pt-4 md:pt-0 w-full md:w-auto flex-shrink-0">
            <span className="text-xs font-bold text-text-h uppercase tracking-wider">
              Profile Photo
            </span>
            <span className="text-[11px] text-text-light mt-0.5">
              JPG, PNG or WebP (Max 2MB)
            </span>

            <div className="flex items-center gap-2 mt-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={triggerFileInput}
                id="upload-photo-btn"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                id="remove-photo-btn"
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border transition-all cursor-pointer active:scale-95"
              >
                <span>Remove</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-text-light mt-3">
              <Info className="w-3.5 h-3.5 text-text-light" />
              <span>Recommended size: 400 × 400 px</span>
            </div>
          </div>
        </div>

        {/* Right: Profile Status Card (4 cols) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-text-light uppercase tracking-wider block">
              Profile Status
            </span>
            <div className={`flex items-center gap-2.5 ${profileStatus.color} mt-3`}>
              <profileStatus.icon className="w-7 h-7 flex-shrink-0" />
              <span className="text-xl font-bold tracking-tight">
                {profileStatus.label}
              </span>
            </div>
            <p className="text-xs text-text-light leading-relaxed mt-3">
              {profileStatus.description}
            </p>

            {profileStatus.label === 'Incomplete' && (
              <div className="mt-3.5 pt-3 border-t border-border">
                <Link
                  to="/student/profile-setup"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Complete Profile Setup</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-[11px] text-text-light">
            <span>Verification: Catalog Synchronized</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active Session</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Personal Information Card */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-h tracking-tight">
                Personal Information
              </h3>
              <p className="text-xs text-text-light">
                Your basic details and academic identity.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingPersonal(!isEditingPersonal)}
            id="edit-personal-btn"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditingPersonal ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {/* 3-column Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              disabled={!isEditingPersonal}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                isEditingPersonal
                  ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                  : 'bg-bg-sec/70 border-border text-text-h cursor-default'
              }`}
              placeholder="e.g. Student User"
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled={!isEditingPersonal}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, email: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                isEditingPersonal
                  ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                  : 'bg-bg-sec/70 border-border text-text-h cursor-default'
              }`}
              placeholder="e.g. student@resultpoint.edu"
              required
            />
          </div>

          {/* Hall Ticket / Roll Number */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Hall Ticket / Roll Number
            </label>
            <input
              type="text"
              value={formData.hallTicketNumber}
              disabled={!isEditingPersonal}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, hallTicketNumber: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border font-mono transition-all ${
                isEditingPersonal
                  ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                  : 'bg-bg-sec/70 border-border text-text-h cursor-default'
              }`}
              placeholder="e.g. REG-478583"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              disabled={!isEditingPersonal}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                isEditingPersonal
                  ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                  : 'bg-bg-sec/70 border-border text-text-h cursor-default'
              }`}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Date of Birth
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.dob}
                disabled={!isEditingPersonal}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dob: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                  isEditingPersonal
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
                placeholder="e.g. 15 Mar 2003"
              />
              <Calendar className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Gender
            </label>
            <div className="relative">
              <select
                value={formData.gender}
                disabled={!isEditingPersonal}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, gender: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all appearance-none cursor-pointer ${
                  isEditingPersonal
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
              >
                <option value="Male" className="bg-card text-text-h">Male</option>
                <option value="Female" className="bg-card text-text-h">Female</option>
                <option value="Other" className="bg-card text-text-h">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Academic Program & Catalog Rules */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-h tracking-tight">
                Academic Program & Catalog Rules
              </h3>
              <p className="text-xs text-text-light">
                Your enrolled course, university, regulation, and grading rules.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingAcademic(!isEditingAcademic)}
            id="edit-academic-btn"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditingAcademic ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {/* 3-column Dropdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* University / Institute */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              University / Institute
            </label>
            <div className="relative">
              <select
                value={formData.universityId}
                disabled={!isEditingAcademic}
                onChange={(e) => handleUniversityChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all appearance-none cursor-pointer ${
                  isEditingAcademic
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id} className="bg-card text-text-h">
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Course / Degree */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Course / Degree
            </label>
            <div className="relative">
              <select
                value={formData.courseId}
                disabled={!isEditingAcademic}
                onChange={(e) => handleCourseChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all appearance-none cursor-pointer ${
                  isEditingAcademic
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
              >
                {courses.some((c) => c.level === 'UG') && (
                  <optgroup label="Undergraduate (UG) Programs" className="bg-card text-text-h">
                    {courses
                      .filter((c) => c.level === 'UG')
                      .map((c) => {
                        const cleanLabel = c.name.startsWith(c.shortName) ? c.name : `${c.shortName} — ${c.name}`;
                        return (
                          <option key={c.id} value={c.id} className="bg-card text-text-h">
                            {cleanLabel} ({c.totalSemesters} Semesters)
                          </option>
                        );
                      })}
                  </optgroup>
                )}
                {courses.some((c) => c.level === 'PG') && (
                  <optgroup label="Postgraduate (PG) Programs" className="bg-card text-text-h">
                    {courses
                      .filter((c) => c.level === 'PG')
                      .map((c) => {
                        const cleanLabel = c.name.startsWith(c.shortName) ? c.name : `${c.shortName} — ${c.name}`;
                        return (
                          <option key={c.id} value={c.id} className="bg-card text-text-h">
                            {cleanLabel} ({c.totalSemesters} Semesters)
                          </option>
                        );
                      })}
                  </optgroup>
                )}
                {courses
                  .filter((c) => !['UG', 'PG'].includes(c.level))
                  .map((c) => {
                    const cleanLabel = c.name.startsWith(c.shortName) ? c.name : `${c.shortName} — ${c.name}`;
                    return (
                      <option key={c.id} value={c.id} className="bg-card text-text-h">
                        {cleanLabel} ({c.totalSemesters} Semesters)
                      </option>
                    );
                  })}
              </select>
              <ChevronDown className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Academic Batch / Admission Year */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Academic Batch / Admission Year
            </label>
            <div className="relative">
              <select
                value={formData.batch}
                disabled={!isEditingAcademic}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, batch: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all appearance-none cursor-pointer ${
                  isEditingAcademic
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
              >
                {availableBatches.map((b) => (
                  <option key={b} value={b} className="bg-card text-text-h">
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Academic Regulation */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Academic Regulation
            </label>
            <div className="relative">
              <select
                value={formData.regulationId}
                disabled={!isEditingAcademic}
                onChange={(e) => handleRegulationChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all appearance-none cursor-pointer ${
                  isEditingAcademic
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
              >
                {regulations.map((r) => (
                  <option key={r.id} value={r.id} className="bg-card text-text-h">
                    {r.name} — [{r.ruleVersion}]
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Current Active Semester (Dynamic Synchronization) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-text-light">
                Current Active Semester
              </label>
              {semesterInfo.isDegreeCompleted ? (
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Degree Completed
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {semesterInfo.completedCount} of {semesterInfo.maxSemesters} Completed
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={formData.currentSemester}
                disabled={!isEditingAcademic}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (semesterInfo.completedSemesters.includes(val)) {
                    showToast(
                      `Note: Semester ${val} has saved results in My Results. Setting active semester to ${val} allows viewing or entering supplementary marks.`,
                      'info'
                    );
                  }
                  setFormData((prev) => ({ ...prev, currentSemester: val }));
                  setHasUnsavedChanges(true);
                }}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-medium border transition-all appearance-none cursor-pointer ${
                  isEditingAcademic
                    ? 'bg-bg border-accent text-text-h focus:outline-none focus:ring-1 focus:ring-accent'
                    : 'bg-bg-sec/70 border-border text-text-h cursor-default'
                }`}
              >
                {Array.from(
                  { length: activeConfig?.course?.totalSemesters || formData.totalSemesters || 6 },
                  (_, i) => i + 1
                ).map((sem) => {
                  const isCompleted = semesterInfo.completedSemesters.includes(sem);
                  const isNextActive = sem === semesterInfo.lowestMissingSemester;
                  return (
                    <option key={sem} value={sem} className="bg-card text-text-h">
                      {sem} {isCompleted ? '— (Completed)' : isNextActive ? '— (Active / Next Available)' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-text-light absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Total Semesters (Course Duration) */}
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Total Semesters (Course Duration)
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border bg-bg-sec/70 border-border text-text-h flex items-center justify-between">
              <span>
                {activeConfig?.course?.totalSemesters || formData.totalSemesters || 6} (
                {activeConfig?.course?.durationYears || Math.round((activeConfig?.course?.totalSemesters || 6) / 2)} Years)
              </span>
              <span className="text-[11px] font-semibold text-text-light bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
                Degree Duration
              </span>
            </div>
          </div>
        </div>

        {/* Informational Rule Cards (Grading System & Percentage Formula) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Grading System Card */}
          <div className="bg-bg-sec/50 border border-border rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 flex-shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-text-h tracking-tight">
                  Grading System: 10-point ({isSGradeScheme ? 'S-Grade Scheme' : 'Standard Scheme'})
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {isOUBCA ? 'Default for OU BCA' : (isOU ? 'Default for OU' : 'Catalog Verified')}
                </span>
              </div>
              <p className="text-xs text-text-light mt-1 leading-relaxed">
                {isOUBCA
                  ? "BCA and MCA use 'S' for Super (instead of O)."
                  : activeConfig?.regulation?.description || 'Standard 10-point academic grading scale.'}
              </p>
              <p className="text-[11px] text-text-light font-mono mt-1.5 truncate">
                {gradeScaleDisplay}
              </p>
            </div>
          </div>

          {/* Active Percentage Formula Card */}
          <div className="bg-bg-sec/50 border border-border rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 flex-shrink-0 mt-0.5">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-text-h tracking-tight">
                  Active Percentage Formula
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  As per Regulation
                </span>
              </div>
              <p className="text-xs font-bold text-text-h mt-1">
                {activeConfig?.calculationRule?.formulaDescription || 'Percentage = CGPA × 10'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-text-light mt-1.5">
                <span>Rule Version: {activeConfig?.regulation?.ruleVersion || 'OU_BCA_CBCS_V1'}</span>
                <span>Degree Credits: {activeConfig?.course?.totalDegreeCredits || 150}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Note Callout Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
              Important Note
            </span>
            <p className="text-text-m">
              Changing university, course, or regulation after adding results may affect calculations. Please review your existing results and confirm before saving changes.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky/Fixed Action Row */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {hasUnsavedChanges && (
          <span className="text-xs text-amber-500 font-semibold mr-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unsaved Changes</span>
          </span>
        )}
        <button
          type="button"
          onClick={handleReset}
          id="reset-profile-changes-btn"
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-card hover:bg-bg-sec border border-border flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Changes</span>
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          id="save-profile-changes-btn"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-lg shadow-accent/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {/* Confirmation Modal when Changing Academic Configuration with Existing Results */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-text-h tracking-tight">
                  Change Academic Configuration?
                </h3>
                <p className="text-xs text-text-light">
                  Action requires explicit confirmation.
                </p>
              </div>
            </div>

            <div className="p-4 bg-bg rounded-xl border border-border space-y-3 text-xs leading-relaxed text-text-m">
              <p>
                You are about to change your university, course, or academic configuration. This change will reset your existing student academic data, including saved semester results, CGPA/SGPA calculations, academic goals, backlog records, analytics, and related academic history. This action cannot be undone.
              </p>
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                Are you sure you want to continue?
              </p>
            </div>

            <div className="p-3 bg-bg-sec rounded-xl text-[11px] text-text-light space-y-1">
              <p className="font-semibold text-text-h">Data Preservation Notice:</p>
              <p>• Your personal profile, login credentials, and user preferences remain intact.</p>
              <p>• New course curriculum and Semester 1 subjects will be loaded fresh from the academic catalog.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitDestructiveReset}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-md shadow-accent/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Updating...' : 'Confirm & Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
