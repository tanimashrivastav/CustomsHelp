# X-Ray Item Detector (Gallery-First)

A dark-themed, single-page dashboard for selecting bundled X-ray sample images (inside the Lovable app), running YOLO detection via a local API, and optionally fetching AI enrichment details for flagged items.

---

## 1. Overall Layout & Theme

- **Dark theme** with security/operations aesthetic — dark gray backgrounds, neon accents
- **Three-panel layout**:
  - Left sidebar: Source, Settings, Actions
  - Center: Image Viewer + Detection List
  - Right sidebar: Detection Details + Enrichment
- Responsive: panels collapse/stack on smaller screens

---

## 2. Left Panel — Source Picker, Settings, Actions

### A) Source Picker (Gallery-first)
- Default mode: **Gallery**
  - Show a small grid or dropdown of **bundled sample images** shipped with the app (e.g., 8–20 samples)
  - Each sample has a thumbnail + filename label
  - Selecting a sample updates the center viewer immediately
- Optional secondary modes (can be hidden behind an “Advanced” toggle):
  - **Upload**: single file upload (`.png`, `.jpg`, `.jpeg`)
  - **URL**: paste an image URL (advanced, may fail depending on CORS/hosting)

### B) API Configuration
- **API Base URL** input field, persisted to localStorage
  - Default: `http://127.0.0.1:8000`
  - Clear helper text: “If app is deployed, localhost will not work—use a public API URL.”
- Show connection status indicator:
  - “Connected” if `/health` returns ok
  - “Not reachable” otherwise

### C) Detection / Flagging Settings
- **Flag Threshold slider**:
  - range 0.15–0.90
  - default 0.25
  - live numeric display
- **"Show only flagged" toggle** (default ON)
- **Flagged Allowlist** display (read-only for now; editable later):
  - `["gun", "knife", "scissors", "pliers", "wrench", "razor", "blade", "weapon"]`

### D) Actions
- **Run Detection** button (runs on the currently selected single image)
- Status indicator: idle → fetching image → uploading → detecting → done → error

---

## 3. Center Panel — Image Viewer (Single Image Focus)

- **Main image display** for the currently selected sample/uploaded image
- Canvas overlay to draw bounding boxes scaled correctly using `image_w` / `image_h` from API response
- Box styling:
  - **Flagged**: bold red/orange border + “FLAGGED” badge
  - **Not flagged**: subtle outline
- Click interactions:
  - Clicking a bounding box selects that detection and populates the right panel
  - Clicking a detection in the list selects and highlights the corresponding box
- Empty states:
  - No image selected → prompt to choose a sample
  - No detections → show “No detections”
  - Detections exist but none flagged → show “No flagged items”

---

## 4. Detection List (for the selected image)

- Scrollable list below/next to viewer for the current image
- Each row shows:
  - class name
  - confidence %
  - flagged badge if applicable
- Respects “Show only flagged” toggle
- Selecting a row highlights the corresponding bounding box and updates right panel

---

## 5. Right Panel — Detection Details & Enrichment (Agentic AI-ready)

### A) Detection Details (always shown when a detection is selected)
- Class name
- Confidence
- Flagged/not-flagged status badge
- Category label (future-proof):
  - threat / benign / unknown
  - (For now, likely threat/unknown; later expands when model gains more classes)

### B) Enrichment Section (only when flagged)
- Visible only if selected detection is **FLAGGED**
- Button: **Get Details**
  - Calls the agentic enrichment endpoint
  - Shows loading state while fetching
  - Renders:
    - danger level (color-coded)
    - summary
    - typical airport/security consequences
    - handling guidance
    - sources (links list)
- If enrichment endpoint not available:
  - show mocked placeholder response clearly labeled “Mocked”

### C) Non-flagged behavior
- If not flagged:
  - hide/disable enrichment section
  - show message: “Not flagged—enrichment disabled.”

---

## 6. Flagging Logic (Client-side Only)

Important: The API does NOT return `flagged/suspicious`. The UI computes it.

- Define:
  - `userThreshold` (default 0.25, min 0.15)
  - `flaggedAllowlist` as above
- A detection is **FLAGGED** when:
  - `confidence >= userThreshold` AND `class_name` is in `flaggedAllowlist`
- Centralize this logic in one place in the UI so future changes are easy.

---

## 7. API Integration (How requests should work)

### A) Health Check
- `GET {API_BASE_URL}/health`
- Used to show “Connected / Not reachable” status

### B) Detection (Primary path: Gallery + Upload uses /detect-file)
- Endpoint: `POST {API_BASE_URL}/detect-file`
- For Gallery samples:
  - UI must **fetch the bundled sample image** (local app asset) → convert to Blob → send as multipart FormData
  - This avoids needing public URLs and avoids CORS issues
- For Upload:
  - send selected file as multipart FormData
- Query params:
  - `imgsz=512` (default)
  - `conf=0.25` (default inference conf; separate from UI flag threshold)

Expected response JSON:
```json
{
  "filename": "image.png",
  "image_w": 2048,
  "image_h": 2048,
  "detections": [
    {
      "class_id": 0,
      "class_name": "knife",
      "confidence": 0.87,
      "bbox_xyxy": [x1, y1, x2, y2]
    }
  ]
}
### C) Enrichment (Agentic AI endpoint)

POST {API_BASE_URL}/object-info

Body:

{
  "class_name": "knife",
  "context": "airport",
  "jurisdiction": "US"
}
Response:

{
  "danger_level": "low/medium/high",
  "summary": "...",
  "typical_consequences": "...",
  "handling_guidance": "...",
  "sources": [{"title":"...","url":"..."}]
}


Called only for FLAGGED detections