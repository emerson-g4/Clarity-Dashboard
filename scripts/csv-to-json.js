// =====================================================================
// csv-to-json.js — Lê pastas de CSVs do Clarity e gera JSON do mês
// Uso: node scripts/csv-to-json.js 03-abril 2026-04
//      node scripts/csv-to-json.js 04-maio  2026-05
// =====================================================================

const fs   = require('fs');
const path = require('path');

const [,, folderArg, yearMonth] = process.argv;
if (!folderArg || !yearMonth) {
  console.error('Uso: node scripts/csv-to-json.js <pasta-mes> <YYYY-MM>');
  console.error('Ex:  node scripts/csv-to-json.js 03-abril 2026-04');
  process.exit(1);
}

const BASE  = path.join(__dirname, '..', folderArg);
const MONTH_NAMES = { '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho','07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro' };
const [year, mm] = yearMonth.split('-');
const monthLabel = `${MONTH_NAMES[mm]} ${year}`;

// ── CSV parse ─────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split('\n').map(l => l.trim()).filter(l => l);
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

function numVal(s) { return parseFloat((s||'0').replace(',','.').replace('%','')) || 0; }

// ── Read one CSV file by keyword in name ─────────────────────────────
function readCSV(dayDir, keyword) {
  const files = fs.readdirSync(dayDir);
  const f = files.find(n => n.toLowerCase().includes(keyword.toLowerCase()));
  if (!f) return null;
  return parseCSV(fs.readFileSync(path.join(dayDir, f), 'utf8'));
}

// ── Parse Painel CSV ─────────────────────────────────────────────────
function parsePainel(rows) {
  const d = {
    sessions:   { total:0, bots:0, botsPct:'', human:0, humanPct:'' },
    users:      { unique:0, newU:0, newPct:'', returned:0, returnedPct:'' },
    engagement: { pagesPerSession:0, scrollDepth:'', activeTime:0, totalTime:0 },
    insights:[], smartEvents:[], countries:[], pages:[], referrers:[],
    performance:{ score:0, lcp:'', inp:'', cls:'' },
    jsErrors:[],
  };
  for (const r of rows) {
    const a = r[0]||'', b = r[1]||'', c = r[2]||'', e = r[4]||'';
    if (b === 'Total de sessões')         d.sessions.total   = numVal(c);
    if (b === 'Sessões de bot')           d.sessions.bots    = numVal(c);
    if (b === 'Usuários únicos')          d.users.unique     = numVal(c);
    if (b === 'Sessões com novos usuários')    d.users.newU     = numVal(c);
    if (b === 'Sessões com usuários retornados') d.users.returned = numVal(c);
    if (b === 'Média' && a.includes('Páginas')) d.engagement.pagesPerSession = numVal(c);
    if (b === 'Média' && a.includes('rolagem')) d.engagement.scrollDepth = c + '%';
    if (b === 'Tempo de atividade')       d.engagement.activeTime = numVal(c);
    if (b === 'Tempo total')              d.engagement.totalTime  = numVal(c);

    if (a === 'Métrica' && b === 'Insights') continue;
    if (a === '' && b && c && e && rows.indexOf(r) > 0) {
      const prev = rows[rows.indexOf(r)-1];
      if (prev && prev[1] === 'Insights')    { /* handled below */ }
    }

    // Páginas principais: Métrica col0 = "", col1 = url, col2 = sessions (under "Páginas principais")
    // Countries, Insights, Events, Referrers: parsed from sections
  }

  // Section-based parsing
  let section = '';
  for (const r of rows) {
    const b = r[1]||'', c = r[2]||'', d2 = r[3]||'';
    if (b === 'Insights')            { section = 'insights'; continue; }
    if (b === 'Páginas principais')  { section = 'pages'; continue; }
    if (b === 'Países')              { section = 'countries'; continue; }
    if (b === 'Eventos inteligentes'){ section = 'smartEvents'; continue; }
    if (b === 'Referenciador')       { section = 'referrers'; continue; }
    if (b === 'Erros de JavaScript') { section = 'jsErrors'; continue; }
    if (b === 'Visão geral do desempenho') { section = 'perf'; continue; }
    if (b === 'Funis' || b === 'Tráfego de bots') { section = ''; continue; }
    if (r[0] !== '') { section = ''; continue; }

    if (!b) continue;
    switch (section) {
      case 'insights':    if (c) d.insights.push({ name:b, sessions:numVal(c), pct:d2 }); break;
      case 'pages':       if (c) d.pages.push({ url:b, sessions:numVal(c) }); break;
      case 'countries':   if (c) d.countries.push({ name:b, sessions:numVal(c), pct:d2 }); break;
      case 'smartEvents': if (c) d.smartEvents.push({ name:b, sessions:numVal(c), pct:d2 }); break;
      case 'referrers':   if (c) d.referrers.push({ name:b, sessions:numVal(c) }); break;
      case 'jsErrors':
        if (b === 'Sessões com erros de JavaScript' || b === ' total de erros do JavaScript') break;
        if (c) d.jsErrors.push({ error:b, sessions:numVal(c), pct:d2 });
        break;
      case 'perf':
        if (b === 'Pontuação')  d.performance.score = numVal(c);
        if (b === 'LCP (Pintura com Maior Conteúdo)') d.performance.lcp = c;
        if (b === 'Interação com a Próxima Pintura (INP)') d.performance.inp = c;
        if (b === 'CLS (Deslocamento de Layout Cumulativo)') d.performance.cls = c;
        break;
    }
  }
  // sessions human = total - bots
  d.sessions.human    = d.sessions.total - d.sessions.bots;
  d.sessions.botsPct  = d.sessions.total ? ((d.sessions.bots / d.sessions.total)*100).toFixed(2)+'%' : '0%';
  d.sessions.humanPct = d.sessions.total ? ((d.sessions.human / d.sessions.total)*100).toFixed(2)+'%' : '0%';
  d.users.newPct      = d.sessions.total ? ((d.users.newU / d.sessions.total)*100).toFixed(2)+'%' : '0%';
  d.users.returnedPct = d.sessions.total ? ((d.users.returned / d.sessions.total)*100).toFixed(2)+'%' : '0%';
  return d;
}

