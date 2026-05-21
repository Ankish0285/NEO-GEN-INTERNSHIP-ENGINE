# NeoGen AI (inside backend)

All AI/ML code lives here — no separate `ai-service` folder.

## Setup (once)

```powershell
cd backend\ai
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Train ML model (optional)

```powershell
python models\train_model.py
```

## How it runs

When you `npm start` in **backend**, Node auto-starts the AI server on port **8001**.
If that fails, Node calls `cli.py` directly (slower but works).

## API v2 (Node proxies via `/api/ai/*`)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/ai/intelligence` | Full pipeline: ATS + profile + recommendations + groups |
| `POST /api/ai/analyze` | Advanced ATS + auto pipeline |
| `GET /api/ai/recommendations` | Ranked internships with selection probability |
| `POST /api/ai/chat` | Career coach (ATS + recs + profile context) |
| `GET /api/ai/admin/insights` | Admin AI analytics |

## Structure

```
backend/ai/
  engines/     # ATS, advanced resume, vector search, recommendations, profile, selection, intelligence
  llm/         # Modular LLM adapter (builtin / OpenAI via LLM_PROVIDER=openai)
  models/      # ats_model.pkl, tfidf.pkl, train script
  server.py    # FastAPI :8001
  cli.py       # Node subprocess fallback
  requirements.txt
```

## Optional: stronger semantic search

```powershell
pip install sentence-transformers faiss-cpu
```

Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` for GPT-powered chat.
