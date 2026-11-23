import os
import json
import re
import asyncio
import itertools
from datetime import datetime
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn


# --- Pydantic Models ---

class TranscriptInput(BaseModel):
    transcript: str = Field(..., description="The speech recognition transcript")
    language: str = Field(default='en', description="Language code (en, kn, hi, ta, te)")
    beneficiaryId: Optional[str] = Field(default=None, description="Beneficiary ID if known")


class StructuredRecordOutput(BaseModel):
    beneficiaryId: str
    visitDate: str
    visitType: str = 'general'
    transcript: str
    language: str
    pregnancyStatus: Optional[str] = None
    gestationalAge: Optional[str] = None
    newbornWeight: Optional[float] = None
    weightUnit: Optional[str] = None
    vaccinationStatus: Optional[str] = None
    bcgGiven: Optional[bool] = None
    polioGiven: Optional[bool] = None
    vaccineName: Optional[str] = None
    nextDueDate: Optional[str] = None
    observations: Optional[str] = None
    followUpActions: Optional[str] = None
    confirmationStatus: str = 'pending'


class DangerSignDetection(BaseModel):
    transcript: str
    language: str = 'en'


# --- App Initialization ---

app = FastAPI(
    title="ASHA VoiceCare API",
    description="AI-Powered Voice Field Register for ASHA Workers",
    version="1.0.0"
)


# --- CORS Configuration ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://asha-voicecare-1acp.vercel.app",
    ],
    # Covers every asha-voicecare*.vercel.app URL, including preview deployments
    allow_origin_regex=r"https://asha-voicecare.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- In-Memory Storage ---

visit_records: Dict[str, StructuredRecordOutput] = {}
follow_up_tasks: List[Dict[str, Any]] = []
_record_counter = itertools.count(1001)


# --- Rule-based Danger Sign Detection ---

DANGER_SIGN_PATTERNS = {
    'bleedingDuringPregnancy': {
        'patterns': [r'bleeding[ii]?', r'blood.*pregnant', r'vaginal.*bleeding', r'hemorrhage'],
        'context': r'\b(pregnan\w*|anc|antenatal|expecting|trimester)\b',
        'category': 'pregnancy',
        'severity': 'urgent',
        'message': 'Contact PHC immediately - bleeding during pregnancy requires medical evaluation',
    },
    'highFeverPregnancy': {
        'patterns': [r'high.*fever', r'fever.*pregnant', r'temperature.*38', r'severe.*fever'],
        'context': r'\b(pregnan\w*|anc|antenatal|expecting|trimester)\b',
        'category': 'pregnancy',
        'severity': 'urgent',
        'message': 'High fever during pregnancy - consult PHC for evaluation',
    },
    'highFeverNewborn': {
        'patterns': [r'high.*fever', r'fever.*baby', r'fever.*newborn', r'temperature.*newborn', r'38.*celsius', r'fever.*infant'],
        'context': r'\b(newborn|baby|infant|neonate|neonatal)\b',
        'category': 'newborn',
        'severity': 'urgent',
        'message': 'High fever in newborn - URGENT: Contact PHC immediately, could indicate sepsis',
    },
    'difficultyBreathingNewborn': {
        'patterns': [r'difficulty.*breathing', r'breathing.*problem', r'gasping', r'wheezing', r'shortness of breath'],
        'context': r'\b(newborn|baby|infant|neonate|neonatal)\b',
        'category': 'newborn',
        'severity': 'urgent',
        'message': 'Difficulty breathing in newborn - URGENT: Refer to PHC immediately',
    },
    'newbornNotFeeding': {
        'patterns': [r'not feeding', r'not sucking', r'refusing feeds', r'baby not taking'],
        'context': r'\b(newborn|baby|infant|neonate|neonatal)\b',
        'category': 'newborn',
        'severity': 'moderate',
        'message': 'Newborn not feeding properly - consult ASHA supervisor',
    },
    'lethargyNewborn': {
        'patterns': [r'lethargic', r'too sleepy', r'not responsive', r'unusually quiet'],
        'context': r'\b(newborn|baby|infant|neonate|neonatal)\b',
        'category': 'newborn',
        'severity': 'urgent',
        'message': 'Lethargic newborn - URGENT: Refer to PHC immediately',
    },
    'bleedingNewborn': {
        'patterns': [r'bleeding.*newborn', r'navel.*bleeding', r'cord.*bleeding'],
        'context': r'\b(newborn|baby|infant|neonate|neonatal)\b',
        'category': 'newborn',
        'severity': 'urgent',
        'message': 'Bleeding from umbilical cord - URGENT: Contact PHC immediately',
    },
    'severeAbdominalPain': {
        'patterns': [r'severe.*abdominal.*pain', r'severe.*stomach.*pain', r'abdominal.*cramping'],
        'category': 'general',
        'severity': 'urgent',
        'message': 'Severe abdominal pain - consult PHC for evaluation',
    },
    'difficultyBreathing': {
        'patterns': [r'difficulty.*breathing', r'cannot.*breathe', r'shortness of breath'],
        'category': 'general',
        'severity': 'urgent',
        'message': 'Difficulty breathing - URGENT: Seek immediate medical attention',
    },
    'heavyBleeding': {
        'patterns': [r'heavy.*bleeding', r'significant.*bleeding', r'hemorrhage'],
        'category': 'general',
        'severity': 'urgent',
        'message': 'Heavy bleeding - URGENT: Contact PHC or emergency services',
    },
}


