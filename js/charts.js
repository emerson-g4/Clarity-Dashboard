// =====================================================================
// Clarity Dashboard — Dynamic Google Sheets Loader
// Busca dados via fetch() das abas publicadas como CSV público
// =====================================================================

const SHEET_ID = '10M_2Ne7UDvwezJVJEoWnxThJFvZWKmqpel-vlNOUemM';
const GIDS = {
  '14/04': '1656633445',
  '15/04': '896716369',
  '16/04': '119307911',
  '17/04': '439678340',
  '18/04': '1715631158',
  '19/04': '1500141716',
  '20/04': '2116978847',
  '21/04': '1806993942',
  '22/04': '1876630512',
  '23/04': '249323399',
  '24/04': '1461382336',
  'Erros JS': '848125723'
};

const C = {
  primary:'#4f8ef7', success:'#2ecc71', warning:'#f39c12',
  danger:'#e74c3c', purple:'#9b59b6', teal:'#1abc9c',
  grid:'rgba(255,255,255,0.06)', text:'#8892a4'
};

const chartDefaults = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: C.text, font:{size:11} } } },
  scales: {
    x: { ticks:{color:C.text,font:{size:11}}, grid:{color:C.grid} },
    y: { ticks:{color:C.text,font:{size:11}}, grid:{color:C.grid} }
  }
};

function showTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-nav button').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

function mk(id, type, data, opts={}) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el._chartInstance) el._chartInstance.destroy();
  const inst = new Chart(el, { type, data, options: { ...chartDefaults, ...opts } });
  el._chartInstance = inst;
}

function mkDoughnut(id, labels, data, colors) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el._chartInstance) el._chartInstance.destroy();
  const inst = new Chart(el, {
    type:'doughnut',
    data:{ labels, datasets:[{data, backgroundColor:colors, borderWidth:1, borderColor:'#1a1d27'}]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{color:C.text,font:{size:11},boxWidth:12}}}}
  });
  el._chartInstance = inst;
}

function mkBar(id, labels, data, color, label) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el._chartInstance) el._chartInstance.destroy();
  const inst = new Chart(el, {
    type:'bar',
    data:{ labels, datasets:[{label, data, backgroundColor:color+'99', borderColor:color, borderWidth:1, borderRadius:4}]},
    options:{ ...chartDefaults, indexAxis:'y', plugins:{legend:{display:false}}}
  });
  el._chartInstance = inst;
}

// =====================================================================
// CSV Parser
// =====================================================================
function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  return lines.map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  });
}

