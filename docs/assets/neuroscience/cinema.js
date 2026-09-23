/* Deterministic visual reconstruction of the saved research workflow.
   Timings are editorial; this is not a recording of model calls or runtime. */
class ScienceMotionFilm {
  constructor(canvas) {
    if(D.run!==BRAIN_MAPS.run||D.resultVersion!==BRAIN_MAPS.resultVersion)throw new Error('Film and page results must come from the same run.');
    canvas.dataset.resultVersion=D.resultVersion;canvas.dataset.sourceRun=D.run;
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.duration=FILM_DURATION;this.time=0;this.frames=0;this.costs=[];
    this.colors=['#c5a9ff','#a6b5ff','#e9b8d7','#80d5c9','#f4d1a4'];
    this.cues=[
      {start:0,end:3.2,id:'question',zh:['小鼠大脑，如何组织不同任务信息？','图案、选择与反馈，怎样在全脑中联系起来？'],en:['How does the mouse brain organize task information?','How are stimulus, choice and feedback related across the brain?']},
      {start:3.2,end:6.5,id:'data',zh:['从真实数据，开始探索。','59 个输入文件 · 8 个实验室 · 29 组记录探针'],en:['Start with the real data.','59 input files · 8 laboratories · 29 recording probes']},
      {start:6.5,end:10.2,id:'flow',zh:['让分析，接着问题往前走。','比较关系 → 提取主轴 → 随机参照检验'],en:['Move the question forward.','Compare relationships → Extract an axis → Test against shuffled data']},
      {start:10.2,end:14.2,id:'pattern',zh:['五类信息，一条主要统计轴。','不同信息在脑区间，呈现一致的变化趋势。'],en:['Five measures. One principal axis.','Different measures rise and fall together across brain regions.']},
      {start:14.2,end:17.2,id:'separate',zh:['这条线索，与运动有关。','选择信息的脑区差异，与转轮运动指标密切相关。'],en:['A connection to movement.','Regional variation in choice coding is associated with wheel movement.']},
      {start:17.2,end:19.5,id:'atlas',zh:['同一套脑区，读出不同信息。','同样五类指标，比较数值与排名的编码结构。'],en:['One anatomy. Different analytical views.','Compare value-based and rank-based coding structure across five measures.']},
      {start:19.5,end:22.1,id:'residuals',zh:['考虑运动后，区域差异仍然可见。','选择、刺激与反馈，各自留下怎样的区域分布？'],en:['Regional differences remain after movement adjustment.','What remains for choice, stimulus and feedback?']},
      {start:22.1,end:28.1,id:'closing',zh:['让结果，回答科学问题。','小鼠大脑，如何组织不同任务信息？'],en:['An answer to the scientific question.','How does the mouse brain organize different task information?']}
    ];
    this._makeAtlas();this._makeParticles();this.resize();
    // Maps use saved numerical values; original PNGs load only in the gallery.
    this.ready=document.fonts.ready.then(()=>this.render(this.time));
    this.observer=new ResizeObserver(()=>{this.resize();if(canvas.getBoundingClientRect().width>0)this.render(this.time)});this.observer.observe(canvas);
  }
  clamp(n){return Math.max(0,Math.min(1,n))}
  smooth(n){n=this.clamp(n);return n*n*n*(n*(n*6-15)+10)}
  ramp(t,a,b){return this.smooth((t-a)/(b-a))}
  mix(a,b,p){return a+(b-a)*p}
  window(t,a,b,c,d){return this.ramp(t,a,b)*(1-this.ramp(t,c,d))}
  hash(n){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)}
  storyTime(t){return t}
  resize(){
    const rect=this.canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
    this.portrait=rect.width/rect.height<.85;this.W=this.portrait?1080:1920;this.H=this.portrait?1680:1080;
    const dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);
    this.scale=Math.min(this.canvas.width/this.W,this.canvas.height/this.H);this.ox=(this.canvas.width-this.W*this.scale)/2;this.oy=(this.canvas.height-this.H*this.scale)/2;
  }
  _mapColor(key,value){
    if(!Number.isFinite(value))return '#191d29';
    const {scale:[lo,hi],palette}=BRAIN_MAPS.layers[key],u=this.clamp((value-lo)/(hi-lo))*(palette.length-1),i=Math.min(palette.length-2,Math.floor(u));
    const rgb=s=>s.slice(1).match(/../g).map(x=>parseInt(x,16)),a=rgb(palette[i]),b=rgb(palette[i+1]);
    return `rgb(${a.map((v,j)=>Math.round(this.mix(v,b[j],u-i))).join(',')})`;
  }
  _makeAtlas(){
    if(ScienceMotionFilm.mapCache){this.maps=ScienceMotionFilm.mapCache;this.atlas=this.maps.F;return}
    const [bx,by,bw,bh]=D.atlas.bbox;this.maps={};
    for(const [key,layer] of Object.entries(BRAIN_MAPS.layers)){
      const a=document.createElement('canvas');a.width=800;a.height=Math.ceil(800*bh/bw);const c=a.getContext('2d');c.scale(800/bw,800/bw);c.translate(-bx,-by);
      for(const p of D.atlas.paths){c.fillStyle=layer.colors[p.acr]||'#191d29';c.strokeStyle='#b6a8d54c';c.lineWidth=.16;const path=new Path2D(p.d);c.fill(path);c.stroke(path)}
      this.maps[key]=a;
    }
    this.atlas=this.maps.F;ScienceMotionFilm.mapCache=this.maps;
  }
  // All views retain the same anatomy while their saved regional values differ.
  _mapPose(key,t){
    const P=this.portrait,split=this.ramp(t,17.9,19.2),fan=this.ramp(t,19.2,20.6),report=this.ramp(t,22.1,23.35),i='HIJ'.indexOf(key);
    const origin=P?[540,1050,610]:[1335,650,522];let pair,spread,final;
    if(i<0){
      const first=key==='F';
      pair=P?[first?320:760,1030,310]:[first?1080:1565,620,285];
      spread=P?[first?330:750,975,238]:[first?1080:1565,525,210];
      final=P?[first?325:755,1060,215]:[first?1290:1660,525,198];
    }else{
      pair=origin;
      spread=P?[[220,540,860][i],1330,196]:[[975,1290,1610][i],818,160];
      final=P?[[220,540,860][i],1390,155]:[[1225,1480,1735][i],812,156];
    }
    return origin.map((v,n)=>this.mix(this.mix(this.mix(v,pair[n],split),spread[n],fan),final[n],report));
  }
  _scaleBar(key,x,y,width=118){
    const c=this.ctx,pc1=key==='F'||key==='G',[lo,hi]=BRAIN_MAPS.layers[key].scale,g=c.createLinearGradient(x-width/2,y,x+width/2,y);
    for(let i=0;i<=10;i++)g.addColorStop(i/10,this._mapColor(key,this.mix(lo,hi,i/10)));
    c.fillStyle=g;c.fillRect(x-width/2,y,width,5);
    this.text(pc1?String(lo):'≤ '+lo,x-width/2-14,y+10,17,'#b6a8c8','right');this.text(pc1?'+'+hi:'≥ +'+hi,x+width/2+14,y+10,17,'#b6a8c8');
    this.text(pc1?'PC1':(LANG==='en'?'Standardized residual':'标准化残差'),x+width/2+86,y+10,17,'#927f9e');
  }
  _mapStory(t){
    const c=this.ctx,P=this.portrait,EN=LANG==='en',anatomy=this.ramp(t,17.1,19.0),fan=this.ramp(t,19.2,20.6),report=this.ramp(t,22.1,23.35);
    const labels=EN?{F:'F · Main coding axis',G:'G · Rank-based coding axis',H:'H · Choice',I:'I · Stimulus',J:'J · Feedback'}:{F:'F · 主要编码结构',G:'G · 排名编码结构',H:'H · 选择',I:'I · 刺激',J:'J · 反馈'};
    // The atlas opens into a constellation; the same views then settle into a report.
    for(const key of 'FGHIJ'){
      const alpha=key==='F'?anatomy:key==='G'?this.ramp(t,18.0,19.1):this.ramp(t,19.25+'HIJ'.indexOf(key)*.10,20.45);
      this.withAlpha(alpha,()=>{
        const [x,y,w]=this._mapPose(key,t),im=this.maps[key],h=w*im.height/im.width;
        c.save();c.shadowColor=key==='F'||key==='G'?'#9564ff35':'#63d1bf25';c.shadowBlur=24; c.drawImage(im,x-w/2,y-h/2,w,h);c.restore();
        const reveal=key==='F'?this.ramp(t,17.4,18.6):key==='G'?this.ramp(t,18.15,19.4):this.ramp(t,19.5+'HIJ'.indexOf(key)*.1,20.9);
        this.withAlpha(Math.sin(reveal*Math.PI)*.6,()=>{const yy=y-h/2+h*reveal;this.line(x-w*.6,yy,x+w*.6,yy,key==='F'||key==='G'?'#d4b8ff':'#9eebd5',1.4)});
        const structural=key==='F'||key==='G';
        const settling=P?1-this.window(t,22.0,22.2,23.2,23.5):1;
        this.withAlpha(settling*this.ramp(t,structural?18.8:20.15,structural?19.3:20.65),()=>this.text(labels[key],x,y-h/2-24,P?25:24,'#dacbe9','center',450,w+100));
      });
    }
    this.withAlpha(this.ramp(t,20.55,20.9),()=>{
      this._scaleBar('F',P?330:this.mix(1080,1290,report),P?1160+report*46:655,P?110:82);
      this._scaleBar('G',P?750:this.mix(1565,1660,report),P?1160+report*46:655,P?110:82);
      this._scaleBar('H',P?540:this.mix(1290,1480,report),P?1500+report*26:940,P?190:144);
      this.text(D.resultVersion+(EN?' original colors · IBL / Allen anatomy':' 原图配色 · IBL / Allen 解剖图谱'),P?540:1475,P?1574:969,P?19:17,'#746780','center');
    });
    this.withAlpha(anatomy*(1-fan),()=>this.text('IBL / ALLEN ATLAS',P?540:1335,P?1500:981,P?22:19,'#9581a7','center'));
  }
  _reportSurface(t){
    const a=this.ramp(t,22.1,23.0),P=this.portrait;
    this.withAlpha(a,()=>{this.box(P?55:62,354,P?970:1796,P?1246:623,26,'#11121ee8','#b79ae45c');
      const c=this.ctx,g=c.createLinearGradient(P?80:95,370,P?1000:1080,920);g.addColorStop(0,'#9871d313');g.addColorStop(1,'#9871d300');this.box(P?70:77,369,P?940:1000,P?476:590,18,g,null);
      if(!P)this.line(1090,389,1090,943,'#b394d428');
    });
  }
  _reportCopy(t){
    const a=this.ramp(t,22.5,23.4),P=this.portrait,EN=LANG==='en',x=P?95:105,w=P?895:938;
    this.withAlpha(a,()=>{
      this.text(EN?'RESEARCH BRIEF':'研究结论摘要',x,P?410:408,21,'#a995c1','left',450,w);
      const lines=EN?['Task information shares','a regional coding structure','associated with movement.']:['不同任务信息，','呈现与运动相关的','共享编码结构。'];
      lines.forEach((s,i)=>this.text(s,x,(P?489:484)+i*(P?62:59),P?54:53,i===2?'#d2b5ff':'#f0e7fb','left',500,w));
      const stats=[[pct(D.pc1)+'%',EN?'Variance in one axis':'一条主轴概括的总方差'],[pct(D.r2.choice)+'%',EN?'Choice R² with movement':'选择指标的运动解释比例'],['H / I / J',EN?'Residual regional maps':'运动调整后的区域分布']];
      stats.forEach(([value,label],i)=>{const xx=x+i*w/3,yy=P?701:734;this.line(xx,yy-54,xx+w/3-25,yy-54,'#b895e445');this.text(value,xx,yy,P?43:46,i===1?'#9cddc9':'#ccb4f1','left',450,w/3-24);this.text(label,xx,yy+40,P?21:22,'#a695b9','left',400,w/3-25)});
      this.text(EN?'NEXT QUESTION':'下一步研究',x,P?801:857,18,'#91baa9');
      this.text(EN?'Which regional differences should experiments test next?':'哪些脑区的差异，值得进一步实验检验？',x,P?841:898,P?28:31,'#c5d6d0','left',450,w);
      this.text(EN?'Summary of saved results · AGENTS-A1.5 × SEEKBRAIN':'基于本次运行结果整理 · AGENTS-A1.5 × SEEKBRAIN',x,P?876:943,P?18:18,'#7f718f','left',400,w);
    });
  }
  text(s,x,y,size=28,color='#f0eaf8',align='left',weight=450,maxWidth){
    const c=this.ctx;c.save();c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';s=T(s);c.font=`${weight} ${size}px Showcase,Arial,sans-serif`;
    if(maxWidth&&c.measureText(s).width>maxWidth){size*=maxWidth/c.measureText(s).width;c.font=`${weight} ${size}px Showcase,Arial,sans-serif`}
    c.fillText(s,x,y);c.restore();
  }
  box(x,y,w,h,r=14,fill='#14121e',stroke='#bc9bea30'){
    const c=this.ctx;c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke()}
  }
  line(x1,y1,x2,y2,color='#bea5ee',width=1){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()}
  withAlpha(a,fn){if(a<.002)return;this.ctx.save();this.ctx.globalAlpha*=a;fn();this.ctx.restore()}
  _makeParticles(){
    if(ScienceMotionFilm.particleCache){this.particles=ScienceMotionFilm.particleCache;return}
    const [bx,by,bw,bh]=D.atlas.bbox,ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.style.cssText='position:absolute;width:1px;height:1px;visibility:hidden;pointer-events:none';document.body.append(svg);
    const shapes={};D.atlas.paths.forEach(p=>{if(!regionByAcr[p.acr])return;const el=document.createElementNS(ns,'path');el.setAttribute('d',p.d);svg.append(el);const box=el.getBBox();(shapes[p.acr]||=[]).push({box,path:new Path2D(p.d)})});
    const sampler=document.createElement('canvas').getContext('2d'),particles=[];
    D.regions.forEach((r,i)=>{for(let j=0;j<5;j++){
      const id=i*5+j,u=i/(D.regions.length-1),theta=u*Math.PI*8+j*.64,seed=this.hash(id+15),v=r.values[j];
      let target=null;const candidates=shapes[r.acr];if(candidates){const shape=candidates[j%candidates.length],b=shape.box;for(let k=0;k<80;k++){const x=b.x+this.hash(id*89+k*2+1)*b.width,y=b.y+this.hash(id*89+k*2+2)*b.height;if(sampler.isPointInPath(shape.path,x,y)){target=[(x-bx)/bw*2-1,(y-by)/bh*2-1,0];break}}}
      const radius=.57+.34*seed,phi=u*Math.PI*2+j*1.25;
      const states=[
        [Math.cos(phi)*radius,Math.sin(phi)*radius*.76,Math.sin(phi+j)*.45],
        [(j%3-1)*.62+(u-.5)*.45,(Math.floor(j/3)-.4)*.8+Math.sin(u*16)*.09+(seed-.5)*.35,(seed-.5)*.8],
        [(u-.5)*1.85,(j-2)*.31+Math.sin(u*6.28+j*.2)*.08,(v-.2)*2],
        [(u-.5)*1.86,Math.sin(theta)*.18+(r.pc1/9)*.13,Math.cos(theta)*.42],
        [(u-.5)*1.85,Math.sin(u*6.28)*.2+(j<3?-1:1)*(.1+.26*Math.sin(u*Math.PI)),Math.cos(u*6.28)*.24],
        target||[0,0,0]
      ];
      particles.push({id,i,j,u,seed,states,mapped:!!target,pc1:r.pc1});
    }});svg.remove();this.particles=particles;ScienceMotionFilm.particleCache=particles;
  }
  _scene(t){
    const knots=[0,5.1,8.5,12.0,15.9,19.0];let stage=0;while(stage<knots.length-2&&t>knots[stage+1])stage++;
    const blend=this.ramp(t,knots[stage]+.8,knots[stage+1]);return{stage,blend,anatomy:this.ramp(t,17.1,19.0),late:this.ramp(t,21.2,23.5)};
  }
  _point(p,t,scene){
    const {stage,blend,anatomy,late}=scene,a=p.states[stage],b=p.states[stage+1];
    let x=this.mix(a[0],b[0],blend),y=this.mix(a[1],b[1],blend),z=this.mix(a[2],b[2],blend);
    const spin=(.16*Math.sin(t*.26)+.07*Math.cos(t*.39))*(1-anatomy),cs=Math.cos(spin),sn=Math.sin(spin);
    const xx=x*cs-z*sn,zz=x*sn+z*cs;
    y+=Math.sin(p.u*11+t*.72+p.j*.7)*.045*(1-anatomy);
    const perspective=1+zz*.17,cx=this.portrait?540:1335,cy=this.portrait?1050:650;
    const rx=this.portrait?425:435,ry=this.portrait?330:302,scale=1-late*.08;
    return {x:cx+xx*rx*perspective*scale,y:cy+y*ry*perspective*scale,r:(1.3+p.seed*1.5)*(1+zz*.3),alpha:p.mapped?1:1-anatomy};
  }
  _background(t){
    const c=this.ctx;c.fillStyle='#080a10';c.fillRect(0,0,this.W,this.H);
    const cx=this.portrait?540:1290,cy=this.portrait?1050:655,g=c.createRadialGradient(cx,cy,0,cx,cy,this.portrait?650:730);g.addColorStop(0,'#6d478827');g.addColorStop(.5,'#43286012');g.addColorStop(1,'#080a1000');c.fillStyle=g;c.fillRect(0,0,this.W,this.H);
    for(let i=0;i<90;i++){c.fillStyle=`rgba(202,174,255,${.025+this.hash(i)*.055})`;c.fillRect(this.hash(i+3)*this.W,(this.hash(i+9)*this.H+t*1.2)%this.H,1.1,1.1)}
    c.save();c.translate(cx,cy);c.rotate(-.27+t*.006);for(let j=0;j<3;j++){c.strokeStyle=`rgba(153,120,207,${.095-j*.019})`;c.lineWidth=1;c.beginPath();c.ellipse(0,0,(this.portrait?465:530)+j*40,245+j*32,0,0,Math.PI*2);c.stroke()}c.restore();
  }
  _header(t){
    const P=this.portrait,pad=P?65:85;this.text(D.model.toUpperCase()+' · '+D.resultVersion,pad,62,P?26:22,'#e0cff5','left',550);this.text('RESEARCH IN MOTION',this.W-pad,62,P?17:17,'#8e799f','right');
    const names=LANG==='en'?['QUESTION','INPUT DATA','ANALYSIS','ANATOMY','FINDING']:['研究问题','输入数据','自主分析','解剖定位','科学发现'];
    const stage=t<3.2?0:t<6.5?1:t<17.2?2:t<22.1?3:4,width=(this.W-2*pad)/5;
    names.forEach((s,i)=>{const x=pad+i*width;this.line(x,111,x+width-16,111,i<=stage?'#ab87e3':'#51405e55',i===stage?3:1);this.text(s,x,147,P?20:18,i===stage?'#dcc8fa':'#71667c')});
    // Headlines roll through a masked slot; particle motion never cuts between chapters.
    this.cues.forEach(cue=>{
      const enter=this.ramp(t,cue.start-.4,cue.start+.4),leave=cue.id==='closing'?0:this.ramp(t,cue.end-.4,cue.end+.4),a=enter*(1-leave);if(a<.001)return;
      const copy=cue[LANG==='en'?'en':'zh'];this.withAlpha(a,()=>{
        const c=this.ctx;c.save();c.beginPath();c.rect(pad,178,this.W-2*pad,88);c.clip();this.text(copy[0],pad,242+(1-enter)*100-leave*100,P?46:58,'#f2eafa','left',500,this.W-2*pad);c.restore();
        c.save();c.beginPath();c.rect(pad,272,this.W-2*pad,45);c.clip();this.text(copy[1],pad,303+(1-enter)*62-leave*62,P?25:27,'#a899b9','left',400,this.W-2*pad);c.restore();
      });
    });
    const cue=[...this.cues].reverse().find(q=>t>=q.start)||this.cues[0];if(this.canvas.dataset.cue!==cue.id){this.canvas.dataset.cue=cue.id;this.canvas.setAttribute('aria-label',cue[LANG==='en'?'en':'zh'].join(' '))}
  }
  _field(t){
    const c=this.ctx,scene=this._scene(t),prior=this._scene(Math.max(0,t-.09)),P=this.portrait,cx=P?540:1335,cy=P?1050:650;
    // Anatomical geometry is the saved Panel F contour. It emerges under the same particles.
    this._mapStory(t);
    if(t>=19.5)return;
    c.save();c.globalCompositeOperation='lighter';
    const particleFade=1-this.ramp(t,17.8,19.4);
    // A persistent luminous filament supplies a visual spine during all transformations.
    for(let j=0;j<5;j++){
      const a=(1-scene.anatomy)*.27;if(a<.001)break;c.strokeStyle=this.colors[j];c.globalAlpha=a;c.lineWidth=.8;c.beginPath();
      for(let i=0;i<D.regions.length;i++){const p=this._point(this.particles[i*5+j],t,scene);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y)}c.stroke();
    }
    for(const p of this.particles){let pos=this._point(p,t,scene);if(pos.alpha<.002)continue;
      // Fit the particles precisely into the atlas aspect ratio as it appears.
      const fitx=P?610/(425*2):522/(435*2),fity=P?(610*this.atlas.height/this.atlas.width)/(330*2):(522*this.atlas.height/this.atlas.width)/(302*2);
      pos.x=cx+(pos.x-cx)*this.mix(1,fitx,scene.anatomy);pos.y=cy+(pos.y-cy)*this.mix(1,fity,scene.anatomy);
      const prev=this._point(p,Math.max(0,t-.09),prior);prev.x=cx+(prev.x-cx)*this.mix(1,fitx,prior.anatomy);prev.y=cy+(prev.y-cy)*this.mix(1,fity,prior.anatomy);
      const color=this.colors[p.j],pulse=.75+.25*Math.sin(t*2+p.u*9);c.strokeStyle=color;c.fillStyle=color;c.globalAlpha=particleFade*pos.alpha*.3*(1-scene.anatomy*.7);c.lineWidth=pos.r*.65;c.beginPath();c.moveTo(prev.x,prev.y);c.lineTo(pos.x,pos.y);c.stroke();
      c.globalAlpha=particleFade*pos.alpha*(.48+p.seed*.45)*(1-scene.anatomy*.68)*pulse;c.beginPath();c.arc(pos.x,pos.y,pos.r,0,Math.PI*2);c.fill();
      if(p.id%47===0){c.globalAlpha=particleFade*pos.alpha*.06*(1-scene.anatomy*.65);c.beginPath();c.arc(pos.x,pos.y,14+4*Math.sin(t+p.seed),0,Math.PI*2);c.fill()}
    }c.restore();
    // Five captions remain attached to the live strands instead of replacing them.
    const labelAlpha=this.window(t,6.0,7.3,12,13.4);this.withAlpha(labelAlpha,()=>{const labels=LANG==='en'?['Stimulus','Choice','Feedback','Speed','Velocity']:['图案位置','转轮选择','结果反馈','转轮速度','方向与速度'];labels.forEach((s,j)=>this.text(s,P?78:900,(P?1048:650)+(j-2)*(P?101:94),P?21:21,this.colors[j],'right'))});
    this.withAlpha(this.window(t,10.7,12,15.9,17.3),()=>{this.text('PC1',P?955:1790,P?1060:660,P?30:28,'#d8bcff','right');this.line(P?110:900,P?1170:765,P?966:1790,P?1170:765,'#ad8dd832',1)});

  }
  _note(t,a,b,c,d,draw){this.withAlpha(this.window(t,(a+b)/2,b,c,(c+d)/2),draw)}
  _annotations(t){
    const P=this.portrait,x=P?70:90,y=P?440:475,w=P?940:620,EN=LANG==='en';
    this._note(t,-1,0,2.7,3.8,()=>{
      this.text(EN?'A scientific question':'一个科学问题',x,y,EN?45:47,'#d6bee9','left',450,w);
      const lines=EN?['Seeing. Choosing. Receiving feedback.','How are these signals related?']:['看见、选择、获得反馈。','这些信息在全脑中，怎样关联？'];lines.forEach((s,i)=>this.text(s,x,y+72+i*46,P?27:30,'#a593b7','left',400,w));
      this.text('AGENTS-A1.5 × SEEKBRAIN',x,y+225,20,'#8e76a4');
    });
    this._note(t,2.7,3.8,6.0,7.0,()=>{
      this.text('59',x,y+72,P?115:145,'#dec7fb','left',440);this.text(EN?'provided input files':'个提供的输入文件',x+(P?190:238),y+63,28,'#aa95c1');
      const fs=[['CSV','region_info.csv','279 × 23'],['NPY','channels.mlapdv.npy','29 × (384 × 3)'],['NPY','channels.brainLocationIds_ccf_2017.npy','29 × 384']];
      fs.forEach(([kind,name,shape],i)=>{const yy=y+145+i*73;this.line(x,yy+45,x+w,yy+45,'#b597d02b',1);this.text(kind,x,yy+5,18,'#9c80be');this.text(name,x+70,yy+5,P?23:21,'#c2acd7','left',420,w-170);this.text(shape,x+w,yy+29,17,'#6f8f8b','right')});
    });
    this._note(t,6.0,7.0,9.7,10.8,()=>{
      this.text(EN?'The agent connects the steps.':'让研究，连续向前。',x,y,P?40:43,'#d7c2f0','left',450,w);
      const labels=EN?['Read and align regional measures','Extract the main statistical axis','Check against shuffled references']:['读取数据，关联脑区指标','比较关系，提取主要统计轴','建立随机参照，检验结构'];
      labels.forEach((s,i)=>{const yy=y+75+i*77,p=this.ramp(t,6.5+i*.6,7.3+i*.6);this.text(p>.9?'✓':'0'+(i+1),x,yy,25,p>.9?'#91d4c3':'#665876');this.text(s,x+50,yy,P?26:27,'#b7a6c7','left',420,w-50);this.line(x+50,yy+21,x+50+(w-60)*p,yy+21,'#9bcdb650',1.2)});
    });
    this._note(t,9.7,10.8,13.7,14.8,()=>{
      this.text(pct(D.pc1)+'%',x,y+86,P?120:150,'#dcc5ff','left',440,w);this.text(EN?'Variance captured by one principal axis':'一条主轴，概括的指标总方差',x,y+154,P?27:28,'#c1acce','left',400,w);
      const bw=P?720:w;this.box(x,y+207,bw,13,5,'#241c31',null);this.box(x,y+207,bw*D.pc1,13,5,'#b28de9',null);
      this.text((EN?'Shuffled mean: ':'随机参照均值：')+pct(D.nullMean)+'%',x,y+263,24,'#8c7a9d');this.text(D.permutations.toLocaleString('en-US')+(EN?' permutations':' 次随机置换'),x,y+307,22,'#756384');
    });
    this._note(t,13.7,14.8,16.7,17.8,()=>{
      this.text(pct(D.r2.choice)+'%',x,y+86,P?120:150,'#9adecb','left',440,w);this.text(EN?'Choice-coding variation linked to movement':'选择编码的脑区差异，与运动相关',x,y+154,P?26:28,'#bccecb','left',400,w);
      this.text(EN?'Variance explained by wheel speed + velocity (R²)':'速度与带方向速度的线性解释比例（R²）',x,y+211,23,'#809d94','left',400,w);
      this.text((EN?'Stimulus ':'图案位置 ')+pct(D.r2.stim)+'%   /   '+(EN?'Feedback ':'结果反馈 ')+pct(D.r2.fback)+'%',x,y+287,24,'#9786a4','left',400,w);
    });
    this._note(t,16.7,17.8,19.0,20.0,()=>{
      this.text(EN?'Locate the organization.':'先看整体结构。',x,y,P?46:46,'#dbc6f5','left',450,w);
      const lines=EN?['The main axis and a rank-based view','share the same anatomical frame.']:['主要编码轴与排名编码轴，','放回同一套小鼠脑区。'];
      lines.forEach((s,i)=>this.text(s,x,y+85+i*47,P?29:30,'#ad99c2','left',400,w));
      this.text(EN?'201 regions · Different analytical measures':'201 个脑区 · 不同的分析量',x,y+232,24,'#8c7b9f','left',400,w);
    });
    this._note(t,19.0,20.0,21.6,22.6,()=>{
      this.text(EN?'Beyond the movement model.':'再看运动之外。',x,y,P?45:45,'#b3e1d2','left',450,w);
      const lines=EN?['Adjust for wheel speed and direction.','Locate the remaining differences','in choice, stimulus and feedback.']:['考虑转轮速度与方向后，','选择、刺激与反馈，','仍有不同的区域残差。'];
      lines.forEach((s,i)=>this.text(s,x,y+85+i*47,P?29:30,'#b5a6c5','left',400,w));
      this.text(EN?'Residual = observed − predicted':'残差 = 观测指标 − 运动模型预测',x,y+285,24,'#819f95','left',400,w);
    });
    this._reportCopy(t);
  }
  _footer(t){
    const pad=this.portrait?65:85,y=this.H-43;this.line(pad,y-35,this.W-pad,y-35,'#a17cba22',1);this.line(pad,y-35,pad+(this.W-2*pad)*this.clamp(t/28),y-35,'#bc99ee',2);
    this.text(LANG==='en'?'Saved results · Illustrative data motion':'真实运行产物 · 数据形态与流程示意',pad,y,16,'#7d6d8e');this.text(LANG==='en'?'Playback time ≠ model runtime':'播放时长 ≠ 运行耗时',this.W-pad,y,16,'#7d6d8e','right');
  }
  render(time){
    const begin=performance.now();this.time=Math.max(0,Math.min(this.duration,time));const c=this.ctx,t=this.time;
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#080a10';c.fillRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(this.scale||1,0,0,this.scale||1,this.ox||0,this.oy||0);
    this._background(t);this._reportSurface(t);this._field(t);this._annotations(t);this._header(t);this._footer(t);
    this.frames++;this.costs.push(performance.now()-begin);if(this.costs.length>180)this.costs.shift();
  }
  exportJPEG(){return this.canvas.toDataURL('image/jpeg',.97)}
  destroy(){this.observer.disconnect()}
}
