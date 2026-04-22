import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Severity } from '@/types/logs';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const configs = {
    critical: {
      label: 'Critical',
      icon: <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      class: 'bg-red-500/20 text-red-400 border-red-500/30',
      dot: 'bg-red-400',
    },
    warning: {
      label: 'Warning',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      class: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    informational: {
      label: 'Info',
      icon: <Info className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
  };

  const c = configs[severity];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${c.class}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  const dots = {
    critical: 'bg-red-400 shadow-red-400/50',
    warning: 'bg-amber-400 shadow-amber-400/50',
    informational: 'bg-emerald-400 shadow-emerald-400/50',
  };
  return <span className={`inline-block w-2 h-2 rounded-full shadow-lg ${dots[severity]}`} />;
}
