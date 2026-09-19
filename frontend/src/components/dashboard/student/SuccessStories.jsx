import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { toast } from 'react-hot-toast';
import { Star, Upload, Image as ImageIcon, Edit2, Trash2, X } from 'lucide-react';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';

const SuccessStories = () => {
  const [experience, setExperience] = useState('');
  const [image, setImage] = useState(null);
  const [college, setCollege] = useState('');
  const [company, setCompany] = useState('');
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    experience: '',
    name: '',
    college: '',
    company: '',
    rating: 0
  });
  const [editImage, setEditImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserStories();
  }, []);

  const fetchUserStories = async () => {
    try {
      setStoriesLoading(true);
      const res = await api.get('/stories/me');
      console.log('Fetched stories response:', res);
      // Backend returns { success: true, count: X, data: [...] }
      const fetchedStories = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      console.log('Parsed stories:', fetchedStories);
      setStories(fetchedStories);
    } catch (err) {
      console.error('Failed to load stories:', err);
      setStories([]);
      toast.error('Failed to load your stories');
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!experience) return toast.error('Please write your experience');
    if (!college) return toast.error('Please enter your college');
    if (!company) return toast.error('Please enter your company');

    setIsLoading(true);
    try {
      let imageUrl = '';

      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const uploadRes = await api.upload('/upload', formData);
        imageUrl = uploadRes.filePath;
      }

      const submitRes = await api.post('/stories/add', 
        { experience, image: imageUrl, college, company }
      );
      console.log('Story submitted:', submitRes);
      toast.success('Story submitted successfully!');
      
      // If user gave rating, save it
      if (rating > 0) {
        try {
          await api.post(`/stories/${submitRes.data.data._id}/rate`, { rating });
          console.log('Rating saved:', rating);
        } catch (ratingErr) {
          console.error('Failed to save rating:', ratingErr);
        }
      }
      
      setExperience('');
      setImage(null);
      setCollege('');
      setCompany('');
      setRating(0);
      // Re-fetch stories to show the new story
      await fetchUserStories();
    } catch (err) {
      console.error('Submit story error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit story');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStart = async (story) => {
    // Initialize with ALL fields properly from the story
    setEditingId(story._id);
    setEditData({
      experience: story.experience || '',
      name: story.name || '',
      college: story.college || '',
      company: story.company || '',
      rating: 0  // Will be updated by API call below
    });
    setEditImage(null);
    setIsSaving(false);

    // Fetch the user's existing rating for this story
    try {
      const res = await api.get(`/stories/${story._id}/my-rating`);
      // Update rating from API response
      if (res.data?.success && res.data?.data !== null) {
        setEditData(prev => ({
          ...prev, 
          rating: Number(res.data.data) || 0
        }));
      } else {
        // No rating exists yet, rating stays 0
        setEditData(prev => ({...prev, rating: 0}));
      }
    } catch (err) {
      console.error('Failed to load user rating:', err);
      // Continue without rating - set to 0
      setEditData(prev => ({...prev, rating: 0}));
    }
  };

  const handleEditSave = async () => {
    // Validate required fields
    if (!editData.experience?.trim() || !editData.college?.trim() || !editData.company?.trim()) {
      return toast.error('Please fill all required fields');
    }

    setIsSaving(true);
    try {
      let imageUrl = undefined;
      
      // Upload image if changed
      if (editImage) {
        try {
          const formData = new FormData();
          formData.append('file', editImage);
          const uploadRes = await api.upload('/upload', formData);
          imageUrl = uploadRes.filePath;
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          toast.error('Failed to upload image');
          setIsSaving(false);
          return;
        }
      }

      // Build update payload (don't include rating - handled separately)
      const updatePayload = {
        experience: editData.experience,
        name: editData.name,
        college: editData.college,
        company: editData.company
      };

      if (imageUrl) {
        updatePayload.image = imageUrl;
      }

      // Step 1: Update story fields
      console.log('Updating story:', { storyId: editingId, payload: updatePayload });
      await api.put(`/stories/user/${editingId}`, updatePayload);
      console.log('Story updated successfully');

      // Step 2: Save rating if user has set one (via separate endpoint)
      if (editData.rating && editData.rating > 0) {
        try {
          console.log('Saving rating:', { storyId: editingId, rating: editData.rating });
          await api.post(`/stories/${editingId}/rate`, { rating: editData.rating });
          console.log('Rating saved successfully');
        } catch (ratingErr) {
          console.error('Failed to save rating:', ratingErr);
          // Log but don't block - story was already updated
        }
      }

      toast.success('Story updated successfully!');
      
      // Clear edit state
      setEditingId(null);
      setEditData({
        experience: '',
        name: '',
        college: '',
        company: '',
        rating: 0
      });
      setEditImage(null);
      
      // Refresh stories list
      await fetchUserStories();
    } catch (err) {
      console.error('Failed to update story:', err);
      toast.error(err.response?.data?.message || 'Failed to update story');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    setDeletingId(storyId);
    try {
      const res = await api.delete(`/stories/user/${storyId}`);
      console.log('Delete response:', res);
      toast.success('Story deleted successfully!');
      fetchUserStories();
    } catch (err) {
      console.error('Delete error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message
      });
      toast.error(err.response?.data?.message || 'Failed to delete story');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-navy border-b-4 border-saffron pb-2">Share Your Story</h1>
      </div>

      {/* Share Story Card */}
      <div className="glass-card shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Your Experience</label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows="4"
              className="w-full p-4 border border-navy/10 bg-white/50 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron transition-all outline-none resize-none"
              placeholder="How did NEO GEN INTERNSHIP ENGINE help you land your dream internship?"
            ></textarea>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-navy mb-1">College</label>
              <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} className="w-full p-2 border border-navy/10 bg-white/50 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" placeholder="College Name" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-navy mb-1">Company</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full p-2 border border-navy/10 bg-white/50 rounded-lg focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none" placeholder="Company Name" />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-bold text-navy mb-2">Attached Image (Optional)</label>
            <div className="flex items-center gap-2 border border-navy/10 rounded-lg px-3 py-1.5 bg-white/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
              <ImageIcon className="text-saffron w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full bg-transparent outline-none text-sm file:cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-saffron-light file:text-saffron-hover hover:file:bg-saffron/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy mb-2">Rate Your Experience</label>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  onClick={() => setRating(starValue)}
                  type="button"
                  className="focus:outline-none transition hover:scale-110"
                >
                  <Star 
                    size={28}
                    className={`${
                      starValue <= rating
                        ? 'fill-saffron text-saffron'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-saffron">{rating} ⭐</span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-navy/5 flex justify-end">
            <button
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? 'Submitting...' : 'Submit Story'}
              {!isLoading && <Upload className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Your Stories */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-navy mb-6">Your Submitted Stories</h2>
        {storiesLoading ? (
          <div className="text-center py-12">
            <p className="text-navy/60">Loading your stories...</p>
          </div>
        ) : (Array.isArray(stories) ? stories : []).length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-saffron/5 to-white/40 rounded-xl border border-dashed border-saffron/20">
            <Star className="w-12 h-12 text-saffron/40 mx-auto mb-3" />
            <p className="text-navy/60 font-medium">You haven't submitted a success story yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Array.isArray(stories) ? stories : []).map(story => (
                <div key={story._id} className="glass-card p-6 flex flex-col items-center text-center relative">
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleEditStart(story)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(story._id)}
                      disabled={deletingId === story._id}
                      className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>

                  {story.image ? (
                    <img
                      src={resolveStoryImageUrl(story.image)}
                      alt="Student Profile"
                      className="w-20 h-20 rounded-full object-cover border-4 border-saffron-light mb-4 shadow-sm"
                      onError={(e) => {
                        const name = story.name || story.studentId?.name || 'S';
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-saffron to-[#ffad5c] flex items-center justify-center border-4 border-saffron-light mb-4 shadow-sm">
                      <span className="text-2xl text-white font-bold">{(story.name || story.studentId?.name || 'S').charAt(0)}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-navy">{story.name || story.studentId?.name || 'You'}</h3>
                  <p className="text-sm text-sub">{story.college} • {story.company}</p>
                  <div className="flex gap-1 my-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(story.ratingAverage) ? 'fill-saffron text-saffron' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-navy/50 mb-2">
                    {story.ratingCount > 0 ? `${story.ratingAverage} ⭐ (${story.ratingCount} ratings)` : 'No ratings yet'}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                    story.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    story.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {story.status?.toUpperCase()}
                  </span>
                  <p className="text-navy/80 italic flex-1 font-medium bg-white/40 p-3 rounded-lg border border-navy/5 shadow-inner">"{story.experience}"</p>
                </div>
              ))}
            </div>

            {/* Edit Modal - Rendered outside the story cards for proper z-index */}
            {editingId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-md max-h-screen flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-bold">Edit Story</h3>
                    <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Experience</label>
                      <textarea
                        value={editData.experience}
                        onChange={(e) => setEditData({...editData, experience: e.target.value})}
                        rows="2"
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-saffron outline-none"
                        placeholder="Your experience"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700">College</label>
                      <input
                        type="text"
                        value={editData.college}
                        onChange={(e) => setEditData({...editData, college: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-saffron outline-none"
                        placeholder="College"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700">Company</label>
                      <input
                        type="text"
                        value={editData.company}
                        onChange={(e) => setEditData({...editData, company: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-saffron outline-none"
                        placeholder="Company"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Change image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditImage(e.target.files[0])}
                        className="w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Your Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            onClick={() => setEditData({...editData, rating: starValue})}
                            className="focus:outline-none transition"
                            type="button"
                          >
                            <Star 
                              size={20}
                              className={`${
                                starValue <= (editData.rating || 0)
                                  ? 'fill-saffron text-saffron'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {editData.rating && (
                        <p className="text-xs text-gray-500 mt-1">Rating: {editData.rating} ⭐</p>
                      )}
                    </div>
                  </div>

                  {/* Footer with buttons - ALWAYS VISIBLE */}
                  <div className="flex gap-2 p-4 border-t border-gray-200 flex-shrink-0 bg-white">
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={isSaving}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={isSaving || !editData.experience?.trim() || !editData.college?.trim() || !editData.company?.trim()}
                      className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default SuccessStories;
