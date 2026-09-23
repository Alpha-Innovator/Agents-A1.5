'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>(n*100).toFixed(1), signed=n=>(n>=0?'+':'')+n.toFixed(2);
const resultText=(key,values)=>T(key).replace(/\{(\w+)\}/g,(_,name)=>values[name]);
const regionByAcr=Object.fromEntries(D.regions.map(r=>[r.acr,r]));
const PANELS={
 A:['五类指标的脑区间相关性','相关性 · Pearson','先比较各脑区的五类解码指标：颜色越深，两类指标在不同脑区的变化越一致。模型把一张表变成了可读的关系图。'],
 B:['换一种比较，检查关系','相关性 · Spearman','把每个指标换成脑区排名，再看它们是否同升同降。这次运行同时交付了数值相关和排名相关两种视角。'],
 C:['PC1 方差解释率与随机参照','主成分分析 · PCA + 置换',resultText("第一主成分解释了 {pc1}% 的标准化指标总方差；打乱脑区对应关系的 {count} 次参照，平均约为 {nullMean}%。",{pc1:pct(D.pc1),count:D.permutations.toLocaleString('en-US'),nullMean:pct(D.nullMean)})],
 D:['五类指标的主成分载荷','指标贡献 · 主成分载荷',resultText("主成分载荷给出五类指标对 PC1 的贡献。模型还用排名 PCA 检查稳健性；两种脑区得分的相关系数约为 {correlation}。",{correlation:D.rankCorrelation.toFixed(3)})],
 E:['运动相关的部分，有多少','成分分离 · 线性模型','用两类运动指标解释刺激、选择和反馈指标在脑区间的差异，再保留未被解释的部分。图中展示每个模型的 R²。'],
 F:['PC1 得分的脑区解剖分布','解剖映射 · PC1 得分','把主 PC1 脑区得分映射到双侧解剖图谱；同名脑区在左右两侧使用相同数值。'],
 G:['排名 PCA 得分的解剖分布','稳健性 · 排名 PCA','将五类解码指标转换为排名后进行 PCA，展示排名 PC1 的脑区分布，与 F 图一起检查编码结构的稳健性。'],
 H:['分离运动后，选择还留下什么','空间表达 · 选择残差','模型交付了选择指标的运动残差脑区解剖图谱：显示在线性模型中，未被两类运动指标解释的脑区级成分。'],
 I:['分离运动后，刺激还留下什么','空间表达 · 刺激残差','用同样的方法展示刺激指标的剩余成分，并以统一的残差色阶呈现，便于和选择、反馈图一起阅读。'],
 J:['分离运动后，反馈还留下什么','空间表达 · 反馈残差','反馈残差图显示未被运动线性模型解释的脑区间差异。三类残差的解剖分布图统一使用 −3 至 +3 色阶。'],
 overview:['完整研究总览','A–J · 科研结果总览','将相关性、共享编码结构与运动残差的脑区分布汇总在一张图中。']
};
const PANEL_LABELS={A:'数值相关',B:'排名相关',C:'主成分检验',D:'指标载荷',E:'运动解释',F:'主 PC1',G:'排名 PC1',H:'选择残差',I:'刺激残差',J:'反馈残差',overview:'总览图'};
const symbols=['◌','↗','↺','≈','⇄'];
function dataWidget(){return `<div class="data-widget"><div class="metric-cards">${D.metrics.map((m,i)=>`<button class="metric-card ${i===1?'active':''}" data-metric="${i}" aria-pressed="${i===1}"><span class="metric-symbol">${symbols[i]}</span><strong>${UI.shortLabels[i]}</strong><small>${m}</small></button>`).join('')}</div><p class="metric-explain">${UI.metricDescriptions[1]}</p><div class="table-wrap"><table class="data-table"><thead><tr><th>脑区 / Beryl</th>${UI.shortLabels.map((l,i)=>`<th class="${i===1?'selected-col':''}" data-col="${i}">${l}</th>`).join('')}</tr></thead><tbody>${D.regions.map(r=>`<tr data-acr="${r.acr}"><td title="${esc(r.name)}">${r.acr}</td>${r.values.map((v,i)=>`<td class="${i===1?'selected-col':''}" data-col="${i}">${v.toFixed(3)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="data-count"><span>region_info.csv → 201 个有效脑区 × 5 类指标</span><span>滚动查看全部数据</span></div></div>`}
function matrixWidget(){return `<div class="matrix-widget" data-type="pearson"><div class="matrix-controls"><p class="note">点击单元格 → 查看对应散点</p><div class="switch"><button class="active" data-matrix="pearson" aria-pressed="true">数值相关</button><button data-matrix="spearman" aria-pressed="false">排名相关</button></div></div><div class="matrix-grid"></div><div class="gradient-legend"><span>关系较弱</span><i></i><span>关系较强</span></div><p class="matrix-summary" aria-live="polite"></p></div>`}
function associationRoot(w){return w.closest('[data-association]')||w.parentElement}
function drawMatrix(w,type=w.dataset.type||'pearson'){
 w.dataset.type=type;
 const scatter=$('.scatter-widget',associationRoot(w)),x=scatter?+ $('[data-axis=x]',scatter).value:1,y=scatter?+ $('[data-axis=y]',scatter).value:4;
 const colors=type==='pearson'?['#eeebfa','#7261bd']:['#e4f4ef','#267c93'];
 const mix=(a,b,t)=>{const x=a.match(/\w\w/g).map(c=>parseInt(c,16)),y=b.match(/\w\w/g).map(c=>parseInt(c,16));return `rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`};
 $('.matrix-grid',w).innerHTML='<div></div>'+UI.shortLabels.map(l=>`<div class="matrix-label">${l}</div>`).join('')+D[type].map((row,i)=>`<div class="matrix-label row">${UI.shortLabels[i]}</div>`+row.map((v,j)=>`<button class="matrix-cell ${j===x&&i===y?'selected':''}" data-pair-x="${j}" data-pair-y="${i}" aria-pressed="${j===x&&i===y}" style="background:${mix(colors[0].slice(1),colors[1].slice(1),v)};color:${v>.58?'#fff':'#49415e'}" data-tip="${UI.labels[j]} × ${UI.labels[i]}|${type==='pearson'?'Pearson r':'Spearman ρ'} = ${v.toFixed(3)}" aria-label="${UI.labels[j]} × ${UI.labels[i]} ${type} ${v.toFixed(3)}">${v.toFixed(2)}</button>`).join('')).join('');
 $('.gradient-legend i',w).style.background=`linear-gradient(90deg,${colors[0]},${colors[1]})`;
 $('.matrix-summary',w).textContent=`${UI.labels[x]} × ${UI.labels[y]} · ${type==='pearson'?'Pearson r':'Spearman ρ'} = ${D[type][y][x].toFixed(3)}`;
}
function syncAssociation(w){
 const root=associationRoot(w),matrix=$('.matrix-widget',root),scatter=$('.scatter-widget',root);
 if(matrix)drawMatrix(matrix);if(scatter)drawScatter(scatter);
}
function pc1Widget(){return `<div class="pc1-widget"><div><div class="eyebrow">CROSS-METRIC COVARIATION</div><div class="giant-number">${pct(D.pc1)}<span>%</span></div><p class="pc1-describe">第一主成分（PC1）概括了<br>五类指标在脑区间的协变关系。</p><div class="variance-bar" aria-label="${resultText('第一主成分解释 {pc1}% 方差，其余主成分合计 {remaining}%',{pc1:pct(D.pc1),remaining:pct(1-D.pc1)})}">${D.variance.map((v,i)=>`<i style="width:${v*100}%;opacity:${i?1-i*.15:1}" title="PC${i+1}：${pct(v)}%"></i>`).join('')}</div><div class="variance-key"><span>第一主成分（PC1）</span><span>其余成分</span></div></div><div class="comparison"><div class="compare-row"><div><span>真实数据的 PC1 方差解释率</span><span>${pct(D.pc1)}%</span></div><div class="compare-track"><i style="width:${pct(D.pc1)}%"></i></div></div><div class="compare-row null"><div><span>打乱脑区对应后的平均参照</span><span>${pct(D.nullMean)}%</span></div><div class="compare-track"><i style="width:${pct(D.nullMean)}%"></i></div></div><p class="compare-detail">${resultText('PCA 概括五类指标在脑区间同时升高或降低的趋势。第一主成分解释 {pc1}% 的总方差，{count} 次随机置换提供参照。',{pc1:pct(D.pc1),count:D.permutations.toLocaleString('en-US')})}</p><div class="mini-stats"><div><strong>${D.permutations.toLocaleString('en-US')}</strong><small>次已完成的随机置换</small></div><div><strong>${D.rankCorrelation.toFixed(3)}</strong><small>主分析与排名分析的得分相关</small></div></div></div></div>`}
function residualWidget(){return `<div class="residual-widget"><p class="residual-intro">把两类运动指标当作解释变量，看看它们能解释多少脑区间差异。</p>${[['stim','刺激'],['choice','选择'],['fback','反馈']].map(([k,l])=>`<div class="residual-row"><div class="head"><span>${l}指标</span><strong>${pct(D.r2[k])}%</strong></div><div class="residual-track" role="img" aria-label="${T(l)} · ${LANG==='en'?'Movement model R²':'运动线性模型 R²'} = ${pct(D.r2[k])}%"><i style="width:${pct(D.r2[k])}%"></i></div></div>`).join('')}<div class="residual-key"><span>运动指标可解释的方差</span><span>剩余方差</span></div><p class="note">这里的比例是脑区级线性模型的 R²。未被运动指标解释的残差，随后分别映射到脑区解剖图谱。</p></div>`}
const groupColors={Isocortex:'#9c86eb',TH:'#d89867',MB:'#7ebdb0',HB:'#759ac5',HY:'#c27b9f',CNU:'#99ab6c',CB:'#c6ab66',OLF:'#a18aa3',HPF:'#748aaf',CTXsp:'#a5a4bb'};
let researchRegion='MOp';
// Fixed saved dataset: 201 regions, df=199; t_{0.975,199}, verified with scipy.stats.t.
// This presentation-only fit is not an additional model-run output.
function regressionStats(x,y){
 const n=D.regions.length,mx=D.regions.reduce((a,r)=>a+r.values[x],0)/n,my=D.regions.reduce((a,r)=>a+r.values[y],0)/n;
 const sxx=D.regions.reduce((a,r)=>a+(r.values[x]-mx)**2,0),sxy=D.regions.reduce((a,r)=>a+(r.values[x]-mx)*(r.values[y]-my),0);
 const slope=sxy/sxx,intercept=my-slope*mx,sse=D.regions.reduce((a,r)=>a+(r.values[y]-intercept-slope*r.values[x])**2,0),mse=sse/(n-2);
 const critical=n===201?1.971956544249395:null;
 const xs=D.regions.map(r=>r.values[x]),lo=Math.min(...xs),hi=Math.max(...xs);
 const band=Array.from({length:81},(_,i)=>{const x=lo+(hi-lo)*i/80,mean=intercept+slope*x,half=critical===null?0:critical*Math.sqrt(mse*(1/n+(x-mx)**2/sxx));return{x,mean,lower:mean-half,upper:mean+half}});
 return{n,slope,intercept,mse,sxx,mx,band,hasCI:x!==y&&critical!==null};
}
function scatterWidget(){return `<div class="scatter-widget"><div class="scatter-toolbar"><label>横轴 <select data-axis="x">${UI.labels.map((l,i)=>`<option value="${i}" ${i===1?'selected':''}>${l}</option>`).join('')}</select></label><label>纵轴 <select data-axis="y">${UI.labels.map((l,i)=>`<option value="${i}" ${i===4?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="scatter-stats" aria-live="polite"></div><svg class="scatter-svg" viewBox="0 0 520 330" role="img" aria-label="201 个脑区的真实解码指标散点图"></svg><div class="fit-legend"><span class="fit-key"><i></i><span>OLS 回归拟合</span></span><span class="band-key"><i></i><span>95% 均值置信带</span></span></div><p class="diagonal-note note" hidden>同一指标的自相关为 1；显示 y = x 参考线，不计算置信区间。</p><div class="scatter-note"><span>每个点 = 一个脑区 · 颜色区分解剖大类</span><span>点击散点 → 定位解剖图谱</span></div><div class="scatter-selection" aria-live="polite"><span>选择一个脑区，连接统计与解剖位置。</span></div><details class="fit-method"><summary>拟合与置信区间说明</summary><p>坐标轴始终显示原始解码指标。Pearson r 描述数值的线性关联；Spearman ρ 描述排名关联。切换相关性类型不改变坐标或回归方法。</p><p>实线为普通最小二乘（OLS）拟合；阴影为拟合均值的点态 95% 置信区间，使用 t 分布（自由度 199）。它不是单个脑区的预测区间。</p><p>该区间采用独立、同方差且正态误差的线性模型假设，未校正脑区空间依赖。拟合和置信带由展示页根据已保存的 201 个脑区数值计算，不是新增的模型运行结果。</p></details></div>`}
function drawScatter(w){
 const x=+ $('[data-axis=x]',w).value,y=+ $('[data-axis=y]',w).value,fit=regressionStats(x,y),type=$('.matrix-widget',associationRoot(w))?.dataset.type||'pearson';
 const vals=D.regions.map(r=>[r.values[x],r.values[y]]),xmin=Math.min(0,...vals.map(v=>v[0])),xmax=Math.max(...vals.map(v=>v[0]))*1.07;
 const ylo=Math.min(0,...vals.map(v=>v[1]),...fit.band.map(b=>b.lower)),yhi=Math.max(...vals.map(v=>v[1]),...fit.band.map(b=>b.upper)),pad=(yhi-ylo)*.06,ymin=ylo-pad,ymax=yhi+pad;
 const sx=v=>54+(v-xmin)/(xmax-xmin)*434,sy=v=>276-(v-ymin)/(ymax-ymin)*240;
 $('.scatter-stats',w).innerHTML=`<span class="${type==='pearson'?'active':''}">Pearson r <b>${D.pearson[y][x].toFixed(3)}</b></span><span class="${type==='spearman'?'active':''}">Spearman ρ <b>${D.spearman[y][x].toFixed(3)}</b></span><span>n = ${fit.n} <small>${T('脑区')}</small></span>`;
 let s='';for(let i=0;i<5;i++){const yy=ymin+(ymax-ymin)*i/4,xx=xmin+(xmax-xmin)*i/4;s+=`<path d="M54 ${sy(yy)}H488" stroke="var(--line)" stroke-width=".7"/><text x="42" y="${sy(yy)+3}" text-anchor="end" fill="var(--muted)" font-size="9" font-family="Arial">${yy.toFixed(2)}</text><text x="${sx(xx)}" y="294" text-anchor="middle" fill="var(--muted)" font-size="9" font-family="Arial">${xx.toFixed(2)}</text>`}
 s+=`<text x="272" y="322" text-anchor="middle" fill="var(--muted)" font-size="10">${UI.labels[x]} / ${D.metrics[x]}</text><text x="54" y="16" fill="var(--muted)" font-size="10">${UI.labels[y]} / ${D.metrics[y]}</text>`;
 const path=pts=>pts.map((v,i)=>`${i?'L':'M'}${sx(v[0]).toFixed(3)},${sy(v[1]).toFixed(3)}`).join(' ');
 if(fit.hasCI)s+=`<path class="regression-band" d="${path([...fit.band.map(b=>[b.x,b.upper]),...fit.band.slice().reverse().map(b=>[b.x,b.lower])])}Z"/>`;
 s+=D.regions.map(r=>`<circle cx="${sx(r.values[x])}" cy="${sy(r.values[y])}" r="3.3" fill="${groupColors[r.group]||'#a48fc8'}" opacity=".82" tabindex="0" role="button" data-scatter-region="${r.acr}" data-tip="${esc(r.acr+' · '+r.name)}|${UI.shortLabels[x]} ${r.values[x].toFixed(3)} / ${UI.shortLabels[y]} ${r.values[y].toFixed(3)}" aria-label="${esc(r.acr)}, ${UI.labels[x]} ${r.values[x]}, ${UI.labels[y]} ${r.values[y]}"><title>${esc(r.acr+' · '+r.name)}</title></circle>`).join('');
 s+=`<path class="regression-line" d="${path(fit.band.map(b=>[b.x,b.mean]))}"/>`;
 $('.scatter-svg',w).innerHTML=s;
 $('.fit-legend',w).hidden=!fit.hasCI;$('.diagonal-note',w).hidden=x!==y;
 if(w.dataset.selectedRegion)selectScatterRegion(w,w.dataset.selectedRegion);
}
function selectScatterRegion(w,acr){
 const r=regionByAcr[acr];if(!r)return;researchRegion=acr;w.dataset.selectedRegion=acr;
 $$('[data-scatter-region]',w).forEach(p=>p.classList.toggle('selected',p.dataset.scatterRegion===acr));
 $('.scatter-selection',w).innerHTML=`<span><b>${r.acr}</b> · ${esc(r.name)}</span><button class="text-link" data-locate-region="${r.acr}">在解剖图谱中查看 ↗</button>`;
}
function atlasLayer(key='pc1'){
 if(key==='pc1'||key==='rank')return{key,label:T(key==='pc1'?'PC1 得分':'排名 PCA · PC1 得分'),lo:-4,hi:8,value:r=>r[key],source:D.scoreSources[key]};
 const i=D.metrics.indexOf(key);if(i<0)return atlasLayer();
 const values=D.regions.map(r=>r.values[i]);return{key,label:UI.labels[i],lo:Math.min(...values),hi:Math.max(...values),value:r=>r.values[i],source:'region_info.csv'};
}
function atlasSVG(dark=false,key='pc1'){
 const b=D.atlas.bbox,layer=atlasLayer(key);
 return `<svg class="atlas-svg ${dark?'dark-atlas':''}" viewBox="${b.join(' ')}" role="img" aria-label="${T('小鼠脑区解剖图谱')} · ${layer.label}"><title>${T('Swanson 平面投影 · 双侧同名脑区使用同一数值')}</title>${D.atlas.paths.map(p=>{
 const r=regionByAcr[p.acr],value=r?layer.value(r):null,t=r?Math.max(0,Math.min(1,(value-layer.lo)/(layer.hi-layer.lo))):0;
 const color=r?(dark?`hsl(${252-t*8} ${35+t*28}% ${19+t*55}%)`:`hsl(255 ${40+t*12}% ${97-t*62}%)`):(dark?'#151722':'#eeedf0');
 return `<path class="atlas-region" d="${p.d}" fill="${color}" stroke="${dark?'#9992b070':'#655b8260'}" data-region="${esc(p.acr)}" ${r?`tabindex="0" role="button" aria-label="${r.acr} / ${layer.label} ${value.toFixed(3)}" data-tip="${esc(r.acr+' · '+r.name)}|${layer.label} ${value.toFixed(3)}"`:''}><title>${r?esc(r.acr+' · '+r.name)+' / '+layer.label+' '+value.toFixed(3):T('无有效区域得分')}</title></path>`}).join('')}</svg>`;
}
function atlasWidget(dark=false){return `<div class="atlas-widget" data-dark="${dark}" data-layer="pc1"><div class="atlas-toolbar"><label><span>映射指标</span><select data-atlas-layer><option value="pc1">第一主成分 · PC1</option><option value="rank">排名 PCA · PC1</option>${D.metrics.map((m,i)=>`<option value="${m}">${UI.labels[i]}</option>`).join('')}</select></label><span class="atlas-layer-source mono">Panel C · PC1</span></div><div class="atlas-layout"><div class="atlas-canvas"><div class="atlas-map">${atlasSVG(dark)}</div><div class="atlas-scale"><span>−4</span><i></i><span>+8</span><span>PC1 得分</span></div><p class="atlas-caption">小鼠脑区解剖图谱 · Swanson 平面投影 · 点击脑区探索</p><p class="atlas-scale-note note">两种 PC1 得分统一使用 −4 至 +8 色阶；解码指标各自按观测范围着色。</p></div><div class="region-inspector"><span class="mono muted">REGION EXPLORER</span><div class="region-detail"></div><label><span class="label">查找脑区</span><input class="region-search" placeholder="输入缩写或英文名称" aria-label="搜索脑区缩写或英文名称"></label><div class="region-options"><button data-region-select="GRN">GRN</button><button data-region-select="MOp">MOp</button><button data-region-select="VISp">VISp</button><button data-region-select="PA">PA</button></div><p class="note" style="margin-top:18px">图谱采用本次 Panel F 的解剖轮廓；交互 PC1 与排名 PC1 分别读取 Panel C、D 的得分表。双侧同名脑区使用同一数值。</p></div></div></div>`}
function drawAtlas(w,key){
 w.dataset.layer=key;const layer=atlasLayer(key);
 $('.atlas-map',w).innerHTML=atlasSVG(w.dataset.dark==='true',key);
 $('.atlas-scale',w).innerHTML=`<span>${layer.lo.toFixed(key==='pc1'||key==='rank'?0:3)}</span><i></i><span>${layer.hi.toFixed(key==='pc1'||key==='rank'?0:3)}</span><span>${layer.label}</span>`;
 $('.atlas-layer-source',w).textContent=layer.source+' · '+layer.label;
 inspectRegion(w,w.dataset.region||researchRegion);
}
function inspectRegion(w,acr=researchRegion){
 const r=regionByAcr[acr];if(!r)return;w.dataset.region=acr;researchRegion=acr;
 const layer=atlasLayer(w.dataset.layer),hasShape=D.atlas.paths.some(p=>p.acr===acr);
 $('.region-detail',w).innerHTML=`<h3>${r.acr}</h3><div class="region-name">${esc(r.name)}<br><span style="opacity:.7">${esc(r.groupName)}</span></div><div class="score">${layer.key==='pc1'||layer.key==='rank'?signed(layer.value(r)):layer.value(r).toFixed(3)}</div><div class="label" style="margin-bottom:22px">${layer.label}</div>${r.values.map((v,i)=>`<div class="profile-row"><span>${UI.shortLabels[i]}</span><div class="track"><i style="width:${Math.max(0,v)/Math.max(...D.regions.map(x=>x.values[i]))*100}%"></i></div><b>${v.toFixed(3)}</b></div>`).join('')}<p class="note" style="margin:12px 0 17px">五类解码指标的原始值；细条按各指标的最大值分别缩放。</p>${hasShape?'':'<p class="atlas-unmapped note">该脑区未包含在此平面投影中；此处保留数值，不标注解剖位置。</p>'}`;
 $$('.atlas-region',w).forEach(p=>p.classList.toggle('highlight',p.dataset.region===acr));
}
// View boxes show the anatomy and its complete color scale from the saved PNG.
// Only the preview is framed; the full image and download always use FIG unchanged.
const FIGURE_DETAILS={
 F:{width:1050,height:1320,box:'15 75 1015 1010'},
 G:{width:1050,height:1320,box:'15 75 1015 1010'}
};
function galleryWidget(initial='F'){
 return `<div class="gallery-widget" data-panel="${initial}"><div class="gallery-tabs" aria-label="原始图表 A 至 J 与总览图">${Object.keys(PANELS).map(k=>`<button data-panel-select="${k}" class="${k===initial?'active':''}" aria-pressed="${k===initial}" aria-label="${k} · ${T(PANEL_LABELS[k])}"><b>${k==='overview'?'↗':k}</b><span>${T(PANEL_LABELS[k])}</span></button>`).join('')}</div><div class="gallery-layout"><div class="gallery-figure"><div class="figure-toolbar"><span class="figure-id">PANEL ${initial}</span><div class="switch" role="group" aria-label="图表显示方式"><button data-figure-view="detail">图谱细节</button><button data-figure-view="full">完整原图</button></div></div><button class="figure-well" data-zoom="${initial}" aria-label="放大查看原始图表"><img src="${FIG[initial]}" alt="Panel ${initial}: ${PANELS[initial][0]}" loading="lazy"><svg class="figure-detail" aria-hidden="true"><image/></svg></button><p class="figure-view-note"></p></div><div class="gallery-copy"></div></div></div>`;
}
function setGalleryView(w,view){
 const detail=FIGURE_DETAILS[w.dataset.panel];
 w.dataset.figureView=detail&&view==='detail'?'detail':'full';
 $('.figure-toolbar .switch',w).hidden=!detail;
 $$('[data-figure-view]',w).forEach(b=>{const active=b.dataset.figureView===w.dataset.figureView;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $('.figure-view-note',w).textContent=T(w.dataset.figureView==='detail'?'局部放大：脑区与色阶。完整标注见原图。':'完整原图。点击可缩放查看标注。');
}
function drawGallery(w,k=w.dataset.panel){
 const previous=w.dataset.panel,view=w.dataset.figureView;
 w.dataset.panel=k;const a=PANELS[k];const img=$('img',w);img.src=FIG[k];img.alt=`本次运行原始 Panel ${k}: ${a[0]}`;$('.figure-well',w).dataset.zoom=k;
 $('.figure-id',w).textContent=k==='overview'?T('总览图'):`PANEL ${k}`;
 const detail=FIGURE_DETAILS[k],svg=$('.figure-detail',w),image=$('image',svg);
 if(detail){svg.setAttribute('viewBox',detail.box);const [, , width, height]=detail.box.split(' ').map(Number);svg.setAttribute('width',width);svg.setAttribute('height',height);image.setAttribute('width',detail.width);image.setAttribute('height',detail.height);image.setAttribute('href',FIG[k])}
 else image.removeAttribute('href');
 setGalleryView(w,previous===k&&view?view:(detail?'detail':'full'));
 $$('.gallery-tabs button',w).forEach(b=>{b.classList.toggle('active',b.dataset.panelSelect===k);b.setAttribute('aria-pressed',b.dataset.panelSelect===k)});
 $('.gallery-copy',w).innerHTML=`<div class="eyebrow">${k==='overview'?'OVERVIEW':`PANEL ${k}`} / V3 ORIGINAL OUTPUT</div><h3>${a[0]}</h3><p>${a[2]}</p><div class="actions"><button class="btn small" data-zoom="${k}">放大原图 <span>↗</span></button><button class="text-link" data-download-panel="${k}">下载 PNG</button></div><div class="source-label">${a[1]}<br>来源：Agents-A1.5 · V3（第 3 次运行）</div>${'FGHIJ'.includes(k)?'<div class="atlas-reading-note"><strong>相同轮廓，不同分析量</strong><p>这五张图共用小鼠脑区边界。F/G 展示主成分得分；H/I/J 分别展示选择、刺激、反馈的运动残差。请比较脑区颜色与数值。</p></div>':''}`;
}
function figureFitScale(){
 const viewport=$('.lightbox-viewport'),img=$('#lightbox img');
 return Math.min(1,(viewport.clientWidth-32)/img.naturalWidth,(viewport.clientHeight-32)/img.naturalHeight);
}
function setFigureScale(scale,reset=false){
 const d=$('#lightbox'),viewport=$('.lightbox-viewport',d),img=$('img',d);
 if(!img.naturalWidth)return;
 const fit=figureFitScale();scale=Math.max(fit,Math.min(4,scale));
 const cx=(viewport.scrollLeft+viewport.clientWidth/2)/viewport.scrollWidth;
 const cy=(viewport.scrollTop+viewport.clientHeight/2)/viewport.scrollHeight;
 d.dataset.scale=scale;d.dataset.fit=String(Math.abs(scale-fit)<.0001);
 img.style.width=`${img.naturalWidth*scale}px`;img.style.height=`${img.naturalHeight*scale}px`;
 $('.figure-scale',d).textContent=`${Math.round(scale*100)}%`;
 $('[data-figure-scale="out"]',d).disabled=scale<=fit+.0001;
 $('[data-figure-scale="in"]',d).disabled=scale>=4;
 viewport.scrollLeft=reset?0:cx*viewport.scrollWidth-viewport.clientWidth/2;
 viewport.scrollTop=reset?0:cy*viewport.scrollHeight-viewport.clientHeight/2;
}
async function openFigure(k){
 const d=$('#lightbox'),img=$('img',d);
 d.dataset.panel=k;d.classList.add('loading');img.src=FIG[k];img.alt=T(PANELS[k][0]);
 $('.dialog-head strong',d).textContent=T(`Panel ${k} · ${PANELS[k][0]} · 本次运行原图`);
 $('[data-download-panel]',d).dataset.downloadPanel=k;
 if(!d.open)d.showModal();
 try{await img.decode()}catch(error){if(d.dataset.panel===k){d.classList.remove('loading');$('.figure-scale',d).textContent=T('图片加载失败')}return}
 if(d.dataset.panel!==k||!d.open)return;
 setFigureScale(figureFitScale(),true);d.classList.remove('loading');
}
function bindFigureViewer(){
 const d=$('#lightbox'),viewport=$('.lightbox-viewport',d);
 new ResizeObserver(()=>{if(d.open&&!d.classList.contains('loading'))setFigureScale(d.dataset.fit==='true'?figureFitScale():+d.dataset.scale)}).observe(viewport);
 let drag=null;
 viewport.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==0)return;
  drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
  viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');e.preventDefault();
 });
 viewport.addEventListener('pointermove',e=>{if(drag){viewport.scrollLeft=drag.left+drag.x-e.clientX;viewport.scrollTop=drag.top+drag.y-e.clientY}});
 const release=()=>{drag=null;viewport.classList.remove('dragging')};
 viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);viewport.addEventListener('lostpointercapture',release);d.addEventListener('close',release);
}
function artifacts(){return `<div class="artifact-grid"><article class="artifact"><span class="tag">FIGURES / A—J + OVERVIEW</span><h3>11 张研究图表</h3><p>相关矩阵、PCA、运动回归与五张解剖分布图；含完整总览图，原始产物可逐张放大查看。</p><button class="text-link" data-open-gallery>浏览全部图表 ↗</button></article><article class="artifact"><span class="tag">STRUCTURED DATA</span><h3>可读、可复用的数值</h3><p>关键统计量与 201 个脑区的指标、主轴得分，成为交互展示的数据底座。</p><button class="text-link" data-download="data">下载展示数据 ↓</button></article><article class="artifact"><span class="tag">RESEARCH REPORT</span><h3>完整的研究交付链</h3><p>运行目录中的汇总报告，由公共脚本生成；数值可与原始统计文件核对。</p><button class="text-link" data-report>阅读原始报告 ↗</button></article></div>`}
function initWidgets(root=document){
 $$('.matrix-widget',root).forEach(w=>drawMatrix(w));$$('.scatter-widget',root).forEach(drawScatter);$$('.atlas-widget',root).forEach(w=>inspectRegion(w));$$('.gallery-widget',root).forEach(w=>drawGallery(w));
}
function download(name,content,type='application/json'){
 const url=typeof content==='string'&&(content.startsWith('data:')||content.startsWith('assets/'))?content:URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function openText(title,body){const dialog=$('#text-dialog');$('.dialog-head strong',dialog).textContent=title;$('.source-text',dialog).textContent=body;dialog.showModal()}
function sourceNotes(){if(LANG==='en')return SOURCE_EN;return `这次模型做了什么\n\n研究问题：五类脑区级解码图，是否共享一个主要的行动／状态模式？\n\n实验对象与任务：小鼠看屏幕左右两侧的图案，用前爪转动小轮，将图案移向屏幕中央。答对得到水奖励；答错收到噪声提示并短暂等待。刺激、选择和反馈分别对应图案位置、左右转轮选择以及奖励或错误结果。运动指标是转轮速度及带方向的转轮速度。\n\n数据：Findling2025 / IBL region_info.csv。每行是一个 Beryl 小鼠脑区，每个解码指标概括该脑区活动中与某类变量相关的信息。279 行输入中，本次分析使用了五项指标均有效的 201 个脑区。\n\n执行环境：Agents-A1.5（运行记录中的模型名为 A1.5-Preview），经 SeekBrain Harness 执行分阶段研究任务。此次展示使用已有运行结果，不重新调用模型。\n\n能力链条：读取并整理数据 → 比较数值和排名关系 → 提取跨指标协变结构并与随机参照比较 → 分离运动相关成分 → 回填双侧脑区解剖图谱 → 生成图表和报告。\n\n主要数值：PC1 解释 ${pct(D.pc1)}% 方差；${D.permutations.toLocaleString('en-US')} 次置换的平均参照 ${pct(D.nullMean)}%；排名 PC1 解释 ${pct(D.rankPc1)}%；主分析与排名分析脑区得分相关 ${D.rankCorrelation.toFixed(3)}。\n\n展示说明：交互图表使用本次已保存的数值；交互脑区解剖图谱复用原始 Panel F 的 Swanson 轮廓并重绘颜色，主 PCA 与排名 PCA 统一范围 −4 至 +8，五类解码指标分别按观测范围着色；灰色表示无有效数值。Swanson 是脑区平面投影；投影未覆盖的脑区保留数值，不标注位置。交互 PC1 与排名 PC1 分别使用 Panel C、D 的五类解码指标分析；V3 原始 Panel G 使用同样五类解码指标的排名得分，短片读取 G 自身保存的结果表。−4 至 +8 为交互展示色阶。V3 的 A–J 原图及总览图保持原样。短片与结论摘要将五组已保存数值重绘到 F 的解剖轮廓：主 PC1 来自 C，五指标排名 PC1 来自 G，选择、刺激、反馈残差分别来自 H、I、J。PC1 色阶为 −4 至 +8，残差为 −3 至 +3，超出范围饱和显示。F/G 分别展示数值和排名两种分析；主分析与排名分析的得分相关约为 ${D.rankCorrelation.toFixed(3)}。结尾摘要由展示端根据运行结果整理，不是另行由模型独立撰写的报告。28 秒短片依据真实数值与产物重构研究流程；界面操作、文件高亮和动画时序为叙事示意，不是逐条执行录屏，也不表示实际运行耗时。开头的一句问题为任务摘要；本次实际执行接收了分阶段任务说明。数据浏览器仅展示 59 个提供的输入文件；图谱资源与分析产物另行说明，不把所有可用文件都算作 PCA 输入。短片中的粒子变形是流程示意，并非神经元位置或神经活动轨迹。汇总报告由上游公共脚本生成，不作为模型独立撰写报告的证据。\n\n解读范围：脑区级、观察性分析；跨指标协变结构不是已确立的因果机制。${pct(D.pc1)}% 指五类标准化指标的总方差解释比例。\n\n科研价值：再分析展示了跨任务编码指标的协变及其与转轮运动的关联，为可检验的新假设提供依据。页面的后续假设示例是本展示基于结果的延伸推演，不是原报告的原文，也不是已完成的新实验。SeekBrain 无预设方向探索的愿景，与本 case 明确要求检验共同轴和运动成分的具体任务有所区别。\n\n新增交互：相关矩阵与散点图联动，显示 Pearson r 与 Spearman ρ。散点使用原始指标值；OLS 拟合均值的点态 95% 置信带由展示页根据已保存数值计算，使用自由度 199 的 t 分布，不是原模型运行产物。区间未校正脑区空间依赖；不等同于单个脑区的预测区间。方法参考：https://www.itl.nist.gov/div898/handbook/pmd/section5/pmd511.htm\n\n实验背景来源：https://www.nature.com/articles/s41586-025-09226-1 和 https://www.nature.com/articles/s41586-025-09235-0\n\n结果版本：${D.resultVersion}（第 ${D.overallRunIndex} 次运行）\n运行标识：${D.run}`}
function injectDialogs(){document.body.insertAdjacentHTML('beforeend',`<div class="tip" role="tooltip" id="tooltip"></div><dialog id="text-dialog"><div class="dialog-head"><strong>研究背景</strong><button class="close-btn" data-close aria-label="关闭">×</button></div><div class="dialog-body"><div class="source-text"></div></div></dialog><dialog class="lightbox" id="lightbox"><div class="dialog-head"><strong>本次运行 · 原始图表</strong><button class="close-btn" data-close aria-label="关闭">×</button></div><div class="figure-zoom-toolbar"><div class="figure-zoom-controls" role="group" aria-label="原图缩放"><button data-figure-scale="out" aria-label="缩小">−</button><output class="figure-scale" aria-live="polite">—</output><button data-figure-scale="in" aria-label="放大">+</button><button data-figure-scale="fit">适应窗口</button><button data-figure-scale="native">原始尺寸</button></div><button class="text-link" data-download-panel="F">下载 PNG</button></div><p class="figure-zoom-hint">放大后可拖动或滚动查看</p><div class="lightbox-viewport" tabindex="0" aria-label="可滚动的原始图表"><div class="lightbox-stage"><img alt="放大的原始研究图表" draggable="false"></div></div></dialog><dialog id="gallery-dialog"><div class="dialog-head"><strong>本次 Agents-A1.5 运行 · 原始产物</strong><button class="close-btn" data-close aria-label="关闭">×</button></div><div class="dialog-body">${galleryWidget()}</div></dialog><dialog class="film motion-film" id="film" aria-label="28 秒脑科学能力宣传片"><div class="dialog-head"><strong>${D.model.toUpperCase()} · ${D.resultVersion}</strong><button class="close-btn" data-close aria-label="关闭短片">×</button></div><div class="film-picture"><canvas class="motion-canvas" role="img" aria-label="脑科学研究过程的连续动画"></canvas></div><p class="film-transcript">从研究问题出发，浏览工作区、分析数据、检验关系、映射脑区。Agents-A1.5 通过 SeekBrain 再分析小鼠全脑已有数据，识别五类指标的主要协变轴及其与运动的关联。</p><div class="film-bottom"><button class="film-play" aria-label="暂停播放">Ⅱ</button><span class="film-time">00:00</span><input class="film-scrubber" type="range" min="0" max="28" step="0.01" value="0" aria-label="短片进度（秒）"><span>00:28</span><button class="film-sound" aria-pressed="false">开启声音</button><button class="text-link" data-film-restart>重播 ↺</button><span data-language-slot></span></div><div class="film-credit">基于本次真实运行产物的 28 秒叙事回放 · 播放时长不代表模型运行用时</div></dialog>`)}
let filmState={playing:false,elapsed:0,last:0,raf:0,sound:true};
let filmRuntime=null,filmAudio=null;
function ensureFilm(){
 if(!filmRuntime){
  filmRuntime=new ScienceMotionFilm($('.motion-canvas'));
  filmRuntime.ready.then(()=>{filmRuntime.render(filmState.elapsed)});
  filmAudio=new Audio(SOUND);filmAudio.volume=.42;filmAudio.preload='auto';
 }
 return filmRuntime;
}
function syncFilmSound(){
 const on=!!(filmAudio&&!filmAudio.paused&&!filmAudio.muted);
 $('.film-sound').textContent=on?'声音已开':'开启声音';$('.film-sound').setAttribute('aria-pressed',String(on));
}
function startFilmSound(){
 if(!filmAudio||!filmState.sound)return;
 filmAudio.currentTime=Math.min(27.99,filmState.elapsed);filmAudio.play().then(syncFilmSound).catch(syncFilmSound);
}
function seekFilm(t,fromClock=false){
 filmState.elapsed=Math.min(FILM_DURATION,Math.max(0,t));ensureFilm().render(filmState.elapsed);
 $('.film-scrubber').value=filmState.elapsed;
 $('.film-time').textContent='00:'+String(Math.floor(filmState.elapsed)).padStart(2,'0');
 if(!fromClock&&filmAudio){filmAudio.currentTime=Math.min(27.99,filmState.elapsed);filmState.last=0}
}
function filmTick(now){
 if(!filmState.playing)return;const dt=filmState.last?(now-filmState.last)/1000:0;filmState.last=now;seekFilm(filmState.elapsed+dt,true);
 if(filmState.elapsed>=FILM_DURATION){pauseFilm();$('.film-play').setAttribute('aria-label','重新播放');return}
 filmState.raf=requestAnimationFrame(filmTick);
}
function playFilm(restart=false){
 const f=$('#film');if(!f.open)f.showModal();ensureFilm().resize();if(restart||filmState.elapsed>=FILM_DURATION)seekFilm(0);
 filmState.playing=true;filmState.last=0;f.classList.remove('paused');$('.film-play').textContent='Ⅱ';$('.film-play').setAttribute('aria-label','暂停播放');
 cancelAnimationFrame(filmState.raf);filmState.raf=requestAnimationFrame(filmTick);startFilmSound();
}
function pauseFilm(){
 filmState.playing=false;cancelAnimationFrame(filmState.raf);if(filmAudio)filmAudio.pause();
 $('#film').classList.add('paused');$('.film-play').textContent='▶';$('.film-play').setAttribute('aria-label','继续播放');syncFilmSound();
}
function toggleFilmSound(){
 if(filmAudio&&!filmAudio.paused){filmState.sound=false;filmAudio.pause();syncFilmSound()}
 else{filmState.sound=true;if(!filmState.playing)playFilm();else startFilmSound()}
}
function bindGlobal(){
 document.addEventListener('click',e=>{
 const t=e.target.closest('button,a,path,circle');if(!t)return;
 if(t.matches('[data-close]'))t.closest('dialog').close();
 if(t.matches('[data-source]'))openText('研究背景与展示来源',sourceNotes());
 if(t.matches('[data-report]'))openText('运行汇总报告 · 公共脚本生成',LANG==='en'?REPORT_EN:'来源说明：以下汇总文字由上游公共脚本生成，不是模型独立撰写的报告。关键数值已与本次运行统计文件核对。\n\n'+REPORT);
 if(t.matches('[data-task]'))openText('交给模型的研究任务 · 中文导读',LANG==='en'?TASK_EN:`研究目标\n\n再分析 Findling2025 / IBL 已有小鼠脑区级解码数据，研究图案位置、左右转轮选择、奖励或错误反馈、转轮速度及带方向的转轮速度五类指标，是否主要由一个共同的行动／状态模式支配。\n\n要求模型完成\n\n1. 读取 CSV，选取五类指标均有效的脑区。\n2. 比较五类指标的数值相关和排名相关。\n3. 用 PCA 提取跨指标协变结构，用 ${D.permutations.toLocaleString('en-US')} 次随机置换作参照，并以排名分析检查稳定性。\n4. 用运动指标建立线性模型，计算刺激、选择和反馈的剩余成分。\n5. 把主模式、排名模式和三类剩余成分映射回双侧脑区解剖图谱。\n6. 交付 A–J 十张图、结构化统计量与研究报告。\n\n这是原始任务的展示用摘要。研究数据为脑区级指标；可查看“研究背景与展示来源”了解图形与数值来源。`);
 if(t.matches('[data-open-gallery]'))$('#gallery-dialog').showModal();
 if(t.matches('[data-zoom]'))openFigure(t.dataset.zoom);
 if(t.matches('[data-figure-view]'))setGalleryView(t.closest('.gallery-widget'),t.dataset.figureView);
 if(t.matches('[data-figure-scale]')){
  const d=$('#lightbox');if(d.classList.contains('loading'))return;
  const action=t.dataset.figureScale,scale=+d.dataset.scale;
  setFigureScale(action==='fit'?figureFitScale():action==='native'?1:scale*(action==='in'?1.5:1/1.5),action==='fit');
 }
 if(t.matches('[data-download-panel]'))download('agents-a1.5-panel-'+t.dataset.downloadPanel+'.png',FIG[t.dataset.downloadPanel]);
 if(t.matches('[data-download="data"]'))download('agents-a1.5-showcase-data.json',JSON.stringify({...D,atlas:undefined},null,2));
 if(t.matches('[data-film]'))playFilm(true);
 if(t.matches('[data-film-restart]'))playFilm(true);
 if(t.matches('.film-sound'))toggleFilmSound();
 if(t.matches('.film-play')){filmState.playing?pauseFilm():playFilm()}
 if(t.matches('[data-metric]')){const w=t.closest('.data-widget'),i=+t.dataset.metric;$$('[data-metric]',w).forEach(b=>{b.classList.toggle('active',+b.dataset.metric===i);b.setAttribute('aria-pressed',+b.dataset.metric===i)});$('.metric-explain',w).textContent=UI.metricDescriptions[i];$$('[data-col]',w).forEach(c=>c.classList.toggle('selected-col',+c.dataset.col===i))}
 if(t.matches('[data-matrix]')){const w=t.closest('.matrix-widget');$$('[data-matrix]',w).forEach(b=>{b.classList.toggle('active',b===t);b.setAttribute('aria-pressed',b===t)});drawMatrix(w,t.dataset.matrix);const scatter=$('.scatter-widget',associationRoot(w));if(scatter)drawScatter(scatter)}
 if(t.matches('[data-pair-x]')){const w=t.closest('.matrix-widget'),scatter=$('.scatter-widget',associationRoot(w));if(scatter){$('[data-axis=x]',scatter).value=t.dataset.pairX;$('[data-axis=y]',scatter).value=t.dataset.pairY;syncAssociation(w)}}
 if(t.matches('[data-scatter-region]'))selectScatterRegion(t.closest('.scatter-widget'),t.dataset.scatterRegion);
 if(t.matches('[data-locate-region]')){if(typeof selectEvidence==='function')selectEvidence('atlas');researchRegion=t.dataset.locateRegion;if(typeof renderStage==='function')renderStage(4);const atlas=$('.atlas-widget');if(atlas){inspectRegion(atlas,researchRegion);atlas.scrollIntoView({behavior:'smooth',block:'center'})}}
 if(t.matches('[data-panel-select]'))drawGallery(t.closest('.gallery-widget'),t.dataset.panelSelect);
 if(t.matches('[data-region],[data-region-select]')){const w=t.closest('.atlas-widget');if(w)inspectRegion(w,t.dataset.region||t.dataset.regionSelect)}
 if(t.matches('[data-tip]')&&!t.matches('[data-region]'))showTip(t,e.clientX,e.clientY);
 });
 document.addEventListener('change',e=>{if(e.target.matches('[data-axis]'))syncAssociation(e.target.closest('.scatter-widget'));if(e.target.matches('[data-atlas-layer]'))drawAtlas(e.target.closest('.atlas-widget'),e.target.value)});
 document.addEventListener('input',e=>{if(e.target.matches('.film-scrubber')){seekFilm(+e.target.value);return}if(!e.target.matches('.region-search'))return;const w=e.target.closest('.atlas-widget'),q=e.target.value.trim().toLowerCase();const found=D.regions.filter(r=>r.acr.toLowerCase().includes(q)||r.name.toLowerCase().includes(q)).slice(0,6);$('.region-options',w).innerHTML=found.length?found.map(r=>`<button data-region-select="${r.acr}">${r.acr}</button>`).join(''):'<span class="note">未找到该脑区</span>'});
 document.addEventListener('pointerover',e=>{const t=e.target.closest('[data-tip]');if(t)showTip(t,e.clientX,e.clientY)});
 document.addEventListener('pointermove',e=>{if($('#tooltip').classList.contains('show'))placeTip(e.clientX,e.clientY)});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))$('#tooltip').classList.remove('show')});
 document.addEventListener('focusin',e=>{if(e.target.matches('[data-tip]')){const r=e.target.getBoundingClientRect();showTip(e.target,r.x+r.width/2,r.y)}});
 document.addEventListener('focusout',()=>$('#tooltip').classList.remove('show'));
 $$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
 $('#film').addEventListener('close',pauseFilm);
 document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[data-scatter-region],[data-region][tabindex]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return}if($('#film').open&&e.code==='Space'&&!e.target.matches('input,button')){e.preventDefault();filmState.playing?pauseFilm():playFilm()}});
}
function placeTip(x,y){const t=$('#tooltip');t.style.left=Math.max(8,Math.min(innerWidth-t.offsetWidth-12,x+15))+'px';t.style.top=Math.max(8,Math.min(innerHeight-t.offsetHeight-12,y+15))+'px'}
function showTip(el,x,y){const parts=el.dataset.tip.split('|');$('#tooltip').innerHTML=`<strong>${esc(parts[0])}</strong><span>${esc(parts[1]||'')}</span>`;$('#tooltip').classList.add('show');placeTip(x,y)}
function start(){
 $$('[data-widget]').forEach(el=>{const f={data:dataWidget,matrix:matrixWidget,pc1:pc1Widget,residual:residualWidget,scatter:scatterWidget,atlas:()=>atlasWidget(document.body.classList.contains('launch')),gallery:()=>galleryWidget(),artifacts}[el.dataset.widget];if(f)el.innerHTML=f()});
 $$('[data-hero-atlas]').forEach(el=>el.innerHTML=atlasSVG(el.dataset.heroAtlas!=='light'));
 injectDialogs();initWidgets();bindGlobal();bindFigureViewer();
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(e=>io.observe(e));
 if(typeof pageInit==='function')pageInit();
 initLocale();
 if(new URLSearchParams(PAGE_LOCATION.search).has('film')){document.body.classList.add('film-only');playFilm(true)}
 window.showcase={seekFilm,pauseFilm,playFilm,data:D,ready:true,get filmRuntime(){return ensureFilm()},get filmState(){return {...filmState}}};
}
