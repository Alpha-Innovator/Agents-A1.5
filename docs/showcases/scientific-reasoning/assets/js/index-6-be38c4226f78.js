
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const ICONS={
search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',visit:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 8h18m-9 10 6-6m-6 0h6v6"/>',scholar:'<path d="m1 8 11-5 11 5-11 5L1 8Zm5 3v7c4 3 8 3 12 0v-7m5-3v11"/>',code:'<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20"/>',play:'<path d="m8 5 12 7-12 7Z" fill="currentColor" stroke="none"/>',pause:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',restart:'<path d="M4 11a8 8 0 1 1 1 6M4 4v7h7"/>',loop:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',close:'<path d="m5 5 14 14M5 19 19 5"/>',download:'<path d="M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',atom:'<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',flask:'<path d="M9 2h6m-5 0v8L4 20q0 2 2 2h12q2 0 2-2l-6-10V2M7 15h10"/><circle cx="11" cy="18" r=".5"/>'};
function icon(key){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+((key==='dna'?'<path d="M6 2c12 7 0 13 12 20M18 2C6 9 18 15 6 22M8 5h8M9 10h6M9 14h6M8 19h8"/>':ICONS[key])||ICONS.code)+'</svg>';}
$$('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let savedLang;try{savedLang=localStorage.getItem('agents-science-language');}catch(e){}
const state={lang:savedLang==='en'?'en':'zh',case:'physics',mode:'animation',t:3.6,playing:false,speed:1,loop:true,effects:!reduced,tool:'search',physics:{phase:-.7,theta:.2,fixed:false,limit:null},chemCorrect:false,biology:{offset:624,changed:false}};
const cfg=window.FilmConfig,engines={physics:window.PhysicsShowcase,chemistry:window.ChemistryShowcase,biology:window.BiologyShowcase};
const media=JSON.parse($('#embeddedMedia').textContent||'{}'),video=$('#filmVideo'),scene=$('#svgScene'),cinema=$('#cinemaDialog'),sourceDialog=$('#sourceDialog');
const URLs=new Map();let videoKey='',videoToken=0,videoLoading=false,pendingVideoTime=0,lastNode=-99,lastT=performance.now(),lastDraw=0,visibleFilm=true,heroVisible=true,toastTimer;
function tr(k){return SiteCopy[state.lang][k]??SiteCopy.en[k]??k;}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2300);}
function c(){return cfg[state.case].cases[state.case];}
function stage(){return c().stages[engines[state.case].stageAt(state.t,c())];}
function svg(t=state.t){return engines[state.case].renderSVG(t,state.case,cfg[state.case],state.lang,{effects:state.effects});}
function time(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
function drawFilm(force=false){
 if(state.mode==='animation'||force){scene.innerHTML=svg();scene.setAttribute('aria-label',tr(state.case+'Ability'));}
 $('#scrubber').value=state.t;$('#timeCurrent').textContent=time(state.t);$('#timeTotal').textContent=time(c().duration);
 $('#playPause').innerHTML=icon(state.playing?'pause':'play');$('#playPause').setAttribute('aria-label',tr(state.playing?'pause':'play'));
 const s=stage(),node=s.node;
 if(node!==lastNode||force){lastNode=node;$$('#chapters button').forEach((e,i)=>{e.classList.toggle('active',i===node);e.setAttribute('aria-pressed',String(i===node));});$('#chapterCaption').textContent=node<0?tr(state.case+'Story'):tr(({physics:'phyCaptions',chemistry:'chemCaptions',biology:'bioCaptions'})[state.case])[node];}
}
function applyText(){
 document.documentElement.lang=state.lang==='zh'?'zh-CN':'en';
 $$('[data-i18n]').forEach(e=>{const v=tr(e.dataset.i18n);if(typeof v==='string')e.innerHTML=v;});
 $$('[data-aria]').forEach(e=>{e.setAttribute('aria-label',tr(e.dataset.aria));e.title=tr(e.dataset.aria);});
 $$('[data-lang]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.lang===state.lang)));
 $('#caseId').textContent=({physics:'CritPt #19',chemistry:'FrontierScience Research #21 / IChO 1983',biology:'HLE / Insect gene identification'})[state.case];
 $('#caseQuestion').textContent=tr(state.case+'Question');$('#caseStory').textContent=tr(state.case+'Story');$('#caseDuration').textContent=c().duration;
 $('#cinemaTitle').textContent=tr(state.case+'Ability');$('#methodCopy').textContent=tr(state.case+'Method');
 const nodes=tr(({physics:'phyNodes',chemistry:'chemNodes',biology:'bioNodes'})[state.case]);const times=nodes.map((_,i)=>c().stages.find(s=>s.node===i).start);
 $('#chapters').innerHTML=nodes.map((s,i)=>'<button data-seek="'+times[i]+'" aria-pressed="false"><span>0'+(i+1)+'</span>'+s+'</button>').join('');
 $$('[data-seek]').forEach(b=>b.addEventListener('click',()=>{seek(+b.dataset.seek);setPlaying(true);}));
 $('#effects').setAttribute('aria-label',tr(state.effects?'effectsOn':'effectsOff'));$('#effects').title=tr(state.effects?'effectsOn':'effectsOff');
 renderLabs();renderTool();drawFilm(true);
}
function setLang(lang){if(!['zh','en'].includes(lang)||lang===state.lang)return;state.lang=lang;try{localStorage.setItem('agents-science-language',lang);}catch(e){}applyText();if(state.mode==='video')loadVideo();}
function getURL(){const k=state.case+'-'+state.lang;if(URLs.has(k))return URLs.get(k);if(!media[k])throw Error('Missing embedded media '+k);if(media[k].url)return media[k].url;const raw=atob(media[k]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const u=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));URLs.set(k,u);return u;}
function finishVideoLoad(tok){
 if(tok!==videoToken||state.mode!=='video'||video.readyState<2||video.seeking)return;
 videoLoading=false;video.hidden=false;scene.hidden=true;video.playbackRate=state.speed;
 if(state.playing)video.play().catch(()=>{});
}
function loadVideo(){
 const key=state.case+'-'+state.lang;
 if(key===videoKey&&videoLoading){pendingVideoTime=state.t;return;}
 if(key===videoKey&&video.readyState>=1){
  if(Math.abs(video.currentTime-state.t)>.09)video.currentTime=clamp(state.t,0,c().duration-.05);
  video.playbackRate=state.speed;if(state.playing)video.play().catch(()=>{});return;
 }
 const tok=++videoToken;videoKey=key;videoLoading=true;pendingVideoTime=state.t;
 scene.hidden=false;video.hidden=true;drawFilm(true);
 video.onloadedmetadata=()=>{if(tok!==videoToken)return;video.currentTime=clamp(pendingVideoTime,0,c().duration-.05);video.playbackRate=state.speed;finishVideoLoad(tok);};
 video.onloadeddata=()=>finishVideoLoad(tok);
 video.onseeked=()=>finishVideoLoad(tok);
 try{video.src=getURL();video.muted=true;video.loop=false;video.load();}catch(e){fallbackVideo();}
}
function fallbackVideo(){videoLoading=false;state.mode='animation';video.pause();video.hidden=true;scene.hidden=false;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='animation')));drawFilm(true);notify(state.lang==='zh'?'\u89c6\u9891\u89e3\u7801\u4e0d\u53ef\u7528\uff0c\u5df2\u5207\u6362\u4e3a\u4ea4\u4e92\u52a8\u753b\u3002':'Video decoding unavailable. Showing the interactive animation.');}
video.addEventListener('error',()=>{if(state.mode==='video')fallbackVideo();});
function setMode(mode){
 if(!['animation','video'].includes(mode))return;
 if(mode===state.mode){if(mode==='video')loadVideo();drawFilm(true);return;}
 if(state.mode==='video'&&!videoLoading&&Number.isFinite(video.currentTime)&&video.readyState>=2)state.t=video.currentTime;
 video.pause();state.mode=mode;video.hidden=mode!=='video';scene.hidden=mode==='video';
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 if(mode==='video')loadVideo();else {video.hidden=true;scene.hidden=false;}
 drawFilm(true);
}
function setPlaying(v){if(v&&state.t>=c().duration-.1)seek(0);state.playing=v;lastT=performance.now();if(state.mode==='video'){if(v){loadVideo();video.play().catch(()=>{});}else video.pause();}drawFilm();}
function seek(t){state.t=clamp(t,0,c().duration-.001);if(state.mode==='video'){pendingVideoTime=state.t;if(video.readyState>=1)video.currentTime=state.t;}drawFilm(true);}
function setCase(kind){if(!cfg[kind])return;if(kind===state.case)return;video.pause();state.case=kind;state.t=3.6;state.playing=false;lastNode=-99;$('#scrubber').max=c().duration;$$('[data-case]').forEach(e=>{const a=e.dataset.case===kind;e.classList.toggle('selected',a);e.setAttribute('aria-selected',String(a));});$('#physicsLab').hidden=kind!=='physics';$('#chemistryLab').hidden=kind!=='chemistry';$('#biologyLab').hidden=kind!=='biology';applyText();if(state.mode==='video')loadVideo();}
function openCinema(){if(!cinema.open){$('#cinemaMount').appendChild($('#theater'));cinema.showModal();document.body.style.overflow='hidden';}setMode('video');setPlaying(true);}
function closeCinema(){cinema.close();$('#theaterHome').appendChild($('#theater'));document.body.style.overflow='';setPlaying(false);}
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
$$('[data-case]').forEach(b=>b.addEventListener('click',()=>setCase(b.dataset.case)));
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$$('[data-cinema]').forEach(b=>b.addEventListener('click',()=>{if(cinema.open)closeCinema();else openCinema();}));
$('#closeCinema').addEventListener('click',closeCinema);cinema.addEventListener('cancel',e=>{e.preventDefault();closeCinema();});cinema.addEventListener('click',e=>{if(e.target===cinema){let r=cinema.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCinema();}});
$('#openSources').addEventListener('click',()=>sourceDialog.showModal());$('#closeSources').addEventListener('click',()=>sourceDialog.close());sourceDialog.addEventListener('click',e=>{if(e.target===sourceDialog){let r=sourceDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)sourceDialog.close();}});
$('#playPause').addEventListener('click',()=>setPlaying(!state.playing));$('#restart').addEventListener('click',()=>{seek(0);setPlaying(true);});$('#scrubber').addEventListener('input',e=>seek(+e.target.value));$('#speed').addEventListener('change',e=>{state.speed=+e.target.value;video.playbackRate=state.speed;});$('#loopToggle').addEventListener('click',()=>{state.loop=!state.loop;$('#loopToggle').setAttribute('aria-pressed',String(state.loop));});
video.addEventListener('ended',()=>{if(state.loop){seek(0);setPlaying(true);}else{state.playing=false;drawFilm();}});
$$('[data-jump]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const [k,t]=b.dataset.jump.split(':');setCase(k);seek(+t);setPlaying(true);$('#showcase').scrollIntoView({behavior:state.effects?'smooth':'auto'});}));
$('#saveFrame').addEventListener('click',()=>{const blob=new Blob([svg()],{type:'image/svg+xml;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='Agents-A1.5-'+state.case+'-'+state.lang+'-'+state.t.toFixed(1)+'s.svg';a.click();setTimeout(()=>URL.revokeObjectURL(u),15000);});
$('#effects').addEventListener('click',()=>{state.effects=!state.effects;document.body.classList.toggle('motion-off',!state.effects);$('#effects').setAttribute('aria-pressed',String(state.effects));$('#effects').title=tr(state.effects?'effectsOn':'effectsOff');$('#effects').setAttribute('aria-label',tr(state.effects?'effectsOn':'effectsOff'));drawField(performance.now()/1000);drawFilm(true);});
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)||sourceDialog.open)return;const near=cinema.open||($('#theater').getBoundingClientRect().top<innerHeight&&$('#theater').getBoundingClientRect().bottom>0);if(!near)return;if(e.code==='Space'){e.preventDefault();setPlaying(!state.playing);}else if(e.code==='ArrowRight'){e.preventDefault();seek(state.t+5);}else if(e.code==='ArrowLeft'){e.preventDefault();seek(state.t-5);}});
scene.addEventListener('click',e=>{const hit=e.target.closest('[data-film-tool]');if(!hit)return;state.tool=hit.dataset.filmTool;renderTool();setPlaying(false);document.querySelector('#tools').scrollIntoView({behavior:state.effects?'smooth':'auto'});});
scene.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const hit=e.target.closest('[data-film-tool]');if(hit){e.preventDefault();hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));}}});
/* Pure local calculations, not recorded agent calls. */
function formatResidual(v){return v<1e-5?v.toExponential(2):v.toFixed(5);}
function renderLabs(){
 const s=state.physics,p=Science.parameters(s.phase,s.theta,s.limit),r=Science.noise(p),can=s.fixed?r.fixed:r.old,err=Math.abs(can-r.direct);
 $('#phaseSlider').value=s.phase;$('#thetaSlider').value=s.theta;$('#phaseOut').textContent=s.phase.toFixed(2)+' rad';$('#thetaOut').textContent=s.theta.toFixed(2)+' rad';
 $$('[data-formula]').forEach(e=>e.setAttribute('aria-pressed',String((e.dataset.formula==='fixed')===s.fixed)));
 $('#operatorValue').textContent=r.direct.toFixed(5);$('#candidateValue').textContent=can.toFixed(5);$('#residualValue').textContent=formatResidual(err);$('.readout-grid').classList.toggle('fixed',s.fixed);
 $('#physicsStatus').textContent=tr(err<1e-10?'consistent':'inconsistent');$('#physicsStatus').classList.toggle('amber',err>=1e-10);
 $('#phaseFormula').innerHTML='<span>'+tr(s.fixed?'formulaNew':'formulaOld')+'</span><div class="math">'+(s.fixed?'cosh(2r<sub>2</sub>) cos(\u0394\u03c6) cos(\u03c8)<br><span class="fixed-part">+ sin(\u0394\u03c6) sin(\u03c8)</span>':'cosh(2r<sub>2</sub>) cos(2\u03b8 \u2212 \u03c6<sub>1</sub>)')+'</div>';
 drawPlot(p,s.fixed);
 $$('[data-limit]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.limit===s.limit)));
 $('#limitStatus').textContent=s.limit?tr(Science.limitingCheck(s.limit).pass?'pass':'inconsistent')+' \u00b7 \u0394\u03c6 = \u03c0':'';
 const q=Science.chemistry(state.chemCorrect),ok=q.gap<1e-10;
 $$('[data-balance]').forEach(e=>e.setAttribute('aria-pressed',String((e.dataset.balance==='correct')===state.chemCorrect)));
 $('#chemStatus').textContent=tr(ok?'balanceOk':'balanceBad');$('#chemStatus').classList.toggle('amber',!ok);$('.chem-results').classList.toggle('checked',ok);
 $('#agBig').textContent=q.silver.toFixed(4);$('#cuBig').textContent=q.copper.toFixed(4);$('#netBig').textContent=q.net.toFixed(4);
 [['silver',q.silver],['copper',q.copper],['net',q.net]].forEach(([k,v])=>{$('#'+k+'Fill').style.width=(v/2.4*100)+'%';$('#'+k+'BarValue').textContent=v.toFixed(4)+' g';});
 $('#chemGap').textContent=q.gap.toFixed(5)+' g';$('#saltNa').textContent='NaCl '+(ok?q.NaCl.toFixed(3)+' g':'\u2014');$('#saltK').textContent='KCl '+(ok?q.KCl.toFixed(3)+' g':'\u2014');$('#composition').classList.toggle('dim',!ok);renderBiologyLab();
}

function renderBiologyLab(){
 const b=state.biology,D=BiologyData,q=BiologyScience.demoQuery(b.changed),r=BiologyScience.compare(q,D.reference),off=b.offset;
 $('#bioSlider').value=off;$('#bioPositionOut').textContent=(off+1)+' - '+(off+36);
 $$('[data-bio-change]').forEach(e=>e.setAttribute('aria-pressed',String((e.dataset.bioChange==='changed')===b.changed)));
 $('#bioDemoNote').textContent=tr(b.changed?'bioTestNote':'bioOriginalNote');$('#bioDemoNote').classList.toggle('changed',b.changed);
 $('#bioStatus').textContent=tr(r.exact?'bioExact':'bioMismatch');$('#bioStatus').classList.toggle('amber',!r.exact);
 $('#bioMatches').textContent=r.matches.toLocaleString('en-US')+' / 1,296';$('#bioDifferences').textContent=r.mismatches.length;$('#bioCoverage').textContent=(r.referenceCoverage*100).toFixed(2)+'%';
 $('#bioCoverFill').style.width=(r.referenceCoverage*100)+'%';$('#bioWindowMarker').style.left=(off/D.reference.length*100)+'%';$('#bioWindowMarker').style.width=(36/D.reference.length*100)+'%';
 const txt=(s,x,y,size=17,col='#A6A3BB')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+col+'" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif">'+s+'</text>';
 let out=txt(tr('bioQueryLabel'),14,95)+txt(tr('bioReferenceLabel'),14,156);
 for(let j=0;j<36;j++){const i=off+j,x=96+j*16.8,eq=q[i]===D.reference[i],col=eq?'#8EDDCB':'#EDB389';
  if(j%6===0)out+=txt(String(i+1),x,41,14,'#6F718B');
  out+='<rect x="'+(x-3)+'" y="64" width="15" height="109" rx="3" fill="'+(eq?'#1C323033':'#EDB38920')+'"/>';
  out+=txt(q[i],x,95,18,col)+txt(eq?'|':'x',x+3,124,15,col)+txt(D.reference[i],x,156,18,col);
 }
 $('#biologyAlignment').innerHTML=out;$('#biologyAlignment').setAttribute('aria-label',tr('bioInspectTitle')+' '+(off+1)+'-'+(off+36));
}
$('#bioSlider').addEventListener('input',e=>{state.biology.offset=+e.target.value;renderBiologyLab();});
$$('[data-bio-change]').forEach(b=>b.addEventListener('click',()=>{state.biology.changed=b.dataset.bioChange==='changed';if(state.biology.changed)state.biology.offset=624;renderBiologyLab();}));
$$('[data-bio-window]').forEach(b=>b.addEventListener('click',()=>{state.biology.offset=+b.dataset.bioWindow;renderBiologyLab();}));

function drawPlot(p,fixed){
 const w=720,h=340,pad={l:48,r:22,t:23,b:50},N=120,data=[];for(let i=0;i<=N;i++){const phase=-Math.PI+2*Math.PI*i/N,rr=Science.noise({...p,phi2:p.phi1+phase});data.push({x:phase,a:rr.direct,b:fixed?rr.fixed:rr.old});}
 const ymax=Math.ceil(Math.max(...data.flatMap(d=>[d.a,d.b]))*1.12),ymin=Math.min(0,Math.min(...data.flatMap(d=>[d.a,d.b]))),xs=x=>pad.l+(x+Math.PI)/(2*Math.PI)*(w-pad.l-pad.r),ys=y=>h-pad.b-(y-ymin)/(ymax-ymin)*(h-pad.t-pad.b);
 let out='<title>'+tr('noise')+'</title>';
 for(let i=0;i<5;i++){let y=ymin+(ymax-ymin)*i/4;out+='<path d="M'+pad.l+' '+ys(y)+'H'+(w-pad.r)+'" stroke="#ffffff0d"/><text x="'+(pad.l-12)+'" y="'+(ys(y)+5)+'" text-anchor="end" fill="#81778f" font-size="13" font-family="Arial">'+y.toFixed(1)+'</text>';}
 [-Math.PI,0,Math.PI].forEach((x,i)=>out+='<text x="'+xs(x)+'" y="'+(h-26)+'" text-anchor="middle" fill="#81778f" font-size="14" font-family="Arial">'+['\u2212\u03c0','0','\u03c0'][i]+'</text>');
 const path=k=>data.map((d,i)=>(i?'L':'M')+xs(d.x).toFixed(2)+' '+ys(d[k]).toFixed(2)).join('');
 if(!fixed){const area=path('a')+data.slice().reverse().map(d=>'L'+xs(d.x).toFixed(2)+' '+ys(d.b).toFixed(2)).join('')+'Z';out+='<path d="'+area+'" fill="#edb28a12"/>';}
 out+='<path d="'+path('a')+'" stroke="#b9a4fc" stroke-width="2.8" fill="none"/>';
 out+='<path d="'+path('b')+'" stroke="'+(fixed?'#95dfc8':'#edb28a')+'" stroke-width="2.2" stroke-dasharray="7 6" fill="none"/>';
 let rr=Science.noise(p),x=xs(p.phi2-p.phi1);out+='<path d="M'+x+' '+pad.t+'V'+(h-pad.b)+'" stroke="#ddd0f24a" stroke-dasharray="3 5"/>';
 for(let [y,col] of [[rr.direct,'#b9a4fc'],[fixed?rr.fixed:rr.old,fixed?'#95dfc8':'#edb28a']])out+='<circle cx="'+x+'" cy="'+ys(y)+'" r="5" fill="'+col+'" stroke="#0c0e16" stroke-width="2"/>';
 out+='<text x="'+(w/2)+'" y="'+(h-4)+'" text-anchor="middle" fill="#8f809e" font-size="13" font-family="Arial, Microsoft YaHei, Noto Sans CJK SC">'+tr('graphPhase')+'</text>';
 $('#physicsPlot').innerHTML=out;$('.key-orange').style.background=fixed?'var(--mint)':'var(--orange)';
}
$('#phaseSlider').addEventListener('input',e=>{state.physics.phase=+e.target.value;state.physics.limit=null;renderLabs();});$('#thetaSlider').addEventListener('input',e=>{state.physics.theta=+e.target.value;state.physics.limit=null;renderLabs();});
$$('[data-formula]').forEach(b=>b.addEventListener('click',()=>{state.physics.fixed=b.dataset.formula==='fixed';renderLabs();}));
$('#resetPhysics').addEventListener('click',()=>{state.physics={phase:-.7,theta:.2,fixed:false,limit:null};renderLabs();});
$$('[data-limit]').forEach(b=>b.addEventListener('click',()=>{state.physics.limit=b.dataset.limit;state.physics.phase=Math.PI;state.physics.fixed=true;renderLabs();}));
$$('[data-balance]').forEach(b=>b.addEventListener('click',()=>{state.chemCorrect=b.dataset.balance==='correct';renderLabs();}));
/* Tool evidence is editorial context, not another fabricated API run. */
function renderTool(){const pre=({physics:'phy',chemistry:'chem',biology:'bio'})[state.case],k=pre+state.tool[0].toUpperCase()+state.tool.slice(1),content=tr(k);$('#toolRequest').textContent=content[0];$('#toolReturn').textContent=content[1];$('#toolReason').textContent=content[2];$$('.tool-cards [data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===state.tool)));}
$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>{state.tool=b.dataset.tool;renderTool();if(b.classList.contains('orbit-tool'))$('#tools').scrollIntoView({behavior:state.effects?'smooth':'auto'});}));
/* Decorative, procedural scientific field. No data claims are encoded in it. */
const canvas=$('#fieldCanvas'),ctx=canvas.getContext('2d'),points=[];let fieldW=0,fieldH=0,mouse={x:0,y:0};
for(let i=0;i<1800;i++){const u=i/1800*Math.PI*2,v=i*2.3999632297,R=1.2+.19*Math.cos(3*u),tube=.24+.055*Math.sin(5*u);points.push({x:(R+tube*Math.cos(v))*Math.cos(u),y:(R+tube*Math.cos(v))*Math.sin(u),z:tube*Math.sin(v)+.26*Math.sin(3*u),c:i%7===0});}
function resizeField(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);fieldW=r.width;fieldH=r.height;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);drawField(0);}
$('#heroVisual').addEventListener('pointermove',e=>{const r=e.currentTarget.getBoundingClientRect();mouse={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5};});$('#heroVisual').addEventListener('pointerleave',()=>mouse={x:0,y:0});
function drawField(t){if(!ctx||!fieldW)return;ctx.clearRect(0,0,fieldW,fieldH);const tm=state.effects?t:0,ay=.28+tm*.055+mouse.x*.18,ax=.75+mouse.y*.15,az=-.3;const cy=Math.cos(ay),sy=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax),cz=Math.cos(az),sz=Math.sin(az),scale=Math.min(fieldW,fieldH)*.244,cpx=fieldW/2,cpy=fieldH*.5;let projected=[];
 for(const p of points){let x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cx-z*sx;z=p.y*sx+z*cx;let xx=x*cz-y*sz,yy=x*sz+y*cz,k=4/(4+z);projected.push({x:cpx+xx*scale*k,y:cpy+yy*scale*k,z,k,c:p.c});}
 projected.sort((a,b)=>b.z-a.z);for(const p of projected){const a=clamp((1.5-p.z)/3,.12,.8);ctx.fillStyle=p.c?'rgba(149,223,200,'+a*.7+')':'rgba(184,157,245,'+a+')';ctx.beginPath();ctx.arc(p.x,p.y,(.45+.55*p.k)*(p.z<0?1.15:.85),0,Math.PI*2);ctx.fill();}
 for(let j=0;j<3;j++){ctx.beginPath();for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,rx=fieldW*(.37+j*.025),ry=fieldH*(.28-j*.025),x=cpx+rx*Math.cos(a),y=cpy+ry*Math.sin(a)*Math.cos(.3+j*.7)+.25*rx*Math.cos(a)*Math.sin(.3+j*.7);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle='rgba(185,164,252,'+(.045+j*.016)+')';ctx.lineWidth=1;ctx.stroke();const a=tm*(.17+j*.07)+j*2,rx=fieldW*(.37+j*.025),ry=fieldH*(.28-j*.025),x=cpx+rx*Math.cos(a),y=cpy+ry*Math.sin(a)*Math.cos(.3+j*.7)+.25*rx*Math.cos(a)*Math.sin(.3+j*.7);ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fillStyle=j===1?'#95dfc8':'#c7b7f4';ctx.shadowBlur=12;ctx.shadowColor='#b9a4fc';ctx.fill();ctx.shadowBlur=0;}
}
new ResizeObserver(resizeField).observe(canvas);
if('IntersectionObserver' in window){document.body.classList.add('has-observer');const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.15});$$('.reveal').forEach(e=>observer.observe(e));new IntersectionObserver(es=>{visibleFilm=es[0].isIntersecting;},{threshold:.01}).observe($('#theaterHome'));new IntersectionObserver(es=>heroVisible=es[0].isIntersecting,{threshold:.01}).observe($('#heroVisual'));}
function tick(now){const dt=Math.min(.12,(now-lastT)/1000);lastT=now;
 if(state.playing&&!document.hidden&&(visibleFilm||cinema.open)){
  if(state.mode==='animation'){state.t+=dt*state.speed;if(state.t>=c().duration){if(state.loop)state.t%=c().duration;else{state.t=c().duration-.001;state.playing=false;}}}
  else if(!videoLoading&&!video.paused&&!video.seeking&&video.readyState>=2&&Number.isFinite(video.currentTime))state.t=video.currentTime;
 }
 if(now-lastDraw>45){if(state.playing&&(visibleFilm||cinema.open))drawFilm();if(state.effects&&heroVisible&&!document.hidden)drawField(now/1000);lastDraw=now;}
 requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',()=>{lastT=performance.now();if(document.hidden)video.pause();else if(state.playing&&state.mode==='video'&&(visibleFilm||cinema.open))video.play().catch(()=>{});});
document.body.classList.toggle('motion-off',!state.effects);$('#effects').setAttribute('aria-pressed',String(state.effects));applyText();resizeField();requestAnimationFrame(tick);
/* Public local hooks support reproducible layout tests and downstream edits. */
window.AgentsScience={state,setCase,setLang,setMode,seek,setPlaying,openCinema,closeCinema,renderLabs,renderSVG:svg,getSourceConfig:()=>cfg};
})();

