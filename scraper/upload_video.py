"""Upload earth-bg.mp4 to Firebase Storage and print the public URL."""
import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "earthspell-34aed.firebasestorage.app"
})

bucket = storage.bucket()
blob = bucket.blob("earth-bg.mp4")
blob.upload_from_filename(
    "../public/earth-bg.mp4",
    content_type="video/mp4",
)
blob.make_public()
print(blob.public_url)
