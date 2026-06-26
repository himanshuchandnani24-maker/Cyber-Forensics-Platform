// File: static/js/charts.js
// Reusable chart functions for Network Forensics visualization

// Cyberpunk theme colors
const CYBER_COLORS = {
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  dark: '#1e293b',
  darkBg: '#0f172a',
  muted: '#64748b'
};

// Store chart instances for cleanup
const chartInstances = {};

/**
 * Initialize Timeline Activity Chart - Line chart showing events over time
 */
function initTimelineChart(data) {
  const ctx = document.getElementById('timelineChartCanvas');
  if (!ctx || !data || !data.timeline) return;

  // Destroy existing chart if any
  if (chartInstances.timelineChart) {
    chartInstances.timelineChart.destroy();
  }

  // Group events by timestamp (assuming timeline is sorted chronologically)
  const timeMap = {};
  data.timeline.forEach(event => {
    const ts = event.timestamp || 'Unknown';
    const hour = ts.split(':')[0]; // Group by hour
    timeMap[hour] = (timeMap[hour] || 0) + 1;
  });

  const labels = Object.keys(timeMap).slice(0, 12);
  const counts = labels.map(h => timeMap[h]);

  chartInstances.timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Events per Hour',
        data: counts,
        borderColor: CYBER_COLORS.cyan,
        backgroundColor: `rgba(6, 182, 212, 0.1)`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: CYBER_COLORS.cyan,
        pointBorderColor: CYBER_COLORS.darkBg,
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: CYBER_COLORS.purple
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: CYBER_COLORS.muted,
            font: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: `rgba(15, 23, 42, 0.95)`,
          titleColor: CYBER_COLORS.cyan,
          bodyColor: CYBER_COLORS.muted,
          borderColor: CYBER_COLORS.cyan,
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace" },
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(ctx) {
              return `Events: ${ctx.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: `rgba(100, 116, 139, 0.1)` },
          ticks: { color: CYBER_COLORS.muted, font: { family: "'JetBrains Mono', monospace" } },
          title: { display: true, text: 'Hour of Day', color: CYBER_COLORS.muted }
        },
        y: {
          grid: { color: `rgba(100, 116, 139, 0.1)` },
          ticks: { color: CYBER_COLORS.muted, font: { family: "'JetBrains Mono', monospace" } },
          title: { display: true, text: 'Event Count', color: CYBER_COLORS.muted },
          beginAtZero: true
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      }
    }
  });
}

/**
 * Initialize IP Activity Distribution Chart - Pie chart of top IPs
 */
function initIPDistributionChart(data) {
  const ctx = document.getElementById('ipDistributionChartCanvas');
  if (!ctx || !data || !data.timeline) return;

  if (chartInstances.ipChart) {
    chartInstances.ipChart.destroy();
  }

  // Count IPs from timeline
  const ipCounts = {};
  data.timeline.forEach(event => {
    if (event.source_ip) {
      ipCounts[event.source_ip] = (ipCounts[event.source_ip] || 0) + 1;
    }
    if (event.destination_ip) {
      ipCounts[event.destination_ip] = (ipCounts[event.destination_ip] || 0) + 1;
    }
  });

  // Get top 6 IPs
  const sorted = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const labels = sorted.map(entry => entry[0]);
  const counts = sorted.map(entry => entry[1]);

  // Color palette for pie chart
  const colors = [
    CYBER_COLORS.cyan,
    CYBER_COLORS.purple,
    CYBER_COLORS.blue,
    CYBER_COLORS.green,
    CYBER_COLORS.red,
    CYBER_COLORS.muted
  ];

  chartInstances.ipChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: colors.map(c => `${c}cc`),
        borderColor: colors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: CYBER_COLORS.muted,
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            padding: 15,
            usePointStyle: true,
            maxWidth: 200
          }
        },
        tooltip: {
          backgroundColor: `rgba(15, 23, 42, 0.95)`,
          titleColor: CYBER_COLORS.cyan,
          bodyColor: CYBER_COLORS.muted,
          borderColor: CYBER_COLORS.cyan,
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace" },
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          callbacks: {
            label: function(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((ctx.parsed / total) * 100).toFixed(1);
              return `${ctx.label}: ${ctx.parsed} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1200
      }
    }
  });
}

/**
 * Initialize Failed Login Attempts Timeline - Bar chart showing failed logins over time
 */
