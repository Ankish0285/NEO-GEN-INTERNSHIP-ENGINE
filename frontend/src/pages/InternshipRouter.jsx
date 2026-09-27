/**
 * InternshipRouter  —  /internships/:slug
 *
 * Single entry-point that dispatches to either:
 *   • InternshipCategoryPage  when :slug matches a known category
 *   • InternshipDetailPage    for everything else (title-org-location slug or MongoDB _id)
 *
 * This avoids two competing React Router <Route> patterns on the same path
 * and keeps routing logic in one place.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { getCategoryBySlug } from '../seo/categories';
import InternshipCategoryPage from './InternshipCategoryPage';
import InternshipDetailPage   from './InternshipDetailPage';

const InternshipRouter = () => {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug);
  return category
    ? <InternshipCategoryPage />
    : <InternshipDetailPage />;
};

export default InternshipRouter;