// =====================================================================
// Fetch CSV de uma aba
// =====================================================================
async function fetchSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for gid=${gid}`);
  return parseCSV(await res.text());
}

// =====================================================================
// Parser de aba de dia — extrai objeto com todos os dados
// =====================================================================
function parseDaySheet(rows) {
  const data = {
    sessions: { total:0, bots:0, human:0 },
    users: { unique:0, newU:0, newPct:'', returned:0, returnedPct:'' },
    engagement: { pagesPerSession:0, scrollDepth:'', activeTime:0, totalTime:0 },
    insights: [],
    smartEvents: [],
    devices: [],
    os: [],
    countries: [],
    channels: [],
    referrers: [],
    sources: [],
    campaigns: [],
    pages: [],
    performance: { score:0, lcp:'', inp:'', cls:'' },
    perfUrls: [],
    jsErrors: []
  };

  let section = '';
  for (const row of rows) {
    const a = row[0] || '';
    const b = row[1] || '';
    const c = row[2] || '';

    // Detectar seções
    if (a.startsWith('MICROSOFT CLARITY')) continue;
    if (a === 'SESSÕES') { section = 'sessions'; continue; }
    if (a === 'USUÁRIOS') { section = 'users'; continue; }
    if (a === 'ENGAJAMENTO') { section = 'engagement'; continue; }
    if (a.startsWith('INSIGHTS DE COMPORTAMENTO')) { section = 'insights'; continue; }
    if (a.startsWith('EVENTOS INTELIGENTES')) { section = 'smartEvents'; continue; }
    if (a.startsWith('DISPOSITIVOS')) { section = 'devices'; continue; }
    if (a.startsWith('SISTEMAS OPERACIONAIS')) { section = 'os'; continue; }
    if (a.startsWith('PAÍSES')) { section = 'countries'; continue; }
    if (a.startsWith('CANAIS DE TRÁFEGO')) { section = 'channels'; continue; }
    if (a.startsWith('REFERENCIADORES')) { section = 'referrers'; continue; }
    if (a.startsWith('FONTES')) { section = 'sources'; continue; }
    if (a.startsWith('CAMPANHAS')) { section = 'campaigns'; continue; }
    if (a.startsWith('PÁGINAS PRINCIPAIS')) { section = 'pages'; continue; }
    if (a === 'PERFORMANCE') { section = 'performance'; continue; }
    if (a.startsWith('DESEMPENHO POR URL')) { section = 'perfUrls'; continue; }
    if (a.startsWith('ERROS JAVASCRIPT')) { section = 'jsErrors'; continue; }

    // Cabeçalhos de coluna — pular
    if (a === 'Métrica' || a === 'Insight' || a === 'Evento' ||
        a === 'Dispositivo' || a === 'Sistema Operacional' || a === 'País' ||
        a === 'Canal' || a === 'Domínio' || a === 'Fonte' || a === 'Campanha' ||
        a === 'URL' || a === 'Erro' || a === 'Indicador' ||
        a === 'Sessões' || a === 'Score') continue;

    const numB = parseFloat((b || '0').replace(',', '.').replace('%','')) || 0;

    if (section === 'sessions') {
      if (a === 'Total de Sessões') data.sessions.total = numB;
      else if (a === 'Sessões de Bot') { data.sessions.bots = numB; }
      else if (a === 'Sessões Humanas') { data.sessions.human = numB; }
    }
    else if (section === 'users') {
      if (a === 'Usuários Únicos') data.users.unique = numB;
      else if (a === 'Novos Usuários') { data.users.newU = numB; data.users.newPct = c; }
      else if (a === 'Usuários Retornados') { data.users.returned = numB; data.users.returnedPct = c; }
    }
    else if (section === 'engagement') {
      if (a === 'Páginas por Sessão (média)') data.engagement.pagesPerSession = numB;
      else if (a === 'Profundidade de Rolagem (média)') data.engagement.scrollDepth = b;
      else if (a === 'Tempo Ativo (s)') data.engagement.activeTime = numB;
      else if (a === 'Tempo Total (s)') data.engagement.totalTime = numB;
    }
    else if (section === 'insights') {
      if (a && b !== undefined) data.insights.push({ name: a, sessions: numB, pct: c });
    }
    else if (section === 'smartEvents') {
      if (a && b !== undefined) data.smartEvents.push({ name: a, sessions: numB, pct: c });
    }
    else if (section === 'devices') {
      if (a && b) data.devices.push({ name: a, sessions: numB, pct: c });
    }
    else if (section === 'os') {
      if (a && b) data.os.push({ name: a, sessions: numB, pct: c });
    }
    else if (section === 'countries') {
      if (a && b) data.countries.push({ name: a, sessions: numB, pct: c });
    }
    else if (section === 'channels') {
      if (a && b) data.channels.push({ name: a, sessions: numB });
    }
    else if (section === 'referrers') {
      if (a && b) data.referrers.push({ name: a, sessions: numB });
    }
    else if (section === 'sources') {
      if (a && b) data.sources.push({ name: a, sessions: numB });
    }
    else if (section === 'campaigns') {
      if (a && b) data.campaigns.push({ name: a, sessions: numB });
    }
    else if (section === 'pages') {
      if (a && b) data.pages.push({ url: a, sessions: numB });
    }
    else if (section === 'performance') {
      if (a === 'Score Geral') data.performance.score = numB;
      else if (a === 'LCP') data.performance.lcp = b;
      else if (a === 'INP') data.performance.inp = b;
      else if (a === 'CLS') data.performance.cls = b;
    }
    else if (section === 'perfUrls') {
      if (a && b) data.perfUrls.push({ url: a, score: numB, lcp: b, inp: c, cls: row[3]||'' });
    }
    else if (section === 'jsErrors') {
      if (a && b) data.jsErrors.push({ error: a, sessions: numB, pct: c });
    }
  }

  return data;
}

// =====================================================================
// Renderizar aba de dia com dados dinâmicos
// =====================================================================
function renderDayTab(day, d) {
  const slug = 'd' + day.replace('/','');

  // KPI cards — atualizar valores
  function setKpi(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  const kpiGrid = document.querySelector(`#tab-${slug} .kpi-grid`);
  if (kpiGrid) {
    kpiGrid.innerHTML = `
      <div class="kpi blue"><div class="label">Sessões Totais</div><div class="value">${d.sessions.total}</div><div class="sub">${d.sessions.bots} bots (${d.sessions.total ? ((d.sessions.bots/d.sessions.total)*100).toFixed(1) : 0}%)</div></div>
      <div class="kpi green"><div class="label">Usuários Únicos</div><div class="value">${d.users.unique}</div></div>
      <div class="kpi yellow"><div class="label">Novos Usuários</div><div class="value">${d.users.newU}</div><div class="sub">${d.users.newPct}</div></div>
      <div class="kpi purple"><div class="label">Retornados</div><div class="value">${d.users.returned}</div><div class="sub">${d.users.returnedPct}</div></div>
      <div class="kpi yellow"><div class="label">Páginas/Sessão</div><div class="value">${d.engagement.pagesPerSession}</div></div>
      <div class="kpi yellow"><div class="label">Rolagem Média</div><div class="value">${d.engagement.scrollDepth}</div></div>
      <div class="kpi blue"><div class="label">Tempo Ativo</div><div class="value">${d.engagement.activeTime}s</div><div class="sub">total ${d.engagement.totalTime}s</div></div>
      <div class="kpi ${d.performance.score >= 80 ? 'green' : d.performance.score >= 70 ? 'yellow' : 'red'}"><div class="label">Score Performance</div><div class="value">${d.performance.score}</div></div>
    `;
  }

  // Insights de comportamento
  const insightsGrid = document.querySelector(`#tab-${slug} .insights-grid`);
  if (insightsGrid && d.insights.length) {
    const icons = { 'Cliques Contínuos (Rage)':'🖱️','Clique Inativo (Dead Click)':'💀','Rolagem Excessiva':'⬇️','Clique Botão Direito':'👆' };
    insightsGrid.innerHTML = d.insights.map(ins => {
      const ico = icons[ins.name] || '📊';
      const pct = parseFloat((ins.pct||'0').replace('%','').replace(',','.'));
      const color = pct > 20 ? 'var(--danger)' : pct > 5 ? 'var(--warning)' : 'var(--success)';
      return `<div class="insight-card"><div class="ico">${ico}</div><div class="n">${ins.sessions}</div><div class="pct" style="color:${color}">${ins.pct}</div><div class="lbl">${ins.name}</div></div>`;
    }).join('');
  }

  // Gráfico Dispositivos
  if (d.devices.length) {
    const dispColors = [C.primary, C.teal, C.warning, C.purple, C.danger];
    mkDoughnut(`${slug}-disp`, d.devices.map(x=>x.name), d.devices.map(x=>x.sessions), dispColors);
  }

  // Gráfico OS
  if (d.os.length) {
    mkBar(`${slug}-os`, d.os.map(x=>x.name), d.os.map(x=>x.sessions), C.primary, 'Sessões');
  }

  // Gráfico Canais
  if (d.channels.length) {
    mkBar(`${slug}-canal`, d.channels.map(x=>x.name), d.channels.map(x=>x.sessions), C.teal, 'Sessões');
  }

  // Gráfico Erros JS do dia (doughnut top 5)
  if (d.jsErrors.length) {
    const top5 = d.jsErrors.slice(0,5);
    const jsColors = [C.danger,C.warning,C.primary,C.teal,C.purple];
    const jsEl = document.getElementById(`${slug}-js`);
    if (jsEl) {
      // Atualizar título
      const card = jsEl.closest('.chart-card');
      if (card) {
        const h3 = card.querySelector('h3');
        if (h3) {
          const total = d.jsErrors.reduce((s,x) => s + x.sessions, 0);
          h3.textContent = `Erros JavaScript (${total} erros)`;
        }
      }
      if (jsEl._chartInstance) jsEl._chartInstance.destroy();
      jsEl._chartInstance = new Chart(jsEl, {
        type:'doughnut',
        data:{
          labels: top5.map(x => x.error.length > 30 ? x.error.substring(0,30)+'…' : x.error),
          datasets:[{data: top5.map(x=>x.sessions), backgroundColor:jsColors, borderWidth:1, borderColor:'#1a1d27'}]
        },
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:C.text,font:{size:10},boxWidth:12}}}}
      });
    }
  }

  // Performance bar LCP/INP/CLS
  const perfCard = document.querySelector(`#tab-${slug} .charts-row.three .chart-card:first-child`);
  if (perfCard && d.performance.lcp) {
    const lcpVal = parseFloat((d.performance.lcp||'0').replace(',','.').replace('s',''));
    const inpVal = parseFloat((d.performance.inp||'0').replace(',','.').replace('ms',''));
    const clsVal = parseFloat((d.performance.cls||'0').replace(',','.'));

    const lcpColor = lcpVal < 2.5 ? 'var(--success)' : lcpVal < 4 ? 'var(--warning)' : 'var(--danger)';
    const inpColor = inpVal < 200 ? 'var(--success)' : inpVal < 500 ? 'var(--warning)' : 'var(--danger)';
    const clsColor = clsVal < 0.1 ? 'var(--success)' : clsVal < 0.25 ? 'var(--warning)' : 'var(--danger)';

    const lcpPct = Math.min(100, (lcpVal / 5) * 100);
    const inpPct = Math.min(100, (inpVal / 600) * 100);
    const clsPct = Math.min(100, (clsVal / 0.6) * 100);

    perfCard.innerHTML = `<h3>LCP / INP / CLS</h3>
      <div style="padding:8px 0">
        <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span>LCP</span><span style="color:${lcpColor};font-weight:700">${d.performance.lcp}</span></div><div class="perf-bar"><div class="perf-bar-fill" style="width:${lcpPct.toFixed(0)}%;background:${lcpColor}"></div></div></div>
        <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span>INP</span><span style="color:${inpColor};font-weight:700">${d.performance.inp}</span></div><div class="perf-bar"><div class="perf-bar-fill" style="width:${inpPct.toFixed(0)}%;background:${inpColor}"></div></div></div>
        <div><div style="display:flex;justify-content:space-between"><span>CLS</span><span style="color:${clsColor};font-weight:700">${d.performance.cls}</span></div><div class="perf-bar"><div class="perf-bar-fill" style="width:${clsPct.toFixed(0)}%;background:${clsColor}"></div></div></div>
      </div>`;
  }
}

