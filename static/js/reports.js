// Cyber Forensics Platform - Reporting & Export Module
// Handles PDF generation, CSV export, JSON export with professional formatting

class ReportExporter {
    constructor(analysisType, caseId = 'CF-2026-001') {
        this.analysisType = analysisType;
        this.caseId = caseId;
        this.analyst = 'Cyber Forensics Unit';
        this.timestamp = new Date();
    }

    // ===== METADATA GENERATION =====
    getMetadata() {
        return {
            caseId: this.caseId,
            analysisType: this.analysisType,
            analyst: this.analyst,
            timestamp: this.timestamp.toISOString(),
            generatedAt: this.timestamp.toLocaleString()
        };
    }

    // ===== CSV EXPORT =====
    exportToCSV(data, filename = null) {
        const csvFilename = filename || `${this.analysisType}_report_${Date.now()}.csv`;
        
        // Flatten nested objects for CSV
        const flatData = this.flattenData(data);
        
        // Generate CSV content
        const headers = Object.keys(flatData[0] || {});
        const csvContent = [
            headers.join(','),
            ...flatData.map(row => 
                headers.map(header => 
                    this.escapeCSVField(row[header])
                ).join(',')
            )
        ].join('\n');
        
        // Add metadata header
        const metadataHeader = `Case ID: ${this.caseId}, Analysis Type: ${this.analysisType}, Generated: ${this.timestamp.toLocaleString()}\n\n`;
        
        this.downloadFile(metadataHeader + csvContent, csvFilename, 'text/csv');
    }

    // Flatten nested objects for CSV export
    flattenData(data, prefix = '') {
        if (!Array.isArray(data)) {
            data = [data];
        }
        
        return data.map(item => {
            const flattened = {};
            
            const flatten = (obj, currentPrefix = '') => {
                for (const key in obj) {
                    const value = obj[key];
                    const fullKey = currentPrefix ? `${currentPrefix}_${key}` : key;
                    
                    if (value === null || value === undefined) {
                        flattened[fullKey] = '';
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        flatten(value, fullKey);
                    } else if (Array.isArray(value)) {
                        flattened[fullKey] = JSON.stringify(value);
                    } else {
                        flattened[fullKey] = value;
                    }
                }
            };
            
            flatten(item);
            return flattened;
        });
    }

    escapeCSVField(field) {
        if (field === null || field === undefined) return '';
        
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    }

    // ===== JSON EXPORT =====
    exportToJSON(data, filename = null) {
        const jsonFilename = filename || `${this.analysisType}_report_${Date.now()}.json`;
        
        const fullReport = {
            metadata: this.getMetadata(),
            data: data
        };
        
        const jsonContent = JSON.stringify(fullReport, null, 2);
        this.downloadFile(jsonContent, jsonFilename, 'application/json');
    }

    // ===== PDF EXPORT =====
    async exportToPDF(htmlContent, filename = null) {
        const pdfFilename = filename || `${this.analysisType}_report_${Date.now()}.pdf`;
        
        try {
            // Check if html2pdf library is available
            if (typeof html2pdf === 'undefined') {
                console.error('html2pdf library not loaded. Make sure it is included in the page.');
                CyberToast.error('PDF export library not available. Please ensure html2pdf is loaded.', { title: 'Export Failed' });
                return;
            }
            
            const element = document.createElement('div');
            element.innerHTML = this.generatePDFHTML(htmlContent);
            
            const opt = {
                margin: 10,
                filename: pdfFilename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };
            
            html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF export error:', error);
            CyberToast.error('Error generating PDF. Please try again.', { title: 'Export Failed' });
        }
    }

