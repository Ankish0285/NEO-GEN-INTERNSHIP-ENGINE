import React from 'react';
import { Search, FileText, Briefcase } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="w-12 h-12 text-[#f97316]" />,
      title: "Search",
      description: "Search through thousands of government internships tailored to your skills and interests. Filter by location, department, and duration."
    },
    {
      icon: <FileText className="w-12 h-12 text-[#16a34a]" />,
      title: "Apply",
      description: "Create your profile, upload your resume, and apply to multiple opportunities with a single click. Our ATS-friendly system helps you stand out."
    },
    {
      icon: <Briefcase className="w-12 h-12 text-[#f97316]" />,
      title: "Get Hired",
      description: "Track your application status, ace the interview, and kickstart your career in public service. Receive offer letters directly through the portal."
    }
  ];

  return (
    <section className="py-24 bg-gray-50" id="how-it-works">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your journey to a government internship in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 glass-card rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
