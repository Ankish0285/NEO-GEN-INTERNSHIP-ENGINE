import React from 'react';
import { Target, BarChart3, Bot, Globe2 } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: <Target className="w-8 h-8 text-[#f97316]" />,
      title: "Precision Matching",
      description: "Advanced AI algorithms ensure perfect alignment between your profile and available opportunities."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-[#16a34a]" />,
      title: "ATS Optimization",
      description: "Get your resume optimized for Applicant Tracking Systems used by government agencies."
    },
    {
      icon: <Bot className="w-8 h-8 text-[#f97316]" />,
      title: "AI Assistant",
      description: "24/7 intelligent support to guide you through every step of your internship journey."
    },
    {
      icon: <Globe2 className="w-8 h-8 text-[#16a34a]" />,
      title: "Government Network",
      description: "Direct partnerships with major government departments and ministries across India."
    }
  ];

  return (
    <section className="py-24 bg-white" id="about-section">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              About <span className="text-[#f97316]">NEO</span> <span className="text-[#16a34a]">GEN</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Empowering India's youth with government internship opportunities. NEO GEN is India's premier government internship portal, connecting talented students with meaningful opportunities.
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  We believe in building the future of public service through technology and innovation, bridging the gap between talent and government administration.
                </p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">Government Partnerships</h3>
                <p className="text-gray-600 leading-relaxed">
                  We work closely with major government departments including NITI Aayog, Ministry of External Affairs, MeitY, ISRO, and many more to bring you authentic opportunities.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-8 glass-card rounded-2xl hover:shadow-xl transition-all duration-300 group"
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
