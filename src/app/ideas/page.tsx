'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Youtube, 
  Instagram, 
  X,
  ArrowRight
} from 'lucide-react';
import { ContentIdea, SessionUser, IdeaStatus } from '@/types';

export default function IdeasPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalCategory, setModalCategory] = useState('Tech');
  const [modalPlatform, setModalPlatform] = useState('YouTube');
  const [modalStatus, setModalStatus] = useState<IdeaStatus>('New Idea');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchSessionAndIdeas();
  }, []);

  const fetchSessionAndIdeas = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      await loadIdeas();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadIdeas = async () => {
    try {
      const res = await fetch('/api/ideas');
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setEditingIdea(null);
    setModalTitle('');
    setModalDescription('');
    setModalCategory('Tech');
    setModalPlatform('YouTube');
    setModalStatus('New Idea');
    setIsModalOpen(true);
  };

  const openEditModal = (idea: ContentIdea) => {
    setEditingIdea(idea);
    setModalTitle(idea.title);
    setModalDescription(idea.description || '');
    setModalCategory(idea.category);
    setModalPlatform(idea.platform);
    setModalStatus(idea.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    setSaving(true);
    try {
      if (editingIdea) {
        const res = await fetch(`/api/ideas/${editingIdea.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalTitle,
            description: modalDescription,
            category: modalCategory,
            platform: modalPlatform,
            status: modalStatus,
          }),
        });
        if (res.ok) {
          await loadIdeas();
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalTitle,
            description: modalDescription,
            category: modalCategory,
            platform: modalPlatform,
            status: modalStatus,
          }),
        });
        if (res.ok) {
          await loadIdeas();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIdeas(ideas.filter((i) => i.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromoteToPlan = async (idea: ContentIdea) => {
    try {
      // Create planner item scheduled for 3 days from now
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);

      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          platform: idea.platform,
          category: idea.category,
          scheduled_at: targetDate.toISOString().slice(0, 16),
          status: 'Planned',
          notes: `Promoted from idea vault (ID: #${idea.id})`,
        }),
      });

      if (res.ok) {
        // Update idea status to 'Planned'
        await fetch(`/api/ideas/${idea.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...idea,
            status: 'Planned',
          }),
        });
        await loadIdeas();
        alert('🎉 Idea successfully promoted to Content Planner calendar!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      (idea.description && idea.description.toLowerCase().includes(search.toLowerCase())) ||
      idea.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || idea.status === selectedStatus;
    const matchesPlatform = selectedPlatform === 'all' || idea.platform === selectedPlatform;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusBadge = (status: IdeaStatus) => {
    switch (status) {
      case 'New Idea':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Planned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Production':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
              <Lightbulb className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Ideation Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Content Ideas Vault
            </h1>
            <p className="text-sm text-slate-500">
              Brainstorm, structure, and nurture your upcoming concepts before entering production
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Capture New Idea
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts, categories, descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
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

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'New Idea', 'Planned', 'In Production', 'Completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    selectedStatus === st
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Loading your ideas vault...
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No ideas found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {search || selectedStatus !== 'all' || selectedPlatform !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Your ideas vault is waiting! Record your first video or post concept.'}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Your First Idea
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        idea.status
                      )}`}
                    >
                      {idea.status}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {idea.platform}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2">
                    {idea.title}
                  </h3>

                  {idea.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 mb-3">
                      {idea.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {idea.category}
                  </span>

                  <div className="flex items-center space-x-1">
                    {idea.status === 'New Idea' && (
                      <button
                        onClick={() => handlePromoteToPlan(idea)}
                        title="Promote to Content Planner"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center"
                      >
                        <CalendarDays className="w-3.5 h-3.5 mr-1" />
                        <span className="text-[11px] font-semibold">Plan</span>
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(idea)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(idea.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingIdea ? 'Edit Content Idea' : 'Capture New Content Idea'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Idea Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g. 10 Tech Accessories Under $50 for Creators"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Concept Description & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="Outline key talking points, hooks, props, or visual concepts..."
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
                      <option value="Twitter/X">Twitter/X</option>
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
                      placeholder="e.g. Tech, Vlog, Gaming"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as IdeaStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="New Idea">New Idea</option>
                    <option value="Planned">Planned</option>
                    <option value="In Production">In Production</option>
                    <option value="Completed">Completed</option>
                  </select>
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
                    {saving ? 'Saving...' : editingIdea ? 'Update Idea' : 'Save Idea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Content Idea?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This action cannot be undone. Are you sure you want to remove this idea from your vault?
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
                  Yes, Delete Idea
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
