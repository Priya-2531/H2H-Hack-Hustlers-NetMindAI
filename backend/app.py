from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)


# 🤖 AI (Ollama + fallback)
import requests

def generate_ai_summary(summary, incidents):
    try:
        print("🚀 Calling Ollama...")

        prompt = f"""
Analyze cybersecurity logs:
Total: {summary['total']}
High: {summary['high']}
Medium: {summary['medium']}
Incidents: {incidents}

Give:
1. Threat
2. Cause
3. Fix
"""

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        result = response.json()

        return result["response"], "ollama"

    except Exception as e:
        print("❌ Ollama failed:", e)
        return fallback_ai(summary), "fallback"


# 🔁 Fallback AI (VERY IMPORTANT)
def fallback_ai(summary, incidents):

    if summary["high"] > 0:
        return """Brute force or critical attack detected
Weak passwords or unauthorized access
Enable MFA and monitor login attempts"""

    elif summary["medium"] > 0:
        return """System warnings detected
Possible resource or config issues
Monitor system and fix warnings"""

    else:
        return """System stable
No major threats detected
Continue monitoring logs"""


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
        elif "database" in l:
            type_ = "Database Failure"

        if severity != "Info":
            incidents.append({
                "type": type_,
                "severity": severity,
                "message": line
            })

            attack_types[type_] = attack_types.get(type_, 0) + 1

    # Risk score
    risk_score = min(100, high * 10 + medium * 5)

    if risk_score > 60:
        risk = "HIGH"
    elif risk_score > 30:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    summary = {
        "total": len(lines),
        "high": high,
        "medium": medium,
        "risk_level": risk,
        "risk_score": risk_score
    }

    ai_summary , source= generate_ai_summary(summary, incidents)

    return {
        "incidents": incidents,
        "attack_types": attack_types,
        "summary": summary,
        "ai_summary": ai_summary,
        "ai_source" : source
    }


@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files["file"]
    result = process_logs(file)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=False)