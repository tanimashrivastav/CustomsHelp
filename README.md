# X-Ray Item Detector (Monorepo)

This project is a simple end-to-end prototype:
- **Backend (FastAPI + YOLO):** runs object detection on X-ray images and returns bounding boxes + class/confidence.
- **Frontend (Lovable):** uploads/selects images and renders detections.
- **Agentic AI (Gemini, optional):** enriches detected item info (may fallback if quota/billing is unavailable).
- **Notebook (Colab):** trains YOLO and produces `best.pt`.

## Repo Structure
- `backend/`  FastAPI server + YOLO weights
- `frontend/` Lovable UI (export or documentation)
- `notebooks/` Training notebook(s)
- `docs/` Additional documentation (API, demo steps)

## Quickstart (Backend)
```bash
cd backend
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000

