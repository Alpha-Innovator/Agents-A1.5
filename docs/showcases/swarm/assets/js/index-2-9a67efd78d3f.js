
'use strict';

const LOCALIZED_DATA=JSON.parse(document.getElementById('case-data').textContent);
let DATA=LOCALIZED_DATA.zh;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const fmt=n=>n.toLocaleString('en-US');
const tokenformat=n=>n>=1e6?(n/1e6).toFixed(1)+'M':(n/1e3).toFixed(1)+'K';
const plural=(n,one,many)=>n===1?one:many;
const hours=n=>(n/3600).toFixed(2);
const mins=n=>(n/60).toFixed(2);
const sum=(xs,fn)=>xs.reduce((a,x)=>a+fn(x),0);
const state={lang:'zh',caseIndex:0,step:0,playing:false,timer:null,speed:1,zoom:0,mode:'interactive',sound:true,audioError:false};
const demoAudio=$('demoAudio');
demoAudio.volume=.22;
let audioRequest=0;
let scenePan=0;
const t=(zh,en)=>state.lang==='zh'?zh:en;
const phases=()=>[t('主代理判断','Coordinator'),t('展开委派','Delegation'),t('独立调查','Investigation'),t('证据汇合','Synthesis')];
const current=()=>DATA[state.caseIndex];
const frame=()=>current().frames[state.step];
const round=()=>current().timeline[frame().round];
const maxStep=()=>current().frames.length-1;
let lastFocus=null;
let detailState=null;
Object.values(LOCALIZED_DATA).forEach(cases=>cases.forEach(c=>{
 c.frames=[];
 c.timeline.forEach((r,i)=>{r.start=c.frames.length;if(r.batch===null)c.frames.push({round:i,phase:null});else for(let phase=0;phase<4;phase++)c.frames.push({round:i,phase});});
}));
window.addEventListener('error',event=>{pause();$('error').textContent=t('页面发生错误：','Page error: ')+event.message;$('error').classList.add('show');});

function renderCases(){
 const c=current();
 $('heroCaseTabs').innerHTML=DATA.map((x,i)=>`<button class="${i===state.caseIndex?'active':''}" data-case="${i}" aria-pressed="${i===state.caseIndex}">${x.short}</button>`).join('');
 $('caseTabs').innerHTML=DATA.map((x,i)=>`<button class="case-tab ${i===state.caseIndex?'active':''}" data-case="${i}" aria-pressed="${i===state.caseIndex}"><span class="case-glyph">${x.symbol}</span><span class="case-copy"><strong>${x.short}</strong><small>${x.tag} · ${t(`${x.workers.length} 个子代理`,`${x.workers.length} ${plural(x.workers.length,'agent','agents')}`)}</small></span>${icon('arrow')}</button>`).join('');
 $('brief').innerHTML=`<div class="brief-top"><div><h3>${c.title}</h3><p class="brief-lead">${c.lead}</p></div><div class="scope">${c.scope.map(([n,l])=>`<div><b>${n}</b><span>${l}</span></div>`).join('')}</div></div><div class="challenge-grid">${c.challenges.map(([t,p],i)=>`<article class="challenge"><h4><span>0${i+1}</span>${t}</h4><p>${p}</p></article>`).join('')}</div><div class="brief-bottom"><span class="deliver-label">${t('需要交付','Deliverables')}</span><div class="deliver-chips">${c.outputs.map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>`;
 $('benchTag').textContent=c.short;
 $('caseTaskTokens').textContent=tokenformat(c.taskTokens);
 $('batchCount').textContent=t(`${c.timeline.length} 轮 / ${c.batches.length} 批`,`${c.timeline.length} ${plural(c.timeline.length,'turn','turns')} / ${c.batches.length} ${plural(c.batches.length,'batch','batches')}`);
 $('railSummary').innerHTML=`<div><span>${t('子代理','Agents')}</span><b>${c.workers.length}</b></div><div><span>${t('子代理执行轮次','Agent turns')}</span><b>${fmt(c.workerTurns)}</b></div><div><span>total task tokens</span><b>${tokenformat(c.taskTokens)}</b></div><div><span>${t('任务耗时','Elapsed time')}</span><b>${t(`${mins(c.elapsed)} 分钟`,`${mins(c.elapsed)} min`)}</b></div><div><span>${t('累计研究时长','Total research time')}</span><b>${t(`${hours(c.workerSeconds)} 小时`,`${hours(c.workerSeconds)} hr`)}</b></div><button class="text-btn" data-action="all-workers">${t('探索全部子代理','Explore all agents')} ${icon('arrow')}</button>`;
 $('seek').max=maxStep();
 $('resultTitle').textContent=c.resultTitle;$('resultText').textContent=c.resultText;
 $('resultMeta').textContent=t(`${c.short} · ${c.workers.length} 个子代理 · ${c.timeline.length} 轮主代理执行`,`${c.short} · ${c.workers.length} ${plural(c.workers.length,'agent','agents')} · ${c.timeline.length} ${plural(c.timeline.length,'coordinator turn','coordinator turns')}`);
 renderDocument(c);
 $('resultToc').innerHTML=c.document.toc.map((h,i)=>`<button data-heading="${h.id}" ${i===0?'class="active"':''}>${esc(h.label)}</button>`).join('');
 $('resultSelect').innerHTML=c.document.toc.map(h=>`<option value="${h.id}">${esc(h.label)}</option>`).join('');
 renderDiscovery();renderScene();buildHero();
}

