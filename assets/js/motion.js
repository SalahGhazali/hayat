/* Real local Chart.js / CountUp.js / AOS integrations; every value has a static fallback. */
(()=>{'use strict';
const H=window.Hayat;if(!H)return;
const preference=matchMedia('(prefers-reduced-motion: reduce)'),charts=new Map(),values=new Map();
const palette=['#C62828','#0F766E','#64748B','#A91D2A','#475569','#115E59','#92400E','#334155'];
const number=value=>new Intl.NumberFormat('ar-u-nu-latn').format(value);
const isolateLabel=label=>/^(?:O|AB|A|B)[+-]$/.test(String(label))?'\u2066'+label+'\u2069':label;
function finalValue(el,value){el.textContent=number(value);el.dataset.countFinal=String(value)}
function counters(root=document){
 root.querySelectorAll('[data-count]').forEach(el=>{const value=Number(el.dataset.count);if(!Number.isFinite(value))return;const key=location.pathname+':'+(el.dataset.counterKey||el.dataset.homeStat||'');const previous=values.get(key);values.set(key,value);finalValue(el,value);
  const Count=window.countUp?.CountUp;if(preference.matches||!Count||previous===value)return;
  const counter=new Count(el,value,{startVal:previous??0,duration:.55,useGrouping:true,formattingFn:number});
  if(!counter.error){counter.start();el._hayatCounter=counter}
 });
}
function initCharts(root=document){
 if(!window.Chart)return;
 Chart.defaults.font.family='Cairo, sans-serif';Chart.defaults.color='#475569';Chart.defaults.animation=preference.matches?false:{duration:600};
 root.querySelectorAll('canvas[data-chart]').forEach(canvas=>{if(charts.has(canvas))return;
  try{const spec=JSON.parse(canvas.dataset.chart);const chart=new Chart(canvas,{type:spec.type||'bar',data:{labels:spec.labels,datasets:spec.datasets.map((set,index)=>({...set,backgroundColor:spec.type==='line'?palette[index]:palette,borderColor:palette[index],borderWidth:spec.type==='line'?2:0,tension:.25,fill:false}))},options:{responsive:true,maintainAspectRatio:false,animation:preference.matches?false:{duration:600},locale:'ar-u-nu-latn',plugins:{legend:{display:spec.datasets.length>1,rtl:true,textDirection:'rtl',labels:{usePointStyle:true}},tooltip:{rtl:true,textDirection:'rtl',callbacks:{title:items=>items.map(item=>isolateLabel(item.label))}},title:{display:false}},scales:{x:{grid:{display:false},ticks:{autoSkip:true,maxRotation:0,callback(value){return isolateLabel(this.getLabelForValue(value))}}},y:{beginAtZero:true,ticks:{precision:0}}}}});charts.set(canvas,chart)}catch{canvas.hidden=true}
 });
}
function dispose(root=document){for(const [canvas,chart]of charts)if(root.contains(canvas)){chart.destroy();charts.delete(canvas)}}
function home(){const D=window.HayatData;if(!D)return;try{const state=D.read(),stats={donors:H.allUsers().filter(u=>u.role==='donor').length,banks:state.banks.length,donations:state.donations.filter(d=>d.status==='confirmed').length};document.querySelectorAll('[data-home-stat]').forEach(el=>{const value=stats[el.dataset.homeStat];if(value!==undefined){el.dataset.count=String(value);finalValue(el,value)}})}catch{/* Static demo labels and values remain visible. */}}
function reveals(){if(!['home','how'].includes(document.body.dataset.page)||preference.matches||!window.AOS)return;try{document.documentElement.classList.add('js-motion');AOS.init({duration:450,once:true,offset:24,disableMutationObserver:true});AOS.refresh()}catch{document.documentElement.classList.remove('js-motion')}}
function refresh(root=document){counters(root);initCharts(root)}
H.motion={refresh,dispose,reduced:()=>preference.matches,palette};
document.addEventListener('DOMContentLoaded',()=>{home();refresh();reveals()});
window.addEventListener('storage',event=>{if(!event.key?.startsWith(H.prefix)||!document.querySelector('[data-home-stat]'))return;home();counters()});
preference.addEventListener('change',()=>{document.documentElement.classList.remove('js-motion');document.querySelectorAll('[data-count]').forEach(el=>{el._hayatCounter?.reset();finalValue(el,Number(el.dataset.count))});for(const chart of charts.values()){chart.options.animation=preference.matches?false:{duration:600};chart.update('none')}if(!preference.matches)reveals()});
})();
