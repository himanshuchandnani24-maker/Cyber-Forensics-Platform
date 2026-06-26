// File: static/js/demo3.js
// Network Forensics frontend: upload, fetch, render results

(function(){
  let selectedFile = null;

  function setLoading(on){
    const btnUpload = document.getElementById('btnUpload');
    const btnSample = document.getElementById('btnSampleLog');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const dropZone = document.getElementById('dropZone');
    
    if(on){
      if(btnUpload) btnUpload.disabled = true;
      if(btnSample) btnSample.disabled = true;
      if(btnSelectFile) btnSelectFile.disabled = true;
      if(dropZone) dropZone.classList.add('opacity-75');
    } else {
      if(btnUpload) btnUpload.disabled = false;
      if(btnSample) btnSample.disabled = false;
      if(btnSelectFile) btnSelectFile.disabled = false;
      if(dropZone) dropZone.classList.remove('opacity-75');
    }
  }

  function showError(msg){
    CyberToast.error(msg || 'Unknown error', { title: 'Analysis Error' });
  }

  function attachListeners(){
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const btnUpload = document.getElementById('btnUpload');
    const btnSample = document.getElementById('btnSampleLog');

    if(!dropZone || !btnUpload || !btnSample) return;

    // Drag & Drop - click on dropZone (but not buttons)
    if(dropZone){
      dropZone.addEventListener('click', (e)=>{
        // Don't trigger file picker if clicking on buttons
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
        if(f) setFile(f);
      });
    }

    btnSelectFile?.addEventListener('click', (e)=>{
      e.stopPropagation();
      fileInput?.click();
    });
    fileInput?.addEventListener('change', (e)=>{
      const f = e.target.files[0];
      if(f) setFile(f);
    });

    btnUpload?.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleUpload();
    });
    btnSample?.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleSample();
    });
  }

  function setFile(f){
    selectedFile = f;
    const uploadFilename = document.getElementById('uploadFilename');
    if(uploadFilename) uploadFilename.textContent = `${f.name} · ${Math.round(f.size/1024)} KB`;
    CyberUI.flashElement(document.getElementById('dropZone'));
  }

  async function handleUpload(){
    if(!selectedFile){ showError('Please select a file or use the sample log.'); return; }
    setLoading(true);
    try{
      const fd = new FormData();
      fd.append('logfile', selectedFile);
      const res = await fetch('/api/analyze/network', { method: 'POST', body: fd });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Analysis failed');
      renderAnalysisResponse(data);
    }catch(err){
      console.error(err);
      showError(err.message);
    }finally{ setLoading(false); }
  }

  async function handleSample(){
    setLoading(true);
    try{
      const res = await fetch('/api/analyze/network', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({sample:'demo'}) });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Analysis failed');
      renderAnalysisResponse(data);
      const uploadFilename = document.getElementById('uploadFilename');
      if(uploadFilename) uploadFilename.textContent = 'Sample log (demo) loaded';
      CyberUI.flashElement(document.getElementById('dropZone'));
      CyberToast.success('Sample network log loaded and analyzed.', { title: 'Sample Loaded' });
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

    // Store data for export
    setCurrentAnalysisData(analysis);
    
    // Show export buttons with animation
    CyberUI.revealExportButtons('#exportPDFBtn, #exportCSVBtn, #exportJSONBtn');

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
    renderSummary(summary);
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

  function renderSummary(lines){
    const container = document.getElementById('investigationSummary');
    if(!container) return;
    if(!lines || !lines.length){ container.textContent = 'No summary available. Upload logs to generate an investigative report.'; return; }
    container.innerHTML = '';
    lines.forEach((line)=>{
      const div = document.createElement('div');
      div.className = 'mb-2 font-monospace text-sm';
      if(line.includes('CRITICAL') || line.includes('Brute force')){
        div.classList.add('text-danger');
        div.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-1"></i>${line}`;
      } else if(line.includes('MEDIUM') || line.includes('Suspicious')){
        div.classList.add('text-warning');
        div.innerHTML = `<i class="fa-solid fa-exclamation-circle me-1"></i>${line}`;
      } else if(line.includes('Recommendation') || line.includes('Action')){
        div.classList.add('text-cyber-green');
        div.innerHTML = `<i class="fa-solid fa-arrow-right me-1"></i>${line}`;
      } else {
        div.classList.add('text-light');
        div.textContent = line;
      }
      container.appendChild(div);
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    attachListeners();
    // Initialize report export buttons
    initializeReportButtons('Network Forensics');
  });

})();
