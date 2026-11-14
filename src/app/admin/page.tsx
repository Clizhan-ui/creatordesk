'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  ShieldCheck, 
  Users, 
  Video, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Search, 
  ArrowLeft,
  Lock,
  Mail,
  Calendar,
  Sparkles
} from 'lucide-react';
import { SessionUser } from '@/types';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      if (meData.user.role !== 'admin') {
        setLoading(false);
        return;
      }

      await Promise.all([loadUsers(), loadAuditLogs()]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setKpis(data.kpis || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (targetUser: any) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setTogglingId(targetUser.id);

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        await Promise.all([loadUsers(), loadAuditLogs()]);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user status');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  if (!loading && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={user} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
            <p className="text-xs text-slate-500">
              Role-Based Access Control (RBAC): The administrative portal is restricted to accounts with administrator privileges.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Return to Creator Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-600 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">System Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Governance Portal
            </h1>
            <p className="text-sm text-slate-500">
              Manage system users, oversee platform activities, and inspect security audit trails
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Users Directory
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Audit Logs
            </button>
          </div>
        </div>

        {/* System KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Accounts</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpis?.total_users || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Creators</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{kpis?.active_creators || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Suspended</span>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{kpis?.suspended_users || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Platform Contents</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{kpis?.total_contents || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total System Views</span>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">
              {(kpis?.total_system_views || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {activeTab === 'users' ? (
          /* Users Directory */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">Registered Accounts Directory</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-right">Ideas</th>
                    <th className="py-3 px-3 text-right">Contents</th>
                    <th className="py-3 px-3 text-right">Total Views</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Registered</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                        {u.ideas_count}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                        {u.content_count}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        {Number(u.total_views || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={togglingId === u.id}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              u.status === 'active'
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {togglingId === u.id
                              ? 'Updating...'
                              : u.status === 'active'
                              ? 'Suspend'
                              : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* System Audit Trail */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">System Activity Audit Log</h2>
              <span className="text-xs text-slate-500">Last 50 recorded security events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Details</th>
                    <th className="py-3 px-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-sans font-medium text-slate-900">
                        {log.user_email || `User #${log.user_id || 'Guest'}`}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 max-w-sm truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
