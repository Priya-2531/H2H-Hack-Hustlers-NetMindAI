from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

# 🔹 Gemini

app = Flask(__name__)
CORS(app)


# 🤖 Gemini AI Summary


import requests

import requests

def generate_ai_summary(summary, incidents):
    try:
        API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-small"

        prompt = f"""
Analyze cybersecurity logs:
Total: {summary['total']}
High: {summary['high']}
Medium: {summary['medium']}

Incidents:
{incidents}

Give threats, causes and solutions.
"""

        response = requests.post(API_URL, json={"inputs": prompt})

        result = response.json()

        print("HF RESPONSE:", result)  # 🔍 debug

        # ✅ Case 1: Normal response
        if isinstance(result, list) and "generated_text" in result[0]:
            return result[0]["generated_text"]

        # ❌ Case 2: Model loading
        if isinstance(result, dict) and "error" in result:
            return "⚠️ AI model loading... using fallback."

        return fallback(summary)

    except Exception as e:
        print("HF ERROR:", e)
        return fallback(summary)

#FALLBACK SUMMARY
def fallback(summary):
    if summary["high"] > 3:
        return "🚨 High risk detected. Possible cyber attacks."
    elif summary["medium"] > 2:
        return "⚠️ Medium risk. Monitor system."
    else:
        return "✅ System stable."




# 🔍 Log Processing
def process_logs(file):
    content = file.read().decode("utf-8")
    lines = content.split("\n")

    incidents = []
    high = 0
    medium = 0
    attack_types = {}

    for line in lines:
        if not line.strip():
            continue

        l = line.lower()

        severity = "Info"
        type_ = "Normal"

        if "error" in l:
            severity = "High"
            high += 1
        elif "warning" in l:
            severity = "Medium"
            medium += 1

        if "login" in l:
            type_ = "Brute Force"
        elif "sql" in l:
            type_ = "SQL Injection"
        elif "disk" in l:
            type_ = "Resource Issue"

        if severity != "Info":
            incidents.append({
                "type": type_,
                "severity": severity,
                "message": line
            })
            attack_types[type_] = attack_types.get(type_, 0) + 1

    risk_score = high * 3 + medium

    if risk_score > 10:
        risk = "HIGH"
    elif risk_score > 5:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    summary = {
        "total": len([l for l in lines if l.strip()]),
        "high": high,
        "medium": medium,
        "risk_level": risk
    }

    ai_summary = str(generate_ai_summary(summary, incidents))

    return ({
        "incidents": incidents,
        "attack_types": attack_types,
        "summary": summary,
        "ai_summary": ai_summary
    })


# 🌐 API
@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files["file"]
    result = process_logs(file)
    return (result)


if __name__ == "__main__":
    app.run(debug=True)