import React, { useState } from 'react';
import api from '../services/api';
import { Terminal, Play, AlertTriangle, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export const LiveSimulationPage: React.FC = () => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<any[]>([]);

  const scenarios = [
    { code: 'normal_web_browse', title: 'Scenario 1: Normal Campus Web Browsing (HTTPS)', desc: 'Standard student portal session with nominal TCP timings and packet distributions.', isAttack: false },
    { code: 'dos_syn_flood', title: 'Scenario 2: Denial-of-Service (TCP SYN Flood)', desc: 'Extreme packet arrival rate (121,000 pkts/s), unacknowledged SYNs, zero TCP window.', isAttack: true },
    { code: 'nmap_port_scan', title: 'Scenario 3: Nmap Aggressive Port Scan', desc: 'Rapid SYN scanning across diverse ports with zero payload transfer, elevated TTL.', isAttack: true },
    { code: 'ssh_brute_force', title: 'Scenario 4: Credential Brute-Force (SSH Port 22)', desc: 'Repeated high-frequency connection sequences to port 22 with auth payload exchanges.', isAttack: true },
    { code: 'sql_injection_web', title: 'Scenario 5: Web Application Attack (SQLi / XSS)', desc: 'Abnormal source-to-destination payload bytes ratio containing SQL injection signatures.', isAttack: true },
    { code: 'botnet_c2_beacon', title: 'Scenario 6: Botnet Command & Control (C2) Beaconing', desc: 'Periodic beacon heartbeats with distinct jitter and regular timing to external rogue host.', isAttack: true },
    { code: 'lateral_infiltration', title: 'Scenario 7: Unauthorized Lateral Movement', desc: 'Compromised student workstation attempting administrative SSH access to core campus gateway.', isAttack: true },
  ];

  const handleTriggerScenario = async (code: string) => {
    setLoadingScenario(code);
    try {
      const res = await api.post(`/simulation/trigger/${code}`);
      const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        scenario: res.data.scenario,
        outcome: res.data.detection_outcome
      };
      setSimulationLogs((prev) => [logEntry, ...prev]);
    } catch (err: any) {
      alert(`Simulation failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleTriggerUBA = async (attackType: string) => {
    setLoadingScenario(attackType);
    try {
      const res = await api.post(`/simulation/trigger-uba-attack?username=student_user&attack_type=${attackType}`);
      const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        scenario: attackType === 'brute_force' ? 'UBA: 5x Failed Brute Force Probe' : 'UBA: Off-Hours Account Access (2:00 AM)',
        outcome: {
          predicted_class: 'SuspiciousLogin',
          is_malicious: true,
          severity: attackType === 'brute_force' ? 'HIGH' : 'MEDIUM',
          risk_score: attackType === 'brute_force' ? 75.0 : 45.0,
          explanation: res.data.results[0]?.anomaly_reason || 'UBA anomaly triggered',
          model_used: 'User Behaviour Analytics Engine',
          alert_generated: true,
          alert_code: `ALT-UBA-${Date.now().toString().slice(-6)}`
        }
      };
      setSimulationLogs((prev) => [logEntry, ...prev]);
    } catch (err: any) {
      alert(`UBA simulation failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-rose-400" />
            Controlled Cybersecurity Simulation Environment
          </h2>
          <p className="text-xs text-slate-400">
            Generate synthetic campus traffic and attack scenarios to evaluate end-to-end detection, risk scoring, and alert dispatch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios Selection Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Network Flow Attack Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarios.map((sc) => (
                <div key={sc.code} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        sc.isAttack ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {sc.isAttack ? 'ATTACK' : 'BENIGN'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1">{sc.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{sc.desc}</p>
                  </div>

                  <button
                    onClick={() => handleTriggerScenario(sc.code)}
                    disabled={loadingScenario !== null}
                    className="mt-3 w-full bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-semibold py-1.5 rounded transition flex items-center justify-center gap-1.5 font-mono"
                  >
                    {loadingScenario === sc.code ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Play className="w-3 h-3 text-blue-400" />
                    )}
                    <span>Trigger Scenario</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Behaviour Simulation */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">User Authentication & Behaviour Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    UBA BRUTE-FORCE
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Simulate 5x Failed Authentication Probe</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Fires rapid authentication failures against target student account to trigger lockout policy.</p>
                </div>
                <button
                  onClick={() => handleTriggerUBA('brute_force')}
                  disabled={loadingScenario !== null}
                  className="mt-3 w-full bg-slate-800 hover:bg-amber-600 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-semibold py-1.5 rounded transition font-mono flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Execute Brute-Force Probe</span>
                </button>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    UBA OFF-HOURS
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Simulate Off-Hours Access (2:00 AM UTC)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Simulates successful authentication at abnormal night hours from an unrecognized external IP.</p>
                </div>
                <button
                  onClick={() => handleTriggerUBA('off_hours')}
                  disabled={loadingScenario !== null}
                  className="mt-3 w-full bg-slate-800 hover:bg-purple-600 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-semibold py-1.5 rounded transition font-mono flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Execute Off-Hours Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Simulation Output Feed */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Live Execution Feed ({simulationLogs.length})
            </h3>
            {simulationLogs.length > 0 && (
              <button
                onClick={() => setSimulationLogs([])}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {simulationLogs.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs font-mono">
                Trigger any attack scenario to observe real-time inference and alert dispatch.
              </div>
            ) : (
              simulationLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.outcome.predicted_class === 'Normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {log.outcome.predicted_class} ({log.outcome.severity})
                    </span>
                  </div>

                  <p className="font-semibold text-slate-200">{log.scenario}</p>
                  
                  <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-2 rounded border border-slate-800/80">
                    <div><span className="text-slate-500">Risk Score:</span> {log.outcome.risk_score} / 100</div>
                    <div><span className="text-slate-500">Alert Spawned:</span> <span className="text-emerald-400">{log.outcome.alert_generated ? log.outcome.alert_code : 'None'}</span></div>
                    <div><span className="text-slate-500">Rationale:</span> {log.outcome.explanation}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
