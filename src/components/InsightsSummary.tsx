import { AlertCircle, AlertTriangle, Info, Zap, Shield, TrendingUp, Clock } from 'lucide-react';
import { BatchSummary, ParsedLog, TranslatedInsight } from '@/types/logs';

interface InsightsSummaryProps {
  summary: BatchSummary;
  insights: TranslatedInsight[];
  logs: ParsedLog[];
  totalTimeMs: number;
}

export function InsightsSummary({ summary, insights, logs, totalTimeMs }: InsightsSummaryProps) {
  const immediateInsights = insights.filter(i => i.urgency === 'immediate');
  const soonInsights = insights.filter(i => i.urgency === 'soon');

  const riskColor = summary.overallRisk === 'high'
    ? 'from-red-500/20 to-red-900/10 border-red-500/30'
    : summary.overallRisk === 'medium'
    ? 'from-amber-500/20 to-amber-900/10 border-amber-500/30'
    : 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30';

  const riskTextColor = summary.overallRisk === 'high' ? 'text-red-400' :
    summary.overallRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-4">
      {/* Executive Summary Card */}
      <div className={`rounded-xl border bg-gradient-to-br p-4 ${riskColor}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            summary.overallRisk === 'high' ? 'bg-red-500/20' :
            summary.overallRisk === 'medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          }`}>
            <Shield className={`w-5 h-5 ${riskTextColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${riskColor} ${riskTextColor}`}>
                {summary.overallRisk} Risk
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{summary.executiveSummary}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<AlertCircle className="w-4 h-4 text-red-400" />}
          label="Critical"
          value={summary.critical}
          bg="bg-red-500/10"
          text="text-red-400"
          pulse={summary.critical > 0}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          label="Warning"
          value={summary.warning}
          bg="bg-amber-500/10"
          text="text-amber-400"
        />
        <StatCard
          icon={<Info className="w-4 h-4 text-emerald-400" />}
          label="Info"
          value={summary.informational}
          bg="bg-emerald-500/10"
          text="text-emerald-400"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-violet-400" />}
          label="Anomalies"
          value={summary.anomalies}
          bg="bg-violet-500/10"
          text="text-violet-400"
          pulse={summary.anomalies > 0}
        />
      </div>

      {/* Time to Clarity metric */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Time to Clarity</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Manual Estimate</div>
            <div className="text-lg font-bold text-slate-400 line-through">
              {Math.round((15 * 60000 * logs.length) / 60000)} min
            </div>
            <div className="text-xs text-slate-600">~15 min/log manual</div>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <div className="text-2xl">⚡</div>
            <div className="text-xs text-cyan-400">AI powered</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">AI Analysis</div>
            <div className="text-lg font-bold text-cyan-400">
              {totalTimeMs < 1000 ? `${totalTimeMs}ms` : `${(totalTimeMs / 1000).toFixed(1)}s`}
            </div>
            <div className="text-xs text-emerald-400">
              {Math.round((1 - totalTimeMs / (15 * 60000 * logs.length)) * 100)}% faster
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            style={{ width: `${Math.min(100, Math.round((1 - totalTimeMs / (15 * 60000 * logs.length)) * 100))}%` }}
          />
        </div>
      </div>

      {/* Immediate Actions */}
      {immediateInsights.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-red-400">Immediate Actions Required</h3>
          </div>
          <div className="divide-y divide-red-500/10">
            {immediateInsights.slice(0, 5).map((insight, i) => {
              const log = logs.find(l => l.id === insight.logId);
              return (
                <div key={insight.logId} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-red-500 mt-0.5">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-white">{insight.headline}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{insight.recommendedAction}</p>
                      {log && (
                        <p className="text-xs text-slate-500 font-mono mt-1">src: {log.source}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning Actions */}
      {soonInsights.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-500/20 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Address Soon</h3>
          </div>
          <div className="divide-y divide-amber-500/10">
            {soonInsights.slice(0, 3).map((insight, i) => (
              <div key={insight.logId} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-amber-500 mt-0.5">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium text-white">{insight.headline}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{insight.recommendedAction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomaly Types */}
      {summary.topAnomalyTypes.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            Detected Anomaly Patterns
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.topAnomalyTypes.map(type => (
              <span key={type} className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-medium">
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, bg, text, pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  text: string;
  pulse?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${bg} border border-white/5 relative overflow-hidden`}>
      {pulse && value > 0 && (
        <div className={`absolute inset-0 ${bg} animate-pulse opacity-50`} />
      )}
      <div className="relative flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
    </div>
  );
}
