const API="https://genshin-db-api.vercel.app/api/v5";
const STATS={"PV%":"percent","ATQ%":"percent","DEF%":"percent","Maîtrise élémentaire":"flat","Recharge d'énergie":"percent","TC":"percent","DC":"percent","PV flat":"flat","ATQ flat":"flat","DEF flat":"flat","Bonus Pyro":"percent","Bonus Hydro":"percent","Bonus Électro":"percent","Bonus Cryo":"percent","Bonus Anémo":"percent","Bonus Géo":"percent","Bonus Dendro":"percent","Bonus physique":"percent","Soin":"percent"};
const ROLLS={"TC":[2.7,3.1,3.5,3.9],"DC":[5.4,6.2,7,7.8],"ATQ%":[4.1,4.7,5.3,5.8],"Recharge d'énergie":[4.5,5.2,5.8,6.5],"Maîtrise élémentaire":[16,19,21,23],"DEF%":[5.1,5.8,6.6,7.3],"PV%":[4.1,4.7,5.3,5.8],"ATQ flat":[14,16,18,19],"DEF flat":[16,19,21,23],"PV flat":[209,239,269,299]};
const MAIN={Fleur:["PV flat"],Plume:["ATQ flat"],Sablier:["PV%","ATQ%","DEF%","Maîtrise élémentaire","Recharge d'énergie"],Coupe:["PV%","ATQ%","DEF%","Maîtrise élémentaire","Bonus Pyro","Bonus Hydro","Bonus Électro","Bonus Cryo","Bonus Anémo","Bonus Géo","Bonus Dendro","Bonus physique"],Couronne:["PV%","ATQ%","DEF%","Maîtrise élémentaire","TC","DC","Soin"]};
const MAIN_VALUES={"PV flat":4780,"ATQ flat":311,"PV%":46.6,"ATQ%":46.6,"DEF%":58.3,"Maîtrise élémentaire":187,"Recharge d'énergie":51.8,"Bonus Pyro":46.6,"Bonus Hydro":46.6,"Bonus Électro":46.6,"Bonus Cryo":46.6,"Bonus Anémo":46.6,"Bonus Géo":46.6,"Bonus Dendro":46.6,"Bonus physique":58.3,"TC":31.1,"DC":62.2,"Soin":35.9};
const SLOTS=Object.keys(MAIN);
const $=x=>document.getElementById(x),esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
let db=[],current=null,builds=JSON.parse(localStorage.getItem("teyvat_builds_v5")||"[]");
function opts(arr,sel=""){return arr.map(x=>`<option value="${esc(x)}" ${String(x)===String(sel)?"selected":""}>${esc(x)}</option>`).join("")}
function statOpts(sel=""){return opts(Object.keys(STATS),sel)}
function fmt(n,u=""){return `${Math.round((Number(n)||0)*10)/10}${u}`}
function save(){localStorage.setItem("teyvat_builds_v5",JSON.stringify(builds))}
async function loadDB(){try{const r=await fetch(`${API}/characters?query=names&matchCategories=true&resultLanguage=french&queryLanguages=french,english`);const j=await r.json();const names=Array.isArray(j)?j:(j.result||j.data||[]);db=Array.isArray(names)?names.map(x=>typeof x==="string"?{name:x}:x).filter(x=>x.name):[];$('dbStatus').textContent=`Base chargée : ${db.length} personnages.`;renderResults()}catch(e){$('dbStatus').textContent="Base en ligne indisponible."}}
async function findCharacter(name){try{const r=await fetch(`${API}/characters?query=${encodeURIComponent(name)}&queryLanguages=french,english&resultLanguage=french`);const j=await r.json();return j.result||j.data||j}catch(e){return null}}
async function findStats(name,level=90){try{const r=await fetch(`${API}/stats?folder=characters&query=${encodeURIComponent(name)}&level=${level}&queryLanguages=french,english&resultLanguage=french`);const j=await r.json();return j.result||j.data||j}catch(e){return null}}
function imageFor(c){return c?.images?.portrait||c?.images?.cover1||c?.images?.icon||""}
function displayElement(x){return x?({Pyro:"Pyro",Hydro:"Hydro",Anemo:"Anémo",Geo:"Géo",Electro:"Électro",Cryo:"Cryo",Dendro:"Dendro"}[x]||x):""}
function renderResults(){const q=$('search').value.trim().toLowerCase();const list=db.filter(c=>!q||String(c.name).toLowerCase().includes(q)).slice(0,30);$('results').innerHTML=list.map(c=>`<button class="char" data-name="${esc(c.name)}"><img src="${esc(imageFor(c))}" onerror="this.style.display='none'"><span class="charInfo"><strong>${esc(c.name)}</strong><small>${esc(displayElement(c.element)||"Genshin")} · ${c.rarity?c.rarity+"★":""}</small></span><span class="choose">Choisir</span></button>`).join("")||`<div class="empty">Aucun personnage trouvé.</div>`;document.querySelectorAll('.char').forEach(b=>b.onclick=()=>selectDBCharacter(b.dataset.name))}
$('search').oninput=renderResults;
function selectDBCharacter(name){openCharacter({name,db:true,level:90})}
function extractSpecialName(data){
  const candidates=[data?.stats?.specialized,data?.stats?.special,data?.specialized,data?.special,data?.ascensionStat,data?.stats?.ascensionStat];
  return candidates.find(v=>typeof v==='string'&&v.trim())||'';
}
function inferAscStat(data){return mapSpecial(extractSpecialName(data));}
function mapSpecial(x){const t=String(x).toLowerCase();if(t.includes('crit rate')||t.includes('taux critique'))return'TC';if(t.includes('crit dmg')||t.includes('dégâts critiques'))return'DC';if(t.includes('hp')||t.includes('pv'))return'PV%';if(t.includes('atk')||t.includes('attaque'))return'ATQ%';if(t.includes('def')||t.includes('défense'))return'DEF%';if(t.includes('recharge'))return"Recharge d'énergie";if(t.includes('elemental mastery')||t.includes('maîtrise'))return'Maîtrise élémentaire';if(t.includes('pyro'))return'Bonus Pyro';if(t.includes('hydro'))return'Bonus Hydro';if(t.includes('electro')||t.includes('électro'))return'Bonus Électro';if(t.includes('cryo'))return'Bonus Cryo';if(t.includes('anemo')||t.includes('anémo'))return'Bonus Anémo';if(t.includes('geo')||t.includes('géo'))return'Bonus Géo';if(t.includes('dendro'))return'Bonus Dendro';if(t.includes('physical')||t.includes('physique'))return'Bonus physique';return''}
function normalizeAscValue(value){
  const n=Number(value)||0;
  return Math.abs(n)>0&&Math.abs(n)<1?n*100:n;
}
async function openCharacter(c){
  $('home').classList.add('hidden');$('app').classList.remove('hidden');$('back').classList.remove('hidden');
  let data=c.data||await findCharacter(c.name);
  let stats=c.stats||await findStats(c.name,c.level||90);
  const s=stats?.[String(c.level||90)]||stats?.[`${c.level||90}`]||stats||{};
  const ascStat=c.ascStat||inferAscStat(data);
  const rawAsc=c.ascValue??s.specialized??0;
  const ascValue=normalizeAscValue(rawAsc);
  current={id:c.id||crypto.randomUUID(),name:c.name,db:!!c.db,level:c.level||90,data,stats:s,ascStat,ascValue,equipment:c.equipment||[],artifacts:c.artifacts||{},bonuses:c.bonuses||[]};
  renderAll();showTab('character')
}
function renderAll(){renderHero();renderChar();renderEquipment();renderArtifacts();renderBonuses();updateTotals();renderSaved()}
function renderHero(){const img=imageFor(current.data);const asc=current.ascStat?`${current.ascStat}${current.ascValue?` + ${fmt(current.ascValue,'%')}`:''}`:'Aucune';$('charHero').innerHTML=`<div class="hero">${img?`<img src="${esc(img)}">`:''}<div><h1>${esc(current.name)}</h1><p>Niveau ${current.level} · ${esc(displayElement(current.data?.element)||'Personnage personnalisé')}</p><small>Élévation : <b>${esc(asc)}</b></small></div></div>`}
function renderChar(){const base=current.stats||{};const hp=base.hp??base.HP??base.health??0,atk=base.attack??base.atk??base.ATK??0,def=base.defense??base.def??base.DEF??0;$('charForm').innerHTML=`<div class="formgrid"><label>Niveau<input id="cLevel" type="number" min="1" max="90" value="${current.level}"></label><label>PV de base<input id="cHP" type="number" value="${hp}"></label><label>ATQ de base<input id="cATK" type="number" value="${atk}"></label><label>DEF de base<input id="cDEF" type="number" value="${def}"></label><label>Élévation<select id="cAsc"><option value="">Aucune</option>${statOpts(current.ascStat)}</select></label><label>Valeur<input id="cAscVal" type="number" step="0.1" value="${current.ascValue}"></label></div><button id="saveChar" class="primary">Enregistrer</button>`;
  $('cLevel').onchange=async()=>{current.level=+$('cLevel').value||90;if(current.db){current.stats=await findStats(current.name,current.level);current.ascValue=normalizeAscValue(current.stats?.specialized??current.ascValue)}renderAll()};
  $('saveChar').onclick=()=>{current.level=+$('cLevel').value||90;current.ascStat=$('cAsc').value;current.ascValue=+$('cAscVal').value||0;current.stats={hp:+$('cHP').value||0,attack:+$('cATK').value||0,defense:+$('cDEF').value||0,...current.stats};saveBuild()}
}
function saveBuild(){const i=builds.findIndex(x=>x.id===current.id);if(i>=0)builds[i]=structuredClone(current);else builds.push(structuredClone(current));save();renderSaved();updateTotals()}
async function openSavedBuild(id){
  const b=builds.find(x=>x.id===id);if(!b)return;
  current=structuredClone(b);
  const dbMatch=db.find(x=>String(x.name).toLowerCase()===String(current.name).toLowerCase());
  if(dbMatch||current.db){
    current.db=true;
    current.data=await findCharacter(current.name)||current.data;
    current.stats=await findStats(current.name,current.level||90)||current.stats;
    const s=current.stats?.[String(current.level||90)]||current.stats?.[`${current.level||90}`]||current.stats||{};
    current.stats=s;
    current.ascStat=inferAscStat(current.data)||current.ascStat||'';
    current.ascValue=normalizeAscValue(s.specialized??current.ascValue??0);
    saveBuild();
  }
  $('home').classList.add('hidden');$('app').classList.remove('hidden');$('back').classList.remove('hidden');renderAll();showTab('character')
}
function renderSaved(){$('saved').innerHTML=builds.length?builds.map(b=>`<div class="savedItem"><span>${esc(b.name)}</span><button data-id="${b.id}">Ouvrir</button></div>`).join(''):`<div class="empty">Aucun build enregistré.</div>`;document.querySelectorAll('.savedItem button').forEach(b=>b.onclick=()=>openSavedBuild(b.dataset.id))}
function baseTotals(){const b=current.stats||{};return{HP:Number(b.hp??b.HP??b.health??0),ATK:Number(b.attack??b.atk??b.ATK??0),DEF:Number(b.defense??b.def??b.DEF??0),TC:5,DC:50,'Recharge d’énergie':100,'Maîtrise élémentaire':0,'Bonus Pyro':0,'Bonus Hydro':0,'Bonus Électro':0,'Bonus Cryo':0,'Bonus Anémo':0,'Bonus Géo':0,'Bonus Dendro':0,'Bonus physique':0,'Soin':0}}
function updateTotals(){
  if(!current)return;
  const t=baseTotals();
  const pct={HP:0,ATK:0,DEF:0};
  const add=(stat,v)=>{v=Number(v)||0;if(stat==='PV%')pct.HP+=v;else if(stat==='ATQ%')pct.ATK+=v;else if(stat==='DEF%')pct.DEF+=v;else addFlat(t,stat,v)};
  if(current.ascStat)add(current.ascStat,current.ascValue);
  Object.values(current.artifacts||{}).forEach(a=>{if(!a)return;add(a.main,MAIN_VALUES[a.main]||0);(a.subs||[]).forEach(s=>{add(s.stat,s.initial);(s.procs||[]).forEach(v=>add(s.stat,v))})});
  (current.equipment||[]).forEach(b=>add(b.stat,b.value));
  (current.bonuses||[]).forEach(b=>add(b.stat,b.value));
  t.HP=(t.HP)*(1+pct.HP/100);t.ATK=(t.ATK)*(1+pct.ATK/100);t.DEF=(t.DEF)*(1+pct.DEF/100);
  const rows=[['PV',t.HP,''],['ATK',t.ATK,''],['DEF',t.DEF,''],['TC',t.TC,'%'],['DC',t.DC,'%'],['Recharge d’énergie',t['Recharge d’énergie'],'%'],['Maîtrise élémentaire',t['Maîtrise élémentaire'],''],['Bonus Pyro',t['Bonus Pyro'],'%'],['Bonus Hydro',t['Bonus Hydro'],'%'],['Bonus Électro',t['Bonus Électro'],'%'],['Bonus Cryo',t['Bonus Cryo'],'%'],['Bonus Anémo',t['Bonus Anémo'],'%'],['Bonus Géo',t['Bonus Géo'],'%'],['Bonus Dendro',t['Bonus Dendro'],'%'],['Bonus physique',t['Bonus physique'],'%'],['Soin',t.Soin,'%']];
  $('totals').innerHTML=rows.map(x=>`<div class="stat"><span>${x[0]}</span><b>${fmt(x[1],x[2])}</b></div>`).join('')
}
function addFlat(t,stat,v){if(stat==='PV flat')t.HP+=v;else if(stat==='ATQ flat')t.ATK+=v;else if(stat==='DEF flat')t.DEF+=v;else if(stat in t)t[stat]+=v}
function totalArtifactProcs(arts){return Object.values(arts||{}).reduce((n,a)=>n+(a?.subs||[]).reduce((m,s)=>m+(s.procs||[]).length,0),0)}
function renderArtifacts(){const data=current.artifacts||{};$('artifacts').innerHTML=SLOTS.map(slot=>artifactHTML(slot,data[slot]||null)).join('');document.querySelectorAll('.artifact').forEach(bindArtifact);const rolls=totalArtifactProcs(data);$('rollCounter').textContent=`${rolls} / 5 améliorations`}
function artifactHTML(slot,a){const main=a?.main||MAIN[slot][0],subs=a?.subs||[];return `<div class="artifact" data-slot="${slot}"><div class="artifactTitle"><strong>${slot}</strong><select class="main">${opts(MAIN[slot],main)}</select></div><div class="subList">${subs.map((s,i)=>subHTML(s,i,main,subs)).join('')}</div><button class="addSub">+ Substat <span>${subs.length}/4</span></button></div>`}
function subHTML(s,i,main,subs){const allowed=Object.keys(ROLLS).filter(x=>x!==main&&!subs.some((z,j)=>j!==i&&z.stat===x));const stat=s.stat||allowed[0]||Object.keys(ROLLS)[0],rolls=ROLLS[stat]||[];return `<div class="sub" data-i="${i}"><div class="subrow"><select class="substat">${opts(allowed,stat)}</select><select class="initial">${opts(rolls.map(String),String(s.initial??rolls[0]))}</select><button class="x remove">×</button></div><div class="procLine">${(s.procs||[]).map((v,j)=>`<div class="proc"><span>${j+1}</span><select class="pv">${opts(rolls.map(String),String(v))}</select><button class="removeProc">×</button></div>`).join('')}</div><button class="addProc" ${totalArtifactProcs(current.artifacts)>=5?'disabled':''}>+ Proc <span>${(s.procs||[]).length} sur 5</span></button></div>`}
function bindArtifact(box){const slot=box.dataset.slot;box.querySelector('.main').onchange=()=>{const old=current.artifacts[slot]||{};current.artifacts[slot]={main:box.querySelector('.main').value,subs:old.subs||[]};renderArtifacts();updateTotals()};box.querySelector('.addSub').onclick=()=>{const subs=current.artifacts[slot]?.subs||[];if(subs.length>=4)return;const main=box.querySelector('.main').value,used=subs.map(s=>s.stat),stat=Object.keys(ROLLS).find(x=>x!==main&&!used.includes(x));if(!stat)return;current.artifacts[slot]={main,subs:[...subs,{stat,initial:ROLLS[stat][0],procs:[]}]};renderArtifacts();updateTotals()};box.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{const i=+b.closest('.sub').dataset.i;current.artifacts[slot].subs.splice(i,1);renderArtifacts();updateTotals()});box.querySelectorAll('.substat').forEach(sel=>sel.onchange=()=>{const i=+sel.closest('.sub').dataset.i,sub=current.artifacts[slot].subs[i];sub.stat=sel.value;sub.initial=ROLLS[sel.value][0];sub.procs=[];renderArtifacts();updateTotals()});box.querySelectorAll('.initial').forEach(sel=>sel.onchange=()=>{const i=+sel.closest('.sub').dataset.i;current.artifacts[slot].subs[i].initial=+sel.value;updateTotals()});box.querySelectorAll('.pv').forEach(sel=>sel.onchange=()=>{const i=+sel.closest('.sub').dataset.i,j=[...sel.closest('.sub').querySelectorAll('.pv')].indexOf(sel);current.artifacts[slot].subs[i].procs[j]=+sel.value;updateTotals()});box.querySelectorAll('.removeProc').forEach(b=>b.onclick=()=>{const row=b.closest('.sub'),i=+row.dataset.i,j=[...row.querySelectorAll('.removeProc')].indexOf(b);current.artifacts[slot].subs[i].procs.splice(j,1);renderArtifacts();updateTotals()});box.querySelectorAll('.addProc').forEach(b=>b.onclick=()=>{if(totalArtifactProcs(current.artifacts)>=5)return;const row=b.closest('.sub'),i=+row.dataset.i,sub=current.artifacts[slot].subs[i];sub.procs.push(ROLLS[sub.stat][0]);renderArtifacts();updateTotals()})}

