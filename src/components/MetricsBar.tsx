import { Clock, AlertTriangle, CheckCircle, Zap, TrendingDown } from 'lucide-react';
import { MetricsSnapshot } from '@/types/logs';

interface MetricsBarProps {
  metrics: MetricsSnapshot;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 min-w-[160px]`}>
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0 relative`}>
        {icon}
        {pulse && <div className={`absolute inset-0 rounded-lg ${color} animate-ping opacity-40`} />}
      </div>
      <div>
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        <div className="text-lg font-bold text-white leading-tight">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const reductionStr = `${metrics.reductionPercent.toFixed(0)}%`;
  const avgStr = metrics.avgTimeToClarity > 0
    ? metrics.avgTimeToClarity < 1000
      ? `${metrics.avgTimeToClarity}ms`
      : `${(metrics.avgTimeToClarity / 1000).toFixed(1)}s`
    : '—';
  const baselineStr = `${(metrics.manualBaseline / 60000).toFixed(0)} min`;

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <MetricCard
            icon={<Clock className="w-4 h-4 text-cyan-400" />}
            label="Avg Time to Clarity"
            value={avgStr}
            sub="per log entry"
            color="bg-cyan-500/20"
          />
          <MetricCard
            icon={<TrendingDown className="w-4 h-4 text-emerald-400" />}
            label="Time Reduction"
            value={reductionStr}
            sub={`vs ${baselineStr} manual`}
            color="bg-emerald-500/20"
            pulse={metrics.reductionPercent > 80}
          />
          <MetricCard
            icon={<Zap className="w-4 h-4 text-violet-400" />}
            label="Logs Processed"
            value={metrics.logsProcessed.toLocaleString()}
            sub="in this session"
            color="bg-violet-500/20"
          />
          <MetricCard
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            label="Critical Events"
            value={metrics.criticalFound.toLocaleString()}
            sub="require action"
            color="bg-red-500/20"
            pulse={metrics.criticalFound > 0}
          />
          <MetricCard
            icon={<CheckCircle className="w-4 h-4 text-amber-400" />}
            label="Anomalies Found"
            value={metrics.anomaliesDetected.toLocaleString()}
            sub="auto-detected"
            color="bg-amber-500/20"
          />

          {/* Time savings illustration */}
          {metrics.logsProcessed > 0 && (
            <div className="ml-2 flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">Time Saved This Session</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-400 line-through">
                    ~{Math.round((metrics.manualBaseline * metrics.logsProcessed) / 60000)} min manual
                  </div>
                  <span className="text-slate-600">→</span>
                  <div className="text-sm font-bold text-emerald-400">
                    {((metrics.avgTimeToClarity * metrics.logsProcessed) / 1000).toFixed(1)}s AI
                  </div>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden w-48">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, metrics.reductionPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
