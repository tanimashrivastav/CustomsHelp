import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SAMPLE_IMAGES, type SampleImage } from "@/lib/sample-images";
import { DEFAULT_CONF_THRESHOLD, MIN_CONF_THRESHOLD, MAX_CONF_THRESHOLD } from "@/lib/flagging";
import type { SourceMode, ImageSize } from "@/lib/types";
import {
  Upload, Link, Image, Play, ChevronDown, ChevronUp,
} from "lucide-react";

interface SourcePanelProps {
  selectedSample: SampleImage | null;
  onSelectSample: (s: SampleImage) => void;
  onUploadFile: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  confThreshold: number;
  onConfThresholdChange: (v: number) => void;
  imageSize: ImageSize;
  onImageSizeChange: (v: ImageSize) => void;
  hideLowConf: boolean;
  onToggleHideLowConf: (v: boolean) => void;
  onRunDetection: () => void;
  status: string;
}

export default function SourcePanel({
  selectedSample, onSelectSample, onUploadFile, onUrlSubmit,
  confThreshold, onConfThresholdChange,
  imageSize, onImageSizeChange,
  hideLowConf, onToggleHideLowConf,
  onRunDetection, status,
}: SourcePanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>("gallery");
  const [urlInput, setUrlInput] = useState("");


  const isRunning = status === "fetching" || status === "uploading" || status === "detecting";

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Source Picker */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Image className="h-4 w-4" /> Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_IMAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSourceMode("gallery"); onSelectSample(s); }}
                  className={`group relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                    selectedSample?.id === s.id
                      ? "border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img
                    src={`${s.src}?v=${Date.now()}`}
                    alt={s.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      e.currentTarget.parentElement!.classList.add("bg-muted");
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-[10px] text-muted-foreground truncate">
                    {s.name}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Advanced
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-1">
                <div className="flex gap-2">
                  <Button
                    size="sm" variant={sourceMode === "upload" ? "default" : "secondary"}
                    onClick={() => setSourceMode("upload")} className="flex-1 text-xs"
                  >
                    <Upload className="mr-1 h-3 w-3" /> Upload
                  </Button>
                  <Button
                    size="sm" variant={sourceMode === "url" ? "default" : "secondary"}
                    onClick={() => setSourceMode("url")} className="flex-1 text-xs"
                  >
                    <Link className="mr-1 h-3 w-3" /> URL
                  </Button>
                </div>
                {sourceMode === "upload" && (
                  <Input
                    type="file" accept=".png,.jpg,.jpeg"
                    className="text-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadFile(f);
                    }}
                  />
                )}
                {sourceMode === "url" && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="text-xs"
                    />
                    <Button size="sm" onClick={() => { if (urlInput) onUrlSubmit(urlInput); }}>
                      Go
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inference Settings */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
              Inference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Confidence Threshold</Label>
                <span className="font-mono text-xs text-primary">{confThreshold.toFixed(2)}</span>
              </div>
              <Slider
                min={MIN_CONF_THRESHOLD} max={MAX_CONF_THRESHOLD} step={0.01}
                value={[confThreshold]} onValueChange={([v]) => onConfThresholdChange(v)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Image Size</Label>
              <Select
                value={String(imageSize)}
                onValueChange={(v) => onImageSizeChange(Number(v) as ImageSize)}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="416">416</SelectItem>
                  <SelectItem value="512">512</SelectItem>
                  <SelectItem value="640">640</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Hide low-confidence</Label>
              <Switch checked={hideLowConf} onCheckedChange={onToggleHideLowConf} />
            </div>
          </CardContent>
        </Card>

        {/* Run Detection */}
        <Button
          onClick={onRunDetection}
          disabled={isRunning || !selectedSample}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Processing..." : "Run Detection"}
        </Button>
        {status !== "idle" && (
          <div className="text-center text-xs text-muted-foreground font-mono capitalize">
            Status: {status}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
