const stages=[
 ['先让数据，成为可以分析的对象。','从 279 行输入中，选取五项指标均有效的 201 个脑区。每一行代表一个脑区，每一列是一类解码指标。','READ & ORGANIZE',dataWidget,'来源：已保存的区域级输入表 · 可滚动查看全部 201 行'],
 ['不同指标，在同一脑区如何变化？','点击矩阵中的任意单元格，右侧即显示对应的 201 个脑区散点、相关系数与回归拟合。也可直接切换坐标轴。','COMPARE & CONNECT',()=>`<div class="matrix-and-scatter" data-association>${matrixWidget()}${scatterWidget()}</div>`,'来源：Panel A / B 与已有脑区指标 · 拟合及置信带为展示页补充'],
 ['第一主成分，概括跨指标协变。','模型用 PCA 把共同变化提取出来，再用随机打乱和排名分析检查这一结构。这里的百分比描述数据中的方差。','EXTRACT & CHECK',pc1Widget,resultText('来源：原始 Panel C / D · 保存的 PCA 与 {count} 次置换结果',{count:D.permutations.toLocaleString('en-US')})],
 ['进一步量化，运动相关成分。','用运动速度和有向速度解释其余三类指标，计算能被运动线性模型解释的部分，并保留剩余成分。','SEPARATE & INTERPRET',()=>`<div class="residual-layout">${residualWidget()}<div class="residual-thought"><div class="eyebrow">WHAT COMES NEXT</div><h3>运动解释的部分。<br>未被解释的部分。<br>分别映射到解剖位置。</h3><p>区域级残差被进一步映射回脑区解剖图谱，形成选择、刺激、反馈三张空间结果。</p><button class="text-link" data-open-gallery>查看原图 H—J ↗</button></div></div>`,'来源：原始 Panel E 与已保存的运动线性模型 R²'],
 ['从分析指标，到脑区解剖分布。','切换 PC1 得分或五类解码指标，查看它们在小鼠脑区解剖图谱上的分布。点击或搜索脑区，核对该区域的具体数值。','MAP & EXPLAIN',()=>atlasWidget(false),'来源：Panel F 的 Swanson 投影与已保存的 201 个脑区得分'],
 ['研究过程，留下可以打开的成果。','本次运行交付了 A–J 十张图与报告。原始产物、可交互的数值和易读的解释在这里连接起来。','DELIVER & COMMUNICATE',()=>galleryWidget('F')+artifacts(),'来源：本次 Agents-A1.5 运行 · 原图保持原样']
];
let currentStage=4;
function renderStage(i){
 currentStage=Math.max(0,Math.min(5,i));const s=stages[currentStage],b=$('#stage-body');
 b.innerHTML=`<div class="stage-title"><div><h2>${s[0]}</h2><p>${s[1]}</p></div><span class="tag">${s[2]}</span></div>${s[3]()}`;
 initWidgets(b);$('#stage-source').textContent=s[4];$('#stage-counter').textContent=String(currentStage+1).padStart(2,'0')+' / 06';
 $$('.stage-prev').forEach(x=>x.disabled=currentStage===0);$$('.stage-next').forEach(x=>x.disabled=currentStage===5);
 $$('[data-stage]').forEach(x=>{x.classList.toggle('active',+x.dataset.stage===currentStage);x.setAttribute('aria-pressed',+x.dataset.stage===currentStage)});
}
function pageInit(){
 renderStage(4);document.addEventListener('click',e=>{const t=e.target.closest('[data-stage],.stage-prev,.stage-next');if(!t)return;
 if(t.matches('[data-stage]'))renderStage(+t.dataset.stage);else renderStage(currentStage+(t.matches('.stage-next')?1:-1));
 if(t.closest('.lab-steps,.research-entry'))$('.lab-workspace').scrollIntoView({behavior:'smooth',block:'start'});
 });
}
