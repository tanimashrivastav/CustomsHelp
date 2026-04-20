import type { DetectionResponse, EnrichmentResponse, ImageSize } from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/_/backend";

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function detectFile(
  file: File | Blob,
  filename: string,
  imgsz: ImageSize = 512,
  conf: number = 0.25,
): Promise<DetectionResponse> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch(`${API_BASE_URL}/detect-file?imgsz=${imgsz}&conf=${conf}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Detection failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getObjectInfo(className: string): Promise<EnrichmentResponse> {
  const res = await fetch(`${API_BASE_URL}/object-info`, {
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
