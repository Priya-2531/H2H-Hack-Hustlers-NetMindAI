from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, time, logging
from backend.config import Config


app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)


# 🔁 fallback AI
def fallback(summary):
    return """Potential threat detected
Possible weak authentication or anomaly
Enable monitoring and apply fixes"""


# 🤖 AI ENGINE
def generate_ai(summary, incidents):
    start = time.time()

    try:
        res = requests.post(
            Config.OLLAMA_URL,
            json={
                "model": Config.MODEL,
                "prompt": f"Analyze: {incidents[:2]} give threat cause fix",
                "stream": False
            },
            timeout=Config.TIMEOUT
        )

        text = res.json().get("response", "").strip()

        if len(text) < 10:
            raise Exception("Invalid AI output")

        return {
            "text": text,
            "source": "ollama",
            "model": Config.MODEL,
            "time": round((time.time() - start) * 1000, 2),
            "confidence": 90,
            "status": "success"
        }

    except Exception as e:
        logging.error(f"AI error: {e}")

        return {
            "text": fallback(summary),
            "source": "fallback",
            "model": "rule-based",
            "time": round((time.time() - start) * 1000, 2),
            "confidence": 60,
            "status": "degraded"
        }


# 🔍 log processing
def process_logs(lines):
    incidents, high, medium = [], 0, 0

    for l in lines:
        l = l.strip()
        if not l:
            continue

        if "error" in l.lower():
            high += 1
            incidents.append({"severity": "High", "message": l})
        elif "warning" in l.lower():
            medium += 1
            incidents.append({"severity": "Medium", "message": l})

    score = min(100, high * 10 + medium * 5)

    summary = {
        "total": len(lines),
        "high": high,
        "medium": medium,
        "risk_level": "HIGH" if score > 60 else "MEDIUM" if score > 30 else "LOW",
        "risk_score": score
    }

    return summary, incidents


# 🌐 API
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        lines = file.read().decode().split("\n")

        summary, incidents = process_logs(lines)
        ai = generate_ai(summary, incidents)

        return jsonify({
            "summary": summary,
            "incidents": incidents,
            "ai": ai
        })

    except Exception as e:
        logging.error(f"Server error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ❤️ Health Check (IMPORTANT)
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)