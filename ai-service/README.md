# NeoGen AI Service

FastAPI microservice for ATS scoring, resume NLP, student profiling, and internship recommendations.

## Setup

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Set in `backend/.env`:

```
AI_SERVICE_URL=http://localhost:8001
```

## Optional enhancements

```bash
pip install sentence-transformers
set USE_SENTENCE_TRANSFORMERS=1
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/ats/analyze` | Full ATS analysis |
| POST | `/api/v1/resume/parse` | Resume NLP extraction |
| POST | `/api/v1/profile/build` | AI student profile |
| POST | `/api/v1/recommendations` | Rank internships |
| POST | `/api/v1/match/internship` | Match one job |
| POST | `/api/v1/chat` | Career assistant |
| POST | `/api/v1/pipeline/full` | Combined pipeline |
