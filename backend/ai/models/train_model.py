import pandas as pd
import joblib
import numpy as np
import os

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------
# 1. Load Dataset
# -----------------------------
data = pd.read_csv(os.path.join(BASE_DIR, "ats_dataset.csv"))
print(f"Loaded {len(data)} training examples!")

# -----------------------------
# 2. Combine text for similarity
# -----------------------------
corpus = data["resume_text"] + " " + data["job_description"]

# -----------------------------
# 3. TF-IDF Vectorizer
# -----------------------------
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=3000,
    ngram_range=(1, 2)
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
    X_text, y, test_size=0.2, random_state=42)

# -----------------------------
# 6. Train Model - Random Forest
# -----------------------------
print("Training AI model...")
model = RandomForestRegressor(
    n_estimators=300,
    max_depth=15,
    random_state=42
)
model.fit(X_train, y_train)

# -----------------------------
# 7. Evaluate
# -----------------------------
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
mse = mean_squared_error(y_test, preds)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, preds)

print("="*50)
print("MODEL EVALUATION")
print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R2 Score: {r2:.4f}")
print("="*50)

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, os.path.join(BASE_DIR, "ats_model.pkl"))
joblib.dump(vectorizer, os.path.join(BASE_DIR, "tfidf.pkl"))

print("")
print("ATS AI Model Trained and Saved Successfully!")
