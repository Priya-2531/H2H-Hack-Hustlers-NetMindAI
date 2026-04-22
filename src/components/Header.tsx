import { useState } from 'react';
import { Shield, Key, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { initOpenAI } from '@/utils/aiTranslator';

interface HeaderProps {
  onApiKeySet: () => void;
}

export function Header({ onApiKeySet }: HeaderProps) {
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keySet, setKeySet] = useState(false);

  function handleSetKey() {
    if (!apiKey.trim()) return;
    initOpenAI(apiKey.trim());
    setKeySet(true);
    setShowApiInput(false);
    onApiKeySet();
  }

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                NetLog
                <span className="text-cyan-400">AI</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Translator
                </span>
              </h1>
              <p className="text-slate-400 text-xs">Network Log Intelligence Platform — Reducing Time to Clarity</p>
            </div>
          </div>

          {/* API Key Section */}
          <div className="flex items-center gap-3">
            {keySet ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                <Key className="w-4 h-4" />
                <span>AI Connected</span>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            ) : (
              <button
                onClick={() => setShowApiInput(!showApiInput)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-all"
              >
                <Key className="w-4 h-4" />
                <span>Add OpenAI Key</span>
                {showApiInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {showApiInput && !keySet && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSetKey()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
                />
                <button
                  onClick={handleSetKey}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>

        {!keySet && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>💡 Add your OpenAI API key for AI-powered insights, or use the rule-based engine without a key.</span>
          </div>
        )}
      </div>
    </header>
  );
}
