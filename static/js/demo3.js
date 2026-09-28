// File: static/js/demo3.js
// Network Forensics frontend: upload, preview, then analyze

(function(){
  let selectedFile = null;
  let loadedLogContent = null;  // Stores loaded log text before analysis

  function setLoading(on){
    const btnAnalyze = document.getElementById('btnAnalyzeNetwork');
    const btnUpload = document.getElementById('btnUpload');
    const btnSample = document.getElementById('btnSampleLog');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const dropZone = document.getElementById('dropZone');
    
    if(on){
      if(btnAnalyze) btnAnalyze.disabled = true;
      if(btnUpload) btnUpload.disabled = true;
      if(btnSample) btnSample.disabled = true;
      if(btnSelectFile) btnSelectFile.disabled = true;
      if(dropZone) dropZone.classList.add('opacity-75');
    } else {
      if(btnUpload) btnUpload.disabled = false;
      if(btnSample) btnSample.disabled = false;
      if(btnSelectFile) btnSelectFile.disabled = false;
      if(dropZone) dropZone.classList.remove('opacity-75');
      // Only enable analyze if we have loaded content
      if(btnAnalyze) btnAnalyze.disabled = !loadedLogContent;
    }
  }

  function showError(msg){
    if(typeof CyberToast !== 'undefined') {
      CyberToast.error(msg || 'Unknown error', { title: 'Analysis Error' });
    } else {
      alert(msg || 'Unknown error');
    }
  }

  function attachListeners(){
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const btnUpload = document.getElementById('btnUpload');
    const btnSample = document.getElementById('btnSampleLog');
    const btnAnalyze = document.getElementById('btnAnalyzeNetwork');

    if(!dropZone) return;

    // Drag & Drop - click on dropZone (but not buttons)
    if(dropZone){
      dropZone.addEventListener('click', (e)=>{
        if(e.target.closest('button')) return;
        fileInput?.click();
      });
      dropZone.addEventListener('dragover', (e)=>{
        e.preventDefault();
        dropZone.classList.add('border-cyber-green', 'drag-over');
      });
      dropZone.addEventListener('dragleave', ()=>{
        dropZone.classList.remove('border-cyber-green', 'drag-over');
      });
      dropZone.addEventListener('drop', (e)=>{
        e.preventDefault();
        dropZone.classList.remove('border-cyber-green', 'drag-over');
        const f = e.dataTransfer.files[0];
        if(f) loadFile(f);
      });
    }

    btnSelectFile?.addEventListener('click', (e)=>{
      e.stopPropagation();
      fileInput?.click();
    });
    fileInput?.addEventListener('change', (e)=>{
      const f = e.target.files[0];
      if(f) loadFile(f);
    });

    // "Upload & Load" button — reads the file and shows preview
    btnUpload?.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(selectedFile) {
        loadFile(selectedFile);
      } else {
        showError('Please select a file first.');
      }
    });

    // "Use Sample Log" button — loads sample data into preview
    btnSample?.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleLoadSample();
    });

    // "Analyze" button — sends loaded data for analysis
    btnAnalyze?.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleAnalyze();
    });
  }

  /** Read a file from disk and show its contents in the preview area */
  function loadFile(f){
    selectedFile = f;
    const uploadFilename = document.getElementById('uploadFilename');
    if(uploadFilename) uploadFilename.textContent = `${f.name} · ${Math.round(f.size/1024)} KB`;

    const reader = new FileReader();
    reader.onload = function(evt){
      loadedLogContent = evt.target.result;
      showLogPreview(loadedLogContent, f.name);
      // Enable the analyze button
      const btnAnalyze = document.getElementById('btnAnalyzeNetwork');
      if(btnAnalyze) btnAnalyze.disabled = false;
      if(typeof CyberUI !== 'undefined') CyberUI.flashElement(document.getElementById('dropZone'));
      if(typeof CyberToast !== 'undefined') CyberToast.success(`File "${f.name}" loaded. Click "Analyze Logs" to start the analysis.`, { title: 'File Loaded' });
    };
    reader.onerror = function(){
      showError('Failed to read the file.');
    };
    reader.readAsText(f);
  }

  /** Load the sample log text into preview (without analyzing) */
  async function handleLoadSample(){
    setLoading(true);
    try{
      // Fetch sample log content from the server
      const res = await fetch('/api/network/sample', { method: 'GET' });
      if(!res.ok){
        // Fallback: use built-in sample
        loadedLogContent = getBuiltInSampleLog();
      } else {
        const data = await res.json();
        loadedLogContent = data.log_content || getBuiltInSampleLog();
      }
    } catch(err){
      // Fallback if endpoint doesn't exist
      loadedLogContent = getBuiltInSampleLog();
    }
    
    showLogPreview(loadedLogContent, 'sample_network_log.log');
    
    const uploadFilename = document.getElementById('uploadFilename');
    if(uploadFilename) uploadFilename.textContent = 'Sample log (demo) loaded';
    
    const btnAnalyze = document.getElementById('btnAnalyzeNetwork');
    if(btnAnalyze) btnAnalyze.disabled = false;
    
    if(typeof CyberUI !== 'undefined') CyberUI.flashElement(document.getElementById('dropZone'));
    if(typeof CyberToast !== 'undefined') CyberToast.success('Sample network log loaded. Click "Analyze Logs" to start the analysis.', { title: 'Sample Loaded' });
    
    setLoading(false);
  }

  /** Show raw log text in the preview panel */
  function showLogPreview(text, filename){
    const previewPanel = document.getElementById('logPreviewPanel');
    const previewContent = document.getElementById('logPreviewContent');
    const previewFilename = document.getElementById('previewFilename');
    const previewLineCount = document.getElementById('previewLineCount');

    if(!previewPanel || !previewContent) return;

    const lines = text.trim().split('\n');
    
    if(previewFilename) previewFilename.textContent = filename || 'Uploaded File';
    if(previewLineCount) previewLineCount.textContent = `${lines.length} lines`;

    // Show the preview (truncate at 200 lines for display)
    const displayLines = lines.slice(0, 200);
    previewContent.textContent = displayLines.join('\n');
    if(lines.length > 200){
      previewContent.textContent += `\n\n... (${lines.length - 200} more lines)`;
    }

    previewPanel.classList.remove('d-none');
  }

  /** Send the loaded log content to the backend for analysis */
  async function handleAnalyze(){
    if(!loadedLogContent){
      showError('No log data loaded. Please upload a file or use the sample log first.');
      return;
    }
    setLoading(true);
    try{
      const res = await fetch('/api/analyze/network', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ logtext: loadedLogContent })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Analysis failed');
      renderAnalysisResponse(data);
      if(typeof CyberToast !== 'undefined') CyberToast.success('Network log analysis complete!', { title: 'Analysis Done' });
    }catch(err){
      console.error(err);
      showError(err.message);
    }finally{ setLoading(false); }
  }

  function renderAnalysisResponse(payload){
    if(!payload || !payload.analysis) return;
    const analysis = payload.analysis;
    const risk = payload.risk_assessment || {level:'LOW', score:0, reasons:['None']};
    const summary = payload.summary || [];

    // Store data for export (safe call)
    try {
      if(typeof setCurrentAnalysisData === 'function') setCurrentAnalysisData(analysis);
    } catch(e) { console.warn('setCurrentAnalysisData not available:', e); }
    
    // Show export buttons with animation (safe call)
    try {
      if(typeof CyberUI !== 'undefined' && CyberUI.revealExportButtons) {
        CyberUI.revealExportButtons('#exportPDFBtn, #exportCSVBtn, #exportJSONBtn');
      }
    } catch(e) { console.warn('revealExportButtons error:', e); }

    // Update dashboard stats
    const statTotal = document.getElementById('statTotalEvents');
    const statIPs = document.getElementById('statUniqueIPs');
    const statFailed = document.getElementById('statFailedLogins');
    const statSuspicious = document.getElementById('statSuspicious');
    const statRiskLevel = document.getElementById('statRiskLevel');

    if(statTotal) statTotal.textContent = analysis.total_events || 0;
    const uniqueIPs = (analysis.unique_source_ips || 0) + (analysis.unique_dest_ips || 0);
    if(statIPs) statIPs.textContent = uniqueIPs || 0;
    if(statFailed) statFailed.textContent = analysis.failed_logins || 0;
    if(statSuspicious) statSuspicious.textContent = analysis.suspicious_activities || 0;
    if(statRiskLevel) statRiskLevel.textContent = risk.level || 'LOW';

    // Risk badge
    renderRiskBadge(risk);
    renderIPTable(analysis);
    renderAuthEvents(analysis);
    renderThreats(analysis);
    renderTimeline(analysis.timeline || []);
    renderSummary(summary, risk);
  }

  function renderRiskBadge(risk){
    const container = document.getElementById('riskBadgeContainer');
    if(!container) return;
    container.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'badge font-monospace';
    if(risk.level === 'HIGH'){
      badge.classList.add('bg-danger', 'text-light');
      badge.textContent = `HIGH (${risk.score}/100)`;
    } else if(risk.level === 'MEDIUM'){
      badge.classList.add('bg-warning', 'text-dark');
      badge.textContent = `MEDIUM (${risk.score}/100)`;
    } else {
      badge.classList.add('bg-success', 'text-light');
      badge.textContent = `LOW (${risk.score}/100)`;
    }
    container.appendChild(badge);
  }

  function renderIPTable(analysis){
    const tbody = document.getElementById('ipTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const counts = {};
    const timeline = analysis.timeline || [];
    timeline.forEach(ev =>{
      if(ev.source_ip){ counts[ev.source_ip] = (counts[ev.source_ip]||0)+1; }
      if(ev.destination_ip){ counts[ev.destination_ip] = (counts[ev.destination_ip]||0)+1; }
    });

    const entries = [];
    (analysis.source_ips || []).forEach(ip => entries.push({ip, role:'Source', events: counts[ip]||0}));
    (analysis.dest_ips || []).forEach(ip => entries.push({ip, role:'Destination', events: counts[ip]||0}));

    const map = {};
    entries.forEach(e=>{
      if(!map[e.ip] || map[e.ip].events < e.events){ map[e.ip] = e; }
    });
    const final = Object.values(map).sort((a,b)=>b.events - a.events).slice(0,50);
    if(final.length===0){ tbody.innerHTML = '<tr><td colspan="3" class="text-muted">No IP data</td></tr>'; return; }
    final.forEach(row=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="font-monospace text-sm">${row.ip}</td><td class="text-sm">${row.role}</td><td class="text-cyber-primary font-monospace text-sm">${row.events}</td>`;
      tbody.appendChild(tr);
    });
  }

  function renderAuthEvents(analysis){
    const ul = document.getElementById('authEventsList');
    if(!ul) return;
    ul.innerHTML = '';
    const s = analysis.successful_logins||0;
    const f = analysis.failed_logins||0;
    if(s===0 && f===0){ ul.innerHTML = '<li class="list-group-item bg-dark text-muted font-monospace text-sm">No authentication events</li>'; return; }
    
    const liSuccess = document.createElement('li');
    liSuccess.className = 'list-group-item bg-dark font-monospace text-sm';
    liSuccess.innerHTML = `<span class="text-cyber-green">✓ Successful Logins:</span> <strong>${s}</strong>`;
    ul.appendChild(liSuccess);
    
    const liFailed = document.createElement('li');
    liFailed.className = 'list-group-item bg-dark font-monospace text-sm';
    liFailed.innerHTML = `<span class="text-cyber-red">✗ Failed Attempts:</span> <strong>${f}</strong>`;
    ul.appendChild(liFailed);

    const bf = analysis.brute_force_ips || {};
    if(Object.keys(bf).length){
      Object.entries(bf).slice(0,3).forEach(([ip,count])=>{
        const li = document.createElement('li');
        li.className = 'list-group-item bg-dark font-monospace text-sm text-danger';
        li.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-1"></i>Brute force from <strong>${ip}</strong> — ${count} failed`;
        ul.appendChild(li);
      });
    }
  }

  function renderThreats(analysis){
    const container = document.getElementById('threatList');
    if(!container) return;
    container.innerHTML = '';
    let found=false;
    
    (analysis.suspicious_ports_detected||[]).forEach(port =>{
      found=true;
      const div = document.createElement('div');
      div.className = 'col-md-4 col-sm-6';
      div.innerHTML = `<div class="card bg-dark border-danger p-3 font-monospace text-sm"><i class="fa-solid fa-network-wired me-1" style="color:#ef4444;"></i><strong>Port ${port}</strong><div class="text-muted text-xs">Suspicious port access detected</div></div>`;
      container.appendChild(div);
    });
    
    const repeated = analysis.repeated_connections||{};
    Object.entries(repeated).slice(0,5).forEach(([k,v])=>{
      found=true;
      const div = document.createElement('div');
      div.className='col-md-4 col-sm-6';
      div.innerHTML = `<div class="card bg-dark border-warning p-3 font-monospace text-sm"><i class="fa-solid fa-arrows-repeat me-1" style="color:#ffc107;"></i><strong class="text-truncate">${k}</strong><div class="text-muted text-xs">${v} repeated attempts</div></div>`;
      container.appendChild(div);
    });
    
    if(!found) container.innerHTML = '<div class="col-12 text-muted font-monospace text-sm"><i class="fa-solid fa-shield me-1"></i>No threats detected</div>';
  }

  function renderTimeline(timeline){
    const tbody = document.getElementById('timelineBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(!timeline || !timeline.length){ tbody.innerHTML = '<tr><td colspan="3" class="text-muted font-monospace text-sm">No timeline events</td></tr>'; return; }
    timeline.forEach(ev=>{
      const tr = document.createElement('tr');
      const ts = `<td class="font-monospace text-xs text-muted">${ev.timestamp||'-'}</td>`;
      const type = `<td class="font-monospace text-sm"><span class="badge bg-secondary">${ev.event_type || 'Unknown'}</span></td>`;
      const desc = `<td class="font-monospace text-xs text-muted">${ev.details || (ev.status? ev.status : '')} ${ev.source_ip? '→ '+ev.source_ip: ''} ${ev.destination_ip? ' → '+ev.destination_ip+':'+ev.port : ''}</td>`;
      tr.innerHTML = ts+type+desc;
      tbody.appendChild(tr);
    });
  }

  function renderSummary(lines, risk){
    const container = document.getElementById('investigationSummary');
    if(!container) return;
    
    // If no summary lines, show default message
    if(!lines || !lines.length){
      container.innerHTML = '<div class="text-muted">No summary available. Upload logs to generate an investigative report.</div>';
      return;
    }

    container.innerHTML = '';
    
    lines.forEach((line)=>{
      // Skip empty lines but add spacing
      if(!line || !line.trim()){
        const spacer = document.createElement('div');
        spacer.style.height = '8px';
        container.appendChild(spacer);
        return;
      }

      const div = document.createElement('div');
      div.className = 'mb-2 font-monospace text-sm';
      
      // Title line
      if(line === 'Network Traffic Investigation Summary'){
        div.className = 'mb-3 font-monospace fw-bold';
        div.innerHTML = `<i class="fa-solid fa-file-signature me-2 text-cyber-blue"></i><span class="text-glow-blue">${line}</span>`;
      }
      // Critical / Warning / Brute force lines
      else if(line.includes('WARNING') || line.includes('URGENT') || line.includes('Brute force') || line.includes('brute force') || line.includes('Password Guessing')){
        div.classList.add('text-danger');
        div.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-1"></i>${line}`;
      }
      // Medium risk or suspicious
      else if(line.includes('MEDIUM') || line.includes('Suspicious') || line.includes('suspicious') || line.includes('Probed') || line.includes('probed')){
        div.classList.add('text-warning');
        div.innerHTML = `<i class="fa-solid fa-exclamation-circle me-1"></i>${line}`;
      }
      // Risk assessment line
      else if(line.includes('Overall Risk Assessment')){
        const riskLevel = (risk && risk.level) || 'LOW';
        const colorClass = riskLevel === 'HIGH' ? 'text-danger' : riskLevel === 'MEDIUM' ? 'text-warning' : 'text-cyber-green';
        div.className = `mb-2 font-monospace text-sm fw-bold ${colorClass}`;
        div.innerHTML = `<i class="fa-solid fa-gauge-high me-1"></i>${line}`;
      }
      // Recommendation / Action lines
      else if(line.includes('Recommend') || line.includes('Action') || line.includes('Next Steps')){
        div.classList.add('text-cyber-green');
        div.innerHTML = `<i class="fa-solid fa-arrow-right me-1"></i><strong>${line}</strong>`;
      }
      // Numbered recommendation steps (e.g., "  1. Block...")
      else if(line.match(/^\s+\d+\.\s/)){
        div.classList.add('text-cyber-green');
        div.innerHTML = `&nbsp;&nbsp;${line.trim()}`;
      }
      // Sub-items with bullet (e.g., "  • Failed...")
      else if(line.includes('•')){
        div.classList.add('text-muted');
        div.innerHTML = `&nbsp;&nbsp;${line.trim()}`;
      }
      // Section headers (e.g., "Login Activity Summary:")
      else if(line.endsWith(':')){
        div.className = 'mb-2 mt-2 font-monospace text-sm fw-bold text-cyber-blue';
        div.innerHTML = `<i class="fa-solid fa-caret-right me-1"></i>${line}`;
      }
      // Default
      else {
        div.classList.add('text-muted');
        div.textContent = line;
      }
      
      container.appendChild(div);
    });
  }

  /** Built-in sample log as fallback */
  function getBuiltInSampleLog(){
    return `[2026-06-25 10:01:15] [USER_LOGIN] 192.168.1.100 -> 192.168.1.50:22 [SUCCESS] SSH login successful
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
[2026-06-25 10:14:00] [FIREWALL_BLOCK] 203.45.67.89 -> 192.168.1.50:22 [BLOCKED] IP blocked after 10 failed attempts`;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    attachListeners();
    // Initialize report export buttons
    if(typeof initializeReportButtons === 'function') initializeReportButtons('Network Forensics');
  });

})();