function workerCard(w,phase,ci=state.caseIndex){
 const status=phase===3?'returned':phase===2?'running':'';
 const statusText=phase===3?t(`${w.turns} 轮调查 · 已返回`,`${w.turns} ${plural(w.turns,'turn','turns')} · Returned`):phase===2?t(`${w.toolCount} 次搜索与读页`,`${w.toolCount} ${plural(w.toolCount,'search or read','searches and reads')}`):state.mode==='auto'?t('独立研究任务','Independent research task'):t('查看调查任务','View assignment');
 return `<button class="worker ${status}" data-worker="${w.id}" data-worker-case="${ci}" aria-label="${t(`查看 ${esc(w.name)} 的任务与返回`,`View assignment and response for ${esc(w.name)}`)}"><span class="worker-top"><span>AGENT ${String(w.id+1).padStart(2,'0')}</span><span class="worker-status"></span></span><h4>${esc(w.name)}</h4><p>${esc(w.summary)}</p><small>${icon(phase===3?'check':phase===2?'search':'arrow')}${statusText}</small></button>`;
}

function actionLabels(r){
 const labels=[];
 if(r.searches)labels.push(t(`搜索 ${r.searches} 次`,`${r.searches} ${plural(r.searches,'search','searches')}`));
 if(r.reads)labels.push(t(`阅读 ${r.reads} 页`,`${r.reads} ${plural(r.reads,'page','pages')} read`));
 if(r.final)labels.push(t('综合交付','Final deliverable'));
 return labels;
}

