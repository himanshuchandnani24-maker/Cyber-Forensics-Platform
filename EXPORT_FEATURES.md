# Cyber Forensics Platform - Phase 2: Export & Reporting Features

## Overview
This document describes the PDF export, CSV export, and JSON export functionality added to the Cyber Forensics Platform in Phase 2.

## Features Implemented

### 1. PDF Export
Professional formatted reports with cyber-themed styling including:
- **Header Section**: Analysis type and branding
- **Metadata Section**: Case ID, analyst name, timestamp
- **Content Sections**: Module-specific formatted data
- **Footer Section**: Confidentiality notice and case reference

#### Email Forensics PDF Includes:
- Verdict and risk score
- Email metadata (From, To, Subject, Date, Message-ID)
- Authentication results (SPF, DKIM, DMARC status)
- Email hop trace/routing analysis
- Risk assessment and recommendations

#### Image Forensics PDF Includes:
- Image information (filename, type, size, resolution)
- Privacy risk assessment with score
- EXIF metadata table
- GPS coordinates detection alert
- Steganography analysis results
- File integrity (SHA-256 hash)
- Recommendations for privacy protection

#### Network Forensics PDF Includes:
- Executive summary with statistics
- Network statistics table
- Suspicious port activity detection
- Brute force attack detection
- Risk assessment and incident recommendations

### 2. CSV Export
Excel-compatible data export with:
- Automatic nested object flattening
- Proper CSV escaping and quoting
- Metadata as header comments
- Support for complex data structures
- Column headers from data keys

### 3. JSON Export
Complete data preservation with:
- Pretty-printed format (2-space indent)
- Metadata wrapper
- ISO 8601 timestamps
- Analyst and case ID information
- Full analysis data structure

## Files Modified/Created

### Created:
- `static/js/reports.js` - Core export functionality (850+ lines)

### Modified:
- `templates/base.html` - Added html2pdf library
- `templates/demo1.html` - Added export buttons
- `templates/demo2.html` - Added export buttons  
- `templates/demo3.html` - Added export buttons
- `static/js/demo1.js` - Export integration
- `static/js/demo2.js` - Export integration
- `static/js/demo3.js` - Export integration
- `app.py` - Added export endpoints

## API Endpoints

### POST /api/export/json
Export analysis data as JSON format
- **Request**: JSON with `data`, `caseId`, `analysisType`, `analyst` fields
- **Response**: JSON file download
- **Content-Type**: application/json

### POST /api/export/csv
Export analysis data as CSV format
- **Request**: JSON with `data`, `caseId`, `analysisType` fields
- **Response**: CSV file download
- **Content-Type**: text/csv

### POST /api/export/pdf
Generate PDF report (client-side PDF generation)
- **Request**: JSON with analysis data
- **Response**: Confirmation JSON
- **Note**: Actual PDF generation happens client-side using html2pdf.js

### GET /api/export/sample-data
Get sample data for testing
- **Parameters**: `type` (email, image, or network)
- **Response**: Sample analysis data in JSON format

## Usage

### For End Users:

1. **Run Analysis**:
   - Navigate to Email, Image, or Network Forensics module
   - Upload data or load sample files
   - Click "Analyze" button

2. **Export Results**:
   - After analysis completes, export buttons appear
   - Click desired format:
     - **PDF**: Professional formatted report
     - **CSV**: Spreadsheet compatible data
     - **JSON**: Raw data backup

3. **Access Files**:
   - Files automatically download to Downloads folder
   - Filename includes timestamp: `analysis_YYYYMMDD_HHMMSS.ext`

### For Developers:

#### JavaScript Integration:
```javascript
// Initialize export buttons
initializeReportButtons('Email Forensics');

// Store analysis data
setCurrentAnalysisData(analysisData);

// Manual PDF generation
const exporter = new ReportExporter('Email Forensics', 'CF-2026-001');
const htmlContent = exporter.buildEmailForensicsPDF(data);
exporter.exportToPDF(htmlContent);
```

#### Python Backend:
```python
# Export to JSON
@app.route('/api/export/json', methods=['POST'])
def api_export_json():
    # Handles JSON export

# Export to CSV
@app.route('/api/export/csv', methods=['POST'])
def api_export_csv():
    # Handles CSV export with flattening
```

## Technical Details

### PDF Styling
- Font: Courier New (monospace) for cyber aesthetic
- Colors: Cyan headers (#00ffff), dark background (#1a1a1a)
- Risk Levels: Red (High), Orange (Medium), Green (Low)
- Tables: Alternating row colors for readability
- Layout: Professional with proper spacing and alignment

### CSV Flattening Algorithm
- Nested objects use underscore separator: `parent_child`
- Arrays converted to comma-separated strings
- Special characters properly escaped
- Metadata included as commented header

### JSON Structure
```json
{
  "metadata": {
    "case_id": "CF-2026-001",
    "analysis_type": "Email Forensics",
    "analyst": "Cyber Forensics Unit",
    "timestamp": "ISO-8601 format",
    "generated_at": "Human-readable date"
  },
  "data": {
    // Full analysis data
  }
}
```

## Library Dependencies

### Frontend:
- **html2pdf.js** (v0.10.1) - CDN: https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
- **Bootstrap 5.3.3** - For styling
- **Font Awesome 6.5.2** - For icons

### Backend:
- **Flask** - Web framework
- **PIL/Pillow** - Image processing
- **Python standard library**: json, csv, io, datetime

## Testing

All features have been tested and verified:
- ✓ JSON export endpoint working
- ✓ CSV export endpoint working
- ✓ PDF styling rendering correctly
- ✓ Export buttons appearing after analysis
- ✓ Data properly captured and formatted
- ✓ Error handling working
- ✓ All three modules functional

## Future Enhancements

Potential improvements for future phases:
1. Server-side PDF generation using ReportLab
2. Advanced formatting options (header images, branding)
3. Batch export functionality
4. Email report delivery
5. Scheduled report generation
6. Export templates customization
7. Multi-format export (DOCX, XLSX)
8. Report digitally signed PDFs

## Troubleshooting

### PDFs not generating:
- Check if html2pdf.js library is loaded in browser console
- Verify browser allows clipboard access
- Try different browser if issue persists

### CSV data looks wrong:
- Ensure nested objects are properly handled
- Check for special characters in data
- Verify CSV opened in correct application

### Export buttons not appearing:
- Run analysis to completion
- Check browser console for JavaScript errors
- Verify reports.js loaded successfully

## Support

For issues or questions, refer to the main README.md or contact the development team.
