import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UBAProfileOut } from '../types';
import { Users, AlertTriangle, ShieldCheck, Clock, MapPin, KeyRound, ShieldAlert } from 'lucide-react';

export const UserBehaviourAnalyticsPage: React.FC = () => {
  const [profiles, setProfiles] = useState<UBAProfileOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get('/analytics/uba-profiles');
        setProfiles(res.data);
      } catch (err) {
        console.error('Failed to load UBA profiles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          User Behaviour Analytics (UBA) & Authentication Profiling
        </h2>
        <p className="text-xs text-slate-400">
          Continuous behavioural profiling, brute-force pattern recognition, off-hour access detection, and IP hopping radar
        </p>
      </div>

      {/* UBA Behavioral Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div
            key={profile.username}
            className={`bg-[#0f172a] border rounded-xl p-5 space-y-4 transition ${
              profile.risk_rating === 'High' ? 'border-rose-500/40 soc-glow-danger' :
              profile.risk_rating === 'Medium' ? 'border-amber-500/40' : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  {profile.username}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Last Known: {profile.last_known_ip}</p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                profile.risk_rating === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                profile.risk_rating === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                Risk: {profile.risk_rating}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400">Total</span>
                <p className="font-bold text-white mt-0.5">{profile.total_logins}</p>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400">Failures</span>
                <p className={`font-bold mt-0.5 ${profile.failed_logins > 0 ? 'text-rose-400' : 'text-white'}`}>
                  {profile.failed_logins}
                </p>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400">Success %</span>
                <p className="font-bold text-emerald-400 mt-0.5">{profile.success_rate_pct}%</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">Detected Behavioral Deviations:</span>
              {profile.anomalies_detected.length === 0 ? (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Conforms strictly to baseline login patterns
                </p>
              ) : (
                <ul className="space-y-1">
                  {profile.anomalies_detected.map((anom, idx) => (
                    <li key={idx} className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-1.5 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{anom}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Updated: {profile.last_activity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
