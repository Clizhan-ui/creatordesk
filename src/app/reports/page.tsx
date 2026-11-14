'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  Percent, 
  Video, 
  Layers, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { SessionUser } from '@/types';

export default function ReportsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [periodPreset, setPeriodPreset] = useState<'all' | '7d' | '30d' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchSessionAndReport();
  }, []);

  const fetchSessionAndReport = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      await loadReport();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (overrideParams?: { start?: string; end?: string; plat?: string; stat?: string }) => {
    try {
      const s = overrideParams?.start !== undefined ? overrideParams.start : startDate;
      const e = overrideParams?.end !== undefined ? overrideParams.end : endDate;
      const p = overrideParams?.plat !== undefined ? overrideParams.plat : selectedPlatform;
      const st = overrideParams?.stat !== undefined ? overrideParams.stat : selectedStatus;

      const params = new URLSearchParams();
      if (s) params.set('startDate', s);
      if (e) params.set('endDate', e);
      if (p && p !== 'all') params.set('platform', p);
      if (st && st !== 'all') params.set('status', st);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePresetChange = (preset: 'all' | '7d' | '30d' | 'month' | 'custom') => {
    setPeriodPreset(preset);
    let s = '';
    let e = '';

    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === '7d') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      s = formatDate(past);
      e = formatDate(today);
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      s = formatDate(past);
      e = formatDate(today);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      s = formatDate(firstDay);
      e = formatDate(today);
    }

    setStartDate(s);
    setEndDate(e);
    loadReport({ start: s, end: e });
  };

  // CSV Export
  const exportToCSV = () => {
    if (!reportData?.items || reportData.items.length === 0) {
      alert('No data to export for current filter.');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Platform',
      'Category',
      'Status',
      'Published Date',
      'Views',
      'Likes',
      'Comments',
      'Shares',
      'Engagement Rate (%)',
    ];

    const rows = reportData.items.map((item: any) => {
      const engSum = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
      const engRate = item.views > 0 ? ((engSum / item.views) * 100).toFixed(2) : '0';
      return [
        item.id,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        item.platform,
        item.category,
        item.status,
        item.published_at ? item.published_at.slice(0, 10) : 'N/A',
        item.views || 0,
        item.likes || 0,
        item.comments || 0,
        item.shares || 0,
        engRate,
      ].join(',');
    });

    // Prepend UTF-8 BOM so Microsoft Excel correctly renders Unicode characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CreatorDesk_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const exportToPDF = async () => {
    if (!reportData?.items || reportData.items.length === 0) {
      alert('No data to export for current filter.');
      return;
    }

    try {
      // Dynamic on-demand script loader for jsPDF & autoTable (bypasses webpack build bundling)
      const loadScript = (src: string) => {
        return new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      };

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');

      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CreatorDesk - Digital Content Performance Report', 14, 15);

      // Meta details
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Creator: ${user?.name || 'Creator'} (${user?.email})`, 14, 32);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 37);
      doc.text(
        `Period: ${startDate ? startDate : 'Start'} to ${endDate ? endDate : 'Present'} | Platform: ${selectedPlatform} | Status: ${selectedStatus}`,
        14,
        42
      );

      // Summary Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 46, 182, 22, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 46, 182, 22, 3, 3, 'D');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL CONTENT', 20, 53);
      doc.text('TOTAL VIEWS', 60, 53);
      doc.text('TOTAL LIKES', 105, 53);
      doc.text('COMMENTS', 140, 53);
      doc.text('ENGAGEMENT RATE', 165, 53);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(String(summary.totalContent), 20, 62);
      doc.text(Number(summary.totalViews).toLocaleString(), 60, 62);
      doc.text(Number(summary.totalLikes).toLocaleString(), 105, 62);
      doc.text(Number(summary.totalComments).toLocaleString(), 140, 62);
      doc.text(`${summary.engagementRate}%`, 165, 62);

      // Table
      const tableHeaders = [['#', 'Title', 'Platform', 'Category', 'Status', 'Views', 'Likes', 'Comments', 'Eng. %']];
      const tableBody = reportData.items.map((item: any, i: number) => {
        const engSum = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
        const engRate = item.views > 0 ? ((engSum / item.views) * 100).toFixed(1) : '0';
        return [
          String(i + 1),
          item.title.length > 32 ? item.title.slice(0, 32) + '...' : item.title,
          item.platform,
          item.category,
          item.status,
          Number(item.views || 0).toLocaleString(),
          Number(item.likes || 0).toLocaleString(),
          Number(item.comments || 0).toLocaleString(),
          `${engRate}%`,
        ];
      });

      (doc as any).autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 74,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`CreatorDesk_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      // Clean fallback: native browser print dialog (Save as PDF)
      window.print();
    }
  };

  const summary = reportData?.summary || {
    totalContent: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalEngagement: 0,
    engagementRate: 0,
    platformCounts: {},
    statusCounts: {},
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <FileText className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Reports & Exports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Content Performance Reports
            </h1>
            <p className="text-sm text-slate-500">
              Filter and generate formatted executive summaries for stakeholders, sponsors, and reviews
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'All Time' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    periodPreset === p.id
                      ? 'bg-white text-indigo-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value);
                  loadReport({ plat: e.target.value });
                }}
                className="text-xs font-semibold border border-slate-200 bg-slate-50 px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="all">All Platforms</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="Multi-platform">Multi-platform</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  loadReport({ stat: e.target.value });
                }}
                className="text-xs font-semibold border border-slate-200 bg-slate-50 px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published</option>
                <option value="In Production">In Production</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {periodPreset === 'custom' && (
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    loadReport({ start: e.target.value });
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    loadReport({ end: e.target.value });
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Filtered Content</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalContent}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Views</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{summary.totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Likes</span>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{summary.totalLikes.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Comments</span>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{summary.totalComments.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Engagement Rate</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.engagementRate}%</p>
          </div>
        </div>

        {/* Detailed Report Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Content Performance Breakdown</h2>
            <span className="text-xs text-slate-500">
              Showing {reportData?.items?.length || 0} entries
            </span>
          </div>

          {loading ? (
            <p className="py-12 text-center text-xs text-slate-400">Loading report data...</p>
          ) : reportData?.items?.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">
              No content matches the selected period and criteria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Views</th>
                    <th className="py-3 px-3 text-right">Likes</th>
                    <th className="py-3 px-3 text-right">Comments</th>
                    <th className="py-3 px-3 text-right">Shares</th>
                    <th className="py-3 px-3 text-right">Eng. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.items.map((item: any) => {
                    const engSum = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
                    const engRate = item.views > 0 ? ((engSum / item.views) * 100).toFixed(2) : '0';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                          {item.title}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                            {item.platform}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{item.category}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status}
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
                        <td className="py-3 px-3 text-right text-emerald-600 font-medium">
                          {item.shares.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {engRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