function renderScene(){
 const c=current(),r=round(),f=frame();
 $('batchList').innerHTML=c.timeline.map((x,i)=>{
  const swarm=x.batch!==null,label=swarm?c.batches[x.batch].label:x.title;
  const detail=swarm?t(`委派 ${c.batches[x.batch].workers.length} 个子代理`,`Delegate ${c.batches[x.batch].workers.length} ${plural(c.batches[x.batch].workers.length,'agent','agents')}`):actionLabels(x).join(' · ');
  return `<button class="batch-button ${swarm?'swarm-step':'main-step'} ${f.round===i?'active':''}" data-round="${i}" aria-pressed="${f.round===i}"><span class="batch-index">${String(x.turn).padStart(2,'0')}</span><span class="batch-info"><strong>${label}</strong><small>${detail}</small></span>${swarm?icon('branch'):''}</button>`;
 }).join('');
 const rail=$('batchList'),active=rail.querySelector('.active'),rr=rail.getBoundingClientRect(),ar=active.getBoundingClientRect();
 if(rail.scrollWidth>rail.clientWidth&&(ar.left<rr.left||ar.right>rr.right))rail.scrollLeft+=ar.left-rr.left-(rr.width-ar.width)/2;
 if(rail.scrollHeight>rail.clientHeight&&(ar.top<rr.top||ar.bottom>rr.bottom))rail.scrollTop+=ar.top-rr.top-(rr.height-ar.height)/2;
 $('phaseNav').classList.toggle('solo-phase',r.batch===null);
 $('phaseNav').innerHTML=r.batch===null?`<span class="main-phase">${icon(r.final?'doc':'hub')} ${t('主代理独立执行','Coordinator working')} <b>${t(`第 ${r.turn} / ${c.timeline.length} 轮`,`Turn ${r.turn} / ${c.timeline.length}`)}</b></span>`:phases().map((p,i)=>`${i?'<span class="phase-line" aria-hidden="true"></span>':''}<button class="phase-button ${f.phase===i?'active':''}" data-phase="${i}" aria-pressed="${f.phase===i}"><i>${i+1}</i>${p}</button>`).join('');
 if(r.final){
  $('scene').innerHTML=`<div class="finish-panel scene-enter">${icon('check')}<h3>${c.resultTitle}</h3><p>${r.summary}</p><div class="finish-stats"><span><b>${c.workers.length}</b>${t('独立子代理',`${plural(c.workers.length,'Independent agent','Independent agents')}`)}</span><span><b>${c.timeline.length}</b>${t('主代理轮次',`${plural(c.timeline.length,'Coordinator turn','Coordinator turns')}`)}</span><span><b>${fmt(c.workerTurns)}</b>${t('子代理轮次',`${plural(c.workerTurns,'Agent turn','Agent turns')}`)}</span></div><button class="btn ghost" data-action="result">${t('阅读研究交付','Read the deliverable')} ${icon('arrow')}</button><button class="text-btn" data-action="restart">${t('重新观看协作过程','Replay collaboration')}</button></div>`;
 }else if(r.batch===null){
  const collected=sum(c.batches.filter(b=>b.turn<r.turn),b=>b.workers.length);
  $('scene').innerHTML=`<div class="solo-scene scene-enter"><div class="solo-mark">${icon('hub')}</div><div class="eyebrow">${t('COORDINATOR / 主代理','COORDINATOR')}</div><h3>${r.title}</h3><p>${r.summary}</p><div class="solo-actions">${actionLabels(r).map((label,i)=>`<span>${icon(r.searches&&i===0?'search':'book')}${label}</span>`).join('')}</div><div class="solo-context"><span>${collected?t(`已收到 ${collected} 份子代理调查`,`${collected} ${plural(collected,'agent report','agent reports')} received`):t('为后续分工建立调查基础','Establishing a foundation for delegation')}</span><p>${collected?t('主代理连接已有发现，继续处理需要统一判断的问题。','The coordinator connects findings and resolves questions that require a shared judgment.'):t('先明确来源、口径与调查对象，再组织独立任务。','Define sources, criteria, and research targets before delegating independent tasks.')}</p></div></div>`;
 }else{
  const b=c.batches[r.batch],phase=f.phase;
  const stageText=[t(`本批委派 ${b.workers.length} 个独立任务，共同服务于当前研究目标。`,`This batch delegates ${b.workers.length} ${plural(b.workers.length,'independent task','independent tasks')} toward the current research goal.`),b.dispatch,state.mode==='auto'?t('子代理在独立上下文中搜索、阅读与分析，形成各自的调查结果。','Agents search, read, and analyze in independent contexts to develop their findings.'):t('子代理分别搜索、阅读与分析。点击卡片，可以查看任务、执行轮次和结构化返回。','Agents search, read, and analyze independently. Select a card to explore its assignment, turns, and structured response.'),b.returned][phase];
  const connector=[t('当前判断 → 独立任务','Current assessment → Independent tasks'),t('任务与背景 → 子代理','Task and context → Agents'),t('搜索 · 阅读 · 分析','Search · Read · Analyze'),t('调查结果 → 主代理','Findings → Coordinator')][phase];
  $('scene').innerHTML=`<div class="coordinator scene-enter"><div class="coordinator-top"><span class="coordinator-role">${icon('hub')}${t('主代理 / A1.5-Preview','Coordinator / A1.5-Preview')}</span><span class="coordinator-turn">${t(`第 ${r.turn} 轮 · 第 ${r.batch+1} 批委派`,`Turn ${r.turn} · Batch ${r.batch+1}`)}</span></div><h3>${r.title}</h3><p>${r.summary}</p></div><div class="dispatch-line"><span>${icon(phase===3?'return':'branch')}${connector}</span></div><div class="workers-heading"><span>${t(`${b.workers.length} 个独立研究任务`,`${b.workers.length} ${plural(b.workers.length,'independent research task','independent research tasks')}`)}</span><button class="text-btn" data-action="all-workers">${t(`全部 ${c.workers.length} 个`,`All ${c.workers.length} ${plural(c.workers.length,'agent','agents')}`)} ${icon('arrow')}</button></div><div class="worker-grid scene-enter">${b.workers.map(id=>workerCard(c.workers[id],phase)).join('')}</div><div class="flow-note">${icon(phase===3?'return':phase===2?'search':'branch')}<span>${stageText}</span></div>`;
 }
 $('seek').value=state.step;$('seek').setAttribute('aria-valuetext',t(`主代理第 ${r.turn} 轮，${f.phase===null?r.title:phases()[f.phase]}`,`Coordinator turn ${r.turn}, ${f.phase===null?r.title:phases()[f.phase]}`));
 $('stepLabel').textContent=String(state.step+1).padStart(2,'0')+' / '+String(maxStep()+1).padStart(2,'0');
 $('prev').disabled=state.step===0;$('next').disabled=state.step===maxStep();syncPlay();syncDemoMode();
 if(state.mode==='auto')$('scene').scrollTop=0;
}
function syncPlay(){$('play').innerHTML=icon(state.playing?'pause':'play')+(state.playing?t('暂停','Pause'):state.step===maxStep()?t('重播','Replay'):t('播放','Play'));$('play').setAttribute('aria-label',state.playing?t('暂停协作演示','Pause collaboration demo'):t('播放协作演示','Play collaboration demo'));}
function pause(){state.playing=false;clearTimeout(state.timer);cancelAnimationFrame(scenePan);audioRequest++;demoAudio.pause();syncPlay();syncDemoMode();}
function go(step){pause();state.step=Math.max(0,Math.min(maxStep(),step));renderScene();}
function frameDelay(){const phase=frame().phase;return (phase===null?5500:[6200,3800,4600,4400][phase])/(state.mode==='auto'?1.25:state.speed);}
function schedule(){
 const delay=frameDelay();
 cancelAnimationFrame(scenePan);
 if(state.mode==='auto'){
  const scene=$('scene'),start=performance.now(),from=scene.scrollTop;
  const pan=now=>{
   if(!state.playing||state.mode!=='auto')return;
   const progress=Math.max(0,Math.min(1,((now-start)/delay-.15)/.7));
   scene.scrollTop=from+Math.max(0,scene.scrollHeight-scene.clientHeight-from)*(progress*progress*(3-2*progress));
   if(progress<1)scenePan=requestAnimationFrame(pan);
  };
  scenePan=requestAnimationFrame(pan);
 }
 state.timer=setTimeout(()=>{
  if(!state.playing)return;
  if(state.step===maxStep()){pause();return;}
  state.step++;renderScene();
  if(state.step===maxStep()&&state.mode==='interactive')pause();else schedule();
 },delay);
}
async function play(){
 if(state.playing){pause();return;}
 if(state.step===maxStep()){state.step=0;demoAudio.currentTime=0;}
 state.playing=true;renderScene();syncDemoMode();
 if(state.mode==='auto'&&state.sound){
  const request=++audioRequest;
  try{await demoAudio.play();}catch(error){
   if(request!==audioRequest&&error.name==='AbortError')return;
   audioFailed(error);return;
  }
  if(request!==audioRequest)return;
  state.audioError=false;syncDemoMode();
 }
 schedule();
}
function chooseCase(i){pause();demoAudio.currentTime=0;state.caseIndex=i;state.step=0;state.zoom=0;renderCases();}

