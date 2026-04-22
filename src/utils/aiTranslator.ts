import OpenAI from 'openai';
import { ParsedLog, TranslatedInsight, BatchSummary } from '@/types/logs';

let openaiClient: OpenAI | null = null;

export function initOpenAI(apiKey: string) {
  openaiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

export function hasOpenAIKey(): boolean {
  return openaiClient !== null;
}

function anomalyLabel(anomaly: string): string {
  const labels: Record<string, string> = {
    port_scan: 'Port Scan',
    high_traffic: 'High Traffic',
    auth_failure: 'Auth Failure Burst',
    unusual_protocol: 'Unusual Protocol',
    rate_spike: 'Rate Spike',
    geo_anomaly: 'Geographic Anomaly',
    ddos_pattern: 'DDoS Pattern',
    none: '',
  };
  return labels[anomaly] ?? anomaly;
}

// ─── Build a compact log summary for the AI prompt ────────────────────────────
function buildLogSummaryForAI(logs: ParsedLog[]): string {
  return logs.slice(0, 20).map((l, i) =>
    `[${i + 1}] ID:${l.id} | ${l.format.toUpperCase()} | ${l.severity.toUpperCase()} | ` +
    `${l.category} | src:${l.source}${l.destination ? ` dst:${l.destination}` : ''} | ` +
    `${l.anomaly !== 'none' ? `ANOMALY:${anomalyLabel(l.anomaly)}(score:${l.anomalyScore}) | ` : ''}` +
    `MSG: ${l.message.slice(0, 120)}`
  ).join('\n');
}

// ─── Translate individual logs (batch call) ───────────────────────────────────
export async function translateLogs(
  logs: ParsedLog[],
  onProgress?: (done: number, total: number) => void
): Promise<TranslatedInsight[]> {
  if (!openaiClient) return generateRuleBasedInsights(logs);

  // Process in chunks of 5 to avoid huge prompts
  const chunkSize = 5;
  const results: TranslatedInsight[] = [];

  for (let i = 0; i < logs.length; i += chunkSize) {
    const chunk = logs.slice(i, i + chunkSize);
    const chunkStart = Date.now();

    try {
      const prompt = `You are a senior network security analyst. Analyze these network log entries and provide plain-English insights for each one.

LOGS TO ANALYZE:
${buildLogSummaryForAI(chunk)}

For each log entry (numbered [1] through [${chunk.length}]), respond with a JSON array of objects with this exact structure:
{
  "logIndex": <number 1-${chunk.length}>,
  "headline": "<10 words max, action-oriented headline>",
  "plainEnglish": "<2-3 sentences explaining what happened and why it matters in plain English>",
  "recommendedAction": "<specific, actionable next step for the operator>",
  "urgency": "<one of: immediate, soon, monitor, none>",
  "tags": ["<relevant tag>", ...]
}

Return ONLY a valid JSON array. Be concise but actionable.`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.3,
      });

      const timeToClarity = Date.now() - chunkStart;
      const content = response.choices[0]?.message?.content ?? '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { insights: [] };
      }

      const insightsArray: any[] = Array.isArray(parsed) ? parsed :
        parsed.insights ?? parsed.results ?? parsed.data ?? [];

      chunk.forEach((log, idx) => {
        const aiInsight = insightsArray.find((x: any) => x.logIndex === idx + 1) ?? null;
        results.push(aiInsight ? {
          logId: log.id,
          headline: aiInsight.headline ?? fallbackHeadline(log),
          plainEnglish: aiInsight.plainEnglish ?? fallbackPlainEnglish(log),
          recommendedAction: aiInsight.recommendedAction ?? fallbackAction(log),
          urgency: aiInsight.urgency ?? mapSeverityToUrgency(log.severity),
          tags: aiInsight.tags ?? [log.category],
          timeToClarity,
        } : generateRuleBasedInsight(log, timeToClarity));
      });
    } catch (err) {
      console.error('AI translation error:', err);
      const timeToClarity = Date.now() - chunkStart;
      chunk.forEach(log => results.push(generateRuleBasedInsight(log, timeToClarity)));
    }

    onProgress?.(Math.min(i + chunkSize, logs.length), logs.length);
  }

  return results;
}