    // Generate HTML for PDF with proper styling
    generatePDFHTML(content) {
        const metadata = this.getMetadata();
        
        return `
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        color: #333;
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                    }
                    .pdf-header {
                        background: #1a1a1a;
                        color: #0ff;
                        padding: 20px;
                        border-bottom: 3px solid #0ff;
                        page-break-after: avoid;
                    }
                    .pdf-header h1 {
                        margin: 0 0 10px 0;
                        font-size: 24px;
                        text-transform: uppercase;
                    }
                    .pdf-header p {
                        margin: 5px 0;
                        font-size: 11px;
                    }
                    .pdf-metadata {
                        background: #f5f5f5;
                        padding: 15px;
                        margin: 0 0 20px 0;
                        border-left: 4px solid #0ff;
                        page-break-after: avoid;
                    }
                    .pdf-metadata div {
                        font-size: 10px;
                        margin: 3px 0;
                    }
                    .pdf-content {
                        padding: 20px;
                    }
                    .section {
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    .section-title {
                        background: #1a1a1a;
                        color: #0ff;
                        padding: 10px 15px;
                        margin: 20px 0 10px 0;
                        font-size: 13px;
                        font-weight: bold;
                        text-transform: uppercase;
                        border-left: 4px solid #0ff;
                    }
                    .stat-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin: 15px 0;
                    }
                    .stat-box {
                        background: #f9f9f9;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                    }
                    .stat-label {
                        font-size: 10px;
                        color: #666;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .stat-value {
                        font-size: 18px;
                        font-weight: bold;
                        color: #0ff;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        font-size: 10px;
                    }
                    th {
                        background: #1a1a1a;
                        color: #0ff;
                        padding: 10px;
                        text-align: left;
                        font-weight: bold;
                        border-bottom: 2px solid #0ff;
                    }
                    td {
                        padding: 8px;
                        border-bottom: 1px solid #ddd;
                    }
                    tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    .pdf-footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #0ff;
                        font-size: 9px;
                        color: #666;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .risk-high {
                        color: #d9534f;
                        font-weight: bold;
                    }
                    .risk-medium {
                        color: #f0ad4e;
                        font-weight: bold;
                    }
                    .risk-low {
                        color: #5cb85c;
                        font-weight: bold;
                    }
                    .findings-list {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    .findings-list li {
                        margin: 5px 0;
                        font-size: 11px;
                    }
                </style>
            </head>
            <body>
                <div class="pdf-header">
                    <h1>Cyber Forensics Report</h1>
                    <p>${this.analysisType} Analysis</p>
                </div>
                
                <div class="pdf-metadata">
                    <div><strong>Case ID:</strong> ${metadata.caseId}</div>
                    <div><strong>Analysis Type:</strong> ${metadata.analysisType}</div>
                    <div><strong>Analyst:</strong> ${metadata.analyst}</div>
                    <div><strong>Generated:</strong> ${metadata.generatedAt}</div>
                </div>
                
                <div class="pdf-content">
                    ${content}
                </div>
                
                <div class="pdf-footer">
                    <p>CONFIDENTIAL - Cyber Forensics Report<br/>
                    Generated by Cyber Forensics Platform on ${metadata.generatedAt}<br/>
                    Case ID: ${metadata.caseId}</p>
                </div>
            </body>
            </html>
        `;
    }

    // ===== PDF BUILDERS FOR SPECIFIC ANALYSIS TYPES =====
    
    // Email Forensics PDF Builder
    buildEmailForensicsPDF(analysisData) {
        let html = `<div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="stat-grid">
                <div class="stat-box">
                    <div class="stat-label">Verdict</div>
                    <div class="stat-value">${analysisData.verdict || 'UNKNOWN'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Risk Score</div>
                    <div class="stat-value">${analysisData.risk_score || 0}/100</div>
                </div>
            </div>
        </div>`;
        
        if (analysisData.metadata) {
            html += `<div class="section">
                <div class="section-title">Email Metadata</div>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>From</td><td>${analysisData.metadata.from}</td></tr>
                    <tr><td>To</td><td>${analysisData.metadata.to}</td></tr>
                    <tr><td>Subject</td><td>${analysisData.metadata.subject}</td></tr>
                    <tr><td>Date</td><td>${analysisData.metadata.date}</td></tr>
                    <tr><td>Message ID</td><td>${analysisData.metadata.message_id}</td></tr>
                </table>
            </div>`;
        }
        
        if (analysisData.auth) {
            const auth = analysisData.auth;
            html += `<div class="section">
                <div class="section-title">Authentication Results</div>
                <table>
                    <tr><th>Protocol</th><th>Status</th></tr>
                    <tr><td>SPF</td><td>${auth.spf}</td></tr>
                    <tr><td>DKIM</td><td>${auth.dkim}</td></tr>
                    <tr><td>DMARC</td><td>${auth.dmarc}</td></tr>
                </table>
            </div>`;
        }
        
        if (analysisData.hops && analysisData.hops.length > 0) {
            html += `<div class="section">
                <div class="section-title">Email Route Analysis (Hop Trace)</div>
                <table>
                    <tr><th>Hop</th><th>From</th><th>To</th><th>Timestamp</th></tr>`;
            
            analysisData.hops.forEach(hop => {
                html += `<tr>
                    <td>${hop.hop_number}</td>
                    <td>${hop.sender}</td>
                    <td>${hop.receiver}</td>
                    <td>${hop.timestamp}</td>
                </tr>`;
            });
            
            html += `</table></div>`;
        }
        
        html += `<div class="section">
            <div class="section-title">Analysis & Findings</div>
            <p><strong>Reason:</strong> ${analysisData.reason || 'N/A'}</p>
        </div>`;
        
        html += `<div class="section">
            <div class="section-title">Recommendations</div>
            <ul class="findings-list">`;
        
        if (analysisData.risk_score >= 70) {
            html += `<li>ALERT: Do not interact with this email. Suspected phishing or spoofing attack.</li>
                    <li>Report email to security team immediately.</li>
                    <li>Implement email filtering rules for similar patterns.</li>`;
        } else if (analysisData.risk_score >= 30) {
            html += `<li>CAUTION: Verify sender identity before clicking links or downloading attachments.</li>
                    <li>Review authentication failures and enable stronger verification.</li>`;
        } else {
            html += `<li>Email appears legitimate based on authentication checks.</li>
                    <li>Continue normal security practices.</li>`;
        }
        
        html += `</ul></div>`;
        
        return html;
    }
    
