// =====================================================================
// export-month.js — Exporta um mês do Google Sheets para JSON
// Uso: node scripts/export-month.js 2026-04
//
// Requer: SHEETS_API_KEY no ambiente ou credenciais OAuth via gcloud
// Neste projeto usamos o token do PAT do GitHub + leitura direta do CSV
// público do Sheets (mesma técnica do loader.js do browser)
// =====================================================================

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

// ── Config ────────────────────────────────────────────────────────────
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
};

const MONTH_MAP = {
  'Abril 2026': ['14/04','15/04','16/04','17/04','18/04','19/04','20/04','21/04','22/04','23/04','24/04'],
};

// ── CSV Fetch ─────────────────────────────────────────────────────────
function fetchURL(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : require('http');
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/csv,text/plain,*/*' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : 'https://docs.google.com' + res.headers.location;
        res.resume();
        resolve(fetchURL(loc, redirects + 1));
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) reject(new Error(`HTTP ${res.statusCode}`));
        else resolve(data);
      });
    }).on('error', reject);
  });
}

function fetchCSV(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  return fetchURL(url);
}

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

// ── Parser (igual ao loader.js do browser) ────────────────────────────
function numVal(str) {
  return parseFloat((str || '0').replace(',', '.').replace('%', '')) || 0;
}

function parseDaySheet(rows) {
  const data = {
    sessions:    { total: 0, bots: 0, botsPct: '', human: 0, humanPct: '' },
    users:       { unique: 0, newU: 0, newPct: '', returned: 0, returnedPct: '' },
    engagement:  { pagesPerSession: 0, scrollDepth: '', activeTime: 0, totalTime: 0 },
    insights:    [],
    smartEvents: [],
    devices:     [],
    os:          [],
    countries:   [],
    channels:    [],
    referrers:   [],
    sources:     [],
    campaigns:   [],
    pages:       [],
    performance: { score: 0, lcp: '', inp: '', cls: '' },
    perfUrls:    [],
    jsErrors:    [],
    attentionCelular: null,
    attentionPC:      null,
  };

  const SECTION_MAP = {
    'SESSÕES':                    'sessions',
    'USUÁRIOS':                   'users',
    'ENGAJAMENTO':                'engagement',
    'INSIGHTS DE COMPORTAMENTO':  'insights',
    'EVENTOS INTELIGENTES':       'smartEvents',
    'DISPOSITIVOS':               'devices',
    'SISTEMAS OPERACIONAIS':      'os',
    'PAÍSES':                     'countries',
    'CANAIS DE TRÁFEGO':          'channels',
    'REFERENCIADORES':            'referrers',
    'FONTES':                     'sources',
    'CAMPANHAS':                  'campaigns',
    'PÁGINAS PRINCIPAIS':         'pages',
    'PERFORMANCE':                'performance',
    'DESEMPENHO POR URL':         'perfUrls',
    'ERROS JAVASCRIPT':           'jsErrors',
  };

  const SKIP_HEADERS = new Set([
    'Métrica','Insight','Evento','Dispositivo','Sistema Operacional',
    'País','Canal','Domínio','Fonte','Campanha','URL','Erro',
    'Indicador','Sessões','Score','Valor','%','Profundidade',
  ]);

  let section = '';

  for (const row of rows) {
    const a = (row[0] || '').trim();
    const b = (row[1] || '').trim();
    const c = (row[2] || '').trim();
    if (!a) continue;
    if (a.startsWith('MICROSOFT CLARITY')) continue;

    if (a.startsWith('ATTENTION CELULAR')) {
      data.attentionCelular = { pageviews: parseInt(a.match(/\d+/) || [0]) || 0, data: [] };
      section = 'attCelular'; continue;
    }
    if (a.startsWith('ATTENTION PC')) {
      data.attentionPC = { pageviews: parseInt(a.match(/\d+/) || [0]) || 0, data: [] };
      section = 'attPC'; continue;
    }

    let matched = false;
    for (const [key, val] of Object.entries(SECTION_MAP)) {
      if (a.startsWith(key)) { section = val; matched = true; break; }
    }
    if (matched) continue;
    if (SKIP_HEADERS.has(a)) continue;

    const numB = numVal(b);

    switch (section) {
      case 'sessions':
        if (a === 'Total de Sessões')   data.sessions.total    = numB;
        else if (a === 'Sessões de Bot')   { data.sessions.bots   = numB; data.sessions.botsPct  = c; }
        else if (a === 'Sessões Humanas')  { data.sessions.human  = numB; data.sessions.humanPct = c; }
        break;
      case 'users':
        if (a === 'Usuários Únicos')        data.users.unique     = numB;
        else if (a === 'Novos Usuários')      { data.users.newU     = numB; data.users.newPct      = c; }
        else if (a === 'Usuários Retornados') { data.users.returned = numB; data.users.returnedPct = c; }
        break;
      case 'engagement':
        if (a === 'Páginas por Sessão (média)')       data.engagement.pagesPerSession = numB;
        else if (a === 'Profundidade de Rolagem (média)') data.engagement.scrollDepth     = b;
        else if (a === 'Tempo Ativo (s)')                 data.engagement.activeTime      = numB;
        else if (a === 'Tempo Total (s)')                 data.engagement.totalTime       = numB;
        break;
      case 'insights':    if (a && b) data.insights.push({ name: a, sessions: numB, pct: c }); break;
      case 'smartEvents': if (a && b) data.smartEvents.push({ name: a, sessions: numB, pct: c }); break;
      case 'devices':     if (a && b) data.devices.push({ name: a, sessions: numB, pct: c }); break;
      case 'os':          if (a && b) data.os.push({ name: a, sessions: numB, pct: c }); break;
      case 'countries':   if (a && b) data.countries.push({ name: a, sessions: numB, pct: c }); break;
      case 'channels':    if (a && b) data.channels.push({ name: a, sessions: numB }); break;
      case 'referrers':   if (a && b) data.referrers.push({ name: a, sessions: numB }); break;
      case 'sources':     if (a && b) data.sources.push({ name: a, sessions: numB }); break;
      case 'campaigns':   if (a && b) data.campaigns.push({ name: a, sessions: numB }); break;
      case 'pages':       if (a && b) data.pages.push({ url: a, sessions: numB }); break;
      case 'performance':
        if (a === 'Score Geral') data.performance.score = numB;
        else if (a === 'LCP')    data.performance.lcp   = b;
        else if (a === 'INP')    data.performance.inp   = b;
        else if (a === 'CLS')    data.performance.cls   = b;
        break;
      case 'perfUrls': if (a && b) data.perfUrls.push({ url: a, score: numB, lcp: b, inp: c, cls: row[3] || '' }); break;
      case 'jsErrors': if (a && b) data.jsErrors.push({ error: a, sessions: numB, pct: c }); break;
      case 'attCelular': if (a.endsWith('%') && b) data.attentionCelular.data.push({ depth: a, avgTime: b, pct: c }); break;
      case 'attPC':      if (a.endsWith('%') && b) data.attentionPC.data.push({ depth: a, avgTime: b, pct: c }); break;
    }
  }
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────
async function exportMonth(yearMonth) {
  // yearMonth ex: '2026-04'
  const [year, month] = yearMonth.split('-');
  const monthNames = { '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho','07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro' };
  const monthLabel = `${monthNames[month]} ${year}`;

  const days = MONTH_MAP[monthLabel];
  if (!days) {
    console.error(`Mês não encontrado: "${monthLabel}". Disponíveis: ${Object.keys(MONTH_MAP).join(', ')}`);
    process.exit(1);
  }

  console.log(`Exportando ${monthLabel} (${days.length} dias)...`);

  const result = { month: monthLabel, generated: new Date().toISOString(), days: {} };

  for (const day of days) {
    const gid = GIDS[day];
    if (!gid) { console.warn(`  ⚠ GID não encontrado para ${day}, pulando.`); continue; }
    process.stdout.write(`  Lendo ${day}...`);
    try {
      const csv  = await fetchCSV(gid);
      const rows = parseCSV(csv);
      result.days[day] = parseDaySheet(rows);
      console.log(' OK');
    } catch (e) {
      console.log(` ERRO: ${e.message}`);
    }
  }

  // Salvar JSON
  const outDir  = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outFile = path.join(outDir, `${yearMonth}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\nSalvo em: ${outFile}`);
  console.log(`Dias exportados: ${Object.keys(result.days).length}/${days.length}`);
}

const arg = process.argv[2] || (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

exportMonth(arg).catch(e => { console.error(e); process.exit(1); });
