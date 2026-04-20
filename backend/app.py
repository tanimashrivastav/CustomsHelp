from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import re
import json
import requests
import numpy as np
import cv2
from bs4 import BeautifulSoup
from google import genai
from ultralytics import YOLO

# -----------------------------
# YOLO model (load once)
# -----------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best.pt")
yolo = YOLO(MODEL_PATH)

app = FastAPI()

# Allow browser apps (Lovable UI) to call this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your Lovable domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Detection endpoints
# -----------------------------
class DetectRequest(BaseModel):
    urls: List[str]      # public image URLs
    imgsz: int = 512     # inference image size
    conf: float = 0.25   # confidence threshold


def _decode_image_bytes(content: bytes):
    data = np.frombuffer(content, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    return img


def _run_yolo_on_bgr(img_bgr, imgsz: int, conf: float) -> Dict[str, Any]:
    pred = yolo.predict(img_bgr, imgsz=imgsz, conf=conf, verbose=False)[0]
    h, w = img_bgr.shape[:2]

    dets = []
    if pred.boxes is not None and len(pred.boxes) > 0:
        boxes = pred.boxes.xyxy.cpu().numpy()
        confs = pred.boxes.conf.cpu().numpy()
        clss = pred.boxes.cls.cpu().numpy().astype(int)
        names = pred.names

        for (x1, y1, x2, y2), c, k in zip(boxes, confs, clss):
            dets.append({
                "class_id": int(k),
                "class_name": names[int(k)],
                "confidence": float(c),
                "bbox_xyxy": [float(x1), float(y1), float(x2), float(y2)]
            })

    return {"image_w": w, "image_h": h, "detections": dets}


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/detect")
def detect(req: DetectRequest):
    results = []
    for url in req.urls:
        try:
            r = requests.get(url, timeout=25)
            r.raise_for_status()
            img = _decode_image_bytes(r.content)
            if img is None:
                results.append({"url": url, "error": "Could not decode image"})
                continue
            out = _run_yolo_on_bgr(img, imgsz=req.imgsz, conf=req.conf)
            results.append({"url": url, **out})
        except Exception as e:
            results.append({"url": url, "error": f"{type(e).__name__}: {e}"})
    return {"results": results}


@app.post("/detect-file")
async def detect_file(file: UploadFile = File(...), imgsz: int = 512, conf: float = 0.25):
    content = await file.read()
    img = _decode_image_bytes(content)
    if img is None:
        return {"error": "Could not decode uploaded image"}
    out = _run_yolo_on_bgr(img, imgsz=imgsz, conf=conf)
    return out


# -----------------------------
# Agentic enrichment endpoint
# -----------------------------
class ObjectInfoRequest(BaseModel):
    class_name: str
    context: str = "airport"
    jurisdiction: str = "US"


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def _fetch_text(url: str, timeout: int = 20) -> str:
    try:
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        return _html_to_text(r.text)
    except Exception as e:
        return f"[FETCH_ERROR] {url} -> {type(e).__name__}: {e}"


def _plan_sources(class_name: str, jurisdiction: str) -> List[Dict[str, str]]:
    """
    Router/planner step: pick a small set of trusted sources to retrieve.
    """
    item = (class_name or "").lower().strip()
    sources: List[Dict[str, str]] = []

    if jurisdiction.upper() == "US":
        sources.append({
            "title": "TSA - What Can I Bring?",
            "url": "https://www.tsa.gov/travel/security-screening/whatcanibring/all"
        })

    if any(k in item for k in ["battery", "charger", "power", "portable", "lithium"]):
        sources.append({
            "title": "FAA - PackSafe Lithium Batteries",
            "url": "https://www.faa.gov/hazmat/packsafe/lithium-batteries"
        })

    if any(k in item for k in ["liquid", "water", "cosmetic", "gel", "toiletry"]):
        sources.append({
            "title": "TSA - Liquids Rule (3-1-1)",
            "url": "https://www.tsa.gov/travel/security-screening/liquids-rule"
        })

    return sources[:3]


def _extract_json_best_effort(text: str) -> Dict[str, Any]:
    """
    Try to parse JSON. If Gemini returns extra text, attempt to extract a JSON object.
    """
    text = (text or "").strip()
    try:
        return json.loads(text)
    except Exception:
        # Try to find the first {...} block
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
        return {
            "item": "",
            "summary": "Gemini returned a non-JSON response.",
            "travel_notes": "",
            "handling_guidance": "",
            "sources": [],
            "limitations": f"Raw output (truncated): {text[:600]}"
        }


def _call_gemini_for_json(item: str, context: str, jurisdiction: str, sources: List[Dict[str, str]], evidence: str) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return {
            "item": item,
            "summary": "",
            "travel_notes": "",
            "handling_guidance": "",
            "sources": sources,
            "limitations": "Server missing GEMINI_API_KEY environment variable."
        }

    client = genai.Client(api_key=api_key)

    prompt = f"""
Return ONLY valid JSON (no markdown, no extra text) using this schema:

{{
  "item": string,
  "summary": string,
  "travel_notes": string,
  "handling_guidance": string,
  "sources": [{{"title": string, "url": string}}],
  "limitations": string
}}

Rules:
- Use ONLY the EVIDENCE below.
- If the evidence does not mention something, say that in "limitations" instead of guessing.
- Keep each field concise (2-5 sentences max).

Inputs:
- item: {item}
- context: {context}
- jurisdiction: {jurisdiction}

SOURCES (copy exactly into the "sources" field):
{sources}

EVIDENCE:
{evidence}
"""

    # Agentic robustness: don't crash if Gemini errors (quota, network, etc.)
    try:
        resp = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )
        text = getattr(resp, "text", "") or ""
        out = _extract_json_best_effort(text)
        # Ensure sources are present even if model forgets
        out["item"] = out.get("item") or item
        out["sources"] = sources
        return out
    except Exception as e:
        return {
            "item": item,
            "summary": f"(Fallback) Gemini unavailable: {type(e).__name__}",
            "travel_notes": "",
            "handling_guidance": "",
            "sources": sources,
            "limitations": f"Gemini call failed: {str(e)[:200]}"
        }


@app.post("/object-info")
def object_info(req: ObjectInfoRequest):
    """
    Agentic endpoint:
    1) Plan sources (router)
    2) Retrieve evidence (fetch URLs)
    3) Synthesize structured answer (Gemini)
    4) Fallback if LLM fails
    """
    item = (req.class_name or "").strip()
    if not item:
        return {"error": "class_name is required"}

    sources = _plan_sources(item, req.jurisdiction)

    chunks: List[str] = []
    for s in sources:
        chunks.append(f"\n\n--- SOURCE: {s['title']} ({s['url']}) ---\n")
        txt = _fetch_text(s["url"])
        chunks.append(txt[:4000])  # keep evidence small

    evidence = "\n".join(chunks)

    return _call_gemini_for_json(
        item=item,
        context=req.context,
        jurisdiction=req.jurisdiction,
        sources=sources,
        evidence=evidence
    )
