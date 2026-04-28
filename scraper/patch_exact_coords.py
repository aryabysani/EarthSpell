"""
Patch Firestore with exact coordinates from NASA's Your Name in Landsat page.
Matches by location name substring. Run from scraper/ directory:
    python patch_exact_coords.py
"""
import firebase_admin
from firebase_admin import credentials, firestore
import re

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})
db = firestore.client()

# Exact coordinates from NASA page, keyed by lowercase location keywords
# Format: (lat_decimal, lng_decimal)
NASA_COORDS = {
    # A
    "mjøsa":        (60.764639, 10.945333),
    "mjosa":        (60.764639, 10.945333),
    "yukon":        (62.554917, -164.936197),
    "guakhmaz":     (40.664111, 47.110056),
    "farmisland":   (45.728833, -69.769139),
    "farm island":  (45.728833, -69.769139),
    "hickman":      (36.589111, -89.340806),
    # B
    "humaita":      (-7.616694, -62.921389),
    "humaitá":      (-7.616694, -62.921389),
    "holla":        (35.144750, -93.054583),
    # C
    "false river":  (36.589111, -89.340806),
    "deception":    (-62.956194, -60.642444),
    "black rock":   (40.787722, -119.203611),
    # D
    "tandou":       (-32.621611, 142.072611),
    "akimiski":     (53.016250, -81.306833),
    # E
    "breiðamerkur": (64.096, -16.3627),
    "breidamerkur": (64.096, -16.3627),
    "bellona":      (-20.5, 158.5),
    "okhotsk":      (54.714028, 136.572333),
    "firn":         (29.262472, 96.317722),
    "tibet":        (29.262472, 96.317722),
    # F
    "kruger":       (-28.733694, 29.208361),
    "mato grosso":  (-13.840806, -55.298611),
    # G
    "fonte boa":    (-2.441889, -66.278806),
    "fonteboa":     (-2.441889, -66.278806),
    # H
    "khorinsky":    (52.047333, 109.780889),
    "kyrgyzstan":   (40.234333, 71.239667),
    # I
    "holuhraun":    (64.853111, -16.826667),
    "ouarkziz":     (28.300417, -10.566250),
    "djebel":       (28.300417, -10.566250),
    "etosha":       (-18.487556, 16.170722),
    "conesus":      (42.786389, -77.716139),
    "borgarbyggð":  (64.762889, -22.457778),
    "borgarbyggd":  (64.762889, -22.457778),
    # J
    "superior":     (46.686167, -90.386528),
    "karakaya":     (38.493806, 38.444306),
    "barrier reef": (-18.348694, 146.847611),
    # K
    "golmud":       (35.612861, 95.062750),
    "sirmilik":     (72.083639, -76.811917),
    # L
    "regina":       (50.211472, -104.727222),
    "xinjiang":     (40.067444, 77.666861),
    "nusantara":    (-0.971694, 116.699694),
    # M
    "tian shan":    (42.121222, 80.045583),
    "tianshan":     (42.121222, 80.045583),
    "potomac":      (38.775611, -78.402),
    "shenandoah":   (38.775611, -78.402),
    # N
    "araguaia":     (-12.945639, -50.495),
    "araguai":      (-12.945639, -50.495),
    "yapacani":     (-17.308250, -63.888611),
    # O
    "manicouagan":  (51.378444, -68.674222),
    "crater lake":  (42.936111, -122.101306),
    # P
    "riberalta":    (-10.879, -66.047778),
    "mackenzie":    (68.215111, -134.387583),
    # Q
    "tambora":      (-8.242028, 117.991889),
    "lonar":        (19.976889, 76.508500),
    # R
    "canyonlands":  (38.440778, -109.750917),
    "florida keys": (24.758444, -81.531556),
    "sondrio":      (46.293972, 9.420694),
    "menendez":     (-42.687472, -71.872694),
    "lago menendez":(-42.687472, -71.872694),
    # S
    "chapare":      (-16.934639, -65.229),
    "ndjamena":     (12.007694, 15.062833),
    "n'djamena":    (12.007694, 15.062833),
    "mackenzie river": (68.417, -134.143111),
    # T
    "lena":         (72.877861, 129.530972),
    "liwa":         (23.175, 53.797778),
    # U
    "bamforth":     (41.323889, -105.770361),
    # V
    "mapleton":     (46.544583, -68.251778),
    "padma":        (23.350750, 90.551917),
    "new south wales": (-34.286444, 150.825667),
    "cellina":      (46.111500, 12.757389),
    "meduna":       (46.111500, 12.757389),
    # W
    "primavera":    (5.449417, -69.799167),
    "ponoy":        (67.036361, 40.338583),
    # X
    "sermersooq":   (65.0, -40.0),
}

def dms_to_decimal(dms_str: str) -> float | None:
    """Parse '36°35'20.8 N' or '7°37'00.1"S' to decimal degrees."""
    dms_str = dms_str.strip().replace('"', "'").replace("''", "'")
    pattern = r"(\d+)°(\d+)'([\d.]+)['\"]?\s*([NSEW])"
    m = re.search(pattern, dms_str)
    if not m:
        return None
    deg = float(m.group(1))
    mins = float(m.group(2))
    secs = float(m.group(3))
    direction = m.group(4)
    decimal = deg + mins / 60 + secs / 3600
    if direction in ("S", "W"):
        decimal = -decimal
    return round(decimal, 6)

def find_coords(location: str):
    loc_lower = location.lower().replace("-", " ").replace("_", " ")
    for keyword, coords in NASA_COORDS.items():
        if keyword in loc_lower:
            return coords
    return None, None

def main():
    docs = list(db.collection("letters").stream())
    print(f"Found {len(docs)} letter documents\n")

    total_updated = 0
    total_skipped = 0
    total_failed = 0

    for doc in docs:
        data = doc.to_dict()
        images = data.get("images", [])
        changed = False

        for img in images:
            location = img.get("location", "")
            filename = img.get("filename", "")

            # Try matching from filename slug too
            slug = filename.replace(".png", "").replace(".webp", "").replace("-", " ").lower()
            combined = f"{location.lower()} {slug}"

            lat, lng = find_coords(combined)

            if lat is not None:
                if img.get("lat") == lat and img.get("lng") == lng:
                    total_skipped += 1
                    continue
                img["lat"] = lat
                img["lng"] = lng
                changed = True
                total_updated += 1
                print(f"  ✓ {location} → {lat}, {lng}")
            else:
                total_failed += 1
                print(f"  ✗ no match: '{location}' ({filename})")

        if changed:
            db.collection("letters").document(doc.id).update({"images": images})

    print(f"\n✓ Done. {total_updated} updated, {total_skipped} already set, {total_failed} unmatched.")

if __name__ == "__main__":
    main()
