import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import Card from '../../ui/Card';
import ResourceCard from '../../learning/ResourceCard';
import ResourceFilters from '../../learning/ResourceFilters';
import ResourceModal from '../../learning/ResourceModal';
import { getStudentResources } from '../../../services/learningService';

const CATEGORIES = [
  'Interview Prep',
  'Resume & CV',
  'Career Development',
  'Industry Insights',
  'Soft Skills',
  'Technical Skills',
  'Other',
];

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

const StudentLearningResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [selectedResource, setSelectedResource] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentResources({ search, category });
      const list = Array.isArray(res?.guides)
        ? res.guides
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setResources(list);
    } catch (err) {
      setError(err?.message || 'Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCardClick = (resource) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Learning Resources</h1>
        <p className="text-sm text-[#4B5563] mt-1">
          Videos and guides to help you land your ideal internship.
        </p>
      </div>

      {/* Filters */}
      <ResourceFilters
        categories={CATEGORIES}
        selectedCategory={category}
        onCategoryChange={setCategory}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="py-16 text-center">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </Card>
      ) : resources.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No learning resources available yet.</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon — new content is added regularly.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onClick={() => handleCardClick(resource)}
            />
          ))}
        </div>
      )}

      {/* Resource detail modal */}
      <ResourceModal
        resource={selectedResource}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedResource(null); }}
      />
    </div>
  );
};

export default StudentLearningResources;
