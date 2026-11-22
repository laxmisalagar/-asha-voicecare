export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* response was not JSON */
    }
    throw new Error(detail);
  }

  return res.json();
}

export const api = {
  health: () => request("/health"),

  dangerSigns: (transcript, language) =>
    request("/api/danger-signs", {
      method: "POST",
      body: JSON.stringify({ transcript, language }),
    }),

  extractEntities: (transcript, language, beneficiaryId) =>
    request("/api/extract-entities", {
      method: "POST",
      body: JSON.stringify({
        transcript,
        language,
        beneficiaryId: beneficiaryId || null,
      }),
    }),

  saveRecord: (record) =>
    request("/api/save-record", {
      method: "POST",
      body: JSON.stringify(record),
    }),

  records: () => request("/api/records"),

  followUps: () => request("/api/followups"),

  stats: () => request("/api/stats"),
};
