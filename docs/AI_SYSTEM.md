# NeoGen AI Intelligence System

## Architecture

```
React Frontend  →  Node.js/Express (API + Socket.io)  →  Python FastAPI (AI Service)
                              ↓
                         MongoDB
```

## Services

| Service | Port | Role |
|---------|------|------|
| Frontend (Vite) | 3000 | AI dashboards, chat, charts |
| Backend (Express) | 5000 | Auth, data, orchestration, WebSockets |
| AI Service (FastAPI) | 8001 | NLP, ATS, recommendations, profiling |

## Start (development)

```powershell
# Terminal 1 — AI
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 — Backend
cd backend
# Add to .env: AI_SERVICE_URL=http://localhost:8001
npm start

# Terminal 3 — Frontend
cd frontend
npm run dev
```

## API (Node `/api/ai`)

- `GET /status` — AI service health
- `GET /profile` — Stored AI student profile
- `POST /analyze` — Re-run ATS + profile pipeline
- `GET /recommendations` — Ranked internships
- `POST /match/:internshipId` — Single job match
- `POST /chat` — Career assistant
- `GET /admin/insights` — Admin analytics

## ML stack

- **NLP**: spaCy-ready skill ontology + section parsing
- **Embeddings**: TF-IDF (default) or Sentence Transformers (`USE_SENTENCE_TRANSFORMERS=1`)
- **ATS**: Hybrid RandomForest (if `ats_model.pkl` exists) + semantic + keyword + section scores
- **Recommendations**: Content-based + vector similarity + weighted ranking

## Optional upgrades

```bash
pip install sentence-transformers faiss-cpu xgboost lightgbm spacy
python -m spacy download en_core_web_sm
```
