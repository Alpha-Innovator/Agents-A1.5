
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DATA=JSON.parse($('#reportData').textContent);
const FIGS=JSON.parse($('#figData').textContent);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ===== 文案 ===== */
const COPY={
 zh:{
  navFlow:'研究流程',navFig:'图表生成',navReport:'报告样例',navPlay:'观看演示',
  heroEye:'AGENTS-A1.5 · DEEP RESEARCH',
  heroTitle:'从一个研究问题，<em>到一份可溯源的深度报告</em>',
  heroDesc:'Agents-A1.5 将研究问题分解为具依赖关系的任务图，分层并行执行，依据阶段性结果动态调整后续规划，并在撰写正文的同时生成配套的可编辑矢量图表，最终产出结构完整、引用可回溯的研究报告。',
  heroWatch:'观看研究流程',heroRead:'查阅报告样例',
  mNodes:'报告章节',mCalls:'正文引用',mCites:'参考文献',mFigs:'配图',mLang:'报告语言',
  eye1:'研究流程',
  h1t:'从问题到成稿的<em>完整执行链路</em>',
  p1:'任务规划、并行执行、动态调度、报告合成与图表生成，构成一条端到端的研究流水线。',
  eye2:'图表生成',
  h2t:'由正文直接生成的<em>可编辑图表</em>',
  p2:'系统依据报告内容判定何处需要配图，确定图表类型与数据边界，并生成可编辑的矢量图。以下为本报告的实际产出。',
  eye3:'报告样例',
  h3t:'一份<em>引用完整的研究报告</em>',
  p3:'正文中的编号引用可点击查阅来源。',
  foot:'Agents-A1.5 · Deep Research',
  stages:[['01','总览'],['02','任务规划'],['03','并行执行'],['04','动态调度'],['05','报告合成'],['06','图表生成'],['07','成稿输出']],
  n_query:'query',n_planner:'planner 生成初始执行图',n_exec:'executioner 按层并行执行图',
  n_coord:'coordinator 依据结果修改后续节点',n_syn:'synthesizer 生成报告',
  n_figs:'配图生成',n_merge:'合并成稿',n_result:'result',
  graphLabel:'执行图（带依赖的任务节点）',
  nextLayer:'执行下一层',
  coordOps:'可选动作',reshape:'修改还未执行的图',
  nodeZone:'每个节点内部执行逻辑',
  nPlan:'规划 subtask',nRun:'顺序执行 subtask',
  nSum:'执行完毕，汇总各 subtask 输出，判断节点任务是否完成',
  nextSub:'下一个 subtask',
  subZone:'每个 subtask 内部执行逻辑',
  subInputs:['当前 subtask','前置节点信息','本节点已完成的 subtask 结果'],
  agentPick:'agent 自主选择',
  callTool:'调用工具',runTool:'执行工具',answerSub:'回答 subtask',
  provide:'提供信息',notEnough:'信息不充分',feed:'返回结果',enough:'信息充分',
  repZone:'当结果为报告时',
  repSteps:[['生成大纲','list'],['并行写作','pen'],['从前往后逐段润色','sparkle']],
  figZone:'配图生成流程：文字 → 可编辑图',
  figSteps:[
   ['输入与约束','图题、要点、限定、语言','spec'],
   ['语义蓝图','论点、顺序、区域与关系','graph'],
   ['布局规划','画布与构件边界、连接线','grid'],
   ['草图预检','生成草图，选定参考','pen'],
   ['可编辑构建','文本、形状、连接线逐件生成','shapes'],
   ['渲染与校验','结构、可编辑性、一致性','img'],
   ['视觉复核','保真、遗漏、对齐、重叠、可读性','zoom']],
  figRepair:'局部修复 · 至多一轮',
  mergeZone:'成稿示意：正文 + 配图',
  mergeIn:[['正文 · 带引用','book'],['配图 · 可编辑','img']],
  mockTitle:'深度报告 · 成稿',
  mockMeta:'章节 8 · 引用 391 · 配图 4',
  mockPill:'成稿',
  mockFigCap:'图 A · 候选情形',
  figDecision:'交付判定：质量与产物分开记账',
  figOut:[['通过','可编辑 SVG + PNG','check'],
          ['建议复核','交付产物并标注保留','flag'],
          ['失败','保留诊断，不声称成功','stop']],
  specItems:[
   ['图 A','四种可申奖候选情形的范围界定'],
   ['图 B','两条研究路径的时间线对照'],
   ['图 C','三十年部分结果与克雷判定条件的距离'],
   ['图 D','数学界反应光谱与机构立场']],
  statLabels:['章节','正文引用','来源','配图','体量'],
  refsTitle:'参考文献',
  pvTag:'研究报告',pvFile:'navier-stokes-report.pdf',
  pvEyebrow:'AGENTS-A1.5 · DEEP RESEARCH',
  pvTitle:'2026年9月的纳维–斯托克斯事件：OpenAI 的主张、菲尔兹奖得主的声明与验证之路',
  pvMeta:['8 章节','391 处引用','84 篇参考文献'],
  pvSecs:['引言','技术背景与证明标准','宣布之前的前奏与酝酿','2026年9月的公告：材料、方法与主张','验证状态与路径','数学界的观点与治理回应','媒体报道与叙事动态','影响、未解问题与未来轨迹'],
  pvCaps:['图 A · 四种可申奖候选情形的范围界定','图 C · 三十年部分结果与判定条件的距离'],
 },
 en:{
  navFlow:'Research pipeline',navFig:'Figure generation',navReport:'Sample report',navPlay:'Watch',
  heroEye:'AGENTS-A1.5 · DEEP RESEARCH',
  heroTitle:'From a research question <em>to a fully sourced report</em>',
  heroDesc:'Agents-A1.5 decomposes a research question into a dependency graph of tasks, executes it in parallel layers, revises the remaining plan as results arrive, and drafts the prose alongside its editable vector figures — producing a structured report in which every claim is traceable to its source.',
  heroWatch:'View the pipeline',heroRead:'Read the sample report',
  mNodes:'Sections',mCalls:'In-text citations',mCites:'References',mFigs:'Figures',mLang:'Languages',
  eye1:'Research pipeline',
  h1t:'The <em>full execution path</em>, question to manuscript',
  p1:'Task planning, parallel execution, dynamic scheduling, report synthesis and figure generation form a single end-to-end research pipeline.',
  eye2:'Figure generation',
  h2t:'Editable figures, <em>generated from the prose</em>',
  p2:'The system determines where a figure is warranted, settles its chart form and data boundaries, and generates editable vector output. Below are the figures produced for this report.',
  eye3:'Sample report',
  h3t:'A research report <em>with complete citations</em>',
  p3:'Numbered citations in the text are clickable.',
  foot:'Agents-A1.5 · Deep Research',
  stages:[['01','Overview'],['02','Planning'],['03','Execution'],['04','Scheduling'],['05','Synthesis'],['06','Figures'],['07','Output']],
  n_query:'query',n_planner:'planner builds the graph',n_exec:'executioner runs it layer by layer',
  n_coord:'coordinator revises nodes ahead',n_syn:'synthesizer composes the report',
  n_figs:'figure generation',n_merge:'merge',n_result:'result',
  graphLabel:'EXECUTION GRAPH (TASK NODES WITH DEPENDENCIES)',
  nextLayer:'run the next layer',
  coordOps:'Available actions',reshape:'revise the part not yet run',
  nodeZone:'Inside each node',
  nPlan:'plan subtasks',nRun:'run subtasks in order',
  nSum:'done — summarise subtask outputs, judge whether the node is complete',
  nextSub:'next subtask',
  subZone:'Inside each subtask',
  subInputs:['current subtask','upstream node information','subtask results already produced here'],
  agentPick:'agent decides',
  callTool:'call a tool',runTool:'run the tool',answerSub:'answer the subtask',
  provide:'provides context',notEnough:'information thin',feed:'results returned',enough:'sufficient',
  repZone:'When the result is a report',
  repSteps:[['generate an outline','list'],['draft sections in parallel','pen'],['polish front to back','sparkle']],
  figZone:'FIGURE PIPELINE: TEXT TO EDITABLE FIGURE',
  figSteps:[
   ['Input','brief, caveats, language','spec'],
   ['Semantic blueprint','thesis, reading order, regions','graph'],
   ['Layout plan','canvas bounds, connectors','grid'],
   ['Sketch & preflight','draft, pick the reference','pen'],
   ['Editable construction','text, shapes and connectors, one by one','shapes'],
   ['Render & validate','structure, editability, consistency','img'],
   ['Visual review','fidelity, alignment, overlap, legibility','zoom']],
  figRepair:'local repair · one pass at most',
  mergeZone:'MERGED OUTPUT: PROSE + FIGURES',
  mergeIn:[['prose · cited','book'],['figures · editable','img']],
  mockTitle:'Deep report',
  mockMeta:'8 sections · 391 citations · 4 figures',
  mockPill:'final',
  mockFigCap:'Fig. A · alternatives',
  figDecision:'Delivery decision: quality tracked apart from artifacts',
  figOut:[['Accepted','editable SVG + PNG','check'],
          ['Review recommended','delivered with caveats','flag'],
          ['Failed','diagnostics kept, no success claim','stop']],
  specItems:[
   ['Fig. A','Scope of the four prize-eligible alternatives'],
   ['Fig. B','Timeline of two converging research trajectories'],
   ['Fig. C','Partial results and their distance to Clay adjudication'],
   ['Fig. D','Spectrum of community response and institutional positions']],
  statLabels:['Sections','Citations','Sources','Figures','Size'],
  refsTitle:'References',
  pvTag:'Research report',pvFile:'navier-stokes-report.pdf',
  pvEyebrow:'AGENTS-A1.5 · DEEP RESEARCH',
  pvTitle:'The September 2026 Navier-Stokes Episode: OpenAI\u2019s Claim, the Fields Medalists\u2019 Statement, and the Path to Verification',
  pvMeta:['8 sections','391 citations','84 references'],
  pvSecs:['Introduction','Technical Background and Proof Standards','Precursors and Build-up',
          'The September 2026 Announcement','Verification Status and Pathways',
          'Community Perspectives and Governance','Media Coverage and Narrative Dynamics',
          'Implications and Open Questions'],
  pvCaps:['Fig. A \u00b7 Scope of the four prize-eligible alternatives',
          'Fig. C \u00b7 Partial results and their distance to adjudication'],
 }
};
let lang=new URLSearchParams((window.showcaseLocation||window.location).search).get('lang')==='en'?'en':'zh';
const C=()=>COPY[lang];
const T=k=>COPY[lang][k];

