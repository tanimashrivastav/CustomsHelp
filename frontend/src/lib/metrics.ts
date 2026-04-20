export interface RunLog {
  id: string;
  timestamp: number;
  imageName: string;
  threshold: number;
  imgsz: number;
  processingTimeMs: number;
  detectionsCount: number;
  success: boolean;
  errorMessage?: string;
  userFeedback?: "correct" | "false_positive" | null;
}

const STORAGE_KEY = "xray-run-logs";

export function getRunLogs(): RunLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRunLog(log: RunLog): void {
  const logs = getRunLogs();
  logs.unshift(log);
  // Keep last 100 runs
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
}

export function updateRunFeedback(id: string, feedback: "correct" | "false_positive"): void {
  const logs = getRunLogs();
  const log = logs.find((l) => l.id === id);
  if (log) {
    log.userFeedback = feedback;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }
}

export function clearRunLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function computeKPIs(logs: RunLog[], n = 10) {
  const successful = logs.filter((l) => l.success);
  const recent = successful.slice(0, n);

  const avgProcessingTime =
    recent.length > 0
      ? recent.reduce((sum, l) => sum + l.processingTimeMs, 0) / recent.length
      : 0;

  const withDetections = successful.filter((l) => l.detectionsCount > 0);
  const detectionRate =
    successful.length > 0 ? (withDetections.length / successful.length) * 100 : 0;

  const feedbackRuns = logs.filter(
    (l) => l.success && l.detectionsCount > 0 && l.userFeedback
  );
  const falsePositives = feedbackRuns.filter((l) => l.userFeedback === "false_positive");
  const correct = feedbackRuns.filter((l) => l.userFeedback === "correct");

  const falsePositiveRate =
    feedbackRuns.length > 0
      ? (falsePositives.length / feedbackRuns.length) * 100
      : null;

  const accuracyProxy =
    feedbackRuns.length > 0
      ? (correct.length / feedbackRuns.length) * 100
      : null;

  return {
    avgProcessingTime,
    detectionRate,
    falsePositiveRate,
    accuracyProxy,
    totalRuns: logs.length,
    successfulRuns: successful.length,
    feedbackCount: feedbackRuns.length,
  };
}
