from flask import Blueprint, request, jsonify
from services.email_forensics import parse_email_headers

email_bp = Blueprint('email', __name__)

@email_bp.route('/api/analyze/email', methods=['POST'])
def api_analyze_email():
    data = request.json or {}
    raw_headers = data.get("headers", "")
    if not raw_headers.strip():
        return jsonify({"error": "No raw headers provided"}), 400
    
    try:
        result = parse_email_headers(raw_headers)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Failed to parse email headers: {str(e)}"}), 500
