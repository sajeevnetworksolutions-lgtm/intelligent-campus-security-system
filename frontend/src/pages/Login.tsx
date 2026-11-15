import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Lock, User, KeyRound, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10 max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 soc-glow">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 mb-1">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase">
            Campus Cybersecurity SOC
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Sri Siddhartha Institute of Technology (SSIT), Tumakuru
          </p>
          <p className="text-[10px] text-blue-400 font-mono">
            M.Tech CSE Project — Nalina G (25CSE09)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-rose-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Username / Account ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 font-sans"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 font-sans"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-sans text-xs font-bold py-3 rounded-lg transition duration-200 uppercase tracking-wider"
          >
            {loading ? 'Authenticating...' : 'Authenticate to SOC'}
          </button>
        </form>

        {/* Demo Fast Credential Switcher */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-mono block text-center">
            One-Click Role Demonstration Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'AdminPassword123!')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded border border-slate-800 text-left"
            >
              <span className="text-purple-400 font-bold block">Super Admin</span>
              <span>admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('soc_analyst', 'AnalystPassword123!')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded border border-slate-800 text-left"
            >
              <span className="text-rose-400 font-bold block">SOC Analyst</span>
              <span>soc_analyst</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('faculty_user', 'FacultyPassword123!')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded border border-slate-800 text-left"
            >
              <span className="text-amber-400 font-bold block">Faculty Member</span>
              <span>faculty_user</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('student_user', 'StudentPassword123!')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded border border-slate-800 text-left"
            >
              <span className="text-blue-400 font-bold block">Student Account</span>
              <span>student_user</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
