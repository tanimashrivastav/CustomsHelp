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
import onnxruntime as ort
from bs4 import BeautifulSoup
from google import genai

# -----------------------------
# ONNX model (load once)
# -----------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best.onnx")
CLASS_NAMES = ["0", "1", "2", "3", "4"]

_session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
_input_name = _session.get_inputs()[0].name

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Detection helpers
# -----------------------------
def _preprocess(img_bgr: np.ndarray, imgsz: int) -> np.ndarray:
    img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (imgsz, imgsz))
    img = img.astype(np.float32) / 255.0
    return np.expand_dims(img.transpose(2, 0, 1), 0)  # BCHW


def _postprocess(output: np.ndarray, orig_w: int, orig_h: int, imgsz: int, conf_thresh: float) -> List[Dict]:
    # YOLOv8 ONNX output: (1, 9, 5376) -> transpose to (5376, 9)
    pred = output[0].transpose(1, 0)  # (num_anchors, 4 + num_classes)
    boxes_cxcywh = pred[:, :4]
    class_scores = pred[:, 4:]

    class_ids = np.argmax(class_scores, axis=1)
    confidences = np.max(class_scores, axis=1)

    mask = confidences >= conf_thresh
    boxes_cxcywh = boxes_cxcywh[mask]
    confidences = confidences[mask]
    class_ids = class_ids[mask]

    if len(confidences) == 0:
        return []

    # cx,cy,w,h (model coords) -> x1,y1,w,h for NMS
    x1 = boxes_cxcywh[:, 0] - boxes_cxcywh[:, 2] / 2
    y1 = boxes_cxcywh[:, 1] - boxes_cxcywh[:, 3] / 2
    nms_boxes = np.stack([x1, y1, boxes_cxcywh[:, 2], boxes_cxcywh[:, 3]], axis=1)

    indices = cv2.dnn.NMSBoxes(nms_boxes.tolist(), confidences.tolist(), conf_thresh, 0.45)
    if len(indices) == 0:
        return []

    scale_x = orig_w / imgsz
    scale_y = orig_h / imgsz
    detections = []
    for i in indices.flatten():
        cx, cy, w, h = boxes_cxcywh[i]
        x1 = (cx - w / 2) * scale_x
        y1 = (cy - h / 2) * scale_y
        x2 = (cx + w / 2) * scale_x
        y2 = (cy + h / 2) * scale_y
        detections.append({
            "class_id": int(class_ids[i]),
            "class_name": CLASS_NAMES[int(class_ids[i])],
            "confidence": float(confidences[i]),
            "bbox_xyxy": [float(x1), float(y1), float(x2), float(y2)],
        })
    return detections


def _decode_image_bytes(content: bytes) -> np.ndarray:
    data = np.frombuffer(content, dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def _run_onnx(img_bgr: np.ndarray, imgsz: int, conf: float) -> Dict[str, Any]:
    h, w = img_bgr.shape[:2]
    blob = _preprocess(img_bgr, imgsz)
    outputs = _session.run(None, {_input_name: blob})
    dets = _postprocess(outputs[0], w, h, imgsz, conf)
    return {"image_w": w, "image_h": h, "detections": dets}


# -----------------------------
# Detection endpoints
# -----------------------------
class DetectRequest(BaseModel):
    urls: List[str]
    imgsz: int = 512
    conf: float = 0.25


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
            out = _run_onnx(img, imgsz=req.imgsz, conf=req.conf)
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
    return _run_onnx(img, imgsz=imgsz, conf=conf)


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
    text = (text or "").strip()
    try:
        return json.loads(text)
    except Exception:
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

    try:
        resp = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )
        text = getattr(resp, "text", "") or ""
        out = _extract_json_best_effort(text)
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
    item = (req.class_name or "").strip()
    if not item:
        return {"error": "class_name is required"}

    sources = _plan_sources(item, req.jurisdiction)
    chunks: List[str] = []
    for s in sources:
        chunks.append(f"\n\n--- SOURCE: {s['title']} ({s['url']}) ---\n")
        chunks.append(_fetch_text(s["url"])[:4000])

    evidence = "\n".join(chunks)
    return _call_gemini_for_json(
        item=item,
        context=req.context,
        jurisdiction=req.jurisdiction,
        sources=sources,
        evidence=evidence
    )
