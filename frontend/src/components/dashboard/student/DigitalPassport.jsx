import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, Briefcase, Award, Code, Star, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSkillEvidence, getMyCertificates } from '../../../services/careerService';
import { api } from '../../../services/api';
import CertificateCard from '../../career/CertificateCard';
import PassportSection from '../../career/PassportSection';
import { Skeleton } from '../../ui/Skeleton';

const TABS = [
  { key: 'skills', label: 'Skills', icon: Code },
  { key: 'internships', label: 'Internships', icon: Briefcase },
  { key: 'certificates', label: 'Certificates', icon: Award },
  { key: 'projects', label: 'Projects', icon: BookOpen },
  { key: 'assessments', label: 'Assessments', icon: Shield },
  { key: 'achievements', label: 'Achievements', icon: Star },
];

const DigitalPassport = () => {
  const [activeTab, setActiveTab] = useState('skills');
  const [skillData, setSkillData] = useState([]);
  const [certData, setCertData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track which tabs have been fetched to implement lazy loading
  const [fetchedTabs, setFetchedTabs] = useState(new Set());

  const fetchSkills = async () => {
    if (fetchedTabs.has('skills')) return;
    setLoading(true);
    try {
      const data = await getSkillEvidence();
      setSkillData(Array.isArray(data) ? data : []);
      setFetchedTabs((prev) => new Set([...prev, 'skills']));
    } catch (err) {
      console.warn('[DigitalPassport] skills fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCerts = async () => {
    if (fetchedTabs.has('certificates')) return;
    setLoading(true);
    try {
      const data = await getMyCertificates();
      setCertData(Array.isArray(data) ? data : []);
      setFetchedTabs((prev) => new Set([...prev, 'certificates']));
    } catch (err) {
      console.warn('[DigitalPassport] certificates fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch for skills tab
  useEffect(() => {
    fetchSkills();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy fetch when switching to certificates tab
  useEffect(() => {
    if (activeTab === 'certificates') {
      fetchCerts();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = () => {
    toast.success('Coming Soon — passport sharing will be available soon!');
  };

  const verifiedSkillNames = skillData
    .filter((item) => item.skillName || item.skill)
    .map((item) => item.skillName || item.skill);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="neo-h2 flex items-center gap-2">
          <BookOpen className="text-[#FF9933]" />
          Digital Passport
        </h1>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FF9933]/40 text-[#FF9933] text-sm font-semibold hover:bg-[#FF9933]/5 transition-colors"
        >
          <Share2 size={15} />
          Share Passport
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-[#FF9933] text-[#FF9933] bg-[#FF9933]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : activeTab === 'skills' ? (
          <PassportSection
            title="Verified Skills"
            items={verifiedSkillNames}
            emptyMessage="No skills recorded yet. Add skill evidence to populate this section."
          />
        ) : activeTab === 'certificates' ? (
          certData.length === 0 ? (
            <PassportSection
              title="Certificates"
              items={[]}
              emptyMessage="No certificates added yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certData.map((cert, idx) => (
                <CertificateCard key={cert._id || idx} certificate={cert} />
              ))}
            </div>
          )
        ) : (
          <PassportSection
            title={TABS.find((t) => t.key === activeTab)?.label || activeTab}
            items={[]}
            emptyMessage="Coming Soon"
          />
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
        You control what is visible on your public profile
      </p>
    </div>
  );
};

export default DigitalPassport;