def detect_danger_signs_python(transcript: str) -> list:
    detected = []

    for sign_name, config in DANGER_SIGN_PATTERNS.items():
        context = config.get('context')

        if context and not re.search(context, transcript, re.IGNORECASE):
            continue

        triggered = [
            p for p in config['patterns']
            if re.search(p, transcript, re.IGNORECASE)
        ]

        if triggered:
            detected.append({
                'sign': sign_name,
                'category': config['category'],
                'severity': config['severity'],
                'message': config['message'],
                'triggeredPatterns': triggered,
            })

    # Drop generic duplicates only when a more specific sign already fired.
    specific = [
        item for item in detected
        if item['category'] != 'general'
    ]

    specific_triggers = {
        p for item in specific
        for p in item['triggeredPatterns']
    }

    detected = [
        item for item in detected
        if item['category'] != 'general'
        or not set(item['triggeredPatterns']) & specific_triggers
    ]

    severity_order = {
        'urgent': 3,
        'moderate': 2,
        'mild': 1
    }

    detected.sort(
        key=lambda x: severity_order.get(x['severity'], 0),
        reverse=True
    )

    return detected


def get_danger_sign_alert_python(transcript: str) -> dict:
    detected = detect_danger_signs_python(transcript)

    if not detected:
        return None

    most_urgent = detected[0]

    return {
        'sign': most_urgent['sign'],
        'category': most_urgent['category'],
        'severity': most_urgent['severity'],
        'message': most_urgent['message'],
        'triggeredBy': (
            most_urgent['triggeredPatterns'][0]
            if most_urgent['triggeredPatterns']
            else ''
        ),
    }


# --- Entity Extraction Service ---

MONTHS = (
    r'january|february|march|april|may|june|july|august|september|october|'
    r'november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec'
)
UNIT_RE = r'(?:kilograms?|kilos?|kgs?)'


def normalize_transcript(text: str) -> str:
    """Fix common speech-recognition mishearings before extraction."""
    t = text.strip()

    # "orc", "ank", "a n c" heard instead of ANC (only before check-up words)
    t = re.sub(
        r'\b(?:a\s*\.?\s*n\s*\.?\s*c|orc|ank|ang|ans)\b'
        r'(?=\s*(?:check|visit|registration|completed|done))',
        'ANC',
        t,
        flags=re.IGNORECASE,
    )

    # "new born", "new-born", "new bone", "new burn" heard instead of "newborn"
    t = re.sub(
        r'\bnew[\s-]*(?:born|bone|burn|barn)\b',
        'newborn',
        t,
        flags=re.IGNORECASE,
    )

    # "wait 48" heard instead of "weight 48"
    t = re.sub(
        r'\b(?:wait|weigh|wate)\b(?=\s*(?:is\s*)?\d)',
        'weight',
        t,
        flags=re.IGNORECASE,
    )

    return t


