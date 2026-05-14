// =====================================================================
// ab.js — Aba "Teste A/B" — Botões do Header
// =====================================================================

async function showABTest(btn) {
  setActiveBtn(btn);
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="loading-msg" style="text-align:center;padding:60px;color:var(--muted)">Carregando dados A/B…</div>';

  let data;
  try {
    const res = await fetch('./data/ab-buttons.json?v=' + Date.now());
    if (!res.ok) throw new Error('Arquivo ab-buttons.json não encontrado');
    data = await res.json();
  } catch (e) {
    mc.innerHTML = `<div style="padding:40px;color:#e74c3c">Erro ao carregar dados A/B: ${e.message}</div>`;
    return;
  }

  const { config, phaseA, phaseB } = data;
  const hasB = phaseB && Object.keys(phaseB.days || {}).length > 0;

  // --- Helpers ---
  const fmt = n => Number(n).toLocaleString('pt-BR');
  const pct = n => parseFloat(n).toFixed(2) + '%';
  const delta = (a, b) => {
    const d = ((b - a) / a * 100);
    const cls = d >= 0 ? 'pos' : 'neg';
    return `<span class="ab-delta ${cls}">${d >= 0 ? '+' : ''}${d.toFixed(1)}%</span>`;
  };

  // --- Tabela diária ---
  const allDays = Object.entries(data.days).sort(([a], [b]) => {
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    return new Date(ya, ma-1, da) - new Date(yb, mb-1, db);
  });

  const rowsHtml = allDays.map(([date, d]) => {
    const isB = !phaseA.days[date];
    const totalAs = d.aplique_se_pc + d.aplique_se_mobile;
    const totalAc = d.acessar_pc + d.acessar_mobile;
    const total   = d.total_clicks_pc + d.total_clicks_mobile;
    const ctrAs   = total > 0 ? (totalAs / total * 100).toFixed(2) : '—';
    const ctrAc   = total > 0 ? (totalAc / total * 100).toFixed(2) : '—';
    const ratio   = totalAc > 0 ? (totalAs / totalAc).toFixed(1) + 'x' : '—';
    const phase   = isB ? '<span class="ab-badge b">B</span>' : '<span class="ab-badge a">A</span>';
    return `<tr class="${isB ? 'phase-b-row' : ''}">
      <td>${date.substring(0,5)}</td>
      <td>${phase}</td>
      <td>${fmt(totalAs)}</td>
      <td>${ctrAs}%</td>
      <td>${fmt(totalAc)}</td>
      <td>${ctrAc}%</td>
      <td>${ratio}</td>
      <td>${fmt(total)}</td>
    </tr>`;
  }).join('');

  // --- Comparativo A vs B ---
  const tA = phaseA.totals;
  const tB = hasB ? phaseB.totals : null;

  const compHtml = `
  <div class="ab-compare-grid">
    <div class="ab-phase-card phase-a">
      <div class="ab-phase-label">Fase A — ${config.phaseA_label}</div>
      <div class="ab-phase-period">14/04/2026 → 14/05/2026 · ${tA.days} dias</div>
      <div class="ab-metric-row">
        <div class="ab-metric">
          <span class="ab-metric-label">Aplique-se</span>
          <span class="ab-metric-value">${fmt(tA.aplique_se)}</span>
          <span class="ab-metric-ctr">CTR ${pct(tA.aplique_se_ctr)}</span>
        </div>
        <div class="ab-metric">
          <span class="ab-metric-label">Acessar</span>
          <span class="ab-metric-value">${fmt(tA.acessar)}</span>
          <span class="ab-metric-ctr">CTR ${pct(tA.acessar_ctr)}</span>
        </div>
        <div class="ab-metric">
          <span class="ab-metric-label">Razão</span>
          <span class="ab-metric-value">${tA.ratio}x</span>
          <span class="ab-metric-ctr">Aplique-se/Acessar</span>
        </div>
      </div>
    </div>

    <div class="ab-phase-card phase-b ${!hasB ? 'phase-b-empty' : ''}">
      <div class="ab-phase-label">Fase B — ${config.phaseB_label}</div>
      <div class="ab-phase-period">${config.changeDate} em diante${hasB ? ' · ' + tB.days + ' dias' : ' · aguardando dados'}</div>
      ${hasB ? `
      <div class="ab-metric-row">
        <div class="ab-metric">
          <span class="ab-metric-label">Aplique-se</span>
          <span class="ab-metric-value">${fmt(tB.aplique_se)}</span>
          <span class="ab-metric-ctr">CTR ${pct(tB.aplique_se_ctr)} ${delta(parseFloat(tA.aplique_se_ctr), parseFloat(tB.aplique_se_ctr))}</span>
        </div>
        <div class="ab-metric">
          <span class="ab-metric-label">Acessar</span>
          <span class="ab-metric-value">${fmt(tB.acessar)}</span>
          <span class="ab-metric-ctr">CTR ${pct(tB.acessar_ctr)} ${delta(parseFloat(tA.acessar_ctr), parseFloat(tB.acessar_ctr))}</span>
        </div>
        <div class="ab-metric">
          <span class="ab-metric-label">Razão</span>
          <span class="ab-metric-value">${tB.ratio}x</span>
          <span class="ab-metric-ctr">Aplique-se/Acessar ${delta(parseFloat(tA.ratio), parseFloat(tB.ratio))}</span>
        </div>
      </div>` : `<div class="ab-waiting">⏳ Dados disponíveis a partir de amanhã (${config.changeDate})</div>`}
    </div>
  </div>`;

  // --- Gráfico de linha diário ---
  const chartId = 'abLineChart';

  mc.innerHTML = `
  <div style="margin-bottom:8px">
    <h2 style="margin:0 0 4px;font-size:1.1rem">🧪 Teste A/B — Botões do Header</h2>
    <p style="margin:0;color:var(--muted);font-size:.85rem">
      Monitoramento de CTR dos botões <strong>Aplique-se</strong> e <strong>Acessar</strong> antes e depois da troca de copy.
      Identificação por seletor CSS — independente do texto exibido.
    </p>
  </div>

  ${compHtml}

  <div class="card" style="margin-top:20px">
    <div style="font-weight:600;margin-bottom:12px;font-size:.9rem">CTR diário — Aplique-se vs Acessar</div>
    <div style="height:260px"><canvas id="${chartId}"></canvas></div>
  </div>

  <div class="card" style="margin-top:20px">
    <div style="font-weight:600;margin-bottom:12px;font-size:.9rem">Cliques por dia</div>
    <div style="overflow-x:auto">
      <table class="ab-table">
        <thead><tr>
          <th>Dia</th><th>Fase</th>
          <th>Aplique-se</th><th>CTR</th>
          <th>Acessar</th><th>CTR</th>
          <th>Razão</th><th>Total cliques</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;

  // Renderiza gráfico
  const labels = allDays.map(([d]) => d.substring(0,5));
  const isPhaseB = allDays.map(([d]) => !phaseA.days[d]);
  const ctrAsList = allDays.map(([, d]) => {
    const tot = d.total_clicks_pc + d.total_clicks_mobile;
    const as  = d.aplique_se_pc + d.aplique_se_mobile;
    return tot > 0 ? parseFloat((as / tot * 100).toFixed(2)) : 0;
  });
  const ctrAcList = allDays.map(([, d]) => {
    const tot = d.total_clicks_pc + d.total_clicks_mobile;
    const ac  = d.acessar_pc + d.acessar_mobile;
    return tot > 0 ? parseFloat((ac / tot * 100).toFixed(2)) : 0;
  });

  new Chart(document.getElementById(chartId), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Aplique-se CTR (%)',
          data: ctrAsList,
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79,142,247,0.1)',
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: isPhaseB.map(b => b ? '#f39c12' : '#4f8ef7'),
        },
        {
          label: 'Acessar CTR (%)',
          data: ctrAcList,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46,204,113,0.08)',
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: isPhaseB.map(b => b ? '#e67e22' : '#2ecc71'),
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        annotation: {
          annotations: hasB ? [{
            type: 'line',
            xMin: labels.indexOf(config.changeDate.substring(0,5)),
            xMax: labels.indexOf(config.changeDate.substring(0,5)),
            borderColor: '#e74c3c',
            borderWidth: 2,
            borderDash: [4,4],
            label: { content: 'Copy novo', enabled: true, color: '#e74c3c', font: { size: 10 } },
          }] : [],
        },
        legend: { labels: { color: C.text, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => isPhaseB[ctx.dataIndex] ? '  📌 Fase B' : '  📋 Fase A',
          }
        }
      },
    },
  });
}
