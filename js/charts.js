function showTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-nav button').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

const DIAS = ['14/04','15/04','16/04','17/04','18/04','19/04','20/04','21/04'];
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

function mk(id, type, data, opts={}) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, { type, data, options: { ...chartDefaults, ...opts } });
}

function mkDoughnut(id, labels, data, colors) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, {
    type:'doughnut', data:{ labels, datasets:[{data, backgroundColor:colors, borderWidth:1, borderColor:'#1a1d27'}]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{color:C.text,font:{size:11},boxWidth:12}}}}
  });
}

function mkBar(id, labels, data, color, label) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, {
    type:'bar', data:{ labels, datasets:[{label, data, backgroundColor:color+'99', borderColor:color, borderWidth:1, borderRadius:4}]},
    options:{ ...chartDefaults, indexAxis:'y', plugins:{legend:{display:false}}}
  });
}

// ---- GERAL CHARTS ----
mk('cSessoes','bar',{
  labels: DIAS,
  datasets:[{label:'Sessões Humanas',data:[477,902,695,694,91,366,542,486],backgroundColor:C.primary+'99',borderColor:C.primary,borderWidth:1,borderRadius:4},
            {label:'Bots',data:[80,42,251,32,298,22,79,15],backgroundColor:C.danger+'99',borderColor:C.danger,borderWidth:1,borderRadius:4}]
},{plugins:{legend:{labels:{color:C.text}}}});

mk('cPerf','line',{
  labels: DIAS,
  datasets:[{label:'Score',data:[68.0,80.0,79.4,73.8,75.0,78.8,73.9,82.3],borderColor:C.teal,backgroundColor:C.teal+'22',tension:.3,pointRadius:5,fill:true}]
},{scales:{y:{min:60,max:90,ticks:{color:C.text},grid:{color:C.grid}},x:{ticks:{color:C.text},grid:{color:C.grid}}}});

mk('cBots','bar',{
  labels: DIAS,
  datasets:[
    {label:'Humanos',data:[477,902,695,694,91,366,542,486],backgroundColor:C.success+'99',borderColor:C.success,borderWidth:1,borderRadius:4},
    {label:'Bots',data:[80,42,251,32,298,22,79,15],backgroundColor:C.danger+'99',borderColor:C.danger,borderWidth:1,borderRadius:4}
  ]
},{plugins:{legend:{labels:{color:C.text}}}, scales:{x:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}},y:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}}}});

mk('cErroDia','bar',{
  labels: DIAS,
  datasets:[{label:'Erros JS',data:[48,74,59,68,35,18,52,37],backgroundColor:[C.warning+'99',C.danger+'99',C.warning+'99',C.warning+'99',C.primary+'99',C.success+'99',C.warning+'99',C.primary+'99'],borderWidth:1,borderRadius:4}]
},{plugins:{legend:{display:false}}});

mk('cLcp','line',{
  labels: DIAS,
  datasets:[
    {label:'LCP (s)',data:[3.624,3.3,3.4,3.308,2.695,3.4,3.712,2.884],borderColor:C.danger,backgroundColor:C.danger+'22',tension:.3,pointRadius:5,fill:true},
    {label:'Meta (2,5s)',data:[2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5],borderColor:C.success,borderDash:[6,3],pointRadius:0,fill:false}
  ]
},{plugins:{legend:{labels:{color:C.text}}}});

mk('cInp','line',{
  labels: DIAS,
  datasets:[
    {label:'INP (ms)',data:[360,184,216,200,232,176,360,176],borderColor:C.warning,backgroundColor:C.warning+'22',tension:.3,pointRadius:5,fill:true},
    {label:'Meta (200ms)',data:[200,200,200,200,200,200,200,200],borderColor:C.success,borderDash:[6,3],pointRadius:0,fill:false}
  ]
},{plugins:{legend:{labels:{color:C.text}}}});

