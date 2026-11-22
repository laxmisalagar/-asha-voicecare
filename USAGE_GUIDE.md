# ASHA VoiceCare - Usage Guide

## Quick Start

### Option 1: Full Stack (Recommended)
```cmd
REM 1. Start Backend
cd C:\Users\KIRAN S\ashavoicecare\backend
python main.py

REM 2. Start Frontend  
cd C:\Users\KIRAN S\ashavoicecare\frontend
npm run dev

REM 3. Open Browser
http://localhost:5173
```

### Option 2: Backend Only (API Testing)
```cmd
REM Start Backend
cd C:\Users\KIRAN S\ashavoicecare\backend
python main.py

REM All features accessible via API at http://localhost:8000
```

### Option 3: Static Frontend
```cmd
1. Open browser to http://localhost:5173
   OR
   Open the frontend/index.html directly
2. The dashboard and modules are pre-built
3. Use the API at http://localhost:8000 for full functionality
```

## Available API Endpoints

### Base URL: `http://localhost:8000`

#### Health Check
```
GET /health
```
Returns: `{"status": "healthy", "timestamp": "2026-11-22T..."}`

#### Entity Extraction
```
POST /api/extract-entities
Body: {"transcript": "string", "language": "en|kn|hi|ta|te"}
Returns: Structured medical record with:
- beneficiaryId, visitDate, visitType
- pregnancyStatus, newbornWeight, weightUnit
- vaccinationStatus, vaccineName
- nextDueDate, observations, followUpActions
- confirmationStatus
```

#### Danger Sign Detection
```
POST /api/danger-signs
Body: {"transcript": "string", "language": "en"}
Returns: detected signs with urgency flags
- urgent_alert: boolean
- urgent_alert_details: sign, category, severity, message
- detected_signs: array of detected patterns
```

#### Save Record
```
POST /api/save-record
Body: record data with confirmationStatus
Returns: {"status": "saved", "beneficiaryId": "ASH-..."}
```

#### WebSocket Streaming STT
```
WS /ws/stt
Connect and stream audio chunks
Receive live transcriptions
```

## Demo Scenarios

### Scenario 1: Normal Newborn Visit
```
Worker speaks: "Today I visited beneficiary ID 1025. This is a newborn visit. Baby weight is 2.8 kilo. Vaccination status is completed. Next visit after one month."

Expected:
1. Live transcription appears
2. AI extracts: beneficiary ID, weight 2.8kg, vaccination completed, next visit 1 month
3. AI reads back: "I recorded newborn weight as 2.8 kilograms. Vaccination is marked completed. Next visit is scheduled after one month."
4. Worker confirms: "Yes, save it"
5. Record saved with beneficiary ID ASH-1025
6. Follow-up tasks created (weight monitoring, vaccination schedule)
```

### Scenario 2: Danger Sign Detected
```
Worker speaks: "Baby has high fever, 38 degrees celsius."

Expected:
1. System recognizes high fever in newborn
2. ⚠️ URGENT ALERT: "High fever in newborn - Contact PHC immediately"
3. Record flagged for PHC referral
4. No diagnosis or treatment generated
5. Recommendation: Contact Primary Health Centre immediately
```

### Scenario 3: Pregnancy Visit with IFA
```
Worker speaks: "Visited pregnant woman. ANC checkup done. IFA goli prescribed. Blood pressure normal."

Expected:
1. AI extracts: visitType: pregnancy, pregnancyStatus: ANC checkup done
2. Observations: "IFA supplement IFA prescribed"
3. No danger signs triggered (unless other patterns match)
4. Record saved with pregnancy follow-up tasks
```

### Scenario 4: Immunisation Visit
```
Worker speaks: "Immunisation visit. Polio vaccine given. Next visit after one month."

Expected:
1. AI extracts: visitType: immunisation, vaccineName: Polio
2. nextDueDate: "one month"
3. Follow-up: schedule next vaccination
4. No danger signs (unless other patterns match)
```

## Frontend Modules

### ASHA Dashboard
- Total beneficiaries count
- Today's completed visits
- Pending visits count
- Follow-up appointments
- Urgent referrals flagged
- Recent visit records table
- "Start Voice Visit" prominent button

### Live Voice Assistant
- Large microphone button
- Audio waveform visualization
- Live transcription display
- Selected language indicator
- AI processing status
- Structured record preview
- Confirm and Correct buttons
- Read-aloud control
- Danger sign alerts (visually distinct)

### Visit Records
- Table of all visit records
- Beneficiary ID, visit type, date, status
- View/edit actions per record

### Follow-up Management
- Beneficiary ID and visit type
- Previous visit date
- Next visit date
- Pending vaccinations
- Pending follow-up actions
- Referral status
- Calendar view

### Settings
- Language selection (English/Kannada/Hindi/Tamil/Telugu)
- Voice speed control (0.5x to 2x)
- Voice volume control (0 to 1)
- Notification toggles
- Danger sign configuration
- Reset to defaults

### Language Selector
- Supports: English, Kannada, Hindi, Tamil, Telugu
- Shows medical terminology per language
- Persists selection across sessions

## Medical Terms by Language

| English | Kannada | Hindi | Tamil | Telugu |
|---------|---------|-------|-------|--------|
| ANC checkup | ಅಂಟ್‌ಮ್ एनसी | एनसी	checkup | एन்டிënc checkup | ANC	checkup |
| IFA goli | Iowa goli | IFA गोली | Tablet IFA | Iowa tablet |
| Vaccination | vaccination | टीकाकरण | திசையின்ம் | టిక్కి vaccination |
| Newborn weight | Balaga poids | Shishu ka vajan | Tamil: newborn weight | Texas weight |
| Pregnancy | Hambadu | Garbhavastha | Gravidathinam | Garbhini |

## Responsible AI

- Uses synthetic beneficiaries and data
- Never exposes real personal information
- Clearly communicates recognition uncertainty
- Does not claim clinical accuracy without validation
- Rule-based danger signs (not LLM-dependent)
- No medical diagnoses or prescriptions generated
- PHC referral alerts only, no treatment recommendations

## Project Structure

```
ashavoicecare/
├── backend/          - Python FastAPI
│   └── main.py        - All endpoints
├── frontend/         - React + Vite
│   └── src/           - All components
├── PROJECT_SUMMARY.md - Full documentation
└── USAGE_GUIDE.md    - This file
```

## Development

### Adding New Danger Signs
Edit `DANGER_SIGN_PATTERNS` in `backend/main.py`
- Add pattern regex
- Set category (pregnancy/newborn/general)
- Set severity (urgent/moderate)
- Provide user message

### Adding New Languages
1. Add language option in `LanguageSelector.jsx`
2. Add language handling in `voiceSlice.jsx`
3. Update `getMedicalTerms()` if needed
4. Test with backend API

### Frontend Development
```cmd
cd C:\Users\KIRAN S\ashavoicecare\frontend
npm run dev    # Start Vite dev server
npm run build  # Build for production
npm test       # Run tests
```

## Browser Compatibility

Compatible with:
- Chrome 100+
- Edge 100+
- Firefox 95+
- Safari 14+

Responsive design works on:
- Desktop monitors (1920px+)
- Laptops (1366px+)
- Tablets (768px+)
- Mobile phones (375px+)