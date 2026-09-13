import re
import csv
from io import StringIO

def parse_network_log(log_content):
    """Parse network log data from CSV, TXT, or unstructured log format."""
    events = []
    lines = log_content.strip().split('\n')
    
    if not lines:
        return events
    
    try:
        csv_file = StringIO(log_content)
        reader = csv.DictReader(csv_file)
        if reader.fieldnames:
            expected_headers = ['timestamp', 'source_ip', 'destination_ip', 'port', 'event_type', 'status', 'details']
            if any(header in reader.fieldnames for header in expected_headers):
                for row in reader:
                    event = {
                        'timestamp': row.get('timestamp', ''),
                        'source_ip': row.get('source_ip', ''),
                        'destination_ip': row.get('destination_ip', ''),
                        'port': row.get('port', ''),
                        'event_type': row.get('event_type', ''),
                        'status': row.get('status', ''),
                        'details': row.get('details', '')
                    }
                    if event['timestamp']:
                        events.append(event)
                return events
    except Exception:
        pass
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        pattern = r'\[([^\]]+)\]\s*\[([^\]]+)\]\s+([0-9.]+)\s*->\s*([0-9.]+):(\d+)\s*\[([^\]]+)\]\s*(.*)'
        match = re.search(pattern, line)
        
        if match:
            event = {
                'timestamp': match.group(1),
                'event_type': match.group(2),
                'source_ip': match.group(3),
                'destination_ip': match.group(4),
                'port': match.group(5),
                'status': match.group(6),
                'details': match.group(7)
            }
            events.append(event)
    
    if not events:
        for line in lines:
            if line.strip():
                parts = line.split()
                if len(parts) >= 6:
                    event = {
                        'timestamp': ' '.join(parts[:2]) if len(parts) > 6 else parts[0],
                        'event_type': 'Unknown',
                        'source_ip': parts[-4] if len(parts) >= 4 else '',
                        'destination_ip': parts[-3] if len(parts) >= 3 else '',
                        'port': parts[-2] if len(parts) >= 2 else '',
                        'status': parts[-1],
                        'details': ' '.join(parts)
                    }
                    if event['source_ip'] and '.' in event['source_ip']:
                        events.append(event)
    
    return events

