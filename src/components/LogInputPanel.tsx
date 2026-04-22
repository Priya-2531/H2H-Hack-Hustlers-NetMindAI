import { useState } from 'react';
import { Upload, Play, ChevronDown, FileText, Radio, Network, Loader2 } from 'lucide-react';
import { LogFormat } from '@/types/logs';
import { SAMPLE_SYSLOG, SAMPLE_SNMP, SAMPLE_VPC } from '@/utils/sampleLogs';

interface LogInputPanelProps {
  onProcess: (raw: string, format: LogFormat) => void;
  isProcessing: boolean;
}

const FORMAT_INFO: Record<LogFormat, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  syslog: {
    label: 'Syslog',
    icon: <FileText className="w-4 h-4" />,
    description: 'RFC 3164 / RFC 5424 syslog format',
    color: 'from-blue-500 to-cyan-500',
  },
  snmp: {
    label: 'SNMP Traps',
    icon: <Radio className="w-4 h-4" />,
    description: 'SNMP trap messages from network devices',
    color: 'from-violet-500 to-purple-500',
  },
  vpc: {
    label: 'VPC Flow Logs',
    icon: <Network className="w-4 h-4" />,
    description: 'AWS VPC Flow Logs (space-separated)',
    color: 'from-amber-500 to-orange-500',
  },
};

const SAMPLES: Record<LogFormat, string> = {
  syslog: SAMPLE_SYSLOG,
  snmp: SAMPLE_SNMP,
  vpc: SAMPLE_VPC,
};

export function LogInputPanel({ onProcess, isProcessing }: LogInputPanelProps) {
  const [format, setFormat] = useState<LogFormat>('syslog');
  const [rawLog, setRawLog] = useState('');
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRawLog(ev.target?.result as string ?? '');
    reader.readAsText(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRawLog(ev.target?.result as string ?? '');
    reader.readAsText(file);
  }

  function loadSample() {
    setRawLog(SAMPLES[format]);
  }

  function handleProcess() {
    if (!rawLog.trim() || isProcessing) return;
    onProcess(rawLog, format);
  }

  const lineCount = rawLog ? rawLog.split('\n').filter(l => l.trim()).length : 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          Log Input
        </h2>

        {/* Format selector */}
        <div className="flex gap-2">
          {(Object.keys(FORMAT_INFO) as LogFormat[]).map(f => {
            const info = FORMAT_INFO[f];
            const active = format === f;
            return (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  active
                    ? `bg-gradient-to-r ${info.color} text-white border-transparent shadow-lg`
                    : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {info.icon}
                {info.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2">{FORMAT_INFO[format].description}</p>
      </div>

      {/* Textarea + Drop zone */}
      <div
        className={`relative flex-1 min-h-0 ${dragging ? 'ring-2 ring-cyan-500' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {dragging && (
          <div className="absolute inset-0 bg-cyan-500/10 border-2 border-dashed border-cyan-500 rounded z-10 flex items-center justify-center">
            <span className="text-cyan-400 font-medium">Drop log file here</span>
          </div>
        )}
        <textarea
          value={rawLog}
          onChange={e => setRawLog(e.target.value)}
          placeholder={`Paste your ${FORMAT_INFO[format].label} entries here...\n\nOr drag & drop a log file.\nOr click "Load Sample" to try example logs.`}
          className="w-full h-full min-h-[280px] bg-slate-950 text-slate-300 font-mono text-xs resize-none p-4 focus:outline-none placeholder-slate-600 leading-5"
          spellCheck={false}
        />
      </div>

      {/* Footer controls */}
      <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {lineCount > 0 && (
            <span className="text-xs text-slate-500">{lineCount} log lines</span>
          )}
          <button
            onClick={loadSample}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" />
            Load Sample
          </button>
          <label className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer transition-colors flex items-center gap-1">
            <Upload className="w-3 h-3" />
            Upload File
            <input type="file" className="hidden" accept=".log,.txt,.csv" onChange={handleFileInput} />
          </label>
        </div>

        <button
          onClick={handleProcess}
          disabled={!rawLog.trim() || isProcessing}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            rawLog.trim() && !isProcessing
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Analyze Logs
            </>
          )}
        </button>
      </div>
    </div>
  );
}
