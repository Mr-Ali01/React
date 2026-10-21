import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  GraduationCap,
  Sparkles,
  School,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { useAppDispatch } from '../../../hooks/useAppDispatch.js';
import { useAppSelector } from '../../../hooks/useAppSelector.js';
import {
  fetchEducationRecords,
  addEducationRecord,
  updateEducationRecord,
  deleteEducationRecord,
  setActiveEducation,
  setActiveFilterTab,
  setSearchQuery,
  setStatusFilter,
  selectAllEducationRecords,
  selectActiveEducationId,
  selectFilteredEducationRecords,
  selectEducationStats,
  selectActiveFilterTab,
  selectSearchQuery,
  selectStatusFilter,
  selectEducationLoading
} from '../educationRecordsSlice.js';
import { studentService } from '../../../services/studentService.js';
import { saveAcademicProfile } from '../../academicProfile/academicProfileSlice.js';
import { updateUserProfile } from '../../user/userSlice.js';

import EducationFilters from './EducationFilters.jsx';
import EducationRecordCard from './EducationRecordCard.jsx';
import AddEducationPanel from './AddEducationPanel.jsx';
import EducationFormModal from './EducationFormModal.jsx';
import EducationDetailModal from './EducationDetailModal.jsx';
import DeleteEducationModal from './DeleteEducationModal.jsx';

