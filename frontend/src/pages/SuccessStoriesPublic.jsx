import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Star, UploadCloud, Building2, User, Briefcase } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { resolveStoryImageUrl } from '../utils/resolveStoryImageUrl';

const SuccessStoriesPublic = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('latest');
  const [userRatings, setUserRatings] = useState({});
  const [ratingSaving, setRatingSaving] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPublicStories();
  }, [filter]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  const fetchPublicStories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stories');
      let fetchedStories = Array.isArray(res?.data) ? res.data : [];
      
      if (filter === 'topRated') {
        fetchedStories = [...fetchedStories].sort((a, b) => (b?.ratingAverage || 0) - (a?.ratingAverage || 0));
      }
      
      setStories(fetchedStories);
      
      // Fetch user ratings for each story if authenticated
      if (isAuthenticated) {
        fetchUserRatings(fetchedStories);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async (storiesToRateMap) => {
    try {
      const ratings = {};
      for (const story of storiesToRateMap) {
        const res = await api.get(`/stories/${story._id}/my-rating`);
        if (res.data.data) {
          ratings[story._id] = res.data.data;
        }
      }
      setUserRatings(ratings);
    } catch (err) {
      console.error('Failed to load user ratings:', err);
    }
  };

  const handleRating = async (storyId, rating) => {
    if (!isAuthenticated) {
      toast.error('Please log in to rate stories');
      return;
    }

    setRatingSaving(storyId);
    try {
      const res = await api.post(`/stories/${storyId}/rate`, { rating });
      
      // Update the story in the list with new rating data
      setStories(stories.map(s => s._id === storyId ? res.data.data : s));
      
      // Update user's rating
      setUserRatings(prev => ({ ...prev, [storyId]: rating }));
      
      toast.success('Rating submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingSaving(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />
      
      <main className="flex-1 py-16 px-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4"
          >
            Success Stories
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto"
          >
            Inspiring journeys from students who landed their dream internships.
          </motion.p>
        </div>

        {/* Filter */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setFilter('latest')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'latest'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setFilter('topRated')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'topRated'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Top Rated
          </button>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading success stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 bg-slate-100 rounded-xl">
            <Star className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No success stories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map(story => (
              <motion.div
                key={story._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Image/Avatar */}
                <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  {story.image ? (
                    <img
                      src={resolveStoryImageUrl(story.image)}
                      alt={story.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name || 'S')}&background=random`;
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center border-4 border-white shadow-md">
                      <span className="text-3xl text-white font-bold">
                        {(story.name || 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {story.name || story.studentId?.name || 'Anonymous'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <Building2 size={14} />
                    <span>{story.college || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <Briefcase size={14} />
                    <span>{story.company || 'N/A'}</span>
                  </div>

                  {/* Experience */}
                  <p className="text-slate-700 text-sm mb-4 line-clamp-3">
                    "{story.experience}"
                  </p>

                  {/* Rating Summary */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= Math.round(story.ratingAverage)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">
                      {story.ratingAverage > 0
                        ? `${story.ratingAverage} (${story.ratingCount})`
                        : 'No ratings'}
                    </span>
                  </div>

                  {/* User Rating (if authenticated) */}
                  {isAuthenticated && (
                    <div>
                      <p className="text-xs text-slate-600 mb-2">Your rating:</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            disabled={ratingSaving === story._id}
                            onClick={() => handleRating(story._id, star)}
                            className="transition-transform hover:scale-110 disabled:opacity-50"
                          >
                            <Star
                              size={18}
                              className={
                                star <= (userRatings[story._id] || 0)
                                  ? 'fill-orange-400 text-orange-400'
                                  : 'text-slate-300 hover:text-orange-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SuccessStoriesPublic;
