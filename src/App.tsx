import { useState, useCallback } from 'react';
import { Search, Filter, LayoutDashboard, List, BarChart3, X } from 'lucide-react';
import { LogFormat, TranslatedInsight, LogBatch, MetricsSnapshot } from '@/types/logs';
import { parseLogBatch } from '@/utils/logParser';
import { translateLogs, generateBatchSummary } from '@/utils/aiTranslator';
import { Header } from '@/components/Header';
import { MetricsBar } from '@/components/MetricsBar';
import { LogInputPanel } from '@/components/LogInputPanel';
import { LogTable } from '@/components/LogTable';
import { InsightsSummary } from '@/components/InsightsSummary';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';

type Tab = 'dashboard' | 'logs' | 'analytics';
type ProcessingStage = 'parsing' | 'anomaly' | 'translating' | 'summarizing';

const MANUAL_BASELINE_PER_LOG_MS = 15 * 60 * 1000; // 15 minutes per log manual

export default function App() {
  const [batch, setBatch] = useState<LogBatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('parsing');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionMetrics, setSessionMetrics] = useState<MetricsSnapshot>({
    avgTimeToClarity: 0,
    manualBaseline: MANUAL_BASELINE_PER_LOG_MS,
    reductionPercent: 0,
    logsProcessed: 0,
    criticalFound: 0,
    anomaliesDetected: 0,
  });

  const handleProcess = useCallback(async (raw: string, format: LogFormat) => {
    setIsProcessing(true);
    setProcessingStage('parsing');
    setProcessingProgress(0);
    const startTime = Date.now();

    try {
      // Stage 1: Parse
      setProcessingStage('parsing');
      await new Promise(r => setTimeout(r, 300));
      const logs = parseLogBatch(raw, format);

      if (logs.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Stage 2: Anomaly detection (already done in parser, just show stage)
      setProcessingStage('anomaly');
      await new Promise(r => setTimeout(r, 400));

      // Stage 3: AI Translation
      setProcessingStage('translating');
      const insights: TranslatedInsight[] = await translateLogs(logs, (done, _total) => {
        setProcessingProgress(done);
      });

      // Stage 4: Summary
      setProcessingStage('summarizing');
      const summary = await generateBatchSummary(logs, insights);

      const totalTimeMs = Date.now() - startTime;
      const avgTimeToClarity = Math.round(totalTimeMs / logs.length);

      const newBatch: LogBatch = {
        id: Math.random().toString(36).slice(2),
        logs,
        insights,
        summary,
        processingStarted: new Date(startTime),
        processingCompleted: new Date(),
        totalTimeToClarity: totalTimeMs,
        baselineTimeToClarity: MANUAL_BASELINE_PER_LOG_MS * logs.length,
      };

      setBatch(newBatch);
      setActiveTab('dashboard');

      const reductionPct = Math.round(
        (1 - totalTimeMs / (MANUAL_BASELINE_PER_LOG_MS * logs.length)) * 100
      );

      setSessionMetrics({
        avgTimeToClarity,
        manualBaseline: MANUAL_BASELINE_PER_LOG_MS,
        reductionPercent: Math.max(0, reductionPct),
        logsProcessed: logs.length,
        criticalFound: logs.filter(l => l.severity === 'critical').length,
        anomaliesDetected: logs.filter(l => l.anomaly !== 'none').length,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'informational', label: 'Info' },
    { value: 'port_scan', label: 'Port Scan' },
    { value: 'auth_failure', label: 'Auth Failure' },
    { value: 'ddos_pattern', label: 'DDoS' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header onApiKeySet={() => {}} />
      <MetricsBar metrics={sessionMetrics} />

      {isProcessing && (
        <ProcessingOverlay
          progress={processingProgress}
          total={batch?.logs.length ?? 10}
          stage={processingStage}
        />
      )}

      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6 flex gap-6">
        {/* Left Sidebar: Input Panel */}
        <div className="w-[380px] flex-shrink-0">
          <LogInputPanel onProcess={handleProcess} isProcessing={isProcessing} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 self-start">
            {[
              { id: 'dashboard' as Tab, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'logs' as Tab, label: 'Log Explorer', icon: <List className="w-4 h-4" /> },
              { id: 'analytics' as Tab, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          {!batch ? (
            <EmptyState />
          ) : (
            <>
              {/* Filter Bar (for logs tab) */}
              {activeTab === 'logs' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
                    {FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          filter === opt.value
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                  <div className="xl:col-span-2">
                    <InsightsSummary
                      summary={batch.summary}
                      insights={batch.insights}
                      logs={batch.logs}
                      totalTimeMs={batch.totalTimeToClarity ?? 0}
                    />
                  </div>
                  <div className="xl:col-span-3">
                    <AnalyticsCharts logs={batch.logs} />
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex-1">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">
                      {batch.logs.length} log entries
                    </span>
                    <span className="text-xs text-slate-500">
                      Click any row to expand AI insights
                    </span>
                  </div>
                  <LogTable
                    logs={batch.logs}
                    insights={batch.insights}
                    filter={filter}
                    searchQuery={searchQuery}
                  />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div>
                  <AnalyticsCharts logs={batch.logs} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-cyan-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Ready to Translate Your Logs</h2>
      <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-6">
        Paste raw Syslog, SNMP Trap, or VPC Flow Log entries into the panel on the left.
        Our AI pipeline will parse, detect anomalies, categorize, and translate them into actionable plain-English insights.
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-lg">
        {[
          { emoji: '🔍', title: 'Log Parsing', desc: 'Structure raw data' },
          { emoji: '⚡', title: 'Anomaly Detection', desc: 'Flag unusual patterns' },
          { emoji: '🧠', title: 'AI Translation', desc: 'Plain-English insights' },
        ].map(f => (
          <div key={f.title} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-2xl mb-2">{f.emoji}</div>
            <div className="text-sm font-semibold text-white">{f.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-600">
        Click "Load Sample" in the input panel to try with example logs →
      </p>
    </div>
  );
}
