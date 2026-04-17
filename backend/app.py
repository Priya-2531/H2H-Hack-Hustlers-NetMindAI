from flask import Flask, request, jsonify
from analyzer import analyze_logs
from parser import parse_logs
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    
    logs = file.read().decode('utf-8').splitlines()

    parsed_logs = parse_logs(logs)
    results = analyze_logs(parsed_logs)

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)