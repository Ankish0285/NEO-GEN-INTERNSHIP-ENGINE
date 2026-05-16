import React from 'react';
import { Briefcase, Users, MapPin, CheckCircle } from 'lucide-react';

const Stats = () => {
  const stats = [
    { icon: <Briefcase className="w-8 h-8 text-[#f97316]" />, number: '1,00,000+', label: 'Active Opportunities' },
    { icon: <Users className="w-8 h-8 text-[#16a34a]" />, number: '50,000+', label: 'Students Placed' },
    { icon: <MapPin className="w-8 h-8 text-[#f97316]" />, number: '730', label: 'Districts Covered' },
    { icon: <CheckCircle className="w-8 h-8 text-[#16a34a]" />, number: '95%', label: 'Success Rate' },
  ];

  return (
    <section className="stats-section" style={{ padding: '60px 0', backgroundColor: '#f9fafb' }}>
        <div className="container">
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        className="stat-card" 
                        style={{ 
                            textAlign: 'center', 
                            padding: '30px', 
                            backgroundColor: 'white', 
                            borderRadius: '16px', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px'
                        }}
                    >
                        <div style={{ marginBottom: '10px' }}>
                            {stat.icon}
                        </div>
                        <div className="stat-number" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{stat.number}</div>
                        <div className="stat-label" style={{ fontSize: '1rem', color: '#6b7280', fontWeight: '500' }}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Stats;