// =====================================================================
// Renderizar Visão Geral a partir de todos os dias
// =====================================================================
function renderOverview(allData) {
  const days = Object.keys(allData);
  const DIAS = days;

  // KPI cards gerais
  const totalSessoes = days.reduce((s,d) => s + allData[d].sessions.total, 0);
  const mediaSessoes = Math.round(totalSessoes / days.length);
  const scores = days.map(d => allData[d].performance.score).filter(s => s > 0);
  const melhorScore = scores.length ? Math.max(...scores) : 0;
  const piorScore = scores.length ? Math.min(...scores) : 0;
  const melhorDia = days.find(d => allData[d].performance.score === melhorScore) || '';
  const piorDia = days.find(d => allData[d].performance.score === piorScore) || '';
  const totalErrosJs = days.reduce((s,d) => s + allData[d].jsErrors.reduce((ss,e) => ss + e.sessions, 0), 0);
  const mediaPaginas = (days.reduce((s,d) => s + allData[d].engagement.pagesPerSession, 0) / days.length).toFixed(2);
  const scrollVals = days.map(d => parseFloat((allData[d].engagement.scrollDepth||'0').replace('%','').replace(',','.'))).filter(v => v > 0);
  const mediaScroll = scrollVals.length ? (scrollVals.reduce((s,v) => s+v, 0) / scrollVals.length).toFixed(1) : '0';
  const maxBots = Math.max(...days.map(d => allData[d].sessions.bots));
  const maxBotDia = days.find(d => allData[d].sessions.bots === maxBots) || '';

  const kpiGrid = document.querySelector('#tab-geral .kpi-grid');
  if (kpiGrid) {
    kpiGrid.innerHTML = `
      <div class="kpi blue"><div class="label">Total de Sessões (período)</div><div class="value">${totalSessoes.toLocaleString('pt-BR')}</div><div class="sub">${days[0]} a ${days[days.length-1]}</div></div>
      <div class="kpi yellow"><div class="label">Média Sessões/Dia</div><div class="value">${mediaSessoes}</div><div class="sub">${days.length} dias</div></div>
      <div class="kpi green"><div class="label">Melhor Performance</div><div class="value">${melhorScore}</div><div class="sub">${melhorDia}</div></div>
      <div class="kpi red"><div class="label">Pior Performance</div><div class="value">${piorScore}</div><div class="sub">${piorDia}</div></div>
      <div class="kpi red"><div class="label">Total Erros JS</div><div class="value">${totalErrosJs}</div><div class="sub">${days.length} dias somados</div></div>
      <div class="kpi purple"><div class="label">Média Páginas/Sessão</div><div class="value">${mediaPaginas}</div><div class="sub">período</div></div>
      <div class="kpi yellow"><div class="label">Média Rolagem</div><div class="value">${mediaScroll}%</div><div class="sub">período</div></div>
      <div class="kpi red"><div class="label">Maior Pico de Bots</div><div class="value">${maxBots}</div><div class="sub">${maxBotDia} — ${allData[maxBotDia] ? ((maxBots/allData[maxBotDia].sessions.total)*100).toFixed(0) : 0}% do tráfego</div></div>
    `;
  }

  // Gráfico: Sessões por dia
  mk('cSessoes','bar',{
    labels: DIAS,
    datasets:[
      {label:'Sessões Humanas', data: days.map(d=>allData[d].sessions.human), backgroundColor:C.primary+'99',borderColor:C.primary,borderWidth:1,borderRadius:4},
      {label:'Bots', data: days.map(d=>allData[d].sessions.bots), backgroundColor:C.danger+'99',borderColor:C.danger,borderWidth:1,borderRadius:4}
    ]
  },{plugins:{legend:{labels:{color:C.text}}}});

  // Gráfico: Score de performance por dia
  mk('cPerf','line',{
    labels: DIAS,
    datasets:[{label:'Score', data: days.map(d=>allData[d].performance.score), borderColor:C.teal,backgroundColor:C.teal+'22',tension:.3,pointRadius:5,fill:true}]
  },{scales:{y:{min:50,max:100,ticks:{color:C.text},grid:{color:C.grid}},x:{ticks:{color:C.text},grid:{color:C.grid}}}});

  // Gráfico: Bots vs Humanos stacked
  mk('cBots','bar',{
    labels: DIAS,
    datasets:[
      {label:'Humanos', data: days.map(d=>allData[d].sessions.human), backgroundColor:C.success+'99',borderColor:C.success,borderWidth:1,borderRadius:4},
      {label:'Bots', data: days.map(d=>allData[d].sessions.bots), backgroundColor:C.danger+'99',borderColor:C.danger,borderWidth:1,borderRadius:4}
    ]
  },{plugins:{legend:{labels:{color:C.text}}},scales:{x:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}},y:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}}}});

  // Gráfico: Erros JS por dia
  const errsByDay = days.map(d => allData[d].jsErrors.reduce((s,e) => s + e.sessions, 0));
  mk('cErroDia','bar',{
    labels: DIAS,
    datasets:[{label:'Erros JS', data: errsByDay, backgroundColor: errsByDay.map((v,i) => [C.warning+'99',C.danger+'99',C.warning+'99',C.warning+'99',C.primary+'99',C.success+'99',C.warning+'99',C.primary+'99'][i % 8]), borderWidth:1,borderRadius:4}]
  },{plugins:{legend:{display:false}}});

  // Gráfico: LCP por dia
  const lcpVals = days.map(d => parseFloat((allData[d].performance.lcp||'0').replace(',','.').replace('s','')) || 0);
  mk('cLcp','line',{
    labels: DIAS,
    datasets:[
      {label:'LCP (s)', data:lcpVals, borderColor:C.danger,backgroundColor:C.danger+'22',tension:.3,pointRadius:5,fill:true},
      {label:'Meta (2,5s)', data:days.map(()=>2.5), borderColor:C.success,borderDash:[6,3],pointRadius:0,fill:false}
    ]
  },{plugins:{legend:{labels:{color:C.text}}}});

  // Gráfico: INP por dia
  const inpVals = days.map(d => parseFloat((allData[d].performance.inp||'0').replace(',','.').replace('ms','')) || 0);
  mk('cInp','line',{
    labels: DIAS,
    datasets:[
      {label:'INP (ms)', data:inpVals, borderColor:C.warning,backgroundColor:C.warning+'22',tension:.3,pointRadius:5,fill:true},
      {label:'Meta (200ms)', data:days.map(()=>200), borderColor:C.success,borderDash:[6,3],pointRadius:0,fill:false}
    ]
  },{plugins:{legend:{labels:{color:C.text}}}});

  // Gráfico: CLS por dia
  const clsVals = days.map(d => parseFloat((allData[d].performance.cls||'0').replace(',','.')) || 0);
  mk('cCls','line',{
    labels: DIAS,
    datasets:[
      {label:'CLS', data:clsVals, borderColor:C.purple,backgroundColor:C.purple+'22',tension:.3,pointRadius:5,fill:true},
      {label:'Meta (0,1)', data:days.map(()=>0.1), borderColor:C.success,borderDash:[6,3],pointRadius:0,fill:false}
    ]
  },{plugins:{legend:{labels:{color:C.text}}}});

  // Gráfico: Dispositivos acumulado
  const dispAcc = {};
  days.forEach(d => allData[d].devices.forEach(x => {
    dispAcc[x.name] = (dispAcc[x.name] || 0) + x.sessions;
  }));
  const dispLabels = Object.keys(dispAcc);
  const dispVals = Object.values(dispAcc);
  const dispColors = [C.primary, C.teal, C.warning, C.purple, C.danger];
  mkDoughnut('cDispGeral', dispLabels, dispVals, dispColors);

  // Gráfico: Canais por dia (top 5 por acumulado)
  const channelAcc = {};
  days.forEach(d => allData[d].channels.forEach(x => {
    channelAcc[x.name] = (channelAcc[x.name] || 0) + x.sessions;
  }));
  const topChannels = Object.entries(channelAcc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
  const channelColors = [C.success,C.primary,C.teal,C.warning,C.purple];
  mk('cCanais','bar',{
    labels: DIAS,
    datasets: topChannels.map((ch,i) => ({
      label: ch,
      data: days.map(d => { const found = allData[d].channels.find(x=>x.name===ch); return found ? found.sessions : 0; }),
      backgroundColor: channelColors[i]+'cc',
      borderRadius: 3
    }))
  },{plugins:{legend:{labels:{color:C.text,font:{size:10}}}},scales:{x:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}},y:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}}}});

  // Gráfico: Erros JS por tipo acumulado
  const errAcc = {};
  days.forEach(d => allData[d].jsErrors.forEach(e => {
    const key = e.error.length > 35 ? e.error.substring(0,35)+'…' : e.error;
    errAcc[key] = (errAcc[key] || 0) + e.sessions;
  }));
  const topErrs = Object.entries(errAcc).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const errColors = [C.danger+'cc',C.danger+'99',C.warning+'cc',C.warning+'99',C.primary+'cc',C.primary+'99',C.teal+'cc',C.teal+'99',C.purple+'cc',C.purple+'99'];
  mk('cErroTipo','bar',{
    labels: topErrs.map(x=>x[0]),
    datasets:[{label:'Sessões', data: topErrs.map(x=>x[1]), backgroundColor:errColors, borderRadius:4}]
  },{plugins:{legend:{display:false}},indexAxis:'y'});

  // Tabela de erros na aba geral — atualizar
  const tbody = document.querySelector('#tab-geral table tbody');
  if (tbody && topErrs.length) {
    const gravidade = (n) => n > 100 ? '<span class="badge red">CRÍTICA</span>' : n > 30 ? '<span class="badge yellow">ALTA</span>' : '<span class="badge blue">MÉDIA</span>';
    const diasComErr = (errKey) => days.filter(d => allData[d].jsErrors.some(e => e.error.startsWith(errKey.replace('…','')))).length;
    tbody.innerHTML = topErrs.map(([err, total]) =>
      `<tr><td>${err}</td><td>${total}</td><td>${diasComErr(err)}/${days.length}</td><td>${gravidade(total)}</td></tr>`
    ).join('');
  }
}

