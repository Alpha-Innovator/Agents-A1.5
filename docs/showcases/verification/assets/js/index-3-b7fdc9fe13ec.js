
/* 页面驱动: 语言切换、演示播放、反思内容、两次作答对比、开关。无外部依赖。 */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const V=window.VerifyFilm;
const DATA=JSON.parse($('#verifyData').textContent);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ================= 文案 ================= */
const COPY={
 zh:{
  navDemo:'能力演示', navReflection:'模型会反思什么', navTrace:'效果对比', navSwitch:'如何开启', navResult:'评测结果', navNext:'未来工作',
  navPlay:'观看演示',
  heroTitle:'AI 解决长程问题时，<br>能不能自我感知到解决陷入僵局，<br><em>并寻找新的解题方法。</em>',
  heroDesc:'搜索智能体最常见的失败，不是不会查，而是沿着一条走不通的路反复重试。',
  heroWatch:'观看演示', heroRead:'查看具体 verification 内容',

  eye1:'01 / 能力演示',
  h1t:'一道题，<br>从反复空转到找到答案。',
  tbBadge:'能力演示',

  eye2:'02 / 模型会反思什么',
  h2t:'停下来的那一刻，<br>模型在反思什么。',
  p2:'这是它在第 19 次交互时写下的完整思考。它回顾了已经确认的事实，承认之前的判断站不住，列出仍然缺失的关键信息，并决定换一种查法。',
  dimHead:'它检查了这五件事',
  dimNote:'',
  reflHead:'第 19 次交互 · 模型的完整思考',
  reflZh:'中文译文', reflEn:'英文原文',
  reflNote:'中文为译文，模型原文为英文。',

  eye3:'03 / 效果对比',
  h3t:'同一道题，<br>两次作答。',
  p3:'逐条列出模型实际发出的检索请求。左边中途换了方法，右边没有——检索了 47 次，仍然没有答对。',
  traceOnTitle:'中途换了方法', traceOnMeta:'30 次交互 · 29 次检索',
  traceOffTitle:'始终沿用同一思路', traceOffMeta:'48 次交互 · 47 次检索',
  finalAnswer:'最终答案',
  traceOnNote:'与标准答案 Madhumalti 一致（仅拼写差异）',
  traceOffNote:'与标准答案不符',

  eye4:'04 / 如何开启',
  h4t:'一行配置，<br>使用简单。',
  p4:'这项能力不需要额外的工具或接口。在 system prompt 中加上一行即可开启。',
  swDesc:'关闭时是常规的检索流程；开启后，模型在多次尝试没有进展时会主动停下来重新梳理，寻找新的解题方法。',
  swOff:'关闭', swOn:'开启',
  swFlowHead:'开启后多出来的两步',
  flowOn:[['01','检索 → 读取网页 → 再检索',''],['02','多次尝试仍然没有进展',''],
          ['03','停下来，把已确认的、已失败的梳理一遍','accent'],
          ['04','换一种方法继续','accent'],['05','逐步推进到答案','good']],
  flowOff:[['01','检索 → 读取网页 → 再检索',''],['02','多次尝试仍然没有进展',''],
           ['03','沿着同一条思路继续检索',''],['04','在某些问题上始终走不出来','dead']],
  noteOn:'多出来的是第 03、04 两步。它们发生在模型的推理过程中，不额外消耗一次检索。',
  noteOff:'常规检索流程。缺少重新梳理这一步，走不通的方法会被反复重试。',
  pillOn:'Verification protocol: enabled', pillOff:'Verification protocol: 未配置',

  eye5:'05 / 评测结果',
  h5t:'在 BrowseComp 上<br>的表现。',
  p5:'BrowseComp 全集 1266 道题目，同一套评测流程下的对比。',
  resBefore:'具备该能力前', resAfter:'具备该能力后', resSet:'BrowseComp 全集 1266 题',
  resDelta:'+10.4 个百分点',

  eye6:'06 / 未来工作',
  h6t:'反思之后，<br>把这一段收成一条记录。',
  p6:'长程任务走得越久，前文越长。下一步：模型在反思之后，自己判断刚走过的这一段能不能安全地收成一条阶段记录，用记录替换掉这段原文。',
  nextTag:'研发中',
  nextTitle:'反思之后，自主决定是否把这一段收成记录',
  nextDesc:'反思负责判断结论是否可靠、下一步往哪走；紧接着模型再判断一件事：从上一次反思到这次反思之间的这一段，能不能安全地收起来。可以，就写一条阶段记录——做过什么、得到了什么、哪些假设已被排除、现在是什么状态——然后用「记录 + 反思」替换掉这一段原文，接着往下做。不可以就原样保留。',
  nextPoints:[
    ['开头几轮永远保留','任务本身和最初几轮探索属于受保护前缀，任何记录都不会删改它们。'],
    ['只对两次反思之间的内容进行压缩','可替换的范围只有上一次反思到这次反思之间的那一段，更早的内容不回头重压。']],
  nextSoon:'敬请期待',

  endTitle:'走不通的时候，<br><em>先停下来反思沉淀，再尝试换一条路。</em>',
  endDesc:'自我反思发生在模型的推理过程中，通过 system prompt 的一行配置开启。',
  endWatch:'再看一次', endTop:'回到顶部',
  footer:'Agents-A1.5 · Verification',

  dims:{known:['已经确认了什么','只算检索结果里真正验证到的事实'],
        reflect:['之前的判断哪里站不住','反复搜同一件事、过早下结论'],
        gaps:['还缺哪些关键事实','具体缺什么，而不是泛泛地说还不够'],
        deadend:['哪些方法已经失败','试过且无效的检索词与站点'],
        action:['下一步查什么','下一步补哪个缺口、用哪类来源']},
  pivotTitle:'第 19 次交互 · 停下来重新梳理',
  pivotBody:'把反复无用的聚合站判为死路，改用权威来源反查角色',
  reflNone:'承接下一步'
 },
 en:{
  navDemo:'Demo', navReflection:'What it reflects on', navTrace:'Side by side', navSwitch:'Turning it on', navResult:'Results', navNext:'What is next',
  navPlay:'Watch the demo',
  heroTitle:'On long-horizon problems,<br>can a model notice it is stuck<br><em>and find another way through?</em>',
  heroDesc:'The most common failure of a search agent is not that it cannot search — it is that it keeps retrying a route that leads nowhere.',
  heroWatch:'Watch the demo', heroRead:'See the actual verification',

  eye1:'01 / DEMO',
  h1t:'One question,<br>from spinning to solved.',
  tbBadge:'Demo',

  eye2:'02 / WHAT IT REFLECTS ON',
  h2t:'The moment it stops,<br>this is what it writes.',
  p2:'The full reasoning from interaction 19. It takes stock of what is actually confirmed, admits its earlier guesses do not hold, lists what is still missing, and decides to search a different way.',
  dimHead:'Five things it checks',
  dimNote:'All five have to appear together for this to count as real self-reflection — not just the phrase “let me double-check”.',
  reflHead:'Interaction 19 · full reasoning',
  reflZh:'Chinese',  reflEn:'Original',
  reflNote:'The model wrote this in English; the Chinese is a translation.',

  eye3:'03 / SIDE BY SIDE',
  h3t:'The same question,<br>answered twice.',
  p3:'Every search request the model actually issued. The left run changes approach partway through; the right one never does — 47 searches, still wrong.',
  traceOnTitle:'Changed approach partway', traceOnMeta:'30 interactions · 29 searches',
  traceOffTitle:'Same line throughout', traceOffMeta:'48 interactions · 47 searches',
  finalAnswer:'Final answer',
  traceOnNote:'Matches the reference answer Madhumalti (spelling variant)',
  traceOffNote:'Does not match the reference answer',

  eye4:'04 / TURNING IT ON',
  h4t:'One line of config,<br>on or off.',
  p4:'The capability needs no extra tool or endpoint. One line in the system prompt turns it on.',
  swDesc:'Off, it is an ordinary search loop. On, the model stops by itself once several attempts have produced no progress, and looks for another way through.',
  swOff:'Off', swOn:'On',
  swFlowHead:'The two steps it adds',
  flowOn:[['01','Search → read page → search again',''],['02','Several attempts, no progress',''],
          ['03','Stop and take stock of what holds and what failed','accent'],
          ['04','Change approach and continue','accent'],['05','Work through to the answer','good']],
  flowOff:[['01','Search → read page → search again',''],['02','Several attempts, no progress',''],
           ['03','Keep searching along the same line',''],['04','On some questions, never gets out','dead']],
  noteOn:'Steps 03 and 04 are what it adds. Both happen inside the model’s reasoning — they cost no extra search.',
  noteOff:'An ordinary search loop. Without the taking-stock step, routes that lead nowhere get retried.',
  pillOn:'Verification protocol: enabled', pillOff:'Verification protocol: not set',

  eye5:'05 / RESULTS',
  h5t:'Performance on<br>BrowseComp.',
  p5:'All 1,266 questions of BrowseComp, same evaluation pipeline.',
  resBefore:'Without the capability', resAfter:'With the capability', resSet:'BrowseComp · 1,266 questions',
  resDelta:'+10.4 points',

  eye6:'06 / WHAT IS NEXT',
  h6t:'After reflecting,<br>fold the stretch into one record.',
  p6:'The longer a task runs, the longer the history gets. Next: after reflecting, the model decides for itself whether the stretch it just walked can safely be folded into a stage record that replaces it.',
  nextTag:'In development',
  nextTitle:'After reflecting, deciding whether to fold the stretch into a record',
  nextDesc:'Reflection judges whether the conclusions hold and where to go next. Immediately after, the model judges one more thing: whether the stretch from the previous reflection up to this one can be safely folded up. If it can, it writes a stage record — what was done, what came of it, which assumptions were ruled out, what state things are in — and that record plus the reflection replace the original stretch. If it cannot, the stretch stays as it is.',
  nextPoints:[
    ['The opening rounds always stay','The task itself and the first few rounds are a protected prefix; no record ever edits or drops them.'],
    ['Only what lies between two reflections','What can be replaced is only the stretch from the previous reflection to this one. Earlier history is never re-compressed.']],
  nextSoon:'Coming soon',

  endTitle:'When the road runs out,<br><em>stop and take stock, then try another one.</em>',
  endDesc:'The self-reflection happens inside the model’s reasoning and costs no extra search. One line in the system prompt turns it on or off.',
  endWatch:'Watch again', endTop:'Back to top',
  footer:'Agents-A1.5 · Verification',

  dims:{known:['What is actually confirmed','Only facts genuinely verified in the results'],
        reflect:['Where the earlier reasoning fails','Searching the same thing again, concluding too early'],
        gaps:['What key facts are still missing','Specifically what, not just “not enough yet”'],
        deadend:['What has already failed','Queries and sites tried without result'],
        action:['What to search next','Which gap to close, and from what kind of source']},
  pivotTitle:'Interaction 19 · stops and takes stock',
  pivotBody:'Writes off the aggregator sites as dead ends, switches to authoritative sources for the role',
  reflNone:'Leads into the next step'
 }};
