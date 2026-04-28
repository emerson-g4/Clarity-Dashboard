// =====================================================================
// app.js — navegação, barra de controles, comparação completa
// =====================================================================

const STATE = {
  activeMonth: null,
  loadedMonths: {},
};

// ── Nav ───────────────────────────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const months = Object.keys(MONTH_MAP);
  let html = `<button id="nav-overview" onclick="showMonthOverview('${months[months.length-1]}',this)" class="active">📊 Visão Geral</button>`;
  months.forEach(month => {
    const short = month.split(' ')[0].substring(0,3);
    html += `<button class="nav-month-btn" onclick="showMonthOverview('${month}',this)">${short}</button>`;
  });
  nav.innerHTML = html;
}

function setActiveBtn(btn) {
  document.querySelectorAll('#mainNav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ── Views ─────────────────────────────────────────────────────────────
async function showMonthOverview(month, btn) {
  setActiveBtn(btn || document.getElementById('nav-overview'));
  const content = document.getElementById('mainContent');
  content.innerHTML = '<div class="loading-msg">Carregando ' + month + '…</div>';
  try {
    if (!STATE.loadedMonths[month]) STATE.loadedMonths[month] = await loadMonth(month);
    const sub = document.getElementById('dashSub');
    if (sub) sub.textContent = month;
    STATE.activeMonth = month;
    renderPageWithControls(content, month, STATE.loadedMonths[month]);
  } catch(err) { showError(content, err); }
}

// ── Página principal com barra de controles ───────────────────────────
function renderPageWithControls(container, month, allData) {
  const days = Object.keys(allData);
  const allDays = Object.keys(GIDS);
  const allMonths = Object.keys(MONTH_MAP);

  container.innerHTML = `
    <div class="ctrl-bar" id="ctrlBar">
      <div class="ctrl-left">
        <span class="ctrl-label">Visualizar:</span>
        <select id="daySelectorDrop" onchange="onDaySelect('${month}')">
          <option value="__all__">Todos os dias</option>
          ${days.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
      </div>
      <div class="ctrl-right">
        <button id="cmpToggleBtn" class="ctrl-cmp-btn" onclick="toggleCmpPanel()">⚖️ Comparar <span id="cmpArrow">▾</span></button>
      </div>
    </div>

    <div id="cmpPanel" class="cmp-panel" style="display:none">
      <div class="cmp-tabs">
        <button id="tabDias"  class="cmp-tab active"  onclick="switchCmpTab('dias')">Comparar Dias</button>
        <button id="tabMeses" class="cmp-tab"         onclick="switchCmpTab('meses')">Comparar Meses</button>
      </div>

      <div id="cmpDiasControls" class="cmp-controls">
        <label>Dia A: <select id="cmp-diaA">${allDays.map(d=>`<option>${d}</option>`).join('')}</select></label>
        <label>Dia B: <select id="cmp-diaB">${allDays.map(d=>`<option>${d}</option>`).join('')}</select></label>
        <button class="cmp-run-btn" onclick="runDayCompare()">Comparar →</button>
        <div class="cmp-checks">
          <label><input type="checkbox" id="chk-kpis"    checked> KPIs</label>
          <label><input type="checkbox" id="chk-perf"    checked> Performance</label>
          <label><input type="checkbox" id="chk-devices" checked> Dispositivos</label>
          <label><input type="checkbox" id="chk-canais"  checked> Canais</label>
          <label><input type="checkbox" id="chk-erros"   checked> Erros JS</label>
          <label><input type="checkbox" id="chk-att"     checked> Attention</label>
        </div>
      </div>

      <div id="cmpMesesControls" class="cmp-controls" style="display:none">
        <label>Mês A: <select id="cmp-mesA">${allMonths.map(m=>`<option>${m}</option>`).join('')}</select></label>
        <label>Mês B: <select id="cmp-mesB">${allMonths.map((m,i)=>`<option ${i===1?'selected':''}>${m}</option>`).join('')}</select></label>
        <button class="cmp-run-btn" onclick="runMonthCompare()">Comparar →</button>
        <div class="cmp-checks">
          <label><input type="checkbox" id="chk-m-kpis"    checked> KPIs</label>
          <label><input type="checkbox" id="chk-m-sessoes" checked> Sessões</label>
          <label><input type="checkbox" id="chk-m-perf"    checked> Performance</label>
          <label><input type="checkbox" id="chk-m-canais"  checked> Canais</label>
        </div>
      </div>

      <div id="cmpResult" class="cmp-result"></div>
    </div>

    <div id="monthMainContent"></div>
  `;

  // Default: segundo dia diferente
  const selB = document.getElementById('cmp-diaB');
  if (selB && allDays.length > 1) selB.selectedIndex = 1;

  renderMonth(document.getElementById('monthMainContent'), month, allData);
  initTooltips(container);
}

function toggleCmpPanel() {
  const panel = document.getElementById('cmpPanel');
  const arrow = document.getElementById('cmpArrow');
  const btn   = document.getElementById('cmpToggleBtn');
  if (!panel) return;
  const open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if (arrow) arrow.textContent = open ? '▾' : '▴';
  if (btn) btn.classList.toggle('active', !open);
}

function switchCmpTab(tab) {
  document.getElementById('tabDias').classList.toggle('active', tab === 'dias');
  document.getElementById('tabMeses').classList.toggle('active', tab === 'meses');
  document.getElementById('cmpDiasControls').style.display  = tab === 'dias'  ? 'flex' : 'none';
  document.getElementById('cmpMesesControls').style.display = tab === 'meses' ? 'flex' : 'none';
  document.getElementById('cmpResult').innerHTML = '';
}

function onDaySelect(month) {
  const val = document.getElementById('daySelectorDrop').value;
  const mc  = document.getElementById('monthMainContent');
  if (!mc) return;
  if (val === '__all__') {
    renderMonth(mc, month, STATE.loadedMonths[month]);
    initTooltips(mc);
  } else {
    mc.innerHTML = '<div class="loading-msg">Carregando ' + val + '…</div>';
    loadDay(val).then(data => { renderDay(mc, val, data); initTooltips(mc); }).catch(err => showError(mc, err));
  }
}

// ── Comparação de Dias ────────────────────────────────────────────────
async function runDayCompare() {
  const dA = document.getElementById('cmp-diaA').value;
  const dB = document.getElementById('cmp-diaB').value;
  const result = document.getElementById('cmpResult');
  result.innerHTML = '<div class="loading-msg">Carregando comparação…</div>';

  try {
    const [a, b] = await Promise.all([loadDay(dA), loadDay(dB)]);

    const show = id => document.getElementById(id)?.checked !== false;
    let html = `<div class="cmp-title">Comparando <strong>${dA}</strong> vs <strong>${dB}</strong></div>`;

    // KPIs
    if (show('chk-kpis')) {
      const metrics = [
        ['Sessões Totais',  a.sessions.total,             b.sessions.total],
        ['Sessões Humanas', a.sessions.human,             b.sessions.human],
        ['Bots',           a.sessions.bots,              b.sessions.bots],
        ['Usuários Únicos', a.users.unique,               b.users.unique],
        ['Novos Usuários',  a.users.newU,                 b.users.newU],
        ['Páginas/Sessão',  a.engagement.pagesPerSession, b.engagement.pagesPerSession],
        ['Rolagem Média',   a.engagement.scrollDepth,     b.engagement.scrollDepth],
        ['Tempo Ativo (s)', a.engagement.activeTime,      b.engagement.activeTime],
      ];
      html += cmpTable('KPIs Gerais', dA, dB, metrics, true);
    }

    // Performance
    if (show('chk-perf')) {
      const perfMetrics = [
        ['Score',  a.performance.score, b.performance.score],
        ['LCP',    a.performance.lcp,   b.performance.lcp],
        ['INP',    a.performance.inp,   b.performance.inp],
        ['CLS',    a.performance.cls,   b.performance.cls],
        ['Erros JS', a.jsErrors.reduce((s,e)=>s+e.sessions,0), b.jsErrors.reduce((s,e)=>s+e.sessions,0)],
      ];
      html += cmpTable('Performance', dA, dB, perfMetrics, false);
    }

    result.innerHTML = html;

    // Gráficos
    if (show('chk-kpis')) {
      result.innerHTML += `
        <div class="charts-row">
          <div class="chart-card"><h3>Sessões — ${dA} vs ${dB}</h3><div class="chart-wrap"><canvas id="cmp-d-sessoes"></canvas></div></div>
          <div class="chart-card"><h3>Usuários — ${dA} vs ${dB}</h3><div class="chart-wrap"><canvas id="cmp-d-users"></canvas></div></div>
        </div>`;
    }
    if (show('chk-perf')) {
      result.innerHTML += `
        <div class="charts-row three">
          <div class="chart-card"><h3>Score de Performance</h3><div class="chart-wrap short"><canvas id="cmp-d-score"></canvas></div></div>
          <div class="chart-card"><h3>LCP (s)</h3><div class="chart-wrap short"><canvas id="cmp-d-lcp"></canvas></div></div>
          <div class="chart-card"><h3>INP (ms)</h3><div class="chart-wrap short"><canvas id="cmp-d-inp"></canvas></div></div>
        </div>`;
    }
    if (show('chk-devices')) {
      result.innerHTML += `
        <div class="charts-row">
          <div class="chart-card"><h3>Dispositivos — ${dA}</h3><div class="chart-wrap short"><canvas id="cmp-d-devA"></canvas></div></div>
          <div class="chart-card"><h3>Dispositivos — ${dB}</h3><div class="chart-wrap short"><canvas id="cmp-d-devB"></canvas></div></div>
        </div>`;
    }
    if (show('chk-canais')) {
      result.innerHTML += `
        <div class="chart-card" style="margin-bottom:18px"><h3>Canais de Tráfego — ${dA} vs ${dB}</h3><div class="chart-wrap tall"><canvas id="cmp-d-canais"></canvas></div></div>`;
    }
    if (show('chk-erros')) {
      result.innerHTML += `
        <div class="charts-row">
          <div class="chart-card"><h3>Erros JS — ${dA}</h3><div class="chart-wrap"><canvas id="cmp-d-errA"></canvas></div></div>
          <div class="chart-card"><h3>Erros JS — ${dB}</h3><div class="chart-wrap"><canvas id="cmp-d-errB"></canvas></div></div>
        </div>`;
    }
    if (show('chk-att') && (a.attentionCelular || a.attentionPC || b.attentionCelular || b.attentionPC)) {
      result.innerHTML += `
        <div class="charts-row">
          <div class="chart-card"><h3>Attention Map — ${dA}</h3><div class="chart-wrap tall"><canvas id="cmp-d-attA"></canvas></div></div>
          <div class="chart-card"><h3>Attention Map — ${dB}</h3><div class="chart-wrap tall"><canvas id="cmp-d-attB"></canvas></div></div>
        </div>`;
    }

    // Renderiza gráficos
    requestAnimationFrame(() => {
      if (show('chk-kpis')) {
        mkBar('cmp-d-sessoes', ['Humanas','Bots','Total'], [
          { label: dA, data: [a.sessions.human, a.sessions.bots, a.sessions.total], backgroundColor: C.primary+'99', borderColor: C.primary, borderRadius: 4 },
          { label: dB, data: [b.sessions.human, b.sessions.bots, b.sessions.total], backgroundColor: C.teal+'99',    borderColor: C.teal,    borderRadius: 4 },
        ], { plugins: { legend: { labels: { color: C.text } } } });
        mkBar('cmp-d-users', ['Únicos','Novos','Retornados'], [
          { label: dA, data: [a.users.unique, a.users.newU, a.users.returned], backgroundColor: C.primary+'99', borderColor: C.primary, borderRadius: 4 },
          { label: dB, data: [b.users.unique, b.users.newU, b.users.returned], backgroundColor: C.teal+'99',    borderColor: C.teal,    borderRadius: 4 },
        ], { plugins: { legend: { labels: { color: C.text } } } });
      }
      if (show('chk-perf')) {
        mkBar('cmp-d-score', [dA, dB], [{ label: 'Score', data: [a.performance.score, b.performance.score], backgroundColor: [C.primary+'99', C.teal+'99'], borderRadius: 4 }], { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } });
        const lcpA = parseFloat((a.performance.lcp||'0').replace(',','.').replace('s',''))||0;
        const lcpB = parseFloat((b.performance.lcp||'0').replace(',','.').replace('s',''))||0;
        mkBar('cmp-d-lcp', [dA, dB], [{ label: 'LCP (s)', data: [lcpA, lcpB], backgroundColor: [C.danger+'99', C.warning+'99'], borderRadius: 4 }], { plugins: { legend: { display: false } } });
        const inpA = parseFloat((a.performance.inp||'0').replace(',','.').replace('ms',''))||0;
        const inpB = parseFloat((b.performance.inp||'0').replace(',','.').replace('ms',''))||0;
        mkBar('cmp-d-inp', [dA, dB], [{ label: 'INP (ms)', data: [inpA, inpB], backgroundColor: [C.warning+'99', C.orange+'99'], borderRadius: 4 }], { plugins: { legend: { display: false } } });
      }
      if (show('chk-devices')) {
        if (a.devices.length) mkDoughnut('cmp-d-devA', a.devices.map(x=>x.name), a.devices.map(x=>x.sessions), SERIES_COLORS);
        if (b.devices.length) mkDoughnut('cmp-d-devB', b.devices.map(x=>x.name), b.devices.map(x=>x.sessions), SERIES_COLORS);
      }
      if (show('chk-canais') && (a.channels.length || b.channels.length)) {
        const allCh = [...new Set([...a.channels.map(x=>x.name), ...b.channels.map(x=>x.name)])];
        mkBar('cmp-d-canais', allCh, [
          { label: dA, data: allCh.map(ch => (a.channels.find(x=>x.name===ch)||{sessions:0}).sessions), backgroundColor: C.primary+'99', borderColor: C.primary, borderRadius: 3 },
          { label: dB, data: allCh.map(ch => (b.channels.find(x=>x.name===ch)||{sessions:0}).sessions), backgroundColor: C.teal+'99',    borderColor: C.teal,    borderRadius: 3 },
        ], { plugins: { legend: { labels: { color: C.text } } } });
      }
      if (show('chk-erros')) {
        if (a.jsErrors.length) { const t5=a.jsErrors.slice(0,5); mkBarH('cmp-d-errA', t5.map(x=>x.error.length>28?x.error.substring(0,28)+'…':x.error), t5.map(x=>x.sessions), C.danger, 'Sessões'); }
        if (b.jsErrors.length) { const t5=b.jsErrors.slice(0,5); mkBarH('cmp-d-errB', t5.map(x=>x.error.length>28?x.error.substring(0,28)+'…':x.error), t5.map(x=>x.sessions), C.warning, 'Sessões'); }
      }
      if (show('chk-att')) {
        if (a.attentionCelular || a.attentionPC) mkAttention('cmp-d-attA', a.attentionCelular?.data||null, a.attentionPC?.data||null);
        if (b.attentionCelular || b.attentionPC) mkAttention('cmp-d-attB', b.attentionCelular?.data||null, b.attentionPC?.data||null);
      }
    });

    initTooltips(result);
  } catch(err) { result.innerHTML = `<div style="padding:20px;color:var(--danger)">${err.message}</div>`; }
}

// ── Comparação de Meses ───────────────────────────────────────────────
async function runMonthCompare() {
  const mA = document.getElementById('cmp-mesA').value;
  const mB = document.getElementById('cmp-mesB').value;
  const result = document.getElementById('cmpResult');
  result.innerHTML = '<div class="loading-msg">Carregando meses…</div>';

  try {
    const [dataA, dataB] = await Promise.all([loadMonth(mA), loadMonth(mB)]);
    const daysA = Object.keys(dataA), daysB = Object.keys(dataB);
    const agg = (data, days, fn) => days.reduce((s,d) => s + (fn(data[d])||0), 0);
    const avg = (data, days, fn) => days.length ? (agg(data,days,fn)/days.length).toFixed(1) : 0;

    const show = id => document.getElementById(id)?.checked !== false;
    let html = `<div class="cmp-title">Comparando <strong>${mA}</strong> vs <strong>${mB}</strong></div>`;

    if (show('chk-m-kpis')) {
      const metrics = [
        ['Total Sessões',   agg(dataA,daysA,d=>d.sessions.total),  agg(dataB,daysB,d=>d.sessions.total)],
        ['Sessões Humanas', agg(dataA,daysA,d=>d.sessions.human),  agg(dataB,daysB,d=>d.sessions.human)],
        ['Bots',            agg(dataA,daysA,d=>d.sessions.bots),   agg(dataB,daysB,d=>d.sessions.bots)],
        ['Erros JS',        agg(dataA,daysA,d=>d.jsErrors.reduce((s,e)=>s+e.sessions,0)), agg(dataB,daysB,d=>d.jsErrors.reduce((s,e)=>s+e.sessions,0))],
        ['Score Médio',     avg(dataA,daysA,d=>d.performance.score), avg(dataB,daysB,d=>d.performance.score)],
        ['Páginas/Sessão',  avg(dataA,daysA,d=>d.engagement.pagesPerSession), avg(dataB,daysB,d=>d.engagement.pagesPerSession)],
      ];
      html += cmpTable('KPIs do Mês', mA, mB, metrics, true);
    }

    result.innerHTML = html;

    if (show('chk-m-sessoes')) {
      result.innerHTML += `
        <div class="charts-row">
          <div class="chart-card"><h3>Sessões por Dia — ${mA} vs ${mB}</h3><div class="chart-wrap tall"><canvas id="cmp-m-sessoes"></canvas></div></div>
          <div class="chart-card"><h3>Score por Dia</h3><div class="chart-wrap tall"><canvas id="cmp-m-score"></canvas></div></div>
        </div>`;
    }
    if (show('chk-m-perf')) {
      result.innerHTML += `
        <div class="charts-row">
          <div class="chart-card"><h3>Humanos vs Bots</h3><div class="chart-wrap"><canvas id="cmp-m-bots"></canvas></div></div>
          <div class="chart-card"><h3>Erros JS por Mês</h3><div class="chart-wrap"><canvas id="cmp-m-erros"></canvas></div></div>
        </div>`;
    }
    if (show('chk-m-canais')) {
      result.innerHTML += `<div class="chart-card" style="margin-bottom:18px"><h3>Canais — ${mA} vs ${mB}</h3><div class="chart-wrap tall"><canvas id="cmp-m-canais"></canvas></div></div>`;
    }

    requestAnimationFrame(() => {
      const maxLen = Math.max(daysA.length, daysB.length);
      const labels = Array.from({length:maxLen},(_,i)=>`Dia ${i+1}`);

      if (show('chk-m-sessoes')) {
        mkLine('cmp-m-sessoes', labels, [
          { label: mA, data: daysA.map(d=>dataA[d].sessions.total), borderColor: C.primary, backgroundColor: C.primary+'22', tension: 0.3, pointRadius: 4 },
          { label: mB, data: daysB.map(d=>dataB[d].sessions.total), borderColor: C.teal,    backgroundColor: C.teal+'22',    tension: 0.3, pointRadius: 4 },
        ]);
        mkLine('cmp-m-score', labels, [
          { label: mA, data: daysA.map(d=>dataA[d].performance.score), borderColor: C.primary, backgroundColor: C.primary+'22', tension: 0.3, pointRadius: 4 },
          { label: mB, data: daysB.map(d=>dataB[d].performance.score), borderColor: C.teal,    backgroundColor: C.teal+'22',    tension: 0.3, pointRadius: 4 },
        ]);
      }
      if (show('chk-m-perf')) {
        mkBar('cmp-m-bots', ['Humanas','Bots'], [
          { label: mA, data: [agg(dataA,daysA,d=>d.sessions.human), agg(dataA,daysA,d=>d.sessions.bots)], backgroundColor: C.primary+'99', borderRadius: 4 },
          { label: mB, data: [agg(dataB,daysB,d=>d.sessions.human), agg(dataB,daysB,d=>d.sessions.bots)], backgroundColor: C.teal+'99',    borderRadius: 4 },
        ], { plugins: { legend: { labels: { color: C.text } } } });
        mkBar('cmp-m-erros', [mA, mB], [{
          label: 'Erros JS',
          data: [agg(dataA,daysA,d=>d.jsErrors.reduce((s,e)=>s+e.sessions,0)), agg(dataB,daysB,d=>d.jsErrors.reduce((s,e)=>s+e.sessions,0))],
          backgroundColor: [C.danger+'99', C.warning+'99'], borderRadius: 4
        }], { plugins: { legend: { display: false } } });
      }
      if (show('chk-m-canais')) {
        const chAccA = {}, chAccB = {};
        daysA.forEach(d => dataA[d].channels.forEach(x => { chAccA[x.name] = (chAccA[x.name]||0)+x.sessions; }));
        daysB.forEach(d => dataB[d].channels.forEach(x => { chAccB[x.name] = (chAccB[x.name]||0)+x.sessions; }));
        const allCh = [...new Set([...Object.keys(chAccA), ...Object.keys(chAccB)])];
        mkBar('cmp-m-canais', allCh, [
          { label: mA, data: allCh.map(ch=>chAccA[ch]||0), backgroundColor: C.primary+'99', borderRadius: 3 },
          { label: mB, data: allCh.map(ch=>chAccB[ch]||0), backgroundColor: C.teal+'99',    borderRadius: 3 },
        ], { plugins: { legend: { labels: { color: C.text } } } });
      }
    });

    initTooltips(result);
  } catch(err) { result.innerHTML = `<div style="padding:20px;color:var(--danger)">${err.message}</div>`; }
}

// ── Helpers ───────────────────────────────────────────────────────────
function cmpTable(title, labelA, labelB, metrics, showDiff) {
  const rows = metrics.map(([label, vA, vB]) => {
    const nA = parseFloat(vA)||0, nB = parseFloat(vB)||0;
    const diff = nB - nA;
    const pct  = nA ? ((diff/nA)*100).toFixed(1) : '—';
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
    const col   = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--muted)';
    const diffCell = showDiff ? `<td style="color:${col};font-weight:700">${arrow} ${Math.abs(parseFloat(pct)||0)}%</td>` : '';
    return `<tr><td>${label}</td><td>${vA}</td><td>${vB}</td>${diffCell}</tr>`;
  }).join('');
  const diffHeader = showDiff ? '<th>Variação</th>' : '';
  return `
    <div class="section-title">${title}</div>
    <div class="chart-card" style="margin-bottom:18px">
      <table><thead><tr><th>Métrica</th><th>${labelA}</th><th>${labelB}</th>${diffHeader}</tr></thead>
      <tbody>${rows}</tbody></table>
    </div>`;
}

