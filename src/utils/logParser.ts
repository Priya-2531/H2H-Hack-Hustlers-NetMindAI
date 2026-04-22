import { ParsedLog, LogFormat, Severity, AnomalyType } from '@/types/logs';

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

// ─── Syslog Parser ────────────────────────────────────────────────────────────
const SYSLOG_PATTERN =
  /^<(\d+)>(\w{3}\s+\d+\s+[\d:]+)\s+([\w.\-]+)\s+([\w/.\[\]]+):\s*(.*)$/;

const SYSLOG_PATTERN_5424 =
  /^<(\d+)>(\d)\s+([\dT:.Z\-]+)\s+([\w.\-]+)\s+([\w.\-]+)\s+([\w\-]+)\s+([\w\-]+)\s+-?\s*(.*)$/;

function parseSyslogFacilityAndSeverity(priority: number): {
  facility: string;
  severity: Severity;
} {
  const facilityCode = Math.floor(priority / 8);
  const severityCode = priority % 8;

  const facilities: Record<number, string> = {
    0: 'kernel', 1: 'user', 2: 'mail', 3: 'system', 4: 'security',
    5: 'syslogd', 6: 'lpr', 7: 'news', 8: 'uucp', 9: 'clock',
    10: 'security', 11: 'ftp', 12: 'ntp', 13: 'audit', 14: 'alert',
    15: 'clock2', 16: 'local0', 17: 'local1', 18: 'local2', 19: 'local3',
    20: 'local4', 21: 'local5', 22: 'local6', 23: 'local7',
  };

  const severity: Severity =
    severityCode <= 2 ? 'critical' : severityCode <= 4 ? 'warning' : 'informational';

  return { facility: facilities[facilityCode] ?? 'unknown', severity };
}

function parseSyslog(line: string): Partial<ParsedLog> {
  const m5424 = line.match(SYSLOG_PATTERN_5424);
  if (m5424) {
    const priority = parseInt(m5424[1]);
    const { facility, severity } = parseSyslogFacilityAndSeverity(priority);
    return {
      format: 'syslog',
      rawLine: line,
      timestamp: new Date(m5424[3]),
      source: m5424[4],
      message: m5424[8],
      facility,
      severity,
      category: deriveCategory(m5424[5], m5424[8]),
      structured: {
        priority,
        version: m5424[2],
        hostname: m5424[4],
        appName: m5424[5],
        procId: m5424[6],
        msgId: m5424[7],
        facility,
      },
    };
  }

  const m = line.match(SYSLOG_PATTERN);
  if (m) {
    const priority = parseInt(m[1]);
    const { facility, severity } = parseSyslogFacilityAndSeverity(priority);
    const timestamp = parseShortDate(m[2]);
    return {
      format: 'syslog',
      rawLine: line,
      timestamp,
      source: m[3],
      message: m[5],
      facility,
      severity,
      category: deriveCategory(m[4], m[5]),
      structured: { priority, hostname: m[3], process: m[4], facility },
    };
  }

  return {
    format: 'syslog',
    rawLine: line,
    timestamp: new Date(),
    source: 'unknown',
    message: line,
    facility: 'unknown',
    severity: classifyByKeywords(line),
    category: 'General',
    structured: {},
  };
}

function parseShortDate(s: string): Date {
  const now = new Date();
  const d = new Date(`${s} ${now.getFullYear()}`);
  return isNaN(d.getTime()) ? now : d;
}

// ─── SNMP Trap Parser ─────────────────────────────────────────────────────────
function parseSNMP(line: string): Partial<ParsedLog> {
  const oidPattern = /OID[:\s]+([\w.]+)/i;
  const enterprisePattern = /Enterprise[:\s]+([\w.]+)/i;
  const agentPattern = /Agent[:\s]+([\d.]+)/i;
  const trapTypePattern = /Trap[- ]Type[:\s]+(\w+)/i;

  const oid = line.match(oidPattern)?.[1] ?? '';
  const enterprise = line.match(enterprisePattern)?.[1] ?? '';
  const agent = line.match(agentPattern)?.[1] ?? 'unknown';
  const trapType = line.match(trapTypePattern)?.[1] ?? '';

  const severity = deriveSNMPSeverity(oid, line);

  return {
    format: 'snmp',
    rawLine: line,
    timestamp: new Date(),
    source: agent,
    message: line,
    severity,
    category: deriveSNMPCategory(oid, enterprise, line),
    structured: { oid, enterprise, agent, trapType },
  };
}