export default function EducationRecordsPage() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const allRecords = useAppSelector(selectAllEducationRecords);
  const filteredRecords = useAppSelector(selectFilteredEducationRecords);
  const activeEducationId = useAppSelector(selectActiveEducationId);
  const stats = useAppSelector(selectEducationStats);
  const activeFilterTab = useAppSelector(selectActiveFilterTab);
  const searchQuery = useAppSelector(selectSearchQuery);
  const statusFilter = useAppSelector(selectStatusFilter);
  const isLoading = useAppSelector(selectEducationLoading);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formLevelKey, setFormLevelKey] = useState('ug');
  const [editingRecord, setEditingRecord] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchEducationRecords());

    const handleSync = () => {
      dispatch(fetchEducationRecords());
    };

    window.addEventListener('education_records_updated', handleSync);
    window.addEventListener('active_education_changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('education_records_updated', handleSync);
      window.removeEventListener('active_education_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [dispatch]);

  // Handle Level Selection from right panel or top button
  const handleOpenAddForm = (levelKey = 'ug') => {
    setEditingRecord(null);
    setFormLevelKey(levelKey);
    setIsFormModalOpen(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setFormLevelKey(record.type || 'ug');
    setIsFormModalOpen(true);
  };

  const handleViewRecord = (record) => {
    setViewingRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleDeleteRequest = (record) => {
    setDeletingRecord(record);
    setIsDeleteModalOpen(true);
  };

  // Form Save
  const handleSaveRecord = async (formData) => {
    try {
      if (editingRecord) {
        await dispatch(updateEducationRecord({ id: editingRecord.id, updates: formData })).unwrap();
        showToast(`${formData.level} education record updated successfully!`);
      } else {
        await dispatch(addEducationRecord(formData)).unwrap();
        showToast(`${formData.level} education record added successfully!`);
      }
      setIsFormModalOpen(false);
      setEditingRecord(null);
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to save education record', 'error');
    }
  };

  // Delete Confirm
  const handleConfirmDelete = async (id) => {
    try {
      await dispatch(deleteEducationRecord(id)).unwrap();
      showToast('Education record removed successfully.');
      setIsDeleteModalOpen(false);
      setDeletingRecord(null);
      if (viewingRecord?.id === id) {
        setIsDetailModalOpen(false);
        setViewingRecord(null);
      }
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to delete education record', 'error');
    }
  };

  // Switch Active Academic Context for UG/PG
  const handleSetActiveContext = async (recordId) => {
    try {
      const res = await dispatch(setActiveEducation(recordId)).unwrap();
      const targetRecord = allRecords.find((r) => r.id === recordId);

      if (targetRecord && (targetRecord.type === 'ug' || targetRecord.type === 'pg')) {
        // Sync with active student profile
        const currentProfile = studentService.getProfile();
        const updatedProfile = {
          ...currentProfile,
          universityId: targetRecord.universityId || currentProfile.universityId,
          university: targetRecord.university || currentProfile.university,
          universityShortName: targetRecord.universityShortName || currentProfile.universityShortName,
          courseId: targetRecord.courseId || currentProfile.courseId,
          course: targetRecord.course || currentProfile.course,
          courseShortName: targetRecord.courseShortName || currentProfile.courseShortName,
          regulationId: targetRecord.regulationId || currentProfile.regulationId,
          regulation: targetRecord.regulationName || currentProfile.regulation,
          batch: targetRecord.batch || currentProfile.batch,
          totalSemesters: Number(targetRecord.totalSemesters) || currentProfile.totalSemesters,
          currentSemester: targetRecord.currentSemester || currentProfile.currentSemester
        };

        studentService.updateProfile(updatedProfile);
        dispatch(saveAcademicProfile(updatedProfile));
        dispatch(updateUserProfile(updatedProfile));

        showToast(`Active academic context switched to ${targetRecord.level} (${targetRecord.universityShortName || 'OU'})`);
      }
    } catch (err) {
      showToast('Failed to switch active context', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00] flex-shrink-0 mt-0.5 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">
              Education Records
            </h1>
            <p className="text-xs sm:text-sm text-text-light mt-0.5 leading-relaxed">
              Manage all your academic qualifications in one place. Add, view, edit, or delete your education records.
            </p>
          </div>
        </div>

        {/* Add Your Education Top Action Button */}
        <button
          type="button"
          onClick={() => handleOpenAddForm('ug')}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-lg shadow-[#FF6B00]/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Your Education</span>
        </button>
      </div>

      {/* Filter Tabs, Search Bar & Status Dropdown */}
      <EducationFilters
        activeTab={activeFilterTab}
        onTabChange={(tab) => dispatch(setActiveFilterTab(tab))}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={(query) => dispatch(setSearchQuery(query))}
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => dispatch(setStatusFilter(status))}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Education Cards List */}
        <div className="lg:col-span-8 space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <EducationRecordCard
                key={record.id}
                record={record}
                isActiveContext={record.id === activeEducationId}
                onView={handleViewRecord}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRequest}
              />
            ))
          ) : (
            /* Empty States */
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center mx-auto">
                <School className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-text-h">
                  {allRecords.length === 0
                    ? 'No Education Records Added Yet'
                    : 'No Matching Records Found'}
                </h3>
                <p className="text-xs text-text-light leading-relaxed">
                  {allRecords.length === 0
                    ? 'Build your comprehensive academic portfolio by adding your school, undergraduate, and postgraduate records.'
                    : `No education records match the search "${searchQuery}" or selected filters. Try clearing your filters.`}
                </p>
              </div>

              {allRecords.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenAddForm('ug')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-md shadow-[#FF6B00]/25 inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Education Record</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setActiveFilterTab('ALL'));
                    dispatch(setSearchQuery(''));
                    dispatch(setStatusFilter('ALL'));
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Add Education Selection Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <AddEducationPanel onSelectLevel={handleOpenAddForm} />
        </div>
      </div>

      {/* Modals */}
      <EducationFormModal
        isOpen={isFormModalOpen}
        levelKey={formLevelKey}
        initialData={editingRecord}
        onSave={handleSaveRecord}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecord(null);
        }}
      />

      <EducationDetailModal
        record={viewingRecord}
        isOpen={isDetailModalOpen}
        isActiveContext={viewingRecord?.id === activeEducationId}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingRecord(null);
        }}
        onEdit={(record) => {
          setIsDetailModalOpen(false);
          handleEditRecord(record);
        }}
        onDelete={(record) => {
          setIsDetailModalOpen(false);
          handleDeleteRequest(record);
        }}
        onSetActiveContext={handleSetActiveContext}
      />

      <DeleteEducationModal
        isOpen={isDeleteModalOpen}
        record={deletingRecord}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingRecord(null);
        }}
      />
    </div>
  );
}