const DIM_ORDER=['known','reflect','gaps','deadend','action'];
let lang='en';                      /* 默认中文, 右上角可切换 */
const C=()=>COPY[lang];

/* ================= 演示播放 ================= */
const scene=$('#svgScene'), scrub=$('#scrubber'), playBtn=$('#playPause');
const ICON_PLAY='<svg viewBox="0 0 24 24"><path d="m8 5 12 7-12 7Z" fill="currentColor" stroke="none"/></svg>';
const ICON_PAUSE='<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>';
const state={t:0,playing:false,speed:1,last:0,stage:-1};
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
scrub.max=V.DURATION.toFixed(2);
$('#timeTotal').textContent=fmt(V.DURATION);

function draw(force){
  scene.innerHTML=V.renderSVG(state.t);
  scrub.value=state.t.toFixed(2);
  $('#timeCurrent').textContent=fmt(state.t);
  const i=V.stageAt(state.t);
  const st=V.STAGES[i];
  const btns=$$('#chapters button');
  if(btns[i])btns[i].style.setProperty('--p',((state.t-st.start)/(st.end-st.start)).toFixed(3));
  if(i!==state.stage||force){
    state.stage=i;
    btns.forEach((b,j)=>{
      b.classList.toggle('active',j===i);
      b.classList.toggle('done',j<i);
      b.setAttribute('aria-selected',String(j===i));
      if(j!==i)b.style.removeProperty('--p');
    });
    scene.setAttribute('aria-label',V.chapters()[i]);
  }
}
function setPlaying(on){
  state.playing=on;
  playBtn.innerHTML=on?ICON_PAUSE:ICON_PLAY;
  if(on){state.last=performance.now();requestAnimationFrame(tick);}
}
function tick(now){
  if(!state.playing)return;
  const dt=Math.min(.12,(now-state.last)/1000);
  state.last=now;
  state.t+=dt*state.speed;
  if(state.t>=V.DURATION)state.t=0;      /* 循环播放 */
  draw();
  if(state.playing)requestAnimationFrame(tick);
}
function seek(t,play){
  state.t=clamp(t,0,V.DURATION-1e-3);
  draw();
  if(play&&!state.playing)setPlaying(true);
}
playBtn.onclick=()=>setPlaying(!state.playing);
$('#restart').onclick=()=>{seek(0);setPlaying(true);};
scrub.oninput=()=>{state.t=+scrub.value;draw();};
scrub.onpointerdown=()=>{if(state.playing)setPlaying(false);};
$('#speed').onchange=e=>{state.speed=+e.target.value;};
$('[data-play-jump]').onclick=()=>{$('#theater').scrollIntoView({block:'center'});seek(0,true);};

