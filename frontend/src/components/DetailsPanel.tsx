import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getObjectInfo, getMockEnrichment } from "@/lib/api";
import type { IndexedDetection, EnrichmentResponse } from "@/lib/types";
import { Package, ExternalLink, Loader2, Info, ChevronDown, Search, SlidersHorizontal, ImageIcon } from "lucide-react";

interface DetailsPanelProps {
  detection: IndexedDetection | null;
  hasRun: boolean;
  detectionsCount: number;
  runSettings?: { imgsz: number; threshold: number; timestamp: number } | null;
  onLowerThreshold?: () => void;
  onTryAnotherImage?: () => void;
  onIncreaseImageSize?: () => void;
}

export default function DetailsPanel({
  detection,
  hasRun,
  detectionsCount,
  runSettings,
  onLowerThreshold,
  onTryAnotherImage,
  onIncreaseImageSize,
}: DetailsPanelProps) {
  const [enrichment, setEnrichment] = useState<EnrichmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMocked, setIsMocked] = useState(false);
  const [enrichError, setEnrichError] = useState(false);

  const handleGetInfo = async () => {
    if (!detection) return;
    setLoading(true);
    setIsMocked(false);
    setEnrichError(false);
    try {
      const data = await getObjectInfo(detection.class_name);
      setEnrichment(data);
    } catch {
      setEnrichment(getMockEnrichment(detection.class_name));
      setIsMocked(true);
      setEnrichError(true);
    } finally {
      setLoading(false);
    }
  };

  // No detection selected but we had a run with 0 detections
  if (hasRun && detectionsCount === 0 && !detection) {
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center h-full min-h-[300px]">
          <Search className="h-10 w-10 text-muted-foreground opacity-30" />
          <div>
            <p className="text-sm font-medium text-foreground">Nothing to review yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              No items were detected in this image. Try adjusting settings.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            {onLowerThreshold && (
              <Button size="sm" variant="secondary" onClick={onLowerThreshold} className="w-full gap-2 text-xs">
                <SlidersHorizontal className="h-3 w-3" /> Lower threshold to 0.15
              </Button>
            )}
            {onTryAnotherImage && (
              <Button size="sm" variant="secondary" onClick={onTryAnotherImage} className="w-full gap-2 text-xs">
                <ImageIcon className="h-3 w-3" /> Try another image
              </Button>
            )}
            {onIncreaseImageSize && (
              <Button size="sm" variant="secondary" onClick={onIncreaseImageSize} className="w-full gap-2 text-xs">
                <ImageIcon className="h-3 w-3" /> Increase size to 640
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (!detection) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
        <div className="space-y-2">
          <Package className="mx-auto h-8 w-8 opacity-30" />
          <p className="text-sm">Select a detection to view details</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Detection Details */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
              Detected Items [YOLO — best.pt]
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Item</span>
              <p className="text-sm font-medium capitalize mt-0.5">{detection.class_name}</p>
              <p className="text-[10px] text-muted-foreground">Class ID: {detection.class_id}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</span>
                <span className="font-mono text-sm text-primary font-semibold">
                  {(detection.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={detection.confidence * 100} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">Higher confidence = more certain</p>
            </div>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors">
                Bounding Box
                <ChevronDown className="h-3 w-3" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {["x1", "y1", "x2", "y2"].map((label, i) => (
                    <div key={label} className="rounded bg-muted px-2 py-1">
                      <span className="text-muted-foreground">{label}: </span>
                      <span className="font-mono">{detection.bbox_xyxy[i].toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {runSettings && (
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Model Settings
                  <ChevronDown className="h-3 w-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1 space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded bg-muted px-2 py-1">
                      <span className="text-muted-foreground">imgsz: </span>
                      <span className="font-mono">{runSettings.imgsz}</span>
                    </div>
                    <div className="rounded bg-muted px-2 py-1">
                      <span className="text-muted-foreground">conf: </span>
                      <span className="font-mono">{runSettings.threshold.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="rounded bg-muted px-2 py-1 text-[10px]">
                    <span className="text-muted-foreground">Run at: </span>
                    <span className="font-mono">{new Date(runSettings.timestamp).toLocaleString()}</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Enrichment */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Info className="h-4 w-4" /> Item Info [Agentic AI]
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!enrichment && !loading && (
              <Button onClick={handleGetInfo} className="w-full gap-2" size="sm">
                <Info className="h-4 w-4" /> Get More Details
              </Button>
            )}
            {loading && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-xs">Fetching info...</span>
              </div>
            )}
            {enrichment && (
              <div className="space-y-3">
                {enrichError && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Enrichment unavailable; showing basic detection details.
                  </Badge>
                )}
                <div>
                  <span className="text-xs text-muted-foreground">Summary</span>
                  <p className="mt-1 text-xs leading-relaxed">{enrichment.summary}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Travel Notes</span>
                  <p className="mt-1 text-xs leading-relaxed">{enrichment.travel_notes}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Handling Guidance</span>
                  <p className="mt-1 text-xs leading-relaxed">{enrichment.handling_guidance}</p>
                </div>
                {enrichment.sources.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Sources</span>
                    <ul className="mt-1 space-y-1">
                      {enrichment.sources.map((s, i) => (
                        <li key={i}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button
                  size="sm" variant="ghost"
                  onClick={() => { setEnrichment(null); setIsMocked(false); setEnrichError(false); }}
                  className="w-full text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