function syncDemoMode(){
 const automatic=state.mode==='auto';
 $('workbench').classList.toggle('auto-demo',automatic);
 $('workbench').classList.toggle('demo-playing',automatic&&state.playing);
 document.querySelectorAll('[data-demo-mode]').forEach(button=>{const active=button.dataset.demoMode===state.mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 $('demoAudioControls').hidden=!automatic;
 $('demoSound').textContent=state.sound?t('关闭音乐','Sound off'):t('开启音乐','Sound on');
 $('demoSound').setAttribute('aria-pressed',String(state.sound));
 $('demoAudioControls').classList.toggle('audible',automatic&&state.playing&&state.sound&&!demoAudio.paused);
 $('workbench').querySelectorAll('.bench-main button').forEach(button=>{button.disabled=automatic;});
 $('jump').hidden=automatic;
 $('demoHint').textContent=automatic?t('1.25× 自动播放 · 拖动进度继续观看，切回交互模式探索详情。','1.25× playback · Seek to keep watching; switch to Interactive to explore details.'):t('选择轮次或子代理卡片，探索任务与研究结果。','Choose a turn or an agent card to explore assignments and findings.');
 $('demoAudioError').hidden=!state.audioError;
 if(state.audioError)$('demoAudioError').textContent=t('音乐播放失败，演示已暂停。请重新播放，或关闭音乐后继续。','Audio playback failed. The demo is paused. Try playing again, or turn sound off to continue.');
}
function audioFailed(error){
 state.audioError=true;pause();console.error('Demo audio failed:',error);
}
function chooseDemoMode(mode){
 if(mode!=='interactive'&&mode!=='auto')throw new Error('Unsupported demo mode: '+mode);
 if(mode===state.mode)return;
 pause();state.mode=mode;demoAudio.currentTime=0;
 if(mode==='auto'&&state.step===maxStep())state.step=0;
 renderScene();syncDemoMode();
 if(mode==='auto')play();
}
$('demoSound').addEventListener('click',()=>{
 state.sound=!state.sound;
 if(!state.sound){audioRequest++;demoAudio.pause();if(state.playing){clearTimeout(state.timer);schedule();}}
 else if(state.playing){pause();play();}
 syncDemoMode();
});
demoAudio.addEventListener('error',()=>audioFailed(demoAudio.error));
demoAudio.addEventListener('playing',syncDemoMode);
demoAudio.addEventListener('pause',syncDemoMode);

function showDetail(title,label,body){pause();if(!$('detail').open)lastFocus=document.activeElement;$('detailTitle').textContent=title;$('detailLabel').textContent=label;$('detailBody').innerHTML=body;document.body.classList.add('modal-open');if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;$('closeDetail').focus({preventScroll:true});}
function renderWorker(ci,id,tab='task'){
 detailState={kind:'worker',ci,id,tab};
 const c=DATA[ci],w=c.workers[id],b=c.batches.find(b=>b.workers.includes(id));let body;
 if(tab==='task')body=`<div class="task-detail"><article class="task-object"><span>${t('调查对象','Research subject')}</span><h3>${esc(w.name)}</h3></article><article><span>${t('被委派的任务','Assigned task')}</span><div class="markdown assignment-copy">${w.assignmentHtml.task}</div></article><article><span>${t('协作位置','Role in the collaboration')}</span><p class="assignment-position">${t(`由主代理在第 ${b.turn} 轮委派 · 第 ${c.batches.indexOf(b)+1} 批 · 本批 ${b.workers.length} 个任务`,`Assigned by the coordinator in turn ${b.turn} · Batch ${c.batches.indexOf(b)+1} · ${b.workers.length} ${plural(b.workers.length,'task','tasks')} in this batch`)}</p><div class="markdown assignment-copy">${w.assignmentHtml.context}</div></article><article><span>${t('需要返回','Expected response')}</span><div class="markdown assignment-copy">${w.assignmentHtml.expected_output}</div></article></div>`;
 else if(tab==='actions')body=`<div class="round-intro"><h3>${t(`${w.turns} 轮，逐步推进调查。`,`${w.turns} ${plural(w.turns,'turn','turns')} of investigation.`)}</h3><p>${t('每行对应一次子代理执行，展示该轮的动作类型。','Each row represents one agent turn and the actions taken.')}</p></div><div class="round-grid">${w.rounds.map(r=>`<article class="round-card ${r.final?'last':''}"><span>${t(`第 ${String(r.turn).padStart(2,'0')} 轮`,`Turn ${String(r.turn).padStart(2,'0')}`)}</span>${icon(r.final?'check':r.reads?'book':r.searches?'search':'hub')}<h4>${r.final?t('组织返回','Prepare response'):r.reads&&r.searches?t('搜索与阅读','Search and read'):r.reads?t('阅读资料','Read sources'):r.searches?t('搜索证据','Search for evidence'):t('分析与整理','Analyze and organize')}</h4><p>${[r.searches?t(`搜索 ${r.searches} 次`,`${r.searches} ${plural(r.searches,'search','searches')}`):'',r.reads?t(`阅读 ${r.reads} 页`,`${r.reads} ${plural(r.reads,'page','pages')} read`):''].filter(Boolean).join(' · ')}</p></article>`).join('')}</div>`;
 else if(tab==='answer')body=`<section class="return-section"><div class="eyebrow">${t('研究结论','Findings')}</div><div class="markdown answer-body">${w.answerHtml}</div></section>${w.evidence.length?`<section class="return-section"><div class="eyebrow">${t(`证据来源 / ${w.evidence.length}`,`Sources / ${w.evidence.length}`)}</div><div class="source-cards">${w.evidence.map((e,i)=>`<article class="source-card"><div><span>${String(i+1).padStart(2,'0')}</span><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.url)} ${icon('arrow')}</a></div>${Object.hasOwn(e,'supports')?`<p>${esc(e.supports)}</p>`:''}<blockquote><span class="source-label">${t('来源节选','Source excerpt')}</span>${esc(e.snippet)}</blockquote></article>`).join('')}</div></section>`:''}`;
 else throw new Error(t('未知详情标签：','Unknown detail tab: ')+tab);
 showDetail(w.name,`${c.short} / AGENT ${String(id+1).padStart(2,'0')}`,`<div class="modal-summary"><small>${t('任务摘要','Task summary')}</small>${esc(w.summary)}</div><div class="modal-metrics"><span><b>${w.turns}</b>${t('执行轮次','Turns')}</span><span><b>${w.toolCount}</b>${t('工具调用','Tool calls')}</span><span><b>${mins(w.duration)}</b>${t('分钟','Min')}</span><span>${t(`第 <b>${c.batches.indexOf(b)+1}</b>批委派`,`Batch <b>${c.batches.indexOf(b)+1}</b>`)}</span></div><div class="modal-tabs" role="group" aria-label="${t('子代理详情','Agent details')}">${[['task',t('委派任务','Assignment')],['actions',t('调查过程','Investigation')],['answer',t('返回结果','Response')]].map(([t,l])=>`<button class="${t===tab?'active':''}" data-worker-tab="${t}" data-ci="${ci}" data-wi="${id}" aria-pressed="${t===tab}">${l}</button>`).join('')}</div>${body}`);
}
function showAllWorkers(){detailState={kind:'all'};showDetail(current().short+t(' · 全部子代理',' · All agents'),'INDEPENDENT INVESTIGATIONS',`<div class="all-worker-intro"><span>${t(`${current().workers.length} 个任务 · ${current().batches.length} 批委派`,`${current().workers.length} ${plural(current().workers.length,'task','tasks')} · ${current().batches.length} ${plural(current().batches.length,'batch','batches')}`)}</span><input id="workerSearch" type="search" placeholder="${t('搜索调查对象或任务','Search subjects or assignments')}" aria-label="${t('搜索子代理','Search agents')}"></div><div class="all-workers" id="allWorkerGrid">${current().workers.map(w=>workerCard(w,1)).join('')}</div>`);$('workerSearch').addEventListener('input',e=>{const q=e.target.value.trim().toLocaleLowerCase(),found=current().workers.filter(w=>(w.name+' '+w.summary).toLocaleLowerCase().includes(q));$('allWorkerGrid').innerHTML=found.length?found.map(w=>workerCard(w,1)).join(''):`<p class="search-empty">${t('没有匹配的调查任务。','No matching assignments.')}</p>`;});}
function closeDetail(){if($('detail').open)$('detail').close();}

function renderDiscovery(){
 const c=current(),youtube=c.zoom.length>0;
 $('discovery-title').textContent=youtube?t('放大一条分支，看判断如何改变。','Follow one branch. Watch the judgment evolve.'):t('复杂任务，展开为持续的研究。','Complex tasks unfold into sustained research.');
 $('discoveryIntro').textContent=youtube?t('从委派前提到独立判断，再到最终采用。三个片段，沿着同一条证据链展开。','From the initial premise to independent judgment and final adoption: three moments along one chain of evidence.'):t('从研究对象到执行规模，观察任务如何被分解、调查并汇总。','Explore how a task is divided, investigated, and synthesized, from research scope to execution scale.');
 $('zoomTabs').classList.toggle('hidden',!youtube);
 if(youtube){
  $('zoomTabs').innerHTML=c.zoom.map((z,i)=>`<button data-zoom="${i}" class="${i===state.zoom?'active':''}" aria-pressed="${i===state.zoom}"><span>0${i+1}</span><strong>${z.name}</strong><small>${z.badge}</small></button>`).join('');
  const z=c.zoom[state.zoom];
  $('discoveryBody').innerHTML=`<article class="zoom-panel"><div class="zoom-heading"><div class="eyebrow">ZOOM IN / ${z.badge}</div><h3>${z.title}</h3><p>${z.intro}</p></div><div class="zoom-layout"><div class="zoom-stages">${z.stages.map(([l,t,p],i)=>`<article><span class="zoom-number">0${i+1}</span><div><small>${l}</small><h4>${t}</h4><p>${p}</p></div></article>`).join('')}<button class="text-btn" data-zoom-jump="${z.mainTurn}">${t(`定位主代理第 ${z.mainTurn} 轮`,`Go to coordinator turn ${z.mainTurn}`)} ${icon('arrow')}</button></div><div class="quote-stack">${z.quotes.map(q=>`<figure class="thought-quote"><figcaption>${icon('hub')}${q.actor}<span>${t('推理片段','Reasoning excerpt')}</span></figcaption><blockquote>${q.html}</blockquote><p>${q.interpretation}</p></figure>`).join('')}</div></div><div class="adoption"><div><span>${t('调查起点','Starting point')}</span><p>${z.before}</p></div><span class="adoption-arrow">→</span><div><span>${t('最终采用','Final decision')}</span><p>${z.after}</p></div><small>${z.outcome}</small></div><div class="zoom-takeaway">${icon('return')}<p>${z.takeaway}</p><button class="text-btn" data-worker="${z.worker}" data-worker-case="${state.caseIndex}" data-open-result>${t('查看调查结果','View findings')} ${icon('arrow')}</button></div></article>`;
 }else{
  const stats=[[c.scope[0][0],c.scope[0][1]],[c.scope[1][0],c.scope[1][1]],[c.workers.length,t('独立子代理',`${plural(c.workers.length,'Independent agent','Independent agents')}`)],[c.timeline.length,t('主代理轮次',`${plural(c.timeline.length,'Coordinator turn','Coordinator turns')}`)],[fmt(c.workerTurns),t('子代理执行轮次','Agent turns')],[fmt(sum(c.workers,w=>w.toolCount)),t('子代理工具调用','Agent tool calls')]];
  $('discoveryBody').innerHTML=`<div class="scale-panel"><div class="scale-metrics">${stats.map(([n,l])=>`<div><b>${n}</b><span>${l}</span></div>`).join('')}</div><div class="scale-bottom"><div><h3>${t(`${c.short} · ${c.batches.length} 批分工`,`${c.short} · ${c.batches.length} ${plural(c.batches.length,'batch','batches')}`)}</h3><p>${t(`任务执行 ${mins(c.elapsed)} 分钟，子代理累计研究 ${hours(c.workerSeconds)} 小时。`,`Elapsed time: ${mins(c.elapsed)} min. Total agent research: ${hours(c.workerSeconds)} hr.`)}</p><small>${t('累计研究时长为子代理执行时长之和，包含并行重叠。','Total research time sums all agent durations, including overlapping work.')}</small></div><div class="batch-bars">${c.batches.map((b,i)=>`<button data-zoom-jump="${b.turn}" aria-label="${t(`查看第 ${i+1} 批`,`View batch ${i+1}`)}"><b>${b.workers.length}</b><i style="height:${b.workers.length*13}px"></i><span>${t(`第 ${i+1} 批`,`Batch ${i+1}`)}</span></button>`).join('')}</div></div></div>`;
 }
}

const motion={index:0,progress:0,last:null,playing:!matchMedia('(prefers-reduced-motion: reduce)').matches,visible:false,raf:0,paths:[]};
const NS='http://www.w3.org/2000/svg';
function buildHero(){
 cancelAnimationFrame(motion.raf);motion.index=0;motion.progress=0;motion.last=null;
 const c=current(),gap=225,y=180;let paths='',nodes='';
 c.timeline.forEach((r,i)=>{
  const x=74+i*gap;
  if(i<c.timeline.length-1){
   const ws=r.batch===null?[]:c.batches[r.batch].workers;
   if(ws.length){
    ws.forEach((id,j)=>{const wy=ws.length===1?y:y-108+j*216/(ws.length-1),wx=x+gap/2;
     paths+=`<path class="flow-wire branch-wire" data-flow-path="${i}" d="M${x} ${y} C${x+52} ${y} ${wx-45} ${wy} ${wx} ${wy} C${wx+45} ${wy} ${x+gap-52} ${y} ${x+gap} ${y}"/>`;
     nodes+=`<g class="flow-worker" role="button" tabindex="-1" data-worker="${id}" data-worker-case="${state.caseIndex}" aria-label="${esc(c.workers[id].name)}"><title>${esc(c.workers[id].name)}</title><circle cx="${wx}" cy="${wy}" r="9"/><circle class="flow-worker-core" cx="${wx}" cy="${wy}" r="3"/></g>`;
    });
    nodes+=`<text class="flow-count" x="${x+gap/2}" y="${ws.length===1?146:46}" text-anchor="middle">${t(`${ws.length} 个子代理`,`${ws.length} ${plural(ws.length,'agent','agents')}`)}</text>`;
   }else paths+=`<path class="flow-wire solo-wire" data-flow-path="${i}" d="M${x} ${y} L${x+gap} ${y}"/>`;
  }
  nodes+=`<g class="flow-main" role="button" tabindex="-1" data-flow-turn="${i}" aria-label="${t(`主代理第 ${r.turn} 轮：${esc(r.title)}`,`Coordinator turn ${r.turn}: ${esc(r.title)}`)}"><rect x="${x-25}" y="${y-25}" width="50" height="50" rx="14"/><text x="${x}" y="${y+5}" text-anchor="middle">${String(r.turn).padStart(2,'0')}</text></g><text class="flow-main-label" x="${x}" y="${y+49}" text-anchor="middle">${r.final?t('综合交付','Final deliverable'):r.batch===null?(r.searches?t('主代理搜索','Coordinator searches'):t('主代理阅读','Coordinator reads')):t('组织委派','Delegate tasks')}</text>`;
 });
 $('heroNetwork').innerHTML=`<defs><linearGradient id="wireGradient"><stop stop-color="#b595ee"/><stop offset="1" stop-color="#94d8be"/></linearGradient></defs><g id="flowWorld">${paths}${nodes}<g id="flowParticles"></g></g>`;
 $('heroCase').textContent=c.short;$('heroScope').textContent=t(`${c.timeline.length} 轮主代理 · ${c.workers.length} 个子代理`,`${c.timeline.length} ${plural(c.timeline.length,'coordinator turn','coordinator turns')} · ${c.workers.length} ${plural(c.workers.length,'agent','agents')}`);
 $('flowTicks').innerHTML=c.timeline.map((r,i)=>`<button class="${r.batch===null?'solo-tick':'swarm-tick'}" data-hero-step="${i}" aria-label="${t(`预览主代理第 ${r.turn} 轮`,`Preview coordinator turn ${r.turn}`)}"><span>${r.batch===null?'1':c.batches[r.batch].workers.length}</span><i></i></button>`).join('');
 enterHeroStep();paintHero();syncHero();
}
function enterHeroStep(){
 const r=current().timeline[motion.index];
 motion.paths=[...$('heroNetwork').querySelectorAll(`[data-flow-path="${motion.index}"]`)];
 $('flowParticles').innerHTML=motion.paths.map(()=>'<circle r="4" class="flow-particle"/>').join('');
 $('heroNetwork').querySelectorAll('.flow-wire').forEach(p=>p.classList.toggle('active',Number(p.dataset.flowPath)===motion.index));
 $('heroNetwork').querySelectorAll('.flow-main').forEach(n=>n.classList.toggle('active',Number(n.dataset.flowTurn)===motion.index));
 $('flowTicks').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===motion.index));
 $('heroStepTitle').textContent=`T${String(r.turn).padStart(2,'0')} / ${r.title}`;
 $('heroStepText').textContent=r.batch===null?r.summary:current().batches[r.batch].dispatch;
}
function paintHero(){
 const total=current().timeline.length,gap=225,maxOffset=Math.max(0,(total-1)*gap+148-720);
 const travel=motion.index+motion.progress,offset=Math.max(0,Math.min(maxOffset,74+travel*gap-170));
 $('flowWorld').setAttribute('transform',`translate(${-offset} 0)`);
 [...$('flowParticles').children].forEach((dot,i)=>{const path=motion.paths[i],p=path.getPointAtLength(path.getTotalLength()*motion.progress);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);});
}
function animateHero(now){
 motion.raf=0;
 if(motion.last!==null){const r=current().timeline[motion.index],duration=r.batch===null?3300:6500;motion.progress+=Math.min(now-motion.last,100)/duration;}
 motion.last=now;
 if(motion.progress>=1){motion.progress=0;motion.index=(motion.index+1)%current().timeline.length;enterHeroStep();}
 paintHero();if(motion.playing&&motion.visible&&!document.hidden)motion.raf=requestAnimationFrame(animateHero);
}
function syncHero(){cancelAnimationFrame(motion.raf);motion.last=null;$('heroMotion').innerHTML=icon(motion.playing?'pause':'play');$('heroMotion').setAttribute('aria-label',motion.playing?t('暂停首屏演示','Pause overview animation'):t('播放首屏演示','Play overview animation'));if(motion.playing&&motion.visible&&!document.hidden)motion.raf=requestAnimationFrame(animateHero);}
function heroStep(i){motion.index=i;motion.progress=0;motion.last=null;enterHeroStep();paintHero();}
function locateRound(turn){go(current().timeline[turn-1].start);$('workspace').scrollIntoView();}
function locateLoadedHeading(id){const section=$(id),reader=$('resultContent');reader.scrollTo({top:reader.scrollTop+section.getBoundingClientRect().top-reader.getBoundingClientRect().top-20,behavior:'smooth'});$('resultSelect').value=id;$('resultToc').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.heading===id));}