/* ================= 反思内容 ================= */
const paras=DATA.reflection.paras;
let reflLang='en';                  /* 引文本身用哪种语言, 与页面语言分开 */
function renderReflection(){
  const zh=reflLang==='zh';
  $('#reflectionBody').innerHTML=paras.map((p,i)=>{
    const d=p.dims[0];
    const tag=d?'<span class="refl-tag">'+C().dims[d][0]+'</span>'
               :'<span class="refl-tag none">'+C().reflNone+'</span>';
    return '<div class="refl-para" data-dim="'+(d||'')+'" data-i="'+i+'">'+
           '<div class="tagcol">'+tag+'</div><p'+(zh?' class="zh"':'')+'>'+
           esc(zh?p.zh:p.text)+'</p></div>';
  }).join('');
  $$('[data-refl]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.refl==='zh')===zh)));
  $('#reflFoot').textContent=zh?C().reflNote:'';
  $('#dimList').innerHTML=DIM_ORDER.map((k,i)=>
    '<li data-dim="'+k+'"><b>'+String(i+1).padStart(2,'0')+'</b><span><strong>'+C().dims[k][0]+
    '</strong><small>'+C().dims[k][1]+'</small></span></li>').join('');
  bindReflection();
}
function highlight(dim){
  $$('.refl-para').forEach(el=>el.classList.toggle('on',!!dim&&el.dataset.dim===dim));
  $$('.dim-list li').forEach(el=>el.classList.toggle('on',el.dataset.dim===dim));
}
function bindReflection(){
  $$('.dim-list li').forEach(li=>{
    li.onmouseenter=()=>highlight(li.dataset.dim);
    li.onclick=()=>{
      highlight(li.dataset.dim);
      const p=$('.refl-para[data-dim="'+li.dataset.dim+'"]');
      if(p)p.scrollIntoView({block:'nearest',behavior:'smooth'});
    };
  });
  $('#dimList').onmouseleave=()=>highlight(null);
  $$('.refl-para').forEach(el=>{el.onmouseenter=()=>{if(el.dataset.dim)highlight(el.dataset.dim);};});
}

/* ================= 两次作答 ================= */
const DEAD=/crossword|maetzler-golf|papyhours|ambrogiobrivio|morelifehtm/i;
const ICON_SEARCH='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>';
const ICON_READ='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 8h18"/></svg>';
function renderCalls(el,side){
  const d=DATA[side], pivot=d.verify[0];
  let html='', done=false;
  d.calls.forEach(c=>{
    if(pivot!==undefined&&c.t===pivot&&!done){
      done=true;
      html+='<li class="pivot"><em>'+C().pivotTitle+'</em><span>'+C().pivotBody+'</span></li>';
    }
    const after=pivot!==undefined&&c.t>pivot, dead=DEAD.test(c.v);
    const cls=[c.k==='read'?'read':'',dead?'dead':(after?'after':'')].filter(Boolean).join(' ');
    html+='<li class="'+cls+'"><b>'+String(c.t).padStart(2,'0')+'</b>'+
          '<i>'+(c.k==='read'?ICON_READ:ICON_SEARCH)+'</i><span>'+esc(c.v)+'</span></li>';
  });
  el.innerHTML=html;
}
function renderTrace(){
  renderCalls($('#callsOn'),'on');
  renderCalls($('#callsOff'),'off');
  /* 停下来那一行是本节重点, 每次重绘后都把它摆到列表中间 */
  const el=$('#callsOn'), li=$('#callsOn .pivot');
  if(li)el.scrollTop=li.offsetTop-el.clientHeight/2+li.offsetHeight/2;
}

/* ================= 开关 ================= */
const PROMPT=['You are a deep research assistant. Your core function is',
              'to conduct thorough, multi-source investigations ...','',
              'Verification Protocol: enabled'];
const lab={on:true};
function renderLab(){
  const on=lab.on;
  $('#promptCard').innerHTML=PROMPT.map((l,j)=>
    !l?'<br>':j===3?'<div class="'+(on?'on-line':'off-line')+'">'+l+'</div>':'<div>'+l+'</div>').join('');
  $('#switchFlow').innerHTML=(on?C().flowOn:C().flowOff).map(([n,t,c])=>
    '<div class="flow-step '+c+'"><b>'+n+'</b><span>'+t+'</span></div>').join('');
  const pill=$('#labStatus');
  pill.textContent=on?C().pillOn:C().pillOff;
  pill.className='status-pill'+(on?'':' amber');
  $('#labNote').textContent=on?C().noteOn:C().noteOff;
  $$('[data-verify]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.verify==='on')===on)));
}
$$('[data-verify]').forEach(b=>b.onclick=()=>{lab.on=b.dataset.verify==='on';renderLab();});
$$('[data-refl]').forEach(b=>b.onclick=()=>{reflLang='en';renderReflection();});

/* ================= 语言切换 ================= */
function setLang(l){
  l='en';
  lang=l;
  reflLang=l;                       /* 切页面语言时引文跟着走, 之后仍可单独切 */
  document.documentElement.lang=(l==='zh'?'zh-CN':'en');
  V.setLang(l);
  $$('[data-i18n]').forEach(el=>{const v=C()[el.dataset.i18n];if(v!==undefined)el.textContent=v;});
  $$('[data-i18n-html]').forEach(el=>{const v=C()[el.dataset.i18nHtml];if(v!==undefined)el.innerHTML=v;});
  $$('.language-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===l)));
  $('#chapters').innerHTML='';
  V.chapters().forEach((name,j)=>{
    const b=document.createElement('button');
    b.type='button'; b.setAttribute('role','tab');
    b.innerHTML='<span>'+String(j+1).padStart(2,'0')+'</span>'+name;
    b.onclick=()=>seek(V.STAGES[j].start+.01,true);
    $('#chapters').appendChild(b);
  });
  renderReflection();
  renderTrace();
  renderLab();
  $('#nextVisual').innerHTML=nextVisual();
  $('#nextPoints').innerHTML=C().nextPoints.map(([t,d],i)=>
    '<li><b>'+String(i+1).padStart(2,'0')+'</b><span><strong>'+t+'</strong><small>'+d+'</small></span></li>').join('');
  draw(true);
}
$$('.language-switch button').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));

/* ---- 未来工作配图: 只有「上一个记录点 → 这次反思」这一段被替换 ---- */
function nextVisual(){
  const W=520,H=320;
  const P={dim:'#64748b',amber:'#a4611d',mint:'#087f83',muted:'#526078',purple:'#7052bc',edge:'#cad7e7'};
  const FF=()=>getComputedStyle(document.body).fontFamily.replace(/"/g,"'");
  const zh=lang==='zh';
  const txt=(t,x,y,col,size,anchor)=>'<text x="'+x+'" y="'+y+'" font-size="'+(size||12)+'" fill="'+col+'"'+
      (anchor?' text-anchor="'+anchor+'"':'')+' font-family="'+FF()+'">'+t+'</text>';
  const bw=13,gap=4,h=34,y1=74,y2=222;
  const PRE=4;                      /* 受保护前缀 */
  const SEG=17;                     /* 这次要收起来的一段 */
  let s='';

  /* 上排: 现在的上下文 */
  s+=txt(zh?'现在':'Today',0,y1-30,P.muted);
  for(let i=0;i<PRE;i++)
    s+='<rect x="'+(i*(bw+gap))+'" y="'+y1+'" width="'+bw+'" height="'+h+'" rx="3" fill="'+P.purple+'" opacity=".55"/>';
  const segX=PRE*(bw+gap)+10;
  for(let i=0;i<SEG;i++)
    s+='<rect x="'+(segX+i*(bw+gap))+'" y="'+y1+'" width="'+bw+'" height="'+h+'" rx="3" fill="'+P.dim+'"/>';
  const px=segX+SEG*(bw+gap);
  s+='<rect x="'+px+'" y="'+y1+'" width="'+bw+'" height="'+h+'" rx="3" fill="'+P.amber+'"/>';
  s+=txt(zh?'受保护前缀':'Protected prefix',0,y1-10,P.purple,11);
  s+=txt(zh?'上一次反思 → 这次反思':'Previous reflection → this one',segX,y1-10,P.muted,11);
  s+=txt(zh?'反思':'Reflection',px+bw,y1-30,P.amber,12,'end');
  /* 只有这一段可被替换 */
  s+='<path d="M'+segX+' '+(y1+h+9)+'H'+(px+bw)+'" stroke="'+P.amber+'" stroke-width="1"/>';
  s+='<path d="M'+segX+' '+(y1+h+5)+'v8M'+(px+bw)+' '+(y1+h+5)+'v8" stroke="'+P.amber+'" stroke-width="1"/>';
  s+=txt(zh?'只有这一段可以被替换':'only this stretch can be replaced',segX,y1+h+30,P.amber,11);
  s+='<path d="M'+(segX+70)+' '+(y1+h+44)+'V'+(y2-26)+'" stroke="'+P.amber+'" stroke-width="1.5" stroke-dasharray="4 4"/>';

  /* 下排: 收起来之后 */
  s+=txt(zh?'收成记录之后':'After folding it up',0,y2-14,P.muted);
  for(let i=0;i<PRE;i++)
    s+='<rect x="'+(i*(bw+gap))+'" y="'+y2+'" width="'+bw+'" height="'+h+'" rx="3" fill="'+P.purple+'" opacity=".55"/>';
  const cx=PRE*(bw+gap)+10;
  s+='<rect x="'+cx+'" y="'+y2+'" width="104" height="'+h+'" rx="4" fill="'+P.mint+'" opacity=".2" stroke="'+P.mint+'" stroke-width="1"/>';
  s+=txt(zh?'阶段记录':'Record',cx+14,y2+22,P.mint,12);
  s+='<rect x="'+(cx+114)+'" y="'+y2+'" width="88" height="'+h+'" rx="4" fill="'+P.amber+'" opacity=".16" stroke="'+P.amber+'" stroke-width="1"/>';
  s+=txt(zh?'反思':'Reflection',cx+128,y2+22,P.amber,12);
  s+=txt(zh?'接着往下做':'and carry on',cx+214,y2+22,P.muted,12);
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img">'+s+'</svg>';
}

/* ================= 页面杂项 ================= */
if('IntersectionObserver' in window){
  document.body.classList.add('has-observer');
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
  }),{rootMargin:'0px 0px -12% 0px'});
  $$('.reveal').forEach(el=>io.observe(el));

  const once=new IntersectionObserver(es=>{
    if(es[0].isIntersecting){setPlaying(true);once.disconnect();}
  },{threshold:.45});
  once.observe($('#theater'));
}else setPlaying(true);

addEventListener('keydown',e=>{
  if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key===' '){e.preventDefault();setPlaying(!state.playing);}
  else if(e.key==='ArrowRight'){e.preventDefault();seek(state.t+2);}
  else if(e.key==='ArrowLeft'){e.preventDefault();seek(state.t-2);}
});

setLang(lang);
window.VerifyShowcase={seek,setPlaying,setLang,state};
})();
