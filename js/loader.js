// =====================================================================
// loader.js — fetch, CSV parser, parseDaySheet
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

async function fetchSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} para gid=${gid}`);
  return parseCSV(await res.text());
}

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
    attentionCelular: null,  // { pageviews, data: [{depth,avgTime,pct}] }
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

    // Detectar seção ATTENTION (dinâmica com pageviews no título)
    if (a.startsWith('ATTENTION CELULAR')) {
      const pv = parseInt(a.match(/\d+/) || [0]) || 0;
      data.attentionCelular = { pageviews: pv, data: [] };
      section = 'attCelular';
      continue;
    }
    if (a.startsWith('ATTENTION PC')) {
      const pv = parseInt(a.match(/\d+/) || [0]) || 0;
      data.attentionPC = { pageviews: pv, data: [] };
      section = 'attPC';
      continue;
    }

    // Detectar seções padrão
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
        else if (a === 'Sessões de Bot')   { data.sessions.bots    = numB; data.sessions.botsPct  = c; }
        else if (a === 'Sessões Humanas')  { data.sessions.human   = numB; data.sessions.humanPct = c; }
        break;

      case 'users':
        if (a === 'Usuários Únicos')        data.users.unique      = numB;
        else if (a === 'Novos Usuários')      { data.users.newU      = numB; data.users.newPct      = c; }
        else if (a === 'Usuários Retornados') { data.users.returned  = numB; data.users.returnedPct = c; }
        break;

      case 'engagement':
        if (a === 'Páginas por Sessão (média)')       data.engagement.pagesPerSession = numB;
        else if (a === 'Profundidade de Rolagem (média)') data.engagement.scrollDepth     = b;
        else if (a === 'Tempo Ativo (s)')                 data.engagement.activeTime      = numB;
        else if (a === 'Tempo Total (s)')                 data.engagement.totalTime       = numB;
        break;

      case 'insights':
        if (a && b) data.insights.push({ name: a, sessions: numB, pct: c });
        break;

      case 'smartEvents':
        if (a && b) data.smartEvents.push({ name: a, sessions: numB, pct: c });
        break;

      case 'devices':
        if (a && b) data.devices.push({ name: a, sessions: numB, pct: c });
        break;

      case 'os':
        if (a && b) data.os.push({ name: a, sessions: numB, pct: c });
        break;

      case 'countries':
        if (a && b) data.countries.push({ name: a, sessions: numB, pct: c });
        break;

      case 'channels':
        if (a && b) data.channels.push({ name: a, sessions: numB });
        break;

      case 'referrers':
        if (a && b) data.referrers.push({ name: a, sessions: numB });
        break;

      case 'sources':
        if (a && b) data.sources.push({ name: a, sessions: numB });
        break;

      case 'campaigns':
        if (a && b) data.campaigns.push({ name: a, sessions: numB });
        break;

      case 'pages':
        if (a && b) data.pages.push({ url: a, sessions: numB });
        break;

      case 'performance':
        if (a === 'Score Geral') data.performance.score = numB;
        else if (a === 'LCP')    data.performance.lcp   = b;
        else if (a === 'INP')    data.performance.inp   = b;
        else if (a === 'CLS')    data.performance.cls   = b;
        break;

      case 'perfUrls':
        if (a && b) data.perfUrls.push({ url: a, score: numB, lcp: b, inp: c, cls: row[3] || '' });
        break;

      case 'jsErrors':
        if (a && b) data.jsErrors.push({ error: a, sessions: numB, pct: c });
        break;

      case 'attCelular':
        if (a.endsWith('%') && b) {
          data.attentionCelular.data.push({ depth: a, avgTime: b, pct: c });
        }
        break;

      case 'attPC':
        if (a.endsWith('%') && b) {
          data.attentionPC.data.push({ depth: a, avgTime: b, pct: c });
        }
        break;
    }
  }

  return data;
}

// Cache de dados já carregados (evita refetch)
const _cache = {};

async function loadDay(day) {
  if (_cache[day]) return _cache[day];
  const rows = await fetchSheet(GIDS[day]);
  _cache[day] = parseDaySheet(rows);
  return _cache[day];
}

async function loadMonth(monthLabel) {
  const days = MONTH_MAP[monthLabel] || [];
  const results = await Promise.all(days.map(d => loadDay(d).then(data => ({ day: d, data }))));
  const map = {};
  results.forEach(({ day, data }) => { map[day] = data; });
  return map;
}