function renderEquipment(){
  const rows=current.equipment||[];
  $('equipmentRows').innerHTML=rows.map((b,i)=>`<div class="bonus equipmentRow" data-i="${i}"><select class="est">${statOpts(b.stat)}</select><input class="eval" type="number" step="0.1" value="${b.value??0}"><button class="danger ex">×</button></div>`).join('')||`<div class="empty">Aucun modificateur d’équipement.</div>`;
  document.querySelectorAll('.equipmentRow').forEach(r=>{
    r.querySelector('.est').onchange=()=>{current.equipment[+r.dataset.i].stat=r.querySelector('.est').value;updateTotals()};
    r.querySelector('.eval').oninput=()=>{current.equipment[+r.dataset.i].value=+r.querySelector('.eval').value||0;updateTotals()};
    r.querySelector('.ex').onclick=()=>{current.equipment.splice(+r.dataset.i,1);renderEquipment();updateTotals()};
  });
}
$('addEquipment').onclick=()=>{current.equipment=current.equipment||[];current.equipment.push({stat:'ATQ flat',value:0});renderEquipment();updateTotals()};
$('saveEquipment').onclick=()=>saveBuild();
function renderBonuses(){$('bonuses').innerHTML=(current.bonuses||[]).map((b,i)=>`<div class="bonus" data-i="${i}"><select class="bst">${statOpts(b.stat)}</select><input class="bval" type="number" step="0.1" value="${b.value??0}"><button class="danger bx">×</button></div>`).join('')||`<div class="empty">Aucune stat bonus.</div>`;document.querySelectorAll('.bonus').forEach(r=>{r.querySelector('.bst').onchange=()=>{current.bonuses[+r.dataset.i].stat=r.querySelector('.bst').value;updateTotals()};r.querySelector('.bval').oninput=()=>{current.bonuses[+r.dataset.i].value=+r.querySelector('.bval').value||0;updateTotals()};r.querySelector('.bx').onclick=()=>{current.bonuses.splice(+r.dataset.i,1);renderBonuses();updateTotals()}})}
$('addBonus').onclick=()=>{current.bonuses.push({stat:'PV%',value:0});renderBonuses();updateTotals()};$('saveBonus').onclick=()=>saveBuild();
$('createManual').onclick=()=>{const c={id:crypto.randomUUID(),name:$('mName').value.trim()||'Personnage personnalisé',db:false,level:+$('mLevel').value||90,ascStat:$('mAsc').value,ascValue:+$('mAscVal').value||0,stats:{hp:+$('mHP').value||0,attack:+$('mATK').value||0,defense:+$('mDEF').value||0},equipment:[],artifacts:{},bonuses:[]};current=c;saveBuild();$('home').classList.add('hidden');$('app').classList.remove('hidden');$('back').classList.remove('hidden');renderAll();showTab('character')};
$('back').onclick=()=>{$('app').classList.add('hidden');$('home').classList.remove('hidden');$('back').classList.add('hidden');current=null};document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));function showTab(t){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));$(t).classList.remove('hidden')}
$('mAsc').innerHTML=`<option value="">Aucune</option>${statOpts()}`;loadDB();renderSaved();
