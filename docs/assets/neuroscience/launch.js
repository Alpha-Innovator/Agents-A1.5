/* Real input files only. Each tree leaf previews and downloads its own bytes. */
function inputFileButton(file){return `<button class="workspace-file" data-workspace-file="${file.id}" title="${esc(file.path)}"><span class="file-type">${file.kind}</span><span class="file-info"><strong class="file-name">${esc(file.name)}</strong><span class="file-summary">${file.shape.join(' × ')} · ${esc(file.dtype)} · ${(file.bytes/1024).toFixed(1)} KB</span></span><i aria-hidden="true">↗</i></button>`}
function renderInputTree(){
 const q=$('[data-input-search]').value.trim().toLowerCase(),type=$('[data-input-type]').value;
 const files=WORKSPACE.files.filter(f=>(type==='all'||f.kind===type)&&(!q||f.path.toLowerCase().includes(q)));
 let html=files.filter(f=>f.kind==='CSV').map(inputFileButton).join('');
 const arrays=files.filter(f=>f.kind==='NPY'),labs=[...new Set(arrays.map(f=>f.lab))];
 labs.forEach((lab,li)=>{const group=arrays.filter(f=>f.lab===lab),sessions=[...new Set(group.map(f=>f.subject+' / '+f.session))];
  html+=`<details class="input-folder" ${q||li===0?'open':''}><summary><span class="folder-icon">⌁</span><strong>${esc(lab)}</strong><span>${group.length}</span></summary><div class="folder-children">`;
  sessions.forEach((session,si)=>{const fs=group.filter(f=>f.subject+' / '+f.session===session),probes=[...new Set(fs.map(f=>f.probe))];
   html+=`<details class="input-session" ${q||si===0?'open':''}><summary><span>▸</span><strong>${esc(session)}</strong><span>${fs.length}</span></summary>`;
   probes.forEach(probe=>{html+=`<div class="input-probe"><div class="probe-label">${esc(probe)} <span>/ alf / pykilosort</span></div>${fs.filter(f=>f.probe===probe).map(inputFileButton).join('')}</div>`});html+='</details>';
  });html+='</div></details>';
 });
 $('#workspace-file-list').innerHTML=html||`<p class="input-empty">${T('没有匹配的输入文件')}</p>`;
 $('[data-workspace-count]').textContent=(files.length===WORKSPACE.inputCount?'':files.length+' / ')+WORKSPACE.inputCount+' '+T('个输入文件');
}
function showInputSelection(file){
 $('[data-input-selection]').innerHTML=`<span class="file-type">${file.kind}</span><div><strong>${esc(file.name)}</strong><span>${file.shape.join(' × ')} · ${file.kind==='CSV'?T('脑区 × 字段'):file.family==='coordinates'?T('记录通道 × 三维坐标'):T('记录通道 · 脑区编号')}</span></div><button data-workspace-file="${file.id}">${T('预览')} ↗</button>`;
}
function openWorkspace(id){
 const file=WORKSPACE.files.find(f=>f.id===id);if(!file)return;
 const dialog=$('#workspace-dialog'),body=$('.workspace-preview',dialog);
 const titles={regions:'脑区指标表',coordinates:'记录通道坐标',locations:'记录通道脑区编号'};
 const table=`<div class="workspace-table-scroll"><table><thead><tr>${file.columns.map(s=>`<th>${esc(s||'(index)')}</th>`).join('')}</tr></thead><tbody>${file.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==='number'?Number(v.toFixed(3)):v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 body.innerHTML=`<div class="eyebrow">${T('提供的输入数据')}</div><h3>${T(titles[file.family])}</h3><p class="preview-origin" data-no-translate>${esc(file.path)}</p><div class="preview-meta"><span>${file.shape.join(' × ')} · ${esc(file.dtype)}</span><span>${(file.bytes/1024).toFixed(1)} KB</span><span>${T('前 8 行 · 原文件节选')}</span></div>${table}<div class="input-integrity"><span>SHA-256</span><code>${file.sha256}</code></div><button class="btn small" data-workspace-save="${file.id}">${T('下载此文件')} ↓</button>`;
 const related=file.kind==='CSV'?[file]:WORKSPACE.files.filter(f=>f.lab===file.lab);
 $('.workspace-modal-nav',dialog).innerHTML=`<div class="workspace-group-label">${esc(file.lab||'data / 2')}</div>`+related.map(f=>`<div class="modal-file-context">${esc(f.kind==='CSV'?'region_info.csv':f.subject+' / '+f.session+' / '+f.probe)}</div>`+inputFileButton(f)).join('');
 $$('.workspace-modal-nav [data-workspace-file]',dialog).forEach(b=>b.classList.toggle('active',b.dataset.workspaceFile===id));
 showInputSelection(file);if(!dialog.open)dialog.showModal();
}
function initHeroAtlas(){
 const wrap=$('.discovery-visual'),readout=$('.hero-region-readout');
 function show(acr){const r=regionByAcr[acr];if(!r||wrap.dataset.heroRegion===acr)return;wrap.dataset.heroRegion=acr;$$('.atlas-region',wrap).forEach(p=>p.classList.toggle('highlight',p.dataset.region===acr));readout.innerHTML=`<div><strong>${esc(acr)}</strong><span>${esc(r.name)}</span></div><b>PC1 ${signed(r.pc1)}</b><button data-hero-locate="${esc(acr)}" aria-label="${T('在解剖图谱中查看')} ${esc(acr)}">↗</button>`}
 // Scroll-induced pointerover events must not replace a keyboard selection.
 for(const event of ['pointermove','focusin','click'])wrap.addEventListener(event,e=>{const path=e.target.closest('[data-region]');if(path)show(path.dataset.region)});
 show('MOp');
}
function selectEvidence(name,focus=false){
 $$('[data-evidence]').forEach(button=>{const active=button.dataset.evidence===name;button.classList.toggle('active',active);if(button.getAttribute('role')==='tab'){button.setAttribute('aria-selected',active);button.tabIndex=active?0:-1;if(active&&focus)button.focus()}else button.setAttribute('aria-pressed',active)});
 $$('.evidence-pane').forEach(p=>p.hidden=p.id!=='evidence-'+name);
}
function initInlineFilm(){
 const canvas=$('#workflow-preview');if(!canvas)return;
 const player=canvas.closest('.process-player'),runtime=new ScienceMotionFilm(canvas);let visible=false,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=.7,last=0,raf=0,lastPaint=0;
 const render=()=>{runtime.render(elapsed);$('[data-preview-seek]').value=elapsed;$('[data-preview-time]').textContent='00:'+String(Math.floor(elapsed)).padStart(2,'0')+' / 00:28'};
 const sync=()=>{player.classList.toggle('paused',!playing);$('[data-preview-toggle]').textContent=playing?'Ⅱ':'▶';$('[data-preview-toggle]').setAttribute('aria-label',T(playing?'暂停流程演示':'播放流程演示'))};
 const tick=now=>{raf=0;if(!visible||!playing||document.hidden||$('#film').open){last=0;return}if(last)elapsed+=Math.min((now-last)/1000,.1);last=now;if(elapsed>=28){elapsed=28;playing=false;sync()}if(now-lastPaint>=1000/30||!playing){render();lastPaint=now}if(playing)raf=requestAnimationFrame(tick)};
 const resume=()=>{cancelAnimationFrame(raf);last=0;if(visible&&playing&&!document.hidden&&!$('#film').open)raf=requestAnimationFrame(tick)};
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume()},{threshold:.25});observer.observe(canvas);
 $('[data-preview-play]').addEventListener('click',()=>{if(elapsed>=28)elapsed=0;playing=true;sync();resume()});
 $('[data-preview-toggle]').addEventListener('click',()=>{if(elapsed>=28)elapsed=0;playing=!playing;sync();resume()});
 $('[data-preview-seek]').addEventListener('input',e=>{elapsed=+e.target.value;last=0;render()});
 document.addEventListener('visibilitychange',resume);$('#film').addEventListener('close',resume);
 document.addEventListener('click',e=>{if(e.target.closest('[data-film]')){cancelAnimationFrame(raf);last=0}});
 runtime.ready.then(()=>{render();sync();resume()});sync();
 window.inlineResearchFilm={runtime,pause(){playing=false;sync();resume()},seek(t){elapsed=Math.max(0,Math.min(28,t));render()},get playing(){return playing},get visible(){return visible}};
}
/* A reader-paced companion to the film's final frame, synthesized from saved results. */
function openResearchBrief(){
 const EN=LANG==='en',runtime=window.inlineResearchFilm.runtime;window.inlineResearchFilm.pause();
 let dialog=$('#research-brief');
 if(!dialog){
  const titles=EN?{F:'Main coding axis',G:'Rank-based coding axis',H:'Choice residual',I:'Stimulus residual',J:'Feedback residual'}:{F:'主要编码结构',G:'排名编码结构',H:'选择残差',I:'刺激残差',J:'反馈残差'};
  const maps=keys=>keys.split('').map(k=>`<button class="brief-map" data-brief-panel="${k}" aria-label="${EN?'Open original panel':'查看原始图表'} ${k}"><span>${k} / ${titles[k]}</span><img src="${runtime.maps[k].toDataURL()}" alt="${titles[k]}" width="172" height="198"><small>${EN?'Inspect original':'查看原图'} ↗</small></button>`).join('');
  const axis=pct(D.pc1),movement=pct(D.r2.choice);
  document.body.insertAdjacentHTML('beforeend',`<dialog id="research-brief" aria-labelledby="brief-title" data-no-translate>
   <div class="dialog-head"><strong>${EN?'Research brief':'研究结论摘要'}</strong><button class="close-btn" data-close aria-label="${EN?'Close':'关闭'}">×</button></div>
   <article class="brief-body"><div class="eyebrow">AGENTS-A1.5 × SEEKBRAIN</div>
    <p class="brief-question">${EN?'How does the mouse brain organize different task information?':'小鼠大脑，如何组织不同任务信息？'}</p>
    <h2 id="brief-title">${EN?'A shared regional coding structure, associated with movement.':'<span>不同任务信息，</span><br><span>呈现与运动相关的</span><wbr><span>共享编码结构。</span>'}</h2>
    <p class="brief-answer">${EN?'Across 201 mouse brain regions, measures of stimulus, choice, feedback and wheel movement covary. After adjustment for movement, the three task measures retain distinct regional residual distributions.':'在 201 个小鼠脑区中，刺激、选择、反馈与转轮运动指标协同变化。考虑运动因素后，三类任务指标仍呈现不同的区域残差分布。'}</p>
    <div class="brief-evidence"><div><b>${axis}%</b><span>${EN?'of total variance captured by the main axis':'一条主轴概括的指标总方差'}</span></div><div><b>${movement}%</b><span>${EN?'choice-measure variance explained by movement':'运动模型解释的选择指标差异'}</span></div><div><b>H / I / J</b><span>${EN?'three residual maps, localized in anatomy':'三类残差分布，定位到解剖脑区'}</span></div></div>
    <div class="brief-map-groups"><section><h3>${EN?'01 / Locate the coding structure':'01 / 编码结构，分布在哪里'}</h3><div class="brief-map-grid">${maps('FG')}</div><p>${EN?'F uses value-based PC1; G uses rank-based PC1 across the same five decoder measures. Original V3 colors: F purple; G green–blue. Shared PC1 scale −4 to +8.':'F 使用数值 PC1；G 使用相同五类解码指标的排名 PC1。V3 原图配色：F 为紫色，G 为绿蓝色；两图统一色阶 −4 至 +8。'}</p></section><section><h3>${EN?'02 / Locate what remains after movement adjustment':'02 / 考虑运动后，哪些区域仍有差异'}</h3><div class="brief-map-grid residual-maps">${maps('HIJ')}</div><p>${EN?'Residual = observed standardized measure − movement-model prediction. Original V3 colors: blue for negative, red for positive, white for zero. Shared scale −3 to +3, saturated beyond the limits.':'残差 = 标准化观测指标 − 运动模型预测。V3 原图配色：蓝色为负，红色为正，白色为零；统一色阶 −3 至 +3，超出范围饱和显示。'}</p></section></div>
    <div class="brief-next"><span>${EN?'THE NEXT SCIENTIFIC QUESTION':'下一步科学问题'}</span><h3>${EN?'Which regional differences should experiments test next?':'哪些脑区的差异，值得进一步实验检验？'}</h3><p>${EN?'The value is a localized, testable lead for further research. These regional associations do not establish causality or prove movement-independent coding.':'这项研究把统计关联转化为可以定位、继续检验的线索；区域关联尚不构成因果机制，也不证明残差就是独立于运动的编码。'}</p></div>
    <p class="brief-source">${EN?'Showcase summary prepared from this run’s saved results. Maps use V3 saved regional values and original figure colors on Panel F geometry; gray indicates unavailable values. Click a map to inspect its original figure.':'本摘要由展示端依据本次运行结果整理。图谱使用 V3 已保存数值、原图脑区颜色与 Panel F 解剖轮廓，灰色表示无有效数值；点击可核对原始图表。'}</p>
   </article></dialog>`);
  dialog=$('#research-brief');
 }
 dialog.showModal();
}

function pageInit(){
 $('[data-hero-result]').textContent=resultText("共享结构：一条主轴解释五类指标总方差的 {pc1}%。",{pc1:pct(D.pc1)});
 $('[data-hero-movement]').textContent=resultText("运动关联：转轮运动模型可解释选择编码指标在脑区间 {choice}% 的差异。",{choice:pct(D.r2.choice)});
 $$('[data-discovery-stat]').forEach(el=>el.textContent=pct(el.dataset.discoveryStat==='choice'?D.r2.choice:D.pc1)+'%');
 $('[data-input-scope]').innerHTML=[['labs','个实验室'],['subjects','只小鼠'],['probes','组探针']].map(([key,label])=>`<span><b>${WORKSPACE.counts[key]}</b> ${T(label)}</span>`).join('');
 renderInputTree();showInputSelection(WORKSPACE.files.find(f=>f.id==='regions'));
 $('[data-input-search]').addEventListener('input',renderInputTree);$('[data-input-type]').addEventListener('change',renderInputTree);
 document.body.insertAdjacentHTML('beforeend',`<dialog id="workspace-dialog"><div class="dialog-head"><strong>${T('输入数据 · 文件预览')}</strong><button class="close-btn" data-close aria-label="${T('关闭')}">×</button></div><div class="workspace-modal-layout"><nav class="workspace-modal-nav" aria-label="${T('输入文件')}"></nav><div class="workspace-preview"></div></div></dialog>`);
 document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.matches('[data-research-brief]'))openResearchBrief();
  if(button.matches('[data-brief-panel]')){$('#research-brief').close();drawGallery($('#gallery-dialog .gallery-widget'),button.dataset.briefPanel);$('#gallery-dialog').showModal();}
  if(button.matches('[data-evidence]'))selectEvidence(button.dataset.evidence);
  if(button.matches('[data-workspace-file]'))openWorkspace(button.dataset.workspaceFile);
  if(button.matches('[data-workspace-save]')){const f=WORKSPACE.files.find(f=>f.id===button.dataset.workspaceSave);download(f.name,f.download)}
  if(button.matches('[data-workspace-download]'))download('mouse-brain-provided-inputs.zip',WORKSPACE.archive);
  if(button.matches('[data-hero-locate]')){selectEvidence('atlas');const w=$('.atlas-widget');inspectRegion(w,button.dataset.heroLocate);$('#brain').scrollIntoView();}
  if(button.matches('[data-locate-region]'))selectEvidence('atlas');
 });
 $('.evidence-tabs').addEventListener('keydown',e=>{if(!e.target.matches('[role="tab"]'))return;const tabs=$$('[role="tab"]',$('.evidence-tabs')),index=tabs.indexOf(e.target);let next=index;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();selectEvidence(tabs[next].dataset.evidence,true)});
 $('#workspace-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close()}});
 initHeroAtlas();initInlineFilm();
}
