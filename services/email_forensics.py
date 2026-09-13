import re
from email.parser import HeaderParser

def parse_email_headers(raw_headers_str):
    """
    Parses raw email header string and returns analyzed metadata, auth results, hops, and risk scores.
    """
    parser = HeaderParser()
    headers = parser.parsestr(raw_headers_str)
    
    metadata = {
        "subject": headers.get("Subject", "Unknown"),
        "from": headers.get("From", "Unknown"),
        "to": headers.get("To", "Unknown"),
        "date": headers.get("Date", "Unknown"),
        "message_id": headers.get("Message-ID", "Unknown")
    }
    
    auth_results = headers.get("Authentication-Results", "")
    spf_header = headers.get("Received-SPF", "")
    
    spf_status = "UNKNOWN"
    dkim_status = "UNKNOWN"
    dmarc_status = "UNKNOWN"
    
    # Extract SPF
    if "spf=pass" in auth_results or "pass" in spf_header.lower():
        spf_status = "PASS"
    elif "spf=fail" in auth_results or "fail" in spf_header.lower():
        spf_status = "FAIL"
    elif "spf=softfail" in auth_results or "softfail" in spf_header.lower():
        spf_status = "SOFTFAIL"
    elif "spf=none" in auth_results or "none" in spf_header.lower():
        spf_status = "NONE"
        
    # Extract DKIM
    if "dkim=pass" in auth_results:
        dkim_status = "PASS"
    elif "dkim=fail" in auth_results:
        dkim_status = "FAIL"
        
    # Extract DMARC
    if "dmarc=pass" in auth_results:
        dmarc_status = "PASS"
    elif "dmarc=fail" in auth_results:
        dmarc_status = "FAIL"
        
    received_headers = headers.get_all("Received", [])
    hops = []
    
    for idx, rec in enumerate(received_headers):
        cleaned = " ".join(rec.split())
        sender_match = re.search(r'from\s+([^\s;]+)(?:\s+\([^\)]+\))?', cleaned)
        by_match = re.search(r'by\s+([^\s;]+)', cleaned)
        time_split = cleaned.split(';')
        timestamp = time_split[-1].strip() if len(time_split) > 1 else "Unknown"
        
        sender_str = sender_match.group(1) if sender_match else "Unknown"
        ip_match = re.search(r'\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]', cleaned)
        sender_ip = ip_match.group(1) if ip_match else ""
        
        if sender_ip:
            sender_info = f"{sender_str} ({sender_ip})"
        else:
            sender_info = sender_str
            
        receiver_str = by_match.group(1) if by_match else "Unknown"
        
        hops.append({
            "hop_number": len(received_headers) - idx,
            "sender": sender_info,
            "sender_ip": sender_ip,
            "receiver": receiver_str,
            "timestamp": timestamp
        })
        
    hops.reverse()
    
    risk_score = 0
    verdict = "SAFE"
    reason = "This email looks safe. All sender identity checks passed and it was sent through trusted servers."
    
    if spf_status in ["FAIL", "SOFTFAIL"]:
        risk_score += 30
    if dkim_status == "FAIL":
        risk_score += 40
    if dmarc_status == "FAIL":
        risk_score += 30
        
    if risk_score >= 70:
        verdict = "HIGH RISK (FAKE SENDER)"
        reason = "Warning! This email is likely fake or spoofed. The sender is pretending to be a trusted company, but the email security signatures do not match."
    elif risk_score >= 30:
        verdict = "CAUTION (UNVERIFIED SENDER)"
        reason = "Be careful. We could not fully confirm who sent this email. Do not click links or open attachments unless you trust the sender."
    else:
        if spf_status == "UNKNOWN" and dkim_status == "UNKNOWN":
            verdict = "CAUTION (NO SECURITY STAMPS)"
            reason = "This email does not have digital security stamps. We cannot guarantee who sent it."
            risk_score = 30
            
    return {
        "metadata": metadata,
        "auth": {
            "spf": spf_status,
            "dkim": dkim_status,
            "dmarc": dmarc_status
        },
        "hops": hops,
        "verdict": verdict,
        "reason": reason,
        "risk_score": risk_score
    }