/* ===== 动画引擎：端到端流程图 + 镜头推拉 ===== */
const W=2400,H=1350;               /* 世界坐标（整张图） */
const VW=1600,VH=900;              /* 视口比例 16:9 */
const P={bg:'#0a0e18',panel:'#11151feb',edge:'#ffffff16',ink:'#eef2f8',muted:'#95a0b5',
  dim:'#5f6a80',txt:'#6fb8e8',fig:'#e0a463',mrg:'#8fd9bb',vio:'#a99bf0',gold:'#d9ad3c',warn:'#e08b8b'};
const FF="'Noto Sans SC','Instrument Sans',-apple-system,sans-serif";
const MF="'IBM Plex Mono',ui-monospace,Consolas,monospace";
const clamp2=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=x=>{x=clamp2(x);return x*x*(3-2*x);};
const easeIO=x=>{x=clamp2(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};

/* ---------- 世界布局：主干一条线，三个可展开的舞台 ---------- */
const MY=300;                       /* 主干中心线 y */
/* 主干节点：宽度按标签长度定，短标签不留大片空白；间距统一 GAP */
const GAP=56;
const NODE=(()=>{
 const spec=[
  {w:118, k:'query',  ic:'chat',  gold:true},
  {w:246, k:'planner',ic:'graph'},
  {w:246, k:'exec',   ic:'layers'},
  {w:262, k:'coord',  ic:'loop'},
  {w:238, k:'syn',    ic:'doc'},
  {w:162, k:'figs',   ic:'img',  fig:true},
  {w:162, k:'merge',  ic:'merge',mrg:true},
  {w:118, k:'result', ic:'check',gold:true}
 ];
 let x=96;
 return spec.map(n=>{const o={...n,x}; x+=n.w+GAP; return o;});
})();
const NH=104;
const byKey=k=>NODE.find(n=>n.k===k);
const cen=n=>({x:n.x+n.w/2,y:MY+NH/2});

/* 三个展开舞台（世界坐标） */
const ST_NODE={x:252, y:520, w:800, h:440};   /* exec 展开：节点内部 + subtask */
const ST_SYN ={x:1096,y:520, w:352, h:392};   /* syn 展开：报告三步 */
const ST_FIG ={x:1466,y:520, w:826, h:0};     /* figs 展开：h 由内容实测（见 expFig） */
const ST_MRG ={x:1377,y:36,  w:816, h:230};   /* merge 展开：成稿示意（挂在主干上方，居中对齐 merge） */

/* ---------- 镜头脚本 ---------- */
/* 每段: [t0, t1, cx, cy, zoom]  zoom=1 表示视口宽 VW；越大越近 */
/* 镜头严格沿主干从左到右逐节点推进；每个细节都在对应镜头到位后才出现 */
/* 起手镜位：第 1 镜有个缓推，开场不静止 */
const SHOT0=[0,0, 1068, 330, 0.70];
const SHOTS=[
 [0.0,  2.5,  1068,  330, 0.76],  /* 1 全景：整条流水线 */
 [2.5,  6.0,   440,  186, 1.22],  /* 2 query → planner（执行图在此展开） */
 [6.0, 13.0,   662,  626, 1.20],  /* 3 executioner（节点内部 + subtask 二次展开） */
 [13.0,16.8,   840,  138, 1.06],  /* 4 coordinator（可选动作在此展开，箭头回指 planner） */
 [16.8,19.8,  1270,  540, 1.10],  /* 5 synthesizer（报告三步） */
 [19.8,25.4,  1892,  700, 1.12],  /* 6 配图生成：文字到可编辑图 */
 [25.4,29.6,  1846,  250, 1.40],  /* 7 合并成稿：成稿示意 → result */
 [29.6,32.0,  1196,  540, 0.665]  /* 8 拉回全景 */
];
const DURATION=SHOTS[SHOTS.length-1][1];
/* 章节（用于进度条分段，不再是"页"） */
const STAGES=[
 {key:'all',   start:0,    end:2.5},
 {key:'plan',  start:2.5,  end:6.0},
 {key:'node',  start:6.0,  end:13.0},
 {key:'coord', start:13.0, end:16.8},
 {key:'syn',   start:16.8, end:19.8},
 {key:'figs',  start:19.8, end:25.4},
 {key:'out',   start:25.4, end:32.0}
];
function stageAt(t){const i=STAGES.findIndex(s=>t>=s.start&&t<s.end);return i<0?(t<0?0:STAGES.length-1):i;}

const ICONS={
 chat:'<path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z"/>',
 graph:'<circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><path d="M6.7 7.5 10.6 15.8M17.3 7.5 13.4 15.8M7.3 6h9.4"/>',
 layers:'<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 14 9 5 9-5"/>',
 loop:'<path d="M4 11a8 8 0 0 1 13.7-5.2"/><path d="M20 13a8 8 0 0 1-13.7 5.2"/><path d="M18 3.4v3.9h-3.9M6 20.6v-3.9h3.9"/>',
 doc:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
 check:'<path d="m4 12 5 5L20 5"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',
 steps:'<path d="M3 20h5v-5h5v-5h5V5"/>',
 sum:'<path d="M5 4h14L11 12l8 8H5"/>',
 wrench:'<path d="M15.2 4.8a5 5 0 0 0-6.6 6.2L4 15.6 8.4 20l4.6-4.6a5 5 0 0 0 6.2-6.6l-2.9 2.9-2.9-.7-.7-2.9z"/>',
 bolt:'<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
 brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V17a3 3 0 0 0 4 2.8V4Z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V17a3 3 0 0 1-4 2.8V4Z"/>',
 reply:'<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
 pen:'<path d="M4 20h4L20 8l-4-4L4 16z"/>',
 sparkle:'<path d="m12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
 img:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.3" cy="10" r="1.5"/><path d="m5 17 5-5 3.6 3.6L16 13l3 3.4"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 net:'<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M10.6 6.8 6.5 15.9M13.4 6.8l4.1 9.1M7.2 18h9.6"/>',
 tri:'<path d="M12 4 21 19H3z"/>',
 scale:'<path d="M12 4v16M6 8h12"/><path d="M3 14h6l-3-6zM15 14h6l-3-6z"/>',
 merge:'<path d="M7 4v5a5 5 0 0 0 5 5h6"/><path d="M15 11l3 3-3 3"/><path d="M7 20v-5"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h5"/>',
 lang:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5a15 15 0 0 1 0 17a15 15 0 0 1 0-17"/>',
 spec:'<path d="M5 3h10l4 4v14H5z"/><path d="M8 11h8M8 15h5M8 7h4"/>',
 blank:'<path d="M4 4h16v16H4z" stroke-dasharray="3 3"/><path d="M9 12h6"/>',
 zoom:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5M11 8v6M8 11h6"/>',
 grid:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M10 10v10"/>',
 shapes:'<rect x="3" y="12" width="9" height="9" rx="1.5"/><circle cx="16.3" cy="7.7" r="4.5"/>',
 flag:'<path d="M5 21V4"/><path d="M5 5h13l-3 4 3 4H5"/>',
 stop:'<circle cx="12" cy="12" r="8.5"/><path d="m8.6 8.6 6.8 6.8M15.4 8.6l-6.8 6.8"/>'
};

class Film{
 constructor(t){
  this.t=clamp2(t,0,DURATION-1e-5);
  this.i=stageAt(this.t); this.st=STAGES[this.i]; this.u=this.t-this.st.start;
  this.cam=this.camera();
 }
 /* ---- 镜头插值 ---- */
 camera(){
  const t=this.t;
  /* 找到当前镜位 i；从上一镜位运镜进来, 段内前 46% 完成移动, 之后稳住 */
  let i=0;
  for(let j=0;j<SHOTS.length;j++) if(t>=SHOTS[j][0]) i=j;
  const cur=SHOTS[i], prev=i===0?SHOT0:SHOTS[i-1];
  const span=cur[1]-cur[0];
  const p=clamp2((t-cur[0])/span);
  /* 末镜是纯运镜（无新内容），让它铺满整段；其余镜头前 62% 完成运镜 */
  const k=easeIO(clamp2(p/(i===SHOTS.length-1?0.98:0.62)));
  const cx=lerp(prev[2],cur[2],k), cy=lerp(prev[3],cur[3],k), z=lerp(prev[4],cur[4],k);
  const w=VW/z, h=VH/z;
  return {x:cx-w/2, y:cy-h/2, w, h, z};
 }
 /* ---- 基元 ---- */
 text(s,x,y,z=18,col=P.ink,w=450,al='start',f=FF){
  return `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" font-family="${f}" font-size="${z}" font-weight="${w}" fill="${col}" text-anchor="${al}">${esc(String(s))}</text>`;}
 rect(x,y,w,h,fill=P.panel,stroke=P.edge,r=11,sw=1,dash=''){
  return `<rect x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" width="${(+w).toFixed(1)}" height="${(+h).toFixed(1)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash?` stroke-dasharray="${dash}"`:''}/>`;}
 ell(cx,cy,rx,ry,fill,stroke,sw=1.2){
  return `<ellipse cx="${(+cx).toFixed(1)}" cy="${(+cy).toFixed(1)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;}
 line(x,y,xx,yy,col=P.edge,w=1,dash=''){
  return `<path d="M${(+x).toFixed(1)} ${(+y).toFixed(1)}L${(+xx).toFixed(1)} ${(+yy).toFixed(1)}" fill="none" stroke="${col}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;}
 ar(x,y,xx,yy,k='b',w=1.6,dash=''){
  return `<path d="M${(+x).toFixed(1)} ${(+y).toFixed(1)}L${(+xx).toFixed(1)} ${(+yy).toFixed(1)}" fill="none" stroke="${this.AC[k]}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''} marker-end="url(#a${k})"/>`;}
 cv(x,y,cx,cy,xx,yy,k='b',w=1.5,dash='',head=true){
  return `<path d="M${(+x).toFixed(1)} ${(+y).toFixed(1)}Q${(+cx).toFixed(1)} ${(+cy).toFixed(1)} ${(+xx).toFixed(1)} ${(+yy).toFixed(1)}" fill="none" stroke="${this.AC[k]}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}${head?` marker-end="url(#a${k})"`:''}/>`;}
 dot(x,y,r=3,col=P.txt,a=1){
  return `<circle cx="${(+x).toFixed(1)}" cy="${(+y).toFixed(1)}" r="${r}" fill="${col}" opacity="${clamp2(a).toFixed(3)}"/>`;}
 g(s,a=1,dx=0,dy=0,sc=1,ox=0,oy=0){
  const tr=sc!==1?`translate(${ox} ${oy}) scale(${sc.toFixed(4)}) translate(${-ox} ${-oy}) translate(${dx} ${dy})`
                 :`translate(${(+dx).toFixed(1)} ${(+dy).toFixed(1)})`;
  return `<g opacity="${clamp2(a).toFixed(3)}" transform="${tr}">${s}</g>`;}
 ic(k,x,y,size=20,col=P.txt,sw=1.7){
  return `<g transform="translate(${(+x).toFixed(1)} ${(+y).toFixed(1)}) scale(${(size/24).toFixed(3)})" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]||ICONS.check}</g>`;}
 mw(str,fs){let w=0;for(const c of String(str))w+=(/[　-鿿＀-￯]/.test(c)?1:.54)*fs;return w;}
 wrap(str,maxW,fs){
  const isC=c=>/[　-鿿＀-￯]/.test(c), wOf=c=>(isC(c)?1:.54)*fs;
  const atoms=[];let buf='';
  for(const ch of String(str)){
   if(isC(ch)){if(buf){atoms.push(buf);buf='';}atoms.push(ch);}
   else if(ch===' '){buf+=ch;atoms.push(buf);buf='';}else buf+=ch;}
  if(buf)atoms.push(buf);
  const out=[];let cur='',w=0;
  for(const a of atoms){let aw=0;for(const c of a)aw+=wOf(c);
   if(w+aw>maxW&&cur){out.push(cur.trimEnd());cur=a;w=aw;}else{cur+=a;w+=aw;}}
  if(cur.trim())out.push(cur.trimEnd());
  return out;}
 bt(str,cx,cy,maxW,fs,col=P.ink,weight=450,lh){
  const ls=this.wrap(str,maxW,fs); lh=lh||fs*1.42;
  const y0=cy-(ls.length-1)*lh/2;
  return ls.map((l,i)=>this.text(l,cx,y0+i*lh+fs*.34,fs,col,weight,'middle')).join('');}
 /* 分组虚线容器 */
 zone(x,y,w,h,col,label,icon,dashOff=0){
  return this.rect(x,y,w,h,col+'07',col+'46',18,1.4,'10 8').replace('/>',` stroke-dashoffset="${dashOff.toFixed(1)}"/>`)+
   (icon?this.ic(icon,x+20,y+16,19,col):'')+
   this.text(label,x+(icon?46:20),y+31,17,col,500);}
 /* 主干节点 */
 mainNode(n,hot,dim){
  const col=n.gold?P.gold:n.fig?P.fig:n.mrg?P.mrg:P.txt;
  const fill=n.gold?P.gold:(n.fig?'#1a1712':n.mrg?'#13211d':'#101a26');
  const inkc=n.gold?'#231c06':'#d6e3ef';
  let s=this.rect(n.x,MY,n.w,NH,fill,n.gold?'none':col+(hot?'aa':'55'),13,hot?1.8:1);
  if(hot&&!n.gold)s=this.rect(n.x-5,MY-5,n.w+10,NH+10,'none',col+'33',16,1.2)+s;
  s+=this.ic(n.ic,n.x+18,MY+NH/2-11,22,n.gold?'#231c06':col);
  s+=this.bt(T('n_'+n.k),n.x+34+(n.w-42)/2,MY+NH/2,n.w-58,n.gold?19:16.5,inkc,n.gold?600:450);
  return dim?this.g(s,.34):s;}

 /* ---------- 世界：始终绘制的整张流程图 ---------- */
 world(){
  const t=this.t;
  let s='';
  /* 主干连线 */
  for(let i=0;i<NODE.length-1;i++){
   const a=NODE[i],b=NODE[i+1];
   const ap=ramp(t,.16+i*.21,.68+i*.21);
   if(ap<=0)continue;
   const x0=a.x+a.w+3, x1=b.x;
   const k=b.fig?'f':b.mrg?'m':b.gold?'m':'b';
   s+=this.g(this.ar(x0,MY+NH/2,x0+lerp(0,x1-x0,ap),MY+NH/2,k,2),1);
  }
  /* 主干节点 */
  const hotKey={'all':null,'plan':'planner','node':'exec','coord':'coord','syn':'syn','figs':'figs','out':'merge'}[this.st.key];
  NODE.forEach((n,i)=>{
   const ap=ramp(t,i*.21,.58+i*.21);
   if(ap<=0)return;
   const hot=n.k===hotKey;
   s+=this.g(this.mainNode(n,hot,false),ap,0,(1-ap)*12);
  });
  /* coordinator 回环 */
  const lo=ramp(t,15.4,16.5);
  if(lo>0){
   const x1=cen(byKey('coord')).x, x2=cen(byKey('exec')).x, yb=MY+NH+62;
   s+=this.g(this.line(x1,MY+NH,x1,yb,P.txt+'88',1.8)+
    this.line(x1,yb,x2,yb,P.txt+'88',1.8)+
    this.ar(x2,yb,x2,MY+NH+8,'b',1.8)+
    this.ic('loop',(x1+x2)/2-64,yb+8,18,P.txt)+
    this.text(T('nextLayer'),(x1+x2)/2-38,yb+22,16,P.txt,450),lo);
  }
  /* coordinator 可选动作（挂在上方） */
  const co=ramp(t,13.3,14.3);
  if(co>0){
   const cx=byKey('coord').x-16, cy=MY-252;
   s+=this.g(this.rect(cx,cy,330,206,'#121826',P.vio+'46',16)+
    this.ic('loop',cx+20,cy+20,18,P.vio)+
    this.text(T('coordOps'),cx+46,cy+34,16,P.vio,500)+
    ['add_node()','modify_node()','remove_node()','add_edge()','modify_edge()','remove_edge()']
     .map((o,j)=>this.text(o,cx+22,cy+64+j*23,13.5,'#9aa6bd',450,'start',MF)).join(''),co);
   /* coordinator 节点 → 可选动作面板 */
   s+=this.g(this.line(cen(byKey('coord')).x,MY-6,cen(byKey('coord')).x,cy+206,P.vio+'55',1.3,'5 5'),co);
   /* 可选动作 → 回指 planner（修改还未执行的图） */
   const bk=ramp(t,14.3,15.7);
   if(bk>0){
    /* 终点 = 执行图最右节点 T6 的右缘（与 world() 中的 gx/gy 一致） */
    const gx=byKey('planner').x+24, gy=MY-212;
    const tx=gx+192+20, ty=gy+44;
    const sx0=cx, sy0=cy+103;
    const mx=(sx0+tx)/2;
    s+=this.g(this.cv(sx0,sy0,mx,Math.min(sy0,ty)-116,tx,ty,'v',1.5,'6 5')+
      this.ic('loop',mx-108,Math.min(sy0,ty)-96,17,P.vio)+
      this.text(T('reshape'),mx-84,Math.min(sy0,ty)-83,15,P.vio,450),bk);}
  }
  /* 执行图（挂在 planner 上方） */
  const go=ramp(t,2.9,3.4);
  if(go>0){
   const gx=byKey('planner').x+24, gy=MY-212;
   s+=this.g(this.ic('graph',gx-26,gy-34,16,P.dim)+
     this.text(T('graphLabel'),gx-2,gy-21,14,P.dim,450,'start',MF),go);
   const N=[[gx,gy,'T1'],[gx,gy+44,'T2'],[gx,gy+88,'T3'],
            [gx+96,gy+22,'T4'],[gx+96,gy+66,'T5'],[gx+192,gy+44,'T6']];
   /* 节点按拓扑分层落位 */
   const LAYER=[0,0,0,1,1,2], ROW=[0,1,2,0,1,0];
   N.forEach((n,j)=>{
    const o=ramp(t,3.2+LAYER[j]*.40+ROW[j]*.11, 3.66+LAYER[j]*.40+ROW[j]*.11);
    if(o<=0)return;
    s+=this.g(`<circle cx="${n[0]}" cy="${n[1]}" r="17" fill="#141d2b" stroke="${P.txt}66" stroke-width="1.2"/>`+
      this.text(n[2],n[0],n[1]+5,12.5,P.txt,500,'middle',MF),o,0,(1-o)*7);});
   /* 依赖边：跟在下游节点之后生长 */
   [[0,3],[1,3],[1,4],[2,4],[3,5],[4,5]].forEach(([a,b2],j)=>{
    const o=ramp(t,3.74+j*.10,4.18+j*.10);
    if(o<=0)return;
    const x0=N[a][0]+18, y0=N[a][1], x1=N[b2][0]-19, y1=N[b2][1];
    s+=this.ar(x0,y0,lerp(x0,x1,o),lerp(y0,y1,o),'b',1.1);});
   const dl=ramp(t,4.8,5.95);
   if(dl>0)s+=this.line(gx+60,gy+112,gx+60,lerp(gy+112,MY-6,dl),P.txt+'44',1.2,'5 5');
  }
  return s;}

 /* ---------- 展开：exec 节点内部（含 subtask） ---------- */
 expNode(){
  const st=ST_NODE, u=(this.t-6.0)*1.128;  /* 内容 7.50s → 铺满 6.65s */
  const op=ramp(u,.1,.9);
  if(op<=0)return '';
  let s='';
  /* 从 exec 节点垂下的引线 */
  const e=cen(byKey('exec'));
  s+=this.g(this.line(e.x,MY+NH,e.x,st.y-4,P.vio+'66',1.5,'6 5')+
    this.ic('zoom',e.x-11,MY+NH+14,18,P.vio),op);
  s+=this.g(this.zone(st.x,st.y,st.w,st.h,P.vio,T('nodeZone'),'layers',-(u*10)%18),op);
  /* 三步 */
  const NS=[[st.x+26,168,T('nPlan'),'list'],[st.x+212,180,T('nRun'),'steps'],[st.x+414,300,T('nSum'),'sum']];
  NS.forEach((b,j)=>{
   const o=ramp(u,.6+j*.4,1.2+j*.4);
   if(o<=0)return;
   const col=P.vio;
   s+=this.g(this.rect(b[0],st.y+52,b[1],70,'#151527',col+'55',11)+
    this.ic(b[3],b[0]+15,st.y+52+24,20,col)+
    this.bt(b[2],b[0]+30+(b[1]-30)/2,st.y+87,b[1]-52,14.5,'#d6d3ef',450),o,0,(1-o)*8);
   if(j>0){const lp=ramp(u,.45+j*.4,1.0+j*.4);
    const x0=NS[j-1][0]+NS[j-1][1];
    if(lp>0)s+=this.ar(x0,st.y+87,x0+lerp(0,b[0]-x0-9,lp),st.y+87,'v',1.5);}
  });
  /* 下一个 subtask 回环 */
  const l2=ramp(u,1.9,2.5);
  if(l2>0){const a=NS[1][0]+NS[1][1]/2, hw=NS[1][1]/2-14, yb=st.y+144;
   s+=this.g(this.line(a+hw,st.y+122,a+hw,yb,P.vio+'80',1.4)+
    this.line(a+hw,yb,a-hw,yb,P.vio+'80',1.4)+
    this.ar(a-hw,yb,a-hw,st.y+124,'v',1.4)+
    this.text(T('nextSub'),a,yb+19,13.5,P.vio,450,'middle'),l2);}
  /* subtask 内部（二次展开） */
  const so=ramp(u,2.8,3.6);
  if(so>0){
   const sx=st.x+30, sy=st.y+168, sw=st.w-60, sh=250;
   s+=this.g(this.zone(sx,sy,sw,sh,P.fig,T('subZone'),'brain',-(u*9)%18),so);
   /* ---- 几何：输入框 / agent / 两个工具椭圆 / 回答椭圆 ---- */
   const IX=sx+18,  IY=sy+56,  IW=198, IH=150;          /* 输入虚线框 */
   const AX=sx+392, AY=sy+152, ARX=92, ARY=36;          /* agent 椭圆中心 */
   const RX=sx+392, RY=sy+56,  TRX=78, TRY=29;          /* 执行工具（左上） */
   const CX=sx+626, CY=sy+56;                            /* 调用工具（右上） */
   const QX=sx+660, QY=sy+152, QRX=84, QRY=32;          /* 回答 subtask */
   /* 三项输入 */
   const io2=ramp(u,3.2,3.9);
   if(io2>0){
    s+=this.g(this.rect(IX,IY,IW,IH,'#161421',P.fig+'3a',11,1,'7 6'),io2);
    T('subInputs').forEach((tx,j)=>{
     const o=ramp(u,3.3+j*.18,3.95+j*.18);
     if(o<=0)return;
     s+=this.g(this.rect(IX+12,IY+12+j*44,IW-24,36,P.fig+'16',P.fig+'44',8)+
      this.bt(tx,IX+IW/2,IY+30+j*44,IW-40,12.5,'#e6d2b6',450),o);});
   }
   /* agent 自主选择 */
   const ao=ramp(u,4.0,4.7);
   if(ao>0)s+=this.g(this.ell(AX,AY,ARX,ARY,'#191c30',P.fig+'70',1.4)+
     this.ic('brain',AX-76,AY-11,19,P.fig)+
     this.text(T('agentPick'),AX+10,AY+6,15,'#f0dcc0',500,'middle'),ao,0,(1-ao)*8);
   /* 输入 → agent（水平，贴框边到椭圆左缘） */
   if(io2>0){
    s+=this.g(this.ar(IX+IW,AY,AX-ARX,AY,'f',1.4),ramp(u,3.9,4.5));
    s+=this.g(this.text(T('provide'),(IX+IW+AX-ARX)/2,AY-12,12.5,P.muted,450,'middle'),ramp(u,4.2,4.8));}
   /* 调用工具（右上） */
   const t1=ramp(u,4.9,5.5);
   if(t1>0)s+=this.g(this.ell(CX,CY,TRX,TRY,'#191c30',P.fig+'55')+
     this.ic('wrench',CX-62,CY-9,17,P.fig)+
     this.text(T('callTool'),CX+12,CY+5,14,'#e3cdae',450,'middle'),t1);
   /* 执行工具（左上） */
   const t2=ramp(u,5.4,6.0);
   if(t2>0)s+=this.g(this.ell(RX,RY,TRX,TRY,'#191c30',P.fig+'55')+
     this.ic('bolt',RX-60,RY-9,17,P.fig)+
     this.text(T('runTool'),RX+10,RY+5,14,'#e3cdae',450,'middle'),t2);
   /* agent →(信息不充分) 调用工具：斜线，标签在线段中点外侧 */
   if(t1>0){
    const x0=AX+ARX*0.72, y0=AY-ARY*0.70, x1=CX-TRX*0.62, y1=CY+TRY*0.78;
    s+=this.g(this.ar(x0,y0,x1,y1,'f',1.4),ramp(u,5.0,5.6));
    s+=this.g(this.text(T('notEnough'),(x0+x1)/2+16,(y0+y1)/2+6,12.5,P.fig,450,'start'),ramp(u,5.2,5.8));}
   /* 调用工具 → 执行工具：水平，两椭圆之间 */
   if(t2>0){
    s+=this.g(this.ar(CX-TRX,CY,RX+TRX,CY,'f',1.4),ramp(u,5.7,6.3));
    /* 执行工具 →(返回结果) agent：竖直下行，贴椭圆底到 agent 顶 */
    s+=this.g(this.ar(RX,RY+TRY,AX,AY-ARY,'f',1.4),ramp(u,6.1,6.7));
    s+=this.g(this.text(T('feed'),RX-14,(RY+TRY+AY-ARY)/2+5,12.5,P.muted,450,'end'),ramp(u,6.3,6.9));}
   /* agent →(信息充分) 回答 subtask */
   const do2=ramp(u,6.8,7.5);
   if(do2>0)s+=this.g(this.ar(AX+ARX,AY,QX-QRX,AY,'m',1.5)+
     this.text(T('enough'),(AX+ARX+QX-QRX)/2,AY-12,12.5,P.mrg,450,'middle')+
     this.ell(QX,QY,QRX,QRY,'#13241f',P.mrg+'70',1.4)+
     this.ic('reply',QX-64,QY-10,18,P.mrg)+
     this.text(T('answerSub'),QX+12,QY+5,14,'#cfe8dd',500,'middle'),do2);
  }
  return s;}

 /* ---------- 展开：synthesizer 报告五步 ---------- */
 expSyn(){
  const st=ST_SYN, u=(this.t-16.8)*0.700;  /* 内容 1.94s → 铺满 2.77s */
  const op=ramp(u,.1,.8);
  if(op<=0)return '';
  let s='';
  const e=cen(byKey('syn'));
  s+=this.g(this.line(e.x,MY+NH,e.x,st.y-4,P.mrg+'66',1.5,'6 5')+
    this.ic('zoom',e.x-11,MY+NH+14,18,P.mrg),op);
  s+=this.g(this.zone(st.x,st.y,st.w,st.h,P.mrg,T('repZone'),'book',-(u*10)%18),op);
  T('repSteps').forEach((b,j)=>{
   const o=ramp(u,.5+j*.42,1.1+j*.42);
   if(o<=0)return;
   const y=st.y+54+j*104;
   s+=this.g(this.rect(st.x+34,y,st.w-92,76,'#13211d',P.mrg+'55',12)+
    this.ic(b[1],st.x+54,y+28,20,P.mrg)+
    this.text(b[0],st.x+86,y+45,16.5,'#d8e6e0',450),o,0,(1-o)*8);
   if(j<2){const lp=ramp(u,.85+j*.42,1.25+j*.42);
    if(lp>0)s+=this.ar(st.x+34+(st.w-92)/2,y+76,st.x+34+(st.w-92)/2,y+76+lerp(0,26,lp),'m',1.5);}
  });
  return s;}

 /* ---------- 展开：figs —— 文字到可编辑图 ---------- */
 expFig(){
  const st=ST_FIG, u=(this.t-19.8)*0.930;  /* 内容 4.95s → 铺满 5.32s */
  const op=ramp(u,.1,.8);
  if(op<=0)return '';
  let s='';
  const e=cen(byKey('figs'));
  s+=this.g(this.line(e.x,MY+NH,e.x,st.y-4,P.fig+'66',1.5,'6 5')+
    this.ic('zoom',e.x-11,MY+NH+14,18,P.fig),op);
  /* 分区框在内容测高后再画，见下方 zoneBox */

  const S=T('figSteps');
  const M=28, X0=st.x+M, IW=st.w-M*2;
  const W1=(IW-48)/4, W2=(IW-32)/3;
  const x1=j=>X0+j*(W1+16), x2=j=>X0+j*(W2+16);
  const TS=15, DS=13, TLH=19, DLH=17;
  /* 先折行，行数决定卡片高度：两排各自取本排最高 */
  const lay=S.map((d,j)=>{const w=j<4?W1:W2;
   return {t:this.wrap(d[0],w-32,TS), d:this.wrap(d[1],w-32,DS)};});
  const hOf=a=>16+a.t.length*TLH+6+a.d.length*DLH+14;
  const BH1=Math.max(...lay.slice(0,4).map(hOf));
  const BH2=Math.max(...lay.slice(4).map(hOf));
  const Y1=st.y+52, Y2=Y1+BH1+46;
  const YD=Y2+BH2+80, Y3=YD+58, OH=76;

  const step=(x,y,w,h,n,d,a)=>{
   let o=this.rect(x,y,w,h,'#17151f',P.fig+'4d',12);
   o+=this.text(String(n).padStart(2,'0'),x+16,y+26,12,P.fig+'cc',500,'start',MF);
   o+=this.ic(d[2],x+w-34,y+11,18,P.fig+'88');
   a.t.forEach((l,i2)=>{o+=this.text(l,x+16,y+48+i2*TLH,TS,'#eadbc4',500);});
   const y0=y+48+(a.t.length-1)*TLH+DLH+4;
   a.d.forEach((l,i2)=>{o+=this.text(l,x+16,y0+i2*DLH,DS,'#a3937d',400);});
   return o;};

  /* 第一排 01-04 */
  S.slice(0,4).forEach((d,j)=>{
   const o=ramp(u,.5+j*.28,1.1+j*.28);
   if(o<=0)return;
   s+=this.g(step(x1(j),Y1,W1,BH1,j+1,d,lay[j]),o,0,(1-o)*8);
   if(j>0){const lp=ramp(u,.84+j*.28,1.2+j*.28);
    if(lp>0)s+=this.ar(x1(j)-15,Y1+BH1/2,x1(j)-15+lerp(0,14,lp),Y1+BH1/2,'f',1.4);}
  });
  /* 折行：04 → 05 */
  const wr=ramp(u,1.82,2.26);
  if(wr>0){
   const xr=x1(3)+W1/2, xl=x2(0)+W2/2, ym=Y1+BH1+22;
   s+=this.g(this.line(xr,Y1+BH1,xr,ym,P.fig+'8c',1.4)+
     this.line(xr,ym,xl,ym,P.fig+'8c',1.4)+
     this.ar(xl,ym,xl,Y2-4,'f',1.4),wr);
  }
  /* 第二排 05-07 */
  S.slice(4).forEach((d,j)=>{
   const o=ramp(u,2.22+j*.3,2.82+j*.3);
   if(o<=0)return;
   s+=this.g(step(x2(j),Y2,W2,BH2,j+5,d,lay[j+4]),o,0,(1-o)*8);
   if(j>0){const lp=ramp(u,2.56+j*.3,2.92+j*.3);
    if(lp>0)s+=this.ar(x2(j)-15,Y2+BH2/2,x2(j)-15+lerp(0,14,lp),Y2+BH2/2,'f',1.4);}
  });
  /* 局部修复回环：07 → 06 */
  const rp=ramp(u,3.3,3.85);
  if(rp>0){
   const a=x2(2)+W2/2, b=x2(1)+W2/2, yb=Y2+BH2+26, mid=(a+b)/2;
   const lw=this.mw(T('figRepair'),13)+22;
   s+=this.g(this.line(a,Y2+BH2,a,yb,P.fig+'99',1.4)+
     this.line(a,yb,b,yb,P.fig+'99',1.4)+
     this.ar(b,yb,b,Y2+BH2+4,'f',1.4)+
     this.ic('loop',mid-lw/2,yb+9,16,P.fig)+
     this.text(T('figRepair'),mid-lw/2+22,yb+22,13,P.fig,450),rp);
  }
  /* 交付判定分隔线 */
  const dc=ramp(u,3.8,4.25);
  if(dc>0){
   const lw=this.mw(T('figDecision'),14)+24;
   s+=this.g(this.line(X0,YD,X0+IW,YD,P.fig+'2e',1)+
     this.rect(st.x+st.w/2-lw/2-8,YD-14,lw+16,28,'#141018','none',6)+
     this.ic('scale',st.x+st.w/2-lw/2,YD-8,17,P.fig)+
     this.text(T('figDecision'),st.x+st.w/2-lw/2+24,YD+5,14,'#cbb89b',450),dc);
  }
  /* 三种交付结果 */
  /* 分区框：高度由内容实测 */
  s=this.g(this.zone(st.x,st.y,st.w,Y3+OH+26-st.y,P.fig,T('figZone'),'img',-(u*10)%18),op)+s;
  T('figOut').forEach((d,j)=>{
   const col=[P.mrg,P.fig,P.warn][j], fill=['#13211d','#1d1811','#1f1418'][j];
   const key=['m','f','w'][j], x=x2(j);
   const lp=ramp(u,3.95+j*.2,4.3+j*.2);
   if(lp>0)s+=this.g(this.ar(x+W2/2,YD+16,x+W2/2,YD+16+lerp(0,Y3-YD-18,lp),key,1.3,'5 4'),lp);
   const o=ramp(u,4.05+j*.2,4.55+j*.2);
   if(o<=0)return;
   let c=this.rect(x,Y3,W2,OH,fill,col+'55',12);
   c+=this.ic(d[2],x+16,Y3+16,20,col);
   c+=this.text(d[0],x+46,Y3+32,15,'#e2e9f0',500);
   this.wrap(d[1],W2-32,13).forEach((l,i2)=>{
    c+=this.text(l,x+16,Y3+56+i2*17,13,'#98a2b0',400);});
   s+=this.g(c,o,0,(1-o)*8);
  });
  return s;}

 /* ---------- 展开：merge —— 成稿示意（一页报告的精简版） ---------- */
 expMrg(){
  const st=ST_MRG, u=(this.t-25.4)*0.920;  /* 内容 3.67s → 铺满 3.99s */
  const op=ramp(u,.1,.8);
  if(op<=0)return '';
  let s='';
  const e=cen(byKey('merge'));
  /* 成稿页 → merge 节点的引线 */
  s+=this.g(this.line(e.x,st.y+st.h+2,e.x,MY-4,P.mrg+'66',1.5,'6 5')+
    this.ic('zoom',e.x-11,MY-30,18,P.mrg),op);
  s+=this.g(this.zone(st.x,st.y,st.w,st.h,P.mrg,T('mergeZone'),'merge',-(u*10)%18),op);

  const M=28, X0=st.x+M, IW=st.w-M*2;
  const CW=164, CH=56;
  const PGX=X0+CW+44, PGY=st.y+50, PGW=X0+IW-PGX-14, PGH=156;
  const cy0=PGY+(PGH-(CH*2+16))/2;

  /* 两路来源 */
  const CK=[[P.mrg,'#13211d','#cfe8dd'],[P.fig,'#1d1811','#e6d2b6']];
  T('mergeIn').forEach((c,j)=>{
   const o=ramp(u,.55+j*.22,1.15+j*.22);
   if(o<=0)return;
   const y=cy0+j*(CH+16), col=CK[j][0];
   let b=this.rect(X0,y,CW,CH,CK[j][1],col+'55',11);
   b+=this.ic(c[1],X0+15,y+CH/2-10,20,col);
   b+=this.bt(c[0],X0+43+(CW-55)/2,y+CH/2,CW-62,12.5,CK[j][2],500);
   s+=this.g(b,o,0,(1-o)*8);
   const lp=ramp(u,1.25+j*.18,1.75+j*.18);
   if(lp>0){const x0=X0+CW+4, y0=y+CH/2, x1=PGX-7, y1=PGY+PGH/2;
    s+=this.g(this.ar(x0,y0,lerp(x0,x1,lp),lerp(y0,y1,lp),j?'f':'m',1.5),lp);}
  });

  /* 成稿：纸页（浅色）叠成一摞 */
  const po=ramp(u,1.7,2.35);
  if(po<=0)return s;
  let pg=this.rect(PGX+14,PGY+14,PGW,PGH,'#8d9bac','none',12)+
         this.rect(PGX+7,PGY+7,PGW,PGH,'#bdc8d6','none',12)+
         this.rect(PGX,PGY,PGW,PGH,'#f2f5f9','#ffffff2a',12);
  s+=this.g(pg,po,0,(1-po)*10);

  const px=PGX+16, py=PGY+16, pw=PGW-32;
  /* 标题 · 语言 · 元信息 */
  const to=ramp(u,2.15,2.7);
  if(to>0){
   s+=this.g(this.text(T('mockTitle'),px,py+14,13.5,'#1e2733',600)+
     this.rect(px+pw-52,py-4,52,18,P.mrg+'2e','#3f8c71',5)+
     this.text(T('mockPill'),px+pw-26,py+9,9.5,'#2c7259',600,'middle',MF)+
     this.text(T('mockMeta'),px,py+32,11,'#78849a',450)+
     this.line(px,py+42,px+pw,py+42,'#d2d9e3',1),to);
  }
  /* 正文栏：文字行 + 引用块 */
  const RW=Math.round(pw*.42), RX=px+pw-RW, LW=pw-RW-26;
  const BT=py+52;
  const BARS=[LW,LW-10,Math.round(LW*.80),LW,Math.round(LW*.70)];
  BARS.forEach((w,j)=>{
   const o=ramp(u,2.4+j*.1,2.85+j*.1);
   if(o<=0)return;
   const y=BT+j*14;
   let r=this.rect(px,y,w,7,'#c6cfdb','none',3);
   if(j===2)r+=this.rect(px+w+6,y-1,30,9,P.txt+'8c','none',3);
   if(j===4)r+=this.rect(px+w+6,y-1,30,9,P.txt+'8c','none',3);
   s+=this.g(r,o);
  });
  const fo=ramp(u,2.95,3.3);
  if(fo>0)s+=this.g(this.rect(px,BT+72,Math.round(LW*.46),6,'#dbe2ea','none',3),fo);

  /* 配图栏：页内嵌的一张图 */
  const go=ramp(u,2.9,3.45);
  if(go>0){
   let f=this.rect(RX,BT,RW,78,'#ffffff','#dde4ed',7);
   const ax=RX+12, aw=RW-24, base=BT+52;
   f+=this.line(ax,base,ax+aw,base,'#c9d2de',1);
   [28,44,20,36].forEach((h,j)=>{
    const o=ramp(u,3.05+j*.09,3.4+j*.09);
    if(o<=0)return;
    const bw=22, gp=Math.round((aw-bw*4)/5), x=ax+gp+j*(bw+gp), hh=h*ease(o);
    f+=this.rect(x,base-hh,bw,hh,[P.fig,P.txt,P.fig,P.mrg][j]+'d9','none',2);});
   f+=this.text(T('mockFigCap'),ax,BT+70,9.5,'#8b96a6',450);
   s+=this.g(f,go);
  }
  return s;}

 render(){
  this.AC={b:P.txt,v:P.vio,f:P.fig,m:P.mrg,d:P.dim,w:P.warn};
  const c=this.cam;
  const mk=Object.entries(this.AC).map(([k,col])=>
   `<marker id="a${k}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${col}"/></marker>`).join('');
  /* 氛围点（世界坐标） */
  let amb='';
  for(let n=0;n<40;n++){
   const x=hash(n+1)*W, y=(hash(n+219)*H+this.t*(5+hash(n)*9))%H;
   amb+=this.dot(x,y,n%7===0?1.6:.9,P.txt,.03+hash(n+77)*.05);}
  const defs=`<defs>${mk}<radialGradient id="aura" cx="50%" cy="28%" r="70%">`+
   `<stop stop-color="${P.txt}" stop-opacity=".07"/>`+
   `<stop offset=".62" stop-color="#16324a" stop-opacity=".025"/>`+
   `<stop offset="1" stop-color="${P.bg}" stop-opacity="0"/></radialGradient></defs>`;
  const body=this.world()+this.expNode()+this.expSyn()+this.expFig()+this.expMrg();
  return `<svg viewBox="${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.w.toFixed(1)} ${c.h.toFixed(1)}" `+
   `xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img">`+
   `${defs}<rect x="${(c.x-200).toFixed(1)}" y="${(c.y-200).toFixed(1)}" width="${(c.w+400).toFixed(1)}" height="${(c.h+400).toFixed(1)}" fill="${P.bg}"/>`+
   `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#aura)"/>${amb}${body}</svg>`;}
}
function renderSVG(t){return new Film(t).render();}

/* ===== 播放控制 ===== */
const scene=$('#svgScene'), scrub=$('#scrubber'), playBtn=$('#playPause');
const ICON_PLAY='<svg viewBox="0 0 24 24"><path d="m8 5 12 7-12 7Z" fill="currentColor" stroke="none"/></svg>';
const ICON_PAUSE='<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>';
const state={t:0,playing:false,speed:1,last:0,stage:-1};
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
scrub.max=DURATION.toFixed(2);
$('#timeTotal').textContent=fmt(DURATION);

function draw(force){
 scene.innerHTML=renderSVG(state.t);
 scrub.value=state.t.toFixed(2);
 $('#timeCurrent').textContent=fmt(state.t);
 const i=stageAt(state.t), st=STAGES[i];
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
  scene.setAttribute('aria-label',C().stages[i][1]);
 }
}
function setPlaying(on){
 if(state.playing===on)return;
 state.playing=on;
 playBtn.innerHTML=on?ICON_PAUSE:ICON_PLAY;
 playBtn.setAttribute('aria-label',on?'Pause':'Play');
 if(on){state.last=performance.now();requestAnimationFrame(tick);}
}
function tick(now){
 if(!state.playing)return;
 const dt=Math.min(.12,(now-state.last)/1000);
 state.last=now;
 state.t+=dt*state.speed;
 if(state.t>=DURATION){          /* 播完定格在全景，不循环 */
  state.t=DURATION-1e-3;
  draw();
  setPlaying(false);
  return;
 }
 draw();
 if(state.playing)requestAnimationFrame(tick);
}
function seek(t,play){state.t=clamp(t,0,DURATION-1e-3);draw();if(play&&!state.playing)setPlaying(true);}
playBtn.onclick=()=>{if(!state.playing&&state.t>=DURATION-2e-3)state.t=0;setPlaying(!state.playing);};
$('#restart').onclick=()=>{seek(0);setPlaying(true);};
scrub.oninput=()=>{state.t=+scrub.value;draw();};
scrub.onpointerdown=()=>{if(state.playing)setPlaying(false);};
$('#speed').onchange=e=>{state.speed=+e.target.value;};
$('[data-play-jump]').onclick=()=>{$('#theater').scrollIntoView({block:'center'});seek(0,true);};

function buildChapters(){
 $('#chapters').innerHTML=C().stages.map((s,i)=>
  `<button role="tab" aria-selected="false"><span>${s[0]}</span>${esc(s[1])}</button>`).join('');
 $$('#chapters button').forEach((b,i)=>b.onclick=()=>seek(STAGES[i].start,true));
}

/* ===== 四图陈列 ===== */
function buildFigs(){
 const K=['A','B','C','D'];
 $('#figGrid').innerHTML=K.map((k,i)=>{
  const c=C().specItems[i];
  return `<figure class="fig-card">
   <header><b>${esc(c[0])}</b><strong>${esc(c[1])}</strong></header>
   <div class="fig-holder" data-fig="${k}" role="button" tabindex="0" aria-label="${esc(c[1])}">${FIGS[k]}</div>
   </figure>`;
 }).join('');
 $$('[data-fig]').forEach(el=>{
  el.onclick=()=>openLB(el.dataset.fig);
  el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLB(el.dataset.fig);}};
 });
}
/* ---- 参考文献表 ---- */
function refsHTML(REF){
 const ids=Object.keys(REF).map(Number).sort((a,b)=>a-b);
 if(!ids.length)return '';
 return `<section class="refs-sec"><button aria-expanded="false">
   <i>${String(DATA.sections.length+1).padStart(2,'0')}</i>${esc(T('refsTitle'))}
   <u>+</u></button>
  <ul class="refs-list">${ids.map(n=>{const r=REF[n];
   return `<li id="ref-${n}"><b>[${n}]</b><div>
     <a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer">${esc(r.t)}</a>
     <em>${esc(r.u)}</em></div></li>`;}).join('')}</ul></section>`;
}
/* ---- 引用交互：点击跳转 + 悬停预览 ---- */
let popTimer=null;
function wireCites(REF){
 const pop=$('#citePop');
 const hide=()=>{pop.removeAttribute('open');pop.setAttribute('aria-hidden','true');};
 $$('#doc .cite-link, #previewStack .cite-link').forEach(a=>{
  const n=a.dataset.ref, r=REF[n];
  a.onclick=e=>{
   e.preventDefault();
   const li=document.getElementById('ref-'+n);
   if(!li)return;
   const sec=li.closest('.refs-sec');
   if(sec&&!sec.classList.contains('open')){
    sec.classList.add('open');
    sec.querySelector('button').setAttribute('aria-expanded','true');
   }
   hide();
   li.scrollIntoView({block:'center',behavior:'smooth'});
   $$('.refs-list li.ref-hit').forEach(x=>x.classList.remove('ref-hit'));
   li.classList.add('ref-hit');
   setTimeout(()=>li.classList.remove('ref-hit'),1600);
  };
  if(!r)return;
  a.onmouseenter=()=>{
   clearTimeout(popTimer);
   popTimer=setTimeout(()=>{
    pop.innerHTML=`<b>${esc(r.t)}</b><span>${esc(r.u)}</span>`;
    pop.setAttribute('open','');pop.setAttribute('aria-hidden','false');
    const b=a.getBoundingClientRect(), pw=pop.offsetWidth, ph=pop.offsetHeight;
    let x=b.left+b.width/2-pw/2, y=b.top-ph-9;
    x=clamp(x,12,innerWidth-pw-12);
    if(y<12)y=b.bottom+9;
    pop.style.left=x+'px';pop.style.top=y+'px';
   },140);
  };
  a.onmouseleave=()=>{clearTimeout(popTimer);hide();};
  a.onfocus=a.onmouseenter; a.onblur=a.onmouseleave;
 });
 addEventListener('scroll',hide,{passive:true});
}
function openLB(k){$('#lbInner').innerHTML=FIGS[k];$('#lightbox').setAttribute('open','');$('#lbClose').focus();}
function closeLB(){$('#lightbox').removeAttribute('open');$('#lbInner').innerHTML='';}
$('#lbClose').onclick=closeLB;
$('#lightbox').onclick=e=>{if(e.target.id==='lightbox')closeLB();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLB();});