// =====================================================================
// Renderizar Aba Erros JS
// =====================================================================
function renderJsTab(allData) {
  const days = Object.keys(allData);

  // KPI cards
  const errsByDay = days.map(d => ({ day: d, total: allData[d].jsErrors.reduce((s,e)=>s+e.sessions,0) }));
  const totalErros = errsByDay.reduce((s,x)=>s+x.total, 0);
  const maxDay = errsByDay.reduce((a,b) => a.total > b.total ? a : b, {total:0});
  const minDay = errsByDay.filter(x=>x.total>0).reduce((a,b) => a.total < b.total ? a : b, {total:Infinity});

  const errAcc = {};
  days.forEach(d => allData[d].jsErrors.forEach(e => {
    const key = e.error.length > 40 ? e.error.substring(0,40)+'…' : e.error;
    errAcc[key] = (errAcc[key]||0) + e.sessions;
  }));
  const topErrs = Object.entries(errAcc).sort((a,b)=>b[1]-a[1]);
  const top1 = topErrs[0] || ['—', 0];
  const top2 = topErrs[1] || ['—', 0];
  const top3 = topErrs[2] || ['—', 0];

  const kpiGrid = document.querySelector('#tab-errosjs .kpi-grid');
  if (kpiGrid) {
    kpiGrid.innerHTML = `
      <div class="kpi red"><div class="label">Total Erros (período)</div><div class="value">${totalErros}</div></div>
      <div class="kpi red"><div class="label">Erro Mais Frequente</div><div class="value">${top1[1]}</div><div class="sub">${top1[0].substring(0,25)}… (${totalErros ? ((top1[1]/totalErros)*100).toFixed(1) : 0}%)</div></div>
      <div class="kpi yellow"><div class="label">#2 Erro</div><div class="value">${top2[1]}</div><div class="sub">${top2[0].substring(0,20)}…</div></div>
      <div class="kpi yellow"><div class="label">#3 Erro</div><div class="value">${top3[1]}</div><div class="sub">${top3[0].substring(0,20)}…</div></div>
      <div class="kpi blue"><div class="label">Dia com mais erros</div><div class="value">${maxDay.day}</div><div class="sub">${maxDay.total} erros</div></div>
      <div class="kpi green"><div class="label">Dia com menos erros</div><div class="value">${minDay.day||'—'}</div><div class="sub">${minDay.total === Infinity ? 0 : minDay.total} erros</div></div>
    `;
  }

  // Gráfico acumulado
  const top7 = topErrs.slice(0,7);
  mk('js-acum','bar',{
    labels: top7.map(x=>x[0]),
    datasets:[{label:'Total de sessões afetadas', data: top7.map(x=>x[1]), backgroundColor:[C.danger+'cc',C.danger+'99',C.warning+'cc',C.warning+'99',C.primary+'cc',C.primary+'99',C.teal+'cc'], borderRadius:4}]
  },{plugins:{legend:{display:false}},indexAxis:'y'});

  // Gráfico evolução top 3
  const top3keys = topErrs.slice(0,3).map(x=>x[0]);
  const lineColors = [C.danger,C.warning,C.primary];
  mk('js-evolucao','line',{
    labels: days,
    datasets: top3keys.map((key,i) => ({
      label: key.length > 20 ? key.substring(0,20)+'…' : key,
      data: days.map(d => {
        const found = allData[d].jsErrors.find(e => e.error.startsWith(key.replace('…','')));
        return found ? found.sessions : 0;
      }),
      borderColor: lineColors[i],
      backgroundColor: lineColors[i]+'22',
      tension:.3, pointRadius:4
    }))
  },{plugins:{legend:{labels:{color:C.text}}}});

  // Tabela detalhamento por dia
  const tbody = document.querySelector('#tab-errosjs table tbody');
  if (tbody) {
    let html = '';
    days.forEach(d => {
      const errs = allData[d].jsErrors;
      if (!errs.length) return;
      const dayTotal = errs.reduce((s,e)=>s+e.sessions,0);
      html += `<tr style="background:#1e2233"><td colspan="5" style="color:var(--primary);font-weight:700;padding:8px 12px">${d}/2026 — ${dayTotal} erros totais</td></tr>`;
      errs.forEach((e, idx) => {
        if (idx === 0) {
          html += `<tr><td>${d}</td><td>${e.error}</td><td>${e.sessions}</td><td>${e.pct}</td><td rowspan="${errs.length}" style="vertical-align:middle;text-align:center;font-size:20px;font-weight:700;color:var(--warning)">${dayTotal}</td></tr>`;
        } else {
          html += `<tr><td>${d}</td><td>${e.error}</td><td>${e.sessions}</td><td>${e.pct}</td></tr>`;
        }
      });
    });
    tbody.innerHTML = html;
  }
}

