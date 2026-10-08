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


# ---------------------------------------------------------------------------
# Feature #14 — AI Truth Guard
# ---------------------------------------------------------------------------

import re as _re


def check_truth_guard(application_text: str, profile_data: dict) -> list[dict]:
    """Scan application text for claims that cannot be supported by the student's profile.

    Checks performed (all deterministic / regex-based, no LLM):
    1. Year-of-experience claims — flagged when profile has no experience entries.
    2. Company name mentions — flagged when the company is not listed in the
       profile's experience entries.
    3. Certification / certificate claims — flagged when the certificate name is
       not found in the profile's certificates list.
    4. Project title mentions — flagged when the project is not found in the
       profile's projects list.

    Args:
        application_text: The cover letter / application essay text.
        profile_data: Dict that may contain any of:
            - experience: list of dicts with optional 'company' / 'organization' keys
            - certificates / certifications: list of dicts with optional 'name' / 'title' keys,
              or list of strings
            - projects: list of dicts with optional 'title' / 'name' keys, or list of strings
            - skills: list of strings

    Returns:
        List of ``{claim, issue, severity}`` dicts for unsupported claims.
        Returns an empty list when no issues are found.
    """
    issues: list[dict] = []

    text = application_text or ""

    # ------------------------------------------------------------------
    # Helper: extract lowercase string set from a list that may contain
    # dicts or plain strings.
    # ------------------------------------------------------------------
    def _extract_names(items: list, *keys: str) -> set[str]:
        names: set[str] = set()
        for item in (items or []):
            if isinstance(item, str):
                names.add(item.strip().lower())
            elif isinstance(item, dict):
                for k in keys:
                    val = item.get(k) or ""
                    if val:
                        names.add(str(val).strip().lower())
        return names

    # ------------------------------------------------------------------
    # 1. Year-of-experience claims
    # ------------------------------------------------------------------
    experience_list = profile_data.get("experience") or []
    year_pattern = _re.compile(
        r'\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:experience|work|industry)',
        _re.IGNORECASE,
    )
    for m in year_pattern.finditer(text):
        claimed_years = float(m.group(1))
        claim_text = m.group(0)
        if len(experience_list) == 0:
            issues.append({
                "claim": claim_text,
                "issue": f"Claims {claimed_years} year(s) of experience but no experience entries found in profile.",
                "severity": "high",
            })
        elif claimed_years > len(experience_list) * 1.5:
            issues.append({
                "claim": claim_text,
                "issue": (
                    f"Claims {claimed_years} year(s) of experience but profile only lists "
                    f"{len(experience_list)} experience entr{'y' if len(experience_list) == 1 else 'ies'}."
                ),
                "severity": "medium",
            })

    # ------------------------------------------------------------------
    # 2. Company name mentions not found in profile experience
    # ------------------------------------------------------------------
    profile_companies = _extract_names(experience_list, "company", "organization", "employer")
    # Extract quoted company-like nouns (Title Case sequences of 1-4 words) after
    # "at", "with", "for", "worked at", "interned at" etc.
    company_pattern = _re.compile(
        r'\b(?:at|with|for|worked\s+at|interned\s+at|joined)\s+([A-Z][A-Za-z0-9&.,\s]{1,50}?)(?=[,.\s]|$)',
    )
    for m in company_pattern.finditer(text):
        candidate = m.group(1).strip().rstrip(".,")
        if len(candidate) < 3:
            continue
        candidate_lower = candidate.lower()
        # Skip generic words
        generic = {"the", "a", "an", "our", "my", "their", "this", "that", "team", "company", "organization"}
        if candidate_lower in generic:
            continue
        # Check if any profile company name partially matches
        matched = any(
            candidate_lower in company or company in candidate_lower
            for company in profile_companies
        )
        if not matched and profile_companies:
            issues.append({
                "claim": f"Mentions '{candidate}'",
                "issue": f"Company '{candidate}' not found in profile experience entries.",
                "severity": "medium",
            })

    # ------------------------------------------------------------------
    # 3. Certification / certificate claims
    # ------------------------------------------------------------------
    profile_certs = _extract_names(
        profile_data.get("certificates") or profile_data.get("certifications") or [],
        "name", "title", "certification",
    )
    cert_pattern = _re.compile(
        r'\b(?:certified\s+(?:in\s+)?|certification\s+in\s+|certificate\s+in\s+)'
        r'([A-Za-z0-9\s+#./]{2,60}?)(?=[,.\s]|$)',
        _re.IGNORECASE,
    )
    for m in cert_pattern.finditer(text):
        cert_claim = m.group(1).strip().rstrip(".,")
        if len(cert_claim) < 3:
            continue
        cert_lower = cert_claim.lower()
        matched = any(cert_lower in c or c in cert_lower for c in profile_certs)
        if not matched:
            severity = "high" if not profile_certs else "medium"
            issues.append({
                "claim": f"Certified in '{cert_claim}'",
                "issue": (
                    "Certificate claim not found in profile."
                    if not profile_certs
                    else f"'{cert_claim}' not found among profile certificates."
                ),
                "severity": severity,
            })

    # ------------------------------------------------------------------
    # 4. Project title mentions
    # ------------------------------------------------------------------
    profile_projects = _extract_names(
        profile_data.get("projects") or [],
        "title", "name",
    )
    # Look for project mentions: "project called X", "built X", "developed X", "created X"
    project_pattern = _re.compile(
        r'\b(?:project(?:\s+(?:called|titled|named|on))?\s+["\']?|'
        r'built|developed|created|designed)\s+([A-Za-z0-9\-_\s]{3,60}?)(?=[,.()\n]|$)',
        _re.IGNORECASE,
    )
    for m in project_pattern.finditer(text):
        proj_claim = m.group(1).strip().rstrip(".,")
        if len(proj_claim) < 4:
            continue
        proj_lower = proj_claim.lower()
        # Skip overly generic phrases
        generic_proj = {
            "a web", "an app", "the app", "a mobile", "a system",
            "a platform", "the platform", "software", "the software",
        }
        if any(proj_lower.startswith(g) for g in generic_proj):
            continue
        if profile_projects:
            matched = any(proj_lower in p or p in proj_lower for p in profile_projects)
            if not matched:
                issues.append({
                    "claim": f"Project '{proj_claim}'",
                    "issue": f"Project '{proj_claim}' not listed in profile projects.",
                    "severity": "low",
                })

    return issues


