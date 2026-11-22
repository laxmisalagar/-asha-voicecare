import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedLanguage: "en",
  voiceSpeed: 1,
  voiceVolume: 1,
  notifications: true,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
    },
    setVoiceSpeed: (state, action) => {
      state.voiceSpeed = action.payload;
    },
    setVoiceVolume: (state, action) => {
      state.voiceVolume = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
  },
});

export const { setLanguage, setVoiceSpeed, setVoiceVolume, toggleNotifications } = settingsSlice.actions;

export default settingsSlice.reducer;