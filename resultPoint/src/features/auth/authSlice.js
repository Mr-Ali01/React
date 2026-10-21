import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

const getInitialUser = () => {
  try {
    const user = authService.getCurrentUser();
    if (user && (user.role === 'student' || user.role === 'admin')) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

const initialState = {
  user: initialUser
    ? {
        id: initialUser.id,
        fullName: initialUser.fullName,
        email: initialUser.email,
        role: initialUser.role,
        hasCompletedProfile: Boolean(initialUser.hasCompletedProfile),
        avatar: initialUser.avatar || null,
        universityId: initialUser.universityId || null,
        courseId: initialUser.courseId || null,
        regulationId: initialUser.regulationId || null,
        course: initialUser.course || null,
        university: initialUser.university || null,
        currentSemester: initialUser.currentSemester || 1,
        totalSemesters: initialUser.totalSemesters || 8,
        regulation: initialUser.regulation || null,
      }
    : null,
  token: initialUser ? authService.getToken() : null,
  isAuthenticated: Boolean(initialUser && (initialUser.role === 'student' || initialUser.role === 'admin')),
  role: initialUser ? initialUser.role : null,
  loading: false,
  initialized: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password, expectedRole }, { rejectWithValue }) => {
    try {
      const result = authService.login({ email, password, expectedRole });
      if (!result.success) {
        return rejectWithValue(result.error || 'Authentication failed');
      }

      const user = result.user;
      if (expectedRole && user.role !== expectedRole) {
        if (expectedRole === 'admin') {
          return rejectWithValue('Access denied: Administrator privileges required. Please switch to Student Login.');
        }
        if (expectedRole === 'student') {
          return rejectWithValue('Access denied: This login is for students. Please switch to Admin Login.');
        }
      }

      // Return sanitized user (exclude password if any)
      const sanitized = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || 'student',
        hasCompletedProfile: Boolean(user.hasCompletedProfile),
        avatar: user.avatar || null,
        universityId: user.universityId || null,
        courseId: user.courseId || null,
        regulationId: user.regulationId || null,
        course: user.course || null,
        university: user.university || null,
        currentSemester: user.currentSemester || 1,
        totalSemesters: user.totalSemesters || 8,
        regulation: user.regulation || null,
      };

      return { user: sanitized, token: `token_${Date.now()}` };
    } catch (err) {
      return rejectWithValue(err.message || 'Login request encountered an error');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ fullName, email, password }, { rejectWithValue }) => {
    try {
      const result = authService.register({ fullName, email, password });
      if (!result.success) {
        return rejectWithValue(result.error || 'Registration failed');
      }

      const user = result.user;
      const sanitized = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || 'student',
        hasCompletedProfile: Boolean(user.hasCompletedProfile),
        avatar: user.avatar || null,
        universityId: user.universityId || null,
        courseId: user.courseId || null,
        regulationId: user.regulationId || null,
        course: user.course || null,
        university: user.university || null,
        currentSemester: user.currentSemester || 1,
        totalSemesters: user.totalSemesters || 8,
        regulation: user.regulation || null,
      };

      return { user: sanitized, token: `token_${Date.now()}` };
    } catch (err) {
      return rejectWithValue(err.message || 'Registration request encountered an error');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  authService.logout();
  return true;
});

export const checkAuthSession = createAsyncThunk('auth/checkAuthSession', async () => {
  const current = authService.getCurrentUser();
  if (!current || (current.role !== 'student' && current.role !== 'admin')) {
    return null;
  }
  return {
    user: {
      id: current.id,
      fullName: current.fullName,
      email: current.email,
      role: current.role,
      hasCompletedProfile: Boolean(current.hasCompletedProfile),
      avatar: current.avatar || null,
      universityId: current.universityId || null,
      courseId: current.courseId || null,
      regulationId: current.regulationId || null,
      course: current.course || null,
      university: current.university || null,
      currentSemester: current.currentSemester || 1,
      totalSemesters: current.totalSemesters || 8,
      regulation: current.regulation || null,
    },
    token: authService.getToken(),
  };
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const payloadUser = action.payload;
      if (payloadUser && (payloadUser.role === 'student' || payloadUser.role === 'admin')) {
        state.user = payloadUser;
        state.isAuthenticated = true;
        state.role = payloadUser.role;
      } else {
        state.user = null;
        state.isAuthenticated = false;
        state.role = null;
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateAuthProfileStatus: (state, action) => {
      if (state.user) {
        state.user.hasCompletedProfile = Boolean(action.payload);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.loading = false;
      state.initialized = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.role = action.payload.user.role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.role = action.payload.user.role;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.role = null;
        state.loading = false;
        state.initialized = true;
        state.error = null;
      });

    // Check Auth
    builder
      .addCase(checkAuthSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        if (action.payload && action.payload.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.role = action.payload.user.role;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.role = null;
        }
      })
      .addCase(checkAuthSession.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.role = null;
      });
  },
});

export const { setUser, clearAuthError, updateAuthProfileStatus, logout } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.role;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthInitialized = (state) => state.auth.initialized;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
