# Running ASHA VoiceCare

Two processes: a FastAPI backend and a Vite frontend.

## 1. Backend (port 8000)

```powershell
cd "C:\Users\KIRAN S\ashavoicecare\backend"
python main.py
```

Check it: open http://localhost:8000/health — you should see
`{"status":"healthy",...}`.

Interactive API docs: http://localhost:8000/docs

If port 8000 is busy:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000 | Select-Object OwningProcess
Stop-Process -Id <pid> -Force
```

## 2. Frontend (port 5173)

```powershell
cd "C:\Users\KIRAN S\ashavoicecare\frontend"
npm install
npm run dev
```

Open the URL Vite prints, normally http://localhost:5173

If port 5173 is busy, Vite picks the next free port (5174, 5175, ...). Use the
URL printed in the terminal — do not guess it.

## 3. Demo data (optional, after a backend restart)

The backend keeps records and follow-ups in memory, so a restart clears the
register. To restore the two synthetic demo records:

```powershell
cd "C:\Users\KIRAN S\ashavoicecare\backend"
python seed_demo.py
```

The script is idempotent: if any confirmed record already exists it does
nothing. It only calls the public API.

## 4. Demo walkthrough

The running demo has two synthetic records: `ASH-1001` (newborn, routine) and
`ASH-1002` (pregnancy, urgent referral), so the dashboard and follow-up queue
are never empty during the demo.

1. Dashboard shows the synthetic records (2 beneficiaries, 1 urgent).
2. Click **Voice visit** in the sidebar (or the raised mint mic on mobile).
3. Pick a language (English / Kannada / Hindi / Tamil / Telugu).
4. Tap the large mic and allow the microphone, **or** type notes into the live
   transcript box. The waveform reflects real microphone levels when the browser
   allows it; otherwise it falls back to a subtle animation.
5. Click **Extract record & check danger signs**.
   - Danger signs appear in a coral panel and are never hidden.
   - Extracted fields appear in an editable review form. Fields that were not
     mentioned stay "Unknown (not stated)".
6. Click **Read back aloud** to hear the record (browser speech synthesis).
7. Edit anything that is wrong, then click **Confirm & save**.
8. A mint confirmation panel and toast show the generated follow-up; the task
   also appears under **Follow-ups**, and the record under **Health records**.

Try these transcripts to see the rule engine:

| Transcript | Expected |
|---|---|
| `Newborn visit. Baby weight 2.8 kg. Vaccination completed. Follow up after one month.` | No danger sign, newborn record, weight 2.8 kg |
| `Pregnant woman 28 weeks. ANC done. IFA prescribed. She has vaginal bleeding.` | Urgent: bleeding during pregnancy |
| `Newborn has high fever and difficulty breathing.` | Urgent: newborn fever + breathing |
| `Patient has difficulty breathing and heavy bleeding.` | Urgent: general breathing + heavy bleeding |

## Demo / honesty notes

- Speech recognition uses the **browser's** Web Speech API. Nothing is sent to
  a third-party AI service by this app. It is labelled "demo mode" in the UI.
  Chrome/Edge work best; Firefox may not support it — type instead.
- If the browser has no speech recognition, the UI says so and the transcript
  box remains usable. Mock speech is never presented as real AI.
- Records, follow-ups and stats are stored **in memory** in the backend, so they
  reset when the backend restarts. There is no database yet.
- All data is synthetic. Danger-sign logic is rule-based and is a referral aid,
  not a diagnosis.

## UI / design notes

- The interface is a navy + electric-mint healthcare identity: a fixed deep-navy
  sidebar with a mint active rail, a light cloud-white workspace with elevated
  white cards, Inter typography, layered shadows and restrained gradients.
- On mobile the sidebar is replaced by a bottom tab bar with a raised mint Voice
  action, and all primary controls are touch-sized.
- The voice page uses a dark midnight studio: large mic, real microphone-level
  waveform, language chips, live transcript, and clear listening / processing /
  reading states. After saving, the page scrolls to the confirmation panel.
- Danger signs are also repeated as a compact coral strip at the top of the
  review card, so they stay visible while editing.
- Coral is used only for genuine danger, amber for pending follow-ups, violet
  for AI-generated information, and mint for confirmed success.
- Motion is fully disabled when the OS is set to reduce motion.
- Desktop and mobile reference screenshots are in `C:\Users\Public\shots\`
  (`final-*`, `final2-*`, `final3-*`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Blank white page | Hard refresh (Ctrl+Shift+R). Open DevTools console; if it shows a module error, run `npm run build` in `frontend` and fix what it reports. |
| "Backend not reachable" banner | Start the backend, then click Retry. Confirm http://localhost:8000/health opens. |
| Microphone does nothing | Allow mic permission for the page, use Chrome/Edge, or type the notes. |
| Port already in use | Kill the process on that port (commands above), or use the port Vite prints. |
| Stale Vite cache | Stop Vite, delete `frontend\node_modules\.vite`, run `npm run dev` again. |
