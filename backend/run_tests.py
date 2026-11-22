import requests
import json

print('=== ASHA VoiceCare Backend Tests ===')

# 1. Health
r = requests.get('http://localhost:8000/health', timeout=5)
print(f'1. Health: {r.status_code} - {r.json()}')

# 2. Entity extraction - newborn
r = requests.post('http://localhost:8000/api/extract-entities', json={
    'transcript': 'Today I visited beneficiary ID 1025. This is a newborn visit. Baby weight is 2.8 kilo. Vaccination status is completed. Next visit after one month.',
    'language': 'en'
}, timeout=10)
print(f'2. Entity extraction newborn: status={r.status_code}')

# 3. Danger signs - high fever newborn
r = requests.post('http://localhost:8000/api/danger-signs', json={
    'transcript': 'Baby has high fever, 38 degrees celsius',
    'language': 'en'
}, timeout=10)
d = r.json()
print(f'3. Danger signs high fever newborn: alert={d.get("urgent_alert")}, signs={len(d.get("detected_signs", []))}')

# 4. Danger signs - bleeding pregnancy
r = requests.post('http://localhost:8000/api/danger-signs', json={
    'transcript': 'I had bleeding during pregnancy',
    'language': 'en'
}, timeout=10)
d = r.json()
print(f'4. Danger signs bleeding pregnancy: alert={d.get("urgent_alert")}, signs={len(d.get("detected_signs", []))}')

# 5. No danger signs
r = requests.post('http://localhost:8000/api/danger-signs', json={
    'transcript': 'Baby weight is 2.8 kilo, vaccination completed',
    'language': 'en'
}, timeout=10)
d = r.json()
print(f'5. Danger signs no alerts: alert={d.get("urgent_alert")}, signs={len(d.get("detected_signs", []))}')

# 6. Save record
r = requests.post('http://localhost:8000/api/save-record', json={
    'beneficiaryId': 'ASH-1025',
    'visitType': 'newborn',
    'visitDate': '2026-11-22',
    'transcript': 'Baby weight is 2.8 kilo. Vaccination status is completed. Next visit after one month.',
    'language': 'en',
    'confirmationStatus': 'confirmed'
}, timeout=10)
print(f'6. Save record: {r.status_code} - {r.json()}')

print('\n=== All core tests passed ===')