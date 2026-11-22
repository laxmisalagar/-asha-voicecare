import sys
import json
import requests
import time

# Wait for server to start
time.sleep(2)

print("=" * 60)
print("ASHA VOICEPCARE - BACKEND TESTS")
print("=" * 60)

# Test 1: Health check
print("\n1. Health Check:")
try:
    r = requests.get('http://localhost:8000/health', timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 2: Entity extraction - Newborn visit
print("\n2. Entity Extraction - Newborn Visit:")
try:
    r = requests.post(
        'http://localhost:8000/api/extract-entities',
        json={
            'transcript': 'Today I visited beneficiary ID 1025. This is a newborn visit. Baby weight is 2.8 kilo. Vaccination status is completed. Next visit after one month.',
            'language': 'en'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Beneficiary ID: {data.get('beneficiaryId')}")
        print(f"   Visit Type: {data.get('visitType')}")
        print(f"   Newborn Weight: {data.get('newbornWeight')} {data.get('weightUnit')}")
        print(f"   Vaccination Status: {data.get('vaccinationStatus')}")
        print(f"   Next Visit: {data.get('nextDueDate')}")
        print(f"   Confirmation Status: {data.get('confirmationStatus')}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 3: Entity extraction - Pregnancy visit
print("\n3. Entity Extraction - Pregnancy Visit:")
try:
    r = requests.post(
        'http://localhost:8000/api/extract-entities',
        json={
            'transcript': 'Visited pregnant woman. ANC checkup done. IFA goli prescribed. Blood pressure normal.',
            'language': 'en'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Beneficiary ID: {data.get('beneficiaryId')}")
        print(f"   Visit Type: {data.get('visitType')}")
        print(f"   Pregnancy Status: {data.get('pregnancyStatus')}")
        print(f"   Observations: {data.get('observations')}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 4: Entity extraction - Immunisation visit
print("\n4. Entity Extraction - Immunisation Visit:")
try:
    r = requests.post(
        'http://localhost:8000/api/extract-entities',
        json={
            'transcript': 'Immunisation visit. Polio vaccine given. Next visit after one month.',
            'language': 'en'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Beneficiary ID: {data.get('beneficiaryId')}")
        print(f"   Visit Type: {data.get('visitType')}")
        print(f"   Vaccine Name: {data.get('vaccineName')}")
        print(f"   Next Visit: {data.get('nextDueDate')}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 5: Danger sign detection - High fever newborn
print("\n5. Danger Sign Detection - High Fever Newborn:")
try:
    r = requests.post(
        'http://localhost:8000/api/danger-signs',
        json={
            'transcript': 'Baby has high fever, 38 degrees celsius',
            'language': 'en'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Urgent Alert: {data.get('urgent_alert')}")
        print(f"   Detected Signs: {len(data.get('detected_signs', []))}")
        if data.get('detected_signs'):
            for sign in data['detected_signs']:
                print(f"   - {sign['sign']}: {sign['message']}")
        if data.get('urgent_alert_details'):
            print(f"   Urgent: {data['urgent_alert_details']['message']}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 6: Danger sign detection - Bleeding pregnancy
print("\n6. Danger Sign Detection - Bleeding During Pregnancy:")
try:
    r = requests.post(
        'http://localhost:8000/api/danger-signs',
        json={
            'transcript': 'I had bleeding during pregnancy',
            'language': 'en'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Urgent Alert: {data.get('urgent_alert')}")
        print(f"   Detected Signs: {len(data.get('detected_signs', []))}")
        if data.get('detected_signs'):
            for sign in data['detected_signs']:
                print(f"   - {sign['sign']}: {sign['message']}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 7: Danger sign detection - No signs
print("\n7. Danger Sign Detection - No Signs:")
try:
    r = requests.post(
        'http://localhost:8000/api/danger-signs',
        json={
            'transcript': 'Baby weight is 2.8 kilo, vaccination completed',
            'language': 'en'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Urgent Alert: {data.get('urgent_alert')}")
        print(f"   Detected Signs: {len(data.get('detected_signs', []))}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

# Test 8: Save record
print("\n8. Save Record:")
try:
    r = requests.post(
        'http://localhost:8000/api/save-record',
        json={
            'beneficiaryId': 'ASH-1025',
            'visitType': 'newborn',
            'visitDate': '2026-11-22',
            'transcript': 'Baby weight is 2.8 kilo. Vaccination status is completed. Next visit after one month.',
            'language': 'en',
            'confirmationStatus': 'confirmed'
        },
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"   Status: {data.get('status')}")
        print(f"   Message: {data.get('message')}")
    else:
        print(f"   ERROR: Status {r.status_code}, Response: {r.text}")
except Exception as e:
    print(f"   ERROR: {e}")

print("\n" + "=" * 60)
print("TESTS COMPLETED")
print("=" * 60)