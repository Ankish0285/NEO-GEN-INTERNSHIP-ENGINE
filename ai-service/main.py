"""
NeoGen AI Service — FastAPI microservice
Run: uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.ats_engine import analyze_ats
from app.chat_engine import chat_response
from app.profile_engine import build_student_profile
from app.recommendation_engine import recommend_internships
from app.resume_parser import parse_resume

app = FastAPI(
    title='NeoGen AI Service',
    description='ATS intelligence, resume NLP, recommendations, career profiling',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class ATSRequest(BaseModel):
    resume_text: str
    job_description: str = ''


class ProfileRequest(BaseModel):
    resume_text: str = ''
    user_data: dict = Field(default_factory=dict)
    applications: list = Field(default_factory=list)
    interests: list = Field(default_factory=list)


class RecommendRequest(BaseModel):
    resume_text: str
    internships: list = Field(default_factory=list)
    user_data: dict = Field(default_factory=dict)
    applications: list = Field(default_factory=list)
    top_k: int = 12


class ChatRequest(BaseModel):
    message: str
    context: dict = Field(default_factory=dict)


class MatchRequest(BaseModel):
    resume_text: str
    internship: dict


@app.get('/api/v1/health')
def health():
    return {'status': 'ok', 'service': 'neogen-ai', 'version': '1.0.0'}


@app.post('/api/v1/ats/analyze')
def ats_analyze(body: ATSRequest):
    if len(body.resume_text.strip()) < 20:
        raise HTTPException(400, 'resume_text too short')
    return {'success': True, 'data': analyze_ats(body.resume_text, body.job_description)}


@app.post('/api/v1/resume/parse')
def resume_parse(body: ATSRequest):
    return {'success': True, 'data': parse_resume(body.resume_text)}


@app.post('/api/v1/profile/build')
def profile_build(body: ProfileRequest):
    return {
        'success': True,
        'data': build_student_profile(
            body.resume_text, body.user_data, body.applications, body.interests
        ),
    }


@app.post('/api/v1/recommendations')
def recommendations(body: RecommendRequest):
    result = recommend_internships(
        body.resume_text,
        body.internships,
        body.user_data,
        body.applications,
        body.top_k,
    )
    return {'success': True, 'data': result}


@app.post('/api/v1/match/internship')
def match_internship(body: MatchRequest):
    job_doc = ' '.join([
        str(body.internship.get('title', '')),
        str(body.internship.get('description', '')),
        ' '.join(body.internship.get('skills', []) or []),
    ])
    ats = analyze_ats(body.resume_text, job_doc)
    return {'success': True, 'data': ats}


@app.post('/api/v1/chat')
def chat(body: ChatRequest):
    return {'success': True, 'data': chat_response(body.message, body.context)}


@app.post('/api/v1/pipeline/full')
def full_pipeline(body: RecommendRequest):
    """Single call: ATS + profile + recommendations."""
    ats = analyze_ats(body.resume_text, '') if body.resume_text else {}
    profile = build_student_profile(
        body.resume_text, body.user_data, body.applications
    )
    recs = recommend_internships(
        body.resume_text,
        body.internships,
        body.user_data,
        body.applications,
        body.top_k,
    )
    return {
        'success': True,
        'data': {
            'ats': ats,
            'profile': profile,
            'recommendations': recs['recommendations'],
            'student_profile': recs.get('student_profile', profile),
        },
    }
