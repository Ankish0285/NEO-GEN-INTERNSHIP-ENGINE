import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2, CheckCircle, XCircle, Search, Star } from 'lucide-react';
import { api } from '../../../services/api';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';

const SuccessStoriesAdmin = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      // Admin sees all stories
      const res = await api.get('/stories');
      // If we use standard axios we'd do res.data.data. However api.get returns response.data
      setStories(res?.data || res || []);
    } catch (err) {
      console.error('Stories fetch error:', err);
      toast.error('Failed to load stories: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handeStatusChange = async (id, currentStatus, newStatus) => {
    try {
      if (currentStatus === newStatus) return;
      await api.put(`/stories/${id}`, { status: newStatus });
      toast.success(`Story ${newStatus} successfully!`);
      fetchStories();
    } catch (err) {
      toast.error('Failed to update story status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await api.delete(`/stories/${id}`);
      toast.success('Story deleted');
      fetchStories();
    } catch (err) {
      toast.error('Failed to delete story');
    }
  };

  const filteredStories = stories.filter(story => 
    (story.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (story.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Success Stories</h1>
          <p className="text-gray-500 mt-1">Approve, reject, or remove user success stories.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-64 md:w-80 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto block">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading stories...</div>
          ) : filteredStories.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No stories found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm whitespace-nowrap text-gray-500">
                  <th className="p-4 font-medium">Student Info</th>
                  <th className="p-4 font-medium w-96">Experience</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStories.map((story) => (
                  <tr key={story._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 align-top">
                       <div className="flex items-center gap-3">
                          {story.image ? (
                             <img
                               src={resolveStoryImageUrl(story.image)}
                               alt={story.name}
                               className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100"
                               onError={(e) => {
                                 const n = encodeURIComponent(story.name || 'A');
                                 e.currentTarget.onerror = null;
                                 e.currentTarget.src = `https://ui-avatars.com/api/?name=${n}&background=random`;
                               }}
                             />
                          ) : (
                             <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                {(story.name || 'A').charAt(0)}
                             </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{story.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500">{story.college} • {story.company}</div>
                          </div>
                       </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {story.experience || story.content}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < story.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${story.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          story.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {story.status?.charAt(0).toUpperCase() + story.status?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        {story.status !== 'approved' && (
                          <button 
                            onClick={() => handeStatusChange(story._id, story.status, 'approved')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {story.status !== 'rejected' && (
                          <button 
                            onClick={() => handeStatusChange(story._id, story.status, 'rejected')}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(story._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessStoriesAdmin;
