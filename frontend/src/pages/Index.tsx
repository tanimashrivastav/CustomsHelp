import { useState, useCallback } from "react";
import SourcePanel from "@/components/SourcePanel";
import ImageViewer from "@/components/ImageViewer";
import DetectionList from "@/components/DetectionList";
import DetailsPanel from "@/components/DetailsPanel";
import { indexDetections, DEFAULT_CONF_THRESHOLD } from "@/lib/flagging";
import { detectFile, getApiBaseUrl } from "@/lib/api";
import { SAMPLE_IMAGES, type SampleImage } from "@/lib/sample-images";
import type { IndexedDetection, DetectionResponse, ImageSize } from "@/lib/types";
import { saveRunLog } from "@/lib/metrics";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import { updateRunFeedback } from "@/lib/metrics";

const Index = () => {
  const [selectedSample, setSelectedSample] = useState<SampleImage | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{ blob: Blob; name: string } | null>(null);
  const [response, setResponse] = useState<DetectionResponse | null>(null);
  const [detections, setDetections] = useState<IndexedDetection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<number | null>(null);
  const [confThreshold, setConfThreshold] = useState(DEFAULT_CONF_THRESHOLD);
  const [imageSize, setImageSize] = useState<ImageSize>(512);
  const [hideLowConf, setHideLowConf] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [hasRun, setHasRun] = useState(false);
  const [runSettings, setRunSettings] = useState<{ imgsz: number; threshold: number; timestamp: number } | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const updateDetections = useCallback(
    (resp: DetectionResponse | null) => {
      if (!resp) { setDetections([]); return; }
      setDetections(indexDetections(resp.detections));
    },
    [],
  );

  const handleSelectSample = (s: SampleImage) => {
    setSelectedSample(s);
    setImageSrc(s.src);
    setImageFile(null);
    setResponse(null);
    setDetections([]);
    setSelectedDetection(null);
    setHasRun(false);
    setRunSettings(null);
    setLastRunId(null);
    setFeedbackGiven(false);
  };

  const handleUploadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setImageFile({ blob: file, name: file.name });
    setSelectedSample({ id: "upload", name: file.name, src: url });
    setResponse(null);
    setDetections([]);
    setSelectedDetection(null);
    setHasRun(false);
    setRunSettings(null);
    setLastRunId(null);
    setFeedbackGiven(false);
  };

  const handleUrlSubmit = (url: string) => {
    setImageSrc(url);
    setImageFile(null);
    setSelectedSample({ id: "url", name: "URL Image", src: url });
    setResponse(null);
    setDetections([]);
    setSelectedDetection(null);
    setHasRun(false);
    setRunSettings(null);
    setLastRunId(null);
    setFeedbackGiven(false);
  };

  const handleRunDetection = async () => {
    if (!imageSrc) return;
    const startTime = Date.now();
    const runId = `run-${startTime}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      setStatus("fetching");
      let blob: Blob;
      let name: string;

      if (imageFile) {
        blob = imageFile.blob;
        name = imageFile.name;
      } else {
        const res = await fetch(imageSrc);
        blob = await res.blob();
        name = selectedSample?.name || "image.png";
      }

      setStatus("uploading");
      const baseUrl = getApiBaseUrl();
      setStatus("detecting");
      const resp = await detectFile(blob as File, name, baseUrl, imageSize, confThreshold);
      const elapsed = Date.now() - startTime;

      setResponse(resp);
      updateDetections(resp);
      setHasRun(true);
      setRunSettings({ imgsz: imageSize, threshold: confThreshold, timestamp: Date.now() });
      setLastRunId(runId);
      setFeedbackGiven(false);

      const statusLabel = resp.detections.length > 0 ? "done" : "done";
      setStatus(statusLabel);

      saveRunLog({
        id: runId,
        timestamp: Date.now(),
        imageName: name,
        threshold: confThreshold,
        imgsz: imageSize,
        processingTimeMs: elapsed,
        detectionsCount: resp.detections.length,
        success: true,
      });

      toast({
        title: resp.detections.length > 0 ? "Detection complete" : "Done (0 detections)",
        description: resp.detections.length > 0
          ? `Found ${resp.detections.length} item(s)`
          : "No items detected in this image",
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      setStatus("error");

      saveRunLog({
        id: runId,
        timestamp: Date.now(),
        imageName: selectedSample?.name || "unknown",
        threshold: confThreshold,
        imgsz: imageSize,
        processingTimeMs: elapsed,
        detectionsCount: 0,
        success: false,
        errorMessage: err.message || "Unknown error",
      });

      toast({
        title: "Detection failed",
        description: err.message || "Failed to reach API / invalid response",
        variant: "destructive",
      });
    }
  };

  const handleFeedback = (fb: "correct" | "false_positive") => {
    if (lastRunId) {
      updateRunFeedback(lastRunId, fb);
      setFeedbackGiven(true);
    }
  };

  const handleLowerThreshold = () => {
    setConfThreshold(0.15);
  };

  const handleTryAnotherImage = () => {
    // Select next sample or first one
    const currentIdx = SAMPLE_IMAGES.findIndex((s) => s.id === selectedSample?.id);
    const nextIdx = (currentIdx + 1) % SAMPLE_IMAGES.length;
    handleSelectSample(SAMPLE_IMAGES[nextIdx]);
  };

  const handleIncreaseImageSize = () => {
    setImageSize(640);
  };

  const selected = detections.find((d) => d.index === selectedDetection) || null;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-border bg-card overflow-hidden">
          <SourcePanel
            selectedSample={selectedSample}
            onSelectSample={handleSelectSample}
            onUploadFile={handleUploadFile}
            onUrlSubmit={handleUrlSubmit}
            confThreshold={confThreshold}
            onConfThresholdChange={setConfThreshold}
            imageSize={imageSize}
            onImageSizeChange={setImageSize}
            hideLowConf={hideLowConf}
            onToggleHideLowConf={setHideLowConf}
            onRunDetection={handleRunDetection}
            status={status}
          />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ImageViewer
              src={imageSrc}
              response={response}
              detections={detections}
              selectedIndex={selectedDetection}
              onSelectDetection={setSelectedDetection}
              hasRun={hasRun}
              status={status}
            />
          </div>

          {/* User Feedback Bar */}
          {hasRun && detections.length > 0 && !feedbackGiven && (
            <div className="flex items-center justify-center gap-3 border-t border-border bg-card px-4 py-2">
              <span className="text-xs text-muted-foreground">Were these detections correct?</span>
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => handleFeedback("correct")}>
                <ThumbsUp className="h-3 w-3" /> Looks correct
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => handleFeedback("false_positive")}>
                <ThumbsDown className="h-3 w-3" /> False positive
              </Button>
            </div>
          )}

          {/* Error retry bar */}
          {status === "error" && (
            <div className="flex items-center justify-center gap-3 border-t border-border bg-card px-4 py-2">
              <span className="text-xs text-destructive">Failed to reach API / invalid response</span>
              <Button size="sm" variant="secondary" className="gap-1 text-xs h-7" onClick={handleRunDetection}>
                <RotateCcw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}

          <DetectionList
            detections={detections}
            selectedIndex={selectedDetection}
            onSelect={setSelectedDetection}
            hasImage={!!imageSrc}
            hasRun={hasRun}
            confidenceThreshold={confThreshold}
            hideBelow={hideLowConf}
          />
        </main>

        <aside className="w-72 shrink-0 border-l border-border bg-card overflow-hidden">
          <DetailsPanel
            detection={selected}
            apiBaseUrl={getApiBaseUrl()}
            hasRun={hasRun}
            detectionsCount={detections.length}
            runSettings={runSettings}
            onLowerThreshold={handleLowerThreshold}
            onTryAnotherImage={handleTryAnotherImage}
            onIncreaseImageSize={imageSize < 640 ? handleIncreaseImageSize : undefined}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
