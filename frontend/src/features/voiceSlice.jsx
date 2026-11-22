import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isListening: false,
  isRecording: false,
  transcript: "",
  liveTranscript: "",
  selectedLanguage: "en",
  processing: false,
  confidence: 1,
  structuredRecord: null,
  isReadingBack: false,
  audioLevel: 0,
};

export const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isListening = true;
      state.isRecording = true;
      state.liveTranscript = "";
      state.transcript = "";
    },
    stopRecording: (state) => {
      state.isListening = false;
      state.isRecording = false;
    },
    setTranscript: (state, action) => {
      state.transcript = action.payload;
      state.liveTranscript = action.payload;
    },
    setLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
    },
    setProcessing: (state, action) => {
      state.processing = action.payload;
    },
    setConfidence: (state, action) => {
      state.confidence = action.payload;
    },
    setStructuredRecord: (state, action) => {
      state.structuredRecord = action.payload;
    },
    setReadingBack: (state, action) => {
      state.isReadingBack = action.payload;
    },
    setAudioLevel: (state, action) => {
      state.audioLevel = action.payload;
    },
    clearState: (state) => {
      state.isListening = false;
      state.isRecording = false;
      state.transcript = "";
      state.liveTranscript = "";
      state.processing = false;
      state.structuredRecord = null;
      state.isReadingBack = false;
      state.audioLevel = 0;
    },
  },
});

export const {
  startRecording,
  stopRecording,
  setTranscript,
  setLanguage,
  setProcessing,
  setConfidence,
  setStructuredRecord,
  setReadingBack,
  setAudioLevel,
  clearState,
} = voiceSlice.actions;

export default voiceSlice.reducer;