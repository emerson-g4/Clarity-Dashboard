// =====================================================================
// app.js — init, navegação dinâmica, lazy loading por mês
// =====================================================================

// Estado global
const STATE = {
  activeMonth: null,
  activeView: null,   // 'month-overview' | 'day-DDMM' | 'compare' | 'errors'
  loadedMonths: {},   // monthLabel → allData
};

// ── Navegação ─────────────────────────────────────────────────────────

function buildNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const months = Object.keys(MONTH_MAP);

  // Botão Visão Geral do mês corrente
  let html = `<button id="nav-overview" onclick="showMonthOverview('${months[months.length - 1]}', this)" class="active">📊 Visão Geral</button>`;

  // Um grupo por mês
  months.forEach(month => {
    const days = MONTH_MAP[month];
    const short = month.split(' ')[0].substring(0, 3); // "Abr", "Mai"
    html += `<div class="nav-group">
      <button class="nav-month-btn" onclick="toggleMonthDays('${month}', this)">${short} <span class="nav-arrow">▾</span></button>
      <div class="nav-days" id="days-${month.replace(/ /g,'_')}" style="display:none">
        ${days.map(d => `<button onclick="showDay('${d}', this)">${d}</button>`).join('')}
      </div>
    </div>`;
  });

  html += `<button onclick="showCompare(this)">⚖️ Comparar</button>`;
  nav.innerHTML = html;
}

function setActiveBtn(btn) {
  document.querySelectorAll('#mainNav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function toggleMonthDays(month, btn) {
  const container = document.getElementById('days-' + month.replace(/ /g, '_'));
  if (!container) return;
  const isOpen = container.style.display !== 'none';
  container.style.display = isOpen ? 'none' : 'flex';
  btn.querySelector('.nav-arrow').textContent = isOpen ? '▾' : '▴';
}

// ── Views ─────────────────────────────────────────────────────────────

async function showMonthOverview(month, btn) {
  setActiveBtn(btn || document.getElementById('nav-overview'));
  const content = document.getElementById('mainContent');
  content.innerHTML = '<div class="loading-msg">Carregando ' + month + '…</div>';

  try {
    if (!STATE.loadedMonths[month]) {
      STATE.loadedMonths[month] = await loadMonth(month);
    }
    const allData = STATE.loadedMonths[month];
    // Atualizar header
    document.getElementById('dashTitle').textContent = `Microsoft Clarity — g4business.com`;
    document.getElementById('dashSub').textContent   = month;

    renderMonth(content, month, allData);
    STATE.activeMonth = month;
    STATE.activeView  = 'month-' + month;
  } catch (err) {
    showError(content, err);
  }
}

async function showDay(day, btn) {
  setActiveBtn(btn);
  const content = document.getElementById('mainContent');
  content.innerHTML = '<div class="loading-msg">Carregando ' + day + '…</div>';

  try {
    const data = await loadDay(day);
    document.getElementById('dashSub').textContent = day + '/2026';
    renderDay(content, day, data);
    STATE.activeView = 'day-' + day.replace('/', '');
  } catch (err) {
    showError(content, err);
  }
}

function showCompare(btn) {
  setActiveBtn(btn);
  const content = document.getElementById('mainContent');
  document.getElementById('dashSub').textContent = 'Comparação';
  renderCompare(content);
  STATE.activeView = 'compare';
}

function showError(container, err) {
  console.error(err);
  container.innerHTML = `
    <div style="padding:40px;text-align:center">
      <div style="color:var(--danger);font-size:18px;font-weight:700;margin-bottom:12px">Erro ao carregar dados</div>
      <div style="color:var(--text-muted);font-size:13px;margin-bottom:20px">${err.message}</div>
      <div style="background:#1e2233;border-radius:8px;padding:16px;text-align:left;max-width:500px;margin:0 auto;font-size:12px;color:var(--text-muted)">
        <strong style="color:#fff">Para ativar os dados dinâmicos:</strong><br><br>
        1. Abra a planilha no Google Sheets<br>
        2. Menu <strong>Arquivo → Compartilhar → Publicar na Web</strong><br>
        3. Selecione <strong>"Pasta de trabalho inteira"</strong> e formato <strong>CSV</strong><br>
        4. Clique em <strong>Publicar</strong> e recarregue esta página
      </div>
    </div>`;
}

// ── Inicialização ─────────────────────────────────────────────────────

async function init() {
  buildNav();

  // Carrega o último mês disponível por padrão
  const months  = Object.keys(MONTH_MAP);
  const lastMonth = months[months.length - 1];
  await showMonthOverview(lastMonth, document.getElementById('nav-overview'));
}

document.addEventListener('DOMContentLoaded', init);