def analyze_network_logs(events):
    """Analyze network events and extract forensic intelligence."""
    if not events:
        return None
    
    unique_source_ips = set()
    unique_dest_ips = set()
    failed_logins = 0
    successful_logins = 0
    suspicious_ports = {22, 23, 3389, 135, 139, 445, 1433, 3306, 5432, 27017, 6379}
    port_access = {}
    repeated_connections = {}
    brute_force_attempts = {}
    
    timeline = []
    
    for event in events:
        src_ip = event.get('source_ip', '')
        dst_ip = event.get('destination_ip', '')
        port = event.get('port', '')
        event_type = event.get('event_type', '').lower()
        status = event.get('status', '').lower()
        timestamp = event.get('timestamp', '')
        details = event.get('details', '')
        
        if src_ip and '.' in src_ip:
            unique_source_ips.add(src_ip)
        if dst_ip and '.' in dst_ip:
            unique_dest_ips.add(dst_ip)
        
        if 'login' in event_type or 'auth' in event_type or 'ssh' in event_type:
            if 'fail' in status or 'failure' in status or 'denied' in status:
                failed_logins += 1
            elif 'success' in status or 'accepted' in status:
                successful_logins += 1
        
        try:
            port_int = int(port)
            if port_int in suspicious_ports:
                port_access[port_int] = port_access.get(port_int, 0) + 1
        except ValueError:
            pass
        
        conn_key = f"{src_ip}->{dst_ip}:{port}"
        repeated_connections[conn_key] = repeated_connections.get(conn_key, 0) + 1
        
        if 'fail' in status and ('ssh' in event_type or 'login' in event_type):
            brute_force_attempts[src_ip] = brute_force_attempts.get(src_ip, 0) + 1
        
        timeline.append({
            'timestamp': timestamp,
            'event_type': event_type,
            'source_ip': src_ip,
            'destination_ip': dst_ip,
            'port': port,
            'status': status,
            'details': details
        })
    
    timeline.sort(key=lambda x: x['timestamp'])
    
    brute_force_ips = {ip: count for ip, count in brute_force_attempts.items() if count > 5}
    
    total_events = len(events)
    unique_sources = len(unique_source_ips)
    unique_destinations = len(unique_dest_ips)
    suspicious_activities = len(brute_force_ips) + len(port_access) + (failed_logins // 3)
    
    return {
        'total_events': total_events,
        'unique_source_ips': unique_sources,
        'unique_dest_ips': unique_destinations,
        'failed_logins': failed_logins,
        'successful_logins': successful_logins,
        'suspicious_ports_detected': list(port_access.keys()),
        'repeated_connections': {k: v for k, v in repeated_connections.items() if v > 2},
        'brute_force_ips': brute_force_ips,
        'suspicious_activities': suspicious_activities,
        'timeline': timeline,
        'source_ips': list(unique_source_ips),
        'dest_ips': list(unique_dest_ips)
    }

def calculate_risk_level(analysis):
    """Calculate overall risk level (LOW, MEDIUM, HIGH) in plain English."""
    if not analysis:
        return {'level': 'LOW', 'score': 0, 'reason': 'No data analyzed'}
    
    score = 0
    reasons = []
    
    if analysis['failed_logins'] > 10:
        score += 25
        reasons.append(f"High number of failed login attempts ({analysis['failed_logins']} times)")
    elif analysis['failed_logins'] > 5:
        score += 15
        reasons.append(f"Multiple wrong password attempts ({analysis['failed_logins']} times)")
    
    if analysis['brute_force_ips']:
        score += 30
        brute_ips = ', '.join(list(analysis['brute_force_ips'].keys())[:3])
        reasons.append(f"Password guessing attack (brute force) detected from IP address {brute_ips}")
    
    if analysis['suspicious_ports_detected']:
        score += 20
        reasons.append(f"Probing sensitive network doors (ports: {', '.join(map(str, analysis['suspicious_ports_detected']))})")
    
    if len(analysis['repeated_connections']) > 5:
        score += 15
        reasons.append(f"Unusual repetitive traffic connections ({len(analysis['repeated_connections'])} paths)")
    
    total_logins = analysis['failed_logins'] + analysis['successful_logins']
    if total_logins > 0:
        fail_ratio = analysis['failed_logins'] / total_logins
        if fail_ratio > 0.7:
            score += 10
            reasons.append(f"High login failure rate ({int(fail_ratio*100)}% of login attempts failed)")
    
    if score >= 70:
        level = 'HIGH'
    elif score >= 40:
        level = 'MEDIUM'
    else:
        level = 'LOW'
    
    return {
        'level': level,
        'score': min(score, 100),
        'reasons': reasons if reasons else ['No suspicious network activity detected']
    }

def generate_forensic_summary(analysis, risk_assessment):
    """Generate simple, easy-to-understand investigation summary for network logs."""
    if not analysis:
        return ["No network logs were analyzed."]
    
    summary = []
    summary.append("Network Traffic Investigation Summary")
    summary.append(f"Total Network Activity Logs Analyzed: {analysis['total_events']}")
    summary.append(f"Unique Sender IP Addresses: {analysis['unique_source_ips']}")
    summary.append(f"Unique Receiver IP Addresses: {analysis['unique_dest_ips']}")
    summary.append("")
    
    if analysis['successful_logins'] > 0 or analysis['failed_logins'] > 0:
        summary.append("Login Activity Summary:")
        summary.append(f"  • Successful Logins: {analysis['successful_logins']}")
        summary.append(f"  • Failed Password Attempts: {analysis['failed_logins']}")
    
    if analysis['brute_force_ips']:
        summary.append("")
        summary.append("WARNING: Password Guessing Attack Detected")
        for ip, attempts in analysis['brute_force_ips'].items():
            summary.append(f"  • Suspect IP {ip}: tried entering passwords {attempts} times")
    
    if analysis['suspicious_ports_detected']:
        summary.append("")
        summary.append("Sensitive Network Doors Probed:")
        for port in analysis['suspicious_ports_detected']:
            summary.append(f"  • Port {port}: scan attempt detected")
    
    summary.append("")
    summary.append(f"Overall Risk Assessment: {risk_assessment['level']} ({risk_assessment['score']}/100)")
    for reason in risk_assessment['reasons']:
        summary.append(f"  • {reason}")
    
    summary.append("")
    summary.append("Recommended Next Steps:")
    if risk_assessment['level'] == 'HIGH':
        summary.append("  1. URGENT: Disconnect affected computers from the network immediately")
        summary.append("  2. Block the attacker's IP address on your network router/firewall")
        summary.append("  3. Change passwords for user accounts that were targeted")
        summary.append("  4. Turn on login rate limiting to block repeated wrong passwords")
    elif risk_assessment['level'] == 'MEDIUM':
        summary.append("  1. Review failed logins and check if any user accounts were compromised")
        summary.append("  2. Consider temporarily blocking suspicious IP addresses")
        summary.append("  3. Monitor sensitive server ports closely")
    else:
        summary.append("  1. No immediate action required")
        summary.append("  2. Continue regular network security monitoring")
    
    return summary

def generate_sample_network_log():
    """Generate realistic sample network log data for demo."""
    sample_log = """[2026-06-25 10:01:15] [USER_LOGIN] 192.168.1.100 -> 192.168.1.50:22 [SUCCESS] SSH login successful
[2026-06-25 10:02:30] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:03:15] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:04:02] [PORT_SCAN] 203.45.67.89 -> 192.168.1.50:135 [DETECTED] Windows RPC port probed
[2026-06-25 10:04:45] [PORT_SCAN] 203.45.67.89 -> 192.168.1.50:139 [DETECTED] NetBIOS port probed
[2026-06-25 10:05:12] [PORT_SCAN] 203.45.67.89 -> 192.168.1.50:445 [DETECTED] SMB port probed
[2026-06-25 10:05:30] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:06:01] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:06:45] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:07:20] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:08:05] [PORT_SCAN] 203.45.67.89 -> 192.168.1.50:3389 [DETECTED] RDP port probed
[2026-06-25 10:08:30] [USER_LOGIN] 192.168.1.100 -> 192.168.1.200:3306 [SUCCESS] Database connection
[2026-06-25 10:09:15] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:09:45] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:10:20] [FILE_ACCESS] 192.168.1.100 -> 192.168.1.201:445 [SUCCESS] Shared folder accessed
[2026-06-25 10:11:05] [FAILED_LOGIN] 203.45.67.89 -> 192.168.1.50:22 [FAILURE] Invalid credentials
[2026-06-25 10:12:30] [NETWORK_TRAFFIC] 10.0.0.50 -> 192.168.1.50:53 [NORMAL] DNS query
[2026-06-25 10:13:15] [USER_LOGOUT] 192.168.1.100 -> 192.168.1.50:22 [SUCCESS] SSH session closed
[2026-06-25 10:14:00] [FIREWALL_BLOCK] 203.45.67.89 -> 192.168.1.50:22 [BLOCKED] IP blocked after 10 failed attempts"""
    return sample_log
