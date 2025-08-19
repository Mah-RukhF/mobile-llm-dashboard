class Dashboard {
  constructor() {
    this.data = null;
    this.charts = {};
    this.colors = {
      teal: '#1FB8CD',
      tealDark: '#0F6E7B',
      orange: '#F59E0B',
      red: '#EF4444',
      blue: '#3B82F6',
      purple: '#8B5CF6',
      gray: '#6B7280'
    };

    this.initUI();
    this.initDnD();
    this.initCharts();
    this.tryListHosted();
  }

  initUI() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.openHostedBtn = document.getElementById('openHostedBtn');
    this.hostedDialog = document.getElementById('hostedDialog');
    this.hostedList = document.getElementById('hostedList');

    this.uploadBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.loadFromFile(file);
    });

    this.openHostedBtn.addEventListener('click', () => {
      this.populateHostedList();
      this.hostedDialog.showModal();
    });
  }

  initDnD() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      document.body.classList.add('drag-over');
    });
    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
      document.body.classList.remove('drag-over');
    });
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      document.body.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.;
      if (file && file.name.endsWith('.json')) {
        this.loadFromFile(file);
      }
    });
  }

  initCharts() {
    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}` } }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.06)' } },
        y: { grid: { color: 'rgba(0,0,0,0.06)' } }
      }
    };

    this.charts.dvfs = new Chart(
      document.getElementById('dvfsChart'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{ label: 'Avg CPU freq (kHz)', data: [], borderColor: this.colors.teal, tension: 0.2 }]
        },
        options: {
          ...commonOpts,
          scales: {
            x: { title: { display: true, text: 'Timestamp' } },
            y: { title: { display: true, text: 'Frequency (kHz)' } }
          }
        }
      }
    );

    this.charts.sys = new Chart(
      document.getElementById('sysChart'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            { label: 'Process CPU %', data: [], borderColor: this.colors.orange, yAxisID: 'y' },
            { label: 'Process Memory (MB)', data: [], borderColor: this.colors.purple, yAxisID: 'y1' }
          ]
        },
        options: {
          ...commonOpts,
          scales: {
            x: { title: { display: true, text: 'Timestamp' } },
            y: { title: { display: true, text: 'CPU %' }, min: 0, max: 100 },
            y1: { title: { display: true, text: 'Memory (MB)' }, position: 'right', grid: { drawOnChartArea: false } }
          }
        }
      }
    );

    this.charts.model = new Chart(
      document.getElementById('modelChart'),
      {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
          ...commonOpts,
          scales: {
            x: { title: { display: true, text: 'Model' } },
            y: { title: { display: true, text: 'Tokens/sec' } }
          }
        }
      }
    );

    this.charts.thermal = new Chart(
      document.getElementById('thermalChart'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Avg CPU freq (kHz)',
            data: [],
            borderColor: this.colors.red,
            backgroundColor: 'rgba(239,68,68,0.15)',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          ...commonOpts,
          scales: {
            x: { title: { display: true, text: 'Timestamp' } },
            y: { title: { display: true, text: 'Frequency (kHz)' } }
          }
        }
      }
    );

    this.charts.timeline = new Chart(
      document.getElementById('timelineChart'),
      {
        type: 'scatter',
        data: {
          datasets: [
            { label: 'Tokens', data: [], backgroundColor: this.colors.blue, showLine: false }
          ]
        },
        options: {
          ...commonOpts,
          scales: {
            x: { title: { display: true, text: 'Timestamp' } },
            y: { title: { display: true, text: 'Frequency (kHz)' } }
          }
        }
      }
    );
  }

  async loadFromFile(file) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      this.loadData(json, file.name);
    } catch (e) {
      this.notify(`Failed to parse JSON: ${e.message}`, true);
    }
  }

  async tryListHosted() {
    // Add cache buster to defeat Pages caching while you iterate
    try {
      const resp = await fetch('./data/index.json?' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) return;
      const index = await resp.json();
      this.hostedIndex = index;
    } catch {
      // ignore missing index.json
    }
  }

  populateHostedList() {
    const list = this.hostedList;
    list.innerHTML = '';

    const hint = document.createElement('div');
    hint.className = 'dialog__hint';
    hint.textContent = 'Add JSON files to docs/data/ and refresh, or include docs/data/index.json.';
    list.appendChild(hint);

    const fallback = ['sample_mobile_llm_experiment.json'];
    const items = this.hostedIndex?.sessions?.map(s => ({ label: s.name || s.file, file: s.file })) ??
                  fallback.map(f => ({ label: f, file: `./data/${f}` }));

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dialog__item';
      btn.textContent = item.label;
      btn.onclick = async () => {
        try {
          const resp = await fetch(item.file, { cache: 'no-store' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          this.loadData(json, item.label);
          this.hostedDialog.close();
        } catch (e) {
          this.notify(`Failed to load hosted file: ${e.message}`, true);
        }
      };
      list.appendChild(btn);
    });
  }

  loadData(json, sourceName = 'Loaded JSON') {
    if (!json.sessionInfo || !json.performanceData) {
      this.notify('Invalid schema: expected sessionInfo and performanceData.', true);
      return;
    }
    this.data = json;
    this.updateSummary(sourceName);
    this.renderDvfs();
    this.renderSystem();
    this.renderModelPerf();
    this.renderThermal();
    this.renderTimeline();
    this.notify(`Loaded: ${sourceName}`);
  }

  updateSummary() {
    const s = this.data.sessionInfo || {};
    const perf = this.data.performanceData?.academicMetrics || {};
    const totalInferences = perf.totalInferences ?? (this.data.inferences?.length ?? '—');
    const totalTokens = this.safeTokensTotal(this.data);

    document.getElementById('sumSessionId').textContent = s.sessionId ?? '—';
    document.getElementById('sumDuration').textContent = s.duration != null ? `${s.duration}ms` : '—';
    document.getElementById('sumInferences').textContent = totalInferences;
    document.getElementById('sumTokens').textContent = totalTokens;
  }

  safeTokensTotal(d) {
    try {
      const sum1 = d.performanceData?.summary?.totalTokensProcessed;
      if (typeof sum1 === 'number') return sum1;
      const inf = d.inferences || [];
      const total = inf.reduce((acc, x) => acc + (x.tokens || 0), 0);
      return total || '—';
    } catch {
      return '—';
    }
  }

  renderDvfs() {
    const points = this.data.performanceData?.academicMetrics?.systemCorrelation?.dvfsDataByPhase?.decode ?? [];
    const labels = points.map(p => new Date(p.timestamp).toLocaleTimeString());
    const freqs = points.map(p => p.avgFrequency);
    const ds = this.charts.dvfs.data;
    ds.labels = labels;
    ds.datasets[0].data = freqs;
    this.charts.dvfs.update();
  }

  renderSystem() {
    const cpuPts = this.data.performanceData?.academicMetrics?.systemCorrelation?.cpuUsageByPhase?.decode ?? [];
    const memPts = this.data.performanceData?.academicMetrics?.systemCorrelation?.memoryUsageByPhase?.decode ?? [];
    const labels = cpuPts.map(p => new Date(p.timestamp).toLocaleTimeString());
    const cpu = cpuPts.map(p => p.processCpu);
    const mem = memPts.map(p => (p.processMemory ?? 0));
    const ds = this.charts.sys.data;
    ds.labels = labels;
    ds.datasets.data = cpu;
    ds.datasets[1].data = mem;
    this.charts.sys.update();
  }

  renderModelPerf() {
    const inferences = this.data.inferences || [];
    const perModel = new Map();
    for (const inf of inferences) {
      const model = inf.model || inf.modelName || 'Unknown';
      const prefillTPS = inf?.phases?.prefill?.tokensPerSecond;
      const decodeTPS = inf?.phases?.decode?.tokensPerSecond;
      const entry = perModel.get(model) || { prefill: [], decode: [] };
      if (typeof prefillTPS === 'number') entry.prefill.push(prefillTPS);
      if (typeof decodeTPS === 'number') entry.decode.push(decodeTPS);
      perModel.set(model, entry);
    }
    const labels = Array.from(perModel.keys());
    const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const prefill = labels.map(m => avg(perModel.get(m).prefill));
    const decode = labels.map(m => avg(perModel.get(m).decode));
    const ds = this.charts.model.data;
    ds.labels = labels;
    ds.datasets = [
      { label: 'Prefill TPS', backgroundColor: this.colors.teal, data: prefill },
      { label: 'Decode TPS', backgroundColor: this.colors.blue, data: decode }
    ];
    this.charts.model.update();
  }

  renderThermal() {
    const points = this.data.performanceData?.academicMetrics?.systemCorrelation?.dvfsDataByPhase?.decode ?? [];
    const labels = points.map(p => new Date(p.timestamp).toLocaleTimeString());
    const freqs = points.map(p => p.avgFrequency);
    const ds = this.charts.thermal.data;
    ds.labels = labels;
    ds.datasets[0].data = freqs;
    this.charts.thermal.update();
  }

  renderTimeline() {
    const points = this.data.performanceData?.academicMetrics?.systemCorrelation?.dvfsDataByPhase?.decode ?? [];
    const dataset = points.map(p => ({ x: new Date(p.timestamp), y: p.avgFrequency }));
    const ds = this.charts.timeline.data;
    ds.datasets.data = dataset;
    this.charts.timeline.update();
  }

  notify(message, isError = false) {
    const bar = document.getElementById('notice');
    bar.textContent = message;
    bar.classList.toggle('notice--error', !!isError);
  }
}

window.addEventListener('DOMContentLoaded', () => new Dashboard());
