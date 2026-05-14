// Extrai cliques em "Aplique-se" e "Acessar" de todos os CSVs Click_PC e Toque_Celular
// Suporta múltiplas pastas de meses. Gera data/ab-buttons.json com fase A (antes) e fase B (depois).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Configuração do teste A/B
// changeDate: primeiro dia do copy novo (fase B). Tudo antes = fase A (baseline).
const AB_CONFIG = {
  changeDate: '15/05/2026',  // amanhã — primeiro dia com copy novo
  phaseA_label: 'Antes (copy original)',
  phaseB_label: 'Depois (copy novo)',
};

// Pastas de meses para escanear (ordem cronológica)
const MONTH_FOLDERS = [
  { folder: '04-abril',  month: '04', year: '2026' },
  { folder: '05-maio',   month: '05', year: '2026' },
];

// Classifica seletor CSS no botão correto
function classifySelector(sel) {
  if (!sel.includes('HEADER')) return null;
  if (sel.includes('elementor-button-link.elementor-size-sm')) {
    if (sel.includes('elementor-widget-button:nth-of-type(2)')) return 'aplique-se';
    if (sel.includes('elementor-widget-button:nth-of-type(1)')) return 'acessar';
    return 'aplique-se'; // fallback
  }
  if (sel.includes('elementor-widget-button:nth-of-type(1)') && sel.includes('elementor-button')) {
    return 'acessar';
  }
  return null;
}

function parseCSV(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split('\n');
  const results = [];
  let inData = false;
  for (const line of lines) {
    if (line.startsWith('"Classificar"')) { inData = true; continue; }
    if (!inData) continue;
    const m = line.match(/^"(\d+)","(.+)","(\d+)","([^"]+)"/);
    if (!m) continue;
    results.push({ selector: m[2], clicks: parseInt(m[3]) });
  }
  return results;
}

// Compara datas no formato DD/MM/YYYY
function dateLabel(dd, mm, yyyy) { return `${dd}/${mm}/${yyyy}`; }
function isBeforeChange(dd, mm, yyyy) {
  const [cd, cm, cy] = AB_CONFIG.changeDate.split('/').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  const c = new Date(cy, cm - 1, cd);
  return d < c;
}

const allDays = {};

for (const { folder, month, year } of MONTH_FOLDERS) {
  const base = path.join(ROOT, folder);
  if (!fs.existsSync(base)) continue;
  const days = fs.readdirSync(base).filter(d => /^\d{2}-\d{2}$/.test(d)).sort();

  for (const day of days) {
    const [dd] = day.split('-');
    const label = `${dd}/${month}/${year}`;  // "14/04/2026"
    const shortLabel = `${dd}/${month}`;     // "14/04"
    const dayDir = path.join(base, day);
    const files = fs.readdirSync(dayDir);
    const clickFiles = files.filter(f => f.includes('Click_PC') || f.includes('Toque_Celular'));

    const entry = { date: label, aplique_se_pc: 0, aplique_se_mobile: 0, acessar_pc: 0, acessar_mobile: 0, total_clicks_pc: 0, total_clicks_mobile: 0 };

    for (const f of clickFiles) {
      const isMobile = f.includes('Toque_Celular');
      const filePath = path.join(dayDir, f);
      const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
      const totalMatch = content.match(/"Total de cliques","(\d+)"/);
      const total = totalMatch ? parseInt(totalMatch[1]) : 0;
      if (isMobile) entry.total_clicks_mobile = total;
      else entry.total_clicks_pc = total;

      const rows = parseCSV(filePath);
      for (const row of rows) {
        const btn = classifySelector(row.selector);
        if (btn === 'aplique-se') {
          if (isMobile) entry.aplique_se_mobile += row.clicks;
          else entry.aplique_se_pc += row.clicks;
        } else if (btn === 'acessar') {
          if (isMobile) entry.acessar_mobile += row.clicks;
          else entry.acessar_pc += row.clicks;
        }
      }
    }
    allDays[label] = entry;
  }
}

// Separa fases A e B
const phaseA = {}, phaseB = {};
for (const [label, d] of Object.entries(allDays)) {
  const [dd, mm, yyyy] = label.split('/').map(Number);
  if (isBeforeChange(dd, mm, yyyy)) phaseA[label] = d;
  else phaseB[label] = d;
}

function sumPhase(phase) {
  const t = { aplique_se: 0, acessar: 0, total_clicks: 0, days: 0 };
  for (const d of Object.values(phase)) {
    t.aplique_se  += d.aplique_se_pc + d.aplique_se_mobile;
    t.acessar     += d.acessar_pc + d.acessar_mobile;
    t.total_clicks += d.total_clicks_pc + d.total_clicks_mobile;
    t.days++;
  }
  t.aplique_se_ctr = t.total_clicks > 0 ? ((t.aplique_se / t.total_clicks) * 100).toFixed(2) : '0.00';
  t.acessar_ctr    = t.total_clicks > 0 ? ((t.acessar    / t.total_clicks) * 100).toFixed(2) : '0.00';
  t.ratio = t.acessar > 0 ? (t.aplique_se / t.acessar).toFixed(2) : 'N/A';
  return t;
}

const totalsA = sumPhase(phaseA);
const totalsB = sumPhase(phaseB);

// Console output
console.log(`\n=== TESTE A/B — Aplique-se vs Acessar ===`);
console.log(`Fase A (${AB_CONFIG.phaseA_label}): ${Object.keys(phaseA).length} dias`);
console.log(`  Aplique-se: ${totalsA.aplique_se} cliques (CTR ${totalsA.aplique_se_ctr}%)`);
console.log(`  Acessar:    ${totalsA.acessar} cliques (CTR ${totalsA.acessar_ctr}%)`);
console.log(`  Razão A/B:  ${totalsA.ratio}x`);
if (Object.keys(phaseB).length > 0) {
  console.log(`\nFase B (${AB_CONFIG.phaseB_label}): ${Object.keys(phaseB).length} dias`);
  console.log(`  Aplique-se: ${totalsB.aplique_se} cliques (CTR ${totalsB.aplique_se_ctr}%)`);
  console.log(`  Acessar:    ${totalsB.acessar} cliques (CTR ${totalsB.acessar_ctr}%)`);
  console.log(`  Razão A/B:  ${totalsB.ratio}x`);
} else {
  console.log(`\nFase B: ainda sem dados (começa em ${AB_CONFIG.changeDate})`);
}

// Salva JSON para o dashboard
const out = {
  generated: new Date().toISOString(),
  config: AB_CONFIG,
  days: allDays,
  phaseA: { label: AB_CONFIG.phaseA_label, totals: totalsA, days: phaseA },
  phaseB: { label: AB_CONFIG.phaseB_label, totals: totalsB, days: phaseB },
};
const outPath = path.join(ROOT, 'data', 'ab-buttons.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`\nSalvo em data/ab-buttons.json`);
