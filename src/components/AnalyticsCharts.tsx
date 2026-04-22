import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { ParsedLog } from '@/types/logs';

interface AnalyticsChartsProps {
  logs: ParsedLog[];
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  informational: '#10b981',
};

const ANOMALY_COLORS_MAP: Record<string, string> = {
  port_scan: '#ef4444',
  high_traffic: '#f97316',
  auth_failure: '#f43f5e',
  unusual_protocol: '#a855f7',
  rate_spike: '#f59e0b',
  geo_anomaly: '#3b82f6',
  ddos_pattern: '#dc2626',
  none: '#475569',
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill ?? '#94a3b8' }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsCharts({ logs }: AnalyticsChartsProps) {
  // Severity distribution
  const severityData = [
    { name: 'Critical', value: logs.filter(l => l.severity === 'critical').length, fill: SEVERITY_COLORS.critical },
    { name: 'Warning', value: logs.filter(l => l.severity === 'warning').length, fill: SEVERITY_COLORS.warning },
    { name: 'Info', value: logs.filter(l => l.severity === 'informational').length, fill: SEVERITY_COLORS.informational },
  ].filter(d => d.value > 0);

  // Category distribution
  const categoryCount: Record<string, number> = {};
  logs.forEach(l => { categoryCount[l.category] = (categoryCount[l.category] ?? 0) + 1; });
  const categoryData = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Anomaly distribution
  const anomalyCount: Record<string, number> = {};
  logs.filter(l => l.anomaly !== 'none').forEach(l => {
    const label = l.anomaly.replace(/_/g, ' ');
    anomalyCount[label] = (anomalyCount[label] ?? 0) + 1;
  });
  const anomalyData = Object.entries(anomalyCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      fill: Object.values(ANOMALY_COLORS_MAP)[i] ?? '#6366f1',
    }));

  // Source IP activity
  const sourceCount: Record<string, { critical: number; warning: number; info: number }> = {};
  logs.forEach(l => {
    if (!sourceCount[l.source]) sourceCount[l.source] = { critical: 0, warning: 0, info: 0 };
    if (l.severity === 'critical') sourceCount[l.source].critical++;
    else if (l.severity === 'warning') sourceCount[l.source].warning++;
    else sourceCount[l.source].info++;
  });
  const sourceData = Object.entries(sourceCount)
    .sort((a, b) => (b[1].critical + b[1].warning) - (a[1].critical + a[1].warning))
    .slice(0, 8)
    .map(([name, vals]) => ({ name, ...vals }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Severity Pie */}
      <ChartCard title="Severity Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={severityData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {severityData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Anomaly Bar */}
      <ChartCard title="Anomaly Breakdown">
        {anomalyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={anomalyData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {anomalyData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
            No anomalies detected
          </div>
        )}
      </ChartCard>

      {/* Category Bar */}
      <ChartCard title="Log Categories">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Source IP Activity */}
      <ChartCard title="Top Source IPs by Activity">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sourceData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="square"
              iconSize={8}
              formatter={(value) => <span className="text-slate-300 text-xs capitalize">{value}</span>}
            />
            <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
            <Bar dataKey="warning" name="Warning" fill="#f59e0b" stackId="a" />
            <Bar dataKey="info" name="Info" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}
