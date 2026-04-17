def parse_logs(log_lines):
    parsed = []

    for line in log_lines:
        parsed.append({
            "raw": line
        })

    return parsed