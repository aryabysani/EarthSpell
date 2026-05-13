"""
Updates all Firestore image URLs from Firebase Storage to Vercel-hosted paths.
Run from the scraper/ directory:
    python patch_vercel_urls.py
"""
import firebase_admin
from firebase_admin import credentials, firestore
import re

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})
db = firestore.client()

def to_vercel_url(url: str) -> str:
    filename = url.split("/")[-1]
    if not filename.endswith(".webp"):
        filename = filename.rsplit(".", 1)[0] + ".webp"
    return f"/landsat/{filename}"

def main():
    letters_ref = db.collection("letters")
    updated_total = 0

    for doc in letters_ref.stream():
        data = doc.to_dict()
        images = data.get("images", [])
        changed = False

        for img in images:
            old_url = img.get("url", "")
            if "firebasestorage" in old_url or "storage.googleapis.com" in old_url or "earthspell.vercel.app" in old_url:
                img["url"] = to_vercel_url(old_url)
                changed = True

        if changed:
            letters_ref.document(doc.id).update({"images": images})
            print(f"  Updated {doc.id}: {len(images)} images")
            updated_total += len(images)

    print(f"\n✓ Done. Updated {updated_total} image URLs to Vercel.")

if __name__ == "__main__":
    main()
