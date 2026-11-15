import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldAlert, Activity, Cpu, Users, Bell, FileText, Database,
  Sliders, BarChart2, HelpCircle, Terminal, LogOut, CheckCircle2,
  Server, Shield, AlertTriangle
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { label: 'SOC Overview', path: '/', icon: Activity },
    { label: 'Live Threat Monitoring', path: '/live-threats', icon: ShieldAlert },
    { label: 'Network Intrusion Detection', path: '/detection', icon: Cpu },
    { label: 'User Behaviour Analytics', path: '/uba', icon: Users },
    { label: 'Alerts & Notifications', path: '/alerts', icon: Bell },
    { label: 'Incident Management', path: '/incidents', icon: AlertTriangle },
    { label: 'Dataset Management', path: '/datasets', icon: Database },
    { label: 'ML Model Training', path: '/training', icon: Sliders },
    { label: 'Model Comparison', path: '/comparison', icon: BarChart2 },
    { label: 'Explainable AI (XAI)', path: '/xai', icon: HelpCircle },
    { label: 'Live Attack Simulation', path: '/simulation', icon: Terminal },
    { label: 'User Management & RBAC', path: '/users', icon: Shield, adminOnly: true },
    { label: 'Audit Logs', path: '/audit', icon: Server, adminOnly: true },
    { label: 'Research Reports & Analytics', path: '/reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#0a0e17] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#0f172a] border-r border-slate-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white">CAMPUS SOC</h1>
                <p className="text-[10px] text-blue-400 font-mono">INTELLIGENT IDS</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="truncate mr-2">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
                <p className="text-[10px] text-blue-400 font-mono truncate">{user?.role}</p>
              </div>
            )}
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top SOC Bar */}
        <header className="h-14 bg-[#0d131f] border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE SOC OPERATIONAL</span>
            </span>

            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                ACTIVE MODEL: XGBoost IDS (99.89%)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:block text-right">
              <p className="text-[11px] font-semibold text-slate-200">Sri Siddhartha Institute of Technology (SSIT), Tumakuru</p>
              <p className="text-[10px] text-slate-400">Candidate: Nalina G (25CSE09) | Guide: Dr. Nirmala G</p>
            </div>
            
            <button
              onClick={() => navigate('/simulation')}
              className="text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulate Attack</span>
            </button>
          </div>
        </header>

        {/* Routed Views */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0a0e17]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