# ---------------------------------------------------------------------------
# Feature #15 — Application Consistency Checker
# ---------------------------------------------------------------------------


def check_application_consistency(resume_data: dict, application_text: str) -> list[dict]:
    """Compare an application essay against resume data for consistency.

    Checks:
    1. Years of experience mentioned in application vs number of experience entries.
    2. Project names mentioned in application vs resume projects list.
    3. Skill claims in application vs resume skills list.

    Args:
        resume_data: Dict that may contain:
            - experience: list of experience dicts
            - projects: list of project dicts/strings
            - skills: list of skill strings
        application_text: The application / cover-letter text.

    Returns:
        List of ``{field, resumeValue, applicationClaim, warning}`` dicts.
        Returns an empty list if no inconsistencies are found.
    """
    issues: list[dict] = []
    text = application_text or ""

    # Reuse the helper from check_truth_guard
    def _extract_names(items: list, *keys: str) -> set[str]:
        names: set[str] = set()
        for item in (items or []):
            if isinstance(item, str):
                names.add(item.strip().lower())
            elif isinstance(item, dict):
                for k in keys:
                    val = item.get(k) or ""
                    if val:
                        names.add(str(val).strip().lower())
        return names

    # ------------------------------------------------------------------
    # 1. Years of experience
    # ------------------------------------------------------------------
    experience_list = resume_data.get("experience") or []
    year_pattern = _re.compile(
        r'\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:experience|work|industry)',
        _re.IGNORECASE,
    )
    for m in year_pattern.finditer(text):
        claimed_years = float(m.group(1))
        resume_entry_count = len(experience_list)
        if resume_entry_count == 0:
            issues.append({
                "field": "experience",
                "resumeValue": "0 experience entries on resume",
                "applicationClaim": m.group(0),
                "warning": (
                    f"Application claims {claimed_years} year(s) of experience "
                    "but resume has no experience entries."
                ),
            })
        elif claimed_years > resume_entry_count * 2:
            issues.append({
                "field": "experience",
                "resumeValue": f"{resume_entry_count} experience entr{'y' if resume_entry_count == 1 else 'ies'} on resume",
                "applicationClaim": m.group(0),
                "warning": (
                    f"Application claims {claimed_years} year(s) of experience "
                    f"but resume lists only {resume_entry_count} position(s)."
                ),
            })

    # ------------------------------------------------------------------
    # 2. Project names
    # ------------------------------------------------------------------
    resume_projects = _extract_names(
        resume_data.get("projects") or [],
        "title", "name",
    )
    project_pattern = _re.compile(
        r'\b(?:project(?:\s+(?:called|titled|named|on))?\s+["\']?|'
        r'built|developed|created|designed)\s+([A-Za-z0-9\-_\s]{3,60}?)(?=[,.()\n]|$)',
        _re.IGNORECASE,
    )
    for m in project_pattern.finditer(text):
        proj_claim = m.group(1).strip().rstrip(".,")
        if len(proj_claim) < 4:
            continue
        proj_lower = proj_claim.lower()
        generic_proj = {
            "a web", "an app", "the app", "a mobile", "a system",
            "a platform", "the platform", "software", "the software",
        }
        if any(proj_lower.startswith(g) for g in generic_proj):
            continue
        if resume_projects:
            matched = any(proj_lower in p or p in proj_lower for p in resume_projects)
            if not matched:
                issues.append({
                    "field": "projects",
                    "resumeValue": ", ".join(sorted(resume_projects)) or "No projects on resume",
                    "applicationClaim": proj_claim,
                    "warning": (
                        f"Application mentions project '{proj_claim}' "
                        "which is not listed in resume projects."
                    ),
                })

    # ------------------------------------------------------------------
    # 3. Skill claims
    # ------------------------------------------------------------------
    resume_skills = _extract_names(resume_data.get("skills") or [], "name")
    # Match patterns like "proficient in X", "skilled in X", "expertise in X",
    # "experience with X", "knowledge of X"
    skill_claim_pattern = _re.compile(
        r'\b(?:proficient\s+in|skilled\s+in|expertise\s+in|'
        r'experience\s+with|knowledge\s+of|expert\s+in)\s+'
        r'([A-Za-z0-9#+.\-/\s]{2,50}?)(?=[,.\s()\n]|$)',
        _re.IGNORECASE,
    )
    for m in skill_claim_pattern.finditer(text):
        skill_claim = m.group(1).strip().rstrip(".,")
        if len(skill_claim) < 2:
            continue
        skill_lower = skill_claim.lower()
        if resume_skills:
            matched = any(skill_lower in s or s in skill_lower for s in resume_skills)
            if not matched:
                issues.append({
                    "field": "skills",
                    "resumeValue": f"{len(resume_skills)} skill(s) listed on resume",
                    "applicationClaim": skill_claim,
                    "warning": (
                        f"Application claims skill '{skill_claim}' "
                        "which is not listed in resume skills."
                    ),
                })

    return issues
