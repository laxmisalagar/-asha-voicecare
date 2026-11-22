import { configureStore } from "@reduxjs/toolkit";
import voiceReducer from "./features/voiceSlice";
import recordsReducer from "./features/recordsSlice";
import dashboardReducer from "./features/dashboardSlice";
import settingsReducer from "./features/settingsSlice";
import followupReducer from "./features/followupSlice";

export const store = configureStore({
  reducer: {
    voice: voiceReducer,
    records: recordsReducer,
    dashboard: dashboardReducer,
    settings: settingsReducer,
    followup: followupReducer,
  },
});

export default store;