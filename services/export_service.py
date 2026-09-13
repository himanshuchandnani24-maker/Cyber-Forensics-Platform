def flatten_data_for_csv(data, parent_key='', sep='_'):
    """Flatten nested dictionaries and lists for CSV export."""
    items = []
    
    if isinstance(data, dict):
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_data_for_csv(v, new_key, sep=sep).items())
            elif isinstance(v, list):
                items.append((new_key, ', '.join(str(x) for x in v)))
            else:
                items.append((new_key, v))
        return dict(items)
    elif isinstance(data, list):
        return [flatten_data_for_csv(item, parent_key, sep=sep) for item in data]
    else:
        return {parent_key: data} if parent_key else {"value": data}

SAMPLE_EXPORT_DATA = {
    'email': {
        'metadata': {
            'from': 'sender@example.com',
            'to': 'recipient@example.com',
            'subject': 'Test Email',
            'date': '2026-06-25 10:30:00',
            'message_id': '<test@example.com>'
        },
        'auth': {
            'spf': 'PASS',
            'dkim': 'PASS',
            'dmarc': 'PASS'
        },
        'verdict': 'SAFE',
        'risk_score': 5,
        'reason': 'All authentication checks passed.'
    },
    'image': {
        'fileName': 'sample_image.jpg',
        'fileType': 'JPEG',
        'fileSize': '2.5 MB',
        'resolution': '4000x3000',
        'privacyScore': 45,
        'privacyFindings': ['GPS coordinates detected', 'Camera model exposed'],
        'gpsCoordinates': '40.7128° N, 74.0060° W'
    },
    'network': {
        'total_events': 50,
        'unique_source_ips': 8,
        'unique_dest_ips': 12,
        'failed_logins': 15,
        'successful_logins': 25,
        'suspicious_activities': 5,
        'riskLevel': 'MEDIUM'
    }
}
