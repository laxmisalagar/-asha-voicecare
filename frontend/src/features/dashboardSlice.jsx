import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stats: {
    totalBeneficiaries: 0,
    completedVisitsToday: 0,
    pendingVisits: 0,
    followUpAppointments: 0,
    urgentReferrals: 0,
  },
  recentVisits: [],
  isLoading: true,
};

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    loadStats: (state, action) => {
      state.stats = action.payload;
      state.isLoading = false;
    },
    addRecentVisit: (state, action) => {
      state.recentVisits = [action.payload, ...state.recentVisits].slice(0, 10);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { loadStats, addRecentVisit, setLoading } = dashboardSlice.actions;

export default dashboardSlice.reducer;