// =====================================================================
// render.js — renderMonth, renderDay, renderCompare, renderAttention
// =====================================================================

// ── Helpers ──────────────────────────────────────────────────────────

function scoreColor(s) {
  return s >= 80 ? 'green' : s >= 70 ? 'yellow' : 'red';
}

function perfColor(val, good, warn) {
  return val <= good ? 'var(--success)' : val <= warn ? 'var(--warning)' : 'var(--danger)';
}

function perfBar(val, max) {
  return Math.min(100, (val / max) * 100).toFixed(0);
}

function kpi(cls, label, value, sub = '') {
  return `<div class="kpi ${cls}"><div class="label">${label}${tipIcon(label)}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
}

function section(title) {
  return `<div class="section-title">${title}</div>`;
}

// ── Renderizar aba de MÊS (visão geral do mês) ───────────────────────

function renderMonth(container, monthLabel, allData) {
  const days = Object.keys(allData);
  if (!days.length) { container.innerHTML = '<p style="padding:40px;color:var(--text-muted)">Sem dados para este mês.</p>'; return; }

  const totalSessoes   = days.reduce((s, d) => s + allData[d].sessions.total, 0);
  const mediaSessoes   = Math.round(totalSessoes / days.length);
  const scores         = days.map(d => allData[d].performance.score).filter(s => s > 0);
  const melhorScore    = scores.length ? Math.max(...scores) : 0;
  const piorScore      = scores.length ? Math.min(...scores) : 0;
  const melhorDia      = days.find(d => allData[d].performance.score === melhorScore) || '';
  const piorDia        = days.find(d => allData[d].performance.score === piorScore) || '';
  const totalErros     = days.reduce((s, d) => s + allData[d].jsErrors.reduce((ss, e) => ss + e.sessions, 0), 0);
  const mediaPaginas   = (days.reduce((s, d) => s + allData[d].engagement.pagesPerSession, 0) / days.length).toFixed(2);
  const scrollVals     = days.map(d => parseFloat((allData[d].engagement.scrollDepth || '0').replace('%', '').replace(',', '.'))).filter(v => v > 0);
  const mediaScroll    = scrollVals.length ? (scrollVals.reduce((s, v) => s + v, 0) / scrollVals.length).toFixed(1) : '0';
  const maxBots        = Math.max(...days.map(d => allData[d].sessions.bots));
  const maxBotDia      = days.find(d => allData[d].sessions.bots === maxBots) || '';
  const maxBotPct      = allData[maxBotDia] ? ((maxBots / allData[maxBotDia].sessions.total) * 100).toFixed(0) : 0;

  container.innerHTML = `
    <div class="kpi-grid">
      ${kpi('blue',   'Total de Sessões', totalSessoes.toLocaleString('pt-BR'), `${days[0]} a ${days[days.length-1]}`)}
      ${kpi('yellow', 'Média Sessões/Dia', mediaSessoes, `${days.length} dias`)}
      ${kpi('green',  'Melhor Performance', melhorScore, melhorDia)}
      ${kpi('red',    'Pior Performance', piorScore, piorDia)}
      ${kpi('red',    'Total Erros JS', totalErros, `${days.length} dias`)}
      ${kpi('purple', 'Média Páginas/Sessão', mediaPaginas, 'período')}
      ${kpi('yellow', 'Média Rolagem', mediaScroll + '%', 'período')}
      ${kpi('red',    'Maior Pico de Bots', maxBots, `${maxBotDia} — ${maxBotPct}% do tráfego`)}
    </div>

    <div class="charts-row">
      <div class="chart-card"><h3>Sessões por Dia</h3><div class="chart-wrap"><canvas id="m-sessoes"></canvas></div></div>
      <div class="chart-card"><h3>Score de Performance por Dia</h3><div class="chart-wrap"><canvas id="m-perf"></canvas></div></div>
    </div>
    <div class="charts-row">
      <div class="chart-card"><h3>Humanos vs Bots</h3><div class="chart-wrap"><canvas id="m-bots"></canvas></div></div>
      <div class="chart-card"><h3>Erros JS por Dia</h3><div class="chart-wrap"><canvas id="m-erros"></canvas></div></div>
    </div>
    <div class="charts-row">
      <div class="chart-card"><h3>LCP por Dia (alvo &lt; 2,5s)</h3><div class="chart-wrap"><canvas id="m-lcp"></canvas></div></div>
      <div class="chart-card"><h3>INP por Dia (alvo &lt; 200ms)</h3><div class="chart-wrap"><canvas id="m-inp"></canvas></div></div>
    </div>
    <div class="charts-row">
      <div class="chart-card"><h3>CLS por Dia (alvo &lt; 0,1)</h3><div class="chart-wrap"><canvas id="m-cls"></canvas></div></div>
      <div class="chart-card"><h3>Dispositivos (acumulado)</h3><div class="chart-wrap"><canvas id="m-disp"></canvas></div></div>
    </div>
    <div class="charts-row">
      <div class="chart-card"><h3>Canais de Tráfego por Dia</h3><div class="chart-wrap tall"><canvas id="m-canais"></canvas></div></div>
      <div class="chart-card"><h3>Top Erros JS (período)</h3><div class="chart-wrap tall"><canvas id="m-errotipo"></canvas></div></div>
    </div>
  `;

  // --- Gráficos ---
  const lcpVals = days.map(d => parseFloat((allData[d].performance.lcp || '0').replace(',', '.').replace('s', '')) || 0);
  const inpVals = days.map(d => parseFloat((allData[d].performance.inp || '0').replace(',', '.').replace('ms', '')) || 0);
  const clsVals = days.map(d => parseFloat((allData[d].performance.cls || '0').replace(',', '.')) || 0);
  const errsByDay = days.map(d => allData[d].jsErrors.reduce((s, e) => s + e.sessions, 0));

  mkBar('m-sessoes', days, [
    { label: 'Sessões Humanas', data: days.map(d => allData[d].sessions.human), backgroundColor: C.primary + '99', borderColor: C.primary, borderWidth: 1, borderRadius: 4 },
    { label: 'Bots',            data: days.map(d => allData[d].sessions.bots),  backgroundColor: C.danger  + '99', borderColor: C.danger,  borderWidth: 1, borderRadius: 4 },
  ], { plugins: { legend: { labels: { color: C.text } } } });

  mkLine('m-perf', days, [
    { label: 'Score', data: days.map(d => allData[d].performance.score), borderColor: C.teal, backgroundColor: C.teal + '22', tension: 0.3, pointRadius: 5, fill: true },
  ], { scales: { y: { min: 50, max: 100, ticks: { color: C.text }, grid: { color: C.grid } }, x: { ticks: { color: C.text }, grid: { color: C.grid } } } });

  mkBar('m-bots', days, [
    { label: 'Humanos', data: days.map(d => allData[d].sessions.human), backgroundColor: C.success + '99', borderColor: C.success, borderWidth: 1, borderRadius: 4 },
    { label: 'Bots',    data: days.map(d => allData[d].sessions.bots),  backgroundColor: C.danger  + '99', borderColor: C.danger,  borderWidth: 1, borderRadius: 4 },
  ], { plugins: { legend: { labels: { color: C.text } } }, scales: { x: { stacked: true, ticks: { color: C.text }, grid: { color: C.grid } }, y: { stacked: true, ticks: { color: C.text }, grid: { color: C.grid } } } });

  mkBar('m-erros', days, [
    { label: 'Erros JS', data: errsByDay, backgroundColor: errsByDay.map((_, i) => SERIES_COLORS[i % SERIES_COLORS.length] + '99'), borderWidth: 1, borderRadius: 4 },
  ], { plugins: { legend: { display: false } } });

  mkLine('m-lcp', days, [
    { label: 'LCP (s)',    data: lcpVals,          borderColor: C.danger,  backgroundColor: C.danger  + '22', tension: 0.3, pointRadius: 5, fill: true },
    { label: 'Meta 2,5s', data: days.map(() => 2.5), borderColor: C.success, borderDash: [6, 3], pointRadius: 0, fill: false },
  ]);

  mkLine('m-inp', days, [
    { label: 'INP (ms)',   data: inpVals,            borderColor: C.warning, backgroundColor: C.warning + '22', tension: 0.3, pointRadius: 5, fill: true },
    { label: 'Meta 200ms', data: days.map(() => 200), borderColor: C.success, borderDash: [6, 3], pointRadius: 0, fill: false },
  ]);

  mkLine('m-cls', days, [
    { label: 'CLS',      data: clsVals,            borderColor: C.purple, backgroundColor: C.purple + '22', tension: 0.3, pointRadius: 5, fill: true },
    { label: 'Meta 0,1', data: days.map(() => 0.1), borderColor: C.success, borderDash: [6, 3], pointRadius: 0, fill: false },
  ]);

  // Dispositivos acumulado
  const dispAcc = {};
  days.forEach(d => allData[d].devices.forEach(x => { dispAcc[x.name] = (dispAcc[x.name] || 0) + x.sessions; }));
  mkDoughnut('m-disp', Object.keys(dispAcc), Object.values(dispAcc), SERIES_COLORS);

  // Canais stacked
  const chAcc = {};
  days.forEach(d => allData[d].channels.forEach(x => { chAcc[x.name] = (chAcc[x.name] || 0) + x.sessions; }));
  const topCh = Object.entries(chAcc).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
  mkBar('m-canais', days, topCh.map((ch, i) => ({
    label: ch,
    data: days.map(d => { const f = allData[d].channels.find(x => x.name === ch); return f ? f.sessions : 0; }),
    backgroundColor: SERIES_COLORS[i] + 'cc', borderRadius: 3,
  })), { plugins: { legend: { labels: { color: C.text, font: { size: 10 } } } }, scales: { x: { stacked: true, ticks: { color: C.text }, grid: { color: C.grid } }, y: { stacked: true, ticks: { color: C.text }, grid: { color: C.grid } } } });

  // Top erros JS
  const errAcc = {};
  days.forEach(d => allData[d].jsErrors.forEach(e => {
    const key = e.error.length > 35 ? e.error.substring(0, 35) + '…' : e.error;
    errAcc[key] = (errAcc[key] || 0) + e.sessions;
  }));
  const topErrs = Object.entries(errAcc).sort((a, b) => b[1] - a[1]).slice(0, 8);
  mkBarH('m-errotipo', topErrs.map(x => x[0]), topErrs.map(x => x[1]), C.danger, 'Sessões');
}

// ── Renderizar aba de DIA ─────────────────────────────────────────────

function renderDay(container, day, d) {
  const botPct = d.sessions.total ? ((d.sessions.bots / d.sessions.total) * 100).toFixed(1) : 0;
  const lcpV = parseFloat((d.performance.lcp || '0').replace(',', '.').replace('s', ''));
  const inpV = parseFloat((d.performance.inp || '0').replace(',', '.').replace('ms', ''));
  const clsV = parseFloat((d.performance.cls || '0').replace(',', '.'));
  const lcpC = perfColor(lcpV, 2.5, 4);
  const inpC = perfColor(inpV, 200, 500);
  const clsC = perfColor(clsV, 0.1, 0.25);
  const jsTotal = d.jsErrors.reduce((s, e) => s + e.sessions, 0);
  const slug = 'day-' + day.replace('/', '');

  const insightIcons = {
    'Cliques Contínuos (Rage)': '🖱️',
    'Clique Inativo (Dead Click)': '💀',
    'Rolagem Excessiva': '⬇️',
    'Clique Botão Direito': '👆',
  };

  const insightsHTML = d.insights.map(ins => {
    const ico = insightIcons[ins.name] || '📊';
    const pct = parseFloat((ins.pct || '0').replace('%', '').replace(',', '.'));
    const col = pct > 20 ? 'var(--danger)' : pct > 5 ? 'var(--warning)' : 'var(--success)';
    return `<div class="insight-card"><div class="ico">${ico}</div><div class="n">${ins.sessions}</div><div class="pct" style="color:${col}">${ins.pct}</div><div class="lbl">${ins.name}</div></div>`;
  }).join('');

  const attHTML = (d.attentionCelular || d.attentionPC) ? `
    ${section('Attention Map — Tempo de Atenção por Profundidade de Rolagem')}
    <div class="chart-card">
      <div style="display:flex;gap:16px;margin-bottom:8px;font-size:12px;color:var(--text-muted)">
        ${d.attentionCelular ? `<span>📱 Celular — ${d.attentionCelular.pageviews} exibições</span>` : ''}
        ${d.attentionPC      ? `<span>🖥️ PC — ${d.attentionPC.pageviews} exibições</span>` : ''}
      </div>
      <div class="chart-wrap tall"><canvas id="${slug}-att"></canvas></div>
    </div>` : '';

  container.innerHTML = `
    <div class="kpi-grid">
      ${kpi('blue',   'Sessões Totais', d.sessions.total, `${d.sessions.bots} bots (${botPct}%)`)}
      ${kpi('green',  'Usuários Únicos', d.users.unique)}
      ${kpi('yellow', 'Novos Usuários', d.users.newU, d.users.newPct)}
      ${kpi('purple', 'Retornados', d.users.returned, d.users.returnedPct)}
      ${kpi('yellow', 'Páginas/Sessão', d.engagement.pagesPerSession)}
      ${kpi('yellow', 'Rolagem Média', d.engagement.scrollDepth)}
      ${kpi('blue',   'Tempo Ativo', d.engagement.activeTime + 's', 'total ' + d.engagement.totalTime + 's')}
      ${kpi(scoreColor(d.performance.score), 'Score Performance', d.performance.score)}
    </div>

    <div class="charts-row three">
      <div class="chart-card">
        <h3>LCP / INP / CLS</h3>
        <div style="padding:8px 0">
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between"><span>LCP <span class="tip-icon" data-tip="Largest Contentful Paint — tempo até o maior elemento aparecer. Meta: &lt; 2,5s">ⓘ</span></span><span style="color:${lcpC};font-weight:700">${d.performance.lcp}</span></div>
            <div class="perf-bar"><div class="perf-bar-fill" style="width:${perfBar(lcpV, 5)}%;background:${lcpC}"></div></div>
          </div>
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between"><span>INP <span class="tip-icon" data-tip="Interaction to Next Paint — velocidade de resposta a cliques. Meta: &lt; 200ms">ⓘ</span></span><span style="color:${inpC};font-weight:700">${d.performance.inp}</span></div>
            <div class="perf-bar"><div class="perf-bar-fill" style="width:${perfBar(inpV, 600)}%;background:${inpC}"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between"><span>CLS <span class="tip-icon" data-tip="Cumulative Layout Shift — quanto a página treme ao carregar. Meta: &lt; 0,1">ⓘ</span></span><span style="color:${clsC};font-weight:700">${d.performance.cls}</span></div>
            <div class="perf-bar"><div class="perf-bar-fill" style="width:${perfBar(clsV, 0.6)}%;background:${clsC}"></div></div>
          </div>
        </div>
      </div>
      <div class="chart-card"><h3>Dispositivos</h3><div class="chart-wrap short"><canvas id="${slug}-disp"></canvas></div></div>
      <div class="chart-card"><h3>Sistemas Operacionais</h3><div class="chart-wrap short"><canvas id="${slug}-os"></canvas></div></div>
    </div>

    <div class="insights-grid">${insightsHTML}</div>

    <div class="charts-row">
      <div class="chart-card"><h3>Canais de Tráfego</h3><div class="chart-wrap"><canvas id="${slug}-canal"></canvas></div></div>
      <div class="chart-card"><h3>Erros JavaScript (${jsTotal})</h3><div class="chart-wrap"><canvas id="${slug}-js"></canvas></div></div>
    </div>

    ${attHTML}

    ${d.perfUrls.length ? `
    ${section('Desempenho por URL')}
    <div class="chart-card">
      <table>
        <thead><tr><th>URL</th><th>Score</th><th>LCP</th><th>INP</th><th>CLS</th></tr></thead>
        <tbody>${d.perfUrls.map(u => `<tr><td style="font-size:11px">${u.url}</td><td>${u.score}</td><td>${u.lcp}</td><td>${u.inp}</td><td>${u.cls}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : ''}

    ${d.pages.length ? `
    ${section('Páginas Principais')}
    <div class="chart-card">
      <table>
        <thead><tr><th>URL</th><th>Sessões</th></tr></thead>
        <tbody>${d.pages.slice(0,15).map(p => `<tr><td style="font-size:11px">${p.url}</td><td>${p.sessions}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : ''}
  `;

  // Charts
  if (d.devices.length) mkDoughnut(`${slug}-disp`, d.devices.map(x => x.name), d.devices.map(x => x.sessions), SERIES_COLORS);
  if (d.os.length)      mkBarH(`${slug}-os`, d.os.map(x => x.name), d.os.map(x => x.sessions), C.primary, 'Sessões');
  if (d.channels.length) mkBarH(`${slug}-canal`, d.channels.map(x => x.name), d.channels.map(x => x.sessions), C.teal, 'Sessões');

  if (d.jsErrors.length) {
    const top5 = d.jsErrors.slice(0, 5);
    mkDoughnut(`${slug}-js`, top5.map(x => x.error.length > 28 ? x.error.substring(0, 28) + '…' : x.error), top5.map(x => x.sessions), [C.danger, C.warning, C.primary, C.teal, C.purple]);
  }

  if (d.attentionCelular || d.attentionPC) {
    mkAttention(`${slug}-att`, d.attentionCelular ? d.attentionCelular.data : null, d.attentionPC ? d.attentionPC.data : null);
  }
}

// ── Renderizar aba COMPARAR ───────────────────────────────────────────

function renderCompare(container) {
  const allDays = Object.keys(GIDS);
  const allMonths = Object.keys(MONTH_MAP);

  const dayOptions = allDays.map(d => `<option value="${d}">${d}</option>`).join('');
  const monthOptions = allMonths.map(m => `<option value="${m}">${m}</option>`).join('');

  container.innerHTML = `
    ${section('📅 Comparação entre Meses')}
    <div class="chart-card" style="margin-bottom:18px">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <label style="color:var(--text-muted)">Mês A: <select id="cmp-mesA" style="background:#252836;color:#fff;border:1px solid #333;border-radius:6px;padding:6px 10px">${monthOptions}</select></label>
        <label style="color:var(--text-muted)">Mês B: <select id="cmp-mesB" style="background:#252836;color:#fff;border:1px solid #333;border-radius:6px;padding:6px 10px">${monthOptions}</select></label>
        <button onclick="runMonthCompare()" style="background:var(--primary);color:#fff;border:none;border-radius:6px;padding:8px 18px;cursor:pointer;font-weight:600">Comparar</button>
      </div>
    </div>
    <div id="cmp-month-result"></div>

    ${section('📆 Comparação entre Dias')}
    <div class="chart-card" style="margin-bottom:18px">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <label style="color:var(--text-muted)">Dia A: <select id="cmp-diaA" style="background:#252836;color:#fff;border:1px solid #333;border-radius:6px;padding:6px 10px">${dayOptions}</select></label>
        <label style="color:var(--text-muted)">Dia B: <select id="cmp-diaB" style="background:#252836;color:#fff;border:1px solid #333;border-radius:6px;padding:6px 10px">${dayOptions}</select></label>
        <button onclick="runDayCompare()" style="background:var(--primary);color:#fff;border:none;border-radius:6px;padding:8px 18px;cursor:pointer;font-weight:600">Comparar</button>
      </div>
    </div>
    <div id="cmp-day-result"></div>
  `;

  // Pré-selecionar segundo mês/dia diferente
  const selMesB = document.getElementById('cmp-mesB');
  if (selMesB && allMonths.length > 1) selMesB.selectedIndex = Math.min(1, allMonths.length - 1);
  const selDiaB = document.getElementById('cmp-diaB');
  if (selDiaB && allDays.length > 1) selDiaB.selectedIndex = Math.min(1, allDays.length - 1);
}

async function runMonthCompare() {
  const mA = document.getElementById('cmp-mesA').value;
  const mB = document.getElementById('cmp-mesB').value;
  const result = document.getElementById('cmp-month-result');
  result.innerHTML = '<p style="padding:20px;color:var(--text-muted)">Carregando…</p>';

  const [dataA, dataB] = await Promise.all([loadMonth(mA), loadMonth(mB)]);
  const daysA = Object.keys(dataA), daysB = Object.keys(dataB);

  const agg = (data, days, fn) => days.length ? days.reduce((s, d) => s + fn(data[d]), 0) : 0;
  const avg = (data, days, fn) => days.length ? (agg(data, days, fn) / days.length).toFixed(1) : 0;

  const metrics = [
    { label: 'Total Sessões',   a: agg(dataA, daysA, d => d.sessions.total),    b: agg(dataB, daysB, d => d.sessions.total) },
    { label: 'Sessões Humanas', a: agg(dataA, daysA, d => d.sessions.human),    b: agg(dataB, daysB, d => d.sessions.human) },
    { label: 'Bots',            a: agg(dataA, daysA, d => d.sessions.bots),     b: agg(dataB, daysB, d => d.sessions.bots) },
    { label: 'Erros JS',        a: agg(dataA, daysA, d => d.jsErrors.reduce((s,e)=>s+e.sessions,0)), b: agg(dataB, daysB, d => d.jsErrors.reduce((s,e)=>s+e.sessions,0)) },
    { label: 'Score Médio',     a: avg(dataA, daysA, d => d.performance.score), b: avg(dataB, daysB, d => d.performance.score) },
    { label: 'Páginas/Sessão',  a: avg(dataA, daysA, d => d.engagement.pagesPerSession), b: avg(dataB, daysB, d => d.engagement.pagesPerSession) },
  ];

  const rows = metrics.map(m => {
    const diff = m.b - m.a;
    const pct  = m.a ? ((diff / m.a) * 100).toFixed(1) : '—';
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
    const col   = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text-muted)';
    return `<tr><td>${m.label}</td><td>${m.a}</td><td>${m.b}</td><td style="color:${col};font-weight:700">${arrow} ${Math.abs(parseFloat(pct))}%</td></tr>`;
  }).join('');

  result.innerHTML = `
    <div class="chart-card" style="margin-bottom:18px">
      <table>
        <thead><tr><th>Métrica</th><th>${mA}</th><th>${mB}</th><th>Variação</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="charts-row">
      <div class="chart-card"><h3>Sessões — ${mA} vs ${mB}</h3><div class="chart-wrap"><canvas id="cmp-m-sessoes"></canvas></div></div>
      <div class="chart-card"><h3>Score — ${mA} vs ${mB}</h3><div class="chart-wrap"><canvas id="cmp-m-score"></canvas></div></div>
    </div>
  `;

  mkBar('cmp-m-sessoes', ['Humanas', 'Bots', 'Total'], [
    { label: mA, data: [agg(dataA,daysA,d=>d.sessions.human), agg(dataA,daysA,d=>d.sessions.bots), agg(dataA,daysA,d=>d.sessions.total)], backgroundColor: C.primary + '99', borderColor: C.primary, borderRadius: 4 },
    { label: mB, data: [agg(dataB,daysB,d=>d.sessions.human), agg(dataB,daysB,d=>d.sessions.bots), agg(dataB,daysB,d=>d.sessions.total)], backgroundColor: C.teal    + '99', borderColor: C.teal,    borderRadius: 4 },
  ], { plugins: { legend: { labels: { color: C.text } } } });

  const commonDays = Math.max(daysA.length, daysB.length);
  const labelsIdx  = Array.from({ length: commonDays }, (_, i) => `Dia ${i+1}`);
  mkLine('cmp-m-score', labelsIdx, [
    { label: mA, data: daysA.map(d => dataA[d].performance.score), borderColor: C.primary, backgroundColor: C.primary + '22', tension: 0.3, pointRadius: 4 },
    { label: mB, data: daysB.map(d => dataB[d].performance.score), borderColor: C.teal,    backgroundColor: C.teal    + '22', tension: 0.3, pointRadius: 4 },
  ]);
}

async function runDayCompare() {
  const dA = document.getElementById('cmp-diaA').value;
  const dB = document.getElementById('cmp-diaB').value;
  const result = document.getElementById('cmp-day-result');
  result.innerHTML = '<p style="padding:20px;color:var(--text-muted)">Carregando…</p>';

  const [a, b] = await Promise.all([loadDay(dA), loadDay(dB)]);

  const radarLabels = ['Sessões', 'Usuários', 'Páginas/Sessão', 'Score', 'Rolagem%'];
  const norm = (val, max) => Math.min(100, (val / max) * 100);
  const radarA = [
    norm(a.sessions.human, 1200),
    norm(a.users.unique, 1100),
    norm(a.engagement.pagesPerSession, 5) * 20,
    a.performance.score,
    parseFloat((a.engagement.scrollDepth || '0').replace('%', '').replace(',', '.')) || 0,
  ];
  const radarB = [
    norm(b.sessions.human, 1200),
    norm(b.users.unique, 1100),
    norm(b.engagement.pagesPerSession, 5) * 20,
    b.performance.score,
    parseFloat((b.engagement.scrollDepth || '0').replace('%', '').replace(',', '.')) || 0,
  ];

  const metrics = [
    { label: 'Sessões Totais',  a: a.sessions.total,              b: b.sessions.total },
    { label: 'Sessões Humanas', a: a.sessions.human,              b: b.sessions.human },
    { label: 'Bots',            a: a.sessions.bots,               b: b.sessions.bots },
    { label: 'Usuários Únicos', a: a.users.unique,                b: b.users.unique },
    { label: 'Novos Usuários',  a: a.users.newU,                  b: b.users.newU },
    { label: 'Páginas/Sessão',  a: a.engagement.pagesPerSession,  b: b.engagement.pagesPerSession },
    { label: 'Rolagem Média',   a: a.engagement.scrollDepth,      b: b.engagement.scrollDepth },
    { label: 'Tempo Ativo (s)', a: a.engagement.activeTime,       b: b.engagement.activeTime },
    { label: 'Score',           a: a.performance.score,           b: b.performance.score },
    { label: 'LCP',             a: a.performance.lcp,             b: b.performance.lcp },
    { label: 'INP',             a: a.performance.inp,             b: b.performance.inp },
    { label: 'CLS',             a: a.performance.cls,             b: b.performance.cls },
    { label: 'Erros JS',        a: a.jsErrors.reduce((s,e)=>s+e.sessions,0), b: b.jsErrors.reduce((s,e)=>s+e.sessions,0) },
  ];

  const rows = metrics.map(m => `<tr><td>${m.label}</td><td>${m.a}</td><td>${m.b}</td></tr>`).join('');

  result.innerHTML = `
    <div class="charts-row">
      <div class="chart-card"><h3>Radar — ${dA} vs ${dB}</h3><div class="chart-wrap"><canvas id="cmp-radar"></canvas></div></div>
      <div class="chart-card">
        <h3>KPIs lado a lado</h3>
        <table>
          <thead><tr><th>Métrica</th><th>${dA}</th><th>${dB}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
    ${(a.attentionCelular || a.attentionPC || b.attentionCelular || b.attentionPC) ? `
    <div class="charts-row">
      <div class="chart-card"><h3>Attention ${dA}</h3><div class="chart-wrap tall"><canvas id="cmp-att-a"></canvas></div></div>
      <div class="chart-card"><h3>Attention ${dB}</h3><div class="chart-wrap tall"><canvas id="cmp-att-b"></canvas></div></div>
    </div>` : ''}
  `;

  mkRadar('cmp-radar', radarLabels, radarA, radarB, dA, dB);

  if (a.attentionCelular || a.attentionPC) mkAttention('cmp-att-a', a.attentionCelular ? a.attentionCelular.data : null, a.attentionPC ? a.attentionPC.data : null);
  if (b.attentionCelular || b.attentionPC) mkAttention('cmp-att-b', b.attentionCelular ? b.attentionCelular.data : null, b.attentionPC ? b.attentionPC.data : null);
}
