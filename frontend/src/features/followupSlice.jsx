import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: [],
  isLoading: false,
};

export const followupSlice = createSlice({
  name: "followup",
  initialState,
  reducers: {
    addTask: (state, action) => {
      state.tasks.unshift(action.payload);
    },
    updateTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (task) {
        Object.assign(task, action.payload.updates);
      }
    },
    setReferralStatus: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (task) {
        task.referralStatus = action.payload.status;
      }
    },
    loadTasks: (state, action) => {
      state.tasks = action.payload;
    },
  },
});

export const { addTask, updateTask, setReferralStatus, loadTasks } = followupSlice.actions;

export default followupSlice.reducer;