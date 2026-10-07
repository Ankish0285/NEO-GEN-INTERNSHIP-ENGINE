"""
Career Intelligence Engine — deterministic, pure-Python helpers for skill gap
analysis, career readiness scoring, and learning recommendations.

No LLM calls or external HTTP requests.
"""

from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def compute_skill_gap(
    skill_profile: list[str],
    learning_roadmap: list[dict[str, Any]],
    career_domain: dict[str, Any],
) -> dict[str, Any]:
    """Compute which roadmap skills are already covered and which are gaps.

    Args:
        skill_profile: List of skills the student currently has.
        learning_roadmap: List of dicts with at least a 'skill' key representing
            desired/recommended skills.
        career_domain: Dict with optional 'domain' and 'label' keys.

    Returns:
        A dict containing:
          - skill_gaps: skills in the roadmap not yet in the profile
          - covered_skills: skills in the roadmap already in the profile
          - coverage_pct: percentage of roadmap already covered (0-100)
          - domain: the career domain label (if provided)
    """
    profile_lower: set[str] = {s.strip().lower() for s in (skill_profile or []) if s}
    roadmap_skills: list[str] = [
        item.get("skill", "").strip()
        for item in (learning_roadmap or [])
        if item.get("skill")
    ]

    covered: list[str] = []
    gaps: list[str] = []
    for skill in roadmap_skills:
        if skill.lower() in profile_lower:
            covered.append(skill)
        else:
            gaps.append(skill)

    total = len(roadmap_skills)
    coverage_pct = round((len(covered) / total) * 100) if total > 0 else 0

    return {
        "skill_gaps": gaps,
        "covered_skills": covered,
        "coverage_pct": coverage_pct,
        "total_roadmap_skills": total,
        "domain": career_domain.get("label") or career_domain.get("domain") or "Unknown",
    }


def compute_career_readiness(
    profile: dict[str, Any],
    placements: list[dict[str, Any]],
    assessments: list[dict[str, Any]],
) -> dict[str, Any]:
    """Combine profile signals into a 0-100 readiness score.

    Args:
        profile: AIStudentProfile-like dict with optional keys:
            employabilityScore, internshipReadinessScore, latestAtsScore,
            aiConfidenceScore.
        placements: List of placement record dicts (each verified placement adds weight).
        assessments: List of skill assessment dicts with optional 'score' (0-100).

    Returns:
        A dict with:
          - readiness_score: int 0-100
          - level: 'beginner' | 'developing' | 'ready' | 'advanced'
          - breakdown: dict of component scores
    """
    # Component 1: employability from AI profile (0-100)
    employability = min(float(profile.get("employabilityScore") or 0), 100)

    # Component 2: internship readiness from AI profile (0-100)
    internship_ready = min(float(profile.get("internshipReadinessScore") or 0), 100)

    # Component 3: ATS score (0-100)
    ats = min(float(profile.get("latestAtsScore") or 0), 100)

    # Component 4: average skill assessment score (0-100)
    valid_scores = [
        min(float(a.get("score") or 0), 100)
        for a in (assessments or [])
        if a.get("score") is not None
    ]
    avg_assessment = (sum(valid_scores) / len(valid_scores)) if valid_scores else 0

    # Component 5: placement bonus — each verified placement adds 5 pts, capped at 20
    verified = sum(1 for p in (placements or []) if p.get("isVerified"))
    placement_bonus = min(verified * 5, 20)

    # Weighted average (weights sum to 1)
    score = (
        employability * 0.30
        + internship_ready * 0.25
        + ats * 0.20
        + avg_assessment * 0.15
        + placement_bonus * 0.10 * (100 / 20)  # normalise 20 → 100
    )
    readiness_score = min(round(score), 100)

    if readiness_score < 30:
        level = "beginner"
    elif readiness_score < 55:
        level = "developing"
    elif readiness_score < 80:
        level = "ready"
    else:
        level = "advanced"

    return {
        "readiness_score": readiness_score,
        "level": level,
        "breakdown": {
            "employability": round(employability),
            "internship_readiness": round(internship_ready),
            "ats_score": round(ats),
            "avg_assessment_score": round(avg_assessment),
            "placement_bonus": placement_bonus,
        },
    }


def generate_learning_recommendations(
    skill_gaps: list[str],
    completed_guide_ids: list[str],
    guides: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return up to 5 guide recommendations that match the skill gaps.

    Guides already completed are excluded.  Matching is case-insensitive
    substring search on guide title against each skill gap term.

    Args:
        skill_gaps: List of skill names to address.
        completed_guide_ids: List of guide id strings already completed by the user.
        guides: List of guide dicts with at least '_id' (str), 'title' (str),
            and optional 'category' (str).

    Returns:
        List of up to 5 dicts, each with:
          - guide_id: str
          - title: str
          - category: str
          - matched_gap: str (the gap that triggered the match)
          - priority: int (1 = highest)
    """
    completed_set: set[str] = {str(gid) for gid in (completed_guide_ids or [])}
    recommendations: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for priority, gap in enumerate(skill_gaps or [], start=1):
        if len(recommendations) >= 5:
            break
        gap_lower = gap.strip().lower()
        if not gap_lower:
            continue
        for guide in (guides or []):
            gid = str(guide.get("_id") or "")
            title = guide.get("title") or ""
            if gid in completed_set or gid in seen_ids:
                continue
            if gap_lower in title.lower():
                recommendations.append(
                    {
                        "guide_id": gid,
                        "title": title,
                        "category": guide.get("category") or "",
                        "matched_gap": gap,
                        "priority": priority,
                    }
                )
                seen_ids.add(gid)
                if len(recommendations) >= 5:
                    break

    recommendations.sort(key=lambda r: r["priority"])
    return recommendations
