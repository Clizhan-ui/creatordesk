'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  Users, 
  Plus, 
  Sparkles, 
  Trash2, 
  X,
  ExternalLink,
  Award,
  Percent,
  Calendar
} from 'lucide-react';
import { TrendAreaChart, PlatformBarChart } from '@/components/Charts';
import { ContentItem, ContentAnalytics, SessionUser } from '@/types';

export default function AnalyticsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [availableContents, setAvailableContents] = useState<ContentItem[]>([]);

  // Log modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | ''>('');
  const [inputViews, setInputViews] = useState('');
  const [inputLikes, setInputLikes] = useState('');
  const [inputComments, setInputComments] = useState('');
  const [inputShares, setInputShares] = useState('');
  const [inputFollowers, setInputFollowers] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const fetchSessionAndData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      await Promise.all([loadAnalytics(), loadContents()]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadContents = async () => {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        setAvailableContents(data.contents || []);
        if (data.contents?.length > 0 && selectedContentId === '') {
          setSelectedContentId(data.contents[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContentId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: Number(selectedContentId),
          views: Number(inputViews) || 0,
          likes: Number(inputLikes) || 0,
          comments: Number(inputComments) || 0,
          shares: Number(inputShares) || 0,
          followers_count: Number(inputFollowers) || 0,
          recorded_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        await loadAnalytics();
        setIsModalOpen(false);
        setInputViews('');
        setInputLikes('');
        setInputComments('');
        setInputShares('');
        setInputFollowers('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      const res = await fetch(`/api/analytics/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAnalytics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totals = analyticsData?.totals || {
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0,
    total_engagement: 0,
    avg_engagement_rate: 0,
    latest_followers: 0,
  };

  const platformColors: Record<string, string> = {
    YouTube: '#ef4444',
    TikTok: '#000000',
    Instagram: '#ec4899',
    'Multi-platform': '#6366f1',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Metrics & Performance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Performance Analytics
            </h1>
            <p className="text-sm text-slate-500">
              Evaluate audience traction, engagement rate benchmarks, and cross-platform growth
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Content Metrics
          </button>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Views</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {totals.total_views.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Across all published media</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engagement Rate</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {totals.avg_engagement_rate}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Likes + Comments + Shares / Views</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reactions</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {totals.total_engagement.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {totals.total_likes.toLocaleString()} likes • {totals.total_comments.toLocaleString()} comments
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Follower Milestone</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {totals.latest_followers.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Audience community count</p>
            </div>
          </div>
        </div>

        {/* 2 Interactive Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Growth Curve */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Views & Engagement Over Time</h2>
              <p className="text-xs text-slate-500">Historical performance trajectory</p>
            </div>
            <div className="w-full">
              <TrendAreaChart data={analyticsData?.timeline || []} />
            </div>
          </div>

          {/* Cross Platform Comparison */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Cross-Platform Views Comparison</h2>
              <p className="text-xs text-slate-500">Audience delivery by distribution channel</p>
            </div>
            <div className="w-full">
              {analyticsData?.platformComparison && analyticsData.platformComparison.length > 0 ? (
                <PlatformBarChart data={analyticsData.platformComparison} metric="views" />
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  No platform data logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Content Leaderboard */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Top Performing Content Hall of Fame</h2>
          </div>

          {analyticsData?.topContent && analyticsData.topContent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3 w-16">Rank</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3 text-right">Views</th>
                    <th className="py-2.5 px-3 text-right">Likes</th>
                    <th className="py-2.5 px-3 text-right">Comments</th>
                    <th className="py-2.5 px-3 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData.topContent.map((item: any, idx: number) => {
                    const engSum = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
                    const engRate = item.views > 0 ? ((engSum / item.views) * 100).toFixed(2) : '0';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-sm">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                          {item.title}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.platform}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {item.views.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 font-medium">
                          {item.likes.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-600 font-medium">
                          {item.comments.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                          {engRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No performance rankings available. Record your first metrics above!
            </p>
          )}
        </div>

        {/* Recent Performance Metric Logs History */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Metrics Recording Log History</h2>
            <span className="text-xs text-slate-500">
              {analyticsData?.logs?.length || 0} entries recorded
            </span>
          </div>

          {analyticsData?.logs && analyticsData.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Content Item</th>
                    <th className="py-2.5 px-3 text-right">Views</th>
                    <th className="py-2.5 px-3 text-right">Likes</th>
                    <th className="py-2.5 px-3 text-right">Comments</th>
                    <th className="py-2.5 px-3 text-right">Shares</th>
                    <th className="py-2.5 px-3 text-right">Followers</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData.logs.map((log: ContentAnalytics) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(log.recorded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                        {log.content_title || `Content #${log.content_id}`}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">
                        {log.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600">
                        {log.likes.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600">
                        {log.comments.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600">
                        {log.shares.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-purple-600">
                        {log.followers_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No metric entries logged yet.</p>
          )}
        </div>

        {/* Modal: Record Metrics */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Record Content Performance</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Content *
                  </label>
                  <select
                    required
                    value={selectedContentId}
                    onChange={(e) => setSelectedContentId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableContents.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.platform})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Views Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 5000"
                      value={inputViews}
                      onChange={(e) => setInputViews(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Likes Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 450"
                      value={inputLikes}
                      onChange={(e) => setInputLikes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Comments Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 35"
                      value={inputComments}
                      onChange={(e) => setInputComments(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Shares Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 18"
                      value={inputShares}
                      onChange={(e) => setInputShares(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subscriber / Follower Count at recording
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10200"
                    value={inputFollowers}
                    onChange={(e) => setInputFollowers(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Record Metrics'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