mk('cCls','line',{
  labels: DIAS,
  datasets:[
    {label:'CLS',data:[0.261,0.033,0.014,0.515,0.510,0.025,0.033,0.024],borderColor:C.purple,backgroundColor:C.purple+'22',tension:.3,pointRadius:5,fill:true},
    {label:'Meta (0,1)',data:[0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1],borderColor:C.success,borderDash:[6,3],pointRadius:0,fill:false}
  ]
},{plugins:{legend:{labels:{color:C.text}}}});

mkDoughnut('cDispGeral',['PC','Mobile','Tablet'],[3013,2198,51],[C.primary,C.teal,C.warning]);

mk('cCanais','bar',{
  labels: DIAS,
  datasets:[
    {label:'Organic',data:[225,402,406,357,171,158,296,243],backgroundColor:C.success+'cc',borderRadius:3},
    {label:'Referral',data:[203,226,178,181,181,191,179,164],backgroundColor:C.primary+'cc',borderRadius:3},
    {label:'Direct',data:[193,305,331,272,127,127,230,149],backgroundColor:C.teal+'cc',borderRadius:3},
    {label:'Other',data:[150,316,336,183,77,79,178,124],backgroundColor:C.warning+'cc',borderRadius:3},
    {label:'PaidSearch',data:[24,43,51,27,27,10,22,32],backgroundColor:C.purple+'cc',borderRadius:3}
  ]
},{plugins:{legend:{labels:{color:C.text,font:{size:10}}}},scales:{x:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}},y:{stacked:true,ticks:{color:C.text},grid:{color:C.grid}}}});

mk('cErroTipo','bar',{
  labels:['autoplay','wp is not defined','script error.','can\'t find var: wp','null getattribute','resizeobserver','webkit msg','swiper','hbspt','unexpected EOF'],
  datasets:[{label:'Sessões',data:[200,73,55,23,8,10,2,1,1,1],backgroundColor:[C.danger+'cc',C.danger+'99',C.warning+'cc',C.warning+'99',C.primary+'cc',C.primary+'99',C.teal+'cc',C.teal+'99',C.purple+'cc',C.purple+'99'],borderRadius:4}]
},{plugins:{legend:{display:false}},indexAxis:'y'});

// ---- GERAL JS EVOLUTION ----
mk('js-acum','bar',{
  labels:['autoplay','wp not defined','script error.','can\'t find var: wp','null getattribute','resizeobserver','outros'],
  datasets:[{label:'Total de sessões afetadas',data:[200,73,55,23,8,10,22],backgroundColor:[C.danger+'cc',C.danger+'99',C.warning+'cc',C.warning+'99',C.primary+'cc',C.primary+'99',C.teal+'cc'],borderRadius:4}]
},{plugins:{legend:{display:false}},indexAxis:'y'});

mk('js-evolucao','line',{
  labels: DIAS,
  datasets:[
    {label:'autoplay',data:[28,45,31,31,8,6,35,16],borderColor:C.danger,backgroundColor:C.danger+'22',tension:.3,pointRadius:4},
    {label:'wp not defined',data:[8,14,9,9,9,7,11,6],borderColor:C.warning,backgroundColor:C.warning+'22',tension:.3,pointRadius:4},
    {label:'script error.',data:[6,7,13,5,11,2,4,7],borderColor:C.primary,backgroundColor:C.primary+'22',tension:.3,pointRadius:4}
  ]
},{plugins:{legend:{labels:{color:C.text}}}});

// ---- PER-DAY CHARTS ----
const dispColors = [C.primary, C.teal, C.warning];

mkDoughnut('d1404-disp',['Mobile','PC','Tablet'],[267,260,3],dispColors);
mkDoughnut('d1504-disp',['PC','Mobile','Tablet'],[514,367,8],dispColors);
mkDoughnut('d1604-disp',['PC','Mobile','Tablet'],[581,310,6],dispColors);
mkDoughnut('d1704-disp',['PC','Mobile','Tablet'],[411,287,5],dispColors);
mkDoughnut('d1804-disp',['Mobile','PC','Tablet'],[247,135,7],dispColors);
mkDoughnut('d1904-disp',['Mobile','PC','Tablet'],[281,105,2],dispColors);
mkDoughnut('d2004-disp',['PC','Mobile','Tablet'],[373,236,5],dispColors);
mkDoughnut('d2104-disp',['Mobile','PC','Tablet'],[268,224,9],dispColors);

