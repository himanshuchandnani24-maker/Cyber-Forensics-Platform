// JavaScript for Demo 1: Email Header Analyzer

const SAMPLES = {
    spoofed: `Delivered-To: victim@company.com
Received: from mail.attacker.net (attacker.net [198.51.100.42])
        by mx.google.com with ESMTPS id x201si8374825qkd.245
        for <victim@company.com>;
        Wed, 24 Jun 2026 10:14:22 -0700 (PDT)
Received-SPF: softfail (google.com: domain of transition of bounce-mail@attacker.net does not designate 198.51.100.42 as permitted sender)
Authentication-Results: mx.google.com;
       dkim=fail header.i=@company.com header.s=default;
       spf=softfail smtp.mailfrom=bounce-mail@attacker.net;
       dmarc=fail (p=REJECT sp=NONE dis=NONE) header.from=company.com
From: "Security Center" <support@company.com>
To: <victim@company.com>
Subject: Security Alert: Account Suspended immediately
Date: Wed, 24 Jun 2026 17:14:15 +0000
Message-ID: <028401d8c1ea$4a2f8c00$de8ea000$@company.com>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"`,

    legit: `Delivered-To: user@personal.com
Received: from mail-pj1-f41.google.com (mail-pj1-f41.google.com [209.85.216.41])
        by mx.google.com with ESMTPS id v187si123456qkb.87
        for <user@personal.com>;
        Wed, 24 Jun 2026 11:20:10 -0700 (PDT)
Received-SPF: pass (google.com: domain of support@github.com designates 209.85.216.41 as permitted sender)
Authentication-Results: mx.google.com;
       dkim=pass header.i=@github.com header.s=pf2023;
       spf=pass smtp.mailfrom=support@github.com;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=github.com
From: GitHub Support <support@github.com>
To: <user@personal.com>
Subject: [GitHub] Security Advisory Alert
Date: Wed, 24 Jun 2026 18:20:00 +0000
Message-ID: <github/mail/adv/123984@github.com>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"`
};