function deriveSNMPSeverity(oid: string, line: string): Severity {
  const criticalOids = ['1.3.6.1.6.3.1.1.5.4', '1.3.6.1.6.3.1.1.5.5'];
  if (criticalOids.some(o => oid.startsWith(o)) || /down|fail|error|critical|alert|unreachable/i.test(line))
    return 'critical';
  if (/warn|degraded|threshold|high|exceed/i.test(line)) return 'warning';
  return 'informational';
}

function deriveSNMPCategory(oid: string, _enterprise: string, line: string): string {
  if (oid.includes('1.3.6.1.2.1.2') || /interface|ifoper/i.test(line)) return 'Interface';
  if (oid.includes('1.3.6.1.2.1.4') || /ip\w+/i.test(line)) return 'IP Layer';
  if (/bgp|ospf|rip|routing/i.test(line)) return 'Routing';
  if (/cpu|memory|disk|load/i.test(line)) return 'Resource';
  if (/auth|login|password|snmpv3/i.test(line)) return 'Authentication';
  return 'SNMP Trap';
}

// ─── VPC Flow Log Parser ──────────────────────────────────────────────────────
const PROTOCOL_MAP: Record<number, string> = {
  1: 'ICMP', 6: 'TCP', 17: 'UDP', 41: 'IPv6', 47: 'GRE', 50: 'ESP', 89: 'OSPF',
};

function parseVPCFlowLog(line: string): Partial<ParsedLog> | null {
  if (line.startsWith('version') || line.startsWith('#')) return null;

  const parts = line.trim().split(/\s+/);
  if (parts.length < 14) return null;

  const srcAddr = parts[3];
  const dstAddr = parts[4];
  const srcPort = parseInt(parts[5]);
  const dstPort = parseInt(parts[6]);
  const protocol = parseInt(parts[7]);
  const packets = parseInt(parts[8]);
  const bytes = parseInt(parts[9]);
  const startTime = new Date(parseInt(parts[10]) * 1000);
  const action = parts[12];

  const protocolName = PROTOCOL_MAP[protocol] ?? `PROTO${protocol}`;
  const severity = deriveVPCSeverity(action, dstPort, bytes);

  return {
    format: 'vpc',
    rawLine: line,
    timestamp: startTime,
    source: srcAddr,
    destination: dstAddr,
    protocol: protocolName,
    port: dstPort,
    bytes,
    action,
    message: `${action} ${protocolName} ${srcAddr}:${srcPort} → ${dstAddr}:${dstPort} | ${packets} pkts | ${bytes} bytes`,
    severity,
    category: deriveVPCCategory(dstPort, action),
    structured: {
      version: parts[0],
      accountId: parts[1],
      interfaceId: parts[2],
      srcAddr,
      dstAddr,
      srcPort,
      dstPort,
      protocol: protocolName,
      packets,
      bytes,
      action,
      logStatus: parts[13],
    },
  };
}

function deriveVPCSeverity(action: string, dstPort: number, bytes: number): Severity {
  if (action === 'REJECT' && isSensitivePort(dstPort)) return 'critical';
  if (action === 'REJECT') return 'warning';
  if (bytes > 10_000_000) return 'warning';
  if (isSensitivePort(dstPort) && action === 'ACCEPT') return 'warning';
  return 'informational';
}

function isSensitivePort(port: number): boolean {
  return [22, 23, 25, 3389, 445, 135, 139, 1433, 3306, 5432, 6379, 27017, 4444, 31337].includes(port);
}

