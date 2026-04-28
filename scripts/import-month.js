// =====================================================================
// import-month.js — Importa um JSON de mês de volta para o Google Sheets
// Uso: node scripts/import-month.js data/2026-04.json
//
// Requer: variável de ambiente SHEETS_TOKEN com OAuth token do Google
// OU rodar via: node scripts/import-month.js data/2026-04.json --token SEU_TOKEN
// =====================================================================

const https = require('https');
const fs    = require('fs');

const SHEET_ID = '10M_2Ne7UDvwezJVJEoWnxThJFvZWKmqpel-vlNOUemM';

// ── Argumentos ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const jsonFile = args.find(a => a.endsWith('.json'));
const tokenArg = args.indexOf('--token');
const TOKEN = tokenArg >= 0 ? args[tokenArg + 1] : process.env.SHEETS_TOKEN;

if (!jsonFile) {
  console.error('Uso: node scripts/import-month.js data/2026-04.json [--token SEU_TOKEN]');
  process.exit(1);
}
if (!TOKEN) {
  console.error('Token OAuth do Google não encontrado. Passe --token ou defina SHEETS_TOKEN.');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────
function sheetsApi(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'sheets.googleapis.com',
      path: `/v4/spreadsheets/${SHEET_ID}${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, data }); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Converte dados do dia de volta para linhas CSV (formato da planilha)
function dayToRows(day, dayData) {
  const rows = [
    [`MICROSOFT CLARITY — ${day}/2026`],
    [],
    ['SESSÕES'],
    ['Total de Sessões', dayData.sessions.total],
    ['Sessões de Bot', dayData.sessions.bots, dayData.sessions.botsPct],
    ['Sessões Humanas', dayData.sessions.human, dayData.sessions.humanPct],
    [],
    ['USUÁRIOS'],
    ['Usuários Únicos', dayData.users.unique],
    ['Novos Usuários', dayData.users.newU, dayData.users.newPct],
    ['Usuários Retornados', dayData.users.returned, dayData.users.returnedPct],
    [],
    ['ENGAJAMENTO'],
    ['Páginas por Sessão (média)', dayData.engagement.pagesPerSession],
    ['Profundidade de Rolagem (média)', dayData.engagement.scrollDepth],
    ['Tempo Ativo (s)', dayData.engagement.activeTime],
    ['Tempo Total (s)', dayData.engagement.totalTime],
    [],
    ['INSIGHTS DE COMPORTAMENTO', 'Sessões', '% de Sessões'],
    ...dayData.insights.map(x => [x.name, x.sessions, x.pct]),
    [],
    ['EVENTOS INTELIGENTES', 'Sessões', '% de Sessões'],
    ...dayData.smartEvents.map(x => [x.name, x.sessions, x.pct]),
    [],
    ['DISPOSITIVOS', 'Sessões', '% de Sessões'],
    ...dayData.devices.map(x => [x.name, x.sessions, x.pct]),
    [],
    ['SISTEMAS OPERACIONAIS', 'Sessões', '% de Sessões'],
    ...dayData.os.map(x => [x.name, x.sessions, x.pct]),
    [],
    ['PAÍSES', 'Sessões', '% de Sessões'],
    ...dayData.countries.map(x => [x.name, x.sessions, x.pct]),
    [],
    ['CANAIS DE TRÁFEGO', 'Sessões'],
    ...dayData.channels.map(x => [x.name, x.sessions]),
    [],
    ['REFERENCIADORES', 'Sessões'],
    ...dayData.referrers.map(x => [x.name, x.sessions]),
    [],
    ['FONTES', 'Sessões'],
    ...dayData.sources.map(x => [x.name, x.sessions]),
    [],
    ['CAMPANHAS', 'Sessões'],
    ...dayData.campaigns.map(x => [x.name, x.sessions]),
    [],
    ['PÁGINAS PRINCIPAIS', 'Sessões'],
    ...dayData.pages.map(x => [x.url, x.sessions]),
    [],
    ['PERFORMANCE'],
    ['Indicador', 'Valor'],
    ['Score Geral', dayData.performance.score],
    ['LCP', dayData.performance.lcp],
    ['INP', dayData.performance.inp],
    ['CLS', dayData.performance.cls],
    [],
    ['DESEMPENHO POR URL', 'Score', 'LCP', 'INP', 'CLS'],
    ...dayData.perfUrls.map(x => [x.url, x.score, x.lcp, x.inp, x.cls]),
    [],
    ['ERROS JAVASCRIPT', 'Sessões', '% de Sessões'],
    ...dayData.jsErrors.map(x => [x.error, x.sessions, x.pct]),
  ];

  if (dayData.attentionCelular) {
    rows.push([], [`ATTENTION CELULAR — ${dayData.attentionCelular.pageviews} Exibições de página`]);
    rows.push(['Profundidade', 'Tempo médio gasto', '% da duração da sessão']);
    dayData.attentionCelular.data.forEach(x => rows.push([x.depth, x.avgTime, x.pct]));
  }
  if (dayData.attentionPC) {
    rows.push([], [`ATTENTION PC — ${dayData.attentionPC.pageviews} Exibições de página`]);
    rows.push(['Profundidade', 'Tempo médio gasto', '% da duração da sessão']);
    dayData.attentionPC.data.forEach(x => rows.push([x.depth, x.avgTime, x.pct]));
  }

  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────
async function importMonth(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const days = Object.keys(raw.days);
  console.log(`Importando ${raw.month} (${days.length} dias) para o Sheets...`);

  // Buscar abas existentes
  const meta = await sheetsApi('GET', '?fields=sheets.properties', '');
  const existingSheets = (meta.data.sheets || []).map(s => ({ id: s.properties.sheetId, title: s.properties.title }));

  for (const day of days) {
    process.stdout.write(`  ${day}...`);
    const existing = existingSheets.find(s => s.title === day);
    let sheetId;

    if (existing) {
      sheetId = existing.id;
      // Limpar conteúdo existente
      await sheetsApi('POST', `/values/${encodeURIComponent(day)}:clear`, {});
    } else {
      // Criar nova aba
      const add = await sheetsApi('POST', ':batchUpdate', {
        requests: [{ addSheet: { properties: { title: day } } }]
      });
      sheetId = add.data.replies?.[0]?.addSheet?.properties?.sheetId;
    }

    // Escrever dados
    const rows = dayToRows(day, raw.days[day]);
    const range = `${day}!A1`;
    const write = await sheetsApi('PUT', `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      range, majorDimension: 'ROWS', values: rows
    });

    if (write.status === 200) console.log(' OK');
    else console.log(` ERRO ${write.status}`);
  }

  console.log(`\nImportação concluída: ${raw.month}`);
}

importMonth(jsonFile).catch(e => { console.error(e); process.exit(1); });
