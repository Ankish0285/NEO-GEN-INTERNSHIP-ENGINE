import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ResourceCard from '../components/learning/ResourceCard';
import ResourceFilters from '../components/learning/ResourceFilters';
import ResourceModal from '../components/learning/ResourceModal';
import { getPublicResources } from '../services/learningService';
import { useSEO } from '../seo/useSEO';
import { useSiteSettings } from '../context/SiteSettingsContext';

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
  <div className="rounded-xl overflow-hidden bg-white shadow animate-pulse">
    <div className="h-44 bg-slate-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="h-3 bg-slate-200 rounded w-2/3" />
    </div>
  </div>
);

const LearningResourcesPublic = () => {
  useSEO({
    title: 'Learning Resources | NEO GEN Internship Engine',
    description:
      'Free learning resources, career development guides, interview prep videos and more — ' +
      'from NEO GEN Internship Engine.',
    canonical: 'https://neogeninternshipengine.me/learning-resources',
  });

  const { settings } = useSiteSettings();
  const { branding } = settings;

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
      const res = await getPublicResources({ search, category });
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />

      <main className="flex-1 py-16 px-6 max-w-7xl mx-auto w-full">
        {/* Hero section */}
        <div className="text-center mb-14">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4"
            style={{ color: branding?.primaryColor || undefined }}
          >
            Learning Resources
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto"
          >
            Videos, guides, and tips to supercharge your career journey — free for everyone.
          </motion.p>
        </div>

        {/* Filters */}
        <div className="mb-10">
          <ResourceFilters
            categories={CATEGORIES}
            selectedCategory={category}
            onCategoryChange={setCategory}
            searchValue={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Resource grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-slate-100 rounded-xl">
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 bg-slate-100 rounded-xl">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No learning resources found.</p>
            {(search || category) && (
              <button
                onClick={() => { setSearch(''); setCategory(''); }}
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onClick={() => handleCardClick(resource)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Resource detail modal */}
      <ResourceModal
        resource={selectedResource}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedResource(null); }}
      />
    </div>
  );
};

export default LearningResourcesPublic;
