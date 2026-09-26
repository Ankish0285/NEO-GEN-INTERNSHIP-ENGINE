import React, { useState, useEffect } from 'react';
import { Quote, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { resolveStoryImageUrl } from '../../utils/resolveStoryImageUrl';
import MotionReveal from '../ui/MotionReveal';

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
                rating: story.ratingAverage || 0,  // Extract rating from API
                ratingCount: story.ratingCount || 0  // Extract rating count
              };
            })
          );
        } else {
          throw new Error('No reviews');
        }
      } catch {
        setReviews([
          { id: 1, name: 'Kovina Sen', role: 'Intern', department: 'Ministry of Finance', text: 'A very good industry-focused internship experience through NeoGen.', image: 'https://i.pravatar.cc/100?u=kovina', rating: 5, ratingCount: 1 },
          { id: 2, name: 'Eenid', role: 'Employer', department: 'NITI Aayog', text: 'Seamless recruitment and strong outreach to talented students nationwide.', image: 'https://i.pravatar.cc/100?u=eenid', rating: 5, ratingCount: 1 },
          { id: 3, name: 'Sonision Dorote', role: 'Employer', department: 'Skill India', text: 'NeoGen made hiring interns efficient and transparent for our organization.', image: 'https://i.pravatar.cc/100?u=sonision', rating: 5, ratingCount: 1 },
        ]);
      }
    };
    fetchReviews();
  }, []);

  return (
    <section className="neo-section" id="reviews-section" style={{ opacity: 1 }}>
      <div className="neo-container">
        <div className="neo-section-header">
          <MotionReveal y={30} delay={0} duration={0.6}>
            <h2 className="neo-h2">What People Say</h2>
          </MotionReveal>
          <MotionReveal y={25} delay={0.1} duration={0.55}>
            <p className="neo-lead">
              Hear from interns who found their path and employers who found talent.
            </p>
          </MotionReveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              className="neo-glass p-8 relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
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
                  <h4 className="font-bold text-gray-900">{review.name}</h4>
                  <p className="text-sm text-gray-600">{review.role}</p>
                  {review.department && (
                    <p className="text-xs font-medium text-[#138808]">{review.department}</p>
                  )}
                </div>
              </div>

              {/* Star Rating Display */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#138808]/10">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`${
                        star <= Math.round(review.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {review.rating > 0 ? `${review.rating}` : 'Not rated'}
                </span>
              </div>

              <p className="text-gray-600 leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
