"""NeoGen AI API — runs inside backend/ai (uvicorn server:app --port 8001)."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engines.ats_engine import analyze_ats
from engines.chat_engine import chat_response
from engines.intelligence import build_full_intelligence, chat_with_intelligence
from engines.profile_engine import build_student_profile
from engines.recommendation_engine import recommend_internships
from engines.resume_parser import parse_resume

app = FastAPI(title='NeoGen AI', version='2.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])


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
    memory: dict = Field(default_factory=dict)


class ChatRequest(BaseModel):
    message: str
    context: dict = Field(default_factory=dict)


class MatchRequest(BaseModel):
    resume_text: str
    internship: dict


@app.get('/api/v1/health')
def health():
    return {'status': 'ok', 'service': 'neogen-ai', 'version': '2.0.0'}


@app.post('/api/v1/intelligence')
def full_intelligence(body: RecommendRequest):
    if len(body.resume_text.strip()) < 20 and not body.user_data:
        raise HTTPException(400, 'resume_text or user_data required')
    data = build_full_intelligence(
        body.resume_text,
        body.internships,
        body.user_data,
        body.applications,
        body.memory,
        body.top_k,
    )
    return {'success': True, 'data': data}


@app.post('/api/v1/chat/intelligence')
def chat_intel(body: ChatRequest):
    intel = body.context.get('intelligence') or {}
    if intel:
        return {'success': True, 'data': chat_with_intelligence(body.message, intel)}
    return {'success': True, 'data': chat_response(body.message, body.context)}


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
        body.resume_text, body.internships, body.user_data, body.applications, body.top_k
    )
    return {'success': True, 'data': result}


@app.post('/api/v1/match/internship')
def match_internship(body: MatchRequest):
    job_doc = ' '.join([
        str(body.internship.get('title', '')),
        str(body.internship.get('description', '')),
        ' '.join(body.internship.get('skills', []) or []),
    ])
    return {'success': True, 'data': analyze_ats(body.resume_text, job_doc)}


@app.post('/api/v1/chat')
def chat(body: ChatRequest):
    return {'success': True, 'data': chat_response(body.message, body.context)}


@app.post('/api/v1/pipeline/full')
def full_pipeline(body: RecommendRequest):
    data = build_full_intelligence(
        body.resume_text,
        body.internships,
        body.user_data,
        body.applications,
        body.memory,
        body.top_k,
    )
    return {
        'success': True,
        'data': {
            'ats': data['ats'],
            'profile': data['profile'],
            'recommendations': data['recommendations'],
            'recommendation_groups': data.get('recommendation_groups', {}),
            'student_profile': data['student_profile'],
            'vector_index': data.get('vector_index'),
        },
    }