    // Image Forensics PDF Builder
    buildImageForensicsPDF(analysisData) {
        let html = `<div class="section">
            <div class="section-title">Image Information</div>
            <div class="stat-grid">
                <div class="stat-box">
                    <div class="stat-label">File Name</div>
                    <div style="font-size: 12px;">${analysisData.fileName || 'Unknown'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">File Type</div>
                    <div style="font-size: 12px;">${analysisData.fileType || 'Unknown'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">File Size</div>
                    <div style="font-size: 12px;">${analysisData.fileSize || 'Unknown'}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Resolution</div>
                    <div style="font-size: 12px;">${analysisData.resolution || 'Unknown'}</div>
                </div>
            </div>
        </div>`;
        
        if (analysisData.privacyScore !== undefined) {
            html += `<div class="section">
                <div class="section-title">Privacy Risk Assessment</div>
                <div class="stat-box">
                    <div class="stat-label">Privacy Risk Score</div>
                    <div class="stat-value">${analysisData.privacyScore}%</div>
                </div>`;
            
            if (analysisData.privacyFindings && analysisData.privacyFindings.length > 0) {
                html += `<p><strong>Privacy Findings:</strong></p>
                    <ul class="findings-list">`;
                analysisData.privacyFindings.forEach(finding => {
                    html += `<li>${finding}</li>`;
                });
                html += `</ul>`;
            }
            
            html += `</div>`;
        }
        
        if (analysisData.metadataItems && Object.keys(analysisData.metadataItems).length > 0) {
            html += `<div class="section">
                <div class="section-title">EXIF Metadata</div>
                <table>
                    <tr><th>Tag</th><th>Value</th></tr>`;
            
            Object.entries(analysisData.metadataItems).forEach(([key, value]) => {
                html += `<tr><td>${key}</td><td>${value}</td></tr>`;
            });
            
            html += `</table></div>`;
        }
        
        if (analysisData.gpsCoordinates) {
            html += `<div class="section">
                <div class="section-title">GPS Coordinates Detected</div>
                <p><strong>WARNING:</strong> GPS data found in image metadata!</p>
                <p>Location: ${analysisData.gpsCoordinates}</p>
            </div>`;
        }
        
        if (analysisData.stegoAnalysis) {
            html += `<div class="section">
                <div class="section-title">Steganography Analysis</div>
                <p>${analysisData.stegoAnalysis}</p>
            </div>`;
        }
        
        if (analysisData.hashValue) {
            html += `<div class="section">
                <div class="section-title">File Integrity (SHA-256)</div>
                <table>
                    <tr><th>Hash Algorithm</th><th>Value</th></tr>
                    <tr><td>SHA-256</td><td>${analysisData.hashValue}</td></tr>
                </table>
            </div>`;
        }
        
        html += `<div class="section">
            <div class="section-title">Recommendations</div>
            <ul class="findings-list">
                <li>Review EXIF metadata before sharing images online.</li>
                <li>Remove sensitive metadata before publishing.</li>
                <li>Be cautious of images with high privacy risk scores.</li>
                <li>Consider using metadata stripping tools for sensitive content.</li>
            </ul>
        </div>`;
        
        return html;
    }
    