/* A readable cover and entry points into the original report. */
const PREVIEW_COPY = {
  zh: {
    sample: '研究报告样例', date: '2026 年 9 月',
    title: '纳维–斯托克斯事件',
    subtitle: 'OpenAI 的研究主张、菲尔兹奖得主的声明与验证之路',
    focus: '报告聚焦',
    topics: ['研究主张与适用范围', '证明标准与验证路径', '学界回应与治理讨论'],
    figure: '报告原图', zoom: '点击放大',
    sources: '引用可追溯', sourceLabels: ['OpenAI', 'Math & AI'],
    read: '阅读全文与参考文献', languages: '中 / EN',
    figureLabel: '放大图 A：四种可申奖候选情形的范围界定',
  },
  en: {
    sample: 'Sample research report', date: 'September 2026',
    title: 'The Navier–Stokes episode',
    subtitle: 'OpenAI’s claim, the Fields Medalists’ statement, and the path to verification',
    focus: 'Inside the report',
    topics: ['The claim and its scope', 'Standards and verification', 'Community and governance'],
    figure: 'From the report', zoom: 'Click to enlarge',
    sources: 'Traceable sources', sourceLabels: ['OpenAI', 'Math & AI'],
    read: 'Read the report and references', languages: 'ZH / EN',
    figureLabel: 'Enlarge Figure A: scope of the four prize-eligible alternatives',
  },
};

