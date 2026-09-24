
/* Biology replay: adaptive evidence acquisition, grounded in recorded tool outputs.
 * Geometry is illustrative. Sequence letters and comparisons use the logged data.
 * No remote calls, BLAST claims, experimental activity prediction, or hidden assets.
 */
(function(root){
'use strict';
const Shared=root.ResearchFilm||(typeof require==='function'?require('./research-film.js'):null);
const D=root.BiologyData||(typeof require==='function'?require('./biology-data.js'):null);
const P={bg:'#090C13',panel:'#111621',edge:'#2A2D41',ink:'#F1EFF8',muted:'#A6A3BB',dim:'#6F718B',purple:'#BBA6FA',mint:'#8EDDCB',amber:'#EDB389',blue:'#8DAEDE'};
const MONO='DejaVu Sans Mono, Consolas, monospace';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,p)=>a+(b-a)*p;
const ease=x=>{x=clamp(x);return x*x*(3-2*x);},ramp=(t,a,b)=>ease((t-a)/(b-a));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const ZH={
'Only references were returned.':'\u4ec5\u8fd4\u56de\u53c2\u8003\u6587\u732e\u3002',
'Use Code to extract the abstract.':'\u7528\u4ee3\u7801\u63d0\u53d6\u6458\u8981\u3002',
'No sequence in the page excerpt':'\u9875\u9762\u7247\u6bb5\u672a\u5305\u542b\u5e8f\u5217',
'Change the extraction route':'\u66f4\u6362\u4fe1\u606f\u63d0\u53d6\u8def\u5f84',
'Abstract recovered with Code':'\u4ee3\u7801\u6210\u529f\u63d0\u53d6\u6458\u8981',

'MOLECULAR BIOLOGY':'\u5206\u5b50\u751f\u7269\u5b66',
'Scientific Agent':'\u79d1\u5b66\u667a\u80fd\u4f53','Capabilities':'\u80fd\u529b',
'Adaptive retrieval & sequence verification':'\u81ea\u9002\u5e94\u68c0\u7d22\u4e0e\u5e8f\u5217\u7ea7\u9a8c\u8bc1',
'From an insect DNA fragment':'\u4ece\u4e00\u6bb5\u6606\u866b DNA \u51fa\u53d1',
' to a traceable gene identity.':'\u5230\u53ef\u8ffd\u6eaf\u7684\u57fa\u56e0\u8eab\u4efd\u3002',
'Reframe':'\u8c03\u6574','Decode':'\u89e3\u6790','Trace':'\u8ffd\u8e2a','Retrieve':'\u83b7\u53d6',
'Input sequence':'\u8f93\u5165\u5e8f\u5217','Query fragment':'\u5f85\u9274\u5b9a\u7247\u6bb5','Translated residues':'\u7ffb\u8bd1\u540e\u6b8b\u57fa',
'DNA sequence view':'DNA \u5e8f\u5217\u793a\u610f','Read the sequence before naming it.':'\u5148\u89e3\u6790\u5e8f\u5217\uff0c\u518d\u5224\u65ad\u8eab\u4efd\u3002',
'Normalize. Translate. Keep the identity open.':'\u6807\u51c6\u5316\u3001\u7ffb\u8bd1\uff0c\u6682\u4e0d\u4e0b\u8eab\u4efd\u7ed3\u8bba\u3002',
'1,296 bases. One supplied fragment.':'1,296 \u4e2a\u78b1\u57fa\uff0c\u4e00\u6bb5\u5f85\u9274\u5b9a\u5e8f\u5217\u3002',
'432 translated residues.':'\u7ffb\u8bd1\u5f97\u5230 432 \u4e2a\u6b8b\u57fa\u3002','Function still unconfirmed.':'\u529f\u80fd\u8eab\u4efd\u4ecd\u5f85\u9a8c\u8bc1\u3002',
'Identity not yet established':'\u8eab\u4efd\u5c1a\u672a\u786e\u8ba4','DNA to protein sequence':'DNA \u5230\u86cb\u767d\u5e8f\u5217','Frame 1 translation':'\u7b2c\u4e00\u8bfb\u6846\u7ffb\u8bd1',
'No exact hit. Change the question.':'\u672a\u627e\u5230\u786e\u8bc1\uff0c\u8c03\u6574\u68c0\u7d22\u95ee\u9898\u3002','A failed lookup changes the route, not the evidence.':'\u68c0\u7d22\u53d7\u963b\u65f6\u6539\u53d8\u8def\u5f84\uff0c\u4e0d\u964d\u4f4e\u8bc1\u636e\u6807\u51c6\u3002',
'Literal sequence search':'\u5e8f\u5217\u539f\u6587\u68c0\u7d22','No direct identity established':'\u672a\u83b7\u5f97\u76f4\u63a5\u8eab\u4efd\u8bc1\u636e',
'Google Scholar / 2 queries':'\u8c37\u6b4c\u5b66\u672f / 2 \u6b21\u67e5\u8be2','0 results in both queries':'\u4e24\u6b21\u67e5\u8be2\u5747\u4e3a 0 \u6761',
'Use the candidate organisms.':'\u4ece\u9898\u76ee\u5019\u9009\u7269\u79cd\u5207\u5165\u3002','Search enzyme literature.':'\u8f6c\u5411\u76f8\u5173\u9176\u7684\u6587\u732e\u3002',
'Sequence tokens':'\u5e8f\u5217\u7247\u6bb5','Organism + enzyme':'\u7269\u79cd + \u9176\u540d','Change the search strategy':'\u66f4\u6362\u68c0\u7d22\u7b56\u7565',
'A paper is a lead, not an identity.':'\u8bba\u6587\u662f\u7ebf\u7d22\uff0c\u4e0d\u662f\u8eab\u4efd\u786e\u8bc1\u3002','Connect a candidate to its original research.':'\u5c06\u5019\u9009\u8eab\u4efd\u4e0e\u539f\u59cb\u7814\u7a76\u5173\u8054\u3002',
'Find the relevant study.':'\u627e\u5230\u76f8\u5173\u7814\u7a76\u3002','Read the publisher abstract.':'\u8bfb\u53d6\u51fa\u7248\u5546\u6458\u8981\u3002','Test the sequence next.':'\u4e0b\u4e00\u6b65\uff0c\u68c0\u67e5\u5b9e\u9645\u5e8f\u5217\u3002',
'Publisher abstract':'\u51fa\u7248\u5546\u6458\u8981','Research lead':'\u7814\u7a76\u7ebf\u7d22','Candidate annotation':'\u5019\u9009\u6ce8\u91ca',
'GH1 beta-glucosidase':'GH1 \u03b2-\u8461\u8404\u7cd6\u82f7\u9176','Reported CDS':'\u6587\u732e\u62a5\u9053\u7f16\u7801\u5e8f\u5217','Reported protein':'\u6587\u732e\u62a5\u9053\u86cb\u767d',
'Candidate, not confirmation':'\u5019\u9009\u7ebf\u7d22\uff0c\u5c1a\u975e\u786e\u8bc1','Different lengths. Same gene?':'\u957f\u5ea6\u4e0d\u540c\uff0c\u4f1a\u662f\u540c\u4e00\u57fa\u56e0\u5417\uff1f',
'The missing 123 bases demand a direct check.':'\u76f8\u5dee 123 \u4e2a\u78b1\u57fa\uff0c\u9700\u8981\u76f4\u63a5\u6838\u5bf9\u3002','Similar size is not a match.':'\u957f\u5ea6\u76f8\u8fd1\u4e0d\u7b49\u4e8e\u5e8f\u5217\u5339\u914d\u3002',
'Could the input be a fragment?':'\u8f93\u5165\u4f1a\u4e0d\u4f1a\u53ea\u662f\u4e00\u4e2a\u7247\u6bb5\uff1f','Retrieve the reference sequence.':'\u83b7\u53d6\u539f\u59cb\u53c2\u8003\u5e8f\u5217\u3002',
'Length is a clue, not proof':'\u957f\u5ea6\u53ea\u662f\u7ebf\u7d22\uff0c\u5e76\u975e\u8bc1\u660e','Length discrepancy':'\u5e8f\u5217\u957f\u5ea6\u5dee\u5f02','Supplied DNA':'\u9898\u76ee DNA','Published CDS':'\u6587\u732e CDS','123 bp difference':'\u76f8\u5dee 123 bp',
'Direct comparison required':'\u9700\u8981\u76f4\u63a5\u6bd4\u8f83\u5e8f\u5217','Change the query. Recover the record.':'\u8c03\u6574\u67e5\u8be2\uff0c\u627e\u5230\u539f\u59cb\u8bb0\u5f55\u3002',
'Gene field: 0. Organism search: 7 records.':'\u57fa\u56e0\u5b57\u6bb5 0 \u6761\uff0c\u7269\u79cd\u68c0\u7d22 7 \u6761\u8bb0\u5f55\u3002',
'The gene-name query fails.':'\u57fa\u56e0\u540d\u67e5\u8be2\u65e0\u7ed3\u679c\u3002','Broaden to the organism.':'\u6269\u5c55\u4e3a\u7269\u79cd\u67e5\u8be2\u3002','Inspect the returned records.':'\u68c0\u67e5\u8fd4\u56de\u7684\u5e8f\u5217\u8bb0\u5f55\u3002',
'NCBI / returned nucleotide records':'NCBI / \u8fd4\u56de\u7684\u6838\u9178\u8bb0\u5f55','7 records in the logged run':'\u8f68\u8ff9\u8fd4\u56de 7 \u6761\u8bb0\u5f55','Reference record recovered':'\u627e\u5230\u53c2\u8003\u5e8f\u5217\u8bb0\u5f55',
'Check every supplied base.':'\u9010\u4f4d\u68c0\u67e5\u6bcf\u4e00\u4e2a\u8f93\u5165\u78b1\u57fa\u3002','Exact prefix equality, not a similarity guess.':'\u9a8c\u8bc1\u524d\u7f00\u5b8c\u5168\u76f8\u7b49\uff0c\u800c\u4e0d\u662f\u731c\u6d4b\u76f8\u4f3c\u3002',
'Compare the raw nucleotides.':'\u76f4\u63a5\u6bd4\u8f83\u539f\u59cb\u6838\u82f7\u9178\u3002','All 1,296 bases agree.':'1,296 \u4e2a\u78b1\u57fa\u5168\u90e8\u4e00\u81f4\u3002','The reference is longer.':'\u53c2\u8003\u5e8f\u5217\u4ecd\u6bd4\u7247\u6bb5\u66f4\u957f\u3002',
'Exact prefix comparison':'\u7cbe\u786e\u524d\u7f00\u6bd4\u8f83','Matched bases':'\u5339\u914d\u78b1\u57fa','Differences':'\u5dee\u5f02','Reference positions 1-1,296':'\u53c2\u8003\u4f4d\u7f6e 1-1,296','123 bp outside the query':'\u53e6\u6709 123 bp \u4e0d\u5728\u8f93\u5165\u7247\u6bb5\u4e2d',
'Fragment match confirmed':'\u786e\u8ba4\u7247\u6bb5\u5b8c\u5168\u5339\u914d','From a plausible lead to sequence evidence.':'\u4ece\u53ef\u80fd\u7684\u7ebf\u7d22\u5230\u5e8f\u5217\u7ea7\u8bc1\u636e\u3002',
'Change the route. Keep the standard of proof.':'\u8c03\u6574\u7814\u7a76\u8def\u5f84\uff0c\u4e0d\u964d\u4f4e\u9a8c\u8bc1\u6807\u51c6\u3002',
'Function / database annotation':'\u529f\u80fd / \u6570\u636e\u5e93\u6ce8\u91ca','Organism / reference record':'\u7269\u79cd / \u53c2\u8003\u8bb0\u5f55','Supplied fragment matched':'\u8f93\u5165\u7247\u6bb5\u5339\u914d',
'Sequence-backed identification':'\u5e8f\u5217\u8bc1\u636e\u652f\u6301\u7684\u8eab\u4efd\u9274\u5b9a','Recorded result: choice C':'\u8f68\u8ff9\u7ed3\u679c\uff1a\u9009\u9879 C','Inspect':'\u68c0\u67e5',
'1,296 bp fragment / 1,419 bp reference':'1,296 bp \u7247\u6bb5 / 1,419 bp \u53c2\u8003\u5e8f\u5217',
'No direct sequence hit':'\u65e0\u76f4\u63a5\u5e8f\u5217\u786e\u8bc1'
};
class BiologyFilm extends Shared.Film{
 tr(s){if(s==='ANALYTICAL CHEMISTRY')s='MOLECULAR BIOLOGY';return this.lang==='zh'?(ZH[s]??super.tr(s)):s;}
 active(){const k=this.st.key,u=this.u;return k==='decode'?'code':k==='pivot'?(u<2?'search':'scholar'):k==='lead'?(u<2.5?'visit':'code'):k==='length'?'code':['retrieve','compare'].includes(k)?'code':'';}
 dna(x,y,w,h,power=1){let s='',tm=this.fx?this.t:0;for(let i=0;i<76;i++){const u=i/75,a=u*14.2-tm*.55,xx=x+u*w,yy=y+h*.5,dy=Math.sin(a)*h*.31,z=Math.cos(a),col=z>0?P.purple:P.mint;const alpha=(.2+.62*Math.abs(z))*power;s+=this.line(xx,yy-dy,xx,yy+dy,col,.8)+this.dot(xx,yy-dy,2.4+.9*Math.max(z,0),P.purple,alpha)+this.dot(xx,yy+dy,2.4+.9*Math.max(-z,0),P.mint,alpha);if(i%6===0)s+=this.text(D.query[i],xx,yy-dy-12,13,col,500,'middle',MONO);if(this.fx&&i%3===0){for(let j=0;j<4;j++)s+=this.dot(xx+Math.cos(a+j)*9,yy+dy+Math.sin(a*1.4+j)*13,1.1,col,.12*power);}}
 return s;}
 seqStrip(seq,x,y,count=36,size=21,step=23,start=0,marker=-1){let s='';for(let j=0;j<count&&j+start<seq.length;j++){const base=seq[j+start],col=j+start===marker?P.amber:({A:P.purple,C:P.mint,G:P.blue,T:'#D6C7F5'}[base]||P.muted);s+=this.text(base,x+j*step,y,size,col,450,'start',MONO);}return s;}
 intro(){let s=this.text('Scientific Agent',64,253,62,P.ink,500)+this.text('Capabilities',64,326,62,P.ink,500)+this.text('Adaptive retrieval & sequence verification',66,388,25,P.purple)+this.text('From an insect DNA fragment',66,459,24,P.muted)+this.text(' to a traceable gene identity.',66,496,24,P.muted);
 s+=this.chip('Decode',64,548,145)+this.chip('Reframe',226,548,155,P.amber)+this.chip('Verify',398,548,155,P.mint);
 s+=this.dna(685,277,827,260)+this.metric('Input sequence','1,296 bp',715,574,365,P.purple)+this.metric('Translated residues','432 aa',1103,574,365,P.mint);
 s+=this.text('DNA sequence view',1090,263,18,P.dim,450,'middle');return s;}
 decode(){let s=this.title(this.st.title,'Normalize. Translate. Keep the identity open.')+this.left(['1,296 bases. One supplied fragment.','432 translated residues.','Function still unconfirmed.'],'Scientific reasoning','code',['dna = normalize(query)','len(dna)       # 1296','len(translate(dna))  # 432'],'Identity not yet established');
 s+=this.panel(592,284,944,430,'DNA to protein sequence','Code')+this.text('Query fragment',623,379,20,P.muted)+this.seqStrip(D.query,624,420,36,21,24)+this.seqStrip(D.query,624,454,36,21,24,36);
 s+=this.reveal(this.icon('arrow',1010,487,26,P.mint),.5)+this.text('Frame 1 translation',623,530,20,P.muted);
 s+=this.reveal(this.text(D.protein.slice(0,58),624,575,21,P.mint,450,'start',MONO),1)+this.reveal(this.text(D.protein.slice(58,116),624,611,21,P.mint,450,'start',MONO),1.2);
 s+=this.reveal(this.chip('1,296 bp',626,655,221,P.purple)+this.chip('432 aa',869,655,221,P.mint)+this.chip('Inspect',1113,655,221,P.blue),1.8);return s;}
 pivot(){let s=this.title(this.st.title,'A failed lookup changes the route, not the evidence.')+this.left(['Use the candidate organisms.','Search enzyme literature.'],'Next action','scholar',['query(protein_sequence)','query(dna_fragment)','results: 0, 0'],'Change the search strategy',P.amber);
 s+=this.panel(592,284,944,430,'Literal sequence search','Search / Scholar');s+=this.icon('search',625,379,29,P.purple)+this.text('No direct identity established',675,402,27,P.ink,450);
 s+=this.reveal(this.rect(625,441,876,93,'#271F2388',P.amber+'55',14)+this.icon('scholar',646,466,29,P.amber)+this.text('Google Scholar / 2 queries',693,480,22,P.muted)+this.text('0 results in both queries',693,513,25,P.amber,500),.45);
 let p=ramp(this.u,2.8,4.3);s+=this.group(this.line(672,580,1459,580,P.purple,1)+this.dot(mix(672,1459,p),580,4,P.mint,.8),p);
 s+=this.reveal(this.chip('Sequence tokens',626,627,290,P.dim)+this.icon('arrow',952,630,29,P.purple)+this.chip('Organism + enzyme',1010,627,440,P.mint),2.2);return s;}
 lead(){const ready=this.u>=2.5;let s=this.title(this.st.title,'Connect a candidate to its original research.');
 if(!ready){s+=this.left(['Find the relevant study.','Only references were returned.','Use Code to extract the abstract.'],'Next action','visit',['read_page(publisher)','returned: references only','sequence not available'],'Change the extraction route',P.amber);
 s+=this.panel(592,284,944,430,'Publisher abstract','Visit')+this.text('No sequence in the page excerpt',625,423,30,P.amber,500)+this.text('Only references were returned.',625,479,26,P.muted)+this.reveal(this.chip('Use Code to extract the abstract.',625,600,733,P.purple),.6);return s;}
 s+=this.left(['Use Code to extract the abstract.','Read the publisher abstract.','Test the sequence next.'],'Evidence','code',['fetch(publisher_html)','strip_scripts_and_styles()','extract(abstract)'],'Candidate, not confirmation');
 s+=this.panel(592,284,944,430,'Publisher abstract','Code / 2018');
 s+=this.text('Research lead',624,384,18,P.dim,500)+this.text('GH1 beta-glucosidase',624,433,34,P.purple,500)+this.text('Microcerotermes annandalei',624,476,28,P.ink);
 s+=this.reveal(this.metric('Reported CDS','1,419 bp',626,521,422,P.blue)+this.metric('Reported protein','472 aa',1071,521,422,P.mint),.5);
 s+=this.reveal(this.chip('Abstract recovered with Code',627,655,594,P.mint),1.8);return s;}
 length(){let s=this.title(this.st.title,'The missing 123 bases demand a direct check.')+this.left(['Similar size is not a match.','Could the input be a fragment?','Retrieve the reference sequence.'],'Next action','code',['query:     1296 bp','reference: 1419 bp','difference: 123 bp'],'Length is a clue, not proof',P.amber);
 s+=this.panel(592,284,944,430,'Length discrepancy','Evidence');const x=627,w=866,len=D.query.length/D.reference.length;
 s+=this.text('Supplied DNA',x,397,24,P.muted)+this.text('1,296 bp',1494,397,29,P.purple,500,'end')+this.rect(x,422,w*len,29,'url(#bioPurple)','none',4);
 s+=this.text('Published CDS',x,512,24,P.muted)+this.text('1,419 bp',1494,512,29,P.mint,500,'end')+this.rect(x,537,w,29,'url(#bioMint)','none',4);
 s+=this.reveal(this.rect(x+w*len,415,w*(1-len),157,P.amber+'0C',P.amber+'77',6)+this.text('123 bp difference',1494,618,25,P.amber,500,'end'),1.1);
 s+=this.reveal(this.chip('Direct comparison required',627,654,566,P.mint),2.5);return s;}
 retrieve(){let s=this.title(this.st.title,'Gene field: 0. Organism search: 7 records.')+this.left(['The gene-name query fails.','Broaden to the organism.','Inspect the returned records.'],'Scientific reasoning','code',['esearch: MaBG[Gene] -> 0','esearch: organism   -> 7','efetch: KU170546.1'],'Reference record recovered',P.mint);
 s+=this.panel(592,284,944,430,'NCBI / returned nucleotide records','Code / Entrez');
 D.records.forEach((r,i)=>{const y=359+i*46,hit=i===2,p=ramp(this.u,.2+i*.12,.7+i*.12);let q=this.rect(616,y,895,39,hit?'#1A322FBB':'#14182555',hit?P.mint+'60':'#292D3D',7)+this.dot(636,y+20,hit?4:2,hit?P.mint:P.dim)+this.text(r.id,655,y+26,22,hit?P.mint:P.muted,hit?550:450,'start',MONO)+this.text(r.bp+' bp',971,y+26,21,P.muted,450,'end',MONO)+this.text(r.type,1003,y+26,22,hit?P.ink:P.dim);if(hit)q+=this.reveal(this.icon('check',1467,y+6,26,P.mint),2);s+=this.group(q,p);});return s;}
 compare(){let s=this.title(this.st.title,'Exact prefix equality, not a similarity guess.')+this.left(['Compare the raw nucleotides.','All 1,296 bases agree.','The reference is longer.'],'Validate','code',['ref = fasta("KU170546.1")','query == ref[:1296]','True'],'Fragment match confirmed',P.mint);
 s+=this.panel(592,284,944,430,'Exact prefix comparison','KU170546.1');
 const n=Math.floor(ramp(this.u,.2,5.8)*D.query.length),cols=72,cw=12,x=623,y=366;
 for(let i=0;i<D.query.length;i++){const done=i<n,eq=D.query[i]===D.reference[i],xx=x+(i%cols)*cw,yy=y+Math.floor(i/cols)*12,col=done?(eq?P.mint:P.amber):P.edge;s+=this.rect(xx,yy,9,8,col,'none',1);}
 if(this.fx&&n>0&&n<D.query.length){const xx=x+(n%cols)*cw,yy=y+Math.floor(n/cols)*12;s+=this.dot(xx+4,yy+4,5,P.mint,.6)+this.dot(xx+4,yy+4,11,P.mint,.12);}
 s+=this.text('Matched bases',624,624,20,P.muted)+this.text(n.toLocaleString('en-US')+' / 1,296',624,675,39,P.mint,500,'start',MONO)+this.text('Differences',1182,624,20,P.muted)+this.text('0',1182,675,39,P.mint,500,'start',MONO);
 s+=this.reveal(this.text('Reference positions 1-1,296',592,750,20,P.muted)+this.text('123 bp outside the query',1536,750,20,P.dim,450,'end'),3.4);return s;}
 outro(){let s=this.title(this.st.title,'Change the route. Keep the standard of proof.');s+=this.dna(140,272,1330,134,.35);
 s+=this.metric('Supplied fragment matched','1,296 / 1,296',64,391,488,P.mint);
 s+=this.rect(576,391,960,223,'#121923EF',P.mint+'30',17)+this.text('Function / database annotation',603,429,19,P.muted)+this.text('GH1 beta-glucosidase',603,474,33,P.ink,500)+this.text('Organism / reference record',603,526,19,P.muted)+this.text('Microcerotermes annandalei',603,573,30,P.mint,450);
 s+=this.text('KU170546.1',64,542,28,P.purple,500,undefined,MONO)+this.text('Recorded result: choice C',64,586,23,P.muted)+this.text('1,296 bp fragment / 1,419 bp reference',800,654,25,P.muted,450,'middle');
 s+=this.chip('Reframe',322,702,247,P.amber)+this.chip('Retrieve',592,702,247,P.purple)+this.chip('Verify',862,702,247,P.mint);return s;}
 render(){const defs='<defs><radialGradient id="aura" cx="73%" cy="42%" r="72%"><stop stop-color="#4B316B" stop-opacity=".17"/><stop offset=".67" stop-color="#173F43" stop-opacity=".06"/><stop offset="1" stop-color="#090C13" stop-opacity="0"/></radialGradient><linearGradient id="bioPurple"><stop stop-color="#66558E"/><stop offset="1" stop-color="#BBA6FA"/></linearGradient><linearGradient id="bioMint"><stop stop-color="#345757"/><stop offset="1" stop-color="#8EDDCB"/></linearGradient></defs>';
 const body=this[this.st.key](),a=this.st.key==='intro'?1:.25+.75*ramp(this.u,0,.33);return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="'+esc(this.tr(this.st.title))+'">'+defs+this.background()+this.chrome()+this.group(body,a)+this.rail()+'</svg>';}
}
const api={renderSVG:(t,kind,config,lang='en',opts={})=>new BiologyFilm(t,kind,config,lang,opts).render(),stageAt:Shared.stageAt,ZH,BiologyFilm};root.BiologyShowcase=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

