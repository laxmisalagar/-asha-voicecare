"""Seed the ASHA VoiceCare demo with two synthetic records.

The backend keeps everything in memory, so a restart clears the register.
Run this once after starting the API to restore the demo story:

    python seed_demo.py

It is safe to run more than once: if any confirmed record already exists it
does nothing, so follow-up tasks are not duplicated.

This only calls the public API. It does not modify backend logic.
"""

import json
import urllib.error
import urllib.request

API = "http://localhost:8000"

RECORDS = [
    {
        "beneficiaryId": "ASH-1001",
        "visitDate": "2026-11-21",
        "visitType": "newborn",
        "transcript": (
            "Newborn visit. Baby weight 2.8 kg. Vaccination completed. "
            "Feeding well. Follow up after one month."
        ),
        "language": "en",
        "pregnancyStatus": None,
        "gestationalAge": None,
        "newbornWeight": 2.8,
        "weightUnit": "kg",
        "vaccinationStatus": "completed",
        "bcgGiven": None,
        "polioGiven": None,
        "vaccineName": "BCG",
        "nextDueDate": "2026-12-21",
        "observations": "Feeding well, no danger signs reported",
        "followUpActions": "Weight monitoring and next vaccination",
        "confirmationStatus": "confirmed",
    },
    {
        "beneficiaryId": "ASH-1002",
        "visitDate": "2026-11-22",
        "visitType": "pregnancy",
        "transcript": (
            "Pregnant woman 28 weeks. ANC checkup done. She has vaginal "
            "bleeding and severe abdominal pain since last night."
        ),
        "language": "en",
        "pregnancyStatus": "pregnant",
        "gestationalAge": "28 weeks",
        "newbornWeight": None,
        "weightUnit": None,
        "vaccinationStatus": None,
        "bcgGiven": None,
        "polioGiven": None,
        "vaccineName": None,
        "nextDueDate": "As per ANC schedule",
        "observations": "Vaginal bleeding and severe abdominal pain since last night",
        "followUpActions": "Refer to PHC urgently",
        "confirmationStatus": "confirmed",
    },
]


def request(path, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST" if data is not None else "GET",
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    try:
        stats = request("/api/stats")
    except urllib.error.URLError as exc:
        raise SystemExit(
            f"Backend not reachable at {API}. Start it with: python main.py\n{exc}"
        )

    if stats.get("confirmedRecords", 0) > 0:
        print(
            "Register already has "
            f"{stats['confirmedRecords']} confirmed record(s); nothing to do."
        )
        return

    for record in RECORDS:
        result = request("/api/save-record", record)
        print(f"Seeded {result['beneficiaryId']} ({record['visitType']})")

    print("Done. Dashboard should now show 2 beneficiaries, 1 urgent referral.")


if __name__ == "__main__":
    main()
