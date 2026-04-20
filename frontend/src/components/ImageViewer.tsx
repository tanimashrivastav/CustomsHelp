import { useRef, useEffect, useCallback } from "react";
import type { IndexedDetection, DetectionResponse } from "@/lib/types";
import { SearchX } from "lucide-react";

interface ImageViewerProps {
  src: string | null;
  response: DetectionResponse | null;
  detections: IndexedDetection[];
  selectedIndex: number | null;
  onSelectDetection: (index: number) => void;
  hasRun: boolean;
  status: string;
}

export default function ImageViewer({
  src, response, detections, selectedIndex, onSelectDetection, hasRun, status,
}: ImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !response) return;

    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.length === 0) return; // No boxes to draw

    const scaleX = rect.width / response.image_w;
    const scaleY = rect.height / response.image_h;

    detections.forEach((d) => {
      const [x1, y1, x2, y2] = d.bbox_xyxy;
      const sx = x1 * scaleX;
      const sy = y1 * scaleY;
      const sw = (x2 - x1) * scaleX;
      const sh = (y2 - y1) * scaleY;

      const isSelected = d.index === selectedIndex;

      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? "hsl(160, 100%, 45%)" : "hsl(210, 40%, 55%)";
      ctx.strokeRect(sx, sy, sw, sh);

      // Label: Class — Confidence%
      const label = `${d.class_name} — ${(d.confidence * 100).toFixed(0)}%`;
      ctx.font = `${isSelected ? "bold " : ""}11px Inter, sans-serif`;
      const tm = ctx.measureText(label);
      const lh = 16;

      ctx.fillStyle = isSelected
        ? "hsla(160, 100%, 45%, 0.9)"
        : "hsla(220, 18%, 13%, 0.85)";
      ctx.fillRect(sx, sy - lh, tm.width + 8, lh);

      ctx.fillStyle = "#fff";
      ctx.fillText(label, sx + 4, sy - 4);
    });
  }, [response, detections, selectedIndex]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!response || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = rect.width / response.image_w;
    const scaleY = rect.height / response.image_h;

    for (const d of detections) {
      const [x1, y1, x2, y2] = d.bbox_xyxy;
      if (x >= x1 * scaleX && x <= x2 * scaleX && y >= y1 * scaleY && y <= y2 * scaleY) {
        onSelectDetection(d.index);
        return;
      }
    }
  };

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <div className="text-4xl opacity-30">📷</div>
          <p className="text-sm">Select a sample image to begin</p>
        </div>
      </div>
    );
  }

  // Zero detections empty state overlay
  const showEmptyState = hasRun && response && detections.length === 0 && status === "done";

  return (
    <div ref={containerRef} className="relative flex h-full items-center justify-center overflow-hidden bg-background/50 p-4">
      <div className="relative max-h-full max-w-full">
        <img
          ref={imgRef}
          src={src}
          alt="X-ray scan"
          className="max-h-[calc(100vh-200px)] max-w-full object-contain rounded"
          onLoad={draw}
        />
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute left-0 top-0 cursor-crosshair"
        />
        {showEmptyState && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
            <div className="text-center space-y-2 p-6">
              <SearchX className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">No items detected</p>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Try lowering the confidence threshold or testing a different image.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
