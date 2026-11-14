'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  CalendarDays, 
  List, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  Video,
  Layers,
  Sparkles
} from 'lucide-react';
import { ContentPlan, SessionUser, PlanStatus } from '@/types';

export default function PlannerPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalPlatform, setModalPlatform] = useState('YouTube');
  const [modalCategory, setModalCategory] = useState('Tech');
  const [modalScheduledAt, setModalScheduledAt] = useState('');
  const [modalStatus, setModalStatus] = useState<PlanStatus>('Planned');
  const [modalNotes, setModalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchSessionAndPlans();
  }, []);

  const fetchSessionAndPlans = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      await loadPlans();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/planner');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = (dateStr?: string) => {
    setEditingPlan(null);
    setModalTitle('');
    setModalDescription('');
    setModalPlatform('YouTube');
    setModalCategory('Tech');
    // Default to clicked date or tomorrow at 18:00
    if (dateStr) {
      setModalScheduledAt(`${dateStr}T18:00`);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setModalScheduledAt(d.toISOString().slice(0, 16));
    }
    setModalStatus('Planned');
    setModalNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: ContentPlan) => {
    setEditingPlan(plan);
    setModalTitle(plan.title);
    setModalDescription(plan.description || '');
    setModalPlatform(plan.platform);
    setModalCategory(plan.category);
    // Parse scheduled_at for datetime-local input
    const datePart = plan.scheduled_at ? new Date(plan.scheduled_at).toISOString().slice(0, 16) : '';
    setModalScheduledAt(datePart);
    setModalStatus(plan.status);
    setModalNotes(plan.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalScheduledAt) return;

    setSaving(true);
    try {
      const payload = {
        title: modalTitle,
        description: modalDescription,
        platform: modalPlatform,
        category: modalCategory,
        scheduled_at: modalScheduledAt,
        status: modalStatus,
        notes: modalNotes,
      };

      if (editingPlan) {
        const res = await fetch(`/api/planner/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadPlans();
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch('/api/planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadPlans();
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
      const res = await fetch(`/api/planner/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick status updater
  const handleQuickStatusChange = async (plan: ContentPlan, newStatus: PlanStatus) => {
    try {
      const res = await fetch(`/api/planner/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, status: newStatus }),
      });
      if (res.ok) {
        await loadPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(search.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(search.toLowerCase())) ||
      plan.category.toLowerCase().includes(search.toLowerCase());

    const matchesPlatform = selectedPlatform === 'all' || plan.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'all' || plan.status === selectedStatus;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  // Calendar date calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Group plans by date string (YYYY-MM-DD)
  const plansByDate: Record<string, ContentPlan[]> = {};
  filteredPlans.forEach((plan) => {
    if (plan.scheduled_at) {
      const d = plan.scheduled_at.split('T')[0];
      if (!plansByDate[d]) plansByDate[d] = [];
      plansByDate[d].push(plan);
    }
  });

  const getStatusColor = (status: PlanStatus) => {
    switch (status) {
      case 'Planned':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Production':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Published':
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
              <CalendarDays className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Publication Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Content Planner & Calendar
            </h1>
            <p className="text-sm text-slate-500">
              Manage production pipelines, scheduling release milestones, and publication calendars
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-200 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                Calendar View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5 mr-1.5" />
                List View
              </button>
            </div>

            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule Release
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search planned content..."
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
              <option value="Planned">Planned</option>
              <option value="In Production">In Production</option>
              <option value="Ready">Ready</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        {/* VIEW 1: Interactive Monthly Calendar */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{monthName}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={todayMonth}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}

              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/40 min-h-[110px] p-2" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayPlans = plansByDate[formattedDateStr] || [];
                const isToday =
                  new Date().toDateString() === new Date(year, month, dayNum).toDateString();

                return (
                  <div
                    key={dayNum}
                    onClick={() => openCreateModal(formattedDateStr)}
                    className={`bg-white min-h-[110px] p-2 flex flex-col justify-between hover:bg-indigo-50/20 cursor-pointer transition-colors group ${
                      isToday ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-semibold transition-opacity">
                        + Add
                      </span>
                    </div>

                    <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                      {dayPlans.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(plan);
                          }}
                          className={`text-[10px] font-medium p-1 rounded-md border truncate shadow-xs ${getStatusColor(
                            plan.status
                          )}`}
                          title={`${plan.title} (${plan.platform})`}
                        >
                          <span className="font-bold mr-1">{plan.platform.charAt(0)}:</span>
                          {plan.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW 2: List View */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {filteredPlans.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No planned items match your filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {plan.platform}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-500">{plan.category}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {new Date(plan.scheduled_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-xs text-slate-600 line-clamp-1">{plan.description}</p>
                      )}
                      {plan.notes && (
                        <p className="text-[11px] text-indigo-600 italic">Notes: {plan.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <select
                        value={plan.status}
                        onChange={(e) => handleQuickStatusChange(plan, e.target.value as PlanStatus)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border focus:outline-none ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        <option value="Planned">Planned</option>
                        <option value="In Production">In Production</option>
                        <option value="Ready">Ready</option>
                        <option value="Published">Published</option>
                      </select>

                      <button
                        onClick={() => openEditModal(plan)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Plan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(plan.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Create & Edit Plan */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPlan ? 'Edit Production Plan' : 'Schedule Content Release'}
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
                    Content Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g. Full Review: Next-Gen Smartphone"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Publication Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={modalScheduledAt}
                    onChange={(e) => setModalScheduledAt(e.target.value)}
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
                      placeholder="Tech, Gaming, Lifestyle"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Production Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as PlanStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Production">In Production</option>
                    <option value="Ready">Ready</option>
                    <option value="Published">Published (Auto-registers in Content inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Production Notes / Checklist
                  </label>
                  <textarea
                    rows={2}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Sponsor guidelines, audio track requirements, render presets..."
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
                    {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
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
                <h3 className="text-base font-bold text-slate-900">Delete Scheduled Plan?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove this publication plan from your calendar?
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
                  Yes, Delete Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
