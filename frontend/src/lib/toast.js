export const TOAST_EVENT = "asha-voicecare:toast";

export function toast(message, options = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        message,
        tone: "mint",
        duration: 3800,
        ...options,
      },
    })
  );
}
