import type { Detection, IndexedDetection } from "./types";

export const DEFAULT_CONF_THRESHOLD = 0.25;
export const MIN_CONF_THRESHOLD = 0.05;
export const MAX_CONF_THRESHOLD = 0.90;

export function indexDetections(
  detections: Detection[],
): IndexedDetection[] {
  return detections
    .map((d, index) => ({ ...d, index }))
    .sort((a, b) => b.confidence - a.confidence);
}
