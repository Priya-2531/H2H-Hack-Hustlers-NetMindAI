export type LogFormat = 'syslog' | 'snmp' | 'vpc';

export type Severity = 'critical' | 'warning' | 'informational';

export type AnomalyType =
  | 'port_scan'
  | 'high_traffic'
  | 'auth_failure'
  | 'unusual_protocol'
  | 'rate_spike'
  | 'geo_anomaly'
  | 'ddos_pattern'
  | 'none';

export interface ParsedLog {
  id: string;
  rawLine: string;
  format: LogFormat;
  timestamp: Date;
  severity: Severity;
  source: string;
  destination?: string;
  message: string;
  protocol?: string;
  port?: number;
  bytes?: number;
  action?: string;
  facility?: string;
  category: string;
  anomaly: AnomalyType;
  anomalyScore: number; // 0-100
  structured: Record<string, string | number | boolean>;
}

export interface TranslatedInsight {
  logId: string;
  headline: string;
  plainEnglish: string;
  recommendedAction: string;
  urgency: 'immediate' | 'soon' | 'monitor' | 'none';
  tags: string[];
  timeToClarity: number; // ms to generate this insight
}

export interface LogBatch {
  id: string;
  logs: ParsedLog[];
  insights: TranslatedInsight[];
  summary: BatchSummary;
  processingStarted: Date;
  processingCompleted?: Date;
  totalTimeToClarity?: number;
  baselineTimeToClarity?: number; // estimated manual time in ms
}

export interface BatchSummary {
  total: number;
  critical: number;
  warning: number;
  informational: number;
  anomalies: number;
  topAnomalyTypes: string[];
  affectedSources: string[];
  timeSpanMinutes: number;
  overallRisk: 'high' | 'medium' | 'low';
  executiveSummary: string;
}

export interface MetricsSnapshot {
  avgTimeToClarity: number;
  manualBaseline: number;
  reductionPercent: number;
  logsProcessed: number;
  criticalFound: number;
  anomaliesDetected: number;
}
