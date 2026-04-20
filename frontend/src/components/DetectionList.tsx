import { ScrollArea } from "@/components/ui/scroll-area";
import type { IndexedDetection } from "@/lib/types";

interface DetectionListProps {
  detections: IndexedDetection[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  hasImage: boolean;
  hasRun: boolean;
  confidenceThreshold: number;
  hideBelow: boolean;
}

export default function DetectionList({
  detections, selectedIndex, onSelect, hasImage, hasRun, confidenceThreshold, hideBelow,
}: DetectionListProps) {
  const visible = hideBelow
    ? detections.filter((d) => d.confidence >= confidenceThreshold)
    : detections;

  if (!hasImage) return null;

  if (!hasRun) {
    return (
      <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
        Run detection to see results
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
        No detections found
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
        All detections below confidence threshold
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border">
      <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Detected Items ({visible.length})
      </div>
      <ScrollArea className="max-h-40">
        <div className="space-y-0.5 px-2 pb-2">
          {visible.map((d) => (
            <button
              key={d.index}
              onClick={() => onSelect(d.index)}
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs transition-colors ${
                selectedIndex === d.index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <span className="font-medium capitalize">{d.class_name}</span>
              <span className="font-mono text-muted-foreground">
                {(d.confidence * 100).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
