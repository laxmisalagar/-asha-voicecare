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

def extract_entities(transcript: str, language: str = 'en') -> Dict[str, Any]:
    """Extract structured medical entities from voice transcript."""

    t = transcript.strip()
    beneficiary_id = f"ASH-{next(_record_counter)}"
    visit_date = datetime.now().strftime('%Y-%m-%d')

    visit_type_lower = t.lower()
    visit_type = 'general'

    if any(word in visit_type_lower for word in [
        'pregnant', 'pregnancy', 'anc', 'antenatal'
    ]):
        visit_type = 'pregnancy'

    elif any(word in visit_type_lower for word in [
        'newborn', 'baby', 'infant', 'child'
    ]):
        visit_type = 'newborn'

    elif any(word in visit_type_lower for word in [
        'immunisation', 'vaccination', 'vaccine',
        'polio', 'rota', 'pcv'
    ]):
        visit_type = 'immunisation'

    record: Dict[str, Any] = {
        "beneficiaryId": beneficiary_id,
        "visitDate": visit_date,
        "visitType": visit_type,
        "transcript": t,
        "language": language,
        "confirmationStatus": "pending",
    }

    def re_search_weight(text: str) -> Optional[Dict[str, Any]]:
        patterns = [
            r'(\d+\.?\d*)\s*kg',
            r'(\d+\.?\d*)\s*kilo',
            r'weight\s*(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*kilos',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)

            if match:
                return {
                    'value': float(match.group(1)),
                    'unit': 'kg'
                }

        return None

    def re_find_next_visit(text: str) -> Optional[str]:
        patterns = [
            r'(after\s+\d+\s*(day|week|month|year))',
            r'(next\s+visit\s+(after\s+)?\d+\s*(day|week|month|year))',
            r'(one\s+month)',
            r'(one\s+week)',
            r'(after\s+one\s+(month|week))',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)

            if match:
                return match.group(0)

        return None

    words = t.lower().split()

    # Vaccination
    for i, word in enumerate(words):

        if word in ['vaccination', 'vaccine']:
            if any(
                w in ['completed', 'done', 'given', 'received']
                for w in words[i+1:i+3]
            ):
                record['vaccinationStatus'] = 'completed'

        if word in ['ifa', 'iron']:
            record['observations'] = (
                record.get('observations') + ' IFA supplement '
                if record.get('observations')
                else 'IFA supplement '
            )

        if word in ['polio', 'rotavirus', 'pcv', 'hbv']:
            record['vaccineName'] = word.capitalize()

    # Newborn
    if visit_type == 'newborn':

        weight_match = re_search_weight(t)

        if weight_match:
            record['newbornWeight'] = weight_match['value']
            record['weightUnit'] = weight_match['unit'] or 'kg'

        if any(w in t.lower() for w in ['completed', 'done', 'given']):
            record['vaccinationStatus'] = 'completed'

        if any(w in t.lower() for w in ['pending', 'pending']):
            record['vaccinationStatus'] = 'pending'

    # Pregnancy
    if visit_type == 'pregnancy':

        if 'anc' in t.lower() or 'antenatal' in t.lower():
            record['pregnancyStatus'] = 'ANC checkup done'

        if 'ifa' in t.lower() or 'iron' in t.lower():
            record['observations'] = (
                record.get('observations') + ' IFA prescribed '
                if record.get('observations')
                else 'IFA prescribed '
            )

    # Immunisation
    if visit_type == 'immunisation':

        vaccine_keywords = [
            'polio', 'bcg', 'hepatitis',
            'rotavirus', 'pcv', 'pentavalent'
        ]

        for kw in vaccine_keywords:
            if kw in t.lower():
                record['vaccineName'] = kw.capitalize()
                break

        date_patterns = re.findall(
            r'\d{1,2}\s*(day|week|month|year)',
            t,
            re.IGNORECASE
        )

        if date_patterns:
            record['nextDueDate'] = date_patterns[0]

    # Observations
    observation_keywords = [
        'oedema', 'hypertension', 'anemia',
        'diabetes', 'complications'
    ]

    for obs in observation_keywords:

        if obs in t.lower():

            if record.get('observations'):
                record['observations'] = (
                    record['observations'] + f', {obs} '
                )
            else:
                record['observations'] = obs

    # Follow-up actions
    if any(w in t.lower() for w in [
        'follow-up', 'followup', 'follow up'
    ]):
        record['followUpActions'] = 'Follow-up visit required'

    # Next visit
    next_visit_patterns = re_find_next_visit(t)

    if next_visit_patterns:
        record['nextDueDate'] = next_visit_patterns

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
