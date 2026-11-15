import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Alert } from '../types';
import { Bell, ShieldAlert, CheckCircle, Search, ExternalLink, Filter } from 'lucide-react';

export const AlertsNotificationsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleStatusChange = async (alertId: number, newStatus: string) => {
    try {
      await api.put(`/alerts/${alertId}`, {
        status: newStatus,
        resolution_notes: resolutionNotes || `Status updated to ${newStatus} by analyst.`
      });
      fetchAlerts();
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handlePromoteToIncident = async (alertId: number) => {
    try {
      const res = await api.post(`/alerts/${alertId}/create-incident`);
      alert(`Incident established: ${res.data.incident_number}`);
      fetchAlerts();
      setSelectedAlert(null);
    } catch (err: any) {
      alert(`Incident creation failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const filtered = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            Security Alerts & Triage Management
          </h2>
          <p className="text-xs text-slate-400">
            Real-time alert correlation, severity classification, analyst investigation, and false-positive filtering
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Threat Category</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Source / Origin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filtered.map((al) => (
                <tr key={al.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4 font-bold text-blue-400">{al.alert_code}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(al.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      al.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      al.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      al.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {al.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-semibold">{al.threat_category}</td>
                  <td className="py-3 px-4 text-slate-200">{al.risk_score}</td>
                  <td className="py-3 px-4 text-slate-300">{al.source_ip || al.source}</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-300 font-semibold">{al.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => { setSelectedAlert(al); setResolutionNotes(al.resolution_notes || ''); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs transition"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Alert Investigation: {selectedAlert.alert_code}</h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block mb-0.5">Title:</span>
                <p className="text-sm font-bold text-white">{selectedAlert.title}</p>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Automated ML Explanation:</span>
                <p className="text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 leading-relaxed">
                  {selectedAlert.explanation || selectedAlert.description}
                </p>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Analyst Resolution Notes:</span>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document containment action, verification observations, or false positive rationale..."
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handlePromoteToIncident(selectedAlert.id)}
                className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                Promote to Incident
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'FALSE_POSITIVE')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs"
                >
                  Mark False Positive
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'RESOLVED')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
