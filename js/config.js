// =====================================================================
// config.js — GIDs, cores, mapeamento mês→dias
// =====================================================================

const SHEET_ID = '10M_2Ne7UDvwezJVJEoWnxThJFvZWKmqpel-vlNOUemM';

// Registre aqui cada dia novo: 'DD/MM': 'GID'
// Para adicionar maio: '01/05': 'GID_AQUI', etc.
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

// Agrupa dias por mês automaticamente
function buildMonthMap() {
  const map = {}; // { 'Abril 2026': ['14/04','15/04',...], 'Maio 2026': [...] }
  const monthNames = {
    '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril',
    '05':'Maio','06':'Junho','07':'Julho','08':'Agosto',
    '09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro'
  };
  for (const day of Object.keys(GIDS)) {
    const [dd, mm] = day.split('/');
    const year = '2026'; // ajustar quando virar ano
    const label = `${monthNames[mm]} ${year}`;
    if (!map[label]) map[label] = [];
    map[label].push(day);
  }
  return map;
}

const MONTH_MAP = buildMonthMap();

// Paleta de cores
const C = {
  primary:  '#4f8ef7',
  success:  '#2ecc71',
  warning:  '#f39c12',
  danger:   '#e74c3c',
  purple:   '#9b59b6',
  teal:     '#1abc9c',
  orange:   '#e67e22',
  pink:     '#e91e8c',
  grid:     'rgba(255,255,255,0.06)',
  text:     '#8892a4',
  bg:       '#1a1d27',
};

const KPI_TIPS = {
  'Score Performance': 'Nota geral de performance (0–100). Acima de 80 é bom, abaixo de 70 precisa atenção.',
  'LCP':  'Largest Contentful Paint — tempo até o maior elemento aparecer. Meta: abaixo de 2,5s.',
  'INP':  'Interaction to Next Paint — velocidade de resposta a cliques. Meta: abaixo de 200ms.',
  'CLS':  'Cumulative Layout Shift — quanto a página treme ao carregar. Meta: abaixo de 0,1.',
  'Bots': 'Acessos automatizados (robôs). Alto volume pode distorcer as métricas reais.',
  'Sessões Totais':  'Total de acessos ao site, incluindo humanos e bots.',
  'Sessões Humanas': 'Acessos reais de pessoas, excluindo tráfego automatizado.',
  'Rolagem Média':   'Profundidade média de rolagem — até onde os usuários chegam na página.',
  'Scroll':          'Profundidade média de rolagem — até onde os usuários chegam na página.',
  'Páginas/Sessão':  'Quantas páginas cada visita acessa em média.',
  'Tempo Ativo':     'Tempo em que o usuário estava ativamente interagindo com a página.',
  'Rage Click':      'Usuário clicou várias vezes no mesmo lugar — sinal de frustração.',
  'Dead Click':      'Clique em elemento que não reage — parece clicável mas não faz nada.',
};

function tipIcon(label) {
  const tip = KPI_TIPS[label] || Object.entries(KPI_TIPS).find(([k]) => label.includes(k))?.[1] || '';
  return tip ? `<span class="tip-icon" data-tip="${tip.replace(/"/g, '&quot;')}">ⓘ</span>` : '';
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: C.text, font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: C.text, font: { size: 11 } }, grid: { color: C.grid } },
    y: { ticks: { color: C.text, font: { size: 11 } }, grid: { color: C.grid } },
  },
};