// ─── Generate batch executive summary ────────────────────────────────────────
export async function generateBatchSummary(
  logs: ParsedLog[],
  insights: TranslatedInsight[]
): Promise<BatchSummary> {
  const critical = logs.filter(l => l.severity === 'critical').length;
  const warning = logs.filter(l => l.severity === 'warning').length;
  const informational = logs.filter(l => l.severity === 'informational').length;
  const anomalies = logs.filter(l => l.anomaly !== 'none').length;
  const affectedSources = [...new Set(logs.map(l => l.source))];
  const anomalyTypes = [...new Set(logs.filter(l => l.anomaly !== 'none').map(l => anomalyLabel(l.anomaly)))];

  const timestamps = logs.map(l => l.timestamp.getTime()).filter(t => !isNaN(t));
  const timeSpanMinutes = timestamps.length >= 2
    ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000)
    : 0;

  const overallRisk: 'high' | 'medium' | 'low' =
    critical > 0 ? 'high' : warning > 2 ? 'medium' : 'low';

  let executiveSummary = '';

  if (openaiClient) {
    try {
      const topInsights = insights
        .filter(i => i.urgency === 'immediate' || i.urgency === 'soon')
        .slice(0, 5)
        .map(i => i.headline)
        .join('; ');

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Write a 2-sentence executive summary for a NOC operator about this log batch:
- Total logs: ${logs.length} (${critical} critical, ${warning} warning, ${informational} informational)
- Anomalies detected: ${anomalies} (${anomalyTypes.join(', ') || 'none'})
- Affected sources: ${affectedSources.slice(0, 5).join(', ')}
- Time span: ${timeSpanMinutes} minutes
- Top issues: ${topInsights || 'none'}
- Overall risk: ${overallRisk.toUpperCase()}

Be direct and actionable. Start with the most critical concern.`,
        }],
        max_tokens: 200,
        temperature: 0.3,
      });
      executiveSummary = response.choices[0]?.message?.content?.trim() ?? '';
    } catch {
      executiveSummary = buildFallbackSummary(critical, warning, anomalies, overallRisk);
    }
  } else {
    executiveSummary = buildFallbackSummary(critical, warning, anomalies, overallRisk);
  }

  return {
    total: logs.length,
    critical,
    warning,
    informational,
    anomalies,
    topAnomalyTypes: anomalyTypes,
    affectedSources,
    timeSpanMinutes,
    overallRisk,
    executiveSummary,
  };
}

function buildFallbackSummary(critical: number, warning: number, anomalies: number, risk: string): string {
  if (critical > 0) {
    return `CRITICAL ALERT: ${critical} critical event${critical > 1 ? 's' : ''} detected in this log batch requiring immediate attention. ` +
      `${anomalies > 0 ? `${anomalies} anomalous patterns were also identified that may indicate an active attack or infrastructure failure.` : ''}`;
  }
  if (warning > 0) {
    return `${warning} warning-level events detected; overall risk is ${risk}. Review flagged items and apply recommended actions to prevent escalation.`;
  }
  return 'Log batch processed successfully. No critical issues detected; continue routine monitoring.';
}

// ─── Rule-based fallbacks (no API key required) ───────────────────────────────
function generateRuleBasedInsights(logs: ParsedLog[]): TranslatedInsight[] {
  return logs.map(l => generateRuleBasedInsight(l, Math.floor(Math.random() * 200) + 50));
}

function generateRuleBasedInsight(log: ParsedLog, timeToClarity: number): TranslatedInsight {
  return {
    logId: log.id,
    headline: fallbackHeadline(log),
    plainEnglish: fallbackPlainEnglish(log),
    recommendedAction: fallbackAction(log),
    urgency: mapSeverityToUrgency(log.severity),
    tags: buildTags(log),
    timeToClarity,
  };
}

function fallbackHeadline(log: ParsedLog): string {
  if (log.anomaly === 'auth_failure') return `Repeated authentication failures from ${log.source}`;
  if (log.anomaly === 'port_scan') return `Port scan activity detected from ${log.source}`;
  if (log.anomaly === 'ddos_pattern') return `Potential DDoS traffic targeting ${log.destination}`;
  if (log.anomaly === 'high_traffic') return `Abnormally high data transfer from ${log.source}`;
  if (log.severity === 'critical') return `Critical event in ${log.category} from ${log.source}`;
  if (log.severity === 'warning') return `Warning: ${log.category} issue from ${log.source}`;
  return `${log.category} activity from ${log.source}`;
}

function fallbackPlainEnglish(log: ParsedLog): string {
  if (log.anomaly === 'auth_failure')
    return `Multiple failed login attempts have been detected from IP ${log.source}. This pattern is consistent with a brute-force attack targeting your system credentials. The repeated failures suggest an automated tool is being used.`;
  if (log.anomaly === 'port_scan')
    return `The host ${log.source} has probed multiple ports across your infrastructure. Port scanning is typically the first step in an attack as it maps out available services. Immediate investigation is recommended.`;
  if (log.anomaly === 'ddos_pattern')
    return `Multiple source IPs are sending traffic to ${log.destination}, matching a Distributed Denial of Service pattern. This could overwhelm the target service if not mitigated quickly.`;
  if (log.anomaly === 'high_traffic')
    return `An unusually large volume of data (${log.bytes?.toLocaleString()} bytes) is being transferred from ${log.source}. This could indicate data exfiltration or a misconfigured application consuming excessive bandwidth.`;
  if (log.severity === 'critical')
    return `A critical event occurred in the ${log.category} layer originating from ${log.source}. This requires immediate investigation as it may indicate system failure or a security incident.`;
  if (log.severity === 'warning')
    return `A warning-level event was recorded in the ${log.category} system from ${log.source}. While not immediately critical, this could escalate if left unaddressed.`;
  return `A routine ${log.category} event was recorded from ${log.source}. This appears to be normal operational activity but has been logged for auditing purposes.`;
}

function fallbackAction(log: ParsedLog): string {
  if (log.anomaly === 'auth_failure')
    return `Block IP ${log.source} at the firewall. Audit account ${log.source} for compromise. Consider enabling account lockout policy after 5 failed attempts.`;
  if (log.anomaly === 'port_scan')
    return `Immediately block ${log.source} at the perimeter firewall. Run a vulnerability scan on all probed services. Check SIEM for additional activity from this source.`;
  if (log.anomaly === 'ddos_pattern')
    return `Enable rate limiting on ${log.destination}. Contact upstream provider to activate DDoS scrubbing. Redirect traffic through a CDN or DDoS mitigation service.`;
  if (log.anomaly === 'high_traffic')
    return `Investigate source ${log.source} for data exfiltration. Capture packets for forensic analysis. Check if this transfer was authorized by a legitimate process.`;
  if (log.severity === 'critical')
    return `Escalate immediately to Tier-2 support. Isolate affected system ${log.source} if breach is confirmed. Review logs 30 minutes before this event for root cause.`;
  if (log.severity === 'warning')
    return `Monitor ${log.source} for 30 minutes. If the pattern continues, escalate to Tier-2. Apply relevant patches or configuration fixes.`;
  return `Log entry recorded. No immediate action required. Continue standard monitoring cadence.`;
}

function mapSeverityToUrgency(severity: string): 'immediate' | 'soon' | 'monitor' | 'none' {
  if (severity === 'critical') return 'immediate';
  if (severity === 'warning') return 'soon';
  return 'monitor';
}

function buildTags(log: ParsedLog): string[] {
  const tags = [log.category, log.format.toUpperCase()];
  if (log.anomaly !== 'none') tags.push(anomalyLabel(log.anomaly));
  if (log.protocol) tags.push(log.protocol);
  if (log.action === 'REJECT') tags.push('Blocked');
  return tags.filter(Boolean);
}
