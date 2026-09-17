import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, UploadCloud, GraduationCap, X, CheckCircle, ThumbsUp, Share2, Briefcase, Building2, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { resolveStoryImageUrl } from '../utils/resolveStoryImageUrl';

const SuccessStoriesPublic = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('latest');
  const [expandedId, setExpandedId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    experience: '',
    rating: 0,
    name: '',
    college: '',
    company: '',
    image: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchStories();
  }, [filter]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      // Public view, might fetch only approved ones in a real system, but based on assignment, we fetch stories.
      const res = await api.get('/stories?status=approved');
      let fetchedStories = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (filter === 'topRated') {
        fetchedStories = [...fetchedStories].sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
      }
      setStories(fetchedStories);
    } catch (err) {
      console.error('Failed to load success stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.experience || formData.rating === 0 || !formData.college || !formData.company) {
      toast.error('Please fill all required fields and leave a rating!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadRes = await api.upload('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.filePath;
      }

      await api.post('/stories/add', { ...formData, image: imageUrl });
      toast.success('Story posted successfully! Waiting for approval.');
      setFormData({
        experience: '', rating: 0, name: '', college: '', company: '', image: ''
      });
      setImagePreview(null);
      setImageFile(null);
      setHoverRating(0);
      fetchStories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = (storyId) => {
    navigator.clipboard.writeText(`${window.location.origin}/success-stories#${storyId}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-200">
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />
      
      <main className="flex-1 py-16 px-6 max-w-7xl mx-auto w-full">
        {/* Share Your Story Header */}
        <div className="text-center mb-12 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 inline-block relative"
          >
            Inspire the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 cursor-default hover:scale-105 transition-transform duration-300 inline-block">Future</span>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full origin-left"
            />
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto mt-6"
          >
            Share your internship experience and guide the next generation of top talent.
          </motion.p>
        </div>

        {/* Share Your Story Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-24 relative"
        >
          {/* Glassmorphism background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl blur-xl opacity-50 -z-10" />
          
          <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Full Name (Optional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">College Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.college}
                      onChange={(e) => setFormData({...formData, college: e.target.value})}
                      placeholder="Stanford University"
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Internship Company *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Google"
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rate Your Experience *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        type="button"
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <Star className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || formData.rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-200'
                        }`} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Experience *</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    placeholder="Tell us about the interview process, the work culture, and what you learned..."
                    className="w-full p-4 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none h-[132px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Photo</label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors relative h-[132px] flex flex-col justify-center items-center ${
                      dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    
                    <AnimatePresence mode="wait">
                      {imagePreview ? (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 p-2 z-10"
                        >
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-sm" />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setFormData({...formData, image: ''}); }}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-slate-500 hover:text-red-500 z-30 pointer-events-auto"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center z-10 pointer-events-none"
                        >
                          <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
                          <p className="text-sm text-slate-600 font-medium">Drag & drop or click to upload</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className={`w-full mt-8 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSubmitting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/25'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Post Your Story
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Wall of Success Section */}
        <div className="text-center mb-10 pt-10 border-t border-slate-200">
          <h2 className="text-4xl font-bold text-slate-900 mb-8">Wall of Success</h2>
          
          <div className="flex justify-center gap-4 mb-12">
            <button 
              onClick={() => setFilter('latest')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'latest' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Latest Stories
            </button>
            <button 
              onClick={() => setFilter('topRated')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'topRated' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Top Rated
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (Array.isArray(stories) ? stories : []).length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-2xl mx-auto"
          >
            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No stories yet</h3>
            <p className="text-slate-500 text-lg">Be the first to inspire 🚀 Share your journey above.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {(Array.isArray(stories) ? stories : []).map((story, index) => (
                <motion.div 
                  key={story._id}
                  id={story._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card overflow-hidden flex flex-col group"
                >
                  {story.image && (
                    <div className="h-48 overflow-hidden w-full relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                      <img 
                        src={resolveStoryImageUrl(story.image)} 
                        alt={story.name || 'Student'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => {
                          const n = encodeURIComponent(story.name || 'Student');
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${n}&size=256&background=random`;
                        }}
                      />
                      <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                        <span className="bg-white/90 backdrop-blur text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          {story.company || 'Company'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col relative">
                    {!story.image && (
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10 group-hover:bg-indigo-100/50 transition-colors"></div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {!story.image && (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                            <span className="text-lg text-indigo-700 font-bold">
                              {(story.name || 'A')?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-900 line-clamp-1">
                            {story.name || 'Anonymous Student'}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">
                            {story.college || 'College'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < story.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {!story.image && (
                      <div className="mb-4">
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100 inline-block">
                          {story.company || 'Company'}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 mb-6">
                      <p className={`text-slate-600 text-sm leading-relaxed ${expandedId === story._id ? '' : 'line-clamp-4'}`}>
                        {story.experience || story.content || 'No experience shared yet.'}
                      </p>
                      {((story.experience?.length || 0) > 150 || (story.content?.length || 0) > 150) && (
                        <button 
                          onClick={() => setExpandedId(expandedId === story._id ? null : story._id)}
                          className="text-indigo-600 text-sm font-semibold mt-2 hover:text-indigo-800 transition-colors"
                        >
                          {expandedId === story._id ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <div className="text-xs text-slate-400 font-medium">
                        {new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex gap-3">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 focus:outline-none group/btn">
                          <ThumbsUp className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                          <span className="text-xs font-medium">Like</span>
                        </button>
                        <button 
                          onClick={() => handleShare(story._id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 focus:outline-none group/btn"
                        >
                          <Share2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SuccessStoriesPublic;
