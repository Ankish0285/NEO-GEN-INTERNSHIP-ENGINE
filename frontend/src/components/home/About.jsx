import React from 'react';
import { Target, BarChart3, Bot, Globe2 } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const FEATURE_ICONS = [Target, BarChart3, Bot, Globe2];
const FEATURE_COLORS = ['#f97316', '#16a34a', '#f97316', '#16a34a'];

const About = () => {
  const { settings } = useSiteSettings();
  const { branding, about } = settings;
  const features = about.features?.length ? about.features : [];

  return (
    <section className="py-24 bg-white" id="about-section">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              About <span style={{ color: branding.primaryColor }}>{about.titleHighlight1}</span>{' '}
              <span style={{ color: branding.secondaryColor }}>{about.titleHighlight2}</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">{about.intro}</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">{about.missionTitle}</h3>
                <p className="text-gray-600 leading-relaxed">{about.missionText}</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">{about.partnershipsTitle}</h3>
                <p className="text-gray-600 leading-relaxed">{about.partnershipsText}</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
              const color = FEATURE_COLORS[index % FEATURE_COLORS.length];
              return (
                <div
                  key={index}
                  className="glass-card p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="mb-4">{<Icon className="w-8 h-8" style={{ color }} />}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
