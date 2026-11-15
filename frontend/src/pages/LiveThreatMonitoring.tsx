import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SecurityEvent } from '../types';
import { ShieldAlert, Play, Pause, RefreshCw, Filter, Eye, AlertTriangle, ShieldCheck } from 'lucide-react';

export const LiveThreatMonitoringPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    let interval: any = null;
    const fetchLatest = async () => {
      try {
        const res = await api.get('/detection/events?limit=30');
        setEvents(res.data);
      } catch (err) {
        console.error('Failed to poll events', err);
      }
    };

    fetchLatest();
    if (isLive) {
      interval = setInterval(fetchLatest, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const filtered = events.filter((e) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'ATTACKS_ONLY') return e.predicted_class !== 'Normal';
    return e.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Live Threat Stream & Telemetry Monitoring
          </h2>
          <p className="text-xs text-slate-400">
            Real-time inspection of campus network packets, intrusion probability, and attack vector alerts
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Events</option>
            <option value="ATTACKS_ONLY">Attacks Only</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Main Stream Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-semibold">STREAM FEED: {filtered.length} Packets Captured</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sampling Window: 3s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Source IP</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">Protocol</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4">Confidence</th>
                <th className="py-2.5 px-4">Risk Score</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-2.5 px-4 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-4 text-slate-200">{ev.source_ip}</td>
                  <td className="py-2.5 px-4 text-slate-300">{ev.destination_ip}</td>
                  <td className="py-2.5 px-4 text-blue-400 uppercase">{ev.protocol}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      ev.predicted_class === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {ev.predicted_class}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">{(ev.confidence * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-slate-200">{ev.risk_score}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      ev.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      ev.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {ev.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedEvent(ev)}
                      className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                      title="Inspect Event"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Event Telemetry Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div><span className="text-slate-500">Event ID:</span> #{selectedEvent.id}</div>
              <div><span className="text-slate-500">Timestamp:</span> {new Date(selectedEvent.timestamp).toLocaleString()}</div>
              <div><span className="text-slate-500">Source:</span> {selectedEvent.source_ip}</div>
              <div><span className="text-slate-500">Destination:</span> {selectedEvent.destination_ip}</div>
              <div><span className="text-slate-500">Protocol:</span> {selectedEvent.protocol.toUpperCase()}</div>
              <div><span className="text-slate-500">Service:</span> {selectedEvent.service}</div>
              <div><span className="text-slate-500">Class:</span> <span className="text-rose-400 font-bold">{selectedEvent.predicted_class}</span></div>
              <div><span className="text-slate-500">Risk Score:</span> {selectedEvent.risk_score} / 100</div>
              <div><span className="text-slate-500">Confidence:</span> {(selectedEvent.confidence * 100).toFixed(2)}%</div>
              <div><span className="text-slate-500">Severity:</span> {selectedEvent.severity}</div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