    // Network Forensics PDF Builder
    buildNetworkForensicsPDF(analysisData) {
        let html = `<div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="stat-grid">
                <div class="stat-box">
                    <div class="stat-label">Total Events</div>
                    <div class="stat-value">${analysisData.total_events || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Risk Level</div>
                    <div class="stat-value ${`risk-${(analysisData.riskLevel || 'low').toLowerCase()}`}">
                        ${(analysisData.riskLevel || 'UNKNOWN').toUpperCase()}
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Unique Source IPs</div>
                    <div class="stat-value">${analysisData.unique_source_ips || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Failed Logins</div>
                    <div class="stat-value">${analysisData.failed_logins || 0}</div>
                </div>
            </div>
        </div>`;
        
        html += `<div class="section">
            <div class="section-title">Network Statistics</div>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Events Analyzed</td><td>${analysisData.total_events || 0}</td></tr>
                <tr><td>Unique Source IPs</td><td>${analysisData.unique_source_ips || 0}</td></tr>
                <tr><td>Unique Destination IPs</td><td>${analysisData.unique_dest_ips || 0}</td></tr>
                <tr><td>Successful Logins</td><td>${analysisData.successful_logins || 0}</td></tr>
                <tr><td>Failed Login Attempts</td><td>${analysisData.failed_logins || 0}</td></tr>
                <tr><td>Suspicious Activities Detected</td><td>${analysisData.suspicious_activities || 0}</td></tr>
            </table>
        </div>`;
        
        if (analysisData.suspicious_ports_detected && analysisData.suspicious_ports_detected.length > 0) {
            html += `<div class="section">
                <div class="section-title">Suspicious Port Activity</div>
                <p><strong>Ports Detected:</strong></p>
                <ul class="findings-list">`;
            
            analysisData.suspicious_ports_detected.forEach(port => {
                html += `<li>Port ${port} - High-risk service detected</li>`;
            });
            
            html += `</ul></div>`;
        }
        
        if (analysisData.brute_force_ips && Object.keys(analysisData.brute_force_ips).length > 0) {
            html += `<div class="section">
                <div class="section-title">Brute Force Attack Detection</div>
                <table>
                    <tr><th>Source IP</th><th>Failed Attempts</th></tr>`;
            
            Object.entries(analysisData.brute_force_ips).forEach(([ip, count]) => {
                html += `<tr><td>${ip}</td><td>${count}</td></tr>`;
            });
            
            html += `</table></div>`;
        }
        
        html += `<div class="section">
            <div class="section-title">Recommendations</div>
            <ul class="findings-list">`;
        
        if ((analysisData.riskLevel || 'low').toLowerCase() === 'high') {
            html += `<li>IMMEDIATE ACTION: Isolate affected systems from network.</li>
                    <li>Block source IPs at firewall level.</li>
                    <li>Review and reset credentials for compromised accounts.</li>
                    <li>Enable rate limiting on authentication endpoints.</li>`;
        } else if ((analysisData.riskLevel || 'low').toLowerCase() === 'medium') {
            html += `<li>Review failed login attempts and investigate anomalies.</li>
                    <li>Consider temporary IP blocking for suspicious sources.</li>
                    <li>Enable enhanced monitoring on suspicious ports.</li>`;
        } else {
            html += `<li>Continue regular monitoring and logging.</li>
                    <li>Maintain current security policies and procedures.</li>`;
        }
        
        html += `</ul></div>`;
        
        return html;
    }

    // ===== UTILITY FUNCTIONS =====
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Validate data before export
    validateData(data) {
        if (!data) {
            throw new Error('No data provided for export');
        }
        return true;
    }
}

// ===== EXPORT HELPER FUNCTIONS =====

function initializeReportButtons(analysisType) {
    // Export to PDF
    const pdfBtn = document.getElementById('exportPDFBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            const data = window.currentAnalysisData;
            if (!data) {
                CyberToast.warning('No analysis data available to export', { title: 'Nothing to Export' });
                return;
            }
            
            const exporter = new ReportExporter(analysisType);
            let htmlContent = '';
            
            if (analysisType === 'Email Forensics') {
                htmlContent = exporter.buildEmailForensicsPDF(data);
            } else if (analysisType === 'Image Forensics') {
                htmlContent = exporter.buildImageForensicsPDF(data);
            } else if (analysisType === 'Network Forensics') {
                htmlContent = exporter.buildNetworkForensicsPDF(data);
            }
            
            exporter.exportToPDF(htmlContent);
        });
    }
    
    // Export to CSV
    const csvBtn = document.getElementById('exportCSVBtn');
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            const data = window.currentAnalysisData;
            if (!data) {
                CyberToast.warning('No analysis data available to export', { title: 'Nothing to Export' });
                return;
            }
            
            const exporter = new ReportExporter(analysisType);
            exporter.exportToCSV(data);
        });
    }
    
    // Export to JSON
    const jsonBtn = document.getElementById('exportJSONBtn');
    if (jsonBtn) {
        jsonBtn.addEventListener('click', () => {
            const data = window.currentAnalysisData;
            if (!data) {
                CyberToast.warning('No analysis data available to export', { title: 'Nothing to Export' });
                return;
            }
            
            const exporter = new ReportExporter(analysisType);
            exporter.exportToJSON(data);
        });
    }
}

// Helper to store current analysis data globally
function setCurrentAnalysisData(data) {
    window.currentAnalysisData = data;
}
