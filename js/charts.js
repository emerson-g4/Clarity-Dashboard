// =====================================================================
// charts.js — funções helpers de criação de gráficos Chart.js
// =====================================================================

function mkChart(id, type, data, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el._chart) el._chart.destroy();
  const inst = new Chart(el, {
    type,
    data,
    options: deepMerge(CHART_DEFAULTS, opts),
  });
  el._chart = inst;
  return inst;
}

function mkDoughnut(id, labels, values, colors) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el._chart) el._chart.destroy();
  const inst = new Chart(el, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 1, borderColor: C.bg }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: C.text, font: { size: 11 }, boxWidth: 12 } },
      },
    },
  });
  el._chart = inst;
  return inst;
}

function mkBarH(id, labels, values, color, label = '') {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el._chart) el._chart.destroy();
  const inst = new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: color + '99', borderColor: color, borderWidth: 1, borderRadius: 4 }],
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
    },
  });
  el._chart = inst;
  return inst;
}

function mkLine(id, labels, datasets, extraOpts = {}) {
  return mkChart(id, 'line', { labels, datasets }, extraOpts);
}

function mkBar(id, labels, datasets, extraOpts = {}) {
  return mkChart(id, 'bar', { labels, datasets }, extraOpts);
}

// Atenção: gráfico de área para Attention Map
function mkAttention(id, celularData, pcData) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el._chart) el._chart.destroy();

  const labels = (celularData || pcData || []).map(d => d.depth);
  const datasets = [];

  if (celularData && celularData.length) {
    datasets.push({
      label: 'Celular',
      data: celularData.map(d => parseFloat(d.pct) || 0),
      backgroundColor: C.teal + '55',
      borderColor: C.teal,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    });
  }
  if (pcData && pcData.length) {
    datasets.push({
      label: 'PC',
      data: pcData.map(d => parseFloat(d.pct) || 0),
      backgroundColor: C.primary + '55',
      borderColor: C.primary,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    });
  }

  const inst = new Chart(el, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: C.text, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}% da sessão`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Profundidade de Rolagem', color: C.text }, ticks: { color: C.text }, grid: { color: C.grid } },
        y: { title: { display: true, text: '% da Duração da Sessão', color: C.text }, ticks: { color: C.text, callback: v => v + '%' }, grid: { color: C.grid } },
      },
    },
  });
  el._chart = inst;
  return inst;
}

// Gráfico radar para comparação de dois dias
function mkRadar(id, labels, dataA, dataB, labelA, labelB) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el._chart) el._chart.destroy();
  const inst = new Chart(el, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        { label: labelA, data: dataA, borderColor: C.primary, backgroundColor: C.primary + '33', pointBackgroundColor: C.primary },
        { label: labelB, data: dataB, borderColor: C.teal,    backgroundColor: C.teal + '33',    pointBackgroundColor: C.teal },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: C.text } } },
      scales: {
        r: {
          angleLines: { color: C.grid },
          grid: { color: C.grid },
          pointLabels: { color: C.text, font: { size: 11 } },
          ticks: { color: C.text, backdropColor: 'transparent' },
        },
      },
    },
  });
  el._chart = inst;
  return inst;
}

// Utilitário: deep merge simples para options
function deepMerge(base, override) {
  const out = Object.assign({}, base);
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      out[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

// Paleta de cores para séries múltiplas
const SERIES_COLORS = [C.primary, C.teal, C.success, C.warning, C.purple, C.danger, C.orange, C.pink];