document.addEventListener('DOMContentLoaded', () => {
    const rawInput = document.getElementById('rawHeaderInput');
    const analyzeBtn = document.getElementById('btnAnalyzeHeader');
    const resultsContent = document.getElementById('resultsContent');
    const analysisStatus = document.getElementById('analysisStatus');
    
    // Sample Header Loading Buttons
    document.querySelectorAll('.btn-sample-header').forEach(btn => {
        btn.addEventListener('click', () => {
            const sampleType = btn.getAttribute('data-sample');
            if (SAMPLES[sampleType]) {
                rawInput.value = SAMPLES[sampleType];
                CyberUI.flashElement(rawInput);
                CyberToast.success('Sample headers loaded. Click Analyze to run diagnostics.', { title: 'Sample Loaded' });
                console.log(`Sample [${sampleType}] loaded into input.`);
            }
        });
    });

    // Helper function to escape HTML
    function escapeHtml(str) {
        if (!str) return 'Unknown';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // Analyze Button Action (Communicates with Flask Backend)
    analyzeBtn.addEventListener('click', () => {
        const text = rawInput.value.trim();
        if (!text) {
            CyberToast.warning('Please paste raw email headers before executing diagnostics.', { title: 'Input Required' });
            return;
        }

        // Set status to analyzing
        analysisStatus.className = "status-indicator-pill";
        analysisStatus.querySelector('.status-indicator').className = "status-indicator online";
        analysisStatus.querySelector('.status-text').textContent = "PARSING DATA...";
        
        resultsContent.innerHTML = `
            <div class="text-center py-5 my-auto w-100">
                <i class="fa-solid fa-gear fa-spin fa-3x text-cyber-purple mb-3"></i>
                <h5 class="font-monospace text-sm">DECRYPTING ROUTING HOPS...</h5>
                <p class="text-muted text-xs font-monospace">Contacting forensic service, parsing headers, verifying seals...</p>
            </div>
        `;

        fetch('/api/analyze/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ headers: text })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || "Failed to analyze headers") });
            }
            return response.json();
        })
        .then(data => {
            console.log("Analysis results received:", data);
            
            // Store data for export
            setCurrentAnalysisData(data);
            
            // Build the results UI based on verdict severity
            const risk = data.risk_score;
            let alertClass = "bg-cyber-green-glow border-cyber-green text-cyber-green";
            let alertIcon = "fa-circle-check";
            let statusClass = "status-indicator online";
            let headerGlow = "text-glow-blue";
            let statusText = "DOMAINS VERIFIED";

            if (risk >= 70) {
                alertClass = "bg-cyber-red-glow border-cyber-red text-cyber-red";
                alertIcon = "fa-circle-radiation";
                statusClass = "status-indicator threat";
                headerGlow = "text-glow-red";
                statusText = "HIGH THREAT DETECTED";
            } else if (risk >= 30) {
                alertClass = "bg-cyber-purple-glow border-cyber-purple text-cyber-purple";
                alertIcon = "fa-circle-exclamation";
                statusClass = "status-indicator threat";
                headerGlow = "text-glow-purple";
                statusText = "WARNING GENERATED";
            }

            // Update header status
            analysisStatus.className = "status-indicator-pill";
            analysisStatus.querySelector('.status-indicator').className = statusClass;
            analysisStatus.querySelector('.status-text').textContent = statusText;
            
            // Show export buttons with animation
            CyberUI.revealExportButtons('#exportButtonsContainer');

            // Render output
            let hopsHtml = '';
            if (data.hops && data.hops.length > 0) {
                data.hops.forEach(hop => {
                    const isOrigin = hop.hop_number === 1;
                    const badgeClass = isOrigin ? "bg-cyber-purple-glow text-cyber-purple" : "bg-cyber-blue-glow text-cyber-blue";
                    hopsHtml += `
                        <li class="list-group-item bg-transparent text-cyber-light border-secondary-subtle py-2 px-0">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="badge ${badgeClass}">HOP ${hop.hop_number}</span>
                                <span class="text-muted text-xs">${escapeHtml(hop.timestamp)}</span>
                            </div>
                            <div class="text-xs">
                                <strong>Sender:</strong> <span class="text-cyber-light">${escapeHtml(hop.sender)}</span> 
                                <i class="fa-solid fa-arrow-right mx-1 text-muted"></i> 
                                <strong>Receiver:</strong> <span class="text-cyber-light">${escapeHtml(hop.receiver)}</span>
                            </div>
                        </li>
                    `;
                });
            } else {
                hopsHtml = '<li class="list-group-item bg-transparent text-muted text-center py-3">No routing hops extracted from header.</li>';
            }

            // Authentication badges
            const getAuthBadge = (val) => {
                if (val === 'PASS') return '<span class="text-cyber-green fw-bold">PASS</span>';
                if (val === 'FAIL') return '<span class="text-cyber-red fw-bold">FAIL</span>';
                if (val === 'SOFTFAIL') return '<span class="text-warning fw-bold">SOFTFAIL</span>';
                return '<span class="text-muted fw-bold">NONE/UNKNOWN</span>';
            };

            const borderClass = risk >= 70 ? "border-cyber-red" : (risk >= 30 ? "border-cyber-purple" : "border-cyber-blue");

            resultsContent.innerHTML = `
                <div class="w-100 text-start font-monospace text-xs">
                    <!-- Verdict alert banner -->
                    <div class="alert ${alertClass} d-flex align-items-center mb-3">
                        <i class="fa-solid ${alertIcon} fa-2x me-3"></i>
                        <div>
                            <h6 class="mb-0 fw-bold font-monospace text-xs text-uppercase">${escapeHtml(data.verdict)} (Risk: ${data.risk_score}%)</h6>
                            <p class="mb-0 text-muted" style="font-size: 0.72rem;">${escapeHtml(data.reason)}</p>
                        </div>
                    </div>

                    <!-- Meta Details -->
                    <h6 class="text-glow-blue mb-2 text-uppercase text-xs fw-bold"><i class="fa-solid fa-barcode me-1"></i>Envelope Data</h6>
                    <div class="table-responsive mb-3 border border-secondary rounded">
                        <table class="table table-dark table-striped mb-0 text-xs cyber-table">
                            <tbody>
                                <tr><td class="text-muted">From</td><td>${escapeHtml(data.metadata.from)}</td></tr>
                                <tr><td class="text-muted">To</td><td>${escapeHtml(data.metadata.to)}</td></tr>
                                <tr><td class="text-muted">Subject</td><td>${escapeHtml(data.metadata.subject)}</td></tr>
                                <tr><td class="text-muted">Date</td><td>${escapeHtml(data.metadata.date)}</td></tr>
                                <tr><td class="text-muted">Message-ID</td><td class="text-wrap">${escapeHtml(data.metadata.message_id)}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Authentication status -->
                    <h6 class="text-glow-blue mb-2 text-uppercase text-xs fw-bold"><i class="fa-solid fa-key me-1"></i>Security Seals</h6>
                    <div class="row g-2 mb-3 text-center">
                        <div class="col-4">
                            <div class="p-2 border border-secondary rounded bg-dark-input">
                                <div class="text-muted mb-1" style="font-size: 0.65rem;">SPF SEAL</div>
                                <div>${getAuthBadge(data.auth.spf)}</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="p-2 border border-secondary rounded bg-dark-input">
                                <div class="text-muted mb-1" style="font-size: 0.65rem;">DKIM SIGN</div>
                                <div>${getAuthBadge(data.auth.dkim)}</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="p-2 border border-secondary rounded bg-dark-input">
                                <div class="text-muted mb-1" style="font-size: 0.65rem;">DMARC POLICY</div>
                                <div>${getAuthBadge(data.auth.dmarc)}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Routing hops timeline -->
                    <h6 class="${headerGlow} mb-2 text-uppercase text-xs fw-bold"><i class="fa-solid fa-route me-1"></i>Chronological Hops Timeline</h6>
                    <ul class="list-group list-group-flush bg-transparent overflow-auto" style="max-height: 180px;">
                        ${hopsHtml}
                    </ul>
                </div>
            `;
        })
        .catch(err => {
            console.error("Analysis failed:", err);
            analysisStatus.className = "status-indicator-pill";
            analysisStatus.querySelector('.status-indicator').className = "status-indicator offline";
            analysisStatus.querySelector('.status-text').textContent = "ERROR";
            
            resultsContent.innerHTML = `
                <div class="alert bg-cyber-red-glow border-cyber-red text-cyber-red w-100 text-start font-monospace text-xs">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>
                    <strong>ANALYSIS ERROR:</strong> ${escapeHtml(err.message)}
                </div>
            `;
        });
    });
    
    // Initialize report export buttons
    initializeReportButtons('Email Forensics');
});
