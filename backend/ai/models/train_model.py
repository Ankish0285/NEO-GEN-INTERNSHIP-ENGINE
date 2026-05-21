import pandas as pd
import joblib
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------
# 1. Load Dataset
# CSV columns: resume_text, job_description, ats_score
# -----------------------------
data = pd.read_csv(os.path.join(BASE_DIR, "ats_dataset.csv"))

# -----------------------------
# 2. Combine text for similarity
# -----------------------------
corpus = data["resume_text"] + " " + data["job_description"]

# -----------------------------
# 3. TF-IDF Vectorizer
# -----------------------------
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=3000
)

X_text = vectorizer.fit_transform(corpus)

# -----------------------------
# 4. Target
# -----------------------------
y = data["ats_score"]

# -----------------------------
# 5. Train/Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_text, y, test_size=0.2, random_state=42
)

# -----------------------------
# 6. Train Model
# -----------------------------
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------
# 7. Evaluate
# -----------------------------
preds = model.predict(X_test)
print("MAE:", mean_absolute_error(y_test, preds))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, os.path.join(BASE_DIR, "ats_model.pkl"))
joblib.dump(vectorizer, os.path.join(BASE_DIR, "tfidf.pkl"))

print("ATS ML Model Saved")
