from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import io
from PyPDF2 import PdfReader

from .ml_loader import MODEL, VECTORIZER
from .skill_extractor import analyze_match, generate_improvement_tips

class PredictATS(APIView):
    def post(self, request):
        resume_url = request.data.get("resumeUrl")
        job_description = request.data.get("jobDescription", "")

        if not resume_url:
            return Response({"error": "resumeUrl is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resp = requests.get(resume_url, timeout=10)
            resp.raise_for_status()
            with io.BytesIO(resp.content) as f:
                reader = PdfReader(f)
                resume_text = ""
                for page in reader.pages:
                    extracted = page.extract_text() or ""
                    resume_text += extracted + "\n"
        except Exception as e:
            return Response({"error": f"Failed to download or read PDF: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        combined_text = (resume_text or "") + " " + (job_description or "")
        vector = VECTORIZER.transform([combined_text])
        ml_prediction = MODEL.predict(vector)[0]

        final_score = float(ml_prediction)
        if final_score <= 1.0:
            final_score *= 100
        final_score = min(max(final_score, 0), 100)

        analysis = analyze_match(resume_text, job_description)
        tips = generate_improvement_tips(analysis['missing_skills'], analysis['skill_match_score'])

        return Response({
            "ats_score": round(final_score, 2),
            "matched_skills": analysis['matched_skills'],
            "missing_skills": analysis['missing_skills'],
            "improvement_tips": tips
        })
