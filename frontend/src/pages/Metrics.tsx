import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getRunLogs,
  clearRunLogs,
  updateRunFeedback,
  computeKPIs,
  type RunLog,
} from "@/lib/metrics";
import {
  Timer,
  Target,
  AlertTriangle,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";

export default function MetricsPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);

  useEffect(() => {
    setLogs(getRunLogs());
  }, []);

  const kpis = computeKPIs(logs);

  const handleReset = () => {
    clearRunLogs();
    setLogs([]);
  };

  const handleFeedback = (id: string, fb: "correct" | "false_positive") => {
    updateRunFeedback(id, fb);
    setLogs(getRunLogs());
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-wide">
                  Metrics Dashboard
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.totalRuns} total run{kpis.totalRuns !== 1 ? "s" : ""} logged
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReset}
                className="gap-2 text-xs"
              >
                <Trash2 className="h-3 w-3" /> Reset Metrics
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Avg Processing Time */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Timer className="h-4 w-4 text-primary" /> Avg Processing Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {kpis.avgProcessingTime > 0
                      ? `${(kpis.avgProcessingTime / 1000).toFixed(2)}s`
                      : "—"}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {kpis.avgProcessingTime > 0
                      ? `${Math.round(kpis.avgProcessingTime)}ms over last 10 successful runs`
                      : "No data yet"}
                  </p>
                </CardContent>
              </Card>

              {/* Detection Rate */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Target className="h-4 w-4 text-primary" /> Detection Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {kpis.successfulRuns > 0
                      ? `${kpis.detectionRate.toFixed(0)}%`
                      : "—"}
                  </div>
                  <Progress
                    value={kpis.detectionRate}
                    className="mt-2 h-1.5"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Runs with ≥1 detection
                  </p>
                </CardContent>
              </Card>

              {/* False Positive Proxy */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-primary" /> FP Proxy
                    Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {kpis.falsePositiveRate !== null
                      ? `${kpis.falsePositiveRate.toFixed(0)}%`
                      : "—"}
                  </div>
                  {kpis.accuracyProxy !== null && (
                    <p className="text-xs text-primary mt-1">
                      Accuracy proxy: {kpis.accuracyProxy.toFixed(0)}%
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Based on {kpis.feedbackCount} user feedback
                    {kpis.feedbackCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground italic text-center">
              These KPIs are collected locally for demo purposes and represent
              proxy signals for real deployment.
            </p>

            {/* Recent Runs Table */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                  <BarChart3 className="h-4 w-4" /> Recent Runs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {logs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No runs recorded yet. Run a detection to start logging.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="px-4 py-2 text-left font-medium">Time</th>
                          <th className="px-4 py-2 text-left font-medium">Image</th>
                          <th className="px-4 py-2 text-right font-medium">Conf</th>
                          <th className="px-4 py-2 text-right font-medium">Size</th>
                          <th className="px-4 py-2 text-right font-medium">Detections</th>
                          <th className="px-4 py-2 text-right font-medium">Time (ms)</th>
                          <th className="px-4 py-2 text-center font-medium">Status</th>
                          <th className="px-4 py-2 text-center font-medium">Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(0, 10).map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-border/50 hover:bg-muted/30"
                          >
                            <td className="px-4 py-2 font-mono text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-2 max-w-[120px] truncate">
                              {log.imageName}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {log.threshold.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {log.imgsz}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {log.detectionsCount}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {log.success ? log.processingTimeMs : "—"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {log.success ? (
                                <CheckCircle2 className="inline h-3.5 w-3.5 text-primary" />
                              ) : (
                                <XCircle className="inline h-3.5 w-3.5 text-destructive" />
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {log.success && log.detectionsCount > 0 ? (
                                log.userFeedback ? (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      log.userFeedback === "correct"
                                        ? "text-primary border-primary/30"
                                        : "text-destructive border-destructive/30"
                                    }`}
                                  >
                                    {log.userFeedback === "correct"
                                      ? "Correct"
                                      : "FP"}
                                  </Badge>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() =>
                                        handleFeedback(log.id, "correct")
                                      }
                                      className="rounded p-0.5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                      title="Looks correct"
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleFeedback(log.id, "false_positive")
                                      }
                                      className="rounded p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                      title="False positive"
                                    >
                                      <ThumbsDown className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