function buildPreview() {
  const copy = PREVIEW_COPY[lang];
  const attr = value => esc(value).replace(/"/g, '&quot;');
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  const citations = DATA.sections.reduce((n, section) => n + (section.body[lang].match(/<cite>/g) || []).length, 0);
  const refs = DATA.refs[lang];
  const stats = [DATA.sections.length, citations, Object.keys(refs).length, Object.keys(FIGS).length];
  const labels = [T('mNodes'), T('mCalls'), T('mCites'), T('mFigs')];
  const sections = [1, 4, 5];
  const sources = ['1', '2'];
  const caption = C().specItems[0];
  $('#previewStack').innerHTML = `<article class="report-preview" aria-labelledby="previewTitle">
    <div class="preview-masthead">
      <span>${esc(copy.sample)}</span><time datetime="2026-09">${esc(copy.date)}</time>
    </div>
    <header class="preview-heading">
      <h2 id="previewTitle">${esc(copy.title)}</h2>
      <p>${esc(copy.subtitle)}</p>
    </header>
    <dl class="preview-stats">${stats.map((value, i) => `<div><dt>${esc(labels[i])}</dt><dd>${value}</dd></div>`).join('')}</dl>
    <div class="preview-body">
      <nav class="preview-topics" aria-label="${attr(copy.focus)}">
        <h3>${esc(copy.focus)}</h3>
        ${copy.topics.map((topic, i) => `<a href="#report-section-${sections[i]}" data-preview-section="${sections[i]}">
          <span class="preview-topic-number">${String(i + 1).padStart(2, '0')}</span>
          <span>${esc(topic)}</span>${arrow}</a>`).join('')}
      </nav>
      <figure class="preview-figure">
        <button type="button" class="preview-figure-button" data-fig="A" aria-label="${attr(copy.figureLabel)}">
          <span class="preview-figure-label">${esc(copy.figure)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6m16-10-6 6M4 20l6-6"/></svg></span>
          <span class="preview-figure-image">${FIGS.A}</span>
          <span class="preview-figure-zoom">${esc(copy.zoom)}</span>
        </button>
        <figcaption><b>${esc(caption[0])}</b>${esc(caption[1])}</figcaption>
      </figure>
    </div>
    <div class="preview-sources">
      <span>${esc(copy.sources)}</span>
      <div>${sources.map((n, i) => `<a class="cite-link" href="#ref-${n}" data-ref="${n}" aria-label="${attr('[' + n + '] ' + refs[n].t)}"><cite>[${n}]</cite>${esc(copy.sourceLabels[i])}</a>`).join('')}</div>
    </div>
    <div class="preview-footer"><a href="#report">${esc(copy.read)}${arrow}</a><span>${esc(copy.languages)}</span></div>
  </article>`;
  $$('#previewStack [data-preview-section]').forEach(link => {
    link.onclick = event => {
      const section = document.getElementById('report-section-' + link.dataset.previewSection);
      if (!section) return;
      event.preventDefault();
      section.classList.add('open');
      const button = section.querySelector('button');
      button.setAttribute('aria-expanded', 'true');
      button.focus({preventScroll: true});
      section.scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    };
  });
}


/* ===== 报告阅读器 ===== */
let docLang=lang;   /* 正文语言跟随界面语言 */
/* 每张图归属的章节序号（0-based）*/
/* 图归属的章节序号（0-based），依规格书 figure_specs_ns_gpt5_all.md 的「建议位置」：
   图A §技术背景 · 图B §公告的前因与铺垫 · 图D §数学界视角与治理回应。
   图C 改版后数据出自 §Technical Background，故与图A 同放技术背景一节。 */
const FIG_AT={1:['A','C'],2:'B',5:'D'};
function buildDoc(){
 $('#docTitle').textContent=DATA.title[docLang];
 const labels=C().statLabels;
 const nCite=DATA.sections.reduce((a,s)=>a+(s.body[docLang].match(/<cite>/g)||[]).length,0);
 const nRef=Object.keys((DATA.refs||{})[docLang]||{}).length;
 const nChar=DATA.sections.reduce((a,s)=>a+s.body[docLang].replace(/<cite>.*?<\/cite>/g,'').replace(/<[^>]+>/g,'').length,0);
 const vals=[String(DATA.sections.length),String(nCite),String(nRef),'4',
   docLang==='zh'?(nChar/1000).toFixed(1)+' 千字':(nChar/1000).toFixed(1)+'k chars'];
 $('#docStats').innerHTML=labels.map((l,i)=>`<div>${esc(l)}<b>${vals[i]}</b></div>`).join('');
 const REF=(DATA.refs||{})[docLang]||{};
 /* 编号引用 → 可跳转链接；无对应条目的保持原样 */
 const linkify=html=>html.replace(/<cite>\[(\d+)\]<\/cite>/g,(m,n)=>
   REF[n]?`<a class="cite-link" href="#ref-${n}" data-ref="${n}">${m}</a>`:m);
 $('#doc').innerHTML=DATA.sections.map((s,i)=>{
  const fks=FIG_AT[i]?[].concat(FIG_AT[i]):[];
  const figHTML=fk=>{
   const cap=C().specItems[['A','B','C','D'].indexOf(fk)];
   return `<figure class="doc-fig"><div class="fig-holder" data-fig="${fk}" role="button" tabindex="0"
    aria-label="${esc(cap[1])}">${FIGS[fk]}</div>
    <figcaption><b>${cap[0]}</b>${esc(cap[1])}</figcaption></figure>`;};
  /* 同节多图时分散排布：首图置于节末，其余按段落均分插入，避免连排 */
  let bodyHTML=s.body[docLang];
  if(fks.length>1){
   const paras=bodyHTML.split(/(?=<h4)/);
   const step=Math.max(1,Math.floor(paras.length/fks.length));
   fks.slice(1).forEach((fk,n)=>{
    const at=Math.min(paras.length-1,step*(n+1));
    paras[at]=figHTML(fk)+paras[at];});
   bodyHTML=paras.join('');
  }
  const fig=fks.length?figHTML(fks[0]):'';
  return `<section id="report-section-${i}" class="doc-sec${i===0?' open':''}">
   <button aria-expanded="${i===0}"><i>${String(i+1).padStart(2,'0')}</i>${esc(s.h[docLang])}<u>+</u></button>
   <div class="doc-body">${linkify(bodyHTML)}${fig}</div></section>`;
 }).join('')+refsHTML(REF);
 $$('.doc-sec>button,.refs-sec>button').forEach(b=>b.onclick=()=>{
  const sec=b.parentElement, open=sec.classList.toggle('open');
  b.setAttribute('aria-expanded',String(open));
 });
 wireCites(REF);
 $$('#doc [data-fig]').forEach(el=>{
  el.onclick=()=>openLB(el.dataset.fig);
  el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLB(el.dataset.fig);}};
 });
}

