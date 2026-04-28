"""
After compress_and_reupload.py runs, this script updates every Firestore
image document to point to the new .webp URL instead of the old .png URL.
Run from the scraper/ directory:
    python patch_firestore_webp.py
"""
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})
db = firestore.client()

BUCKET = "earthspell-34aed.firebasestorage.app"

def png_url_to_webp(url: str) -> str:
    """
    https://storage.googleapis.com/bucket/landsat-letters/a-0-foo.png
    → https://storage.googleapis.com/bucket/landsat-letters/a-0-foo.webp
    """
    if url.endswith(".png"):
        return url[:-4] + ".webp"
    return url

def main():
    letters_ref = db.collection("letters")
    docs = letters_ref.stream()
    updated_total = 0

    for doc in docs:
        data = doc.to_dict()
        images = data.get("images", [])
        changed = False

        for img in images:
            old_url = img.get("url", "")
            new_url = png_url_to_webp(old_url)
            if new_url != old_url:
                img["url"] = new_url
                changed = True

        if changed:
            letters_ref.document(doc.id).update({"images": images})
            print(f"  Updated {doc.id}: {len(images)} images → .webp URLs")
            updated_total += len(images)

    print(f"\n✓ Done. Updated {updated_total} image URLs to .webp.")

if __name__ == "__main__":
    main()
