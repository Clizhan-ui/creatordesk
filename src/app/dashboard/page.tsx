'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  BarChart3, 
  Video, 
  Lightbulb, 
  CalendarDays, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Youtube, 
  Instagram, 
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { TrendAreaChart, PlatformBarChart } from '@/components/Charts';
import { DashboardStats, SessionUser } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, statsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard/stats'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-indigo-600 font-medium">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading your creator dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner & Quick Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Creator'} 👋
            </h1>
            <p className="text-sm text-indigo-200 max-w-xl">
              Track your audience reach, schedule upcoming uploads, and turn new inspirations into viral content.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/ideas?new=true"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/10"
            >
              <Lightbulb className="w-4 h-4 mr-1.5 text-amber-300" />
              New Idea
            </Link>
            <Link
              href="/planner?new=true"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/10"
            >
              <CalendarDays className="w-4 h-4 mr-1.5 text-indigo-300" />
              Plan Content
            </Link>
            <Link
              href="/content?new=true"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Published Content
            </Link>
          </div>
        </div>

        {/* 4 Primary Operational Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Content</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalContent ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <span className="text-emerald-600 font-semibold mr-1">{stats?.publishedContent ?? 0}</span> published
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Production</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.inProductionContent ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">
                Active in pipeline
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Content Ideas</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalIdeas ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">
                Saved in idea vault
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Views</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {(stats?.totalViews ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                Aggregated views
              </p>
            </div>
          </div>
        </div>

        {/* 3 Secondary Engagement Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-600">Total Likes</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {(stats?.totalLikes ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-600">Total Comments</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {(stats?.totalComments ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-600">Total Shares</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {(stats?.totalShares ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Visual Analytics & Growth Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Views Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Performance Growth Trend</h2>
                <p className="text-xs text-slate-500">Historical views and engagement volume</p>
              </div>
              <Link href="/analytics" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center">
                Detailed Analytics <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            <div className="w-full">
              <TrendAreaChart data={stats?.performanceTrend || []} />
            </div>
          </div>

          {/* Platform Content Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Platform Share</h2>
              <p className="text-xs text-slate-500 mb-6">Distribution of published & active content</p>

              {stats?.platformBreakdown && stats.platformBreakdown.length > 0 ? (
                <div className="w-full">
                  <PlatformBarChart data={stats.platformBreakdown} metric="count" />
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No content logged yet. Add content to see platform breakdown.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
              <span>Platforms: YouTube, TikTok, IG</span>
              <Link href="/content" className="text-indigo-600 font-semibold hover:underline">
                View All Content
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column: Upcoming Publication Schedules & Top Performing Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Schedules */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Upcoming Schedule</h2>
              </div>
              <Link href="/planner" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View Calendar
              </Link>
            </div>

            {stats?.upcomingSchedules && stats.upcomingSchedules.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{schedule.title}</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                          {schedule.platform}
                        </span>
                        <span>•</span>
                        <span>{new Date(schedule.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {schedule.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No scheduled content plans yet.</p>
                <Link
                  href="/planner"
                  className="mt-2 inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Schedule your next release <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Top Performing Content */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Top Performing Content</h2>
              </div>
              <Link href="/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Generate Report
              </Link>
            </div>

            {stats?.recentPerformances && stats.recentPerformances.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPerformances.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{content.title}</p>
                      <p className="text-xs text-slate-500">
                        {content.platform} • {(content.views || 0).toLocaleString()} views
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-600">
                      <span className="flex items-center">
                        <Heart className="w-3.5 h-3.5 mr-1 text-rose-500" />
                        {(content.likes || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        {(content.comments || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No content analytics recorded yet.</p>
                <Link
                  href="/content"
                  className="mt-2 inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Log content stats <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
