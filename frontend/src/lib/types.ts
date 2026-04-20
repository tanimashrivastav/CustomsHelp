export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox_xyxy: [number, number, number, number];
}

export interface DetectionResponse {
  filename: string;
  image_w: number;
  image_h: number;
  detections: Detection[];
}

export interface EnrichmentResponse {
  summary: string;
  travel_notes: string;
  handling_guidance: string;
  sources: { title: string; url: string }[];
}

export interface IndexedDetection extends Detection {
  index: number;
}

export interface ImageResult {
  id: string;
  name: string;
  src: string;
  response?: DetectionResponse;
  detections: IndexedDetection[];
  status: "idle" | "fetching" | "uploading" | "detecting" | "done" | "error";
  error?: string;
}

export type SourceMode = "gallery" | "upload" | "url";
export type ImageSize = 416 | 512 | 640;
