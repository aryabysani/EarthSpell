# EarthSpell — Project Documentation

## What This App Does

EarthSpell transforms a user's name into visual art using real NASA Landsat satellite imagery. Each letter of the name is matched to a geographic location on Earth that visually resembles that letter shape when seen from space. Images are 100% real NASA satellite photos — not AI-generated.

**Live site**: https://earthspell.vercel.app  
**Creator**: Arya (aryabysani@gmail.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript 5.5.3 |
| Styling | Tailwind CSS 3.4.6 |
| Database | Firebase Firestore (server-side Admin SDK) |
| Storage | Firebase Cloud Storage |
| 3D Graphics | Three.js 0.184.0 |
| Fonts | Space Grotesk (sans), Fraunces (serif) |
| Deployment | Vercel |

---

## Project Structure

```
name map/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── letters/route.ts       # Fetches letter images from Firestore
│   │   │   └── og/route.tsx           # Generates Open Graph preview images
│   │   ├── layout.tsx                 # Root layout, fonts, metadata
│   │   ├── page.tsx                   # Main page — landing + results (1400+ lines)
│   │   └── globals.css                # Global styles, animations
│   ├── components/
│   │   ├── DownloadButton.tsx         # Canvas-based PNG export
│   │   ├── GlobeClient.tsx            # Three.js spinning globe (decorative)
│   │   ├── GlobePinMap.tsx            # Interactive globe with pins (built but hidden)
│   │   ├── LetterCard.tsx             # Individual letter card + lightbox
│   │   ├── NameDisplay.tsx            # Grid container for all letter cards
│   │   ├── NameInput.tsx              # Input field with random name button
│   │   ├── ShareButton.tsx            # Copy-link share
│   │   ├── EarthGlobe.tsx             # (Unused — CSS globe, replaced by GlobeClient)
│   │   └── Tooltip.tsx                # (Unused — not integrated yet)
│   ├── lib/
│   │   ├── firebase.ts                # Client-side Firebase config
│   │   └── firebaseAdmin.ts           # Server-side Firebase Admin SDK
│   └── types/
│       └── index.ts                   # TypeScript interfaces
├── scraper/                           # Python scripts to populate Firebase
│   ├── scrape.py                      # Scrapes NASA gallery
│   ├── compress_and_reupload.py       # PNG → WebP + upload to Storage
│   ├── patch_coordinates.py           # Adds lat/lng to metadata
│   ├── patch_exact_coords.py          # Refines coordinates
│   ├── patch_firestore_webp.py        # Updates Firestore with WebP URLs
│   ├── upload_video.py                # Uploads background video to Storage
│   ├── metadata.json                  # Scraped image metadata (270+ entries)
│   ├── downloaded_images/             # Original PNGs
│   └── compressed_images/             # Compressed WebPs
├── public/
│   ├── earth-bg.mp4                   # Background video (also on CDN)
│   └── og-image.png                   # Static fallback OG image
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                         # Firebase credentials (not in repo)
```

---

## Firebase Setup

**Project ID**: earthspell-34aed  
**Storage Bucket**: earthspell-34aed.firebasestorage.app

### Firestore Structure

Collection: `letters`  
Documents: one per letter A–Z  
Each document has a single `images` array field:

```typescript
interface LetterImage {
  url: string;          // Firebase Storage WebP URL
  filename: string;     // e.g. "a-0-hickman-Kentucky.webp"
  description: string;  // NASA description text
  location: string;     // Geographic location name
  lat: number | null;
  lng: number | null;
  detailUrl: string;    // Link to NASA source page
}
```

### Environment Variables

```bash
# Client-side (public)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Server-side (secret)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY   # PEM string with \n newlines
```

---

## How the App Works (End-to-End)

### 1. Landing Page

- Dark minimalist interface
- Earth video plays in background (served from Firebase Storage CDN)
- User types a name (max 12 chars, A–Z and spaces only)
- Input strips invalid characters in real-time

### 2. Submission & Transition

- On submit (or via `?name=JOHN` URL param):
  - `zooming` state activates
  - Earth video scales to 2.8×, becomes brighter/saturated
  - Dark overlay fades in over ~900ms
  - View transitions from landing to results

### 3. API Call — `/api/letters`

```
GET /api/letters?chars=J,O,H,N
```

- Server queries Firestore for each unique letter
- `pickImage()` randomly selects one image per letter, avoiding duplicates within the same name
- Returns array of `LetterResult` with image + all variants
- Cached: `maxage=3600, stale-while-revalidate=86400`

Response shape:
```typescript
{
  results: [
    {
      char: "J",
      image: LetterImage,
      variants: LetterImage[]   // all other images for this letter
    },
    ...
  ]
}
```

### 4. Results View

Displays letter cards in a flex row. Each `LetterCard` shows:
- Satellite photo (cover-fit crop)
- Gold corner tick marks
- Index badge (01, 02…)
- Letter overlay (bottom-left, large serif)
- Location name below card
- DMS-format coordinates (clickable → Google Maps)
- Staggered rise-in animation (80ms delay per card)
- Hover/click to expand card (wider + taller info box)
- Click photo → fullscreen lightbox modal

Action buttons:
- **Shuffle** — re-picks images for each letter, avoids recently-used filenames
- **Download** — renders canvas PNG, triggers download
- **Share** — copies `?name=JOHN` URL to clipboard

---

## Key Algorithms

### Image Selection (server-side)

```typescript
function pickImage(images: LetterImage[], usedFilenames: Set<string>) {
  const unused = images.filter(img => !usedFilenames.has(img.filename));
  const pool = unused.length ? unused : images;
  const image = pool[Math.floor(Math.random() * pool.length)];
  if (image?.filename) usedFilenames.add(image.filename);
  return image ?? null;
}
```

Ensures no duplicate images appear in a single name. Falls back to full pool if all images are exhausted.

### Shuffle (client-side)

Maintains a per-letter `Map<char, Set<filenames>>` of recently-used images. On shuffle, picks from unused variants first, then falls back to full pool.

### Coordinate Display (DMS format)

```typescript
function toDMS(deg: number, posDir: string, negDir: string) {
  const d = Math.abs(deg);
  const degrees = Math.floor(d);
  const minutes = Math.floor((d - degrees) * 60);
  const seconds = (((d - degrees) * 60 - minutes) * 60).toFixed(1);
  return `${degrees}°${minutes}'${seconds}" ${deg >= 0 ? posDir : negDir}`;
}
// Example: 41°45'30.5" N
```

### Lat/Lng → 3D Sphere (GlobePinMap)

```typescript
function latLngToVec3(lat: number, lng: number, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}
```

---

## Download Feature (DownloadButton.tsx)

Canvas layout: `320px` card width, `80px` text area, `24px` padding, `12px` gaps.

Per card, draws:
1. Cover-fit satellite image (centered crop)
2. Dark gradient over bottom 45% of photo
3. Gold corner tick marks
4. White serif letter (bottom-left)
5. Index badge top-left (gold)
6. Location name below photo
7. DMS coordinates (gold, monospace)

Final canvas:
- Watermark: `earthspell.vercel.app` — white, bold, bottom-right
- Exported as PNG blob → browser download

Images fetched via `/_next/image?url=...&w=640&q=95` proxy to avoid CORS issues with Firebase Storage.

---

## OG Image Generation (/api/og)

- Endpoint: `GET /api/og?name=JOHN`
- Runtime: Node.js (not Edge)
- Output: 1200×630px PNG
- Renders first 8 letters as card strip
- Uses `next/og` (ImageResponse)
- Falls back gracefully to text-only if Firestore is unavailable

---

## Styling & Design

### Colors

| Name | Value |
|---|---|
| Background | #000000 |
| Gold accent | #c9a84c (`--gold`) |
| Gold dark | #7a6030 |
| Gold faint | rgba(201,168,76,0.12) |

### Typography

- **Fraunces** — display serif, used for large headings and letter overlays
- **Space Grotesk** — clean sans-serif, used for body and UI

### Animations (globals.css)

| Name | Description | Duration |
|---|---|---|
| `shimmer` | Loading skeleton pulse | 1.8s loop |
| `rise` | Cards rising up on load | 500ms ease |
| `glow-pulse` | Subtle glow effect | 5s |
| `orbit-spin` | Spinning orbit ring | 80s / 55s |

### Responsive

- Heavy use of `clamp()` for fluid type sizes
- `min()` for responsive max-widths
- Cards scale with viewport — name heading resizes based on character count
- Tailwind `sm:` breakpoint (640px+) for layout changes

---

## Scraper Tools (Python)

Located in `scraper/`. Used to populate Firebase with NASA image data. **Not part of the web app build** — run manually when adding new images.

| Script | Purpose |
|---|---|
| `scrape.py` | Scrapes NASA gallery, downloads PNGs, writes metadata.json |
| `compress_and_reupload.py` | Converts PNG → WebP, uploads to Firebase Storage |
| `patch_coordinates.py` | Adds lat/lng to metadata entries |
| `patch_exact_coords.py` | Refines coordinate data |
| `patch_firestore_webp.py` | Updates Firestore documents with WebP Storage URLs |
| `upload_video.py` | Uploads Earth background video to Storage |

NASA source: `science.nasa.gov/gallery/your-name-in-landsat-gallery`

---

## Image Hosting

- **Source**: NASA Landsat gallery (public domain)
- **Storage**: Firebase Cloud Storage
- **Format**: WebP (compressed from original PNG)
- **URL pattern**: `https://storage.googleapis.com/earthspell-34aed.firebasestorage.app/{letter}-{index}-{location}.webp`
- **Next.js config**: Allows `storage.googleapis.com/earthspell-34aed.firebasestorage.app/**`, output format WebP only

---

## Input Constraints

- Max name length: 12 characters
- Allowed chars: A–Z (uppercase), space
- Invalid characters stripped automatically on input
- URL param `?name=JOHN` pre-populates and auto-submits

---

## Known Unused Code

- `EarthGlobe.tsx` — CSS-based globe, replaced by Three.js `GlobeClient`
- `Tooltip.tsx` — built but not wired up
- `GlobePinMap.tsx` — interactive globe with coordinate pins, implemented but not shown on results page
- `html-to-image` / `html2canvas` — npm packages installed but not used (canvas-based download used instead)

---

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Deployment

- **Platform**: Vercel
- **Branch**: `main` → auto-deploys
- **Site**: https://earthspell.vercel.app
- Environment variables set in Vercel dashboard

---

## Recent Git History (notable changes)

- Added fullscreen lightbox on image tap
- Removed globe pin map from results page (code preserved)
- Added zoom-into-Earth transition on name submit
- Random name button
- Open Graph image generation
- Canvas PNG download with coordinates and watermark
- Mobile-responsive typography with `clamp()`
- Background video served from Firebase CDN