def find_weight(text: str) -> Optional[float]:
    patterns = [
        rf'(\d+(?:\.\d+)?)\s*{UNIT_RE}\b',
        r'weight\s*(?:is|was|of)?\s*(\d+(?:\.\d+)?)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return float(match.group(1))

    return None


def find_next_visit(text: str) -> Optional[str]:
    """Find a next-visit date such as 'December 5' or a gap like 'after one month'."""
    keyword = re.compile(
        r'next\s+visit|follow[\s-]?up|\bdue\b|come\s+back|review|visit\s+on',
        re.IGNORECASE,
    )

    date_patterns = [
        rf'\b(?:{MONTHS})\.?\s+\d{{1,2}}(?:st|nd|rd|th)?\b',
        rf'\b\d{{1,2}}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:{MONTHS})\b',
    ]

    for pattern in date_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            window = text[max(0, match.start() - 40):match.start()]

            if keyword.search(window):
                return ' '.join(
                    w.capitalize() if w.isalpha() else w
                    for w in match.group(0).split()
                )

    relative_patterns = [
        r'after\s+(?:\d+|one|two|three|four|six)\s*(?:day|week|month|year)s?',
        r'next\s+visit\s+(?:after\s+)?(?:\d+|one|two|three|four|six)\s*(?:day|week|month|year)s?',
        r'one\s+(?:week|month)',
        r'next\s+(?:week|month)',
    ]

    for pattern in relative_patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group(0)

    return None


def extract_entities(transcript: str, language: str = 'en') -> Dict[str, Any]:
    """Extract structured medical entities from voice transcript."""

    t = normalize_transcript(transcript)
    low = t.lower()
    beneficiary_id = f"ASH-{next(_record_counter)}"
    visit_date = datetime.now().strftime('%Y-%m-%d')

    # Visit type (whole-word matching, so "balance" no longer counts as "anc")
    has_pregnancy = re.search(
        r'\b(pregnan\w*|anc|antenatal|trimester|gestation\w*|expecting)\b', low
    )
    has_newborn_word = re.search(
        r'\b(newborn|neonate|neonatal|birth\s+(?:dose|weight)|born\s+(?:today|yesterday)|'
        r'just\s+born|delivered)\b'
        r'|\b(?:[1-9]|1\d|2[0-8]|one|two|three|four|five|six|seven)\s*-?\s*days?\s*-?\s*old\b',
        low,
    )
    has_baby_word = re.search(r'\b(baby|infant|child|toddler)\b', low)
    has_immunisation = re.search(
        r'\b(immuni[sz]ation|vaccinat\w*|vaccine|polio|bcg|opv|ipv|rota\w*|pcv|'
        r'pentavalent|hbv|measles|injection)\b',
        low,
    )

    if has_pregnancy:
        visit_type = 'pregnancy'
    elif has_newborn_word:
        visit_type = 'newborn'
    elif has_immunisation:
        # A vaccination visit for a baby is immunisation, not a newborn check
        visit_type = 'immunisation'
    elif has_baby_word:
        visit_type = 'newborn'
    else:
        visit_type = 'general'

    is_infant = bool(has_newborn_word or has_baby_word)

    record: Dict[str, Any] = {
        "beneficiaryId": beneficiary_id,
        "visitDate": visit_date,
        "visitType": visit_type,
        "transcript": t,
        "language": language,
        "confirmationStatus": "pending",
    }

    observations: List[str] = []

    # Weight: a baby's weight goes in the newborn weight field,
    # an adult's weight is noted in observations
    weight = find_weight(t)

    if weight is not None:
        if is_infant and visit_type in ('newborn', 'immunisation'):
            record['newbornWeight'] = weight
            record['weightUnit'] = 'kg'
        else:
            observations.append(f"Weight {weight:g} kg")

    # Vaccination
    vaccine_match = re.search(
        r'\b(bcg|opv|ipv|polio|rotavirus|rota|pcv|hbv|hepatitis|pentavalent|measles|tetanus|tt)\b',
        low,
    )
    vaccine_context = vaccine_match or re.search(
        r'\b(vaccinat\w*|vaccine|immuni[sz]\w*|injection)\b', low
    )

    if vaccine_match:
        name = vaccine_match.group(1)
        record['vaccineName'] = name.upper() if len(name) <= 4 else name.capitalize()

    if vaccine_context:
        if re.search(r'\b(completed|complete|done|given|received|taken)\b', low):
            record['vaccinationStatus'] = 'completed'
        elif re.search(r'\b(pending|due|not\s+given|missed)\b', low):
            record['vaccinationStatus'] = 'pending'

    # Iron / calcium supplements
    if re.search(r'\b(ifa|iron|folic)\b', low):
        given = re.search(r'\b(given|gave|provided|distributed|taken|prescribed)\b', low)
        observations.append('IFA tablets given' if given else 'IFA supplement')

    if re.search(r'\bcalcium\b', low):
        observations.append('Calcium supplement')

    # Pregnancy
    if visit_type == 'pregnancy':
        if re.search(r'\b(anc|antenatal)\b', low):
            done = re.search(r'\b(completed|complete|done)\b', low)
            record['pregnancyStatus'] = 'ANC checkup done' if done else 'ANC visit'
        elif re.search(r'\bpregnan\w*', low):
            record['pregnancyStatus'] = 'Pregnant'

        ga = (
            re.search(r'pregnan\w*\s+(?:woman\s+|lady\s+|mother\s+)?(?:at\s+)?(\d{1,2})\s*weeks?', low)
            or re.search(r'(\d{1,2})\s*weeks?\s*(?:pregnan\w*|gestation\w*)', low)
            or re.search(r'gestation\w*\s*(?:age\s*)?(?:of\s*)?(\d{1,2})\s*weeks?', low)
        )

        if ga:
            record['gestationalAge'] = f"{ga.group(1)} weeks"

    # Clinical observations
    for obs in [
        'oedema', 'edema', 'hypertension', 'anemia', 'anaemia',
        'diabetes', 'complications',
    ]:
        if re.search(rf'\b{obs}\b', low):
            observations.append(obs.capitalize())

    if observations:
        record['observations'] = ', '.join(dict.fromkeys(observations))

    # Follow-up actions
    if re.search(r'follow[\s-]?up', low):
        record['followUpActions'] = 'Follow-up visit required'

    # Next visit
    next_visit = find_next_visit(t)

    if next_visit:
        record['nextDueDate'] = next_visit

    return record


# --- API Routes ---

@app.get("/")
async def root():
    return {
        "message": "ASHA VoiceCare API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.websocket("/ws/stt")
async def websocket_stt(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_bytes()

            await websocket.send_text(json.dumps({
                "type": "transcript",
                "text": "",
                "is_final": False,
                "language": "en"
            }))

    except WebSocketDisconnect:
        pass


@app.post("/api/extract-entities")
async def extract_entities_endpoint(input_data: TranscriptInput):
    try:
        # Extraction only: nothing is persisted until the ASHA worker confirms.
        record = extract_entities(
            input_data.transcript,
            input_data.language
        )

        if input_data.beneficiaryId:
            record["beneficiaryId"] = input_data.beneficiaryId

        return record

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Entity extraction failed: {str(e)}"
        )


@app.post("/api/danger-signs")
async def detect_danger_signs(input_data: DangerSignDetection):
    try:
        detected = detect_danger_signs_python(input_data.transcript)
        alert = get_danger_sign_alert_python(input_data.transcript)

        result = {
            "transcript": input_data.transcript,
            "language": input_data.language,
            "detected_signs": detected,
            "urgent_alert": alert is not None,
        }

        if alert:
            result["urgent_alert_details"] = {
                "sign": alert['sign'],
                "category": alert['category'],
                "severity": alert['severity'],
                "message": alert['message'],
            }

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Danger sign detection failed: {str(e)}"
        )


@app.post("/api/save-record")
async def save_record(record_data: dict):
    try:
        record = StructuredRecordOutput(**record_data)
        record.confirmationStatus = 'confirmed'

        visit_records[record.beneficiaryId] = record

        # Generate follow-up
        task_details = {
            "beneficiaryId": record.beneficiaryId,
            "visitType": record.visitType,
            "previousVisit": record.visitDate,
        }

        if record.visitType == 'newborn':

            if record.newbornWeight:
                task_details["pendingVaccinations"] = ["BCG", "OPV"]
            else:
                task_details["pendingVaccinations"] = [
                    "Weight check follow-up"
                ]

            task_details["nextVisitDate"] = (
                record.nextDueDate or "After 1 month"
            )

            task_details["pendingActions"] = [
                "Weight monitoring",
                "Vaccination schedule"
            ]

        elif record.visitType == 'pregnancy':

            task_details["pendingVaccinations"] = [
                "Tetanus booster if due"
            ]

            task_details["nextVisitDate"] = (
                record.nextDueDate or "As per ANC schedule"
            )

            task_details["pendingActions"] = [
                "Continue ANC checkups",
                "IFA supplementation"
            ]

        elif record.visitType == 'immunisation':

            if record.vaccineName:
                task_details["pendingVaccinations"] = [
                    record.vaccineName
                ]
            else:
                task_details["pendingVaccinations"] = ["Next vaccine"]

            task_details["nextVisitDate"] = (
                record.nextDueDate or "As per schedule"
            )

            task_details["pendingActions"] = [
                "Schedule next vaccination"
            ]

        task_details["referralStatus"] = "none"

        follow_up_tasks.insert(0, task_details)

        return {
            "status": "saved",
            "beneficiaryId": record.beneficiaryId,
            "message": "Visit record saved successfully",
            "followUp": task_details,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save record: {str(e)}"
        )


@app.get("/api/records")
async def list_records():
    records = sorted(
        visit_records.values(),
        key=lambda r: (r.visitDate, r.beneficiaryId),
        reverse=True,
    )

    return {
        "records": [r.model_dump() for r in records]
    }


@app.get("/api/followups")
async def list_followups():
    return {
        "followUps": follow_up_tasks
    }


@app.get("/api/stats")
async def stats():
    records = list(visit_records.values())

    urgent = sum(
        1 for r in records
        if get_danger_sign_alert_python(r.transcript or "") is not None
    )

    return {
        "totalBeneficiaries": len({r.beneficiaryId for r in records}),
        "confirmedRecords": len(records),
        "followUps": len(follow_up_tasks),
        "urgentReferrals": urgent,
    }


# --- Run Application ---

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000))
    )