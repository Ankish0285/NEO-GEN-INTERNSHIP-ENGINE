"""Focused tests for deterministic internship matching and scoring."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from engines.scoring_engine import (  # noqa: E402
    calculate_score,
    check_eligibility,
    extract_internship_requirements,
    match_skills,
)
from engines.recommendation_engine import recommend_internships  # noqa: E402
from engines.structured_extraction import extract_resume_evidence  # noqa: E402


class ScoringEngineTests(unittest.TestCase):
    def test_fresher_with_relevant_project_is_eligible_without_experience_penalty(self):
        profile = {
            'skill_profile': ['Python', 'Predictive Modeling', 'SQL'],
            'course': 'B.Tech Computer Science',
            'experience_years': 0,
        }
        job = {'skills': ['Python', 'Machine Learning', 'SQL'], 'eligibility': 'B.Tech Computer Science'}
        result = calculate_score(
            profile,
            extract_internship_requirements(job),
            80,
            {'projects': ['Student Performance Prediction using Python and scikit-learn']},
        )

        self.assertEqual(result['eligibility']['status'], 'eligible')
        self.assertEqual(result['score']['experience_bonus'], 0)
        self.assertEqual(result['matching']['missing_required_skills'], [])
        self.assertTrue(result['matching']['relevant_projects'])
        self.assertGreaterEqual(result['score']['final_score'], 80)

    def test_mandatory_education_mismatch_is_not_eligible(self):
        profile = {'skill_profile': ['Python'], 'course': 'BBA', 'experience_years': 0}
        requirements = extract_internship_requirements(
            {'skills': ['Python'], 'eligibility': 'B.Tech Computer Science'}
        )

        self.assertEqual(check_eligibility(profile, requirements)['status'], 'not_eligible')

    def test_missing_education_is_unknown(self):
        requirements = extract_internship_requirements(
            {'skills': ['Python'], 'eligibility': 'B.Tech Computer Science'}
        )

        self.assertEqual(check_eligibility({'skill_profile': ['Python']}, requirements)['status'], 'unknown')

    def test_unrelated_skill_does_not_match(self):
        result = match_skills(['React'], ['Python'])

        self.assertEqual(result['matched_skills'], [])
        self.assertEqual(result['missing_required_skills'], ['React'])
        self.assertEqual(result['percentage'], 0.0)

    def test_semantic_skill_alias_matches(self):
        result = match_skills(['Machine Learning'], ['Predictive Modeling'])

        self.assertEqual(result['matched_skills'], ['Machine Learning'])
        self.assertEqual(result['percentage'], 100.0)

    def test_partial_skill_match_is_not_exact(self):
        result = match_skills(['Advanced SQL'], ['Basic SQL'])

        self.assertEqual(result['partial_matches'], ['Advanced SQL'])
        self.assertEqual(result['percentage'], 50.0)

    def test_ineligible_candidate_cannot_outrank_eligible_candidate(self):
        profile = {
            'skill_profile': ['Python'],
            'course': 'B.Tech Computer Science',
            'experience_years': 0,
            'employability_score': 70,
        }
        jobs = [
            {
                'id': 'ineligible',
                'title': 'Python Intern',
                'organization': 'A',
                'department': 'Engineering',
                'description': 'Python internship',
                'eligibility': 'B.Tech Computer Science and 2 years experience',
                'skills': ['Python'],
            },
            {
                'id': 'eligible',
                'title': 'Python Fresher Intern',
                'organization': 'B',
                'department': 'Engineering',
                'description': 'Python internship',
                'eligibility': 'B.Tech Computer Science',
                'skills': ['Python'],
            },
        ]
        result = recommend_internships(
            'Education: B.Tech Computer Science\nSkills: Python',
            jobs,
            profile=profile,
            ats_result={'ats_score': 80},
        )

        self.assertEqual(result['recommendations'][0]['internship_id'], 'eligible')
        self.assertEqual(result['recommendations'][1]['eligibility_status'], 'not_eligible')

    def test_recommendation_contains_structured_contract(self):
        result = recommend_internships(
            'Education: B.Tech Computer Science\nSkills: Python\nProjects: Built a Python API',
            [{
                'id': 'contract',
                'title': 'Python Intern',
                'organization': 'Test Org',
                'department': 'Engineering',
                'description': 'Python internship',
                'eligibility': 'B.Tech Computer Science',
                'skills': ['Python'],
            }],
            profile={
                'skill_profile': ['Python'],
                'course': 'B.Tech Computer Science',
                'experience_years': 0,
                'employability_score': 70,
            },
            ats_result={'ats_score': 80},
        )
        recommendation = result['recommendations'][0]

        for field in ('internship_profile', 'eligibility', 'matching', 'score', 'skill_gap', 'recommendation'):
            self.assertIn(field, recommendation)

    def test_builtin_llm_keeps_deterministic_resume_fallback(self):
        fallback = {'skills': ['Python'], 'projects': [], 'education': []}

        self.assertEqual(extract_resume_evidence('Python', fallback), fallback)


if __name__ == '__main__':
    unittest.main()
