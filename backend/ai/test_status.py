"""Run: python test_status.py (from backend/ai with venv active)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

SAMPLE = "Python React Node.js MongoDB B.Tech intern AWS Git projects"
JD = "React Node MongoDB internship software"

def main():
    from engines.ats_engine import analyze_ats
    r = analyze_ats(SAMPLE, JD)
    print(json.dumps({"summary": "OK", "ats_score": r.get("ats_score")}, indent=2))

if __name__ == "__main__":
    main()
