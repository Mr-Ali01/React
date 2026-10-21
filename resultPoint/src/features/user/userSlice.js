import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';

const getInitialProfile = () => {
  try {
    const authUser = authService.getCurrentUser();
    if (!authUser) return null;
    return studentService.getProfile();
  } catch {
    return null;
  }
};

const initialState = {
  profile: getInitialProfile(),
  loading: false,
  error: null,
  updateSuccess: false,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = studentService.getProfile();
      return profile;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const updated = studentService.updateProfile(updates);
      authService.updateCurrentUser(updates);
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update user profile');
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      if (state.profile) {
        state.profile[field] = value;
      }
    },
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      // Clear on logout
      .addCase('auth/logoutUser/fulfilled', (state) => {
        state.profile = null;
        state.loading = false;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase('auth/logout', (state) => {
        state.profile = null;
        state.loading = false;
        state.error = null;
        state.updateSuccess = false;
      });
  },
});

export const { setProfile, updateField, clearUserError, resetUpdateStatus, clearUserProfile } = userSlice.actions;

// Selectors
export const selectUserProfile = (state) => state.user.profile;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectUserUpdateSuccess = (state) => state.user.updateSuccess;

export default userSlice.reducer;
