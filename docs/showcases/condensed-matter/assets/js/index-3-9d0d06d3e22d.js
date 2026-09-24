
'use strict';
const D=JSON.parse(document.getElementById('case-data').textContent),F=D.frames,$=id=>document.getElementById(id);
let lang='zh';const t=(zh,en)=>lang==='en'?en:zh;
let titles=['初始结构','背景与比例','晶胞长度','晶胞角度','坐标 1–2','续跑 1–2','坐标 3–4','坐标 5–6','坐标 7'];
let narrative=[
 ['输入初始 CIF 与观测 XYE，建立谱图基线。还没有开放任何优化参数。','载入 8 个原子的晶格与分数坐标，固定原点原子，记录初始 Rwp。','形成初始 accepted checkpoint，后续每一次试探都要与它或后续已接受状态比较。'],
 ['背景初值为零。先稳定整体强度与低阶背景，再试探影响峰位和相对强度的参数。','开放 scale 与 3 项 Chebyshev 背景系数，晶胞与坐标保持冻结。','Rwp 下降 0.034497 pp，数值门禁与审查均通过。仅更新谱图参数，原子位置不变。'],
 ['上一轮背景与比例已稳定。Planner 根据残差分段统计提出晶胞长度失配假设，用本轮 trial 检验。','开放 a、b、c，并联动 scale 与 background；固定晶胞角度和原子分数坐标。','Rwp 下降 2.121462 pp，本轮贡献了主要下降。接受新晶胞长度，保留其他冻结变量。'],
 ['晶胞长度试探有收益，接着独立检验接近理想值的 α、β、γ 是否仍有可用改进。','开放晶胞角度，并联动 scale 与 background。Trial Rwp 降至 86.152870%。','Reviewer 认为约 0.000289 pp 的收益过小，拒绝本次试探。Accepted 仍为 86.153159%，晶胞回放保持上一状态。'],
 ['角度试探未接受，转向第一个尚未优化的原子坐标块，检验相对强度残差能否进一步降低。','开放 atom.1 与 atom.2 的 x、y、z 分数坐标，同时开放 scale；atom.0 固定。','Rwp 下降 0.033376 pp，接受坐标更新。原子位移开始出现，晶胞长度保持不变。'],
 ['上一坐标块曾带来下降，Planner 决定在同一块上再试一次，检验是否还有可用改善。','再次开放 atom.1、atom.2 与 scale，求解器返回 no_descent_step。','Reviewer 虽建议接受，但 Rwp 微增约 1.10×10⁻⁸ pp，不满足下降门槛。硬门禁拒绝更新，保留原坐标。'],
 ['同一坐标块续跑没有收益，转向下一组未测试原子，将剩余预算用于新的假设。','开放 atom.3、atom.4 的分数坐标与 scale，其他参数保持冻结。','Rwp 再降 0.009875 pp，接受本轮更新。'],
 ['继续检验下一坐标块。已经接受的晶胞与前面坐标块作为本轮的起点。','开放 atom.5、atom.6 的分数坐标与 scale。','Rwp 下降 0.000339 pp，数值门禁与 reviewer 均通过，保存新的 accepted 状态。'],
 ['最后一轮预算用于尚未测试的 atom.7，完成这条轨迹中的坐标块试探。','开放 atom.7 的 x、y、z 与 scale。到达预先固定的八轮外层预算。','Rwp 下降 0.000354 pp，最终 accepted Rwp 为 86.109214%。导出已接受参数、结构和谱图，结束本次运行。']
];
let position=0,selected=0,playing=false,lastTime=0,rotating=false,scene,camera,renderer,group,atoms=[],cellLines,angle=.48,tilt=.18,drag=null;
let interactionKey='',speech='',terminalLines=[];
const ROUND_SECONDS=12,phaseNames=['PLANNER','EXECUTOR','REVIEWER','NUMERICAL GATE'];
let reviewNotes=['','Reviewer 观察到 Rwp 降低 0.034497 pp、几何有效和满秩诊断，建议接受比例与背景的中间进展。','Reviewer 观察到 Rwp 降低 2.121462 pp、晶胞长度变化在约束范围内，建议接受新参数。','Reviewer 认为角度试探收益过小，建议拒绝，并将剩余试探转向原子坐标。','Reviewer 观察到坐标块带来 0.033376 pp 的下降、几何有效，建议接受并继续检验同一块。','Reviewer 建议接受这次续跑，并将极小的 Rwp 变化解释为可以保留的中间状态。该建议还需独立数值门禁核验。','Reviewer 观察到 Rwp 降低约 0.009875 pp、没有约束违反，建议接受。','Reviewer 观察到 Rwp 降低约 0.000339 pp、满秩诊断，建议接受当前坐标块。','Reviewer 观察到 Rwp 降低约 0.000354 pp，建议接受最后一个坐标块；本轮后外层预算用尽。'];
const clamp=v=>Math.max(0,Math.min(1,v));
function phaseState(){const round=Math.ceil(position),progress=round?position-round+1:0;return {round,progress,phase:round?Math.min(3,Math.floor(progress*4)):-1,local:clamp((progress*4)%1)}}
function checkpointPosition(){const {round,progress}=phaseState();return round?round-1+clamp((progress-.8)/.1):0}
const fmt=(n,d=6)=>Number(n).toFixed(d),icons=()=>lucide.createIcons();
function buildNavigation(){
$('steps').innerHTML=titles.map((x,i)=>`<button class="step ${i&& !F[i].history.accepted?'reject':''}" aria-pressed="${i===0}" data-round="${i}"><b>${String(i).padStart(2,'0')}</b>${x}</button>`).join('');
$('audit').innerHTML=F.slice(1).map((f,i)=>`<tr data-row="${i+1}"><td><button data-round="${i+1}" aria-label="${t('查看第 '+(i+1)+' 轮','View trial '+(i+1))}">${String(i+1).padStart(2,'0')}</button></td><td>${titles[i+1]}</td><td>${fmt(f.trial_rwp)}</td><td>${fmt(f.metrics.rwp)}</td><td class="${f.history.accepted?'accept-color':'reject-color'}">${f.history.accepted?t('接受','Accepted'):i===4?t('门禁拒绝','Gate rejection'):t('审查拒绝','Review rejection')}</td></tr>`).join('');
document.querySelectorAll('[data-round]').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.round))));
}
const ZH={titles,narrative,reviews:reviewNotes};
const staticBindings=EN.static.map(([selector,en])=>{const el=document.querySelector(selector);if(!el)throw Error('Missing locale binding: '+selector);return {el,en,zh:el.innerHTML}});
const attributeBindings=EN.attributes.map(([selector,key,en])=>{const el=document.querySelector(selector);if(!el)throw Error('Missing attribute binding: '+selector);return {el,key,en,zh:el.getAttribute(key)}});
const fallbackText=$('fallback').firstChild.textContent;
function setLanguage(value){lang=value==='en'?'en':'zh';document.documentElement.lang=lang==='en'?'en':'zh-CN';titles=lang==='en'?EN.titles:ZH.titles;narrative=lang==='en'?EN.narrative:ZH.narrative;reviewNotes=lang==='en'?EN.reviews:ZH.reviews;
 staticBindings.forEach(b=>b.el.innerHTML=b[lang]);attributeBindings.forEach(b=>b.el.setAttribute(b.key,b[lang]));
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 document.title=t('自主 Rietveld 精修 · Agents-A1.5','Autonomous Rietveld Refinement · Agents-A1.5');
 document.querySelector('meta[name="description"]').content=t('Agents-A1.5 自主 Rietveld 精修：真实八轮轨迹、参数决策与 Rwp 下降。','Agents-A1.5 autonomous Rietveld refinement: eight recorded trials, parameter decisions and Rwp reduction.');
 $('fallback').firstChild.textContent=t(fallbackText,'WebGL is unavailable. The Rwp curve and trial records remain available.');
 $('sourcePath').textContent=D.origin;$('protocolHash').textContent=D.protocol_sha256;buildNavigation();setPlaying(playing);update(true);renderInteraction(true);drawRwp();icons();
 try{localStorage.setItem('rietveld-language',lang)}catch(e){}const languageURL=new URL((window.showcaseLocation||window.location).href);languageURL.searchParams.set('lang',lang);if(window.showcaseLocation)window.showcaseLocation.replace(languageURL.href);else history.replaceState(null,'',languageURL.href);
}
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.lang));
$('sourcePath').textContent=D.origin;$('protocolHash').textContent=D.protocol_sha256;
function setPlaying(value){playing=value;$('play').innerHTML=`<i data-lucide="${value?'pause':'play'}"></i>`;$('play').setAttribute('aria-label',value?t('暂停精修过程','Pause refinement'):t('播放精修过程','Play refinement'));icons()}
function seek(i){setPlaying(false);position=Math.max(0,Math.min(8,i));update(true);renderInteraction(true);drawRwp()}
$('play').onclick=()=>{if(position>=8){position=0;update(true)}setPlaying(!playing)};
$('replay').onclick=()=>{position=0;update(true);setPlaying(true)};
$('heroPlay').onclick=()=>{seek(0);$('showcase').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});setPlaying(true)};
$('prev').onclick=()=>seek(Math.max(0,Math.ceil(position)-1));$('next').onclick=()=>seek(Math.min(8,Math.floor(position)+1));
$('scrubber').oninput=e=>seek(Number(e.target.value));
document.querySelectorAll('[data-phase]').forEach(button=>button.onclick=()=>{const r=Math.max(1,phaseState().round);seek(r-1+Number(button.dataset.phase)/4+.001)});
$('rotate').onclick=()=>{rotating=!rotating;$('rotate').setAttribute('aria-pressed',String(rotating))};
$('resetView').onclick=()=>{angle=.48;tilt=.18;rotating=false;$('rotate').setAttribute('aria-pressed','false')};
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='rietveld_case_005.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function update(force=false){const i=Math.min(8,Math.floor(checkpointPosition()+1e-8));if(i===selected&&!force)return;selected=i;const f=F[i],h=f.history;
 $('rwp').textContent=fmt(f.metrics.rwp,4);$('delta').textContent=i?t('累计 −','Total −')+fmt(F[0].metrics.rwp-f.metrics.rwp,4)+' pp':t('初始状态','Initial state');
 $('chartStatus').textContent=i?'ACCEPTED STATE / '+String(i).padStart(2,'0'):'INITIAL CHECKPOINT';$('sceneState').textContent=i?t('第 '+i+' 轮','Trial '+i)+' · '+titles[i]:t('初始晶胞','Initial cell');
 $('roundCount').textContent=String(i).padStart(2,'0')+' / 08';$('scrubber').value=i;$('stageTitle').textContent=i?t('第 '+i+' 轮','Trial '+i)+' · '+titles[i]:t('读取初始结构与观测谱','Load the initial structure and observed pattern');
 $('decisionBadge').textContent=i?(h.accepted?t('接受并更新','Accepted and updated'):i===5?t('硬门禁拦截 · 状态保留','Gate blocked · state retained'):t('Reviewer 拒绝 · 状态保留','Review rejected · state retained')):t('初始状态','Initial state');$('decisionBadge').className='badge'+(i&&!h.accepted?' reject':'');
 ['planText','executeText','reviewText'].forEach((id,k)=>$(id).textContent=narrative[i][k]);$('active').textContent=f.active.length?f.active.join(' · '):'active = []';
 $('raw').textContent=h?'Planner\n'+h.plan.reason+'\n\nExecutor\n'+JSON.stringify(f.executor.command,null,2)+'\n\nReviewer\n'+h.review.reason+'\n\n'+t('实际 accepted: ','Actual accepted: ')+h.accepted+'\nTermination: '+h.termination+'\nJacobian rank: '+h.diagnostics.jacobian_rank+' / '+h.diagnostics.n_parameters:t('初始化状态，无模型决策。\n本页中文说明为编辑摘要；决策原文不等同于已证实的误差归因。','Initial state, no model decision.\nOn-page explanations are editorial summaries; original reasoning is not proof of a residual diagnosis.');
 document.querySelectorAll('.step').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));document.querySelectorAll('[data-row]').forEach(row=>row.classList.toggle('selected',Number(row.dataset.row)===i));
 const p=f.parameters,p0=F[0].parameters;const rows=['a / Å','b / Å','c / Å','α / °','β / °','γ / °'].map((label,k)=>[label,fmt(p0.cell[k],5),fmt(p.cell[k],5)]);
 rows.push(['Scale',p0.scale.toExponential(4),p.scale.toExponential(4)],[t('最大坐标位移 / Å','Max site shift / Å'),'0.00000',fmt(f.metrics.max_displacement_angstrom,5)],[t('负计算强度点数','Negative calculated points'),'0',String(f.metrics.negative_calculated_points)]);
 $('params').innerHTML=rows.map(r=>`<tr class="${r[1]!==r[2]?'changed':''}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');drawSpectrum();
}
function renderInteraction(force=false){const s=phaseState(),r=s.round,p=s.phase,f=F[r],h=f.history,key=r+':'+p;
 if(key!==interactionKey||force){interactionKey=key;$('interactionTitle').textContent=r?t('第 '+r+' 轮','Trial '+r)+' · '+titles[r]:t('初始状态 · 等待规划','Initial state · awaiting a plan');$('speaker').textContent=r?phaseNames[p]+' / '+t(['提出下一步假设','将计划变成工具请求','审查数值反馈','决定是否更新状态'],['Propose the next hypothesis','Turn the plan into a tool request','Review numerical feedback','Decide whether to update the state'])[p]:t('SESSION / 读取输入','SESSION / Load inputs');
 $('terminalTitle').textContent=r?['OBSERVATION → PLAN','PLAN → TOOL → RESULT','RESULT → REVIEW','REVIEW + GATE → CHECKPOINT'][p]:'SESSION / INITIALIZED';$('phaseCount').textContent=r?String(p+1).padStart(2,'0')+' / 04':'00 / 04';
 $('gateFeedback').className='gate-feedback';$('gateFeedback').textContent='';
 if(!r){speech=t('初始 CIF 与观测 XYE 已载入。Planner 将读取当前 Rwp、残差诊断与剩余预算，提出第一个参数块。','Initial CIF and observed XYE loaded. The Planner reads the current Rwp, residual diagnostics and remaining budget to choose the first parameter block.');terminalLines=['checkpoint = 0','Rwp = '+fmt(F[0].metrics.rwp)+'%','budget = 8 trials × 20 steps'];$('handoff').textContent=t('初始谱图 → Planner','Initial pattern → Planner');}
 else {const prev=F[r-1],command=f.executor.command;
  if(p===0){speech=narrative[r][0];terminalLines=['accepted Rwp = '+fmt(prev.metrics.rwp)+'%','remaining trials = '+(9-r),'plan.stage = '+h.stage,'Planner → Executor'];$('handoff').textContent='上一轮 accepted + 残差诊断 → 参数选择 → Executor';}
  if(p===1){speech=narrative[r][1];terminalLines=['trial(active = '+JSON.stringify(command.active)+',','      steps = '+command.steps+', mode = "'+command.mode+'")','return: Rwp = '+fmt(f.trial_rwp,9)+'%','termination = '+h.termination];$('handoff').textContent='Executor → Torch 求解器 → trial 结果 → Reviewer';}
  if(p===2){speech=reviewNotes[r];terminalLines=['before = '+fmt(prev.metrics.rwp,9)+'%','trial  = '+fmt(f.trial_rwp,9)+'%','ΔRwp = '+h.improvement.toExponential(6)+' pp','review.decision = '+h.review.decision];$('handoff').textContent='Reviewer → 数值门禁；本轮候选尚未提交';}
  if(p===3){speech=narrative[r][2];terminalLines=['reviewer = '+h.review.decision,'Rwp improvement ≥ 1e-8: '+String(h.improvement>=1e-8),'decision = '+(h.accepted?'accept':'reject'),'accepted Rwp = '+fmt(f.metrics.rwp,9)+'%'];$('handoff').textContent=r===8?'最终 accepted → 导出结构、参数与谱图':(h.accepted?'新 accepted':'保留上一 accepted')+' → 下一轮 Planner';}
 }
 }
 if(r&&lang==='en')$('handoff').textContent=['Previous accepted state + residual → parameter choice → Executor','Executor → Torch solver → trial result → Reviewer','Reviewer → numerical gate; candidate not yet committed',r===8?'Final accepted state → export structure, parameters and pattern':(h.accepted?'New accepted state':'Retain previous accepted state')+' → next Planner'][p];
 const local=s.progress===1?1:s.local,reveal=playing?clamp(local*2.3):1;
 $('speechText').textContent=speech.slice(0,Math.max(1,Math.ceil(speech.length*reveal)));
 $('terminalText').textContent=terminalLines.slice(0,Math.max(1,Math.ceil(terminalLines.length*reveal))).join('\n');
 document.querySelectorAll('[data-phase]').forEach((b,k)=>{b.setAttribute('aria-pressed',String(k===p));b.classList.toggle('done',k<p);b.style.setProperty('--progress',k<p?1:k===p?(s.progress===1?1:s.local):0)});
 document.querySelectorAll('.step').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===r)));
 if(r&&p===3&&s.progress>=.9){$('gateFeedback').textContent=h.accepted?t('已提交 · 谱图与 Rwp 更新','Committed · pattern and Rwp updated'):r===5?t('硬门禁拦截 · reviewer 建议未执行','Gate blocked · Reviewer suggestion not applied'):t('审查拒绝 · 结构、谱图与 Rwp 保留','Review rejected · structure, pattern and Rwp retained');$('gateFeedback').classList.toggle('blocked',!h.accepted)}
 $('roundCount').textContent=String(r).padStart(2,'0')+' / 08';$('scrubber').value=position;
 const secs=Math.floor(position*ROUND_SECONDS);$('timecode').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')+' / 01:36';
}
function context(id){const c=$(id),r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr)}const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);ctx.font='10px Arial';return [ctx,r.width,r.height]}
function drawRwp(){const [c,w,h]=context('rwpChart'),left=43,right=w-18,top=15,bottom=h-28;const x=i=>left+(right-left)*i/8,y=v=>bottom-(v-85.95)/(88.55-85.95)*(bottom-top);
 c.lineWidth=1;for(const v of [86,86.5,87,87.5,88,88.5]){c.strokeStyle='#ffffff12';c.beginPath();c.moveTo(left,y(v));c.lineTo(right,y(v));c.stroke();c.fillStyle='#a39cb7';c.textAlign='right';c.fillText(v.toFixed(1),left-9,y(v)+3)}
 c.textAlign='center';for(let i=0;i<=8;i++){c.fillStyle=i===selected?'#b9a4fc':'#91899f';c.fillText(String(i),x(i),bottom+17)}
 c.strokeStyle='#4a3c60';c.setLineDash([3,5]);c.beginPath();F.forEach((f,i)=>i?c.lineTo(x(i),y(f.metrics.rwp)):c.moveTo(x(i),y(f.metrics.rwp)));c.stroke();c.setLineDash([]);
 const cp=checkpointPosition();c.strokeStyle='#b9a4fc';c.lineWidth=2.2;c.beginPath();c.moveTo(x(0),y(F[0].metrics.rwp));const n=Math.floor(cp);for(let i=1;i<=n;i++)c.lineTo(x(i),y(F[i].metrics.rwp));if(n<8){let q=cp-n;c.lineTo(x(cp),y(F[n].metrics.rwp*(1-q)+F[n+1].metrics.rwp*q))}c.stroke();
 F.forEach((f,i)=>{if(i>cp)return;c.beginPath();c.arc(x(i),y(f.metrics.rwp),i===selected?5:3.5,0,Math.PI*2);c.fillStyle=i&&!f.history.accepted?'#edb28a':'#b9a4fc';c.fill()});
 if(selected>=4){const bx=w-152,by=17;c.fillStyle='#15131f';c.fillRect(bx,by,145,61);c.strokeStyle='#ffffff20';c.strokeRect(bx,by,145,61);c.fillStyle='#a39cb7';c.textAlign='left';c.font='9px Arial';c.fillText('4–8: 86.1198 → 86.1092%',bx+7,by+13);c.beginPath();for(let i=4;i<=Math.max(4,n);i++){const px=bx+12+(i-4)*30,py=by+50-(F[i].metrics.rwp-86.109)/.011*26;i===4?c.moveTo(px,py):c.lineTo(px,py)}c.strokeStyle='#b9a4fc';c.lineWidth=1.4;c.stroke()}
}
function drawSpectrum(){const [c,w,h]=context('spectrum'),left=43,right=w-12,top=17,bottom=h-48,f=F[selected],obs=D.observed,calc=f.profile;const max=Math.max(...obs,...calc),min=Math.min(0,...obs,...calc),x=v=>left+(right-left)*(v-D.x[0])/(D.x[D.x.length-1]-D.x[0]),y=v=>bottom-(v-min)/(max-min)*(bottom-top);c.font='10px Arial';
 for(let k=0;k<4;k++){const value=min+(max-min)*k/3;c.fillStyle='#a39cb7';c.textAlign='right';c.fillText(value.toFixed(0),left-7,y(value)+3);c.strokeStyle='#ffffff10';c.beginPath();c.moveTo(left,y(value));c.lineTo(right,y(value));c.stroke()}
 function line(values,color,convert){c.beginPath();values.forEach((v,i)=>i?c.lineTo(x(D.x[i]),convert(v)):c.moveTo(x(D.x[i]),convert(v)));c.strokeStyle=color;c.lineWidth=1;c.stroke()}
 line(obs,'#91899f',y);line(calc,'#b9a4fc',y);const diff=obs.map((v,i)=>v-calc[i]),dm=Math.max(...diff.map(Math.abs))||1;line(diff,'#95dfc8',v=>h-26-v/dm*12);
 c.fillStyle='#a39cb7';c.textAlign='center';for(let v=Math.ceil(D.x[0]/10)*10;v<D.x.at(-1);v+=10)c.fillText(v+'°',x(v),h-3);c.textAlign='right';c.fillText('2θ',right,13);c.textAlign='left';c.fillText('Intensity',left,10)
}
function initScene(){try{scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,0,21);renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputEncoding=THREE.sRGBEncoding;$('structure').prepend(renderer.domElement);scene.add(new THREE.AmbientLight(0xffffff,.7));const light=new THREE.DirectionalLight(0xffffff,1.15);light.position.set(3,7,8);scene.add(light);const rim=new THREE.DirectionalLight(0xc7b5f0,.6);rim.position.set(-5,-1,2);scene.add(rim);group=new THREE.Group();scene.add(group);
 D.elements.forEach((symbol,i)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(symbol==='Sc'?.32:.27,32,20),new THREE.MeshStandardMaterial({color:symbol==='Sc'?0xb9a4fc:0xf1b77c,roughness:.33,metalness:.25}));group.add(mesh);atoms.push(mesh)});
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(72),3));cellLines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x83729e,transparent:true,opacity:.8}));group.add(cellLines);
 renderer.domElement.onpointerdown=e=>{drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId)};renderer.domElement.onpointermove=e=>{if(drag){angle+=(e.clientX-drag[0])*.008;tilt=Math.max(-1.3,Math.min(1.3,tilt+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY]}};renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>drag=null;resizeScene();
 }catch(e){$('fallback').style.display='block';$('rotate').disabled=true;$('resetView').disabled=true;console.warn('WebGL unavailable:',e.message)}}
function resizeScene(){if(!renderer)return;const r=$('structure').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.position.z=camera.aspect<1.3?25:21;camera.updateProjectionMatrix()}
const corners=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]],edges=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
const scale=7/Math.max(...F[0].parameters.cell.slice(0,3));
function drawScene(dt){if(!renderer)return;const cp=checkpointPosition(),low=Math.floor(cp),hi=Math.min(8,low+1),t=cp-low,a=F[low],b=F[hi],m=a.matrix.map((r,i)=>r.map((v,j)=>v*(1-t)+b.matrix[i][j]*t));const cart=f=>[0,1,2].map(j=>f.reduce((s,v,i)=>s+(v-.5)*m[i][j],0)*scale);
 atoms.forEach((mesh,i)=>{const coord=a.parameters.frac_coords[i].map((v,j)=>v*(1-t)+b.parameters.frac_coords[i][j]*t);mesh.position.set(...cart(coord));const active=F[phaseState().round].active.some(key=>key.startsWith('atom.'+i+'.'));mesh.material.emissive.setHex(active?0x342144:0x000000)});
 const values=edges.flatMap(edge=>edge.flatMap(i=>cart(corners[i])));cellLines.geometry.attributes.position.array.set(values);cellLines.geometry.attributes.position.needsUpdate=true;if(rotating&&!drag)angle+=dt*.25;group.rotation.set(tilt,angle,.08);renderer.render(scene,camera)}
function frame(now){const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;if(playing&&!document.hidden){position=Math.min(8,position+dt*Number($('speed').value)/ROUND_SECONDS);update();if(position===8)setPlaying(false)}renderInteraction();drawRwp();drawScene(dt);requestAnimationFrame(frame)}
let initialLanguage='zh';try{initialLanguage=localStorage.getItem('rietveld-language')||'zh'}catch(e){}const requestedLanguage=new URL((window.showcaseLocation||window.location).href).searchParams.get('lang');if(requestedLanguage==='zh'||requestedLanguage==='en')initialLanguage=requestedLanguage;setLanguage(initialLanguage);initScene();new ResizeObserver(()=>{resizeScene();drawSpectrum();drawRwp()}).observe(document.body);requestAnimationFrame(frame);
window.showcase={get position(){return position},get selected(){return selected},get playing(){return playing},get phase(){return phaseState()},get language(){return lang},seek,setLanguage,data:D};
