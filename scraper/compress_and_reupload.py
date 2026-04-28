"""
Compress all downloaded Landsat images to ~800px wide WebP
and re-upload to Firebase Storage, replacing the originals.
Run from the scraper/ directory:
    pip install pillow firebase-admin
    python compress_and_reupload.py
"""
import os
from pathlib import Path
from PIL import Image
import firebase_admin
from firebase_admin import credentials, storage

# ── Firebase init ────────────────────────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})
bucket = storage.bucket()

# ── Config ───────────────────────────────────────────────────
IMG_DIR = Path("./downloaded_images")
OUT_DIR = Path("./compressed_images")
OUT_DIR.mkdir(exist_ok=True)

MAX_WIDTH = 800       # px — cards are 208px wide, 800 is plenty sharp on retina
QUALITY   = 82        # WebP quality (0–100)

def compress(src: Path) -> Path:
    dst = OUT_DIR / (src.stem + ".webp")
    if dst.exists():
        print(f"  skip (exists): {dst.name}")
        return dst
    with Image.open(src) as img:
        # keep aspect ratio
        w, h = img.size
        if w > MAX_WIDTH:
            h = int(h * MAX_WIDTH / w)
            w = MAX_WIDTH
            img = img.resize((w, h), Image.LANCZOS)
        img.save(dst, "WEBP", quality=QUALITY, method=6)
    original_kb = src.stat().st_size // 1024
    compressed_kb = dst.stat().st_size // 1024
    print(f"  {src.name}: {original_kb}KB → {compressed_kb}KB ({dst.name})")
    return dst

def upload(local: Path, remote_name: str):
    destination = f"landsat-letters/{remote_name}"
    blob = bucket.blob(destination)
    blob.upload_from_filename(str(local), content_type="image/webp")
    blob.make_public()
    print(f"  uploaded: {remote_name} → {blob.public_url}")
    return blob.public_url

def main():
    pngs = sorted(IMG_DIR.glob("*.png"))
    print(f"Found {len(pngs)} images to compress\n")

    for src in pngs:
        print(f"Processing {src.name}")
        compressed = compress(src)
        # Upload with .webp extension so the URL changes
        upload(compressed, compressed.name)

    print("\n✓ All images compressed and re-uploaded as WebP.")
    print("\nNOTE: You need to re-run the main scraper (scrape.py) with")
    print("a small edit to store .webp URLs instead of .png URLs,")
    print("OR run the patch script below to update Firestore URLs.")

if __name__ == "__main__":
    main()
