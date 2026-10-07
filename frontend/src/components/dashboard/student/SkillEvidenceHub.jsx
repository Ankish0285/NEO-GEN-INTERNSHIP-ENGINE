import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { api } from '../../../services/api';
import { getSkillEvidence, getSkillEvidenceBreakdown, addSkillEvidence } from '../../../services/careerService';
import SkillEvidenceCard from '../../career/SkillEvidenceCard';
import { Skeleton } from '../../ui/Skeleton';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import EmptyState from '../../ui/EmptyState';
import ConfidenceBar from '../../career/ConfidenceBar';

const defaultForm = {
  skillName: '',
  proficiency: 'beginner',
  evidenceType: 'resume',
  description: '',
  strength: 'moderate',
};

const SkillEvidenceHub = () => {
  const [evidence, setEvidence] = useState([]);
  const [breakdown, setBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [ev, bk] = await Promise.all([getSkillEvidence(), getSkillEvidenceBreakdown()]);
      setEvidence(Array.isArray(ev) ? ev : []);
      setBreakdown(bk && typeof bk === 'object' ? bk : {});
    } catch (err) {
      console.warn('[SkillEvidenceHub] fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const avgConfidence =
    evidence.length > 0
      ? Math.round(
          evidence.reduce((sum, item) => sum + (item.confidenceScore ?? 0), 0) / evidence.length
        )
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addSkillEvidence(form);
      setShowModal(false);
      setForm({ ...defaultForm });
      await fetchData();
    } catch (err) {
      console.error('[SkillEvidenceHub] submit error:', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="neo-h2 flex items-center gap-2">
          <ShieldCheck className="text-[#FF9933]" />
          Skill Evidence Hub
        </h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} className="inline mr-1" />
          Add Skill Evidence
        </Button>
      </div>

      {!loading && evidence.length > 0 && (
        <div className="neo-glass p-4">
          <p className="text-sm text-gray-600 mb-2">Overall Confidence</p>
          <ConfidenceBar score={avgConfidence} showPercent size="lg" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : evidence.length === 0 ? (
        <EmptyState
          title="No Skill Evidence Yet"
          message="Add evidence to build your skill confidence profile"
          actionLabel="Add Evidence"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence.map((item, idx) => (
            <SkillEvidenceCard key={item._id || idx} evidence={item} breakdown={breakdown} />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Skill Evidence">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
            <input
              type="text"
              name="skillName"
              value={form.skillName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40"
              placeholder="e.g. React, Python, Communication"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
            <select
              name="proficiency"
              value={form.proficiency}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Type</label>
            <select
              name="evidenceType"
              value={form.evidenceType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40"
            >
              <option value="resume">Resume</option>
              <option value="project">Project</option>
              <option value="internship">Internship</option>
              <option value="certificate">Certificate</option>
              <option value="assessment">Assessment</option>
              <option value="learning">Learning</option>
              <option value="interview">Interview</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40 resize-none"
              placeholder="Describe your experience with this skill..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Strength</label>
            <select
              name="strength"
              value={form.strength}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40"
            >
              <option value="weak">Weak</option>
              <option value="moderate">Moderate</option>
              <option value="strong">Strong</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Add Evidence'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SkillEvidenceHub;
