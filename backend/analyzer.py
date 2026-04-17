def analyze_logs(logs):
    incidents = []

    for log in logs:
        text = log["raw"].lower()

        if "error" in text:
            incidents.append({
                "type": "Error",
                "severity": "High",
                "message": log["raw"]
            })

        elif "warning" in text:
            incidents.append({
                "type": "Warning",
                "severity": "Medium",
                "message": log["raw"]
            })

    return {"incidents": incidents}