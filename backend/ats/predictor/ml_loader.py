import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL = joblib.load(os.path.join(BASE_DIR, "ml/ats_model.pkl"))
VECTORIZER = joblib.load(os.path.join(BASE_DIR, "ml/tfidf.pkl"))
