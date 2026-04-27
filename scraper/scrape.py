import requests
from bs4 import BeautifulSoup
import os
import json
import time
import re
import firebase_admin
from firebase_admin import credentials, firestore, storage

# -----------------------------------------------------------------------
# FIREBASE INIT
# -----------------------------------------------------------------------
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})
db = firestore.client()
bucket = storage.bucket()

# -----------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------
BASE_URL = "https://science.nasa.gov/gallery/your-name-in-landsat-gallery"
PAGES = [1, 2]
IMG_DIR = "./downloaded_images"
os.makedirs(IMG_DIR, exist_ok=True)
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; EarthSpell-Scraper/1.0)"}

# -----------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------

def parse_filename(src: str) -> dict:
    """
    Extract letter and location slug from image filename.
    e.g. 'a-0-hickman-Kentucky.png' → {letter: 'A', location: 'Hickman Kentucky'}
    """
    filename = src.split("/")[-1].split("?")[0]
    parts = filename.replace(".png", "").split("-")
    letter = parts[0].upper()
    location_slug = " ".join(parts[2:]).title() if len(parts) > 2 else ""
    return {"letter": letter, "filename": filename, "location": location_slug}


def download_image(url: str, filename: str) -> str:
    """Download image to local disk. Skip if already exists."""
    clean_url = url.split("?")[0]
    filepath = os.path.join(IMG_DIR, filename)
    if os.path.exists(filepath):
        print(f"  Skipping (exists): {filename}")
        return filepath
    res = requests.get(clean_url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    with open(filepath, "wb") as f:
        f.write(res.content)
    print(f"  Downloaded: {filename}")
    return filepath


def upload_to_firebase(local_path: str, filename: str) -> str:
    """Upload image to Firebase Storage and return public URL."""
    destination = f"landsat-letters/{filename}"
    blob = bucket.blob(destination)
    if blob.exists():
        blob.make_public()
        return blob.public_url
    blob.upload_from_filename(local_path, content_type="image/png")
    blob.make_public()
    print(f"  Uploaded to Firebase: {filename}")
    return blob.public_url


def scrape_page(page_num: int) -> list:
    """Scrape one paginated gallery page and return list of image entries."""
    url = BASE_URL if page_num == 1 else f"{BASE_URL}/page/{page_num}/"
    print(f"\nFetching page {page_num}: {url}")
    
    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")

    entries = []
    
    # Find all anchor tags that contain an img tag pointing to Landsat images
    for a_tag in soup.find_all("a", href=True):
        img_tag = a_tag.find("img")
        if not img_tag:
            continue
        
        src = img_tag.get("src", "")
        if "your-name-in-landsat-images" not in src:
            continue
        # skip CMS rendition URLs — use the raw .png only
        if "jcr:content" in src:
            continue
        
        alt = img_tag.get("alt", "")
        detail_url = a_tag.get("href", "")
        
        # Get the caption text (text inside the <a> before the <img>)
        description = a_tag.get_text(separator=" ").strip()
        
        parsed = parse_filename(src)
        
        entries.append({
            "letter": parsed["letter"],
            "filename": parsed["filename"],
            "imageUrl": src.split("?")[0],
            "alt": alt,
            "description": description or alt,
            "location": parsed["location"],
            "detailUrl": detail_url,
        })
    
    print(f"  Found {len(entries)} images on page {page_num}")
    return entries


def get_coordinates_from_detail_page(detail_url: str) -> dict:
    """
    Optionally visit the detail page to extract coordinates.
    Returns {"lat": float, "lng": float} or empty dict if not found.
    """
    if not detail_url:
        return {}
    try:
        res = requests.get(detail_url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(res.text, "html.parser")
        text = soup.get_text()
        # Look for coordinate patterns like "36.5° N, 89.2° W" or "36.5, -89.2"
        pattern = r"(-?\d{1,3}\.\d+)[°\s]*([NS])[,\s]+(-?\d{1,3}\.\d+)[°\s]*([EW])"
        match = re.search(pattern, text)
        if match:
            lat = float(match.group(1))
            lng = float(match.group(3))
            if match.group(2) == "S":
                lat = -lat
            if match.group(4) == "W":
                lng = -lng
            return {"lat": lat, "lng": lng}
    except Exception as e:
        print(f"    Could not get coords from {detail_url}: {e}")
    return {}


# -----------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------

def main():
    all_entries = []

    # 1. Scrape all pages
    for page_num in PAGES:
        entries = scrape_page(page_num)
        all_entries.extend(entries)
        time.sleep(1.5)  # be polite between requests

    # Deduplicate by filename (page 2 repeats some A entries)
    seen = set()
    unique_entries = []
    for e in all_entries:
        if e["filename"] not in seen:
            seen.add(e["filename"])
            unique_entries.append(e)
    all_entries = unique_entries

    print(f"\nTotal unique images scraped: {len(all_entries)}")

    # 2. Save local backup
    with open("metadata.json", "w") as f:
        json.dump(all_entries, f, indent=2)
    print("Saved metadata.json locally")

    # 3. Group by letter
    by_letter = {}
    for entry in all_entries:
        letter = entry["letter"]
        if letter not in by_letter:
            by_letter[letter] = []
        by_letter[letter].append(entry)

    # 4. For each letter: download → upload → seed Firestore
    for letter, images in sorted(by_letter.items()):
        print(f"\nProcessing letter {letter} ({len(images)} images)")
        firestore_images = []

        for img in images:
            try:
                # Download
                local_path = download_image(img["imageUrl"], img["filename"])
                time.sleep(0.3)

                # Upload to Firebase Storage
                public_url = upload_to_firebase(local_path, img["filename"])

                # Optionally get coordinates
                coords = get_coordinates_from_detail_page(img["detailUrl"])
                time.sleep(0.5)

                firestore_images.append({
                    "url": public_url,
                    "filename": img["filename"],
                    "description": img["description"],
                    "location": img["location"],
                    "detailUrl": img["detailUrl"],
                    "lat": coords.get("lat"),
                    "lng": coords.get("lng"),
                })

            except Exception as e:
                print(f"  ERROR with {img['filename']}: {e}")
                continue

        # Write to Firestore: collection "letters", doc = the letter
        db.collection("letters").document(letter).set({
            "letter": letter,
            "images": firestore_images,
            "count": len(firestore_images),
        })
        print(f"  Saved {len(firestore_images)} images to Firestore for {letter}")

    print("\n✓ Scraper complete. All data in Firebase.")


if __name__ == "__main__":
    main()
