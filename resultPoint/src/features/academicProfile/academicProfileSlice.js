import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { updateAuthProfileStatus } from '../auth/authSlice';

const getInitialAcademicData = () => {
  try {
    const authUser = authService.getCurrentUser();
    if (!authUser) {
      return {
        universityId: null,
        university: null,
        universityShortName: null,
        courseId: null,
        course: null,
        courseShortName: null,
        regulationId: null,
        regulation: null,
        ruleVersion: null,
        batch: null,
        currentSemester: 1,
        totalSemesters: 8,
        totalDegreeCredits: 160,
        hallTicketNumber: null,
        gradingSystem: null,
        hasCompletedProfile: false,
        phoneNumber: null,
        dob: null,
        gender: null,
      };
    }
    const profile = studentService.getProfile();
    return {
      universityId: profile?.universityId || null,
      university: profile?.university || null,
      universityShortName: profile?.universityShortName || null,
      courseId: profile?.courseId || null,
      course: profile?.course || null,
      courseShortName: profile?.courseShortName || null,
      regulationId: profile?.regulationId || null,
      regulation: profile?.regulation || null,
      ruleVersion: profile?.ruleVersion || null,
      batch: profile?.batch || null,
      currentSemester: profile?.currentSemester || 1,
      totalSemesters: profile?.totalSemesters || 8,
      totalDegreeCredits: profile?.totalDegreeCredits || 160,
      hallTicketNumber: profile?.hallTicketNumber || null,
      gradingSystem: profile?.gradingSystem || null,
      hasCompletedProfile: Boolean(profile?.hasCompletedProfile),
      phoneNumber: profile?.phoneNumber || null,
      dob: profile?.dob || null,
      gender: profile?.gender || null,
    };
  } catch {
    return {
      universityId: null,
      university: null,
      universityShortName: null,
      courseId: null,
      course: null,
      courseShortName: null,
      regulationId: null,
      regulation: null,
      ruleVersion: null,
      batch: null,
      currentSemester: 1,
      totalSemesters: 8,
      totalDegreeCredits: 160,
      hallTicketNumber: null,
      gradingSystem: null,
      hasCompletedProfile: false,
      phoneNumber: null,
      dob: null,
      gender: null,
    };
  }
};

const initialData = getInitialAcademicData();

const initialState = {
  ...initialData,
  loading: false,
  error: null,
  saveSuccess: false,
};

export const fetchAcademicProfile = createAsyncThunk(
  'academicProfile/fetchAcademicProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = studentService.getProfile();
      return profile;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch academic profile');
    }
  }
);

export const saveAcademicProfile = createAsyncThunk(
  'academicProfile/saveAcademicProfile',
  async (profileUpdates, { dispatch, rejectWithValue }) => {
    try {
      const updated = studentService.updateProfile(profileUpdates);
      dispatch(updateAuthProfileStatus(true));
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to save academic profile');
    }
  }
);

