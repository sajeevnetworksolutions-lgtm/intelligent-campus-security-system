import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';
import { Shield, Plus, Lock, Unlock, Trash2, Key } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'Student',
    department: 'Computer Science & Engineering'
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleLock = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { is_locked: !user.is_locked });
      fetchUsers();
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      alert('User created successfully');
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'Student',
        department: 'Computer Science & Engineering'
      });
      fetchUsers();
    } catch (err: any) {
      alert(`User creation failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            User Management & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-400">
            Administer institutional user privileges across Super Administrator, Security Administrator, Faculty, and Student roles
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4 text-slate-400">#{u.id}</td>
                  <td className="py-3 px-4 font-bold text-white font-sans">{u.full_name}</td>
                  <td className="py-3 px-4 text-blue-400">{u.username}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'Super Administrator' ? 'bg-purple-500/20 text-purple-400' :
                      u.role === 'Security Administrator' ? 'bg-rose-500/20 text-rose-400' :
                      u.role === 'Faculty' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{u.department}</td>
                  <td className="py-3 px-4">
                    {u.is_locked ? (
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">LOCKED</span>
                    ) : (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">ACTIVE</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleLock(u)}
                      className={`p-1.5 rounded transition ${
                        u.is_locked ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'
                      }`}
                      title={u.is_locked ? 'Unlock Account' : 'Lock Account'}
                    >
                      {u.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white font-sans">Create Institutional User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Institutional Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Initial Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Assigned RBAC Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Security Administrator">Security Administrator</option>
                  <option value="Super Administrator">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-semibold"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
