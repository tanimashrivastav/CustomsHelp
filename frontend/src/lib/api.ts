import type { DetectionResponse, EnrichmentResponse, ImageSize } from "./types";

const STORAGE_KEY = "xray-api-base-url";
const DEFAULT_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url);
}

export async function checkHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function detectFile(
  file: File | Blob,
  filename: string,
  baseUrl: string,
  imgsz: ImageSize = 512,
  conf: number = 0.25,
): Promise<DetectionResponse> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch(`${baseUrl}/detect-file?imgsz=${imgsz}&conf=${conf}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Detection failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getObjectInfo(
  className: string,
  baseUrl: string,
): Promise<EnrichmentResponse> {
  const res = await fetch(`${baseUrl}/object-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ class_name: className, context: "airport", jurisdiction: "US" }),
  });
  if (!res.ok) throw new Error(`Enrichment failed: ${res.status}`);
  return res.json();
}

export function getMockEnrichment(className: string): EnrichmentResponse {
  return {
    summary: `${className} is a commonly carried item detected during baggage screening.`,
    travel_notes: `Check airline and TSA guidelines for specific rules about carrying ${className} in carry-on or checked luggage.`,
    handling_guidance: "No special handling required. Follow standard screening procedures.",
    sources: [
      { title: "TSA – What Can I Bring?", url: "https://www.tsa.gov/travel/security-screening/whatcanibring/all" },
    ],
  };
}