export const academicProfileSlice = createSlice({
  name: 'academicProfile',
  initialState,
  reducers: {
    setAcademicProfile: (state, action) => {
      const p = action.payload || {};
      state.universityId = p.universityId || null;
      state.university = p.university || null;
      state.universityShortName = p.universityShortName || null;
      state.courseId = p.courseId || null;
      state.course = p.course || null;
      state.courseShortName = p.courseShortName || null;
      state.regulationId = p.regulationId || null;
      state.regulation = p.regulation || null;
      state.ruleVersion = p.ruleVersion || null;
      state.batch = p.batch || null;
      state.currentSemester = p.currentSemester || 1;
      state.totalSemesters = p.totalSemesters || 8;
      state.totalDegreeCredits = p.totalDegreeCredits || 160;
      state.hallTicketNumber = p.hallTicketNumber || null;
      state.gradingSystem = p.gradingSystem || null;
      state.hasCompletedProfile = Boolean(p.hasCompletedProfile);
      state.phoneNumber = p.phoneNumber || null;
      state.dob = p.dob || null;
      state.gender = p.gender || null;
    },
    setCurrentSemester: (state, action) => {
      state.currentSemester = Number(action.payload) || 1;
    },
    resetSaveSuccess: (state) => {
      state.saveSuccess = false;
    },
    clearAcademicProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAcademicProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicProfile.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload || {};
        state.universityId = p.universityId || null;
        state.university = p.university || null;
        state.universityShortName = p.universityShortName || null;
        state.courseId = p.courseId || null;
        state.course = p.course || null;
        state.courseShortName = p.courseShortName || null;
        state.regulationId = p.regulationId || null;
        state.regulation = p.regulation || null;
        state.ruleVersion = p.ruleVersion || null;
        state.batch = p.batch || null;
        state.currentSemester = p.currentSemester || 1;
        state.totalSemesters = p.totalSemesters || 8;
        state.totalDegreeCredits = p.totalDegreeCredits || 160;
        state.hallTicketNumber = p.hallTicketNumber || null;
        state.gradingSystem = p.gradingSystem || null;
        state.hasCompletedProfile = Boolean(p.hasCompletedProfile);
        state.phoneNumber = p.phoneNumber || null;
        state.dob = p.dob || null;
        state.gender = p.gender || null;
      })
      .addCase(fetchAcademicProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save
      .addCase(saveAcademicProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase(saveAcademicProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.saveSuccess = true;
        const p = action.payload || {};
        state.universityId = p.universityId || null;
        state.university = p.university || null;
        state.universityShortName = p.universityShortName || null;
        state.courseId = p.courseId || null;
        state.course = p.course || null;
        state.courseShortName = p.courseShortName || null;
        state.regulationId = p.regulationId || null;
        state.regulation = p.regulation || null;
        state.ruleVersion = p.ruleVersion || null;
        state.batch = p.batch || null;
        state.currentSemester = p.currentSemester || 1;
        state.totalSemesters = p.totalSemesters || 8;
        state.totalDegreeCredits = p.totalDegreeCredits || 160;
        state.hallTicketNumber = p.hallTicketNumber || null;
        state.gradingSystem = p.gradingSystem || null;
        state.hasCompletedProfile = true;
        state.phoneNumber = p.phoneNumber || null;
        state.dob = p.dob || null;
        state.gender = p.gender || null;
      })
      .addCase(saveAcademicProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.saveSuccess = false;
      })
      // Clear on logout
      .addCase('auth/logoutUser/fulfilled', (state) => {
        state.universityId = null;
        state.university = null;
        state.universityShortName = null;
        state.courseId = null;
        state.course = null;
        state.courseShortName = null;
        state.regulationId = null;
        state.regulation = null;
        state.ruleVersion = null;
        state.batch = null;
        state.currentSemester = 1;
        state.totalSemesters = 8;
        state.totalDegreeCredits = 160;
        state.hallTicketNumber = null;
        state.gradingSystem = null;
        state.hasCompletedProfile = false;
        state.loading = false;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase('auth/logout', (state) => {
        state.universityId = null;
        state.university = null;
        state.universityShortName = null;
        state.courseId = null;
        state.course = null;
        state.courseShortName = null;
        state.regulationId = null;
        state.regulation = null;
        state.ruleVersion = null;
        state.batch = null;
        state.currentSemester = 1;
        state.totalSemesters = 8;
        state.totalDegreeCredits = 160;
        state.hallTicketNumber = null;
        state.gradingSystem = null;
        state.hasCompletedProfile = false;
        state.loading = false;
        state.error = null;
        state.saveSuccess = false;
      });
  },
});

export const {
  setAcademicProfile,
  setCurrentSemester,
  resetSaveSuccess,
  clearAcademicProfileError,
} = academicProfileSlice.actions;

// Selectors
export const selectAcademicProfile = (state) => state.academicProfile;
export const selectIsProfileComplete = (state) =>
  Boolean(
    state.academicProfile.hasCompletedProfile &&
    state.academicProfile.universityId &&
    state.academicProfile.courseId
  );
export const selectCurrentSemester = (state) => state.academicProfile.currentSemester;
export const selectTotalSemesters = (state) => state.academicProfile.totalSemesters;
export const selectAcademicProfileLoading = (state) => state.academicProfile.loading;
export const selectAcademicProfileError = (state) => state.academicProfile.error;
export const selectAcademicProfileSaveSuccess = (state) => state.academicProfile.saveSuccess;

export default academicProfileSlice.reducer;
