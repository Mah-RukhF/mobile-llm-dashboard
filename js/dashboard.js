// Global data storage
let experimentData = [];
let currentTab = 'overview';
        
// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    loadSampleData(); // Auto-load sample data if available
});
        
// Tab switching
function switchTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('tab-active');
        tab.classList.add('bg-white', 'hover:bg-gray-100');
    });
    
    // Show selected content
    document.getElementById(`${tabName}-content`).classList.remove('hidden');
    
    // Mark tab as active
    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.add('tab-active');
    activeTab.classList.remove('bg-white', 'hover:bg-gray-100');
    
    currentTab = tabName;
    
    // Render tab-specific content
    if (experimentData.length > 0) {
        renderTabContent(tabName);
    }
}

async function loadFromGitHub() {
  const owner = 'mah-rukhf';
  const repo = 'mobile-llm-dashboard';
  
  // Fetch index
  const indexResponse = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/data/experiments.json`
  );
  const index = await indexResponse.json();
  
  // Load selected experiments
  for (const exp of index) {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/data/experiments/${exp.filename}`
      );
      const data = await response.json();
      experimentData.push(data);
  }
}
        
// Load local files
function loadLocalFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        updateLoadStatus('Please select one or more JSON files', 'error');
        return;
    }
    
    experimentData = [];
    let loadedCount = 0;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                experimentData.push(data);
                loadedCount++;
                
                if (loadedCount === files.length) {
                    updateLoadStatus(`Successfully loaded ${loadedCount} experiment file(s)`, 'success');
                    processData();
                }
            } catch (error) {
                updateLoadStatus(`Error parsing ${file.name}: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    });
}
        
// Load sample data from GitHub repo
async function loadSampleData() {
    updateLoadStatus('Loading sample data...', 'info');
    
    try {
        // In production, this would fetch from your GitHub repo
        // For now, using the data structure from your provided JSON
        const sampleData = {
            sessionInfo: {
                sessionId: "academic_experiment_1755269523738",
                sessionType: "experiment",
                startTime: 1755269523744,
                endTime: 1755269535177,
                duration: 11433
            },
            inferences: [
                // Your inference data here
            ],
            performanceData: {
                // Your performance data here
            }
        };
        
        // Simulate loading from URL
        // const response = await fetch('./data/experiments/sample.json');
        // const sampleData = await response.json();
        
        experimentData = [sampleData];
        updateLoadStatus('Sample data loaded successfully', 'success');
        processData();
        
    } catch (error) {
        updateLoadStatus(`Error loading sample data: ${error.message}`, 'error');
    }
}
        
// Update load status message
function updateLoadStatus(message, type) {
    const statusEl = document.getElementById('loadStatus');
    statusEl.textContent = message;
    statusEl.className = 'mt-4 text-sm';
    
    switch(type) {
        case 'success':
            statusEl.classList.add('text-green-600');
            break;
        case 'error':
            statusEl.classList.add('text-red-600');
            break;
        case 'info':
            statusEl.classList.add('text-blue-600');
            break;
        default:
            statusEl.classList.add('text-gray-600');
    }
}
        
// Process loaded data
function processData() {
    console.log('Processing', experimentData.length, 'experiment(s)');
    updateOverviewMetrics();
    renderTabContent(currentTab);
}
        
// Update overview metrics
function updateOverviewMetrics() {
    if (experimentData.length === 0) return;
    
    let totalInferences = 0;
    let totalTokensPerSec = 0;
    let maxFrequency = 0;
    let totalThermalEvents = 0;
    
    experimentData.forEach(exp => {
        if (exp.inferences) {
            totalInferences += exp.inferences.length;
            
            exp.inferences.forEach(inf => {
                // Calculate tokens per second
                if (inf.tokens && inf.duration) {
                    totalTokensPerSec += (inf.tokens / (inf.duration / 1000));
                }
                
                // Find max frequency
                if (inf.systemMetrics && inf.systemMetrics.dvfs) {
                    const freq = inf.systemMetrics.dvfs.avgFrequencyKhz / 1000;
                    maxFrequency = Math.max(maxFrequency, freq);
                }
            });
        }
        
        // Count thermal events
        if (exp.performanceData && exp.performanceData.academicMetrics && 
            exp.performanceData.academicMetrics.dvfsAnalysis) {
            const thermal = exp.performanceData.academicMetrics.dvfsAnalysis.thermalAnalysis;
            if (thermal) {
                totalThermalEvents += thermal.throttlingEvents || 0;
            }
        }
    });
    
    // Update UI
    document.getElementById('totalExperiments').textContent = totalInferences;
    document.getElementById('avgTokensPerSec').textContent = 
        totalInferences > 0 ? (totalTokensPerSec / totalInferences).toFixed(1) : '0';
    document.getElementById('peakFrequency').textContent = maxFrequency.toFixed(0) + ' MHz';
    document.getElementById('thermalEvents').textContent = totalThermalEvents;
}
        
// Render tab-specific content
function renderTabContent(tabName) {
    switch(tabName) {
        case 'overview':
            renderPerformanceTimeline();
            break;
        case 'dvfs':
            renderDVFSAnalysis();
            break;
        case 'phase':
            renderPhaseComparison();
            break;
        case 'thermal':
            renderThermalAnalysis();
            break;
        case 'models':
            renderModelComparison();
            break;
        case 'power':
            renderPowerAnalysis();
            break;
        case 'data':
            renderDataTable();
            break;
    }
}
        
// Render performance timeline
function renderPerformanceTimeline() {
    const ctx = document.getElementById('performanceTimeline').getContext('2d');
    
    // Extract timeline data
    const timelineData = [];
    experimentData.forEach(exp => {
        if (exp.inferences) {
            exp.inferences.forEach((inf, idx) => {
                if (inf.phases && inf.phases.decode) {
                    timelineData.push({
                        x: idx,
                        y: inf.phases.decode.tokensPerSecond || 0
                    });
                }
            });
        }
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Tokens per Second',
                data: timelineData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Inference Number'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Tokens/Second'
                    }
                }
            }
        }
    });
}
        
// Render DVFS analysis
function renderDVFSAnalysis() {
    // Extract DVFS timeline data
    const dvfsData = [];
    
    experimentData.forEach(exp => {
        if (exp.performanceData && exp.performanceData.academicMetrics &&
            exp.performanceData.academicMetrics.systemCorrelation) {
            const dvfs = exp.performanceData.academicMetrics.systemCorrelation.dvfsDataByPhase;
            
            if (dvfs) {
                // Combine prefill and decode DVFS data
                [...(dvfs.prefill || []), ...(dvfs.decode || [])].forEach((entry, idx) => {
                    dvfsData.push({
                        time: idx * 50, // Approximate timing
                        frequency: entry.avgFrequency / 1000, // Convert to MHz
                        phase: entry.phase,
                        cores: entry.activeCores || 0
                    });
                });
            }
        }
    });
    
    // Create Plotly plot
    const trace1 = {
        x: dvfsData.map(d => d.time),
        y: dvfsData.map(d => d.frequency),
        mode: 'lines+markers',
        name: 'CPU Frequency',
        line: { color: 'rgb(75, 192, 192)', width: 2 },
        marker: { size: 4 }
    };
    
    const trace2 = {
        x: dvfsData.map(d => d.time),
        y: dvfsData.map(d => d.cores),
        mode: 'lines',
        name: 'Active Cores',
        yaxis: 'y2',
        line: { color: 'rgb(255, 99, 132)', width: 2 }
    };
    
    const layout = {
        title: 'DVFS Frequency Scaling Over Time',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Frequency (MHz)' },
        yaxis2: {
            title: 'Active Cores',
            overlaying: 'y',
            side: 'right'
        },
        hovermode: 'x unified'
    };
    
    Plotly.newPlot('dvfsPlot', [trace1, trace2], layout);
}

        
        
// Render phase comparison
function renderPhaseComparison() {
    const ctx = document.getElementById('phaseComparison').getContext('2d');
    
    // Extract phase data
    const models = [];
    const prefillData = [];
    const decodeData = [];
    
    experimentData.forEach(exp => {
        if (exp.performanceData && exp.performanceData.academicMetrics) {
            const metrics = exp.performanceData.academicMetrics;
            
            if (metrics.prefillMetrics && metrics.decodeMetrics) {
                models.push(exp.sessionInfo.sessionId.substring(0, 20));
                prefillData.push(metrics.prefillMetrics.averageTokensPerSecond || 0);
                decodeData.push(metrics.decodeMetrics.averageTokensPerSecond || 0);
            }
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: models,
            datasets: [
                {
                    label: 'Prefill TPS',
                    data: prefillData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)'
                },
                {
                    label: 'Decode TPS',
                    data: decodeData,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Prefill vs Decode Performance'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tokens per Second'
                    }
                }
            }
        }
    });
}
        
// Render data table
function renderDataTable() {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    experimentData.forEach(exp => {
        if (exp.inferences) {
            exp.inferences.forEach(inf => {
                const row = `
                    <tr>
                        <td>${inf.experimentId || 'N/A'}</td>
                        <td>${inf.model || 'N/A'}</td>
                        <td>${inf.quantLevel || 'N/A'}</td>
                        <td>${inf.contextLength || 'N/A'}</td>
                        <td>${inf.phases?.decode?.tokensPerSecond?.toFixed(2) || 'N/A'}</td>
                        <td>${inf.duration || 'N/A'}</td>
                        <td>${inf.systemMetrics?.processCpu?.toFixed(1) || 'N/A'}</td>
                        <td>${inf.systemMetrics?.dvfs ? (inf.systemMetrics.dvfs.avgFrequencyKhz / 1000).toFixed(0) : 'N/A'}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        }
    });
    
    // Initialize DataTable if not already initialized
    if (!$.fn.DataTable.isDataTable('#dataTable')) {
        $('#dataTable').DataTable({
            pageLength: 25,
            order: [[0, 'asc']]
        });
    }
}
        
// Placeholder functions for other visualizations
function renderThermalAnalysis() {
    document.getElementById('thermalPlot').innerHTML = '<p class="text-center py-20">Thermal analysis visualization coming soon...</p>';
}
        
function renderModelComparison() {
    document.getElementById('modelRadar').innerHTML = '<p class="text-center py-20">Model comparison radar chart coming soon...</p>';
}
        
function renderPowerAnalysis() {
    document.getElementById('powerPlot').innerHTML = '<p class="text-center py-20">Power analysis visualization coming soon...</p>';
    document.getElementById('energyMetrics').innerHTML = '<p class="text-center py-20">Energy metrics coming soon...</p>';
}