document.addEventListener('click',e=>{
 const target=e.target.closest('button,[data-flow-turn],.flow-worker');if(!target||target.disabled)return;
 if(target.hasAttribute('data-lang'))setLanguage(target.dataset.lang);
 else if(target.hasAttribute('data-demo-mode'))chooseDemoMode(target.dataset.demoMode);
 else if(target.hasAttribute('data-case'))chooseCase(Number(target.dataset.case));
 else if(target.hasAttribute('data-round'))go(current().timeline[Number(target.dataset.round)].start);
 else if(target.hasAttribute('data-phase'))go(round().start+Number(target.dataset.phase));
 else if(target.hasAttribute('data-worker'))showWorker(Number(target.dataset.workerCase),Number(target.dataset.worker),target.hasAttribute('data-open-result')?'answer':'task');
 else if(target.hasAttribute('data-worker-tab'))showWorker(Number(target.dataset.ci),Number(target.dataset.wi),target.dataset.workerTab);
 else if(target.hasAttribute('data-zoom')){state.zoom=Number(target.dataset.zoom);renderDiscovery();}
 else if(target.hasAttribute('data-zoom-jump'))locateRound(Number(target.dataset.zoomJump));
 else if(target.hasAttribute('data-heading'))locateHeading(target.dataset.heading);
 else if(target.hasAttribute('data-hero-step'))heroStep(Number(target.dataset.heroStep));
 else if(target.hasAttribute('data-flow-turn')){heroStep(Number(target.dataset.flowTurn));locateRound(Number(target.dataset.flowTurn)+1);}
 else if(target.hasAttribute('data-action')){const a=target.dataset.action;if(a==='all-workers')showAllWorkers();else if(a==='result')$('deliverable').scrollIntoView();else if(a==='restart'){go(0);play();}else throw new Error(t('未知操作：','Unknown action: ')+a);}
});
$('heroNetwork').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
$('heroMotion').addEventListener('click',()=>{motion.playing=!motion.playing;syncHero();});
$('heroLocate').addEventListener('click',()=>locateRound(motion.index+1));
$('heroPlay').addEventListener('click',()=>{go(0);$('workspace').scrollIntoView();play();});
$('play').addEventListener('click',play);$('prev').addEventListener('click',()=>go(state.step-1));$('next').addEventListener('click',()=>go(state.step+1));$('seek').addEventListener('input',e=>go(Number(e.target.value)));
$('seek').addEventListener('change',()=>{if(state.mode==='auto'&&!state.playing&&state.step<maxStep())play();});
$('speed').addEventListener('click',()=>{state.speed=state.speed===1?1.5:state.speed===1.5?2:1;$('speed').textContent=state.speed+'×';if(state.playing){clearTimeout(state.timer);schedule();}});
$('jump').addEventListener('click',()=>locateRound(current().zoom.length?current().zoom[state.zoom].mainTurn:current().batches[3].turn));
$('closeDetail').addEventListener('click',closeDetail);
$('detail').addEventListener('close',()=>{detailState=null;document.body.classList.remove('modal-open');if(lastFocus&&lastFocus.isConnected&&!$('detail').contains(lastFocus))lastFocus.focus({preventScroll:true});});
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
$('resultSelect').addEventListener('change',e=>locateHeading(e.target.value));
$('expandReader').addEventListener('click',()=>{const expanded=$('reader').classList.toggle('expanded');$('expandReader').textContent=expanded?t('收起阅读区域','Collapse reader'):t('展开阅读区域','Expand reader');$('expandReader').setAttribute('aria-expanded',expanded);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();syncHero();});
new IntersectionObserver(entries=>{motion.visible=entries[0].isIntersecting;syncHero();},{threshold:.1}).observe($('heroArt'));
function renderTotals(){
 $('totalCases').textContent=DATA.length;$('totalWorkers').textContent=sum(DATA,c=>c.workers.length);$('totalHours').textContent=hours(sum(DATA,c=>c.workerSeconds));$('totalTurns').textContent=fmt(sum(DATA,c=>c.workerTurns));$('totalTaskTokens').textContent=tokenformat(sum(DATA,c=>c.taskTokens));
}

