from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
import logging
import os
import google.generativeai as genai

# -----------------------------
# ⚙️ APP SETUP
# -----------------------------
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

# -----------------------------
# 🔑 GEMINI CONFIG
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# -----------------------------
# 🔁 FALLBACK AI
# -----------------------------
def fallback(summary):
    return """⚠️ Potential security threat detected.
Possible weak authentication or abnormal activity.

Recommendations:
- Enable strong passwords
- Use multi-factor authentication
- Monitor logs continuously
"""

# -----------------------------
# 🤖 GEMINI AI
# -----------------------------
def gemini_ai(summary, incidents):
    start = time.time()

    prompt = f"""
You are a cybersecurity AI system.

Analyze these incidents:
{incidents[:5]}

Give:
1. Threat Type
2. Root Cause
3. Recommended Fix
4. Risk Level

Keep it short and clear.
"""

    model = genai.GenerativeModel("gemini-1.5-flash")

    response = model.generate_content(prompt)

    text = response.text.strip()

    return {
        "text": text,
        "source": "gemini",
        "model": "gemini-1.5-flash",
        "time": round((time.time() - start) * 1000, 2),
        "confidence": 95,
        "status": "success"
    }

# -----------------------------
# 🧠 AI ORCHESTRATOR
# -----------------------------
def generate_ai(summary, incidents):
    start = time.time()

    try:
        if not GEMINI_API_KEY:
            raise Exception("No API key")

        return gemini_ai(summary, incidents)

    except Exception as e:
        logging.error(f"Gemini error: {e}")

        return {
            "text": fallback(summary),
            "source": "fallback",
            "model": "rule-based",
            "time": round((time.time() - start) * 1000, 2),
            "confidence": 60,
            "status": "degraded"
        }

# -----------------------------
# 🔍 LOG PROCESSING
# -----------------------------
def process_logs(lines):
    incidents = []
    high, medium = 0, 0
    attack_types = {}

    for l in lines:
        l = l.strip()
        if not l:
            continue

        severity = None

        if "error" in l.lower():
            severity = "High"
            high += 1
        elif "warning" in l.lower():
            severity = "Medium"
            medium += 1

        if severity:
            incidents.append({
                "severity": severity,
                "message": l
            })

            # Detect attack types (simple logic)
            if "login" in l.lower():
                attack_types["Brute Force"] = attack_types.get("Brute Force", 0) + 1
            elif "database" in l.lower():
                attack_types["Database Failure"] = attack_types.get("Database Failure", 0) + 1
            else:
                attack_types["Resource Issue"] = attack_types.get("Resource Issue", 0) + 1

    score = min(100, high * 10 + medium * 5)

    summary = {
        "total": len(lines),
        "high": high,
        "medium": medium,
        "risk_score": score,
        "risk_level": "HIGH" if score > 60 else "MEDIUM" if score > 30 else "LOW"
    }

    return summary, incidents, attack_types

# -----------------------------
# 🌐 ROUTES
# -----------------------------
@app.route("/")
def home():
    return "🚀 NetMind AI Backend is Running!"

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        lines = file.read().decode().split("\n")

        summary, incidents, attack_types = process_logs(lines)

        ai = generate_ai(summary, incidents)

        return jsonify({
            "summary": summary,
            "incidents": incidents,
            "attack_types": attack_types,
            "ai": ai
        })

    except Exception as e:
        logging.error(f"Server error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# -----------------------------
# 🚀 RUN
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)