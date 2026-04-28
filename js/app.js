// =====================================================================
// app.js — init, navegação dinâmica, lazy loading por mês
// =====================================================================

const STATE = {
  activeMonth: null,
  activeView: null,
  loadedMonths: {},
};

// ── Tooltips ──────────────────────────────────────────────────────────

const TOOLTIPS = {
  LCP:         'Largest Contentful Paint — tempo até o maior elemento da página aparecer. Meta: abaixo de 2,5s.',
  INP:         'Interaction to Next Paint — velocidade de resposta a cliques e toques. Meta: abaixo de 200ms.',
  CLS:         'Cumulative Layout Shift — quanto a página "treme" enquanto carrega. Meta: abaixo de 0,1.',
  Score:       'Nota geral de performance calculada pelo Clarity (0–100). Acima de 80 é bom.',
  Bots:        'Acessos automatizados (robôs), não humanos. Alto volume pode distorcer métricas.',
  'Rage Click':'Usuário clicou várias vezes seguidas no mesmo lugar — sinal de frustração.',
  'Dead Click': 'Clique em elemento que não reage — botão ou link que parece clicável mas não faz nada.',
  'Rolagem':   'Profundidade média de rolagem — até onde os usuários chegam na página.',
  'Scroll':    'Profundidade média de rolagem — até onde os usuários chegam na página.',
};

function tooltip(key) {
  const tip = TOOLTIPS[key] || '';
  if (!tip) return '';
  return `<span class="tip-icon" data-tip="${tip.replace(/"/g, '&quot;')}">ⓘ</span>`;
}

// ── Navegação ─────────────────────────────────────────────────────────

function buildNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const months = Object.keys(MONTH_MAP);
  let html = `<button id="nav-overview" onclick="showMonthOverview('${months[months.length - 1]}', this)" class="active">📊 Visão Geral</button>`;

  months.forEach(month => {
    const short = month.split(' ')[0].substring(0, 3);
    html += `<div class="nav-group">
      <button class="nav-month-btn" onclick="showMonthOverview('${month}', this)">${short} <span class="nav-arrow">▾</span></button>
    </div>`;
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
    if (!STATE.loadedMonths[month]) {
      STATE.loadedMonths[month] = await loadMonth(month);
    }
    const allData = STATE.loadedMonths[month];
    const sub = document.getElementById('dashSub');
    if (sub) sub.textContent = month;

    renderMonthWithSelector(content, month, allData);
    STATE.activeMonth = month;
    STATE.activeView  = 'month-' + month;
  } catch (err) {
    showError(content, err);
  }
}

