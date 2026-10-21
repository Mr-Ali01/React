import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  BookOpen,
  Award,
  Layers,
  Sliders,
  Plus,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  History,
  Edit2,
  Trash2,
  Archive,
  Search,
  Filter,
  Globe,
  Power,
  AlertTriangle,
  X,
  ChevronDown,
  Link2,
  Check,
  Calculator,
  Play,
  Percent
} from 'lucide-react';
import { academicCatalogService } from '../../services/academicCatalogService';
import { academicCalculationEngine } from '../../services/academicCalculationEngine';
import { useToast } from '../../context/ToastContext';

export default function AcademicCatalogManager({ initialTab = 'universities' }) {
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState(() => academicCatalogService.getCatalog());
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync if prop changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Live synchronization with catalog updates and storage events
  useEffect(() => {
    const handleUpdate = () => {
      setCatalog(academicCatalogService.getCatalog());
    };
    window.addEventListener('rp_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('rp_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  // Selected hierarchy states for drilling down
  const [selectedUnivId, setSelectedUnivId] = useState(() => catalog.universities[0]?.id || 'jntuh');
  const selectedUniv = useMemo(() => {
    return catalog.universities.find((u) => u.id === selectedUnivId) || catalog.universities[0];
  }, [catalog, selectedUnivId]);

  const [selectedCourseId, setSelectedCourseId] = useState(() => selectedUniv?.courses?.[0]?.id || 'btech-cse');
  const selectedCourse = useMemo(() => {
    return selectedUniv?.courses?.find((c) => c.id === selectedCourseId) || selectedUniv?.courses?.[0];
  }, [selectedUniv, selectedCourseId]);

  const [selectedRegId, setSelectedRegId] = useState(() => selectedCourse?.regulations?.[0]?.id || 'jntuh-cse-r18');
  const selectedReg = useMemo(() => {
    return selectedCourse?.regulations?.find((r) => r.id === selectedRegId) || selectedCourse?.regulations?.[0];
  }, [selectedCourse, selectedRegId]);

  const [selectedSemester, setSelectedSemester] = useState(1);

  // Cascading Selection Handlers
  const handleSelectUniv = (univId) => {
    setSelectedUnivId(univId);
    const univ = catalog.universities.find((u) => u.id === univId);
    const firstCourse = univ?.courses?.[0];
    const firstReg = firstCourse?.regulations?.[0];
    setSelectedCourseId(firstCourse?.id || '');
    setSelectedRegId(firstReg?.id || '');
    setSelectedSemester(1);
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    const course = selectedUniv?.courses?.find((c) => c.id === courseId);
    const firstReg = course?.regulations?.[0];
    setSelectedRegId(firstReg?.id || '');
    if (selectedSemester > (course?.totalSemesters || 8)) {
      setSelectedSemester(1);
    }
  };

  const handleSelectReg = (regId) => {
    setSelectedRegId(regId);
  };

  // Subjects Tab State & Filter States
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectTypeFilter, setSubjectTypeFilter] = useState('all');
  const [subjectStatusFilter, setSubjectStatusFilter] = useState('all');

  // Add Subject Modal state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    defaultCredits: 4,
    type: 'Theory',
    maxMarks: 100,
    passMarks: 40,
    status: 'active'
  });
  const [addSubjectError, setAddSubjectError] = useState('');

  // Edit Subject Modal state
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editSubjectError, setEditSubjectError] = useState('');

  // Subject Confirmation modal state (archive/delete)
  const [subjectConfirmModal, setSubjectConfirmModal] = useState({
    isOpen: false,
    type: '',
    subject: null,
    refCheck: null
  });

  // Grading Scales Tab State & Filters
  const [selectedScaleId, setSelectedScaleId] = useState(() => {
    return catalog.gradingScales?.[0]?.id || 'ugc-10-point';
  });
  const [scaleSearch, setScaleSearch] = useState('');
  const [scaleStatusFilter, setScaleStatusFilter] = useState('all');
  const [gradeEntrySearch, setGradeEntrySearch] = useState('');

  // Currently selected scale
  const selectedGradingScale = useMemo(() => {
    const list = catalog.gradingScales || [];
    return list.find((s) => s.id.toLowerCase() === (selectedScaleId || '').toLowerCase()) || list[0] || null;
  }, [catalog.gradingScales, selectedScaleId]);

  // Add Scale Modal state
  const [isAddScaleOpen, setIsAddScaleOpen] = useState(false);
  const [newScale, setNewScale] = useState({
    id: '',
    name: '',
    system: '10-point',
    description: '',
    status: 'active',
    isOfficial: false
  });
  const [addScaleError, setAddScaleError] = useState('');

  // Edit Scale Modal state
  const [isEditScaleOpen, setIsEditScaleOpen] = useState(false);
  const [editingScale, setEditingScale] = useState(null);
  const [editScaleError, setEditScaleError] = useState('');

  // Add / Edit Grade Entry Modal state
  const [isGradeEntryModalOpen, setIsGradeEntryModalOpen] = useState(false);
  const [gradeEntryMode, setGradeEntryMode] = useState('add'); // 'add' | 'edit'
  const [currentGradeEntry, setCurrentGradeEntry] = useState({
    originalGrade: '',
    grade: '',
    points: 10,
    minPercentage: 85,
    maxPercentage: 100,
    desc: 'Outstanding',
    isPass: true
  });
  const [gradeEntryError, setGradeEntryError] = useState('');

  // Scale Confirmation Modal state (Archive / Delete)
  const [scaleConfirmModal, setScaleConfirmModal] = useState({
    isOpen: false,
    type: '',
    scale: null,
    refCheck: null
  });

  // Assign Scale to Regulation Modal state
  const [isAssignScaleModalOpen, setIsAssignScaleModalOpen] = useState(false);
  const [assignScaleData, setAssignScaleData] = useState({
    scaleId: '',
    univId: '',
    courseId: '',
    regId: '',
    publishNewVersion: false,
    ruleVersion: ''
  });
  const [assignScaleError, setAssignScaleError] = useState('');

  // Calculation Rules Tab State & Filters (Phase 2E)
  const [selectedRuleId, setSelectedRuleId] = useState(() => {
    return catalog.calculationRules?.[0]?.id || 'jntuh-r18-r22-rule';
  });
  const [calcRuleSearch, setCalcRuleSearch] = useState('');
  const [calcRuleStatusFilter, setCalcRuleStatusFilter] = useState('all');
  const [calcRuleTypeFilter, setCalcRuleTypeFilter] = useState('all');
  const [calcRuleUnivFilter, setCalcRuleUnivFilter] = useState('all');

  // Currently selected calculation rule
  const selectedCalculationRule = useMemo(() => {
    const list = catalog.calculationRules || [];
    return list.find((r) => r.id.toLowerCase() === (selectedRuleId || '').toLowerCase()) || list[0] || null;
  }, [catalog.calculationRules, selectedRuleId]);

  // Live Calculator Simulator state
  const [simulatorCgpa, setSimulatorCgpa] = useState(8.25);
  const simulatorResult = useMemo(() => {
    if (!selectedCalculationRule) return null;
    return academicCalculationEngine.convertCGPAToPercentage(simulatorCgpa, selectedCalculationRule);
  }, [simulatorCgpa, selectedCalculationRule]);

  // Add Calculation Rule Modal state
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    id: '',
    name: '',
    description: '',
    ruleType: 'percentage',
    universityId: '',
    courseId: '',
    regulationId: '',
    sgpaFormula: 'WEIGHTED_CREDIT_SUM',
    cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
    percentageFormula: '(CGPA - 0.5) * 10',
    formulaDescription: 'Percentage = (CGPA - 0.5) × 10',
    decimalPrecision: 2,
    roundingMode: 'round',
    minPassingGradePoints: 5.0,
    includeBacklogsInCredits: false,
    status: 'active',
    isOfficial: false,
    ruleVersion: 'RULE_V1'
  });
  const [addRuleError, setAddRuleError] = useState('');

  // Edit Calculation Rule Modal state
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editRuleError, setEditRuleError] = useState('');

  // Calculation Rule Confirm Modal state (Archive / Delete)
  const [ruleConfirmModal, setRuleConfirmModal] = useState({
    isOpen: false,
    type: '',
    rule: null,
    refCheck: null
  });

  // Assign Calculation Rule to Regulation Modal state
  const [isAssignRuleModalOpen, setIsAssignRuleModalOpen] = useState(false);
  const [assignRuleData, setAssignRuleData] = useState({
    ruleId: '',
    univId: '',
    courseId: '',
    regId: '',
    publishNewVersion: false,
    ruleVersion: ''
  });
  const [assignRuleError, setAssignRuleError] = useState('');

  // Universities Tab Search & Filter States
  const [univSearch, setUnivSearch] = useState('');
  const [univStatusFilter, setUnivStatusFilter] = useState('all');
  const [univTypeFilter, setUnivTypeFilter] = useState('all');
  const [univStateFilter, setUnivStateFilter] = useState('all');

  // Modal / Form states for creation
  const [isAddUnivOpen, setIsAddUnivOpen] = useState(false);
  const [newUniv, setNewUniv] = useState({
    name: '',
    shortName: '',
    id: '',
    city: '',
    state: '',
    type: 'State Public University',
    website: '',
    status: 'active',
    description: ''
  });
  const [addUnivError, setAddUnivError] = useState('');

  // Edit University state & errors
  const [isEditUnivOpen, setIsEditUnivOpen] = useState(false);
  const [editingUniv, setEditingUniv] = useState(null);
  const [editUnivError, setEditUnivError] = useState('');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    univ: null,
    refCheck: null
  });

  // Courses Tab Search & Filter States
  const [courseSearch, setCourseSearch] = useState('');
  const [courseLevelFilter, setCourseLevelFilter] = useState('all');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');

  // Add Course state & error
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    shortName: '',
    level: 'UG',
    durationYears: 4,
    totalSemesters: 8,
    totalDegreeCredits: 160,
    status: 'active',
    univId: ''
  });
  const [addCourseError, setAddCourseError] = useState('');

  // Edit Course state & error
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseError, setEditCourseError] = useState('');

  // Course Confirmation modal state
  const [courseConfirmModal, setCourseConfirmModal] = useState({
    isOpen: false,
    type: '',
    univId: '',
    course: null,
    refCheck: null
  });

  const [isPublishVersionOpen, setIsPublishVersionOpen] = useState(false);
  const [newRuleVersion, setNewRuleVersion] = useState({ ruleVersion: '', formulaDescription: '' });

  // Dynamic filter lists for Universities
  const availableUnivTypes = useMemo(() => {
    const types = Array.from(new Set(catalog.universities.map((u) => u.type).filter(Boolean)));
    return ['all', ...types];
  }, [catalog.universities]);

  const availableUnivStates = useMemo(() => {
    const states = Array.from(new Set(catalog.universities.map((u) => u.state).filter(Boolean)));
    return ['all', ...states];
  }, [catalog.universities]);

  const filteredUniversities = useMemo(() => {
    return catalog.universities.filter((u) => {
      if (univSearch.trim()) {
        const q = univSearch.trim().toLowerCase();
        const matchesName = (u.name || '').toLowerCase().includes(q);
        const matchesShort = (u.shortName || '').toLowerCase().includes(q);
        const matchesCity = (u.city || '').toLowerCase().includes(q);
        const matchesState = (u.state || '').toLowerCase().includes(q);
        if (!matchesName && !matchesShort && !matchesCity && !matchesState) return false;
      }

      if (univStatusFilter !== 'all') {
        const status = u.status || 'active';
        if (status !== univStatusFilter) return false;
      }

      if (univTypeFilter !== 'all' && u.type !== univTypeFilter) {
        return false;
      }

      if (univStateFilter !== 'all' && u.state !== univStateFilter) {
        return false;
      }

      return true;
    });
  }, [catalog.universities, univSearch, univStatusFilter, univTypeFilter, univStateFilter]);

  const hasUnivFilters =
    univSearch.trim() !== '' ||
    univStatusFilter !== 'all' ||
    univTypeFilter !== 'all' ||
    univStateFilter !== 'all';

  const handleClearUnivFilters = () => {
    setUnivSearch('');
    setUnivStatusFilter('all');
    setUnivTypeFilter('all');
    setUnivStateFilter('all');
  };

  // Flattened Courses from Catalog with University context
  const allCatalogCourses = useMemo(() => {
    const list = [];
    catalog.universities.forEach((u) => {
      (u.courses || []).forEach((c) => {
        list.push({
          ...c,
          universityId: u.id,
          universityName: u.name,
          universityShortName: u.shortName
        });
      });
    });
    return list;
  }, [catalog.universities]);

  const filteredCourses = useMemo(() => {
    return allCatalogCourses.filter((course) => {
      if (selectedUnivId !== 'all' && course.universityId !== selectedUnivId) {
        return false;
      }

      if (courseSearch.trim()) {
        const q = courseSearch.trim().toLowerCase();
        const matchesName = (course.name || '').toLowerCase().includes(q);
        const matchesCode = (course.shortName || '').toLowerCase().includes(q);
        const matchesUniv =
          (course.universityName || '').toLowerCase().includes(q) ||
          (course.universityShortName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesUniv) return false;
      }

      if (courseLevelFilter !== 'all' && course.level !== courseLevelFilter) {
        return false;
      }

      if (courseStatusFilter !== 'all') {
        const status = course.status || 'active';
        if (status !== courseStatusFilter) return false;
      }

      return true;
    });
  }, [allCatalogCourses, selectedUnivId, courseSearch, courseLevelFilter, courseStatusFilter]);

  const hasCourseFilters =
    courseSearch.trim() !== '' ||
    courseLevelFilter !== 'all' ||
    courseStatusFilter !== 'all';

  const handleClearCourseFilters = () => {
    setCourseSearch('');
    setCourseLevelFilter('all');
    setCourseStatusFilter('all');
  };

  // Add University submit
  const handleAddUniversity = (e) => {
    e.preventDefault();
    setAddUnivError('');

    try {
      const added = academicCatalogService.addUniversity({
        ...newUniv,
        courses: []
      });
      setCatalog(academicCatalogService.getCatalog());
      showToast(`University "${added.name}" (${added.shortName}) added to Academic Catalog!`);
      setIsAddUnivOpen(false);
      setNewUniv({
        name: '',
        shortName: '',
        id: '',
        city: '',
        state: '',
        type: 'State Public University',
        website: '',
        status: 'active',
        description: ''
      });
    } catch (err) {
      setAddUnivError(err.message || 'Failed to add university.');
    }
  };

  // Edit University Handlers
  const handleOpenEditUniv = (univ) => {
    setEditingUniv({
      id: univ.id,
      name: univ.name || '',
      shortName: univ.shortName || '',
      city: univ.city || '',
      state: univ.state || '',
      type: univ.type || 'State Public University',
      website: univ.website || '',
      status: univ.status || 'active',
      description: univ.description || ''
    });
    setEditUnivError('');
    setIsEditUnivOpen(true);
  };

  const handleSaveEditUniversity = (e) => {
    e.preventDefault();
    if (!editingUniv) return;
    setEditUnivError('');

    try {
      const updated = academicCatalogService.updateUniversity(editingUniv.id, {
        name: editingUniv.name,
        shortName: editingUniv.shortName,
        city: editingUniv.city,
        state: editingUniv.state,
        type: editingUniv.type,
        website: editingUniv.website,
        status: editingUniv.status,
        description: editingUniv.description
      });
      setCatalog(academicCatalogService.getCatalog());
      showToast(`University "${updated.name}" updated successfully!`);
      setIsEditUnivOpen(false);
      setEditingUniv(null);
    } catch (err) {
      setEditUnivError(err.message || 'Failed to update university.');
    }
  };

  // Toggle University Status (active <-> inactive)
  const handleToggleStatus = (univ) => {
    const currentStatus = univ.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const updated = academicCatalogService.setUniversityStatus(univ.id, nextStatus);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`University "${updated.name}" is now ${nextStatus}!`);
    } catch (err) {
      showToast(err.message || 'Status change failed', 'error');
    }
  };

  // Archive Handlers
  const handleOpenArchive = (univ) => {
    setConfirmModal({
      isOpen: true,
      type: 'archive',
      univ,
      refCheck: academicCatalogService.checkUniversityReferences(univ.id)
    });
  };

  const handleConfirmArchive = () => {
    if (!confirmModal.univ) return;
    try {
      const updated = academicCatalogService.archiveUniversity(confirmModal.univ.id);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`University "${updated.name}" archived. Existing courses and student records preserved.`);
      setConfirmModal({ isOpen: false, type: '', univ: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to archive university', 'error');
    }
  };

  // Delete Handlers
  const handleOpenDelete = (univ) => {
    const refCheck = academicCatalogService.checkUniversityReferences(univ.id);
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      univ,
      refCheck
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmModal.univ) return;
    try {
      academicCatalogService.deleteUniversity(confirmModal.univ.id);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`University permanently deleted.`);
      setConfirmModal({ isOpen: false, type: '', univ: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  // Course Management Handlers
  const handleOpenAddCourse = (targetUnivId) => {
    const parentId = targetUnivId || (selectedUnivId !== 'all' ? selectedUnivId : catalog.universities[0]?.id) || 'jntuh';
    setNewCourse({
      name: '',
      shortName: '',
      level: 'UG',
      durationYears: 4,
      totalSemesters: 8,
      totalDegreeCredits: 160,
      status: 'active',
      univId: parentId
    });
    setAddCourseError('');
    setIsAddCourseOpen(true);
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    setAddCourseError('');
    const targetUnivId = newCourse.univId || selectedUnivId;
    try {
      const added = academicCatalogService.addCourse(targetUnivId, newCourse);
      setCatalog(academicCatalogService.getCatalog());
      const univ = catalog.universities.find((u) => u.id === targetUnivId);
      showToast(`Course "${added.name}" (${added.shortName}) added under ${univ?.shortName || 'University'}!`);
      setIsAddCourseOpen(false);
      setNewCourse({
        name: '',
        shortName: '',
        level: 'UG',
        durationYears: 4,
        totalSemesters: 8,
        totalDegreeCredits: 160,
        status: 'active',
        univId: targetUnivId
      });
    } catch (err) {
      setAddCourseError(err.message || 'Failed to add course.');
    }
  };

  const handleOpenEditCourse = (univId, course) => {
    setEditingCourse({
      univId,
      id: course.id,
      name: course.name || '',
      shortName: course.shortName || '',
      level: course.level || 'UG',
      durationYears: course.durationYears || 4,
      totalSemesters: course.totalSemesters || 8,
      totalDegreeCredits: course.totalDegreeCredits || 160,
      status: course.status || 'active'
    });
    setEditCourseError('');
    setIsEditCourseOpen(true);
  };

  const handleSaveEditCourse = (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setEditCourseError('');
    try {
      const updated = academicCatalogService.updateCourse(editingCourse.univId, editingCourse.id, editingCourse);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Course "${updated.name}" updated successfully!`);
      setIsEditCourseOpen(false);
      setEditingCourse(null);
    } catch (err) {
      setEditCourseError(err.message || 'Failed to update course.');
    }
  };

  const handleToggleCourseStatus = (univId, course) => {
    const currentStatus = course.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const updated = academicCatalogService.setCourseStatus(univId, course.id, nextStatus);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Course "${updated.name}" is now ${nextStatus}!`);
    } catch (err) {
      showToast(err.message || 'Status change failed', 'error');
    }
  };

  const handleOpenArchiveCourse = (univId, course) => {
    const refCheck = academicCatalogService.checkCourseReferences(univId, course.id);
    setCourseConfirmModal({
      isOpen: true,
      type: 'archive',
      univId,
      course,
      refCheck
    });
  };

  const handleConfirmArchiveCourse = () => {
    if (!courseConfirmModal.course) return;
    try {
      const updated = academicCatalogService.archiveCourse(courseConfirmModal.univId, courseConfirmModal.course.id);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Course "${updated.name}" archived. Existing regulations and student records preserved.`);
      setCourseConfirmModal({ isOpen: false, type: '', univId: '', course: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to archive course', 'error');
    }
  };

  const handleOpenDeleteCourse = (univId, course) => {
    const refCheck = academicCatalogService.checkCourseReferences(univId, course.id);
    setCourseConfirmModal({
      isOpen: true,
      type: 'delete',
      univId,
      course,
      refCheck
    });
  };

  const handleConfirmDeleteCourse = () => {
    if (!courseConfirmModal.course) return;
    try {
      academicCatalogService.deleteCourse(courseConfirmModal.univId, courseConfirmModal.course.id);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Course permanently deleted.`);
      setCourseConfirmModal({ isOpen: false, type: '', univId: '', course: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  // Derived subjects list for current semester
  const currentSemesterSubjects = useMemo(() => {
    if (!selectedUniv?.id || !selectedCourse?.id || !selectedReg?.id) return [];
    return academicCatalogService.getSemesterSubjects(
      selectedUniv.id,
      selectedCourse.id,
      selectedReg.id,
      selectedSemester
    );
  }, [catalog, selectedUniv, selectedCourse, selectedReg, selectedSemester]);

  const filteredSemesterSubjects = useMemo(() => {
    return currentSemesterSubjects.filter((sub) => {
      if (subjectSearch.trim()) {
        const q = subjectSearch.trim().toLowerCase();
        const matchesCode = (sub.code || '').toLowerCase().includes(q);
        const matchesName = (sub.name || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesName) return false;
      }
      if (subjectTypeFilter !== 'all') {
        const type = sub.type || 'Theory';
        if (type.toLowerCase() !== subjectTypeFilter.toLowerCase()) return false;
      }
      if (subjectStatusFilter !== 'all') {
        const status = sub.status || 'active';
        if (status.toLowerCase() !== subjectStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [currentSemesterSubjects, subjectSearch, subjectTypeFilter, subjectStatusFilter]);

  const semesterTotalCredits = useMemo(() => {
    return currentSemesterSubjects
      .filter((s) => s.status !== 'archived')
      .reduce((acc, s) => acc + (Number(s.defaultCredits !== undefined ? s.defaultCredits : s.credits) || 0), 0);
  }, [currentSemesterSubjects]);

  const hasSubjectFilters =
    subjectSearch.trim() !== '' ||
    subjectTypeFilter !== 'all' ||
    subjectStatusFilter !== 'all';

  const handleClearSubjectFilters = () => {
    setSubjectSearch('');
    setSubjectTypeFilter('all');
    setSubjectStatusFilter('all');
  };

  // Subject Management Handlers
  const handleOpenAddSubject = () => {
    setNewSubject({
      code: '',
      name: '',
      defaultCredits: 4,
      type: 'Theory',
      maxMarks: 100,
      passMarks: 40,
      status: 'active'
    });
    setAddSubjectError('');
    setIsAddSubjectOpen(true);
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    setAddSubjectError('');
    if (!selectedUniv || !selectedCourse || !selectedReg) {
      setAddSubjectError('Please select a valid University, Course, and Regulation.');
      return;
    }
    try {
      const added = academicCatalogService.addSubject(
        selectedUniv.id,
        selectedCourse.id,
        selectedReg.id,
        selectedSemester,
        newSubject
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Subject "${added.name}" (${added.code}) added to Semester ${selectedSemester}!`);
      setIsAddSubjectOpen(false);
    } catch (err) {
      setAddSubjectError(err.message || 'Failed to add subject.');
    }
  };

  const handleOpenEditSubject = (subject) => {
    setEditingSubject({
      originalCode: subject.code,
      code: subject.code,
      name: subject.name,
      defaultCredits: subject.defaultCredits !== undefined ? subject.defaultCredits : (subject.credits || 4),
      type: subject.type || 'Theory',
      maxMarks: subject.maxMarks !== undefined ? subject.maxMarks : '',
      passMarks: subject.passMarks !== undefined ? subject.passMarks : '',
      status: subject.status || 'active'
    });
    setEditSubjectError('');
    setIsEditSubjectOpen(true);
  };

  const handleSaveEditSubject = (e) => {
    e.preventDefault();
    if (!editingSubject || !selectedUniv || !selectedCourse || !selectedReg) return;
    setEditSubjectError('');
    try {
      const updated = academicCatalogService.updateSubject(
        selectedUniv.id,
        selectedCourse.id,
        selectedReg.id,
        selectedSemester,
        editingSubject.originalCode,
        editingSubject
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Subject "${updated.name}" (${updated.code}) updated successfully!`);
      setIsEditSubjectOpen(false);
      setEditingSubject(null);
    } catch (err) {
      setEditSubjectError(err.message || 'Failed to update subject.');
    }
  };

  const handleToggleSubjectStatus = (subject) => {
    if (!selectedUniv || !selectedCourse || !selectedReg) return;
    const currentStatus = subject.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const updated = academicCatalogService.setSubjectStatus(
        selectedUniv.id,
        selectedCourse.id,
        selectedReg.id,
        selectedSemester,
        subject.code,
        nextStatus
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Subject "${updated.code}" is now ${nextStatus}!`);
    } catch (err) {
      showToast(err.message || 'Status change failed.', 'error');
    }
  };

  const handleOpenArchiveSubject = (subject) => {
    if (!selectedUniv || !selectedCourse || !selectedReg) return;
    const refCheck = academicCatalogService.checkSubjectReferences(
      selectedUniv.id,
      selectedCourse.id,
      selectedReg.id,
      selectedSemester,
      subject.code
    );
    setSubjectConfirmModal({
      isOpen: true,
      type: 'archive',
      subject,
      refCheck
    });
  };

  const handleConfirmArchiveSubject = () => {
    if (!subjectConfirmModal.subject || !selectedUniv || !selectedCourse || !selectedReg) return;
    try {
      const updated = academicCatalogService.archiveSubject(
        selectedUniv.id,
        selectedCourse.id,
        selectedReg.id,
        selectedSemester,
        subjectConfirmModal.subject.code
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Subject "${updated.name}" archived. Historical student results and grade transcripts preserved.`);
      setSubjectConfirmModal({ isOpen: false, type: '', subject: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to archive subject.', 'error');
    }
  };

  const handleOpenDeleteSubject = (subject) => {
    if (!selectedUniv || !selectedCourse || !selectedReg) return;
    const refCheck = academicCatalogService.checkSubjectReferences(
      selectedUniv.id,
      selectedCourse.id,
      selectedReg.id,
      selectedSemester,
      subject.code
    );
    setSubjectConfirmModal({
      isOpen: true,
      type: 'delete',
      subject,
      refCheck
    });
  };

  const handleConfirmDeleteSubject = () => {
    if (!subjectConfirmModal.subject || !selectedUniv || !selectedCourse || !selectedReg) return;
    try {
      const deleted = academicCatalogService.deleteSubject(
        selectedUniv.id,
        selectedCourse.id,
        selectedReg.id,
        selectedSemester,
        subjectConfirmModal.subject.code
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Subject "${deleted.name}" (${deleted.code}) permanently deleted.`);
      setSubjectConfirmModal({ isOpen: false, type: '', subject: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to delete subject.', 'error');
    }
  };

  // Filtered Grading Scales
  const filteredGradingScales = useMemo(() => {
    const scales = catalog.gradingScales || [];
    return scales.filter((scale) => {
      if (scaleSearch.trim()) {
        const q = scaleSearch.trim().toLowerCase();
        const matchesName = (scale.name || '').toLowerCase().includes(q);
        const matchesId = (scale.id || '').toLowerCase().includes(q);
        const matchesDesc = (scale.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDesc) return false;
      }
      if (scaleStatusFilter !== 'all') {
        const status = scale.status || 'active';
        if (status !== scaleStatusFilter) return false;
      }
      return true;
    });
  }, [catalog.gradingScales, scaleSearch, scaleStatusFilter]);

  // Filtered Grades within selected scale
  const filteredScaleGrades = useMemo(() => {
    if (!selectedGradingScale || !Array.isArray(selectedGradingScale.grades)) return [];
    if (!gradeEntrySearch.trim()) return selectedGradingScale.grades;
    const q = gradeEntrySearch.trim().toLowerCase();
    return selectedGradingScale.grades.filter((g) => {
      return (
        g.grade.toLowerCase().includes(q) ||
        (g.desc || '').toLowerCase().includes(q) ||
        String(g.points).includes(q)
      );
    });
  }, [selectedGradingScale, gradeEntrySearch]);

  // Scale coverage and validation analysis
  const scaleValidationResult = useMemo(() => {
    if (!selectedGradingScale || !Array.isArray(selectedGradingScale.grades)) {
      return { isValid: false, errors: ['No grades configured'], warnings: [] };
    }
    return academicCatalogService.validateGradeScale(selectedGradingScale.grades, { checkCoverage: true });
  }, [selectedGradingScale]);

  // Grading Scales Handlers
  const handleOpenAddScale = () => {
    setNewScale({
      id: '',
      name: '',
      system: '10-point',
      description: '',
      status: 'active',
      isOfficial: false
    });
    setAddScaleError('');
    setIsAddScaleOpen(true);
  };

  const handleAddScale = (e) => {
    e.preventDefault();
    setAddScaleError('');
    try {
      const added = academicCatalogService.addGradingScale(newScale);
      setCatalog(academicCatalogService.getCatalog());
      setSelectedScaleId(added.id);
      showToast(`Grading scale "${added.name}" created successfully!`);
      setIsAddScaleOpen(false);
    } catch (err) {
      setAddScaleError(err.message || 'Failed to add grading scale.');
    }
  };

  const handleOpenEditScale = (scale) => {
    setEditingScale({
      id: scale.id,
      name: scale.name,
      system: scale.system || '10-point',
      description: scale.description || '',
      status: scale.status || 'active',
      isOfficial: Boolean(scale.isOfficial)
    });
    setEditScaleError('');
    setIsEditScaleOpen(true);
  };

  const handleSaveEditScale = (e) => {
    e.preventDefault();
    if (!editingScale) return;
    setEditScaleError('');
    try {
      const updated = academicCatalogService.updateGradingScale(editingScale.id, editingScale);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Grading scale "${updated.name}" updated!`);
      setIsEditScaleOpen(false);
      setEditingScale(null);
    } catch (err) {
      setEditScaleError(err.message || 'Failed to update grading scale.');
    }
  };

  const handleToggleScaleStatus = (scale) => {
    const next = scale.status === 'active' ? 'archived' : 'active';
    try {
      const updated = academicCatalogService.setGradingScaleStatus(scale.id, next);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Scale "${updated.name}" is now ${next}!`);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleOpenArchiveScale = (scale) => {
    const refCheck = academicCatalogService.checkGradingScaleReferences(scale.id);
    setScaleConfirmModal({
      isOpen: true,
      type: 'archive',
      scale,
      refCheck
    });
  };

  const handleConfirmArchiveScale = () => {
    if (!scaleConfirmModal.scale) return;
    try {
      const updated = academicCatalogService.archiveGradingScale(scaleConfirmModal.scale.id);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Scale "${updated.name}" archived. Associated regulations remain fully protected.`);
      setScaleConfirmModal({ isOpen: false, type: '', scale: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to archive scale', 'error');
    }
  };

  const handleOpenDeleteScale = (scale) => {
    const refCheck = academicCatalogService.checkGradingScaleReferences(scale.id);
    setScaleConfirmModal({
      isOpen: true,
      type: 'delete',
      scale,
      refCheck
    });
  };

  const handleConfirmDeleteScale = () => {
    if (!scaleConfirmModal.scale) return;
    try {
      const deleted = academicCatalogService.deleteGradingScale(scaleConfirmModal.scale.id);
      setCatalog(academicCatalogService.getCatalog());
      const remaining = academicCatalogService.getGradingScales();
      setSelectedScaleId(remaining[0]?.id || '');
      showToast(`Grading scale "${deleted.name}" permanently deleted.`);
      setScaleConfirmModal({ isOpen: false, type: '', scale: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to delete scale', 'error');
    }
  };

  // Grade Entry Handlers
  const handleOpenAddGradeEntry = () => {
    if (!selectedGradingScale) return;
    setCurrentGradeEntry({
      originalGrade: '',
      grade: '',
      points: 10,
      minPercentage: 85,
      maxPercentage: 100,
      desc: 'Outstanding',
      isPass: true
    });
    setGradeEntryError('');
    setGradeEntryMode('add');
    setIsGradeEntryModalOpen(true);
  };

  const handleOpenEditGradeEntry = (entry) => {
    if (!selectedGradingScale) return;
    setCurrentGradeEntry({
      originalGrade: entry.grade,
      grade: entry.grade,
      points: entry.points,
      minPercentage: entry.minPercentage,
      maxPercentage: entry.maxPercentage,
      desc: entry.desc || '',
      isPass: Boolean(entry.isPass)
    });
    setGradeEntryError('');
    setGradeEntryMode('edit');
    setIsGradeEntryModalOpen(true);
  };

  const handleSaveGradeEntry = (e) => {
    e.preventDefault();
    if (!selectedGradingScale) return;
    setGradeEntryError('');
    try {
      if (gradeEntryMode === 'add') {
        academicCatalogService.addGradeEntry(selectedGradingScale.id, currentGradeEntry);
        showToast(`Grade tier "${currentGradeEntry.grade}" added to ${selectedGradingScale.name}!`);
      } else {
        academicCatalogService.updateGradeEntry(
          selectedGradingScale.id,
          currentGradeEntry.originalGrade,
          currentGradeEntry
        );
        showToast(`Grade tier "${currentGradeEntry.grade}" updated!`);
      }
      setCatalog(academicCatalogService.getCatalog());
      setIsGradeEntryModalOpen(false);
    } catch (err) {
      setGradeEntryError(err.message || 'Failed to save grade entry.');
    }
  };

  const handleDeleteGradeEntry = (gradeSymbol) => {
    if (!selectedGradingScale) return;
    if (window.confirm(`Delete grade tier "${gradeSymbol}" from "${selectedGradingScale.name}"?`)) {
      try {
        academicCatalogService.deleteGradeEntry(selectedGradingScale.id, gradeSymbol);
        setCatalog(academicCatalogService.getCatalog());
        showToast(`Grade tier "${gradeSymbol}" removed.`);
      } catch (err) {
        showToast(err.message || 'Failed to remove grade tier', 'error');
      }
    }
  };

  // Open Assign Scale Modal
  const handleOpenAssignScale = (scale) => {
    setAssignScaleData({
      scaleId: scale.id,
      univId: selectedUnivId,
      courseId: selectedCourseId,
      regId: selectedRegId,
      publishNewVersion: false,
      ruleVersion: `${selectedReg?.code || 'REG'}_V2`
    });
    setAssignScaleError('');
    setIsAssignScaleModalOpen(true);
  };

  const handleConfirmAssignScale = (e) => {
    e.preventDefault();
    setAssignScaleError('');
    try {
      academicCatalogService.assignGradingScaleToRegulation(
        assignScaleData.univId,
        assignScaleData.courseId,
        assignScaleData.regId,
        assignScaleData.scaleId,
        {
          publishNewVersion: assignScaleData.publishNewVersion,
          ruleVersion: assignScaleData.ruleVersion
        }
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(
        assignScaleData.publishNewVersion
          ? `Published new immutable regulation version with scale "${selectedGradingScale?.name}"!`
          : `Grading scale linked to regulation!`
      );
      setIsAssignScaleModalOpen(false);
    } catch (err) {
      setAssignScaleError(err.message || 'Failed to assign grading scale.');
    }
  };

  // Publish New Rule Version (preserving historical integrity)
  const handlePublishVersion = (e) => {
    e.preventDefault();
    if (!newRuleVersion.ruleVersion) return;

    academicCatalogService.publishNewRegulationVersion(selectedUnivId, selectedCourseId, selectedRegId, {
      ruleVersion: newRuleVersion.ruleVersion,
      calculationRule: {
        ...selectedReg.calculationRule,
        formulaDescription: newRuleVersion.formulaDescription || selectedReg.calculationRule?.formulaDescription
      }
    });

    setCatalog(academicCatalogService.getCatalog());
    showToast(`Published immutable Rule Version "${newRuleVersion.ruleVersion}"! Existing student historical records remain untouched.`);
    setIsPublishVersionOpen(false);
    setNewRuleVersion({ ruleVersion: '', formulaDescription: '' });
  };

  // Calculation Rules Filtered Memo (Phase 2E)
  const filteredCalculationRules = useMemo(() => {
    const rules = catalog.calculationRules || [];
    return rules.filter((rule) => {
      if (calcRuleSearch.trim()) {
        const q = calcRuleSearch.trim().toLowerCase();
        const matchesName = (rule.name || '').toLowerCase().includes(q);
        const matchesId = (rule.id || '').toLowerCase().includes(q);
        const matchesFormula = (rule.percentageFormula || '').toLowerCase().includes(q);
        const matchesDesc = (rule.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesFormula && !matchesDesc) return false;
      }
      if (calcRuleStatusFilter !== 'all') {
        const status = rule.status || 'active';
        if (status !== calcRuleStatusFilter) return false;
      }
      if (calcRuleTypeFilter !== 'all') {
        const type = rule.ruleType || 'percentage';
        if (type !== calcRuleTypeFilter) return false;
      }
      if (calcRuleUnivFilter !== 'all') {
        if (calcRuleUnivFilter === 'global') {
          if (rule.universityId) return false;
        } else {
          if (rule.universityId !== calcRuleUnivFilter) return false;
        }
      }
      return true;
    });
  }, [catalog.calculationRules, calcRuleSearch, calcRuleStatusFilter, calcRuleTypeFilter, calcRuleUnivFilter]);

  // Calculation Rules Handlers (Phase 2E)
  const handleOpenAddRule = () => {
    setNewRule({
      id: '',
      name: '',
      description: '',
      ruleType: 'percentage',
      universityId: selectedUnivId || '',
      courseId: selectedCourseId || '',
      regulationId: selectedRegId || '',
      sgpaFormula: 'WEIGHTED_CREDIT_SUM',
      cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
      percentageFormula: '(CGPA - 0.5) * 10',
      formulaDescription: 'Percentage = (CGPA - 0.5) × 10',
      decimalPrecision: 2,
      roundingMode: 'round',
      minPassingGradePoints: 5.0,
      includeBacklogsInCredits: false,
      status: 'active',
      isOfficial: false,
      ruleVersion: 'RULE_V1'
    });
    setAddRuleError('');
    setIsAddRuleOpen(true);
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    setAddRuleError('');
    try {
      const added = academicCatalogService.addCalculationRule(newRule);
      setCatalog(academicCatalogService.getCatalog());
      setSelectedRuleId(added.id);
      showToast(`Calculation rule "${added.name}" created successfully!`);
      setIsAddRuleOpen(false);
    } catch (err) {
      setAddRuleError(err.message || 'Failed to add calculation rule.');
    }
  };

  const handleOpenEditRule = (rule) => {
    setEditingRule({
      ...rule,
      decimalPrecision: Number(rule.decimalPrecision) || 2,
      roundingMode: rule.roundingMode || 'round',
      minPassingGradePoints: Number(rule.minPassingGradePoints) || 5.0
    });
    setEditRuleError('');
    setIsEditRuleOpen(true);
  };

  const handleSaveEditRule = (e) => {
    e.preventDefault();
    if (!editingRule) return;
    setEditRuleError('');
    try {
      const updated = academicCatalogService.updateCalculationRule(editingRule.id, editingRule);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Calculation rule "${updated.name}" updated successfully!`);
      setIsEditRuleOpen(false);
      setEditingRule(null);
    } catch (err) {
      setEditRuleError(err.message || 'Failed to update calculation rule.');
    }
  };

  const handleToggleRuleStatus = (rule) => {
    const next = rule.status === 'active' ? 'archived' : 'active';
    try {
      const updated = academicCatalogService.setCalculationRuleStatus(rule.id, next);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Rule "${updated.name}" is now ${next}!`);
    } catch (err) {
      showToast(err.message || 'Failed to change status.', 'error');
    }
  };

  const handleOpenArchiveRule = (rule) => {
    const refCheck = academicCatalogService.checkCalculationRuleReferences(rule.id);
    setRuleConfirmModal({
      isOpen: true,
      type: 'archive',
      rule,
      refCheck
    });
  };

  const handleConfirmArchiveRule = () => {
    if (!ruleConfirmModal.rule) return;
    try {
      const updated = academicCatalogService.archiveCalculationRule(ruleConfirmModal.rule.id);
      setCatalog(academicCatalogService.getCatalog());
      showToast(`Rule "${updated.name}" archived. Associated regulations remain safe.`);
      setRuleConfirmModal({ isOpen: false, type: '', rule: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to archive rule.', 'error');
    }
  };

  const handleOpenDeleteRule = (rule) => {
    const refCheck = academicCatalogService.checkCalculationRuleReferences(rule.id);
    setRuleConfirmModal({
      isOpen: true,
      type: 'delete',
      rule,
      refCheck
    });
  };

  const handleConfirmDeleteRule = () => {
    if (!ruleConfirmModal.rule) return;
    try {
      const deleted = academicCatalogService.deleteCalculationRule(ruleConfirmModal.rule.id);
      setCatalog(academicCatalogService.getCatalog());
      const remaining = academicCatalogService.getCalculationRules();
      setSelectedRuleId(remaining[0]?.id || '');
      showToast(`Calculation rule "${deleted.name}" permanently deleted.`);
      setRuleConfirmModal({ isOpen: false, type: '', rule: null, refCheck: null });
    } catch (err) {
      showToast(err.message || 'Failed to delete rule.', 'error');
    }
  };

  const handleOpenAssignRule = (rule) => {
    setAssignRuleData({
      ruleId: rule.id,
      univId: rule.universityId || selectedUnivId || catalog.universities?.[0]?.id || '',
      courseId: rule.courseId || selectedCourseId || '',
      regId: rule.regulationId || selectedRegId || '',
      publishNewVersion: false,
      ruleVersion: `${selectedReg?.code || 'REG'}_CALC_V2`
    });
    setAssignRuleError('');
    setIsAssignRuleModalOpen(true);
  };

  const handleConfirmAssignRule = (e) => {
    e.preventDefault();
    setAssignRuleError('');
    try {
      academicCatalogService.assignCalculationRuleToRegulation(
        assignRuleData.univId,
        assignRuleData.courseId,
        assignRuleData.regId,
        assignRuleData.ruleId,
        {
          publishNewVersion: assignRuleData.publishNewVersion,
          ruleVersion: assignRuleData.ruleVersion
        }
      );
      setCatalog(academicCatalogService.getCatalog());
      showToast(
        assignRuleData.publishNewVersion
          ? `Published new regulation version with rule "${selectedCalculationRule?.name}"!`
          : `Calculation rule assigned to regulation!`
      );
      setIsAssignRuleModalOpen(false);
    } catch (err) {
      setAssignRuleError(err.message || 'Failed to assign calculation rule.');
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm('Reset catalog to official verified university seeds?')) {
      const reset = academicCatalogService.resetToDefaults();
      setCatalog(reset);
      showToast('Catalog reset to standard verified university data.');
    }
  };

  // Aggregate Stats
  const totalUniversities = catalog.universities.length;
  const totalCourses = catalog.universities.reduce((acc, u) => acc + (u.courses?.length || 0), 0);
  const totalRegulations = catalog.universities.reduce(
    (acc, u) => acc + (u.courses?.reduce((cAcc, c) => cAcc + (c.regulations?.length || 0), 0) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-accent" />
            <span>Academic Catalog & Regulation Registry</span>
          </h1>
          <p className="text-xs text-text-light mt-0.5">
            Manage official universities, courses, duration constraints, regulations, and immutable calculation rule versions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetCatalog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-light hover:text-text-h bg-card border border-border hover:bg-bg-sec transition-all"
            title="Restore seed catalog"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* High-Level Registry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-text-h block">{totalUniversities}</span>
            <span className="text-xs text-text-light font-medium">Universities Registered</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brandGreen/10 border border-brandGreen/20 flex items-center justify-center text-brandGreen">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-text-h block">{totalCourses}</span>
            <span className="text-xs text-text-light font-medium">Academic Programs / Courses</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brandPurple/10 border border-brandPurple/20 flex items-center justify-center text-brandPurple">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-text-h block">{totalRegulations}</span>
            <span className="text-xs text-text-light font-medium">Regulations & Rule Versions</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'universities', label: 'Universities', icon: Building2 },
          { id: 'courses', label: 'Courses & Semesters', icon: BookOpen },
          { id: 'regulations', label: 'Regulations & Versions', icon: Sliders },
          { id: 'grading', label: 'Grading Rules & Scales', icon: Award },
          { id: 'subjects', label: 'Curriculums & Subjects', icon: Layers },
          { id: 'calculations', label: 'Calculation Rules', icon: Calculator }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-light hover:text-text-h hover:bg-bg-sec'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: UNIVERSITIES */}
      {activeTab === 'universities' && (
        <div className="space-y-4">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <span>Configured Institutional Catalogs</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                  {catalog.universities.length} Registered
                </span>
              </h2>
              <p className="text-xs text-text-light mt-0.5">
                Official university profiles, short names, location, website URLs, and active lifecycle states.
              </p>
            </div>
            <button
              onClick={() => {
                setAddUnivError('');
                setIsAddUnivOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add University</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search by text */}
              <div className="relative">
                <Search className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, code, city..."
                  value={univSearch}
                  onChange={(e) => setUnivSearch(e.target.value)}
                  className="calc-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                />
                {univSearch && (
                  <button
                    onClick={() => setUnivSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={univStatusFilter}
                  onChange={(e) => setUnivStatusFilter(e.target.value)}
                  className="calc-input w-full px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  <option value="all">All Lifecycle States</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="archived">Archived Only</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={univTypeFilter}
                  onChange={(e) => setUnivTypeFilter(e.target.value)}
                  className="calc-input w-full px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  <option value="all">All Institutional Types</option>
                  {availableUnivTypes
                    .filter((t) => t !== 'all')
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </select>
              </div>

              {/* State Filter */}
              <div>
                <select
                  value={univStateFilter}
                  onChange={(e) => setUnivStateFilter(e.target.value)}
                  className="calc-input w-full px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  <option value="all">All States / Regions</option>
                  {availableUnivStates
                    .filter((s) => s !== 'all')
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Filter Summary & Reset */}
            <div className="flex items-center justify-between text-[11px] text-text-light pt-1 border-t border-border/60">
              <span>
                Showing <strong>{filteredUniversities.length}</strong> of{' '}
                <strong>{catalog.universities.length}</strong> institutions
              </span>
              {hasUnivFilters && (
                <button
                  onClick={handleClearUnivFilters}
                  className="inline-flex items-center gap-1 text-accent hover:underline font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Universities Grid */}
          {filteredUniversities.length === 0 ? (
            <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-h">No universities found</h3>
                <p className="text-xs text-text-light mt-0.5">
                  No institutional catalogs match your current search or filter criteria.
                </p>
              </div>
              {hasUnivFilters && (
                <button
                  onClick={handleClearUnivFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-sec hover:bg-card border border-border text-text-h"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUniversities.map((univ) => {
                const status = univ.status || 'active';
                const statusStyles = {
                  active: 'bg-brandGreen/10 text-brandGreen border-brandGreen/20',
                  inactive: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                  archived: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }[status] || 'bg-brandGreen/10 text-brandGreen border-brandGreen/20';

                return (
                  <div
                    key={univ.id}
                    className="p-5 rounded-2xl bg-card border border-border space-y-3 hover:border-accent/40 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-accent/15 text-accent uppercase tracking-wide">
                              {univ.shortName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusStyles}`}>
                              {status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-text-h leading-snug">{univ.name}</h3>
                          <p className="text-xs text-text-light">
                            {univ.city}, {univ.state} • <span className="text-text-h font-medium">{univ.type}</span>
                          </p>
                        </div>
                      </div>

                      {univ.website && (
                        <div className="flex items-center gap-1.5 text-xs text-accent">
                          <Globe className="w-3.5 h-3.5 text-text-light" />
                          <a
                            href={univ.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>{univ.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        </div>
                      )}

                      {univ.description && (
                        <p className="text-xs text-text-light line-clamp-2">
                          {univ.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-text-light">
                        <span className="font-semibold text-text-h">
                          {univ.courses?.length || 0}
                        </span>{' '}
                        <span>Courses Configured</span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {/* View Courses Drilldown */}
                        <button
                          onClick={() => {
                            setSelectedUnivId(univ.id);
                            const u = catalog.universities.find((item) => item.id === univ.id);
                            if (u?.courses?.[0]) setSelectedCourseId(u.courses[0].id);
                            setActiveTab('courses');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
                          title="View Courses in Catalog"
                        >
                          Courses →
                        </button>

                        {/* Edit University */}
                        <button
                          onClick={() => handleOpenEditUniv(univ)}
                          className="p-1.5 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec border border-transparent hover:border-border transition-colors"
                          title="Edit University Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active/Inactive */}
                        <button
                          onClick={() => handleToggleStatus(univ)}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent hover:border-border ${
                            status === 'active'
                              ? 'text-brandGreen hover:bg-brandGreen/10'
                              : 'text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={status === 'active' ? 'Deactivate University' : 'Activate University'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Archive University */}
                        <button
                          onClick={() => handleOpenArchive(univ)}
                          className="p-1.5 rounded-lg text-text-light hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-border transition-colors"
                          title="Archive University"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete University */}
                        <button
                          onClick={() => handleOpenDelete(univ)}
                          className="p-1.5 rounded-lg text-text-light hover:text-brandRed hover:bg-brandRed/10 border border-transparent hover:border-border transition-colors"
                          title="Delete University"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSES & SEMESTERS */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <span>Configured Academic Degrees & Courses</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                  {allCatalogCourses.length} Registered
                </span>
              </h2>
              <p className="text-xs text-text-light mt-0.5">
                Degree programs, standard durations, semester counts, degree credits, and linked regulations.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddCourse()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search by text */}
              <div className="relative">
                <Search className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search course name, code, university..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="calc-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                />
                {courseSearch && (
                  <button
                    onClick={() => setCourseSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* University Scope Filter */}
              <div>
                <select
                  value={selectedUnivId}
                  onChange={(e) => {
                    setSelectedUnivId(e.target.value);
                    if (e.target.value !== 'all') {
                      const u = catalog.universities.find((item) => item.id === e.target.value);
                      if (u?.courses?.[0]) setSelectedCourseId(u.courses[0].id);
                    }
                  }}
                  className="calc-input w-full px-3 py-1.5 rounded-xl text-xs cursor-pointer font-medium"
                >
                  <option value="all">All Universities ({catalog.universities.length})</option>
                  {catalog.universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Level Filter */}
              <div>
                <select
                  value={courseLevelFilter}
                  onChange={(e) => setCourseLevelFilter(e.target.value)}
                  className="calc-input w-full px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  <option value="all">All Degree Levels</option>
                  <option value="UG">UG (Undergraduate)</option>
                  <option value="PG">PG (Postgraduate)</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={courseStatusFilter}
                  onChange={(e) => setCourseStatusFilter(e.target.value)}
                  className="calc-input w-full px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  <option value="all">All Lifecycle States</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="archived">Archived Only</option>
                </select>
              </div>
            </div>

            {/* Filter Summary & Reset */}
            <div className="flex items-center justify-between text-[11px] text-text-light pt-1 border-t border-border/60">
              <span>
                Showing <strong>{filteredCourses.length}</strong> of{' '}
                <strong>{allCatalogCourses.length}</strong> courses{' '}
                {selectedUnivId !== 'all' && (
                  <span className="text-text-h font-medium">
                    (under {catalog.universities.find((u) => u.id === selectedUnivId)?.shortName || selectedUnivId})
                  </span>
                )}
              </span>
              {(hasCourseFilters || selectedUnivId !== 'all') && (
                <button
                  onClick={() => {
                    handleClearCourseFilters();
                    setSelectedUnivId('all');
                  }}
                  className="inline-flex items-center gap-1 text-accent hover:underline font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-h">No courses found</h3>
                <p className="text-xs text-text-light mt-0.5">
                  No courses match your current search, level, or university filter criteria.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                {(hasCourseFilters || selectedUnivId !== 'all') && (
                  <button
                    onClick={() => {
                      handleClearCourseFilters();
                      setSelectedUnivId('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-sec hover:bg-card border border-border text-text-h"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenAddCourse()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Course</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((course) => {
                const status = course.status || 'active';
                const statusStyles = {
                  active: 'bg-brandGreen/10 text-brandGreen border-brandGreen/20',
                  inactive: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                  archived: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }[status] || 'bg-brandGreen/10 text-brandGreen border-brandGreen/20';

                return (
                  <div
                    key={`${course.universityId}-${course.id}`}
                    className="p-5 rounded-2xl bg-card border border-border space-y-3 hover:border-accent/40 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-accent/15 text-accent uppercase tracking-wide">
                              {course.level} • {course.shortName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-bg-sec text-text-light border border-border">
                              {course.universityShortName || course.universityId}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusStyles}`}>
                              {status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-text-h leading-snug">{course.name}</h3>
                        </div>

                        <span className="text-xs font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-xl shrink-0">
                          {course.totalSemesters} Semesters
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-bg border border-border">
                          <span className="text-text-light block text-[10px]">Duration</span>
                          <strong className="text-text-h">{course.durationYears} Years</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-bg border border-border">
                          <span className="text-text-light block text-[10px]">Semesters</span>
                          <strong className="text-text-h">1 to {course.totalSemesters}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-bg border border-border">
                          <span className="text-text-light block text-[10px]">Degree Credits</span>
                          <strong className="text-text-h">{course.totalDegreeCredits || 160} Cr</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-text-light">
                        <span className="font-semibold text-text-h">
                          {course.regulations?.length || 0}
                        </span>{' '}
                        <span>Regulations Configured</span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {/* View Regulations Drilldown */}
                        <button
                          onClick={() => {
                            setSelectedUnivId(course.universityId);
                            setSelectedCourseId(course.id);
                            if (course.regulations?.[0]) setSelectedRegId(course.regulations[0].id);
                            setActiveTab('regulations');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
                          title="View Regulations in Catalog"
                        >
                          Regulations →
                        </button>

                        {/* Edit Course */}
                        <button
                          onClick={() => handleOpenEditCourse(course.universityId, course)}
                          className="p-1.5 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec border border-transparent hover:border-border transition-colors"
                          title="Edit Course Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active/Inactive */}
                        <button
                          onClick={() => handleToggleCourseStatus(course.universityId, course)}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent hover:border-border ${
                            status === 'active'
                              ? 'text-brandGreen hover:bg-brandGreen/10'
                              : 'text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={status === 'active' ? 'Deactivate Course' : 'Activate Course'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Archive Course */}
                        <button
                          onClick={() => handleOpenArchiveCourse(course.universityId, course)}
                          className="p-1.5 rounded-lg text-text-light hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-border transition-colors"
                          title="Archive Course"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Course */}
                        <button
                          onClick={() => handleOpenDeleteCourse(course.universityId, course)}
                          className="p-1.5 rounded-lg text-text-light hover:text-brandRed hover:bg-brandRed/10 border border-transparent hover:border-border transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGULATIONS & RULE VERSIONS */}
      {activeTab === 'regulations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div>
              <label className="text-xs font-bold text-text-h block mb-1">University</label>
              <select
                value={selectedUnivId}
                onChange={(e) => setSelectedUnivId(e.target.value)}
                className="calc-input px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {catalog.universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.shortName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-h block mb-1">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="calc-input px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {selectedUniv?.courses?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto self-end">
              <button
                onClick={() => setIsPublishVersionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition-all"
              >
                <History className="w-4 h-4" />
                <span>Publish New Immutable Rule Version</span>
              </button>
            </div>
          </div>

          {/* Regulation Details */}
          <div className="space-y-3">
            {selectedCourse?.regulations?.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-accent text-white">
                        {reg.code}
                      </span>
                      <h3 className="text-base font-bold text-text-h">{reg.name}</h3>
                    </div>
                    <p className="text-xs text-text-light mt-1">
                      Rule Version Identifier: <code className="text-accent font-mono">{reg.ruleVersion}</code>
                    </p>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-xl bg-brandGreen/10 text-brandGreen border border-brandGreen/20 font-semibold self-start sm:self-auto">
                    Grading: {reg.gradingSystem}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-bg border border-border text-xs space-y-1.5">
                  <p className="text-text-h font-semibold">
                    SGPA Formula: <span className="font-mono text-accent">{reg.calculationRule?.sgpaFormula || 'WEIGHTED_CREDIT_SUM'}</span>
                  </p>
                  <p className="text-text-h font-semibold">
                    CGPA Formula: <span className="font-mono text-brandGreen">{reg.calculationRule?.cgpaFormula || 'CUMULATIVE_WEIGHTED_CREDIT_SUM'}</span>
                  </p>
                  <p className="text-text-light">
                    Percentage Conversion: <span className="font-mono">{reg.calculationRule?.percentageFormula || 'CGPA * 10'}</span>
                  </p>
                  <p className="text-[11px] text-text-light pt-1">
                    Applicable Admission Batches: {reg.effectiveBatches?.join(', ') || 'All active cohorts'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GRADING RULES & PASSING CRITERIA */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          {/* Header & New Grading Scale Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Grading Scales & Passing Criteria Registry</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                  {catalog.gradingScales?.length || 0} Registered
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brandGreen/10 text-brandGreen">
                  {catalog.gradingScales?.filter((s) => s.status !== 'archived').length || 0} Active
                </span>
              </div>
              <p className="text-xs text-text-light mt-0.5">
                Manage institutional grading systems, numeric grade points, percentage boundaries, backlog thresholds, and regulation bindings.
              </p>
            </div>
            <button
              onClick={handleOpenAddScale}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Grading Scale</span>
            </button>
          </div>

          {/* Active Regulation Context Notice */}
          <div className="p-3.5 rounded-xl bg-bg-sec/50 border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-text-h">
                  Active Regulation Context: <span className="text-accent">{selectedUniv?.shortName || selectedUniv?.name}</span> &rsaquo; {selectedCourse?.name} &rsaquo; <span className="font-bold">{selectedReg?.name} ({selectedReg?.code})</span>
                </p>
                <p className="text-text-light text-[11px] mt-0.5">
                  Currently bound to scale: <code className="px-1.5 py-0.5 bg-card rounded border border-border font-mono text-accent font-bold">{selectedReg?.gradingScaleId || 'ugc-10-point'}</code>
                </p>
              </div>
            </div>
            {selectedScaleId !== (selectedReg?.gradingScaleId || 'ugc-10-point') && (
              <button
                onClick={() => setSelectedScaleId(selectedReg?.gradingScaleId || 'ugc-10-point')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 font-bold text-xs transition-colors shrink-0"
              >
                <span>View Bound Scale</span>
              </button>
            )}
          </div>

          {/* Two-Column Management Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Scales Registry List (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-h uppercase tracking-wider">
                    Grading Scales ({filteredGradingScales.length})
                  </span>
                  <div className="text-[11px] text-text-light">
                    {scaleStatusFilter !== 'all' && `Filtered: ${scaleStatusFilter}`}
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <input
                      type="text"
                      placeholder="Search scale name, ID, desc..."
                      value={scaleSearch}
                      onChange={(e) => setScaleSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-bg-sec border border-border rounded-xl text-xs text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
                    />
                    {scaleSearch && (
                      <button
                        onClick={() => setScaleSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-text-light shrink-0" />
                    <select
                      value={scaleStatusFilter}
                      onChange={(e) => setScaleStatusFilter(e.target.value)}
                      className="flex-1 py-1 px-2 bg-bg-sec border border-border rounded-lg text-xs text-text-h focus:outline-none focus:border-accent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="archived">Archived Only</option>
                    </select>
                  </div>
                </div>

                {/* Scales Cards List */}
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {filteredGradingScales.length === 0 ? (
                    <div className="text-center py-8 px-3 rounded-xl border border-dashed border-border text-xs text-text-light">
                      <AlertCircle className="w-6 h-6 mx-auto mb-1 text-text-light opacity-50" />
                      <p>No grading scales match your criteria.</p>
                    </div>
                  ) : (
                    filteredGradingScales.map((scale) => {
                      const isSelected = (selectedGradingScale?.id || '').toLowerCase() === scale.id.toLowerCase();
                      const isArchived = scale.status === 'archived';
                      return (
                        <div
                          key={scale.id}
                          onClick={() => setSelectedScaleId(scale.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-accent/5 border-accent shadow-sm'
                              : 'bg-card border-border hover:border-accent/40 hover:bg-bg-sec/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-accent' : 'text-text-h'}`}>
                                  {scale.name}
                                </h4>
                                {scale.isOfficial && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/20">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Official
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-text-light mt-0.5 truncate">
                                ID: {scale.id}
                              </p>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                isArchived
                                  ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                  : 'bg-brandGreen/10 text-brandGreen border border-brandGreen/20'
                              }`}
                            >
                              {scale.status || 'active'}
                            </span>
                          </div>

                          {scale.description && (
                            <p className="text-[11px] text-text-light line-clamp-2 mt-1.5">
                              {scale.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60 text-[10px]">
                            <span className="font-semibold text-text-light">
                              {scale.grades?.length || 0} Grade Tiers ({scale.system || '10-point'})
                            </span>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEditScale(scale)}
                                title="Edit Scale Metadata"
                                className="p-1 rounded text-text-light hover:text-accent hover:bg-accent/10 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenAssignScale(scale)}
                                title="Assign to Regulation"
                                className="p-1 rounded text-text-light hover:text-accent hover:bg-accent/10 transition-colors"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleScaleStatus(scale)}
                                title={isArchived ? 'Reactivate Scale' : 'Archive Scale'}
                                className={`p-1 rounded transition-colors ${
                                  isArchived
                                    ? 'text-brandGreen hover:bg-brandGreen/10'
                                    : 'text-purple-600 hover:bg-purple-600/10'
                                }`}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteScale(scale)}
                                title="Guarded Delete"
                                className="p-1 rounded text-text-light hover:text-brandRed hover:bg-brandRed/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Selected Scale Details & Grade Entries (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedGradingScale ? (
                <>
                  {/* Selected Scale Header Card */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-text-h">
                            {selectedGradingScale.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-bg-sec border border-border text-text-light">
                            {selectedGradingScale.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                            {selectedGradingScale.system || '10-point system'}
                          </span>
                          {selectedGradingScale.isOfficial && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/20">
                              <ShieldCheck className="w-3 h-3" />
                              Official Standard
                            </span>
                          )}
                        </div>
                        {selectedGradingScale.description && (
                          <p className="text-xs text-text-light mt-1">
                            {selectedGradingScale.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          onClick={handleOpenAddGradeEntry}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-accent transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Grade Tier</span>
                        </button>
                        <button
                          onClick={() => handleOpenAssignScale(selectedGradingScale)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-accent text-text-h font-bold text-xs bg-bg-sec/50 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5 text-accent" />
                          <span>Link to Regulation</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coverage & Integrity Diagnostics Banner */}
                  {scaleValidationResult.errors && scaleValidationResult.errors.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-brandRed/10 border border-brandRed/30 space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-brandRed">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Configuration Errors in this Scale:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-text-h pl-1 text-[11px]">
                        {scaleValidationResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ) : scaleValidationResult.warnings && scaleValidationResult.warnings.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-600">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Coverage Gap Warnings:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-text-h pl-1 text-[11px]">
                        {scaleValidationResult.warnings.map((warn, idx) => (
                          <li key={idx}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-brandGreen/10 border border-brandGreen/30 flex items-center gap-2 text-xs text-brandGreen font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>100% Coverage Verified: Full 0% – 100% marks spectrum covered with zero overlaps or gaps.</span>
                    </div>
                  )}

                  {/* Grade Entries Table Card */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-text-h uppercase tracking-wider">
                          Grade Tiers & Point Values ({filteredScaleGrades.length})
                        </h4>
                        <p className="text-[11px] text-text-light">
                          Letter grades, corresponding grade points, percentage bounds, and pass/fail classification.
                        </p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                        <input
                          type="text"
                          placeholder="Filter grade, desc, points..."
                          value={gradeEntrySearch}
                          onChange={(e) => setGradeEntrySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-bg-sec border border-border rounded-xl text-xs text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
                        />
                        {gradeEntrySearch && (
                          <button
                            onClick={() => setGradeEntrySearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg-sec text-text-light font-bold uppercase text-[10px] tracking-wider border-b border-border">
                          <tr>
                            <th className="py-3 px-4">Grade Symbol</th>
                            <th className="py-3 px-4 text-center">Grade Points</th>
                            <th className="py-3 px-4">Marks Range</th>
                            <th className="py-3 px-4">Qualitative Descriptor</th>
                            <th className="py-3 px-4 text-center">Passing Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredScaleGrades.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-text-light">
                                <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                <p>No grade entries match your filter or scale has no tiers configured.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredScaleGrades.map((g) => (
                              <tr key={g.grade} className="hover:bg-bg-sec/40 transition-colors">
                                <td className="py-3 px-4 font-extrabold text-accent text-sm">
                                  <span className="inline-block px-2.5 py-0.5 rounded-lg bg-accent/10 border border-accent/20">
                                    {g.grade}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-extrabold text-text-h text-sm">
                                  {g.points}
                                </td>
                                <td className="py-3 px-4 text-text-light font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-text-h font-mono">
                                      {g.minPercentage}% - {g.maxPercentage}%
                                    </span>
                                    <div className="w-16 h-1.5 rounded-full bg-bg-sec border border-border overflow-hidden">
                                      <div
                                        className="h-full bg-accent/60"
                                        style={{
                                          marginLeft: `${g.minPercentage}%`,
                                          width: `${Math.max(2, g.maxPercentage - g.minPercentage)}%`
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-medium text-text-h">
                                  {g.desc || '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      g.isPass
                                        ? 'bg-brandGreen/10 text-brandGreen border border-brandGreen/20'
                                        : 'bg-brandPink/10 text-brandPink border border-brandPink/20'
                                    }`}
                                  >
                                    {g.isPass ? 'Pass' : 'Fail (Backlog)'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditGradeEntry(g)}
                                      title="Edit Grade Tier"
                                      className="p-1 rounded text-text-light hover:text-accent hover:bg-accent/10 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteGradeEntry(g.grade)}
                                      title="Delete Grade Tier"
                                      className="p-1 rounded text-text-light hover:text-brandRed hover:bg-brandRed/10 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-card border border-border text-center text-text-light">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-accent" />
                  <p className="font-bold text-text-h">No Grading Scale Selected</p>
                  <p className="text-xs mt-1">Select a grading scale from the left panel or create a new one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CURRICULUMS & SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {/* Header & Add Subject Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <span>Curriculum Subjects & Credit Allocation</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                  {currentSemesterSubjects.length} Registered
                </span>
              </h2>
              <p className="text-xs text-text-light mt-0.5">
                Configure semester course rosters, default credits, theory/practical categories, and marks benchmarks.
              </p>
            </div>
            <button
              onClick={handleOpenAddSubject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Cascading Hierarchy Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div>
              <label className="text-xs font-bold text-text-h block mb-1">1. University</label>
              <select
                value={selectedUnivId}
                onChange={(e) => handleSelectUniv(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {catalog.universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.shortName} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-h block mb-1">2. Course / Degree</label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {(selectedUniv?.courses || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName} ({c.level || 'UG'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-h block mb-1">3. Regulation</label>
              <select
                value={selectedRegId}
                onChange={(e) => handleSelectReg(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {(selectedCourse?.regulations || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} ({r.ruleVersion || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-h block mb-1">4. Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {Array.from({ length: selectedCourse?.totalSemesters || 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context Banner & Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-semibold text-text-light block">Semester Scope</span>
              <span className="text-xs font-bold text-text-h mt-0.5 truncate block">
                {selectedUniv?.shortName} • Sem {selectedSemester}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-semibold text-text-light block">Total Subjects</span>
              <span className="text-base font-extrabold text-text-h mt-0.5 block">
                {currentSemesterSubjects.length}
                <span className="text-[11px] font-normal text-text-light ml-1.5">
                  ({currentSemesterSubjects.filter((s) => s.status !== 'archived').length} active)
                </span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-semibold text-text-light block">Semester Credits Total</span>
              <span className="text-base font-extrabold text-accent mt-0.5 block">
                {semesterTotalCredits}
                <span className="text-[11px] font-normal text-text-light ml-1.5">Credits</span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-semibold text-text-light block">Regulation Rule</span>
              <span className="text-xs font-bold text-text-h mt-0.5 truncate block">
                {selectedReg?.code || 'Standard'} • {selectedReg?.gradingSystem || '10-point'}
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-card border border-border">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-text-light absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subjects by code or title..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="calc-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
              />
            </div>

            <select
              value={subjectTypeFilter}
              onChange={(e) => setSubjectTypeFilter(e.target.value)}
              className="calc-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="all">All Course Types</option>
              <option value="Theory">Theory</option>
              <option value="Practical">Practical / Lab</option>
              <option value="Project">Project / Thesis</option>
              <option value="Professional Elective">Professional Elective</option>
              <option value="Open Elective">Open Elective</option>
              <option value="Core Course">Core Course</option>
              <option value="Audit">Audit Course</option>
            </select>

            <select
              value={subjectStatusFilter}
              onChange={(e) => setSubjectStatusFilter(e.target.value)}
              className="calc-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="archived">Archived Only</option>
            </select>

            {hasSubjectFilters && (
              <button
                onClick={handleClearSubjectFilters}
                className="text-xs text-accent hover:underline font-semibold px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Subjects Table / List */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-sec text-text-light font-bold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center">Marks (Pass / Max)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSemesterSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-light">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Layers className="w-8 h-8 text-text-light/40" />
                        <p className="font-semibold text-text-h text-sm">No subjects found</p>
                        <p className="text-xs max-w-sm">
                          {hasSubjectFilters
                            ? 'No subjects match your current search/filters. Try clearing your filters.'
                            : `No curriculum subjects have been configured for Semester ${selectedSemester}. Click "+ Add Subject" to start building this semester.`}
                        </p>
                        {hasSubjectFilters ? (
                          <button
                            onClick={handleClearSubjectFilters}
                            className="mt-2 text-xs font-bold text-accent hover:underline"
                          >
                            Clear Filters
                          </button>
                        ) : (
                          <button
                            onClick={handleOpenAddSubject}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-bold text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Subject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSemesterSubjects.map((sub, idx) => {
                    const isArchived = sub.status === 'archived';
                    const isInactive = sub.status === 'inactive';
                    const creditsVal = sub.defaultCredits !== undefined ? sub.defaultCredits : (sub.credits || 4);

                    return (
                      <tr
                        key={sub.code || idx}
                        className={`hover:bg-bg-sec/40 transition-colors ${
                          isArchived ? 'opacity-60 bg-bg-sec/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-accent whitespace-nowrap">
                          {sub.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-text-h block">{sub.name}</span>
                          <span className="text-[10px] text-text-light block mt-0.5">
                            {selectedCourse?.shortName} • Sem {selectedSemester}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              (sub.type || '').toLowerCase().includes('lab') || (sub.type || '').toLowerCase().includes('practical')
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : (sub.type || '').toLowerCase().includes('project')
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                : (sub.type || '').toLowerCase().includes('elective')
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {sub.type || 'Theory'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent font-extrabold text-xs">
                            {creditsVal}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-text-light">
                          {sub.maxMarks ? (
                            <span className="font-semibold text-text-h">
                              {sub.passMarks || 40} / {sub.maxMarks}
                            </span>
                          ) : (
                            <span>100 Max</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isArchived ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Archived
                            </span>
                          ) : isInactive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Inactive
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/20">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditSubject(sub)}
                              title="Edit Subject"
                              className="p-1.5 rounded-lg text-text-light hover:text-accent hover:bg-accent/10 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleSubjectStatus(sub)}
                              title={isInactive ? 'Activate Subject' : 'Deactivate Subject'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isInactive
                                  ? 'text-brandGreen hover:bg-brandGreen/10'
                                  : 'text-text-light hover:text-amber-500 hover:bg-amber-500/10'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenArchiveSubject(sub)}
                              title="Archive Subject (Safe)"
                              className="p-1.5 rounded-lg text-text-light hover:text-purple-500 hover:bg-purple-500/10 transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteSubject(sub)}
                              title="Delete Subject"
                              className="p-1.5 rounded-lg text-text-light hover:text-brandRed hover:bg-brandRed/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CALCULATION RULES (PHASE 2E) */}
      {activeTab === 'calculations' && (
        <div className="space-y-4">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <span>Calculation Rules & Percentage Formulas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                  {catalog.calculationRules?.length || 0} Registered
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brandGreen/10 text-brandGreen">
                  {(catalog.calculationRules || []).filter((r) => r.status !== 'archived').length} Active
                </span>
              </h2>
              <p className="text-xs text-text-light mt-0.5">
                Declarative, audited formulas for SGPA, CGPA, and Percentage Conversion. Securely executed without eval.
              </p>
            </div>
            <button
              onClick={handleOpenAddRule}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-accent"
            >
              <Plus className="w-4 h-4" />
              <span>Add Calculation Rule</span>
            </button>
          </div>

          {/* Active Regulation Context Banner */}
          {selectedReg && (
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-h">
                      Active Hierarchy: {selectedUniv?.shortName} • {selectedCourse?.shortName} • {selectedReg?.name} ({selectedReg?.code})
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-bg-sec border border-border text-text-h">
                      Rule Version: {selectedReg?.ruleVersion || 'Standard'}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-light mt-0.5 flex items-center gap-2">
                    <span>
                      Formula:{' '}
                      <strong className="text-accent font-mono">
                        {selectedReg?.percentageFormula || selectedReg?.calculationRule?.percentageFormula || '(CGPA - 0.5) * 10'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Bound Rule:{' '}
                      <strong className="text-text-h font-mono">
                        {selectedReg?.calculationRuleId || 'System Default'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {selectedCalculationRule && (
                <button
                  type="button"
                  onClick={() => {
                    const match = (catalog.calculationRules || []).find(
                      (r) =>
                        r.id === selectedReg.calculationRuleId ||
                        r.percentageFormula === (selectedReg.percentageFormula || selectedReg?.calculationRule?.percentageFormula)
                    );
                    if (match) setSelectedRuleId(match.id);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h transition-colors whitespace-nowrap"
                >
                  Inspect Bound Rule
                </button>
              )}
            </div>
          )}

          {/* Main 2-Column Split: Rule List (Left) and Rule Detail / Simulator (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Rule Selector & Filters (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Filter controls */}
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type="text"
                    placeholder="Search rules by name, ID, or formula..."
                    value={calcRuleSearch}
                    onChange={(e) => setCalcRuleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  />
                  {calcRuleSearch && (
                    <button
                      onClick={() => setCalcRuleSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-text-light font-semibold mb-0.5">Status</label>
                    <select
                      value={calcRuleStatusFilter}
                      onChange={(e) => setCalcRuleStatusFilter(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-bg-sec border border-border text-text-h focus:outline-none focus:border-accent"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-0.5">Type</label>
                    <select
                      value={calcRuleTypeFilter}
                      onChange={(e) => setCalcRuleTypeFilter(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-bg-sec border border-border text-text-h focus:outline-none focus:border-accent"
                    >
                      <option value="all">All Types</option>
                      <option value="percentage">Percentage</option>
                      <option value="sgpa">SGPA</option>
                      <option value="cgpa">CGPA</option>
                      <option value="composite">Composite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-text-light font-semibold mb-0.5">Scope</label>
                    <select
                      value={calcRuleUnivFilter}
                      onChange={(e) => setCalcRuleUnivFilter(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-bg-sec border border-border text-text-h focus:outline-none focus:border-accent"
                    >
                      <option value="all">All Scopes</option>
                      <option value="global">Global Rules</option>
                      {catalog.universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.shortName || u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredCalculationRules.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-card border border-border text-text-light text-xs">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-text-light" />
                    No calculation rules match your filters.
                  </div>
                ) : (
                  filteredCalculationRules.map((rule) => {
                    const isSelected = selectedCalculationRule?.id === rule.id;
                    const isArchived = rule.status === 'archived';
                    const univMatch = catalog.universities.find((u) => u.id === rule.universityId);

                    return (
                      <div
                        key={rule.id}
                        onClick={() => setSelectedRuleId(rule.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-accent/5 border-accent shadow-xs'
                            : 'bg-card border-border hover:border-text-light/30'
                        } ${isArchived ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-text-h">{rule.name}</span>
                              {rule.isOfficial && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/20">
                                  <ShieldCheck className="w-3 h-3" />
                                  Official
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isArchived
                                    ? 'bg-brandOrange/10 text-brandOrange border border-brandOrange/20'
                                    : 'bg-brandGreen/10 text-brandGreen border border-brandGreen/20'
                                }`}
                              >
                                {isArchived ? 'Archived' : 'Active'}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-text-light block mt-0.5">
                              ID: {rule.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Assign to Regulation"
                              onClick={() => handleOpenAssignRule(rule)}
                              className="p-1 rounded-lg hover:bg-bg-sec text-text-light hover:text-accent transition-colors"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Edit Rule"
                              onClick={() => handleOpenEditRule(rule)}
                              className="p-1 rounded-lg hover:bg-bg-sec text-text-light hover:text-text-h transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title={isArchived ? 'Reactivate Rule' : 'Archive Rule'}
                              onClick={() => (isArchived ? handleToggleRuleStatus(rule) : handleOpenArchiveRule(rule))}
                              className={`p-1 rounded-lg hover:bg-bg-sec transition-colors ${
                                isArchived ? 'text-brandGreen' : 'text-text-light hover:text-brandOrange'
                              }`}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Rule"
                              onClick={() => handleOpenDeleteRule(rule)}
                              className="p-1 rounded-lg hover:bg-bg-sec text-text-light hover:text-brandRed transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Formula snippet pill */}
                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono px-2 py-0.5 rounded-md bg-bg-sec border border-border text-accent font-bold">
                            {rule.percentageFormula || rule.formulaDescription || 'Standard Formula'}
                          </span>
                          <span className="text-text-light text-[10px]">
                            {univMatch ? univMatch.shortName : 'Universal Scope'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Rule Inspector, Declarative Formula & Live Simulator (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedCalculationRule ? (
                <>
                  {/* Rule Header Card */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-text-h">{selectedCalculationRule.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedCalculationRule.status === 'archived'
                                ? 'bg-brandOrange/10 text-brandOrange border border-brandOrange/20'
                                : 'bg-brandGreen/10 text-brandGreen border border-brandGreen/20'
                            }`}
                          >
                            {selectedCalculationRule.status === 'archived' ? 'Archived Rule' : 'Active Rule'}
                          </span>
                          {selectedCalculationRule.isOfficial && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/20 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Official
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-text-light block mt-0.5">
                          Unique Rule ID: {selectedCalculationRule.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAssignRule(selectedCalculationRule)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Assign Rule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRule(selectedCalculationRule)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-bg-sec text-text-h text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    {selectedCalculationRule.description && (
                      <p className="text-xs text-text-light leading-relaxed">
                        {selectedCalculationRule.description}
                      </p>
                    )}
                  </div>

                  {/* Mathematical & Declarative Parameters Card */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
                    <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                      <Percent className="w-4 h-4 text-accent" />
                      <span>Mathematical Specification & Formula</span>
                    </h4>

                    {/* Formula Display Box */}
                    <div className="p-3.5 rounded-xl bg-bg-sec border border-border flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-text-light block uppercase tracking-wider">
                          Percentage Conversion Formula
                        </span>
                        <span className="text-base font-extrabold font-mono text-accent">
                          {selectedCalculationRule.percentageFormula || '(CGPA - 0.5) * 10'}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-card border border-border text-text-h">
                        Type: {selectedCalculationRule.ruleType || 'percentage'}
                      </span>
                    </div>

                    {/* Parameters Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-bg-sec border border-border">
                        <span className="text-[11px] text-text-light block">Decimal Precision</span>
                        <span className="font-bold text-text-h text-sm">
                          {selectedCalculationRule.decimalPrecision ?? 2} Decimals
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-sec border border-border">
                        <span className="text-[11px] text-text-light block">Rounding Mode</span>
                        <span className="font-bold text-text-h text-sm capitalize">
                          {selectedCalculationRule.roundingMode || 'round'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-sec border border-border">
                        <span className="text-[11px] text-text-light block">Min Passing GP</span>
                        <span className="font-bold text-text-h text-sm">
                          {selectedCalculationRule.minPassingGradePoints ?? 5.0} Points
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-sec border border-border">
                        <span className="text-[11px] text-text-light block">Applicability Scope</span>
                        <span className="font-bold text-text-h text-sm truncate block">
                          {selectedCalculationRule.universityId
                            ? catalog.universities.find((u) => u.id === selectedCalculationRule.universityId)?.shortName || selectedCalculationRule.universityId
                            : 'Universal / Global'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-bg-sec/50 border border-border/80 text-[11px] text-text-light space-y-1">
                      <div className="flex items-center justify-between">
                        <span>SGPA Weighted Model:</span>
                        <strong className="text-text-h font-mono">{selectedCalculationRule.sgpaFormula || 'WEIGHTED_CREDIT_SUM'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CGPA Cumulative Model:</span>
                        <strong className="text-text-h font-mono">{selectedCalculationRule.cgpaFormula || 'CUMULATIVE_WEIGHTED_CREDIT_SUM'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Backlog Inclusion in Credits:</span>
                        <strong className="text-text-h">{selectedCalculationRule.includeBacklogsInCredits ? 'Yes' : 'No (Passed Credits Only)'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Declarative Simulator Sandbox */}
                  <div className="p-4 rounded-2xl bg-card border border-accent/30 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                        <Play className="w-4 h-4 text-accent" />
                        <span>Interactive Formula Simulator Sandbox</span>
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-accent/10 text-accent font-semibold">
                        Pure Declarative
                      </span>
                    </div>
                    <p className="text-xs text-text-light">
                      Simulate how this rule converts student CGPA to final degree percentage according to official precision and rounding policies.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-text-h">Test Input CGPA:</label>
                          <span className="font-mono font-bold text-accent text-sm">{simulatorCgpa.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="10.0"
                          step="0.05"
                          value={simulatorCgpa}
                          onChange={(e) => setSimulatorCgpa(parseFloat(e.target.value))}
                          className="w-full accent-accent cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-text-light font-mono">
                          <span>0.00</span>
                          <span>5.00 (Pass threshold)</span>
                          <span>10.00</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider">
                          Evaluated Percentage Result
                        </span>
                        <div className="text-3xl font-black text-accent font-mono my-1">
                          {simulatorResult !== null ? `${simulatorResult}%` : 'N/A'}
                        </div>
                        <span className="text-[10px] text-text-light font-mono">
                          Rule: {selectedCalculationRule.percentageFormula} • Mode: {selectedCalculationRule.roundingMode || 'round'} ({selectedCalculationRule.decimalPrecision ?? 2} dec)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Regulation References / Linkage Info */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-text-light" />
                      <span>Associated Regulations & References</span>
                    </h4>
                    {(() => {
                      const refCheck = academicCatalogService.checkCalculationRuleReferences(selectedCalculationRule.id);
                      if (!refCheck.hasReferences) {
                        return (
                          <div className="p-3 rounded-xl bg-bg-sec text-text-light text-xs flex items-center justify-between">
                            <span>No regulations currently bound to this rule. This rule can be safely edited or deleted.</span>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignRule(selectedCalculationRule)}
                              className="text-accent hover:underline font-semibold text-xs shrink-0 ml-2"
                            >
                              Assign to Regulation
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          <div className="text-xs text-text-light flex items-center gap-2">
                            <span className="font-semibold text-text-h">{refCheck.regulations.length} Regulation(s)</span>
                            <span>and</span>
                            <span className="font-semibold text-text-h">{refCheck.resultsCount} Historical Calculation Record(s)</span>
                            <span>depend on this rule.</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {refCheck.regulations.map((reg, idx) => (
                              <div
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-bg-sec border border-border text-xs flex items-center gap-2"
                              >
                                <span className="font-bold text-text-h">{reg.universityShortName || reg.universityId}</span>
                                <span className="text-text-light">•</span>
                                <span className="text-text-h">{reg.courseShortName || reg.courseId}</span>
                                <span className="text-text-light">•</span>
                                <span className="font-mono text-accent">{reg.regulationCode || reg.regulationName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-card border border-border text-text-light text-xs">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-text-light" />
                  Select a calculation rule from the left panel to inspect its formulas, parameters, and interactive simulator.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD UNIVERSITY */}
      {isAddUnivOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                <span>Add Institutional Catalog</span>
              </h2>
              <button
                onClick={() => setIsAddUnivOpen(false)}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addUnivError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{addUnivError}</span>
              </div>
            )}

            <form onSubmit={handleAddUniversity} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">
                  University Full Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Osmania University"
                  value={newUniv.name}
                  onChange={(e) => setNewUniv({ ...newUniv, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Short Name / Acronym <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OU"
                    value={newUniv.shortName}
                    onChange={(e) => setNewUniv({ ...newUniv, shortName: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Institution Type</label>
                  <select
                    value={newUniv.type}
                    onChange={(e) => setNewUniv({ ...newUniv, type: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="State Public University">State Public University</option>
                    <option value="Central University">Central University</option>
                    <option value="Deemed University">Deemed University</option>
                    <option value="Autonomous Institute">Autonomous Institute</option>
                    <option value="State University">State University</option>
                    <option value="Private University">Private University</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={newUniv.city}
                    onChange={(e) => setNewUniv({ ...newUniv, city: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={newUniv.state}
                    onChange={(e) => setNewUniv({ ...newUniv, state: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Official Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.osmania.ac.in"
                    value={newUniv.website}
                    onChange={(e) => setNewUniv({ ...newUniv, website: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Initial Status</label>
                  <select
                    value={newUniv.status}
                    onChange={(e) => setNewUniv({ ...newUniv, status: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional institution background or notes..."
                  value={newUniv.description}
                  onChange={(e) => setNewUniv({ ...newUniv, description: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddUnivOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save University
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT UNIVERSITY */}
      {isEditUnivOpen && editingUniv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                <span>Edit University: {editingUniv.shortName}</span>
              </h2>
              <button
                onClick={() => {
                  setIsEditUnivOpen(false);
                  setEditingUniv(null);
                }}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editUnivError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editUnivError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUniversity} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">
                  University Full Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  value={editingUniv.name}
                  onChange={(e) => setEditingUniv({ ...editingUniv, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Short Name / Acronym <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingUniv.shortName}
                    onChange={(e) => setEditingUniv({ ...editingUniv, shortName: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Institution Type</label>
                  <select
                    value={editingUniv.type}
                    onChange={(e) => setEditingUniv({ ...editingUniv, type: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="State Public University">State Public University</option>
                    <option value="Central University">Central University</option>
                    <option value="Deemed University">Deemed University</option>
                    <option value="Autonomous Institute">Autonomous Institute</option>
                    <option value="State University">State University</option>
                    <option value="Private University">Private University</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={editingUniv.city}
                    onChange={(e) => setEditingUniv({ ...editingUniv, city: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={editingUniv.state}
                    onChange={(e) => setEditingUniv({ ...editingUniv, state: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Official Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.osmania.ac.in"
                    value={editingUniv.website}
                    onChange={(e) => setEditingUniv({ ...editingUniv, website: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Lifecycle Status</label>
                  <select
                    value={editingUniv.status}
                    onChange={(e) => setEditingUniv({ ...editingUniv, status: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={editingUniv.description}
                  onChange={(e) => setEditingUniv({ ...editingUniv, description: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditUnivOpen(false);
                    setEditingUniv(null);
                  }}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMATION DIALOG (ARCHIVE / DELETE) */}
      {confirmModal.isOpen && confirmModal.univ && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            {confirmModal.type === 'archive' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-h">Archive Institutional Catalog?</h3>
                    <p className="text-xs text-text-light">
                      Non-destructive archival preserves historical student data.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bg border border-border text-xs text-text-light space-y-2">
                  <p>
                    Are you sure you want to archive <strong>{confirmModal.univ.name}</strong> ({confirmModal.univ.shortName})?
                  </p>
                  <p className="text-[11px] text-text-m">
                    • All configured courses, regulations, and student historical results will remain completely intact.
                  </p>
                  <p className="text-[11px] text-text-m">
                    • The institution will be marked as archived across administrative views.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setConfirmModal({ isOpen: false, type: '', univ: null, refCheck: null })}
                    className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmArchive}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                  >
                    Confirm Archive
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Deletion Check */}
                {!confirmModal.refCheck?.canDelete ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Cannot Delete University</h3>
                        <p className="text-xs text-text-light">
                          Active academic references prevent permanent deletion.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 text-text-h">
                      <p className="font-semibold text-amber-500">
                        "{confirmModal.univ.name}" has existing references:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-text-light text-[11px]">
                        {confirmModal.refCheck?.reasons?.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      <div className="pt-1 text-[11px] text-text-light">
                        Permanent deletion would corrupt student GPA calculations, education records, and curriculum definitions.
                        We recommend archiving this university instead.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setConfirmModal({ isOpen: false, type: '', univ: null, refCheck: null })}
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={handleConfirmArchive}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive University Instead</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brandRed/15 text-brandRed flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Permanently Delete?</h3>
                        <p className="text-xs text-text-light">
                          This institution has no courses or student records.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-text-light">
                      Are you sure you want to delete <strong>{confirmModal.univ.name}</strong>?
                      This action will remove the record from the catalog and cannot be undone.
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setConfirmModal({ isOpen: false, type: '', univ: null, refCheck: null })}
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        className="px-4 py-2 rounded-xl bg-brandRed hover:bg-brandRed/90 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        Permanently Delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD COURSE */}
      {isAddCourseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <span>Add Academic Course</span>
              </h2>
              <button
                onClick={() => setIsAddCourseOpen(false)}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addCourseError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{addCourseError}</span>
              </div>
            )}

            <form onSubmit={handleAddCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Parent University <span className="text-brandRed">*</span>
                </label>
                <select
                  value={newCourse.univId || selectedUnivId}
                  onChange={(e) => setNewCourse({ ...newCourse, univId: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  required
                >
                  {catalog.universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Course Full Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech - Computer Science & Engineering"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Short Code / Acronym <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={newCourse.shortName}
                    onChange={(e) => setNewCourse({ ...newCourse, shortName: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Degree Level</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="UG">UG (Undergraduate)</option>
                    <option value="PG">PG (Postgraduate)</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Duration (Yrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.durationYears}
                    onChange={(e) => setNewCourse({ ...newCourse, durationYears: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newCourse.totalSemesters}
                    onChange={(e) => setNewCourse({ ...newCourse, totalSemesters: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-bold text-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Total Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="400"
                    value={newCourse.totalDegreeCredits}
                    onChange={(e) => setNewCourse({ ...newCourse, totalDegreeCredits: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Initial Status</label>
                <select
                  value={newCourse.status}
                  onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddCourseOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COURSE */}
      {isEditCourseOpen && editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                <span>Edit Course: {editingCourse.shortName}</span>
              </h2>
              <button
                onClick={() => {
                  setIsEditCourseOpen(false);
                  setEditingCourse(null);
                }}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editCourseError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editCourseError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">Parent Institution</label>
                <div className="calc-input w-full px-3 py-2 rounded-xl bg-bg border border-border text-text-light font-medium cursor-not-allowed">
                  {catalog.universities.find((u) => u.id === editingCourse.univId)?.name || editingCourse.univId}
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Course Full Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Short Code / Acronym <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCourse.shortName}
                    onChange={(e) => setEditingCourse({ ...editingCourse, shortName: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Degree Level</label>
                  <select
                    value={editingCourse.level}
                    onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="UG">UG (Undergraduate)</option>
                    <option value="PG">PG (Postgraduate)</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Duration (Yrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editingCourse.durationYears}
                    onChange={(e) => setEditingCourse({ ...editingCourse, durationYears: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editingCourse.totalSemesters}
                    onChange={(e) => setEditingCourse({ ...editingCourse, totalSemesters: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-bold text-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Total Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="400"
                    value={editingCourse.totalDegreeCredits}
                    onChange={(e) => setEditingCourse({ ...editingCourse, totalDegreeCredits: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Lifecycle Status</label>
                <select
                  value={editingCourse.status}
                  onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCourseOpen(false);
                    setEditingCourse(null);
                  }}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COURSE CONFIRMATION DIALOG (ARCHIVE / DELETE) */}
      {courseConfirmModal.isOpen && courseConfirmModal.course && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            {courseConfirmModal.type === 'archive' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-h">Archive Academic Course?</h3>
                    <p className="text-xs text-text-light">
                      Non-destructive archival preserves historical student degrees and results.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bg border border-border text-xs text-text-light space-y-2">
                  <p>
                    Are you sure you want to archive <strong>{courseConfirmModal.course.name}</strong> ({courseConfirmModal.course.shortName})?
                  </p>
                  <p className="text-[11px] text-text-m">
                    • All configured regulations, curriculums, and student historical calculation results will remain completely intact.
                  </p>
                  <p className="text-[11px] text-text-m">
                    • The course will be marked as archived across administrative views.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() =>
                      setCourseConfirmModal({ isOpen: false, type: '', univId: '', course: null, refCheck: null })
                    }
                    className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmArchiveCourse}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                  >
                    Confirm Archive
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Deletion Check */}
                {!courseConfirmModal.refCheck?.canDelete ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Cannot Delete Course</h3>
                        <p className="text-xs text-text-light">
                          Active academic references prevent permanent deletion.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 text-text-h">
                      <p className="font-semibold text-amber-500">
                        "{courseConfirmModal.course.name}" has existing references:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-text-light text-[11px]">
                        {courseConfirmModal.refCheck?.reasons?.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      <div className="pt-1 text-[11px] text-text-light">
                        Permanent deletion would corrupt student GPA calculations, education timelines, and curriculum definitions.
                        We recommend archiving this course instead.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() =>
                          setCourseConfirmModal({ isOpen: false, type: '', univId: '', course: null, refCheck: null })
                        }
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={handleConfirmArchiveCourse}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive Course Instead</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brandRed/15 text-brandRed flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Permanently Delete?</h3>
                        <p className="text-xs text-text-light">
                          This course has no regulations or student records.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-text-light">
                      Are you sure you want to delete <strong>{courseConfirmModal.course.name}</strong>?
                      This action will remove the record from the catalog and cannot be undone.
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() =>
                          setCourseConfirmModal({ isOpen: false, type: '', univId: '', course: null, refCheck: null })
                        }
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDeleteCourse}
                        className="px-4 py-2 rounded-xl bg-brandRed hover:bg-brandRed/90 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        Permanently Delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH IMMUTABLE RULE VERSION */}
      {isPublishVersionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            <h2 className="text-base font-bold text-text-h">Publish New Rule Version</h2>
            <p className="text-xs text-text-light">
              This creates an immutable regulation version for <strong>{selectedReg?.name}</strong>. Historical student results linked to previous versions will remain untouched.
            </p>

            <form onSubmit={handlePublishVersion} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">Rule Version ID</label>
                <input
                  type="text"
                  placeholder="e.g. JNTUH_R18_V2_2026"
                  value={newRuleVersion.ruleVersion}
                  onChange={(e) => setNewRuleVersion({ ...newRuleVersion, ruleVersion: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Formula Change Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Revised percentage conversion formula to (CGPA - 0.75) * 10 for 2026+ admissions."
                  value={newRuleVersion.formulaDescription}
                  onChange={(e) => setNewRuleVersion({ ...newRuleVersion, formulaDescription: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishVersionOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Publish Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBJECT */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                <span>Add Subject to Curriculum</span>
              </h2>
              <button
                onClick={() => setIsAddSubjectOpen(false)}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs space-y-1">
              <span className="font-bold text-accent block uppercase text-[10px] tracking-wider">Target Scope</span>
              <p className="text-text-h font-medium">
                {selectedUniv?.shortName} • {selectedCourse?.name}
              </p>
              <p className="text-text-light">
                Regulation: <strong>{selectedReg?.code}</strong> • Semester: <strong>Semester {selectedSemester}</strong>
              </p>
            </div>

            {addSubjectError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{addSubjectError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Subject Code <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS501 or MA101BS"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Default Credits <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    placeholder="e.g. 4 or 1.5"
                    value={newSubject.defaultCredits}
                    onChange={(e) => setNewSubject({ ...newSubject, defaultCredits: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-bold text-accent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Subject Title / Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Formal Languages & Automata Theory"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Course Type / Category</label>
                  <select
                    value={newSubject.type}
                    onChange={(e) => setNewSubject({ ...newSubject, type: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical / Lab</option>
                    <option value="Project">Project / Thesis</option>
                    <option value="Professional Elective">Professional Elective</option>
                    <option value="Open Elective">Open Elective</option>
                    <option value="Core Course">Core Course</option>
                    <option value="Audit">Audit Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Initial Status</label>
                  <select
                    value={newSubject.status}
                    onChange={(e) => setNewSubject({ ...newSubject, status: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Maximum Marks (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={newSubject.maxMarks}
                    onChange={(e) => setNewSubject({ ...newSubject, maxMarks: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Passing Marks (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={newSubject.passMarks}
                    onChange={(e) => setNewSubject({ ...newSubject, passMarks: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUBJECT */}
      {isEditSubjectOpen && editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                <span>Edit Subject: {editingSubject.originalCode}</span>
              </h2>
              <button
                onClick={() => {
                  setIsEditSubjectOpen(false);
                  setEditingSubject(null);
                }}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs space-y-1">
              <span className="font-bold text-accent block uppercase text-[10px] tracking-wider">Target Scope</span>
              <p className="text-text-h font-medium">
                {selectedUniv?.shortName} • {selectedCourse?.name}
              </p>
              <p className="text-text-light">
                Regulation: <strong>{selectedReg?.code}</strong> • Semester: <strong>Semester {selectedSemester}</strong>
              </p>
            </div>

            {editSubjectError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editSubjectError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditSubject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Subject Code <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSubject.code}
                    onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Default Credits <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={editingSubject.defaultCredits}
                    onChange={(e) => setEditingSubject({ ...editingSubject, defaultCredits: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-bold text-accent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Subject Title / Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Course Type / Category</label>
                  <select
                    value={editingSubject.type}
                    onChange={(e) => setEditingSubject({ ...editingSubject, type: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical / Lab</option>
                    <option value="Project">Project / Thesis</option>
                    <option value="Professional Elective">Professional Elective</option>
                    <option value="Open Elective">Open Elective</option>
                    <option value="Core Course">Core Course</option>
                    <option value="Audit">Audit Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Lifecycle Status</label>
                  <select
                    value={editingSubject.status}
                    onChange={(e) => setEditingSubject({ ...editingSubject, status: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Maximum Marks (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={editingSubject.maxMarks}
                    onChange={(e) => setEditingSubject({ ...editingSubject, maxMarks: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-text-h font-semibold mb-1">Passing Marks (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={editingSubject.passMarks}
                    onChange={(e) => setEditingSubject({ ...editingSubject, passMarks: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSubjectOpen(false);
                    setEditingSubject(null);
                  }}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBJECT CONFIRMATION (ARCHIVE / GUARDED DELETE) */}
      {subjectConfirmModal.isOpen && subjectConfirmModal.subject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            {subjectConfirmModal.type === 'archive' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-h">Archive Subject?</h3>
                    <p className="text-xs text-text-light">
                      {subjectConfirmModal.subject.name} ({subjectConfirmModal.subject.code})
                    </p>
                  </div>
                </div>

                <p className="text-xs text-text-light leading-relaxed">
                  Archiving this subject will hide it from new registrations and semester enrollments, but{' '}
                  <strong className="text-text-h">
                    all existing student grade cards, transcripts, and backlog records will be 100% preserved.
                  </strong>
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() =>
                      setSubjectConfirmModal({ isOpen: false, type: '', subject: null, refCheck: null })
                    }
                    className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmArchiveSubject}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Confirm Archive</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!subjectConfirmModal.refCheck?.canDelete ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Deletion Blocked</h3>
                        <p className="text-xs text-amber-500 font-semibold">
                          Historical Student References Detected
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-text-h space-y-2">
                      <p className="font-medium">
                        Subject <strong>{subjectConfirmModal.subject.name}</strong> ({subjectConfirmModal.subject.code}) cannot be permanently deleted because it is referenced by:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-text-light pl-1">
                        {subjectConfirmModal.refCheck?.reasons.map((r, i) => (
                          <li key={i} className="font-semibold text-amber-600 dark:text-amber-400">
                            {r}
                          </li>
                        ))}
                      </ul>
                      <p className="text-text-light text-[11px] pt-1">
                        Deleting this subject would corrupt historical GPA calculations and student transcripts. We recommend archiving instead.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() =>
                          setSubjectConfirmModal({ isOpen: false, type: '', subject: null, refCheck: null })
                        }
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={handleConfirmArchiveSubject}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive Subject Instead</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brandRed/15 text-brandRed flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Permanently Delete Subject?</h3>
                        <p className="text-xs text-text-light">
                          No student references or backlog entries exist.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-text-light">
                      Are you sure you want to delete <strong>{subjectConfirmModal.subject.name}</strong> ({subjectConfirmModal.subject.code})?
                      This will remove the course from Semester {selectedSemester} curriculum and cannot be undone.
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() =>
                          setSubjectConfirmModal({ isOpen: false, type: '', subject: null, refCheck: null })
                        }
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDeleteSubject}
                        className="px-4 py-2 rounded-xl bg-brandRed hover:bg-brandRed/90 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        Permanently Delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD GRADING SCALE                                */}
      {/* ======================================================== */}
      {isAddScaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-h">Add New Grading Scale</h3>
                  <p className="text-xs text-text-light">Define a standardized institutional grading schema.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddScaleOpen(false)}
                className="p-1 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addScaleError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/30 text-xs text-brandRed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addScaleError}</span>
              </div>
            )}

            <form onSubmit={handleAddScale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Scale ID <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jntuh-r22-10-point"
                    value={newScale.id}
                    onChange={(e) => setNewScale({ ...newScale, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent font-mono"
                  />
                  <p className="text-[10px] text-text-light mt-1">Unique slug identifier.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    System Type
                  </label>
                  <select
                    value={newScale.system}
                    onChange={(e) => setNewScale({ ...newScale, system: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="10-point">10-Point Scale (CBCS Standard)</option>
                    <option value="4-point">4-Point Scale (US/GPA)</option>
                    <option value="percentage">Percentage-Based System</option>
                    <option value="letter">Letter Grades Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">
                  Scale Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JNTUH CBCS 10-Point Scale"
                  value={newScale.name}
                  onChange={(e) => setNewScale({ ...newScale, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Official grading rules, circular references, or institutional details..."
                  value={newScale.description}
                  onChange={(e) => setNewScale({ ...newScale, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Initial Status</label>
                  <select
                    value={newScale.status}
                    onChange={(e) => setNewScale({ ...newScale, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="newScaleIsOfficial"
                    checked={newScale.isOfficial}
                    onChange={(e) => setNewScale({ ...newScale, isOfficial: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <label htmlFor="newScaleIsOfficial" className="text-xs text-text-h font-medium cursor-pointer">
                    Mark as Verified/Official Scheme
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddScaleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  Create Grading Scale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT GRADING SCALE                               */}
      {/* ======================================================== */}
      {isEditScaleOpen && editingScale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-h">Edit Grading Scale Metadata</h3>
                  <p className="text-xs text-text-light font-mono">ID: {editingScale.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditScaleOpen(false)}
                className="p-1 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editScaleError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/30 text-xs text-brandRed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editScaleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditScale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">
                  Scale Name <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingScale.name}
                  onChange={(e) => setEditingScale({ ...editingScale, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">System Type</label>
                  <select
                    value={editingScale.system}
                    onChange={(e) => setEditingScale({ ...editingScale, system: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="10-point">10-Point Scale (CBCS Standard)</option>
                    <option value="4-point">4-Point Scale (US/GPA)</option>
                    <option value="percentage">Percentage-Based System</option>
                    <option value="letter">Letter Grades Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Status</label>
                  <select
                    value={editingScale.status}
                    onChange={(e) => setEditingScale({ ...editingScale, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingScale.description}
                  onChange={(e) => setEditingScale({ ...editingScale, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editScaleIsOfficial"
                  checked={editingScale.isOfficial}
                  onChange={(e) => setEditingScale({ ...editingScale, isOfficial: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="editScaleIsOfficial" className="text-xs text-text-h font-medium cursor-pointer">
                  Mark as Verified/Official Scheme
                </label>
              </div>

              <div className="p-3 rounded-xl bg-bg-sec/60 border border-border text-[11px] text-text-light">
                <p className="font-semibold text-text-h">Historical Protection Safeguard:</p>
                <p className="mt-0.5">
                  Updating metadata does not silently alter immutable published regulations or existing student calculation snapshots.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditScaleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT GRADE ENTRY TIER                     */}
      {/* ======================================================== */}
      {isGradeEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-h">
                    {gradeEntryMode === 'add' ? 'Add Grade Tier' : `Edit Grade Tier: ${currentGradeEntry.originalGrade}`}
                  </h3>
                  <p className="text-xs text-text-light">Scale: {selectedGradingScale?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsGradeEntryModalOpen(false)}
                className="p-1 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {gradeEntryError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/30 text-xs text-brandRed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gradeEntryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGradeEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Grade Symbol <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. O, A+, S, F"
                    value={currentGradeEntry.grade}
                    onChange={(e) => setCurrentGradeEntry({ ...currentGradeEntry, grade: e.target.value.toUpperCase().trim() })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h font-extrabold focus:outline-none focus:border-accent"
                  />
                  <p className="text-[10px] text-text-light mt-1">Unique within scale.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Grade Points (GP) <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={10}
                    required
                    value={currentGradeEntry.points}
                    onChange={(e) => setCurrentGradeEntry({ ...currentGradeEntry, points: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h font-bold focus:outline-none focus:border-accent"
                  />
                  <p className="text-[10px] text-text-light mt-1">0.0 to 10.0 scale.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Min Marks (%) <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    required
                    value={currentGradeEntry.minPercentage}
                    onChange={(e) => setCurrentGradeEntry({ ...currentGradeEntry, minPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Max Marks (%) <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    required
                    value={currentGradeEntry.maxPercentage}
                    onChange={(e) => setCurrentGradeEntry({ ...currentGradeEntry, maxPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">
                  Qualitative Descriptor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outstanding, Excellent, Pass, Fail"
                  value={currentGradeEntry.desc}
                  onChange={(e) => setCurrentGradeEntry({ ...currentGradeEntry, desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-h mb-1">Passing Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentGradeEntry({ ...currentGradeEntry, isPass: true })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      currentGradeEntry.isPass
                        ? 'bg-brandGreen/10 border-brandGreen text-brandGreen'
                        : 'bg-bg-sec border-border text-text-light hover:text-text-h'
                    }`}
                  >
                    Pass (Credit Earned)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentGradeEntry({ ...currentGradeEntry, isPass: false })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      !currentGradeEntry.isPass
                        ? 'bg-brandPink/15 border-brandPink text-brandPink'
                        : 'bg-bg-sec border-border text-text-light hover:text-text-h'
                    }`}
                  >
                    Fail (Backlog)
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-bg-sec/60 border border-border text-[11px] text-text-light">
                <p className="font-semibold text-text-h">Validation Rules:</p>
                <p className="mt-0.5">
                  Percentage ranges must not overlap with other tiers. Min marks cannot exceed max marks.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsGradeEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  {gradeEntryMode === 'add' ? 'Add Grade Tier' : 'Save Grade Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SCALE CONFIRMATION (ARCHIVE / DELETE)            */}
      {/* ======================================================== */}
      {scaleConfirmModal.isOpen && scaleConfirmModal.scale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            {scaleConfirmModal.type === 'archive' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-h">Archive Grading Scale?</h3>
                    <p className="text-xs text-text-light">Safe, non-destructive status update.</p>
                  </div>
                </div>

                <p className="text-xs text-text-light">
                  Archiving <strong>{scaleConfirmModal.scale.name}</strong> hides it from new regulation assignments while keeping all existing regulations, calculations, and student records completely operational.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => setScaleConfirmModal({ isOpen: false, type: '', scale: null, refCheck: null })}
                    className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmArchiveScale}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                  >
                    Confirm Archival
                  </button>
                </div>
              </div>
            ) : (
              // Delete modal
              <>
                {scaleConfirmModal.refCheck?.hasReferences ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Destructive Deletion Blocked</h3>
                        <p className="text-xs text-text-light">Referential integrity protection active.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">
                        Cannot delete scale "{scaleConfirmModal.scale.name}" because it is actively referenced:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-text-h pl-1 text-[11px]">
                        {scaleConfirmModal.refCheck.referencingRegulations?.map((r, i) => (
                          <li key={i}>
                            <strong>{r.univName}</strong> &rsaquo; {r.courseName} &rsaquo; {r.regName} ({r.regCode})
                          </li>
                        ))}
                        {scaleConfirmModal.refCheck.studentResultCount > 0 && (
                          <li>
                            Referenced in <strong>{scaleConfirmModal.refCheck.studentResultCount}</strong> saved student result record(s)
                          </li>
                        )}
                      </ul>
                      <p className="text-[11px] text-text-light pt-1">
                        To preserve academic history and prevent calculation errors, delete is prohibited. Please Archive this scale instead.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => setScaleConfirmModal({ isOpen: false, type: '', scale: null, refCheck: null })}
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={handleConfirmArchiveScale}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive Scale Instead</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brandRed/15 text-brandRed flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-h">Permanently Delete Grading Scale?</h3>
                        <p className="text-xs text-text-light">No regulations or student records reference this scale.</p>
                      </div>
                    </div>

                    <p className="text-xs text-text-light">
                      Are you sure you want to permanently delete <strong>{scaleConfirmModal.scale.name}</strong> ({scaleConfirmModal.scale.id})? This action cannot be undone.
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => setScaleConfirmModal({ isOpen: false, type: '', scale: null, refCheck: null })}
                        className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDeleteScale}
                        className="px-4 py-2 rounded-xl bg-brandRed hover:bg-brandRed/90 text-white font-bold text-xs shadow-elevated transition-colors"
                      >
                        Permanently Delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: ASSIGN / PUBLISH SCALE TO REGULATION             */}
      {/* ======================================================== */}
      {isAssignScaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-h">Assign Scale to Academic Regulation</h3>
                  <p className="text-xs text-text-light">Scale: {catalog.gradingScales?.find(s => s.id === assignScaleData.scaleId)?.name || assignScaleData.scaleId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignScaleModalOpen(false)}
                className="p-1 rounded-lg text-text-light hover:text-text-h hover:bg-bg-sec transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignScaleError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/30 text-xs text-brandRed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignScaleError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAssignScale} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Target University</label>
                  <select
                    value={assignScaleData.univId}
                    onChange={(e) => {
                      const uId = e.target.value;
                      const u = catalog.universities?.find(x => x.id === uId);
                      const firstC = u?.courses?.[0];
                      const firstR = firstC?.regulations?.[0];
                      setAssignScaleData({
                        ...assignScaleData,
                        univId: uId,
                        courseId: firstC?.id || '',
                        regId: firstR?.id || '',
                        ruleVersion: `${firstR?.code || 'REG'}_V2`
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    {catalog.universities?.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Target Course</label>
                    <select
                      value={assignScaleData.courseId}
                      onChange={(e) => {
                        const cId = e.target.value;
                        const u = catalog.universities?.find(x => x.id === assignScaleData.univId);
                        const c = u?.courses?.find(x => x.id === cId);
                        const firstR = c?.regulations?.[0];
                        setAssignScaleData({
                          ...assignScaleData,
                          courseId: cId,
                          regId: firstR?.id || '',
                          ruleVersion: `${firstR?.code || 'REG'}_V2`
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                    >
                      {catalog.universities?.find(u => u.id === assignScaleData.univId)?.courses?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Target Regulation</label>
                    <select
                      value={assignScaleData.regId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const u = catalog.universities?.find(x => x.id === assignScaleData.univId);
                        const c = u?.courses?.find(x => x.id === assignScaleData.courseId);
                        const r = c?.regulations?.find(x => x.id === rId);
                        setAssignScaleData({
                          ...assignScaleData,
                          regId: rId,
                          ruleVersion: `${r?.code || 'REG'}_V2`
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                    >
                      {catalog.universities
                        ?.find(u => u.id === assignScaleData.univId)
                        ?.courses?.find(c => c.id === assignScaleData.courseId)
                        ?.regulations?.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Versioning Choice */}
              <div className="p-3.5 rounded-xl bg-bg-sec/70 border border-border space-y-3">
                <span className="text-xs font-bold text-text-h uppercase tracking-wider block">
                  Publishing & Versioning Safeguard
                </span>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignPublishMode"
                      checked={!assignScaleData.publishNewVersion}
                      onChange={() => setAssignScaleData({ ...assignScaleData, publishNewVersion: false })}
                      className="mt-0.5 text-accent focus:ring-accent"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-text-h">Link Directly to Existing Regulation</span>
                      <p className="text-[11px] text-text-light">
                        Updates regulation scale ID. Use only if this regulation is a draft or safe update.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignPublishMode"
                      checked={assignScaleData.publishNewVersion}
                      onChange={() => setAssignScaleData({ ...assignScaleData, publishNewVersion: true })}
                      className="mt-0.5 text-accent focus:ring-accent"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-text-h">Publish as New Immutable Version (Recommended)</span>
                      <p className="text-[11px] text-text-light">
                        Creates an immutable versioned regulation snapshot. Existing students remain on historical grading criteria.
                      </p>
                    </div>
                  </label>
                </div>

                {assignScaleData.publishNewVersion && (
                  <div className="pt-2 border-t border-border/60">
                    <label className="block text-xs font-semibold text-text-h mb-1">
                      New Regulation Version Code <span className="text-brandRed">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. R22_V2"
                      value={assignScaleData.ruleVersion}
                      onChange={(e) => setAssignScaleData({ ...assignScaleData, ruleVersion: e.target.value.toUpperCase().trim() })}
                      className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-text-h font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAssignScaleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  {assignScaleData.publishNewVersion ? 'Publish New Version' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CALCULATION RULE */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-xl w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Calculator className="w-5 h-5 text-accent" />
                <span>Create Calculation Rule</span>
              </h2>
              <button
                onClick={() => setIsAddRuleOpen(false)}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addRuleError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{addRuleError}</span>
              </div>
            )}

            <form onSubmit={handleAddRule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Rule ID <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ou-cbcs-be-rule"
                    value={newRule.id}
                    onChange={(e) => setNewRule({ ...newRule, id: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">
                    Rule Name <span className="text-brandRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Osmania CBCS B.E. Standard Rule"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Rule Type</label>
                  <select
                    value={newRule.ruleType}
                    onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="percentage">Percentage Conversion</option>
                    <option value="sgpa">SGPA Calculation</option>
                    <option value="cgpa">CGPA Calculation</option>
                    <option value="composite">Composite Degree Rule</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Formula Preset</label>
                  <select
                    value={
                      ['(CGPA - 0.5) * 10', 'CGPA * 10', '(CGPA - 0.75) * 10', 'CGPA * 9.5'].includes(newRule.percentageFormula)
                        ? newRule.percentageFormula
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setNewRule({
                          ...newRule,
                          percentageFormula: e.target.value,
                          formulaDescription: `Percentage = ${e.target.value.replace('*', '×')}`
                        });
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="(CGPA - 0.5) * 10">(CGPA - 0.5) * 10 (JNTUH R18/R22)</option>
                    <option value="CGPA * 10">CGPA * 10 (Osmania CBCS)</option>
                    <option value="(CGPA - 0.75) * 10">(CGPA - 0.75) * 10 (AICTE Standard)</option>
                    <option value="CGPA * 9.5">CGPA * 9.5 (CBSE Standard)</option>
                    <option value="custom">Custom Declarative Formula</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Declarative Percentage Formula <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. (CGPA - 0.5) * 10 or CGPA * 10"
                  value={newRule.percentageFormula}
                  onChange={(e) => setNewRule({ ...newRule, percentageFormula: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h font-mono focus:outline-none focus:border-accent"
                />
                <p className="text-[11px] text-text-light mt-0.5">
                  Safe declarative pattern: e.g. <code className="text-accent">(CGPA - 0.5) * 10</code> or <code className="text-accent">CGPA * 10</code>. Zero arbitrary code execution.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Decimal Precision</label>
                  <select
                    value={newRule.decimalPrecision}
                    onChange={(e) => setNewRule({ ...newRule, decimalPrecision: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value={0}>0 (Whole numbers)</option>
                    <option value={1}>1 Decimal place</option>
                    <option value={2}>2 Decimal places (Standard)</option>
                    <option value={3}>3 Decimal places</option>
                    <option value={4}>4 Decimal places</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Rounding Mode</label>
                  <select
                    value={newRule.roundingMode}
                    onChange={(e) => setNewRule({ ...newRule, roundingMode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="round">Half-Up (Standard)</option>
                    <option value="floor">Floor (Round Down)</option>
                    <option value="ceil">Ceil (Round Up)</option>
                    <option value="truncate">Truncate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Min Passing GP</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newRule.minPassingGradePoints}
                    onChange={(e) => setNewRule({ ...newRule, minPassingGradePoints: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Description / Regulation Reference</label>
                <textarea
                  rows={2}
                  placeholder="Official regulation citation, handbook clause, or governing board resolution..."
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-h">
                  <input
                    type="checkbox"
                    checked={newRule.isOfficial}
                    onChange={(e) => setNewRule({ ...newRule, isOfficial: e.target.checked })}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Mark as Official Regulatory Rule</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CALCULATION RULE */}
      {isEditRuleOpen && editingRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-xl w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                <span>Edit Calculation Rule: {editingRule.id}</span>
              </h2>
              <button
                onClick={() => setIsEditRuleOpen(false)}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editRuleError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editRuleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">Rule Name <span className="text-brandRed">*</span></label>
                <input
                  type="text"
                  required
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Rule Type</label>
                  <select
                    value={editingRule.ruleType || 'percentage'}
                    onChange={(e) => setEditingRule({ ...editingRule, ruleType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="percentage">Percentage Conversion</option>
                    <option value="sgpa">SGPA Calculation</option>
                    <option value="cgpa">CGPA Calculation</option>
                    <option value="composite">Composite Degree Rule</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Status</label>
                  <select
                    value={editingRule.status || 'active'}
                    onChange={(e) => setEditingRule({ ...editingRule, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">
                  Declarative Percentage Formula <span className="text-brandRed">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingRule.percentageFormula || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, percentageFormula: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Decimal Precision</label>
                  <select
                    value={editingRule.decimalPrecision ?? 2}
                    onChange={(e) => setEditingRule({ ...editingRule, decimalPrecision: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value={0}>0 (Whole numbers)</option>
                    <option value={1}>1 Decimal place</option>
                    <option value={2}>2 Decimal places (Standard)</option>
                    <option value={3}>3 Decimal places</option>
                    <option value={4}>4 Decimal places</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Rounding Mode</label>
                  <select
                    value={editingRule.roundingMode || 'round'}
                    onChange={(e) => setEditingRule({ ...editingRule, roundingMode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  >
                    <option value="round">Half-Up (Standard)</option>
                    <option value="floor">Floor (Round Down)</option>
                    <option value="ceil">Ceil (Round Up)</option>
                    <option value="truncate">Truncate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Min Passing GP</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={editingRule.minPassingGradePoints ?? 5.0}
                    onChange={(e) => setEditingRule({ ...editingRule, minPassingGradePoints: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Description / Regulation Reference</label>
                <textarea
                  rows={2}
                  value={editingRule.description || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-h">
                  <input
                    type="checkbox"
                    checked={Boolean(editingRule.isOfficial)}
                    onChange={(e) => setEditingRule({ ...editingRule, isOfficial: e.target.checked })}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Mark as Official Regulatory Rule</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditRuleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CALCULATION RULE CONFIRM (ARCHIVE / DELETE) */}
      {ruleConfirmModal.isOpen && ruleConfirmModal.rule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  ruleConfirmModal.type === 'delete'
                    ? 'bg-brandRed/10 text-brandRed border border-brandRed/20'
                    : 'bg-brandOrange/10 text-brandOrange border border-brandOrange/20'
                }`}
              >
                {ruleConfirmModal.type === 'delete' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Archive className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">
                  {ruleConfirmModal.type === 'delete' ? 'Delete Calculation Rule' : 'Archive Calculation Rule'}
                </h3>
                <span className="text-xs text-text-light">
                  Rule ID: <code className="font-mono">{ruleConfirmModal.rule.id}</code>
                </span>
              </div>
            </div>

            {/* Check if references block deletion */}
            {ruleConfirmModal.type === 'delete' && ruleConfirmModal.refCheck?.hasReferences ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-brandRed/10 border border-brandRed/20 text-xs text-brandRed space-y-1.5">
                  <span className="font-bold block">Deletion Blocked: Rule has Active References</span>
                  <p className="text-[11px] leading-relaxed">
                    This rule is currently referenced by {ruleConfirmModal.refCheck.regulations.length} regulation(s) and{' '}
                    {ruleConfirmModal.refCheck.resultsCount} student calculation result(s). Deleting it would break historical integrity.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border text-xs space-y-2">
                  <span className="font-bold text-text-h block">Safe Alternative:</span>
                  <p className="text-[11px] text-text-light">
                    You can safely <strong>archive</strong> this calculation rule instead. Archived rules cannot be newly selected, while preserving historical student data and regulation references.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRuleConfirmModal({ isOpen: false, type: '', rule: null, refCheck: null })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const r = ruleConfirmModal.rule;
                      setRuleConfirmModal({ isOpen: false, type: '', rule: null, refCheck: null });
                      handleOpenArchiveRule(r);
                    }}
                    className="px-4 py-2 rounded-xl bg-brandOrange hover:bg-brandOrange/90 text-white text-xs font-bold transition-colors"
                  >
                    Archive Instead
                  </button>
                </div>
              </div>
            ) : ruleConfirmModal.type === 'delete' ? (
              <div className="space-y-3">
                <p className="text-xs text-text-light leading-relaxed">
                  Are you sure you want to permanently delete calculation rule{' '}
                  <strong className="text-text-h">"{ruleConfirmModal.rule.name}"</strong>? This rule has no dependencies and can be safely removed.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRuleConfirmModal({ isOpen: false, type: '', rule: null, refCheck: null })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteRule}
                    className="px-4 py-2 rounded-xl bg-brandRed hover:bg-brandRed/90 text-white text-xs font-bold transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-light leading-relaxed">
                  Are you sure you want to archive calculation rule{' '}
                  <strong className="text-text-h">"{ruleConfirmModal.rule.name}"</strong>?
                </p>
                <p className="text-[11px] text-text-light bg-bg-sec p-2.5 rounded-xl border border-border">
                  Archived rules remain preserved for all historical regulations and student results, but will no longer be available for new calculation assignments.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRuleConfirmModal({ isOpen: false, type: '', rule: null, refCheck: null })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmArchiveRule}
                    className="px-4 py-2 rounded-xl bg-brandOrange hover:bg-brandOrange/90 text-white text-xs font-bold transition-colors"
                  >
                    Archive Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN CALCULATION RULE TO REGULATION */}
      {isAssignRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-h flex items-center gap-2">
                <Link2 className="w-5 h-5 text-accent" />
                <span>Assign Calculation Rule</span>
              </h2>
              <button
                onClick={() => setIsAssignRuleModalOpen(false)}
                className="text-text-light hover:text-text-h p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignRuleError && (
              <div className="p-3 rounded-xl bg-brandRed/10 border border-brandRed/20 text-brandRed text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{assignRuleError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAssignRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">Target University</label>
                <select
                  value={assignRuleData.univId}
                  onChange={(e) => {
                    const u = catalog.universities.find((x) => x.id === e.target.value);
                    const firstCourse = u?.courses?.[0];
                    setAssignRuleData({
                      ...assignRuleData,
                      univId: e.target.value,
                      courseId: firstCourse?.id || '',
                      regId: firstCourse?.regulations?.[0]?.id || ''
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                >
                  {catalog.universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Target Academic Course</label>
                <select
                  value={assignRuleData.courseId}
                  onChange={(e) => {
                    const u = catalog.universities.find((x) => x.id === assignRuleData.univId);
                    const c = u?.courses?.find((x) => x.id === e.target.value);
                    setAssignRuleData({
                      ...assignRuleData,
                      courseId: e.target.value,
                      regId: c?.regulations?.[0]?.id || ''
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                >
                  {catalog.universities
                    .find((u) => u.id === assignRuleData.univId)
                    ?.courses?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.shortName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Target Regulation</label>
                <select
                  value={assignRuleData.regId}
                  onChange={(e) => setAssignRuleData({ ...assignRuleData, regId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-sec border border-border text-xs text-text-h focus:outline-none focus:border-accent"
                >
                  {catalog.universities
                    .find((u) => u.id === assignRuleData.univId)
                    ?.courses?.find((c) => c.id === assignRuleData.courseId)
                    ?.regulations?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-bg-sec border border-border space-y-2">
                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignRuleData.publishNewVersion}
                    onChange={(e) => setAssignRuleData({ ...assignRuleData, publishNewVersion: e.target.checked })}
                    className="mt-0.5 rounded border-border text-accent focus:ring-accent"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-text-h">Publish as New Immutable Version (Recommended)</span>
                    <p className="text-[11px] text-text-light">
                      Creates an immutable versioned regulation snapshot. Existing students remain on historical calculation criteria.
                    </p>
                  </div>
                </label>

                {assignRuleData.publishNewVersion && (
                  <div className="pt-2 border-t border-border/60">
                    <label className="block text-xs font-semibold text-text-h mb-1">
                      New Regulation Version Code <span className="text-brandRed">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. R22_V2"
                      value={assignRuleData.ruleVersion}
                      onChange={(e) => setAssignRuleData({ ...assignRuleData, ruleVersion: e.target.value.toUpperCase().trim() })}
                      className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-text-h font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAssignRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg-sec transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-colors"
                >
                  {assignRuleData.publishNewVersion ? 'Publish New Version' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
