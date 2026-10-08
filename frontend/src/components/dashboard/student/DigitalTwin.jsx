import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSkillEvidenceBreakdown, getMyCertificates } from '../../../services/careerService';
import { getAIIntelligence } from '../../../services/aiService';
import { Skeleton } from '../../ui/Skeleton';
import Card from '../../ui/Card';

const Chip = ({ label }) => (
  <span className="inline-block px-2.5 py-1 bg-[#FF9933]/10 text-[#FF9933] text-xs font-medium rounded-full mr-1.5 mb-1.5">
    {label}
  </span>
);

const EmptyLabel = () => (
  <p className="text-sm text-gray-400 italic">Not yet calculated</p>
);

const DigitalTwin = () => {
  const [twin, setTwin] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTwin = async () => {
      try {
        const [aiRes, breakdownRes, certsRes] = await Promise.allSettled([
          getAIIntelligence(),
          getSkillEvidenceBreakdown(),
          getMyCertificates(),
        ]);

        const profile = aiRes.status === 'fulfilled'
          ? (aiRes.value?.data || aiRes.value)
          : {};
        const breakdownRaw = breakdownRes.status === 'fulfilled'
          ? (breakdownRes.value?.data || breakdownRes.value)
          : {};
        const certsRaw = certsRes.status === 'fulfilled'
          ? (certsRes.value?.data || certsRes.value)
          : [];

        const certs = Array.isArray(certsRaw) ? certsRaw : [];

        setTwin({
          currentSkills: Array.isArray(profile?.skillProfile) ? profile.skillProfile : [],
          strengths: Array.isArray(profile?.strengths) ? profile.strengths : [],
          weaknesses: Array.isArray(profile?.weaknesses) ? profile.weaknesses : [],
          targetRoles: Array.isArray(profile?.recommendedCareerPath) ? profile.recommendedCareerPath : [],
          confidenceMap: breakdownRaw && typeof breakdownRaw === 'object' ? breakdownRaw : null,
          opportunityProfile: {
            certificates: certs.length,
            verifiedCerts: certs.filter((c) => c.status === 'active').length,
          },
        });
      } catch (err) {
        console.warn('[DigitalTwin] fetch error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTwin();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="neo-h2 flex items-center gap-2">
          <Brain className="text-[#FF9933]" />
          Digital Twin
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentSkills = Array.isArray(twin.currentSkills) ? twin.currentSkills : [];
  const targetRoles = Array.isArray(twin.targetRoles) ? twin.targetRoles : [];
  const strengths = Array.isArray(twin.strengths) ? twin.strengths : [];
  const weaknesses = Array.isArray(twin.weaknesses) ? twin.weaknesses : [];
  const confidenceMap =
    twin.confidenceMap && typeof twin.confidenceMap === 'object' ? twin.confidenceMap : null;
  const opportunityProfile = twin.opportunityProfile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="neo-h2 flex items-center gap-2">
          <Brain className="text-[#FF9933]" />
          Digital Twin
        </h1>
        <p className="text-sub mt-1">
          An AI-generated analytical view of your career profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card title="Current Skills">
            {currentSkills.length > 0 ? (
              <div className="flex flex-wrap">
                {currentSkills.map((skill, i) => (
                  <Chip key={i} label={skill} />
                ))}
              </div>
            ) : (
              <EmptyLabel />
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <Card title="Confidence Map">
            {confidenceMap ? (
              <ul className="space-y-1">
                {Object.entries(confidenceMap).map(([key, val]) => (
                  <li key={key} className="flex justify-between text-sm">
                    <span className="text-gray-700">{key}</span>
                    <span className="font-semibold text-[#FF9933]">{val}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLabel />
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card title="Target Roles">
            {targetRoles.length > 0 ? (
              <div className="flex flex-wrap">
                {targetRoles.map((role, i) => (
                  <Chip key={i} label={role} />
                ))}
              </div>
            ) : (
              <EmptyLabel />
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Card title="Strengths">
            {strengths.length > 0 ? (
              <ul className="space-y-1">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={15} className="text-[#138808] flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLabel />
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <Card title="Weaknesses">
            {weaknesses.length > 0 ? (
              <ul className="space-y-1">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle size={15} className="text-[#e68a2e] flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLabel />
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card title="Opportunity Profile">
            {opportunityProfile ? (
              typeof opportunityProfile === 'string' ? (
                <p className="text-sm text-gray-700">{opportunityProfile}</p>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(opportunityProfile).map(([key, val]) => (
                    <li key={key} className="flex justify-between text-sm">
                      <span className="text-gray-700">{key}</span>
                      <span className="font-medium text-gray-900">{String(val)}</span>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <EmptyLabel />
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DigitalTwin;
