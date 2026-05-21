import React from 'react';
import { Search, FileText, Briefcase } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const STEP_ICONS = [Search, FileText, Briefcase];
const STEP_COLORS = ['#f97316', '#16a34a', '#f97316'];

const HowItWorks = () => {
  const { settings } = useSiteSettings();
  const { howItWorks } = settings;
  const steps = howItWorks.steps?.length ? howItWorks.steps : [];

  return (
    <section className="py-24 bg-gray-50" id="how-it-works">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{howItWorks.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{howItWorks.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index % STEP_ICONS.length];
            const color = STEP_COLORS[index % STEP_COLORS.length];
            return (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 glass-card rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                  <Icon className="w-12 h-12" style={{ color }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-sm">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
