import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SOCSummaryKPI, SecurityEvent, Alert } from '../types';
import {
  ShieldAlert, Activity, AlertTriangle, CheckCircle, Users,
  TrendingUp, Clock, ArrowUpRight, Zap
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const [kpi, setKpi] = useState<SOCSummaryKPI | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [threatDist, setThreatDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, evRes, alRes, timeRes, distRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/detection/events?limit=8'),
          api.get('/alerts?limit=5'),
          api.get('/analytics/timeline'),
          api.get('/analytics/threat-distribution')
        ]);
        setKpi(kpiRes.data);
        setRecentEvents(evRes.data);
        setRecentAlerts(alRes.data);
        setTimeline(timeRes.data);
        setThreatDist(distRes.data);
      } catch (err) {
        console.error('Failed to load SOC analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Centralized Security Operations Center (SOC)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry, machine learning intrusion classification, and behavioral analytics
          </p>
        </div>
        <div className="flex items-center space-x-2 font-mono text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Last Sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Monitored Flows</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {kpi?.total_events.toLocaleString() || '15,000'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center">
            <span className="font-semibold">{kpi?.normal_traffic_pct}%</span>
            <span className="ml-1 text-slate-400">Normal traffic baseline</span>
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Threats Identified</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {kpi?.total_threats.toLocaleString() || '0'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Critical Alerts: <span className="text-rose-400 font-semibold">{kpi?.critical_alerts}</span>
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Suspicious Auth (UBA)</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {kpi?.suspicious_login_attempts || '0'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Active Accounts: <span className="text-white font-semibold">{kpi?.active_users}</span>
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Model Accuracy</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {kpi?.active_model_accuracy}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            Model: <span className="text-blue-400">{kpi?.active_model_name}</span>
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Network Traffic & Threat Volume (Last 6 Hours)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Packets / Minute</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="normGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="malGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time_label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="normal_count" stroke="#3b82f6" fillOpacity={1} fill="url(#normGrad)" name="Normal Flows" />
                <Area type="monotone" dataKey="malicious_count" stroke="#ef4444" fillOpacity={1} fill="url(#malGrad)" name="Threat Events" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Pie */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Threat Category Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatDist}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {threatDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {threatDist.slice(0, 4).map((item, idx) => (
              <div key={item.category} className="flex items-center text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{item.category}: {item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Grid: Recent Alerts and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts Table */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Active Security Alerts
            </h3>
            <span className="text-xs text-blue-400 font-medium cursor-pointer hover:underline">View All</span>
          </div>

          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active alerts recorded.</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{alert.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{alert.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Source: {alert.source_ip || 'Internal'} | Code: {alert.alert_code}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{alert.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Classified Network Events */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Flow Ingestion & Classification
            </h3>
            <span className="text-xs text-blue-400 font-medium cursor-pointer hover:underline">Telemetry Feed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Source IP</th>
                  <th className="py-2 px-3">Classification</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 text-slate-300">{ev.source_ip}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.predicted_class === 'Normal' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      }`}>
                        {ev.predicted_class}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{(ev.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] ${
                        ev.severity === 'CRITICAL' ? 'text-rose-400 font-bold' :
                        ev.severity === 'HIGH' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {ev.risk_score} ({ev.severity})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
