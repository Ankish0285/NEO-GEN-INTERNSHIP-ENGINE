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

## Structure

```
backend/ai/
  engines/     # NLP, ATS, recommendations, chat
  models/      # ats_model.pkl, tfidf.pkl, train script
  server.py    # FastAPI (internal)
  cli.py       # Called from Node if HTTP unavailable
  requirements.txt
```