function deriveVPCCategory(port: number, action: string): string {
  if ([80, 443, 8080, 8443].includes(port)) return 'Web Traffic';
  if ([22, 23].includes(port)) return 'Remote Access';
  if ([25, 587, 993, 995].includes(port)) return 'Email';
  if ([53].includes(port)) return 'DNS';
  if ([3306, 5432, 1433, 27017, 6379].includes(port)) return 'Database';
  if (action === 'REJECT') return 'Blocked Traffic';
  return 'Network Flow';
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function classifyByKeywords(msg: string): Severity {
  if (/critical|emergency|alert|down|fail|error|denied|attack|breach|exploit/i.test(msg))
    return 'critical';
  if (/warn|high|exceed|threshold|unusual|anomal|degrad/i.test(msg)) return 'warning';
  return 'informational';
}

function deriveCategory(process: string, msg: string): string {
  if (/sshd|ssh/i.test(process)) return 'Remote Access';
  if (/firewall|iptables|pf|ufw/i.test(process) || /REJECT|DROP|DENY/i.test(msg)) return 'Firewall';
  if (/cron/i.test(process)) return 'Scheduling';
  if (/kernel/i.test(process)) return 'Kernel';
  if (/nginx|apache|httpd/i.test(process)) return 'Web Server';
  if (/sudo|su\b/i.test(process)) return 'Privilege Escalation';
  if (/dhcp/i.test(process)) return 'DHCP';
  if (/dns|named|bind/i.test(process)) return 'DNS';
  if (/ospf|bgp|routing/i.test(process)) return 'Routing';
  if (/auth|pam|login/i.test(process + msg)) return 'Authentication';
  return 'System';
}

// ─── Anomaly Detection ────────────────────────────────────────────────────────
function detectAnomaly(
  log: Partial<ParsedLog>,
  allLogs: Partial<ParsedLog>[]
): { anomaly: AnomalyType; anomalyScore: number } {
  const msg = (log.message ?? '').toLowerCase();
  const src = log.source ?? '';

  if (/failed|invalid|authentication failure|refused/i.test(msg)) {
    const fails = allLogs.filter(
      l => l.source === src && /failed|invalid|authentication failure/i.test(l.message ?? '')
    ).length;
    if (fails >= 3) return { anomaly: 'auth_failure', anomalyScore: Math.min(95, 50 + fails * 10) };
  }

  const portsFromSource = new Set(
    allLogs.filter(l => l.source === src && l.port).map(l => l.port)
  );
  if (portsFromSource.size > 5) {
    return { anomaly: 'port_scan', anomalyScore: Math.min(99, 60 + portsFromSource.size * 4) };
  }

  if ((log.bytes ?? 0) > 5_000_000) {
    return { anomaly: 'high_traffic', anomalyScore: Math.min(90, 50 + Math.floor((log.bytes ?? 0) / 1_000_000) * 5) };
  }

  if (/gre|esp|ospf|proto\d+/i.test(log.protocol ?? '')) {
    return { anomaly: 'unusual_protocol', anomalyScore: 60 };
  }

  const dest = log.destination;
  if (dest) {
    const sourcesToDest = new Set(allLogs.filter(l => l.destination === dest).map(l => l.source)).size;
    if (sourcesToDest > 8) {
      return { anomaly: 'ddos_pattern', anomalyScore: Math.min(98, 60 + sourcesToDest * 3) };
    }
  }

  if (/rate|spike|burst|flood/i.test(msg)) return { anomaly: 'rate_spike', anomalyScore: 70 };
  if (/foreign|unknown country|geo/i.test(msg)) return { anomaly: 'geo_anomaly', anomalyScore: 65 };
  if (log.severity === 'critical') return { anomaly: 'none', anomalyScore: 40 };
  if (log.severity === 'warning') return { anomaly: 'none', anomalyScore: 20 };
  return { anomaly: 'none', anomalyScore: 0 };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export function parseLogBatch(raw: string, format: LogFormat): ParsedLog[] {
  const lines = raw.split('\n').filter(l => l.trim());

  const partials: Partial<ParsedLog>[] = lines.map(l => {
    switch (format) {
      case 'syslog': return parseSyslog(l);
      case 'snmp':   return parseSNMP(l);
      case 'vpc':    return parseVPCFlowLog(l) ?? { format, rawLine: l, message: l, timestamp: new Date(), source: 'unknown', severity: 'informational' as Severity, category: 'General', structured: {} };
    }
  }).filter(Boolean) as Partial<ParsedLog>[];

  return partials.map(p => {
    const { anomaly, anomalyScore } = detectAnomaly(p, partials);
    return {
      id: makeId(),
      rawLine: p.rawLine ?? '',
      format: p.format ?? format,
      timestamp: p.timestamp ?? new Date(),
      severity: p.severity ?? 'informational',
      source: p.source ?? 'unknown',
      destination: p.destination,
      message: p.message ?? '',
      protocol: p.protocol,
      port: p.port,
      bytes: p.bytes,
      action: p.action,
      facility: p.facility,
      category: p.category ?? 'General',
      anomaly,
      anomalyScore,
      structured: p.structured ?? {},
    } as ParsedLog;
  });
}
