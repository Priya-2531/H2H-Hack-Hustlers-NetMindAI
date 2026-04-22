import { useState } from 'react';
import { ChevronDown, ChevronRight, Info, Scan, Wifi, ShieldX, TrendingUp, Globe, Activity, Cpu } from 'lucide-react';
import { ParsedLog, TranslatedInsight, AnomalyType } from '@/types/logs';
import { SeverityBadge } from './SeverityBadge';

interface LogTableProps {
  logs: ParsedLog[];
  insights: TranslatedInsight[];
  filter: string;
  searchQuery: string;
}

const ANOMALY_ICONS: Record<AnomalyType, React.ReactNode> = {
  port_scan: <Scan className="w-3 h-3" />,
  high_traffic: <TrendingUp className="w-3 h-3" />,
  auth_failure: <ShieldX className="w-3 h-3" />,
  unusual_protocol: <Wifi className="w-3 h-3" />,
  rate_spike: <Activity className="w-3 h-3" />,
  geo_anomaly: <Globe className="w-3 h-3" />,
  ddos_pattern: <Cpu className="w-3 h-3" />,
  none: null,
};

const ANOMALY_COLORS: Record<AnomalyType, string> = {
  port_scan: 'bg-red-500/20 text-red-400 border-red-500/30',
  high_traffic: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  auth_failure: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  unusual_protocol: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  rate_spike: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  geo_anomaly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ddos_pattern: 'bg-red-600/20 text-red-300 border-red-500/40',
  none: '',
};

const URGENCY_COLORS = {
  immediate: 'text-red-400 bg-red-500/10 border-red-500/20',
  soon: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  monitor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  none: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

function formatTime(d: Date): string {
  try {
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return '—'; }
}

interface RowProps {
  log: ParsedLog;
  insight?: TranslatedInsight;
}

function LogRow({ log, insight }: RowProps) {
  const [expanded, setExpanded] = useState(false);

  const rowBg = log.severity === 'critical'
    ? 'border-l-2 border-l-red-500 bg-red-500/5 hover:bg-red-500/10'
    : log.severity === 'warning'
    ? 'border-l-2 border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10'
    : 'border-l-2 border-l-transparent hover:bg-slate-800/40';

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${rowBg}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2 w-8">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          }
        </td>
        <td className="px-3 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">
          {formatTime(log.timestamp)}
        </td>
        <td className="px-3 py-2">
          <SeverityBadge severity={log.severity} />
        </td>
        <td className="px-3 py-2">
          <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 font-mono">
            {log.format.toUpperCase()}
          </span>
        </td>
        <td className="px-3 py-2 text-xs text-slate-300 font-mono">{log.source}</td>
        <td className="px-3 py-2 text-xs text-slate-400 max-w-[240px] truncate">{log.message}</td>
        <td className="px-3 py-2">
          {log.anomaly !== 'none' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${ANOMALY_COLORS[log.anomaly]}`}>
              {ANOMALY_ICONS[log.anomaly]}
              {log.anomaly.replace(/_/g, ' ')}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-xs text-slate-400">
          {log.anomaly !== 'none' && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    log.anomalyScore > 70 ? 'bg-red-500' : log.anomalyScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${log.anomalyScore}%` }}
                />
              </div>
              <span className="font-mono">{log.anomalyScore}</span>
            </div>
          )}
        </td>
        <td className="px-3 py-2 text-xs text-slate-400">
          {insight && (
            <span className={`px-2 py-0.5 rounded-full border text-xs ${URGENCY_COLORS[insight.urgency]}`}>
              {insight.urgency}
            </span>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-900/80">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Raw Log */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Raw Log</h4>
                <pre className="text-xs text-slate-300 bg-slate-950 rounded-lg p-3 overflow-x-auto font-mono leading-5 border border-slate-700">
                  {log.rawLine || log.message}
                </pre>

                {/* Structured Data */}
                {Object.keys(log.structured).length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-2">Parsed Fields</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(log.structured).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2 text-xs">
                          <span className="text-slate-500 font-mono min-w-[80px]">{k}:</span>
                          <span className="text-slate-300 font-mono truncate">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* AI Insight */}
              {insight && (
                <div>
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="text-base">🤖</span> AI Insight
                    <span className="ml-auto text-slate-500 font-normal normal-case">
                      Clarity in {insight.timeToClarity}ms
                    </span>
                  </h4>

                  <div className={`rounded-lg border p-3 mb-3 ${
                    insight.urgency === 'immediate' ? 'bg-red-500/5 border-red-500/20' :
                    insight.urgency === 'soon' ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-slate-800/50 border-slate-700'
                  }`}>
                    <p className="text-sm font-semibold text-white mb-1">{insight.headline}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{insight.plainEnglish}</p>
                  </div>

                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 mb-3">
                    <h5 className="text-xs font-semibold text-emerald-400 mb-1">✅ Recommended Action</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">{insight.recommendedAction}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {insight.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs border border-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function LogTable({ logs, insights, filter, searchQuery }: LogTableProps) {
  const insightMap = new Map(insights.map(i => [i.logId, i]));

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.severity !== filter && l.anomaly !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        (l.destination ?? '').toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.format.includes(q)
      );
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Info className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">No log entries match the current filter</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/50">
            <th className="w-8" />
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Format</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Source</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Anomaly</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Score</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {filtered.map(log => (
            <LogRow key={log.id} log={log} insight={insightMap.get(log.id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
