# CustomsHelp

An end-to-end AI prototype for detecting and valuing **"stealth luxury"** items in X-ray scans — helping customs agencies recover revenue and reduce officer discretion.

It combines a YOLOv11 vision model for real-time object detection with a LangGraph multi-agent system for automated marketplace appraisal.

---

## The Problem

Customs agencies lose billions annually because:
- High-value items (e.g., $50k+ designer collectibles) are misclassified as low-value gifts
- Manual valuation takes 20+ minutes per item, creating transit bottlenecks
- Officer discretion in valuation creates corruption risk

---

## Solution: Hybrid Intelligence Pipeline

| Layer | Component | Role |
|---|---|---|
| Edge | YOLOv11 | Rapid image triage — flags suspicious silhouettes and material densities |
| Reasoning | LangGraph agents | Searches global marketplaces + HTS databases to generate appraisal reports |
| Output | Audit trail | Immutable log of every flag and valuation for institutional oversight |

---

## Repo Structure

```
backend/      FastAPI server + YOLO weights
frontend/     Lovable UI (image upload + detection visualization)
notebooks/    YOLO training notebooks (Colab)
docs/         API docs and demo steps
```

---

## Quickstart

```bash
cd backend
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

Optional: set your Gemini API key to enable item enrichment via the agentic layer.

---

## Development Roadmap

**Phase 1 — Functional Proxy** *(current)*
Train the triage-to-agent pipeline on existing security datasets (weapons/threats) to validate the end-to-end architecture.

**Phase 2 — Synthetic Data Generation**
Build a pipeline to generate synthetic X-ray imagery from 3D CAD models of luxury items.

**Phase 3 — Transfer Learning**
Migrate the validated architecture from weapon detection to luxury item identification.

---

## Known Constraints

- No public X-ray datasets exist for luxury goods
- Generating real scans of high-value items is cost-prohibitive at this stage

---

## Tech Stack

- **Backend**: FastAPI, YOLOv11, Python
- **Frontend**: Lovable
- **Agentic AI**: LangGraph, Gemini
- **Training**: Google Colab
