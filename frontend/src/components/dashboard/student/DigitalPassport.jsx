import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, Briefcase, Award, Code, Star, Share2, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSkillEvidence, getMyCertificates, getMyPlacements, getMySkillAssessments } from '../../../services/careerService';
import ProfileService from '../../../services/profileService';
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
  const [placementData, setPlacementData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [assessmentData, setAssessmentData] = useState([]);
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

  const fetchInternships = async () => {
    if (fetchedTabs.has('internships')) return;
    setLoading(true);
    try {
      const res = await getMyPlacements();
      const list = res?.data?.placements || res?.placements || res?.data || res || [];
      setPlacementData(Array.isArray(list) ? list : []);
      setFetchedTabs((prev) => new Set([...prev, 'internships']));
    } catch (err) {
      console.warn('[DigitalPassport] internships fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (fetchedTabs.has('projects')) return;
    setLoading(true);
    try {
      const res = await ProfileService.getProfile();
      const profile = res?.data || res || {};
      const projects = profile.projects || [];
      setProjectData(Array.isArray(projects) ? projects : []);
      setFetchedTabs((prev) => new Set([...prev, 'projects']));
    } catch (err) {
      console.warn('[DigitalPassport] projects fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    if (fetchedTabs.has('assessments')) return;
    setLoading(true);
    try {
      const res = await getMySkillAssessments();
      const list = res?.data?.assessments || res?.assessments || res?.data || res || [];
      setAssessmentData(Array.isArray(list) ? list : []);
      setFetchedTabs((prev) => new Set([...prev, 'assessments']));
    } catch (err) {
      console.warn('[DigitalPassport] assessments fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch: skills on mount, plus eagerly fetch counts for Achievements tab
  useEffect(() => {
    fetchSkills();
    // Eagerly prefetch certs, internships and assessments so the Achievements
    // tab has the counts even if the user navigates there first.
    fetchCerts();
    fetchInternships();
    fetchAssessments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy fetch remaining tabs on first activation
  useEffect(() => {
    if (activeTab === 'certificates') {
      fetchCerts();
    } else if (activeTab === 'internships') {
      fetchInternships();
    } else if (activeTab === 'projects') {
      fetchProjects();
    } else if (activeTab === 'assessments') {
      fetchAssessments();
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
        ) : activeTab === 'internships' ? (
          placementData.length === 0 ? (
            <PassportSection
              title="Internships"
              items={[]}
              emptyMessage="No internships recorded yet."
            />
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-700">Internships</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {placementData.map((p, idx) => (
                  <div key={p._id || idx} className="neo-glass rounded-xl p-4 border border-gray-200 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{p.company || p.companyName || 'Company'}</p>
                        <p className="text-sm text-gray-500 truncate">{p.role || p.title || 'Intern'}</p>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'completed' || p.verified
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-[#fff4e8] text-[#e68a2e]'
                      }`}>
                        {p.verified ? 'Verified' : p.status || 'Ongoing'}
                      </span>
                    </div>
                    {(p.startDate || p.endDate || p.duration) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {p.duration || (p.startDate && p.endDate
                          ? `${new Date(p.startDate).toLocaleDateString()} – ${new Date(p.endDate).toLocaleDateString()}`
                          : p.startDate
                            ? `From ${new Date(p.startDate).toLocaleDateString()}`
                            : null)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : activeTab === 'projects' ? (
          projectData.length === 0 ? (
            <PassportSection
              title="Projects"
              items={[]}
              emptyMessage="No projects added to your profile yet."
            />
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-700">Projects</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectData.map((project, idx) => (
                  <div key={project._id || idx} className="neo-glass rounded-xl p-4 border border-gray-200 space-y-2">
                    <p className="font-semibold text-gray-800">{project.name || project.title || 'Project'}</p>
                    {project.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                    )}
                    {(project.technologies || project.techStack || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(project.technologies || project.techStack).map((tech, tIdx) => (
                          <span key={tIdx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : activeTab === 'assessments' ? (
          assessmentData.length === 0 ? (
            <PassportSection
              title="Assessments"
              items={[]}
              emptyMessage="No skill assessments taken yet."
            />
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-700">Skill Assessments</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessmentData.map((a, idx) => {
                  const score = a.score ?? a.result ?? 0;
                  const passed = score >= 70;
                  return (
                    <div key={a._id || idx} className="neo-glass rounded-xl p-4 border border-gray-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800 truncate">{a.skillName || a.skill || 'Skill'}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {passed ? 'Passed' : 'Needs Work'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${passed ? 'bg-emerald-500' : 'bg-[#FF9933]'}`}
                            style={{ width: `${Math.min(100, score)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700 shrink-0">{score}%</span>
                      </div>
                      {a.createdAt && (
                        <p className="text-xs text-gray-400">
                          {new Date(a.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : activeTab === 'achievements' ? (
          (() => {
            // All four data sources are eagerly loaded on mount, so counts are
            // available regardless of which tab the user visits first.
            const allLoaded =
              fetchedTabs.has('internships') &&
              fetchedTabs.has('certificates') &&
              fetchedTabs.has('assessments') &&
              fetchedTabs.has('skills');

            if (!allLoaded) {
              return (
                <PassportSection
                  title="Achievements"
                  items={[]}
                  emptyMessage="Loading achievements… please wait a moment."
                />
              );
            }

            const completedInternships = placementData.filter((p) => p.status === 'completed' || p.verified).length;
            const activeCerts = certData.filter((c) => c.status === 'active').length;
            const passedAssessments = assessmentData.filter((a) => (a.score ?? a.result ?? 0) >= 70).length;
            const highConfidenceSkills = skillData.filter((s) => (s.confidence ?? s.confidenceScore ?? 0) > 70).length;

            const achievements = [
              completedInternships > 0 && `${completedInternships} internship${completedInternships > 1 ? 's' : ''} completed`,
              activeCerts > 0 && `${activeCerts} certificate${activeCerts > 1 ? 's' : ''} earned`,
              passedAssessments > 0 && `${passedAssessments} assessment${passedAssessments > 1 ? 's' : ''} passed`,
              highConfidenceSkills > 0 && `${highConfidenceSkills} skill${highConfidenceSkills > 1 ? 's' : ''} with high confidence`,
            ].filter(Boolean);

            return (
              <PassportSection
                title="Achievements"
                items={achievements}
                emptyMessage="Complete internships, earn certificates, and take assessments to unlock achievements."
              />
            );
          })()
        ) : null}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
        You control what is visible on your public profile
      </p>
    </div>
  );
};

export default DigitalPassport;