/* ===== 语言 ===== */
function applyLang(){
 document.title=lang==='en'?'Agents-A1.5 · Deep Research':'Agents-A1.5 · 深度调研';
 const languageURL=new URL((window.showcaseLocation||window.location).href);
 languageURL.searchParams.set('lang',lang);
 if(window.showcaseLocation)window.showcaseLocation.replace(languageURL.href);
 else history.replaceState(null,'',languageURL.href);
 $$('[data-i18n]').forEach(el=>{const v=C()[el.dataset.i18n];if(v!=null)el.textContent=v;});
 $$('[data-i18n-html]').forEach(el=>{const v=C()[el.dataset.i18nHtml];if(v!=null)el.innerHTML=v;});
 $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';
 buildChapters();buildPreview();buildFigs();buildDoc();draw(true);
}
$$('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;docLang=lang;applyLang();});

/* ===== 入场 ===== */
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
 document.body.classList.add('has-observer');
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.12});
 $$('.reveal').forEach(el=>io.observe(el));
}
applyLang();
if(matchMedia('(prefers-reduced-motion:reduce)').matches)seek(2.4);else setPlaying(true);
// Keep playback state when the shared header changes the interface language.
window.DeepResearch = {state, seek, setPlaying, duration: DURATION,
  get language() { return lang; }, get reportLanguage() { return docLang; }};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPlaying(false);
});

