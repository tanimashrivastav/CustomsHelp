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
```

# Agentic Triage and Automated Valuation of Stealth Luxury in Customs Enforcement

## Abstract
Customs agencies globally face a multi-billion dollar revenue gap due to the manual valuation of "stealth luxury"—high-value collectibles that appear ordinary in X-ray scans. We propose CustomHelp, a hybrid AI framework that combines real-time computer vision with agentic reasoning. This system automates the transition from object detection to fair-market appraisal, increasing revenue recovery while reducing human discretion and bureaucratic corruption.

## 1. The Problem: The Valuation Gap
Current customs enforcement relies on human officers to identify and value millions of items daily. This leads to three systemic failures:

- Revenue Leakage: High-value items (e.g., $50k+ designer toys) are often misclassified as low-value gifts.

- Corruption: High levels of officer discretion in valuation create opportunities for bribery and "negotiated" duties.

- Operational Bottlenecks: Manual research into niche luxury markets takes 20+ minutes per item, causing significant transit delays.

## 2. Proposed Solution: Hybrid Intelligence
The CustomHelp architecture bifurcates the labor between speed and depth:

Local Triage (ML): A YOLOv11 model serves as the high-speed "eyes." It scans raw imagery to identify suspicious material densities and geometric silhouettes associated with luxury categories.

Autonomous Appraisal (Agentic AI): A multi-agent system serves as the "brain." Once an anomaly is flagged, the agent performs real-time research across global marketplaces and legal HTS databases to generate a verified appraisal report.

## 3. System Architecture

- Edge Layer: YOLOv11 running locally for immediate image categorization.

- Reasoning Layer: LangGraph-based agents that execute search tool-calling to identify specific models and limited-edition releases.

- Output Layer: A digital audit trail that logs every flag and valuation, ensuring total transparency and immutability for institutional auditing.

## 4. Implementation Obstacles
Development is currently constrained by:

- Data Scarcity: Public X-ray datasets for luxury goods do not exist.

- Cost & Time: Generating physical X-ray scans of $50k+ items is logistically and financially prohibitive for initial training.

## 5. Incremental Development Approach
To bypass data limitations, we are utilizing a "Proxy-to-Product" roadmap:

- Phase 1 (Functional Proxy): Training the architecture on existing security datasets (weapons/threats) to prove the end-to-end logic of the triage-to-agent handoff.

- Phase 2 (Synthetic Generation): Developing a pipeline to create synthetic X-ray data using 3D CAD models of luxury items.

- Phase 3 (Transfer Learning): Migrating the validated architecture from weapon detection to luxury identification once the synthetic library is robust.

## Next Steps
Our immediate focus is the refinement of the LangGraph agent to handle high-variance market data. Future work will explore the integration of a professional dashboard for live-site testing at high-volume ports of entry.
