import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, Globe, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import ResourceCard from '../../learning/ResourceCard';
import ResourceFilters from '../../learning/ResourceFilters';
import ResourceModal from '../../learning/ResourceModal';
import {
  getAdminResources,
  createResource,
  updateResource,
  deleteResource,
  publishResource,
  unpublishResource,
} from '../../../services/learningService';

const CATEGORIES = [
  'Interview Prep',
  'Resume & CV',
  'Career Development',
  'Industry Insights',
  'Soft Skills',
  'Technical Skills',
  'Other',
];

const EMPTY_FORM = {
  title: '',
  description: '',
  youtubeUrl: '',
  thumbnailUrl: '',
  category: 'Other',
  difficulty: 'Beginner',
  estimatedTime: '',
  targetAudience: 'students',
  status: 'draft',
  tags: '',
};

const SkeletonCard = () => (
  <div className="neo-glass rounded-xl overflow-hidden animate-pulse">
    <div className="h-44 bg-slate-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="h-3 bg-slate-200 rounded w-2/3" />
    </div>
  </div>
);

const AdminLearningResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Create / Edit form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Preview modal state
  const [previewResource, setPreviewResource] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // View modal for clicking a card
  const [viewResource, setViewResource] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminResources({ search, category, status });
      const list = Array.isArray(res?.guides)
        ? res.guides
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setResources(list);
    } catch (err) {
      toast.error(err?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEdit = (resource) => {
    setEditing(resource);
    setForm({
      title: resource.title || '',
      description: resource.description || '',
      youtubeUrl: resource.youtubeUrl || '',
      thumbnailUrl: resource.thumbnailUrl || '',
      category: resource.category || 'Other',
      difficulty: resource.difficulty || 'Beginner',
      estimatedTime: resource.estimatedTime || '',
      targetAudience: resource.targetAudience || 'students',
      status: resource.status || 'draft',
      tags: Array.isArray(resource.tags) ? resource.tags.join(', ') : '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePreview = () => {
    // Build a synthetic resource object from the current form for preview
    const tagsArray = form.tags
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    setPreviewResource({
      ...form,
      tags: tagsArray,
      youtubeVideoId: extractVideoId(form.youtubeUrl),
    });
    setPreviewOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tagsArray = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const payload = { ...form, tags: tagsArray };

      if (editing) {
        await updateResource(editing._id, payload);
        toast.success('Resource updated');
      } else {
        await createResource(payload);
        toast.success('Resource created');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    if (
      !window.confirm(
        `Delete "${resource.title}"? This cannot be undone.`
      )
    )
      return;
    try {
      await deleteResource(resource._id);
      toast.success('Resource deleted');
      load();
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  const handleCardClick = (resource) => {
    setViewResource(resource);
    setViewOpen(true);
  };

  const handleTogglePublish = async (resource) => {
    try {
      if (resource.status === 'published') {
        await unpublishResource(resource._id);
        toast.success(`"${resource.title}" unpublished`);
      } else {
        await publishResource(resource._id);
        toast.success(`"${resource.title}" published`);
      }
      load();
    } catch (err) {
      toast.error(err?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Learning Resources</h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Manage educational content available to students, partners, and the public.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF9933] text-white rounded-lg text-sm font-semibold hover:bg-[#e68a2e] transition-colors"
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* Filters */}
      <ResourceFilters
        categories={CATEGORIES}
        selectedCategory={category}
        onCategoryChange={setCategory}
        searchValue={search}
        onSearchChange={setSearch}
        showStatusFilter
        selectedStatus={status}
        onStatusChange={setStatus}
      />

      {/* Resource grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-500 font-medium">No resources found.</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-[#FF9933] text-white rounded-lg text-sm font-semibold hover:bg-[#e68a2e] transition-colors"
          >
            Create First Resource
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource._id} className="relative group">
              <ResourceCard
                resource={resource}
                onClick={() => handleCardClick(resource)}
                showAudience
              />
              {/* Edit / Delete overlay */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); handleTogglePublish(resource); }}
                  className={`p-1.5 bg-white rounded-lg shadow border transition-colors ${
                    resource.status === 'published'
                      ? 'text-[#e68a2e] hover:bg-[#fff4e8] border-amber-100'
                      : 'text-[#138808] hover:bg-[#e8f5e6] border-green-100'
                  }`}
                  title={resource.status === 'published' ? 'Unpublish' : 'Publish'}
                >
                  {resource.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(resource); }}
                  className="p-1.5 bg-white rounded-lg shadow text-[#FF9933] hover:bg-[#fff4e8] border border-amber-100"
                  title="Edit resource"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(resource); }}
                  className="p-1.5 bg-white rounded-lg shadow text-red-500 hover:bg-red-50 border border-red-100"
                  title="Delete resource"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {/* Status badge */}
              <span
                className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold z-10 ${
                  resource.status === 'published'
                    ? 'bg-[#e8f5e6] text-[#138808]'
                    : 'bg-[#fff4e8] text-[#e68a2e]'
                }`}
              >
                {resource.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit Resource' : 'Add Resource'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => handleField('title', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. How to Ace Your Interview"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Brief description of what this resource covers"
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube URL
            </label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => handleField('youtubeUrl', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => handleField('thumbnailUrl', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="https://..."
            />
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleField('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => handleField('difficulty', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Estimated time + Target audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
              <input
                type="text"
                value={form.estimatedTime}
                onChange={(e) => handleField('estimatedTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. 15 min"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={form.targetAudience}
                onChange={(e) => handleField('targetAudience', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="students">Students only</option>
                <option value="partners">Partners only</option>
                <option value="both">Students &amp; Partners</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publication Status</label>
            <select
              value={form.status}
              onChange={(e) => handleField('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-xs text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => handleField('tags', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="resume, tips, interview"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye size={14} /> Preview
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#FF9933] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#e68a2e] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : editing ? 'Update Resource' : 'Create Resource'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <ResourceModal
        resource={previewResource}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* View Modal (clicking a card) */}
      <ResourceModal
        resource={viewResource}
        isOpen={viewOpen}
        onClose={() => { setViewOpen(false); setViewResource(null); }}
      />
    </div>
  );
};

/**
 * Extract YouTube video ID from various URL formats.
 * Returns null if no valid ID found.
 */
function extractVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null;
    // youtube.com/watch?v=<id>
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    // youtube.com/embed/<id>
    const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    // not a valid URL
  }
  return null;
}

export default AdminLearningResources;
