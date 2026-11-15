import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Incident } from '../types';
import { AlertTriangle, Plus, FileText, CheckCircle2, User, MessageSquare } from 'lucide-react';

export const IncidentManagementPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data);
    } catch (err) {
      console.error('Failed to load incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !newNote.trim()) return;
    try {
      await api.post(`/incidents/${selectedIncident.id}/notes?note_text=${encodeURIComponent(newNote)}`);
      setNewNote('');
      const updated = await api.get(`/incidents/${selectedIncident.id}`);
      setSelectedIncident(updated.data);
      fetchIncidents();
    } catch (err: any) {
      alert(`Failed to add note: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedIncident) return;
    try {
      const updated = await api.put(`/incidents/${selectedIncident.id}`, { status: newStatus });
      setSelectedIncident(updated.data);
      fetchIncidents();
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Security Incident Response & Case Management
          </h2>
          <p className="text-xs text-slate-400">
            Escalated security incident triage, forensic timeline correlation, root cause analysis, and containment tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-2">Active Incidents ({incidents.length})</h3>
          <div className="space-y-2 overflow-y-auto max-h-[600px]">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                  selectedIncident?.id === inc.id ?
                  'bg-blue-600/10 border-blue-500/40 text-blue-300' :
                  'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span className="font-bold text-blue-400">{inc.incident_number}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                    inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {inc.severity}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-100 mt-1 line-clamp-1">{inc.title}</h4>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                  <span>Status: {inc.status}</span>
                  <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Case Detail */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-5">
          {selectedIncident ? (
            <div className="space-y-5 text-xs font-mono">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-blue-400 font-bold">{selectedIncident.incident_number}</span>
                  <h3 className="text-base font-bold text-white font-sans mt-0.5">{selectedIncident.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Assignee: {selectedIncident.assigned_to}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 focus:outline-none"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="CONTAINED">CONTAINED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Incident Summary & Scope:</span>
                <p className="text-slate-300 bg-slate-900/80 p-3 rounded border border-slate-800 leading-relaxed font-sans text-xs">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Root Cause Analysis:</span>
                  <p className="text-slate-300">{selectedIncident.root_cause || 'Under investigation by SOC team.'}</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Mitigation & Containment Steps:</span>
                  <p className="text-slate-300">{selectedIncident.mitigation_steps || 'Pre-configured firewall rate-limiting applied.'}</p>
                </div>
              </div>

              {/* Notes Timeline */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Investigation Timeline & Notes ({selectedIncident.notes?.length || 0})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedIncident.notes && selectedIncident.notes.length > 0 ? (
                    selectedIncident.notes.map((note) => (
                      <div key={note.id} className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
                        <div className="flex justify-between text-slate-500 text-[10px] mb-1">
                          <span className="text-blue-400 font-semibold">{note.author_name}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 font-sans">{note.note_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-[11px]">No notes added yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an investigator log note..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-semibold"
                  >
                    Post Note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs font-mono">
              Select an incident from the left panel to inspect forensic details and mitigation history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
