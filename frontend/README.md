# Frontend (Lovable)

This UI is built in Lovable and calls the backend API.

## Required Backend Endpoints
- GET /health
- POST /detect-file (multipart file upload)
- POST /object-info (optional Gemini enrichment; may fallback)

## Config
In the UI, set:
- API Base URL = your ngrok HTTPS URL (recommended) OR http://127.0.0.1:8000 (only if the UI is running locally)

## Notes
If Lovable code export is available, put the exported code in this folder.
Otherwise, keep screenshots + the final Lovable prompt(s) here for reproducibility.
