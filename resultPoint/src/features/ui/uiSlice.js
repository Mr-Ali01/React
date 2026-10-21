import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeTab: 'dashboard',
  activeModal: null,
  modalData: null,
  globalLoading: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = Boolean(action.payload);
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = Boolean(action.payload);
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      state.activeModal = modalName;
      state.modalData = data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = Boolean(action.payload);
    },
  },
});

export const {
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setActiveTab,
  openModal,
  closeModal,
  setGlobalLoading,
} = uiSlice.actions;

// Selectors
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalData = (state) => state.ui.modalData;
export const selectGlobalLoading = (state) => state.ui.globalLoading;

export default uiSlice.reducer;
