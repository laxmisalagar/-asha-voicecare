import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  records: [],
  currentRecord: null,
  isSaving: false,
};

export const recordsSlice = createSlice({
  name: "records",
  initialState,
  reducers: {
    addRecord: (state, action) => {
      const beneficiaryId = `ASH-${Math.floor(1000 + Math.random() * 9000)}`;
      const visitDate = new Date().toISOString().split("T")[0];

      state.records.unshift({
        id: `rec-${Date.now()}`,
        beneficiaryId,
        visitType: "general",
        visitDate,
        transcript: action.payload.transcript,
        structuredRecord: {
          beneficiaryId,
          visitType: "general",
          visitDate,
          transcript: action.payload.transcript,
          language: action.payload.language,
          confirmationStatus: "pending",
        },
        confirmationStatus: "pending",
        createdAt: new Date().toISOString(),
        correctionHistory: [],
      });
    },
    updateRecord: (state, action) => {
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = { ...state.records[index], ...action.payload.updates };
      }
    },
    confirmRecord: (state, action) => {
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index].confirmationStatus = "confirmed";
      }
    },
    correctRecord: (state, action) => {
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index].structuredRecord = {
          ...state.records[index].structuredRecord,
          ...action.payload.corrections,
        };
        state.records[index].confirmationStatus = "corrected";
        state.records[index].correctionHistory = [
          ...state.records[index].correctionHistory,
          {
            id: `corr-${Date.now()}`,
            corrections: action.payload.corrections,
            timestamp: new Date().toISOString(),
          },
        ];
      }
    },
    setCurrentRecord: (state, action) => {
      state.currentRecord = action.payload;
    },
    clearCurrentRecord: (state) => {
      state.currentRecord = null;
    },
  },
});

export const {
  addRecord,
  updateRecord,
  confirmRecord,
  correctRecord,
  setCurrentRecord,
  clearCurrentRecord,
} = recordsSlice.actions;

export default recordsSlice.reducer;