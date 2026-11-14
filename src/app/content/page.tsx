'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Video, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  BarChart3, 
  X, 
  LayoutGrid, 
  Table as TableIcon,
  Sparkles,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { ContentItem, SessionUser, ContentStatus } from '@/types';

export default function ContentPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal: Create & Edit Content
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalThumbnailUrl, setModalThumbnailUrl] = useState('');
  const [modalPlatform, setModalPlatform] = useState('YouTube');
  const [modalCategory, setModalCategory] = useState('Tech');
  const [modalContentUrl, setModalContentUrl] = useState('');
  const [modalPublishedAt, setModalPublishedAt] = useState('');
  const [modalStatus, setModalStatus] = useState<ContentStatus>('Published');
  const [saving, setSaving] = useState(false);

  // Modal: Quick Analytics Log
  const [analyticsModalContent, setAnalyticsModalContent] = useState<ContentItem | null>(null);
  const [logViews, setLogViews] = useState(0);
  const [logLikes, setLogLikes] = useState(0);
  const [logComments, setLogComments] = useState(0);
  const [logShares, setLogShares] = useState(0);
  const [logFollowers, setLogFollowers] = useState(0);
  const [savingAnalytics, setSavingAnalytics] = useState(false);

  // Delete modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchSessionAndContent();
  }, []);

  const fetchSessionAndContent = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      await loadContents();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadContents = async () => {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setEditingContent(null);
    setModalTitle('');
    setModalDescription('');
    setModalThumbnailUrl('');
    setModalPlatform('YouTube');
    setModalCategory('Tech');
    setModalContentUrl('');
    setModalPublishedAt(new Date().toISOString().slice(0, 10));
    setModalStatus('Published');
    setIsModalOpen(true);
  };

  const openEditModal = (content: ContentItem) => {
    setEditingContent(content);
    setModalTitle(content.title);
    setModalDescription(content.description || '');
    setModalThumbnailUrl(content.thumbnail_url || '');
    setModalPlatform(content.platform);
    setModalCategory(content.category);
    setModalContentUrl(content.content_url || '');
    setModalPublishedAt(content.published_at ? content.published_at.slice(0, 10) : '');
    setModalStatus(content.status);
    setIsModalOpen(true);
  };

  const openAnalyticsModal = (content: ContentItem) => {
    setAnalyticsModalContent(content);
    setLogViews(content.views || 0);
    setLogLikes(content.likes || 0);
    setLogComments(content.comments || 0);
    setLogShares(content.shares || 0);
    setLogFollowers(0);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: modalTitle,
        description: modalDescription,
        thumbnail_url: modalThumbnailUrl,
        platform: modalPlatform,
        category: modalCategory,
        content_url: modalContentUrl,
        published_at: modalPublishedAt || null,
        status: modalStatus,
      };

      if (editingContent) {
        const res = await fetch(`/api/content/${editingContent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadContents();
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadContents();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyticsModalContent) return;

    setSavingAnalytics(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: analyticsModalContent.id,
          views: Number(logViews) || 0,
          likes: Number(logLikes) || 0,
          comments: Number(logComments) || 0,
          shares: Number(logShares) || 0,
          followers_count: Number(logFollowers) || 0,
          recorded_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        await loadContents();
        setAnalyticsModalContent(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAnalytics(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContents(contents.filter((c) => c.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredContents = contents.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    const matchesPlatform = selectedPlatform === 'all' || c.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Production':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Scheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <Video className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Content Inventory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Content Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage your published releases, monitor live URLs, and keep metrics up to date
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-200 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Content Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search content by title, description, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="text-xs font-medium border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Platforms</option>
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
              <option value="Multi-platform">Multi-platform</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-medium border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="In Production">In Production</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Loading your content library...
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No content items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add your published videos, reels, and posts to track their ongoing performance.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add First Content
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Header */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden group">
                    {content.thumbnail_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={content.thumbnail_url}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-indigo-950 text-slate-400">
                        <Video className="w-10 h-10 mb-1 text-slate-500" />
                        <span className="text-[11px] font-medium tracking-wider uppercase text-slate-500">
                          {content.platform}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getStatusBadge(content.status)}`}>
                        {content.status}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                        {content.platform}
                      </span>
                    </div>

                    {content.content_url && (
                      <a
                        href={content.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white shadow-md transition-all"
                        title="Open Video URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>{content.category}</span>
                        {content.published_at && (
                          <>
                            <span>•</span>
                            <span>{new Date(content.published_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {content.title}
                      </h3>
                      {content.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{content.description}</p>
                      )}
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-4 gap-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">Views</span>
                        <span className="text-xs font-bold text-slate-800">
                          {(content.views || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">Likes</span>
                        <span className="text-xs font-bold text-rose-600">
                          {(content.likes || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">Comments</span>
                        <span className="text-xs font-bold text-blue-600">
                          {(content.comments || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">Shares</span>
                        <span className="text-xs font-bold text-emerald-600">
                          {(content.shares || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openAnalyticsModal(content)}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-1" />
                    Log Stats
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(content)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(content.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Content Title</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Likes</th>
                  <th className="py-3 px-4 text-right">Comments</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredContents.map((content) => (
                  <tr key={content.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                      {content.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{content.platform}</td>
                    <td className="py-3.5 px-4 text-slate-500">{content.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(content.status)}`}>
                        {content.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      {(content.views || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 font-medium">
                      {(content.likes || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-600 font-medium">
                      {(content.comments || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openAnalyticsModal(content)}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100"
                        >
                          Stats
                        </button>
                        <button
                          onClick={() => openEditModal(content)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(content.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Create & Edit Content */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingContent ? 'Edit Content Item' : 'Add New Content'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveContent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Content Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g. Building an AI Agent in 15 Minutes"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Platform
                    </label>
                    <select
                      value={modalPlatform}
                      onChange={(e) => setModalPlatform(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Multi-platform">Multi-platform</option>
                      <option value="Podcast">Podcast</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={modalCategory}
                      onChange={(e) => setModalCategory(e.target.value)}
                      placeholder="Tech, Vlog, Review"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as ContentStatus)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="In Production">In Production</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Published Date
                    </label>
                    <input
                      type="date"
                      value={modalPublishedAt}
                      onChange={(e) => setModalPublishedAt(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Live Content URL (YouTube link / TikTok reel)
                  </label>
                  <input
                    type="url"
                    value={modalContentUrl}
                    onChange={(e) => setModalContentUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    value={modalThumbnailUrl}
                    onChange={(e) => setModalThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Highlights
                  </label>
                  <textarea
                    rows={2}
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="Key topics covered, video description..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    {saving ? 'Saving...' : editingContent ? 'Update Content' : 'Save Content'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Quick Log Analytics */}
        {analyticsModalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Log Content Analytics
                  </h2>
                </div>
                <button
                  onClick={() => setAnalyticsModalContent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {analyticsModalContent.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  {analyticsModalContent.platform} • {analyticsModalContent.category}
                </p>
              </div>

              <form onSubmit={handleSaveAnalytics} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Views
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={logViews}
                      onChange={(e) => setLogViews(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Likes
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={logLikes}
                      onChange={(e) => setLogLikes(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Comments
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={logComments}
                      onChange={(e) => setLogComments(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Shares
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={logShares}
                      onChange={(e) => setLogShares(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Channel Subscribers/Followers at recording
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={logFollowers}
                    onChange={(e) => setLogFollowers(Number(e.target.value))}
                    placeholder="e.g. 12500"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAnalyticsModalContent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAnalytics}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingAnalytics ? 'Recording...' : 'Save Performance Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Content Item?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This will also remove all historical performance records for this content.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
