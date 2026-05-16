import sys
import json
import requests
import io
import traceback
from PyPDF2 import PdfReader

# Import local modules
# Ensure we can import from current directory
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ml_loader import MODEL, VECTORIZER
    from skill_extractor import analyze_match, generate_improvement_tips
except ImportError as e:
    # If run from backend root, paths might need adjustment or sys.path fix above handles it
    sys.stderr.write(f"Error importing modules: {str(e)}\n")
    sys.exit(1)

def extract_text_from_pdf_url(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        with io.BytesIO(response.content) as f:
            reader = PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        sys.stderr.write(f"Error downloading/reading PDF: {str(e)}\n")
        return ""

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python predict.py <resume_url> <job_description>"}))
        sys.exit(1)

    resume_url = sys.argv[1]
    job_description = sys.argv[2]

    # 1. Extract Text
    resume_text = extract_text_from_pdf_url(resume_url)
    if not resume_text:
        print(json.dumps({"error": "Failed to extract text from resume URL"}))
        sys.exit(1)

    try:
        # 2. ML Prediction
        combined_text = resume_text + " " + job_description
        vector = VECTORIZER.transform([combined_text])
        ml_prediction = MODEL.predict(vector)[0]
        
        # Normalize score
        final_score = float(ml_prediction)
        if final_score <= 1.0: 
             final_score *= 100
        final_score = min(max(final_score, 0), 100)

        # 3. Rule-based Analysis
        analysis = analyze_match(resume_text, job_description)
        
        # 4. Generate Tips
        tips = generate_improvement_tips(analysis['missing_skills'], analysis['skill_match_score'])

        # 5. Output JSON
        result = {
            "ats_score": round(final_score, 2),
            "matched_skills": analysis['matched_skills'],
            "missing_skills": analysis['missing_skills'],
            "improvement_tips": tips,
            "resume_text_length": len(resume_text)
        }
        
        print(json.dumps(result))

    except Exception as e:
        sys.stderr.write(traceback.format_exc())
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