function initFailedLoginsChart(data) {
  const ctx = document.getElementById('failedLoginsChartCanvas');
  if (!ctx || !data || !data.timeline) return;

  if (chartInstances.failedLoginsChart) {
    chartInstances.failedLoginsChart.destroy();
  }

  // Filter only failed login events
  const failedMap = {};
  data.timeline.forEach(event => {
    if (event.event_type === 'Authentication' && event.status === 'Failed') {
      const ts = event.timestamp || 'Unknown';
      const hour = ts.split(':')[0];
      failedMap[hour] = (failedMap[hour] || 0) + 1;
    }
  });

  const labels = Object.keys(failedMap).slice(0, 12);
  const counts = labels.map(h => failedMap[h] || 0);

  chartInstances.failedLoginsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Failed Login Attempts',
        data: counts,
        backgroundColor: CYBER_COLORS.red,
        borderColor: `${CYBER_COLORS.red}ff`,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: CYBER_COLORS.purple
      }]
    },
    options: {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: CYBER_COLORS.muted,
            font: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: `rgba(15, 23, 42, 0.95)`,
          titleColor: CYBER_COLORS.red,
          bodyColor: CYBER_COLORS.muted,
          borderColor: CYBER_COLORS.red,
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace" },
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(ctx) {
              return `Attempts: ${ctx.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: `rgba(100, 116, 139, 0.1)` },
          ticks: { color: CYBER_COLORS.muted, font: { family: "'JetBrains Mono', monospace" } },
          title: { display: true, text: 'Hour of Day', color: CYBER_COLORS.muted }
        },
        y: {
          grid: { color: `rgba(100, 116, 139, 0.1)` },
          ticks: { color: CYBER_COLORS.muted, font: { family: "'JetBrains Mono', monospace" } },
          title: { display: true, text: 'Failed Attempts', color: CYBER_COLORS.muted },
          beginAtZero: true
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      }
    }
  });
}

/**
 * Initialize Risk Score Gauge - Radial gauge showing risk level
 */
function initRiskGaugeChart(risk) {
  const ctx = document.getElementById('riskGaugeChartCanvas');
  if (!ctx || !risk) return;

  if (chartInstances.riskGauge) {
    chartInstances.riskGauge.destroy();
  }

  // Determine color based on risk level
  let gaugeColor = CYBER_COLORS.green;
  if (risk.level === 'HIGH') gaugeColor = CYBER_COLORS.red;
  else if (risk.level === 'MEDIUM') gaugeColor = CYBER_COLORS.purple;

  const riskScore = risk.score || 0;
  const remaining = 100 - riskScore;

  chartInstances.riskGauge = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Risk Score', 'Safe'],
      datasets: [{
        data: [riskScore, remaining],
        backgroundColor: [gaugeColor, `rgba(100, 116, 139, 0.2)`],
        borderColor: [gaugeColor, `rgba(100, 116, 139, 0.3)`],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      circumference: 180,
      rotation: 270,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: `rgba(15, 23, 42, 0.95)`,
          titleColor: gaugeColor,
          bodyColor: CYBER_COLORS.muted,
          borderColor: gaugeColor,
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace" },
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 10,
          callbacks: {
            label: function(ctx) {
              return `${ctx.label}: ${ctx.parsed}`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1200
      }
    },
    plugins: [{
      id: 'textCenter',
      beforeDatasetsDraw(chart) {
        const { width, height, ctx: chartCtx } = chart;
        chartCtx.restore();

        const fontSize = (height / 200).toFixed(2);
        chartCtx.font = `bold ${fontSize * 30}px 'JetBrains Mono', monospace`;
        chartCtx.textBaseline = 'middle';
        chartCtx.fillStyle = gaugeColor;

        const text = `${riskScore}%`;
        const textX = Math.round((width - chartCtx.measureText(text).width) / 2);
        const textY = height / 2;

        chartCtx.fillText(text, textX, textY);

        const levelText = risk.level || 'UNKNOWN';
        chartCtx.font = `12px 'JetBrains Mono', monospace`;
        chartCtx.fillStyle = CYBER_COLORS.muted;
        const levelX = Math.round((width - chartCtx.measureText(levelText).width) / 2);
        chartCtx.fillText(levelText, levelX, textY + 25);

        chartCtx.save();
      }
    }]
  });
}

/**
 * Initialize Port Access Heatmap - Bar chart of suspicious ports
 */
function initPortsChart(data) {
  const ctx = document.getElementById('portsChartCanvas');
  if (!ctx || !data || !data.timeline) return;

  if (chartInstances.portsChart) {
    chartInstances.portsChart.destroy();
  }

  // Count port accesses
  const portCounts = {};
  data.timeline.forEach(event => {
    if (event.port) {
      portCounts[event.port] = (portCounts[event.port] || 0) + 1;
    }
  });

  // Get top ports (suspicious ones: common ports include 22, 23, 445, etc.)
  const sorted = Object.entries(portCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(entry => `Port ${entry[0]}`);
  const counts = sorted.map(entry => entry[1]);

  // Color intensity based on access count
  const maxCount = Math.max(...counts);
  const colors = counts.map(count => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return CYBER_COLORS.red;
    if (ratio > 0.4) return CYBER_COLORS.purple;
    return CYBER_COLORS.cyan;
  });

  chartInstances.portsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Port Access Count',
        data: counts,
        backgroundColor: colors,
        borderColor: colors.map(c => `${c}ff`),
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: CYBER_COLORS.green
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: CYBER_COLORS.muted,
            font: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: `rgba(15, 23, 42, 0.95)`,
          titleColor: CYBER_COLORS.cyan,
          bodyColor: CYBER_COLORS.muted,
          borderColor: CYBER_COLORS.cyan,
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace" },
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(ctx) {
              return `Accesses: ${ctx.parsed.x}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: `rgba(100, 116, 139, 0.1)` },
          ticks: { color: CYBER_COLORS.muted, font: { family: "'JetBrains Mono', monospace" } },
          title: { display: true, text: 'Access Count', color: CYBER_COLORS.muted },
          beginAtZero: true
        },
        y: {
          grid: { display: false },
          ticks: { color: CYBER_COLORS.muted, font: { family: "'JetBrains Mono', monospace" } }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      }
    }
  });
}

/**
 * Cleanup all chart instances
 */
function destroyAllCharts() {
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  chartInstances = {};
}