// ── Parse Devices CSV ─────────────────────────────────────────────────
function parseDevices(rows) {
  const res = [];
  let inSec = false;
  for (const r of rows) {
    if (r[1] === 'Dispositivos') { inSec = true; continue; }
    if (inSec && r[0] === '' && r[1]) res.push({ name:r[1], sessions:numVal(r[2]), pct:r[3]||'' });
  }
  return res;
}

// ── Parse OS CSV ─────────────────────────────────────────────────────
function parseOS(rows) {
  const res = [];
  let inSec = false;
  for (const r of rows) {
    if (r[1] === 'Sistemas operacionais') { inSec = true; continue; }
    if (inSec && r[0] === '' && r[1]) res.push({ name:r[1], sessions:numVal(r[2]), pct:r[3]||'' });
  }
  return res;
}

// ── Parse Channels CSV ────────────────────────────────────────────────
function parseChannels(rows) {
  const res = [];
  let inSec = false;
  for (const r of rows) {
    if (r[1] === 'Canal') { inSec = true; continue; }
    if (inSec && r[0] === '' && r[1]) res.push({ name:r[1], sessions:numVal(r[2]) });
  }
  return res;
}

// ── Parse Sources CSV ─────────────────────────────────────────────────
function parseSources(rows) {
  const res = [];
  let inSec = false;
  for (const r of rows) {
    if (r[1] === 'Fonte') { inSec = true; continue; }
    if (inSec && r[0] === '' && r[1]) {
      // skip indented sub-lines (start with spaces)
      if (!r[1].startsWith(' ')) res.push({ name:r[1], sessions:numVal(r[2]) });
    }
  }
  return res;
}

// ── Parse Campaigns CSV ───────────────────────────────────────────────
function parseCampaigns(rows) {
  const res = [];
  let inSec = false;
  for (const r of rows) {
    if (r[1] === 'Campanha') { inSec = true; continue; }
    if (inSec && r[0] === '' && r[1]) res.push({ name:r[1], sessions:numVal(r[2]) });
  }
  return res;
}