const osColors = [C.primary,C.teal,C.warning,C.purple,C.danger];
mkBar('d1404-os',['Windows','iOS','Android','MacOS','Linux'],[196,169,101,86,5],C.primary,'Sessões');
mkBar('d1504-os',['Windows','iOS','MacOS','Android','Linux'],[394,250,169,125,5],C.primary,'Sessões');
mkBar('d1604-os',['Windows','iOS','MacOS','Android','Linux'],[437,231,184,85,9],C.primary,'Sessões');
mkBar('d1704-os',['Windows','iOS','MacOS','Android','Linux'],[320,190,109,102,4],C.primary,'Sessões');
mkBar('d1804-os',['iOS','Android','Windows','MacOS','Linux'],[145,109,97,32,4],C.primary,'Sessões');
mkBar('d1904-os',['iOS','Android','Windows','MacOS','Linux'],[172,111,72,31,4],C.primary,'Sessões');
mkBar('d2004-os',['Windows','iOS','Android','MacOS','Linux'],[286,141,100,89,4],C.primary,'Sessões');
mkBar('d2104-os',['iOS','Windows','Android','MacOS','Linux'],[172,151,105,69,2],C.primary,'Sessões');

const canalData = {
  d1404:{labels:['OrganicSearch','Referral','Direct','Other','PaidSearch'],data:[225,203,193,150,24]},
  d1504:{labels:['OrganicSearch','Other','Direct','Referral','PaidSearch'],data:[402,316,305,226,43]},
  d1604:{labels:['OrganicSearch','Other','Direct','Referral','PaidSearch'],data:[406,336,331,178,51]},
  d1704:{labels:['OrganicSearch','Direct','Other','Referral','PaidSearch'],data:[357,272,183,181,27]},
  d1804:{labels:['Referral','OrganicSearch','Direct','Other','PaidSearch'],data:[171,158,127,77,10]},
  d1904:{labels:['Referral','OrganicSearch','Direct','Other','PaidSearch'],data:[191,133,118,79,10]},
  d2004:{labels:['OrganicSearch','Direct','Referral','Other','PaidSearch'],data:[296,230,179,178,32]},
  d2104:{labels:['OrganicSearch','Referral','Direct','Other','PaidSearch'],data:[243,164,149,124,32]}
};
Object.entries(canalData).forEach(([day,{labels,data}]) => mkBar(`${day}-canal`,labels,data,C.teal,'Sessões'));

const jsData = {
  d1404:{labels:['autoplay','wp not def','script err','can\'t var wp','webkit'],data:[28,8,6,5,1]},
  d1504:{labels:['autoplay','wp not def','script err','null getattr','can\'t var wp'],data:[45,14,7,5,1]},
  d1604:{labels:['autoplay','script err','wp not def','can\'t var wp','swiper'],data:[31,13,9,3,1]},
  d1704:{labels:['autoplay','resizeobs','wp not def','script err','can\'t var wp'],data:[31,10,9,5,3]},
  d1804:{labels:['script err','wp not def','autoplay','can\'t var wp','hbspt'],data:[11,9,8,3,1]},
  d1904:{labels:['wp not def','autoplay','can\'t var wp','script err','webkit'],data:[7,6,2,2,1]},
  d2004:{labels:['autoplay','wp not def','script err','null getattr','unex EOF'],data:[35,11,4,1,1]},
  d2104:{labels:['autoplay','script err','wp not def','can\'t var wp','null getattr'],data:[16,7,6,3,2]}
};
const jsColors = [C.danger,C.warning,C.primary,C.teal,C.purple];
Object.entries(jsData).forEach(([day,{labels,data}]) => {
  const el = document.getElementById(`${day}-js`);
  if (!el) return;
  new Chart(el,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:jsColors,borderWidth:1,borderColor:'#1a1d27'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:C.text,font:{size:10},boxWidth:12}}}}});
});