function showError(container, err) {
  console.error(err);
  container.innerHTML = `
    <div style="padding:40px;text-align:center">
      <div style="color:var(--danger);font-size:18px;font-weight:700;margin-bottom:12px">Erro ao carregar dados</div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:20px">${err.message}</div>
      <div style="background:#1e2233;border-radius:8px;padding:16px;text-align:left;max-width:500px;margin:0 auto;font-size:12px;color:var(--muted)">
        <strong style="color:#fff">Para ativar os dados:</strong><br><br>
        1. Abra a planilha no Google Sheets<br>
        2. Menu <strong>Arquivo → Compartilhar → Publicar na Web</strong><br>
        3. Selecione <strong>"Pasta de trabalho inteira"</strong> e formato <strong>CSV</strong><br>
        4. Clique em <strong>Publicar</strong> e recarregue
      </div>
    </div>`;
}

// ── Tooltips DOM ──────────────────────────────────────────────────────
function initTooltips(root) {
  (root||document).querySelectorAll('.tip-icon').forEach(el => {
    el.addEventListener('mouseenter', showTip);
    el.addEventListener('mouseleave', hideTip);
  });
}
function showTip(e) {
  let box = document.getElementById('_tipbox');
  if (!box) { box = document.createElement('div'); box.id = '_tipbox'; box.className = 'tipbox'; document.body.appendChild(box); }
  box.textContent = e.target.dataset.tip;
  box.style.display = 'block';
  const r = e.target.getBoundingClientRect();
  box.style.top  = (r.bottom + window.scrollY + 6) + 'px';
  box.style.left = (r.left + window.scrollX) + 'px';
}
function hideTip() { const b = document.getElementById('_tipbox'); if (b) b.style.display = 'none'; }

// ── Init ──────────────────────────────────────────────────────────────
async function init() {
  buildNav();
  const months = Object.keys(MONTH_MAP);
  await showMonthOverview(months[months.length-1], document.getElementById('nav-overview'));
}
document.addEventListener('DOMContentLoaded', init);