function renderMonthWithSelector(container, month, allData) {
  const days = Object.keys(allData);

  // Cabeçalho com seletor de dia
  const selectorHTML = `
    <div class="day-selector-bar">
      <span class="day-selector-label">Visualizar:</span>
      <select id="daySelectorDrop" onchange="onDaySelect('${month}')">
        <option value="__all__">Todos os dias (visão geral)</option>
        ${days.map(d => `<option value="${d}">${d}</option>`).join('')}
      </select>
    </div>
  `;

  // Seção comparação colapsável
  const allDays = Object.keys(GIDS);
  const allMonths = Object.keys(MONTH_MAP);
  const dayOptions = allDays.map(d => `<option value="${d}">${d}</option>`).join('');
  const monthOptions = allMonths.map(m => `<option value="${m}">${m}</option>`).join('');

  const compareHTML = `
    <div class="compare-section">
      <button class="compare-toggle" onclick="toggleCompare(this)">⚖️ Comparar <span class="nav-arrow">▾</span></button>
      <div class="compare-body" id="compareBody" style="display:none">
        <div class="compare-panels">
          <div class="chart-card">
            <h3>Comparar Meses</h3>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px">
              <label style="color:var(--muted);font-size:12px">Mês A:
                <select id="cmp-mesA" style="background:#252836;color:#fff;border:1px solid var(--border);border-radius:6px;padding:5px 8px;margin-left:4px">${monthOptions}</select>
              </label>
              <label style="color:var(--muted);font-size:12px">Mês B:
                <select id="cmp-mesB" style="background:#252836;color:#fff;border:1px solid var(--border);border-radius:6px;padding:5px 8px;margin-left:4px">${monthOptions}</select>
              </label>
              <button class="cmp-btn" onclick="runMonthCompare()">Comparar Meses</button>
            </div>
            <div id="cmp-month-result" style="margin-top:16px"></div>
          </div>
          <div class="chart-card">
            <h3>Comparar Dias</h3>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px">
              <label style="color:var(--muted);font-size:12px">Dia A:
                <select id="cmp-diaA" style="background:#252836;color:#fff;border:1px solid var(--border);border-radius:6px;padding:5px 8px;margin-left:4px">${dayOptions}</select>
              </label>
              <label style="color:var(--muted);font-size:12px">Dia B:
                <select id="cmp-diaB" style="background:#252836;color:#fff;border:1px solid var(--border);border-radius:6px;padding:5px 8px;margin-left:4px">${dayOptions}</select>
              </label>
              <button class="cmp-btn" onclick="runDayCompare()">Comparar Dias</button>
            </div>
            <div id="cmp-day-result" style="margin-top:16px"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Área de conteúdo principal
  container.innerHTML = selectorHTML + '<div id="monthMainContent"></div>' + compareHTML;

  // Pré-selecionar segundo mês/dia diferente
  const selMesB = document.getElementById('cmp-mesB');
  if (selMesB && allMonths.length > 1) selMesB.selectedIndex = Math.min(1, allMonths.length - 1);
  const selDiaB = document.getElementById('cmp-diaB');
  if (selDiaB && allDays.length > 1) selDiaB.selectedIndex = Math.min(1, allDays.length - 1);

  // Renderiza visão geral do mês por padrão
  renderMonth(document.getElementById('monthMainContent'), month, allData);

  // Ativa tooltips
  initTooltips(container);
}

function onDaySelect(month) {
  const sel = document.getElementById('daySelectorDrop');
  if (!sel) return;
  const val = sel.value;
  const mainContent = document.getElementById('monthMainContent');
  if (!mainContent) return;

  if (val === '__all__') {
    const allData = STATE.loadedMonths[month];
    renderMonth(mainContent, month, allData);
    initTooltips(mainContent);
  } else {
    mainContent.innerHTML = '<div class="loading-msg">Carregando ' + val + '…</div>';
    loadDay(val).then(data => {
      renderDay(mainContent, val, data);
      initTooltips(mainContent);
    }).catch(err => showError(mainContent, err));
  }
}

function toggleCompare(btn) {
  const body = document.getElementById('compareBody');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  btn.querySelector('.nav-arrow').textContent = isOpen ? '▾' : '▴';
}

// ── Tooltips DOM ──────────────────────────────────────────────────────

function initTooltips(root) {
  (root || document).querySelectorAll('.tip-icon').forEach(el => {
    el.addEventListener('mouseenter', showTip);
    el.addEventListener('mouseleave', hideTip);
  });
}

function showTip(e) {
  let box = document.getElementById('_tipbox');
  if (!box) {
    box = document.createElement('div');
    box.id = '_tipbox';
    box.className = 'tipbox';
    document.body.appendChild(box);
  }
  box.textContent = e.target.dataset.tip;
  box.style.display = 'block';
  const rect = e.target.getBoundingClientRect();
  box.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
  box.style.left = (rect.left + window.scrollX) + 'px';
}

function hideTip() {
  const box = document.getElementById('_tipbox');
  if (box) box.style.display = 'none';
}

// ── Erro ──────────────────────────────────────────────────────────────

function showError(container, err) {
  console.error(err);
  container.innerHTML = `
    <div style="padding:40px;text-align:center">
      <div style="color:var(--danger);font-size:18px;font-weight:700;margin-bottom:12px">Erro ao carregar dados</div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:20px">${err.message}</div>
      <div style="background:#1e2233;border-radius:8px;padding:16px;text-align:left;max-width:500px;margin:0 auto;font-size:12px;color:var(--muted)">
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
  const months   = Object.keys(MONTH_MAP);
  const lastMonth = months[months.length - 1];
  await showMonthOverview(lastMonth, document.getElementById('nav-overview'));
}

document.addEventListener('DOMContentLoaded', init);
