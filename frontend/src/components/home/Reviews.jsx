import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { resolveStoryImageUrl } from '../../utils/resolveStoryImageUrl';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
        try {
            const response = await fetch('/api/stories?status=approved');
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
              const mappedReviews = result.data.map(story => {
                const name = story.name || story.studentId?.name || 'Anonymous';
                const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                const resolved = story.image ? resolveStoryImageUrl(story.image) : '';
                return {
                  id: story._id,
                  name,
                  role: 'Intern',
                  department: story.company || story.college,
                  text: story.experience || story.content || '',
                  image: resolved || fallback
                };
              });
              setReviews(mappedReviews);
            } else {
              throw new Error("No reviews found");
            }
        } catch (error) {
            // Mock data matching the user's mockup style
            setReviews([
                { id: 1, name: 'Kovina Sen', role: 'Intern', department: 'Ministry of Finance', text: 'I got this as a summer intern at devalopers, and a very good experience with my new learned things based on industry.', image: 'https://i.pravatar.cc/100?u=kovina' },
                { id: 2, name: 'Eenid', role: 'Employer', department: 'NITI Aayog', text: 'The outreach was vast from elaux suama, and indian market sheird has predes, materials and seamless recruitment process.', image: 'https://i.pravatar.cc/100?u=eenid' },
                { id: 3, name: 'Sonision Dorote', role: 'Employer', department: 'Skill India', text: 'Three-tier sossol intelligent, and cograilone are talaho was and tools cussos inseum exercised enjoy stravos and your possible.', image: 'https://i.pravatar.cc/100?u=sonision' }
            ]);
        }
    };
    fetchReviews();
  }, []);

  return (
    <section className="reviews-section" style={{ padding: '100px 0', backgroundColor: '#f9fafb' }}>
        <div className="container">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>What People Say</h2>
                <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>Hear from interns who found their path and employers who found talent.</p>
            </div>
            <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                {reviews.map(review => (
                    <div 
                        key={review.id} 
                        className="review-card glass-card" 
                        style={{ 
                            padding: '40px', 
                            borderRadius: '24px', 
                            position: 'relative',
                            transition: 'transform 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Quote className="text-[#16a34a] w-10 h-10 absolute top-8 right-8 opacity-20" />
                        
                        <div className="review-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <img 
                                src={review.image} 
                                alt={review.name} 
                                className="reviewer-img" 
                                onError={(e) => {
                                  const name = encodeURIComponent(review.name || 'A');
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=random`;
                                }}
                                style={{ 
                                    width: '64px', 
                                    height: '64px', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    border: '3px solid #f0fdf4'
                                }} 
                            />
                            <div className="reviewer-info">
                                <h4 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 'bold', color: '#111827' }}>{review.name}</h4>
                                <p style={{ margin: '0', fontSize: '0.9rem', color: '#6b7280' }}>{review.role}</p>
                                {review.department && <p style={{ margin: '0', fontSize: '0.8rem', color: '#16a34a', fontWeight: '500' }}>{review.department}</p>}
                            </div>
                        </div>
                        
                        <p className="review-text" style={{ fontSize: '1.05rem', color: '#4b5563', lineHeight: '1.7', fontStyle: 'italic' }}>
                            "{review.text}"
                        </p>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Reviews;
