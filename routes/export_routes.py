import json
import csv
from datetime import datetime
from io import BytesIO, StringIO
from flask import Blueprint, request, jsonify, send_file
from services.export_service import flatten_data_for_csv, SAMPLE_EXPORT_DATA

export_bp = Blueprint('export', __name__)

@export_bp.route('/api/export/json', methods=['POST'])
def api_export_json():
    """Export analysis data as downloadable JSON format."""
    try:
        request_data = request.json or {}
        analysis_data = request_data.get('data', {})
        
        if not analysis_data:
            return jsonify({"error": "No analysis data provided"}), 400
        
        export_data = {
            "metadata": {
                "case_id": request_data.get('caseId', 'CF-2026-001'),
                "analysis_type": request_data.get('analysisType', 'Unknown'),
                "analyst": request_data.get('analyst', 'Cyber Forensics Unit'),
                "timestamp": datetime.now().isoformat(),
                "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "data": analysis_data
        }
        
        output = BytesIO()
        output.write(json.dumps(export_data, indent=2).encode('utf-8'))
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/json',
            as_attachment=True,
            download_name=f"{request_data.get('analysisType', 'analysis')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
    
    except Exception as e:
        return jsonify({"error": f"JSON export failed: {str(e)}"}), 500

@export_bp.route('/api/export/csv', methods=['POST'])
def api_export_csv():
    """Export analysis data as downloadable CSV format."""
    try:
        request_data = request.json or {}
        analysis_data = request_data.get('data', {})
        
        if not analysis_data:
            return jsonify({"error": "No analysis data provided"}), 400
        
        flat_data = flatten_data_for_csv(analysis_data)
        
        output = BytesIO()
        text_wrapper = StringIO()
        
        if flat_data:
            fieldnames = list(flat_data[0].keys()) if isinstance(flat_data, list) else list(flat_data.keys())
            
            text_wrapper.write(f"# Case ID: {request_data.get('caseId', 'CF-2026-001')}\n")
            text_wrapper.write(f"# Analysis Type: {request_data.get('analysisType', 'Unknown')}\n")
            text_wrapper.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            if isinstance(flat_data, list):
                writer = csv.DictWriter(text_wrapper, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flat_data)
            else:
                writer = csv.DictWriter(text_wrapper, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerow(flat_data)
            
            output.write(text_wrapper.getvalue().encode('utf-8'))
            output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f"{request_data.get('analysisType', 'analysis')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        )
    
    except Exception as e:
        return jsonify({"error": f"CSV export failed: {str(e)}"}), 500

@export_bp.route('/api/export/pdf', methods=['POST'])
def api_export_pdf():
    """Initiate PDF report generation metadata for client-side processing."""
    try:
        request_data = request.json or {}
        analysis_type = request_data.get('analysisType', 'Unknown')
        analysis_data = request_data.get('data', {})
        
        if not analysis_data:
            return jsonify({"error": "No analysis data provided"}), 400
        
        return jsonify({
            "success": True,
            "message": "PDF generation initiated on client-side",
            "metadata": {
                "case_id": request_data.get('caseId', 'CF-2026-001'),
                "analysis_type": analysis_type,
                "timestamp": datetime.now().isoformat()
            }
        })
    
    except Exception as e:
        return jsonify({"error": f"PDF export failed: {str(e)}"}), 500

@export_bp.route('/api/export/sample-data', methods=['GET'])
def api_get_sample_export_data():
    """Get sample data for testing export functionality."""
    try:
        export_type = request.args.get('type', 'email')
        return jsonify(SAMPLE_EXPORT_DATA.get(export_type, SAMPLE_EXPORT_DATA['email']))
    except Exception as e:
        return jsonify({"error": f"Failed to get sample data: {str(e)}"}), 500
