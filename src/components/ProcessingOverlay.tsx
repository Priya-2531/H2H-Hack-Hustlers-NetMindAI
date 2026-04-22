import { Loader2, Brain, Network, Shield, Zap } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
  total: number;
  stage: 'parsing' | 'anomaly' | 'translating' | 'summarizing';
}

const STAGE_INFO = {
  parsing: {
    label: 'Parsing Log Entries',
    description: 'Extracting structured data from raw log format',
    icon: <Network className="w-5 h-5 text-cyan-400" />,
    color: 'text-cyan-400',
  },
  anomaly: {
    label: 'Detecting Anomalies',
    description: 'Analyzing patterns and flagging unusual behavior',
    icon: <Shield className="w-5 h-5 text-violet-400" />,
    color: 'text-violet-400',
  },
  translating: {
    label: 'Generating AI Insights',
    description: 'Translating technical logs to plain English',
    icon: <Brain className="w-5 h-5 text-amber-400" />,
    color: 'text-amber-400',
  },
  summarizing: {
    label: 'Building Executive Summary',
    description: 'Synthesizing findings into actionable recommendations',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    color: 'text-emerald-400',
  },
};

export function ProcessingOverlay({ progress, total, stage }: ProcessingOverlayProps) {
  const info = STAGE_INFO[stage];
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  const steps = ['parsing', 'anomaly', 'translating', 'summarizing'];
  const currentStep = steps.indexOf(stage);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Animated logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 animate-ping" />
          </div>
        </div>

        {/* Stage indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {info.icon}
          <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
        </div>
        <p className="text-center text-xs text-slate-500 mb-6">{info.description}</p>

        {/* Progress bar */}
        {stage === 'translating' && total > 0 && (
          <>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{progress} / {total} logs</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}

        {/* Stage steps */}
        <div className="flex justify-between items-center mt-4">
          {steps.map((s, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  isDone ? 'bg-emerald-500 text-white' :
                  isCurrent ? 'bg-cyan-500 text-white animate-pulse' :
                  'bg-slate-700 text-slate-500'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] capitalize ${
                  isCurrent ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  {s === 'translating' ? 'AI' : s.slice(0, 6)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