// =====================================================================
// Inicialização: buscar todos os dados e renderizar
// =====================================================================
async function init() {
  const dayKeys = Object.keys(GIDS).filter(k => k !== 'Erros JS');

  // Mostrar loading
  document.querySelectorAll('.tab-content').forEach(tab => {
    const existing = tab.querySelector('.loading-msg');
    if (!existing) {
      const msg = document.createElement('div');
      msg.className = 'loading-msg';
      msg.style.cssText = 'text-align:center;padding:40px;color:var(--text-muted);font-size:14px';
      msg.textContent = 'Carregando dados da planilha…';
      tab.insertBefore(msg, tab.firstChild);
    }
  });

  try {
    // Buscar todas as abas em paralelo
    const fetches = dayKeys.map(day => fetchSheet(GIDS[day]).then(rows => ({ day, rows })));
    const results = await Promise.all(fetches);

    // Parsear cada dia
    const allData = {};
    results.forEach(({ day, rows }) => {
      allData[day] = parseDaySheet(rows);
    });

    // Remover loading msgs
    document.querySelectorAll('.loading-msg').forEach(el => el.remove());

    // Renderizar overview geral
    renderOverview(allData);

    // Renderizar cada aba de dia
    dayKeys.forEach(day => renderDayTab(day, allData[day]));

    // Renderizar aba de erros JS
    renderJsTab(allData);

  } catch (err) {
    console.error('Erro ao carregar dados do Google Sheets:', err);
    document.querySelectorAll('.loading-msg').forEach(el => {
      el.style.color = 'var(--danger)';
      el.textContent = 'Erro ao carregar dados. Verifique se a planilha está publicada publicamente (Arquivo → Compartilhar → Publicar na Web).';
    });
  }
}

// Iniciar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
