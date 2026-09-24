/* light-visual-palette */

/* Agents-A1.5 / Verification 能力演示。
 * 确定性矢量帧: 给定时间 t 就得到一张 SVG, 不依赖随机数, 也没有网络请求。
 * 画面里的检索词、反思内容、最终答案均取自同一道题的真实作答记录。
 */
(function(root){
'use strict';
const P={bg:'#f5f8fc',paper:'#ffffff',panel:'#edf3fa',edge:'#cad7e7',ink:'#172b45',muted:'#526078',
         dim:'#64748b',purple:'#7052bc',mint:'#087f83',amber:'#a4611d',red:'#bd4260',grey:'#c6d4e5'};
const F="Showcase,'PingFang SC','Microsoft YaHei',Arial,sans-serif";
const MONO="'SFMono-Regular',Consolas,'DejaVu Sans Mono',monospace";
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

/* ---- 文案: 两种语言 ---- */
const L={
 zh:{
  qTitle:'一道真实的评测题', qSub:'多跳问题，答案要一环一环推出来',
  q:['有个演员结过两次婚，第一任妻子也是演员。',
     '他第二任妻子的弟弟，在 2001 到 2005 年之间去世。',
     '他在某部电影里演过警察局长。',
     '问：他第一任妻子叫什么名字？'],
  hop1:'第一环：演过警察局长', hop2:'第二环：第二任妻子的弟弟', hop3:'要找：第一任妻子的名字',
  tTitle:'同一道题，两次作答', tSub:'一个方块代表一次交互',
  off:'不具备该能力', on:'具备该能力',
  stuckHint:'连续多次检索都没有进展',
  noProgress:'← 没有推进', noInfo:'← 没拿到有用信息',
  stuckFoot:'两次作答都走到了同一个僵局',
  bubble:['等一下。','我一直在同样模糊的线索上打转，没有锁定任何一个可验证的身份。','先停下来，别再靠猜。'],
  sideA:'模型在推理过程中', sideB:'自己停了下来',
  offFoot:'不具备该能力：沿着同一条思路一直查到底',
  cTitle:'换了方法之后，它找到了答案',
  cGrow:'换了方法之后，每一次检索都在向答案靠近',
  chain:['改用权威来源反查「警察局长」这个角色','查到演员：Anupam Kher','查他妻子：Kirron Kher','查到第一任妻子：Madhumati'],
  cmpOff:'始终沿用同一思路，没有答对', cmpOn:'中途换了方法，答出 Madhumati',
  reflect:'重新规划',
  legend:['开局检索','没有进展','停下来重新规划','换方法后推进'],
  chapters:['题目','陷入僵局','停下来重新规划','找到答案'],
 },
 en:{
  qTitle:'A real benchmark question', qSub:'Multi-hop — the answer has to be reasoned out link by link',
  q:['An actor has been married twice; his first wife was also an actress.',
     "His second wife's brother died between 2001 and 2005.",
     'He played a police commissioner in a film.',
     "Q: What is his first wife's name?"],
  hop1:'Hop 1: played a police commissioner', hop2:"Hop 2: second wife's brother", hop3:"Target: the first wife's name",
  tTitle:'The same question, answered twice', tSub:'Each block is one interaction',
  off:'Without Verification', on:'With Verification',
  stuckHint:'Several searches in a row, no progress',
  noProgress:'← no progress', noInfo:'← nothing usable',
  stuckFoot:'Both attempts reach the same dead end',
  bubble:['Hold on.','I keep circling the same vague leads without pinning down a single verified identity.','Let me pause before I waste more time on guesswork.'],
  sideA:'The model stops itself', sideB:'inside its own reasoning',
  offFoot:'Without Verification: it keeps following the same line to the end',
  cTitle:'After changing approach, it found the answer',
  cGrow:'Every search after the change moves toward the answer',
  chain:['Look up the police-commissioner role in an authoritative source','Found the actor: Anupam Kher','Found his wife: Kirron Kher','Found the first wife: Madhumati'],
  cmpOff:'Same line throughout — wrong answer', cmpOn:'Changed approach — answered Madhumati',
  reflect:'Re-plan',
  legend:['Opening searches','No progress','Stops to re-plan','Progress after the change'],
  chapters:['Question','Dead end','Stops to re-plan','The answer'],
 }};
let LANG='en';
const T=k=>L[LANG][k];

/* ---- 轨道常量 ---- */
const X0=300, PITCH=21.5, CW=16, CH=27;
const N_TRACK=48;     // 两条轨道等长, 只看走到哪一步
const PAUSE=19;       // 具备该能力的一次, 在第 19 次交互停下来
const N_ANS=30;       // 之后跑到第 30 次交互拿到答案

function colBase(i){return i<=8?P.grey:P.red;}
function colVerify(i){
  if(i<=8)return P.grey;
  if(i<=18)return P.red;
  if(i===19)return P.amber;
  return P.mint;
}
/* 画面里的检索词取自真实记录 */
const QUERIES=[['actor married actress 1980s divorced first wife actress police commissioner film',P.muted,''],
               ['Bruce Willis police commissioner film role',P.red,'noProgress'],
               ['Demi Moore brother died 2001 2002 2003 2004 2005',P.red,'noInfo']];

const STAGES=[
 {key:'question',start:0,    end:6.4},
 {key:'stuck',   start:6.4,  end:14.2},
 {key:'audit',   start:14.2, end:22.0},
 {key:'chain',   start:22.0, end:29.6}];
const DURATION=STAGES[STAGES.length-1].end;
function stageAt(t){const i=STAGES.findIndex(s=>t>=s.start&&t<s.end);return i<0?(t<0?0:STAGES.length-1):i;}

class Film{
 constructor(t,opts={}){
   this.t=clamp(t,0,DURATION-1e-5);
   this.i=stageAt(this.t);
   this.st=STAGES[this.i];
   this.u=this.t-this.st.start;
   this.fx=opts.effects!==false;
 }
 text(s,x,y,z=23,col=P.ink,weight=450,align='start',font=F){
   return `<text x="${x}" y="${y}" font-family="${font}" font-size="${z}" font-weight="${weight}" fill="${col}" text-anchor="${align}">${esc(s)}</text>`;}
 rect(x,y,w,h,fill=P.panel,stroke=P.edge,r=16){
   return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;}
 line(x,y,xx,yy,col=P.edge,width=1,dash=''){
   return `<path d="M${x} ${y}L${xx} ${yy}" fill="none" stroke="${col}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`;}
 dot(x,y,r=3,col=P.purple,a=1){
   return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}" fill="${col}" opacity="${a.toFixed(3)}"/>`;}
 group(s,a=1,dx=0,dy=0){return `<g opacity="${clamp(a).toFixed(3)}" transform="translate(${dx} ${dy})">${s}</g>`;}
 reveal(s,d=0,span=.6){const p=ramp(this.u,d,d+span);return this.group(s,p,0,(1-p)*13);}
 icon(k,x,y,size=23,col=P.purple){
   const paths={search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
     check:'<path d="m4 12 5 5L20 5"/>',cross:'<path d="m5 5 14 14M5 19 19 5"/>',
     pause:'<path d="M9 5v14M15 5v14"/>',think:'<path d="M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3Zm-3 18h6"/>'};
   return `<g transform="translate(${x} ${y}) scale(${size/24})" fill="none" stroke="${col}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[k]||paths.check}</g>`;}
 badge(k,x,y,r=13,col=P.mint){
   return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}22" stroke="${col}66" stroke-width="1"/>`+
          this.icon(k,x-r*.62,y-r*.62,r*1.24,col);}
 chip(s,x,y,w,col=P.purple){
   return this.rect(x,y,w,35,col+'10',col+'40',17)+this.dot(x+16,y+17,3,col)+this.text(s,x+29,y+24,18,col,500);}
 panel(x,y,w,h,label,tag=''){
   return this.rect(x,y,w,h,'#ffffffeb',P.edge,19)+this.text(label,x+26,y+39,22,P.ink,500)+
     (tag?this.text(tag,x+w-26,y+38,17,P.dim,450,'end'):'')+this.line(x+24,y+57,x+w-24,y+57);}
 title(s,sub=''){
   return this.text(s,64,205,43,P.ink,500)+(sub?this.text(sub,66,248,23,P.muted):'');}
 measure(s,size){let w=0;for(const ch of s)w+=ch.codePointAt(0)>0x2e80?size:size*.53;return w;}

 track(y,shown,colf,total=N_TRACK){
   let s='';
   for(let i=0;i<total;i++)
     s+=`<rect x="${X0+i*PITCH}" y="${y}" width="${CW}" height="${CH}" rx="3" fill="${i<shown?colf(i):'#eef2f8'}"/>`;
   return s;
 }
 pauseMark(y,label=''){
   const px=X0+PAUSE*PITCH+CW/2;
   return this.line(px,y+CH+4,px,y+CH+22,P.amber,2.5)+
     `<circle cx="${px}" cy="${y+CH+34}" r="11" fill="${P.amber}22" stroke="${P.amber}" stroke-width="1.5"/>`+
     this.icon('pause',px-7,y+CH+27,14,P.amber)+
     (label?this.text(label,px+22,y+CH+41,19,P.amber,500):'');
 }

 background(){
   let s=this.rect(0,0,1600,900,P.bg,'none',0)+`<rect width="1600" height="900" fill="url(#aura)"/>`;
   for(let n=0;n<74;n++){
     const x=hash(n+1)*1600;
     const y=(hash(n+219)*900+(this.fx?this.t:0)*(1+hash(n)*2))%900;
     s+=this.dot(x,y,n%7===0?1.4:.8,P.purple,.05+hash(n+77)*.11);
   }
   let d='';
   for(let x=64;x<1580;x+=84)d+=`M${x} 120V744`;
   for(let y=154;y<746;y+=84)d+=`M64 ${y}H1536`;
   return s+`<path d="${d}" stroke="#461fb2" opacity=".025" stroke-width=".7" fill="none"/>`;
 }
 chrome(){ return ''; }   /* 步骤条与品牌都在画面外, 交给页面本身 */
 rail(){
   /* 进度由播放器下方的进度条负责, 这里只放图例。
      第一幕还没有方块, 图例没有对应物, 不显示 */
   if(this.st.key==='question')return '';
   let s=this.line(64,762,1536,762,'#e9eef7',1);
   const cols=[P.grey,P.red,P.amber,P.mint];
   T('legend').forEach((label,j)=>{
     const x=64+j*300;
     s+=`<rect x="${x}" y="803" width="14" height="16" rx="3" fill="${cols[j]}"/>`+
        this.text(label,x+25,817,20,P.muted,450);
   });
   return s;
 }

 scQuestion(){
   let s=this.title(T('qTitle'),T('qSub'));
   s+=this.panel(64,310,1472,408,'BrowseComp','');
   T('q').forEach((ln,j)=>{
     const last=j===3;
     s+=this.reveal(
       this.dot(112,412+j*74,last?4:3,last?P.amber:P.purple,last?1:.62)+
       this.text(ln,136,421+j*74,last?31:28,last?P.ink:P.muted,last?550:450),
       j*.62);
   });
   s+=this.reveal(this.chip(T('hop1'),64,772,this.measure(T('hop1'),18)+60,P.purple)+
                  this.chip(T('hop2'),this.measure(T('hop1'),18)+140,772,this.measure(T('hop2'),18)+60,P.purple)+
                  this.chip(T('hop3'),this.measure(T('hop1'),18)+this.measure(T('hop2'),18)+236,772,
                            this.measure(T('hop3'),18)+60,P.amber),
                  2.4);
   return s;
 }

 scTrack(audit){
   const u=this.u;
   let s=this.title(T('tTitle'),T('tSub'));
   const R1=318,R2=436;
   const n1=audit?Math.round(lerp(19,N_TRACK,ramp(u,.1,4.6))):Math.round(ramp(u,0,2.6)*19);
   const n2=audit?PAUSE+1:Math.round(ramp(u,0,2.6)*PAUSE);
   s+=this.text(T('off'),280,R1+20,21,P.muted,450,'end');
   s+=this.text(T('on'),280,R2+20,21,P.ink,550,'end');
   s+=this.track(R1,n1,colBase);
   s+=this.track(R2,n2,colVerify);
   if(!audit){
     s+=this.reveal(this.text(T('stuckHint'),X0+9*PITCH,R1-22,21,P.red,450),1.2);
     QUERIES.forEach(([q,col,noteKey],j)=>{
       const y=568+j*62;
       const w=this.measure(q,22)+44;
       s+=this.reveal(
         this.rect(X0,y-26,w,44,col===P.red?'#f0f4f9':'#f0f4f9',col===P.red?P.red+'55':P.edge,11)+
         this.icon('search',X0+18,y-13,20,col===P.red?P.red:P.dim)+
         this.text(q,X0+50,y+4,22,col===P.red?P.ink:P.muted,450)+
         (noteKey?this.text(T(noteKey),X0+w+18,y+4,21,P.red,450):''),
         2.6+j*.66);
     });
     s+=this.reveal(this.text(T('stuckFoot'),X0,762,22,P.muted,450),5.1);
   }else{
     s+=this.pauseMark(R2);
     const bx=640, by=540, bw=900;
     const lines=Math.min(3,Math.floor(ramp(u,.35,4.2)*3.999));
     if(lines>0){
       let b=this.rect(bx,by,bw,46+lines*44,'#f0f4f9',P.amber+'70',15);
       const tip=X0+PAUSE*PITCH+CW/2;
       b+=`<path d="M${tip-15} ${by}l15-17 15 17Z" fill="${P.amber}"/>`;
       T('bubble').slice(0,lines).forEach((ln,j)=>{
         b+=this.text(ln,bx+30,by+52+j*44,j===0?27:22,j===0?P.amber:P.ink,j===0?600:450);
       });
       s+=b;
     }
     if(lines>=3){
       s+=this.reveal(this.rect(64,572,5,84,P.amber,'none',3)+
                      this.icon('think',84,586,26,P.amber)+
                      this.text(T('sideA'),120,604,21,P.muted)+
                      this.text(T('sideB'),120,640,21,P.muted),0);
     }
     s+=this.reveal(this.text(T('offFoot'),X0,762,22,P.red,450),5.4);
   }
   return s;
 }

 scChain(){
   const u=this.u;
   let s=this.title(T('cTitle'),'');
   const ty=268;
   const cells=Math.min(N_ANS,PAUSE+1+Math.floor(ramp(u,.2,4.4)*(N_ANS-PAUSE-1)+1e-6));
   s+=this.text(T('on'),280,ty+20,21,P.ink,550,'end');
   s+=this.track(ty,cells,colVerify);
   s+=this.pauseMark(ty,T('reflect'));
   if(cells>PAUSE+1)
     s+=this.text(T('cGrow'),X0+PAUSE*PITCH+CW+12,ty-18,21,P.mint,450);
   if(cells>=N_ANS)s+=this.badge('check',X0+N_ANS*PITCH+22,ty+CH/2,14,P.mint);
   T('chain').forEach((label,j)=>{
     const y=396+j*84, last=j===3;
     s+=this.reveal(
       this.rect(280,y,1040,64,last?'#f1f4fa':'#ffffffdd',last?P.mint+'66':P.edge,14)+
       this.dot(318,y+32,last?5:4,last?P.mint:P.purple,last?1:.7)+
       this.text(label,346,y+40,25,last?P.ink:P.muted,last?550:450)+
       (last?this.badge('check',1270,y+32,14,P.mint):''),
       .4+j*.9);
     if(j<3)s+=this.reveal(this.line(800,y+66,800,y+80,P.edge,1.4),.9+j*.9);
   });
   s+=this.reveal(
     this.line(280,752,1320,752,P.edge,1)+
     this.badge('cross',300,784,12,P.red)+
     this.text(T('cmpOff'),328,791,21,P.muted,450)+
     this.badge('check',860,784,12,P.mint)+
     this.text(T('cmpOn'),888,791,21,P.mint,450),
     4.2);
   return s;
 }

 body(){
   switch(this.st.key){
     case 'question': return this.scQuestion();
     case 'stuck':    return this.scTrack(false);
     case 'audit':    return this.scTrack(true);
     default:         return this.scChain();
   }
 }
 render(){
   const defs=`<defs><radialGradient id="aura" cx="72%" cy="42%" r="72%">`+
     `<stop stop-color="#c6d4e5" stop-opacity=".17"/>`+
     `<stop offset=".65" stop-color="#e9eff7" stop-opacity=".05"/>`+
     `<stop offset="1" stop-color="#f5f8fc" stop-opacity="0"/></radialGradient></defs>`;
   const alpha=.25+.75*ramp(this.u,0,.33);
   return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" `+
     `role="img" aria-label="${esc(T('chapters')[this.i])}">${defs}${this.background()}${this.chrome()}`+
     `${this.group(this.body(),alpha,0,-104)}${this.rail()}</svg>`;
 }
}
function renderSVG(t,opts={}){return new Film(t,opts).render();}
root.VerifyFilm={renderSVG,STAGES,DURATION,stageAt,
                 setLang(l){LANG=l;},
                 chapters:()=>T('chapters')};
})(typeof window!=='undefined'?window:globalThis);
