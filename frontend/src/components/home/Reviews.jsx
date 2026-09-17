import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { resolveStoryImageUrl } from '../../utils/resolveStoryImageUrl';
import MotionSection from '../ui/MotionSection';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const result = await api.get('/stories?status=approved');
        if (result.success && result.data?.length > 0) {
          setReviews(
            result.data.map((story) => {
              const name = story.name || story.studentId?.name || 'Anonymous';
              const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
              const resolved = story.image ? resolveStoryImageUrl(story.image) : '';
              return {
                id: story._id,
                name,
                role: 'Intern',
                department: story.company || story.college,
                text: story.experience || story.content || '',
                image: resolved || fallback,
              };
            })
          );
        } else {
          throw new Error('No reviews');
        }
      } catch {
        setReviews([
          { id: 1, name: 'Kovina Sen', role: 'Intern', department: 'Ministry of Finance', text: 'A very good industry-focused internship experience through NeoGen.', image: 'https://i.pravatar.cc/100?u=kovina' },
          { id: 2, name: 'Eenid', role: 'Employer', department: 'NITI Aayog', text: 'Seamless recruitment and strong outreach to talented students nationwide.', image: 'https://i.pravatar.cc/100?u=eenid' },
          { id: 3, name: 'Sonision Dorote', role: 'Employer', department: 'Skill India', text: 'NeoGen made hiring interns efficient and transparent for our organization.', image: 'https://i.pravatar.cc/100?u=sonision' },
        ]);
      }
    };
    fetchReviews();
  }, []);

  return (
    <MotionSection className="neo-section" id="reviews-section">
      <div className="neo-container">
        <div className="neo-section-header">
          <h2 className="neo-h2">What People Say</h2>
          <p className="neo-lead">
            Hear from interns who found their path and employers who found talent.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              className="neo-glass p-8 relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-[#138808] opacity-15" />
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#138808]/20"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`;
                  }}
                />
                <div>
                  <h4 className="font-bold text-[#111827]">{review.name}</h4>
                  <p className="text-sm text-[#4B5563]">{review.role}</p>
                  {review.department && (
                    <p className="text-xs font-medium text-[#138808]">{review.department}</p>
                  )}
                </div>
              </div>
              <p className="text-[#4B5563] leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
};

export default Reviews;
