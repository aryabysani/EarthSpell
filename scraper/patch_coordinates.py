"""
Geocode every image location in Firestore using OpenStreetMap Nominatim
and patch the lat/lng fields.

Run from scraper/ directory:
    pip install geopy
    python patch_coordinates.py
"""
import time
import firebase_admin
from firebase_admin import credentials, firestore
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})
db = firestore.client()

geolocator = Nominatim(user_agent="earthspell-geocoder/1.0")

def geocode(location: str):
    if not location or not location.strip():
        return None, None
    try:
        result = geolocator.geocode(location, timeout=10)
        if result:
            return round(result.latitude, 6), round(result.longitude, 6)
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"    geocoder error for '{location}': {e}")
    return None, None

def main():
    docs = list(db.collection("letters").stream())
    print(f"Found {len(docs)} letter documents\n")

    total_updated = 0
    total_failed = 0

    for doc in docs:
        data = doc.to_dict()
        images = data.get("images", [])
        changed = False

        print(f"Letter {doc.id} — {len(images)} images")

        for img in images:
            # skip if already has coords
            if img.get("lat") is not None and img.get("lng") is not None:
                print(f"  skip (has coords): {img.get('location')}")
                continue

            location = img.get("location", "")
            lat, lng = geocode(location)

            if lat is not None:
                img["lat"] = lat
                img["lng"] = lng
                changed = True
                total_updated += 1
                print(f"  ✓ {location} → {lat}, {lng}")
            else:
                total_failed += 1
                print(f"  ✗ not found: '{location}'")

            time.sleep(1.1)  # Nominatim rate limit: 1 req/sec

        if changed:
            db.collection("letters").document(doc.id).update({"images": images})
            print(f"  → saved {doc.id}")

    print(f"\n✓ Done. {total_updated} geocoded, {total_failed} not found.")

if __name__ == "__main__":
    main()