// ── Parse PerfURL CSV ─────────────────────────────────────────────────
function parsePerfURLs(rows) {
  const res = [];
  let inSec = false;
  for (const r of rows) {
    if (r[1] === 'Desempenho da URL') { inSec = true; continue; }
    if (r[1] === 'URL') continue; // header row
    if (inSec && r[0] === '' && r[1]) {
      res.push({ url:r[1], score:numVal(r[2]), lcp:r[2]||'', inp:r[3]||'', cls:r[4]||'' });
    }
  }
  return res;
}

// ── Parse Attention CSV ───────────────────────────────────────────────
function parseAttention(rows) {
  let pageviews = 0;
  const data = [];
  for (const r of rows) {
    if (r[0] === 'Exibições de página') { pageviews = numVal(r[1]); continue; }
    // depth rows: col0 = "5", "10", etc (numbers), col1 = time, col2 = pct
    if (r[0] && /^\d+$/.test(r[0]) && r[1]) {
      data.push({ depth: r[0]+'%', avgTime: r[1], pct: r[2]||'' });
    }
  }
  return { pageviews, data };
}

// ── Process one day folder ────────────────────────────────────────────
function processDay(dayDir, dayLabel) {
  const painel  = readCSV(dayDir, 'Painel');
  if (!painel) { console.warn(`  ⚠ Painel não encontrado em ${dayDir}`); return null; }

  const base    = parsePainel(painel);
  const devices = parseDevices(readCSV(dayDir, 'Dispositivos') || []);
  const os      = parseOS(readCSV(dayDir, 'Sistemas operacionais') || []);
  const channels= parseChannels(readCSV(dayDir, 'Canal') || []);
  const sources = parseSources(readCSV(dayDir, 'Fonte') || []);
  const campaigns=parseCampaigns(readCSV(dayDir, 'Campanha') || []);
  const perfURLs= parsePerfURLs(readCSV(dayDir, 'Desempenho') || []);
  const attC    = parseAttention(readCSV(dayDir, 'Attention_Celular') || []);
  const attPC   = parseAttention(readCSV(dayDir, 'Attention_PC') || []);

  return {
    sessions:    base.sessions,
    users:       base.users,
    engagement:  base.engagement,
    insights:    base.insights,
    smartEvents: base.smartEvents,
    devices,
    os,
    countries:   base.countries,
    channels,
    referrers:   base.referrers,
    sources,
    campaigns,
    pages:       base.pages,
    performance: base.performance,
    perfUrls:    perfURLs,
    jsErrors:    base.jsErrors,
    attentionCelular: attC.data.length ? attC : null,
    attentionPC:      attPC.data.length ? attPC : null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────
if (!fs.existsSync(BASE)) {
  console.error(`Pasta não encontrada: ${BASE}`);
  process.exit(1);
}

const dayFolders = fs.readdirSync(BASE)
  .filter(d => /^\d{2}-\d{2}$/.test(d))
  .sort();

console.log(`Processando ${monthLabel} — ${dayFolders.length} dias em ${BASE}`);

// Load existing JSON if exists (to merge months)
const outDir  = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outFile = path.join(outDir, `${yearMonth}.json`);

let result = { month: monthLabel, generated: new Date().toISOString(), days: {} };
if (fs.existsSync(outFile)) {
  result = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  result.generated = new Date().toISOString();
  console.log(`  (arquivo existente carregado — ${Object.keys(result.days).length} dias)`);
}

for (const folder of dayFolders) {
  // folder = "30-04", label = "30/04"
  const [dd, mm2] = folder.split('-');
  const dayLabel  = `${dd}/${mm2}`;
  process.stdout.write(`  ${dayLabel}...`);
  try {
    const data = processDay(path.join(BASE, folder), dayLabel);
    if (data) { result.days[dayLabel] = data; console.log(' OK'); }
  } catch(e) {
    console.log(` ERRO: ${e.message}`);
  }
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
console.log(`\nSalvo em: ${outFile}`);
console.log(`Dias no arquivo: ${Object.keys(result.days).length}`);
