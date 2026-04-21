from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
import requests

app = Flask(__name__)
CORS(app)

# ---------------- AI ---------------- #

def generate_ai_summary(summary, anomalies):
    try:
        prompt = f"""
You are a cybersecurity expert.

Respond ONLY in format:
Threat: <line>
Cause: <line>
Fix: <line>

Data:
Total logs: {summary['total']}
High: {summary['high']}
Medium: {summary['medium']}
Anomalies: {len(anomalies)}
"""

        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        data = res.json()

        if "response" in data:
            return data["response"], "ollama"
        elif "message" in data:
            return data["message"]["content"], "ollama"

        return fallback_ai(summary), "fallback"

    except:
        return fallback_ai(summary), "fallback"


def fallback_ai(summary):
    if summary["high"] > 0:
        return "Threat: Critical attacks\nCause: Unauthorized access\nFix: Enable MFA"
    elif summary["medium"] > 0:
        return "Threat: System warnings\nCause: Misconfigurations\nFix: Monitor system"
    else:
        return "Threat: Safe\nCause: No issues\nFix: Continue monitoring"


# ---------------- ML ANOMALY ---------------- #

def detect_anomalies(features):
    model = IsolationForest(contamination=0.2)
    preds = model.fit_predict(features)

    anomalies = [i for i, p in enumerate(preds) if p == -1]
    return anomalies


# ---------------- LOG PROCESS ---------------- #

def process_logs(file):
    content = file.read().decode("utf-8")
    lines = [l for l in content.split("\n") if l.strip()]

    incidents = []
    features = []
    attack_types = {}

    high = 0
    medium = 0

    for line in lines:
        l = line.lower()

        severity = 0
        attack = "Normal"

        # -------- OWASP-style detection -------- #
        if "error" in l:
            severity = 2
            high += 1
        elif "warning" in l:
            severity = 1
            medium += 1

        # 🔥 OWASP PATTERNS
        if "select" in l or "drop" in l or "union" in l:
            attack = "SQL Injection"
        elif "script" in l or "<script>" in l:
            attack = "XSS Attack"
        elif "unauthorized" in l or "failed login" in l:
            attack = "Brute Force"
        elif "csrf" in l:
            attack = "CSRF Attack"
        elif "timeout" in l or "memory" in l:
            attack = "Resource Exhaustion"
        elif "admin" in l and "access denied" in l:
            attack = "Privilege Escalation"

        # -------- Feature vector (ML) -------- #
        features.append([
            severity,
            len(line),
            l.count("error"),
            l.count("fail"),
            l.count("attack")
        ])

        if severity > 0:
            incidents.append({
                "message": line,
                "severity": "High" if severity == 2 else "Medium",
                "type": attack
            })

        attack_types[attack] = attack_types.get(attack, 0) + 1

    import numpy as np
    from sklearn.ensemble import IsolationForest

    features = np.array(features)

    model = IsolationForest(contamination=0.2)
    preds = model.fit_predict(features)

    anomalies_idx = [i for i, p in enumerate(preds) if p == -1]
    anomalies = [lines[i] for i in anomalies_idx]

    # -------- Risk Score -------- #
    risk_score = min(100, high*10 + medium*5 + len(anomalies)*5)

    risk = (
        "HIGH" if risk_score > 60 else
        "MEDIUM" if risk_score > 30 else
        "LOW"
    )

    summary = {
        "total": len(lines),
        "high": high,
        "medium": medium,
        "anomalies": len(anomalies),
        "risk_score": risk_score,
        "risk_level": risk
    }

    ai_summary, source = generate_ai_summary(summary, anomalies)

    return {
        "summary": summary,
        "incidents": incidents,
        "attack_types": attack_types,
        "anomalies": anomalies,
        "ai_summary": ai_summary,
        "ai_source": source
    }

# ---------------- ROUTE ---------------- #

@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files["file"]
    result = process_logs(file)
    return jsonify(result)


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run()