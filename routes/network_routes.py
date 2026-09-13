from flask import Blueprint, request, jsonify
from services.network_forensics import (
    parse_network_log,
    analyze_network_logs,
    calculate_risk_level,
    generate_forensic_summary,
    generate_sample_network_log
)

network_bp = Blueprint('network', __name__)

@network_bp.route('/api/analyze/network', methods=['POST'])
def api_analyze_network():
    """
    API endpoint for network log analysis.
    Accepts file upload or raw log text.
    """
    try:
        log_content = ""
        
        # Check if file was uploaded
        if 'logfile' in request.files:
            file = request.files['logfile']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
            if ext not in ['csv', 'txt', 'log']:
                return jsonify({"error": "Unsupported file format. Please upload CSV, TXT, or LOG files."}), 400
            
            try:
                log_content = file.read().decode('utf-8', errors='ignore')
            except Exception as e:
                return jsonify({"error": f"Failed to read file: {str(e)}"}), 400
        
        # Check if raw text was provided
        elif request.is_json:
            data = request.json or {}
            log_content = data.get("logtext", "")
            if data.get("sample") == "demo":
                log_content = generate_sample_network_log()
        
        if not log_content.strip():
            return jsonify({"error": "No log data provided"}), 400
        
        # Parse logs
        events = parse_network_log(log_content)
        if not events:
            return jsonify({"error": "No valid log events found. Please check your log format."}), 400
        
        # Analyze logs
        analysis = analyze_network_logs(events)
        risk_assessment = calculate_risk_level(analysis)
        summary = generate_forensic_summary(analysis, risk_assessment)
        
        return jsonify({
            "success": True,
            "analysis": analysis,
            "risk_assessment": risk_assessment,
            "summary": summary
        })
    
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
