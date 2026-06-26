/**
 * ============================================================
 * Demo 2: Image Forensics & Steganography Suite
 * ============================================================
 *
 * This script handles:
 *  - Image file upload (drag & drop + click)
 *  - Built-in sample image selection
 *  - Sending images to the /api/analyze/image backend
 *  - Rendering the full forensic report across 6 sections
 *  - Updating dashboard stat cards
 *  - Copy-to-clipboard for SHA-256 hash
 *  - Error handling for invalid files
 *
 * Beginner-Friendly: Each function is clearly named and commented.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM References ──────────────────────────────────────────
    const dropzone       = document.getElementById('imageDropzone');
    const imageInput     = document.getElementById('imageInput');
    const btnAnalyze     = document.getElementById('btnAnalyzeImage');
    const errorAlert     = document.getElementById('errorAlert');
    const errorMessage   = document.getElementById('errorMessage');
    const placeholder    = document.getElementById('resultsPlaceholder');
    const resultsPanel   = document.getElementById('resultsContainer');
    const btnCopyHash    = document.getElementById('btnCopyHash');

    // ── State Variables ─────────────────────────────────────────
    let selectedFile  = null;   // The File object (or null for samples)
    let sampleType    = null;   // 'gps_exif' | 'stego_hidden' | null

    // Session-level counters for dashboard cards
    let statsImages   = 0;
    let statsMetadata = 0;
    let statsGps      = 0;
    let statsHighRisk = 0;

    // ── Drag & Drop Setup ───────────────────────────────────────
    // Click on the dropzone opens the native file picker
    dropzone.addEventListener('click', () => imageInput.click());

    // Highlight when dragging a file over the dropzone
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-primary');
    });

    // Remove highlight when dragging away
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-primary');
    });

    // Handle the file being dropped
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-primary');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // Handle file selected via the native file picker
    imageInput.addEventListener('change', () => {
        if (imageInput.files.length > 0) {
            handleFileSelect(imageInput.files[0]);
        }
    });

    // ── Sample Image Buttons ────────────────────────────────────
    document.querySelectorAll('.btn-sample-image').forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = btn.getAttribute('data-sample');
            sampleType = sample;
            selectedFile = null; // Clear any user file

            // Update dropzone UI to show sample is loaded
            dropzone.innerHTML = `
                <i class="fa-regular fa-image fa-3x text-cyber-blue mb-3"></i>
                <h6 class="font-monospace text-sm mb-1 text-uppercase">${sample.replace('_', ' ')} DEMO LOADED</h6>
                <p class="text-xs text-muted mb-0">Built-in sample file // Ready to scan</p>
            `;

            btnAnalyze.removeAttribute('disabled');
            hideError();
            CyberUI.flashElement(dropzone);
            CyberToast.success('Sample image ready. Click Extract & Analyze to scan.', { title: 'Sample Loaded' });
        });
    });

    /**
     * handleFileSelect – Called when a user selects or drops a file.
     * Validates the file extension and size before enabling the analyze button.
     */
    function handleFileSelect(file) {
        hideError();

        // ── Validate file extension ──
        const allowedExts = ['jpg', 'jpeg', 'png'];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
            showError(`Unsupported file format ".${ext}". Please upload JPG, JPEG, or PNG images.`);
            return;
        }

        // ── Validate file size (10 MB max) ──
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 10 MB.`);
            return;
        }

        selectedFile = file;
        sampleType = null; // Clear any sample selection

        // Update dropzone UI
        dropzone.innerHTML = `
            <i class="fa-solid fa-file-circle-check fa-3x text-cyber-blue mb-3"></i>
            <h6 class="font-monospace text-sm mb-1 text-uppercase">${file.name}</h6>
            <p class="text-xs text-muted mb-0">File size: ${(file.size / 1024 / 1024).toFixed(2)} MB // Ready to scan</p>
        `;
        btnAnalyze.removeAttribute('disabled');
        CyberUI.flashElement(dropzone);
    }

    // ── Analyze Button Click ────────────────────────────────────
    btnAnalyze.addEventListener('click', () => {
        if (!selectedFile && !sampleType) return;
        hideError();
        startAnalysis();
    });

    /**
     * startAnalysis – Sends the image to the backend API and handles the response.
     * Shows a loading state while the request is in progress.
     */
    function startAnalysis() {
        // Show loading state
        btnAnalyze.setAttribute('disabled', 'disabled');
        btnAnalyze.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>ANALYZING...';

        // Show placeholder with loading animation
        placeholder.innerHTML = `
            <div class="card cyber-card border-cyber-blue" style="min-height: 500px;">
                <div class="card-body d-flex flex-column align-items-center justify-content-center text-center py-5">
                    <i class="fa-solid fa-shield-cat fa-spin fa-4x text-cyber-blue mb-4"></i>
                    <h5 class="font-monospace text-glow-blue mb-2">Forensic Analysis In Progress</h5>
                    <p class="text-muted text-sm">Extracting EXIF tags, scanning LSB bit-planes, computing integrity hashes...</p>
                </div>
            </div>
        `;
        placeholder.classList.remove('d-none');
        resultsPanel.classList.add('d-none');

        // Build the API request
        const requestUrl = '/api/analyze/image';

        if (sampleType) {
            // ── Sample image request (JSON body) ──
            fetch(requestUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sample: sampleType })
            })
            .then(res => res.json())
            .then(data => handleResponse(data))
            .catch(err => showError('Network error: ' + err.message));
        } else {
            // ── User-uploaded file request (multipart form) ──
            const formData = new FormData();
            formData.append('image', selectedFile);
            fetch(requestUrl, {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => handleResponse(data))
            .catch(err => showError('Network error: ' + err.message));
        }
    }

    /**
     * handleResponse – Processes the backend JSON response and
     * populates all 6 report sections + dashboard cards.
     */
    function handleResponse(data) {
        // Reset the analyze button
        btnAnalyze.removeAttribute('disabled');
        btnAnalyze.innerHTML = '<i class="fa-solid fa-shield-halved me-2"></i>Extract & Analyze';

        // ── Handle errors from backend ──
        if (data.error) {
            showError(data.error);
            placeholder.innerHTML = `
                <div class="card cyber-card border-cyber-dark" style="min-height: 500px;">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center py-5">
                        <i class="fa-solid fa-magnifying-glass-chart fa-4x text-cyber-blue mb-4 opacity-25"></i>
                        <h5 class="font-monospace text-muted mb-2">Awaiting Image Input</h5>
                        <p class="text-muted text-sm" style="max-width: 400px;">Upload a JPG, JPEG, or PNG image, or load a built-in sample to begin.</p>
                    </div>
                </div>
            `;
            return;
        }

        // ── Update Dashboard Stat Cards (Section 7) ──
        statsImages++;
        const meta = data.metadata;
        const hasRealMetadata = meta.camera_make !== 'Unknown' || meta.camera_model !== 'Unknown' || meta.date_created !== 'Unknown';
        if (hasRealMetadata) statsMetadata++;
        if (meta.gps) statsGps++;
        if (data.risk.level === 'High') statsHighRisk++;

        document.getElementById('statImagesAnalyzed').textContent = statsImages;
        document.getElementById('statMetadataFound').textContent   = statsMetadata;
        document.getElementById('statGpsLeaks').textContent        = statsGps;
        document.getElementById('statHighRisk').textContent        = statsHighRisk;

        // ── Show results panel, hide placeholder ──
        placeholder.classList.add('d-none');
        resultsPanel.classList.remove('d-none');
        
        // Store data for export
        setCurrentAnalysisData(data);
        
        // Show export buttons with animation
        const exportBar = document.getElementById('exportButtonsBar');
        if (exportBar) exportBar.classList.remove('d-none');
        CyberUI.revealExportButtons('#exportButtonsBar');

        // ── SECTION 1: Image Information ──
        document.getElementById('infoFileName').textContent   = data.filename;
        document.getElementById('infoFileType').textContent   = data.file_type;
        document.getElementById('infoFileSize').textContent   = data.filesize;
        document.getElementById('infoResolution').textContent = data.resolution;
        document.getElementById('infoUploadTime').textContent = data.upload_time;

        // ── SECTION 2: Metadata Analysis ──
        renderMetadataSection(data.metadata);

        // ── SECTION 3: File Integrity (SHA-256 Hash) ──
        document.getElementById('hashValue').textContent = data.hash;

        // ── SECTION 4: Privacy Exposure Analysis ──
        renderPrivacySection(data.privacy, data.risk);

        // ── SECTION 5: Hidden Data Analysis (Steganography) ──
        renderStegoSection(data.stego);

        // ── SECTION 6: Investigation Summary ──
        renderSummarySection(data.summary, data.risk);

        // ── Animate sections appearing ──
        animateSections();
    }

    // ============================================================
    // SECTION RENDERERS
    // ============================================================

    /**
     * renderMetadataSection – Renders EXIF metadata table or
     * a "no metadata" alert.
     */
    function renderMetadataSection(meta) {
        const container = document.getElementById('metadataContent');

        const hasAnyMeta = meta.camera_make !== 'Unknown' ||
                           meta.camera_model !== 'Unknown' ||
                           meta.date_created !== 'Unknown' ||
                           meta.software !== 'Unknown' ||
                           meta.gps;

        if (!hasAnyMeta) {
            container.innerHTML = `
                <div class="alert bg-dark border border-secondary text-muted font-monospace text-sm mb-0">
                    <i class="fa-solid fa-circle-info me-2"></i> No EXIF Metadata Found
                    <p class="mb-0 mt-2 text-xs">This is common in images sent through messaging applications or processed through metadata strippers.</p>
                </div>
            `;
            return;
        }

        // Build a metadata table + GPS map card
        let gpsHTML = '';
        if (meta.gps) {
            gpsHTML = `
                <div class="col-md-5">
                    <h6 class="text-glow-purple mb-3 font-monospace text-xs text-uppercase">
                        <i class="fa-solid fa-map-location-dot me-1"></i> Geo-Location
                    </h6>
                    <div class="p-3 border border-secondary rounded d-flex flex-column align-items-center justify-content-center text-center" style="height: 200px; background: rgba(0,0,0,0.3);">
                        <i class="fa-solid fa-earth-americas fa-3x text-cyber-green mb-3"></i>
                        <div class="text-xs font-monospace text-cyber-light">Location Decoded</div>
                        <div class="text-xs font-monospace text-muted mt-1">${meta.gps.formatted}</div>
                        <a href="https://maps.google.com/?q=${meta.gps.latitude},${meta.gps.longitude}" target="_blank"
                           class="btn btn-xs btn-outline-secondary mt-3 font-monospace text-xs">
                            View on Map <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
                        </a>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="row g-4">
                <div class="${meta.gps ? 'col-md-7' : 'col-12'}">
                    <h6 class="text-glow-purple mb-3 font-monospace text-xs text-uppercase">
                        <i class="fa-solid fa-tags me-1"></i> EXIF Properties
                    </h6>
                    <table class="table table-dark table-striped text-xs cyber-table mb-0 font-monospace">
                        <tbody>
                            <tr><td class="text-muted" style="width:40%;">Camera Model</td><td>${meta.camera_model}</td></tr>
                            <tr><td class="text-muted">Device Manufacturer</td><td>${meta.device_manufacturer}</td></tr>
                            <tr><td class="text-muted">Date Taken</td><td>${meta.date_created}</td></tr>
                            <tr><td class="text-muted">GPS Coordinates</td><td>${meta.gps ? '<span class="text-cyber-green">Available</span>' : '<span class="text-muted">Not Available</span>'}</td></tr>
                            <tr><td class="text-muted">Software Used</td><td>${meta.software}</td></tr>
                        </tbody>
                    </table>
                </div>
                ${gpsHTML}
            </div>
        `;
    }

    /**
     * renderPrivacySection – Renders the privacy risk gauge and findings list.
     */
    function renderPrivacySection(privacy, risk) {
        const score = privacy.score;
        const findings = privacy.findings;

        // ── Animate the SVG ring ──
        const ring = document.getElementById('privacyRing');
        const circumference = 314; // 2 * π * 50
        const offset = circumference - (score / 100) * circumference;

        // Set color based on score
        let ringColor = 'var(--color-green)';
        if (score >= 60) ringColor = 'var(--color-red)';
        else if (score >= 30) ringColor = '#f59e0b'; // Amber/orange

        ring.style.stroke = ringColor;
        // Animate after a small delay
        setTimeout(() => {
            ring.style.transition = 'stroke-dashoffset 1.2s ease-out';
            ring.setAttribute('stroke-dashoffset', offset);
        }, 300);

        // Update score text
        document.getElementById('privacyScoreText').textContent = score + '%';

        // ── Render findings list ──
        const findingsContainer = document.getElementById('privacyFindings');
        let findingsHTML = '';
        findings.forEach(f => {
            if (f.found) {
                findingsHTML += `
                    <div class="d-flex align-items-center mb-2">
                        <i class="fa-solid fa-circle-check text-cyber-red me-2"></i>
                        <span class="text-cyber-light">${f.label}</span>
                    </div>
                `;
            } else {
                findingsHTML += `
                    <div class="d-flex align-items-center mb-2">
                        <i class="fa-solid fa-circle-xmark text-muted me-2"></i>
                        <span class="text-muted">${f.label}</span>
                    </div>
                `;
            }
        });
        findingsContainer.innerHTML = findingsHTML;

        // ── Risk level badge ──
        const riskText = document.getElementById('privacyRiskText');
        riskText.textContent = risk.level;
        if (risk.level === 'High') {
            riskText.className = 'ms-2 font-monospace fw-bold text-cyber-red';
        } else if (risk.level === 'Medium') {
            riskText.className = 'ms-2 font-monospace fw-bold';
            riskText.style.color = '#f59e0b';
        } else {
            riskText.className = 'ms-2 font-monospace fw-bold text-cyber-green';
        }
    }

    /**
     * renderStegoSection – Renders steganography scan results
     * with confidence percentage.
     */
    function renderStegoSection(stego) {
        const container = document.getElementById('stegoContent');

        if (stego.detected) {
            // ── Hidden data WAS found ──
            container.innerHTML = `
                <div class="alert bg-cyber-purple-glow border-cyber-purple text-cyber-purple mb-4 font-monospace">
                    <div class="d-flex align-items-center mb-2">
                        <i class="fa-solid fa-triangle-exclamation fa-lg me-2"></i>
                        <strong class="text-uppercase">Potential Hidden Data Detected</strong>
                    </div>
                    <p class="text-sm mb-2">Method: ${stego.method}</p>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 rounded font-monospace text-sm" style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2);">
                            <div class="text-muted text-xs text-uppercase mb-2">Extracted Payload</div>
                            <pre class="mb-0 text-glow-purple text-sm text-wrap">${stego.payload}</pre>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded text-center" style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2);">
                            <div class="text-muted text-xs text-uppercase font-monospace mb-2">Detection Confidence</div>
                            <h2 class="font-monospace text-glow-purple mb-0">${stego.confidence}%</h2>
                            <div class="progress mt-3" style="height: 6px; background: rgba(255,255,255,0.06);">
                                <div class="progress-bar" role="progressbar"
                                     style="width: ${stego.confidence}%; background: var(--color-purple); box-shadow: 0 0 10px rgba(139,92,246,0.5);"
                                     aria-valuenow="${stego.confidence}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row g-2 mt-3">
                    <div class="col-4">
                        <div class="p-2 border border-secondary rounded text-center font-monospace text-xs" style="background:rgba(0,0,0,0.2);">
                            <div class="text-muted mb-1">Red LSB</div>
                            <span class="badge bg-success-subtle text-success px-2 py-1">Clear</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border border-secondary rounded text-center font-monospace text-xs" style="background:rgba(0,0,0,0.2);">
                            <div class="text-muted mb-1">Green LSB</div>
                            <span class="badge bg-success-subtle text-success px-2 py-1">Clear</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border border-cyber-purple rounded text-center font-monospace text-xs" style="background:rgba(139,92,246,0.06);">
                            <div class="text-cyber-purple mb-1">Blue LSB</div>
                            <span class="badge bg-cyber-purple-glow text-cyber-purple px-2 py-1">PAYLOAD</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // ── No hidden data ──
            container.innerHTML = `
                <div class="alert bg-dark border border-secondary text-muted font-monospace text-sm mb-4">
                    <div class="d-flex align-items-center mb-2">
                        <i class="fa-solid fa-shield-check fa-lg me-2 text-cyber-green"></i>
                        <strong class="text-cyber-green text-uppercase">No Hidden Data Found</strong>
                    </div>
                    <p class="mb-0 text-xs">LSB analysis shows random noise patterns consistent with normal image data.</p>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 rounded text-center" style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16,185,129,0.15);">
                            <div class="text-muted text-xs text-uppercase font-monospace mb-2">Detection Confidence</div>
                            <h2 class="font-monospace text-cyber-green mb-0">${stego.confidence}%</h2>
                            <div class="progress mt-3" style="height: 6px; background: rgba(255,255,255,0.06);">
                                <div class="progress-bar" role="progressbar"
                                     style="width: ${stego.confidence}%; background: var(--color-green); box-shadow: 0 0 10px rgba(16,185,129,0.5);"
                                     aria-valuenow="${stego.confidence}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="text-muted text-xs mt-2 font-monospace">Low noise correlation — likely clean</div>
                        </div>
                    </div>
                </div>
                <div class="row g-2 mt-3">
                    <div class="col-4">
                        <div class="p-2 border border-secondary rounded text-center font-monospace text-xs" style="background:rgba(0,0,0,0.2);">
                            <div class="text-muted mb-1">Red LSB</div>
                            <span class="badge bg-success-subtle text-success px-2 py-1">No Payload</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border border-secondary rounded text-center font-monospace text-xs" style="background:rgba(0,0,0,0.2);">
                            <div class="text-muted mb-1">Green LSB</div>
                            <span class="badge bg-success-subtle text-success px-2 py-1">No Payload</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border border-secondary rounded text-center font-monospace text-xs" style="background:rgba(0,0,0,0.2);">
                            <div class="text-muted mb-1">Blue LSB</div>
                            <span class="badge bg-success-subtle text-success px-2 py-1">No Payload</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * renderSummarySection – Renders the human-readable investigation summary
     * with an overall risk level badge.
     */
    function renderSummarySection(summaryLines, risk) {
        const container = document.getElementById('summaryContent');

        // Build paragraphs from summary lines
        let html = '';
        summaryLines.forEach((line, index) => {
            // The last line is the "Overall Risk Level" — render it as a badge
            if (index === summaryLines.length - 1) {
                let badgeClass = 'bg-success text-white';
                if (risk.level === 'High') badgeClass = 'bg-danger text-white';
                else if (risk.level === 'Medium') badgeClass = 'bg-warning text-dark';

                html += `
                    <div class="mt-4 pt-3" style="border-top: 1px solid rgba(255,255,255,0.06);">
                        <span class="text-muted text-xs text-uppercase">Overall Risk Level:</span>
                        <span class="badge ${badgeClass} ms-2 font-monospace px-3 py-2">${risk.level}</span>
                    </div>
                `;
            } else if (line.startsWith('CRITICAL:')) {
                // Highlight critical findings
                html += `
                    <div class="alert bg-cyber-red-glow border-cyber-red text-cyber-red py-2 px-3 mb-3 font-monospace text-xs">
                        <i class="fa-solid fa-triangle-exclamation me-1"></i> ${line}
                    </div>
                `;
            } else {
                html += `<p class="text-muted mb-2">${line}</p>`;
            }
        });

        container.innerHTML = html;
    }

    // ============================================================
    // UTILITIES
    // ============================================================

    /**
     * animateSections – Adds a staggered fade-in animation to each
     * forensic section card for a polished UX feel.
     */
    function animateSections() {
        const sections = document.querySelectorAll('.forensic-section');
        sections.forEach((section, i) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            setTimeout(() => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, i * 120); // 120ms stagger between sections
        });
    }

    /**
     * Copy Hash Button – Copies the SHA-256 hash to clipboard.
     */
    btnCopyHash.addEventListener('click', () => {
        const hash = document.getElementById('hashValue').textContent;
        if (!hash || hash === '—') return;

        navigator.clipboard.writeText(hash).then(() => {
            // Show "copied" confirmation
            const msg = document.getElementById('hashCopiedMsg');
            msg.classList.remove('d-none');
            setTimeout(() => msg.classList.add('d-none'), 2500);
        }).catch(() => {
            // Fallback: select and copy
            const range = document.createRange();
            range.selectNode(document.getElementById('hashValue'));
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
        });
    });

    /**
     * showError – Displays an error message below the analyze button.
     */
    function showError(msg) {
        errorMessage.textContent = msg;
        errorAlert.classList.remove('d-none');
        // Reset button
        btnAnalyze.removeAttribute('disabled');
        btnAnalyze.innerHTML = '<i class="fa-solid fa-shield-halved me-2"></i>Extract & Analyze';
    }

    /**
     * hideError – Hides the error message.
     */
    function hideError() {
        errorAlert.classList.add('d-none');
    }
    
    // Initialize report export buttons
    initializeReportButtons('Image Forensics');

});
