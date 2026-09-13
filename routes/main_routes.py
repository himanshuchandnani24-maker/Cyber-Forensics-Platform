from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

DASHBOARD_STATS = {
    "total_investigations": 42,
    "active_threats": 5,
    "evidence_analyzed": "1,337 GB",
    "threat_level": "High"
}

RECENT_CASES = [
    {"id": "CF-2026-081", "case_name": "Phishing Attack on HR Dept", "type": "Email", "status": "Available", "date": "2026-06-24"},
    {"id": "CF-2026-079", "case_name": "Steganographic Data Leak", "type": "Image", "status": "Available", "date": "2026-06-23"},
    {"id": "CF-2026-075", "case_name": "Unauthorized Database Access", "type": "Network", "status": "Available", "date": "2026-06-20"},
]

@main_bp.route('/')
def home():
    return render_template('index.html', stats=DASHBOARD_STATS, recent_cases=RECENT_CASES)

@main_bp.route('/demo1')
def demo1():
    return render_template('demo1.html')

@main_bp.route('/demo2')
def demo2():
    return render_template('demo2.html')

@main_bp.route('/demo3')
def demo3():
    return render_template('demo3.html')

@main_bp.route('/about')
def about():
    return render_template('about.html')