const localizedElements=[...document.querySelectorAll('[data-en],[data-en-aria],[data-en-title],[data-en-content]')];
localizedElements.forEach(el=>{
 if(el.hasAttribute('data-en'))el.dataset.zh=el.innerHTML;
 if(el.hasAttribute('data-en-aria'))el.dataset.zhAria=el.getAttribute('aria-label');
 if(el.hasAttribute('data-en-title'))el.dataset.zhTitle=el.getAttribute('title');
 if(el.hasAttribute('data-en-content'))el.dataset.zhContent=el.getAttribute('content');
});
function setLanguage(lang){
 if(lang!=='zh'&&lang!=='en')throw new Error('Unsupported language: '+lang);
 pause();
 const heroIndex=motion.index,heroProgress=motion.progress,openDetail=detailState;
 state.lang=lang;DATA=LOCALIZED_DATA[lang];document.documentElement.lang=lang==='zh'?'zh-CN':'en';
 localizedElements.forEach(el=>{
  if(el.hasAttribute('data-en'))el.innerHTML=lang==='en'?el.dataset.en:el.dataset.zh;
  if(el.hasAttribute('data-en-aria'))el.setAttribute('aria-label',lang==='en'?el.dataset.enAria:el.dataset.zhAria);
  if(el.hasAttribute('data-en-title'))el.setAttribute('title',lang==='en'?el.dataset.enTitle:el.dataset.zhTitle);
  if(el.hasAttribute('data-en-content'))el.setAttribute('content',lang==='en'?el.dataset.enContent:el.dataset.zhContent);
 });
 document.querySelectorAll('[data-lang]').forEach(button=>{const active=button.dataset.lang===lang;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 const url=new URL((window.showcaseLocation||window.location).href);url.searchParams.set('lang',lang);if(window.showcaseLocation)window.showcaseLocation.replace(url.href);else history.replaceState(null,'',url);
 renderTotals();renderCases();syncDemoMode();
 motion.index=heroIndex;motion.progress=heroProgress;motion.last=null;enterHeroStep();paintHero();syncHero();
 $('expandReader').textContent=$('reader').classList.contains('expanded')?t('收起阅读区域','Collapse reader'):t('展开阅读区域','Expand reader');
 if($('detail').open&&openDetail){if(openDetail.kind==='worker')showWorker(openDetail.ci,openDetail.id,openDetail.tab);else showAllWorkers();}
}
const initialLanguage=new URLSearchParams((window.showcaseLocation||window.location).search).get('lang');
setLanguage(initialLanguage===null?'zh':initialLanguage);

