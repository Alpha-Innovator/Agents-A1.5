/* light-visual-palette */
'use strict';
/* Agents-A1.5 · computational chemistry showcase (house system v0.7.2).
   Scientific numbers come from D, which build.py assembles from the run directory;
   WORKSPACE carries the task files given to the model, inlined at build time.
   Differences to the parent, chart geometry, the 3D viewer and the process film are
   presentation-layer work on those outputs, not additional model or Psi4 results. */
const PAGE_LOCATION = window.showcaseLocation || location;
const LANG = 'en';
const EN_ENTRIES = Object.entries(EN).sort((a, b) => b[0].length - a[0].length);
const SKELETON = !!D.placeholder;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const tr = (zh, en) => LANG === 'en' ? en : zh;
const L = o => o == null ? null : typeof o === 'string' ? o : (o[LANG] ?? o.zh ?? o.en ?? null);
const MINUS = '−';
const fmt = (v, d = 2) => v == null || !Number.isFinite(v) ? '—' : (v < 0 ? MINUS : '') + Math.abs(v).toFixed(d);
const signed = (v, d = 2) => v == null || !Number.isFinite(v) ? '—' : Math.abs(v) < .5 * 10 ** -d ? (0).toFixed(d) : (v > 0 ? '+' : MINUS) + Math.abs(v).toFixed(d);
const pend = (key, missing = false) => SKELETON || missing ? ` data-pending="${esc(key)}"` : '';
const ph = (zh, en) => `<em class="pending-text">${tr(zh, en)}</em>`;
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, name) => values[name]);

/* ---------------------------------------------------------------- locale */
function T(value) {
  const s = String(value);
  if (LANG !== 'en' || !/[㐀-鿿]/.test(s)) return s;
  const key = s.trim();
  if (EN[key]) return s.replace(key, EN[key]);
  let out = s;
  for (const [zh, en] of EN_ENTRIES) if (out.includes(zh)) out = out.split(zh).join(en);
  return out.replace(/（/g, ' (').replace(/）/g, ')').replace(/：/g, ': ');
}
function localizeRoot(root) {
  if (LANG !== 'en') return;
  const nodes = [];
  if (root.nodeType === 3) nodes.push(root);
  else if (root.nodeType === 1 || root.nodeType === 9) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: n => n.parentElement?.closest('script,style,[data-no-translate]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
    while (walk.nextNode()) nodes.push(walk.currentNode);
  }
  nodes.forEach(n => { const out = T(n.nodeValue); if (out !== n.nodeValue) n.nodeValue = out; });
  const scope = root.nodeType === 1 ? [root, ...root.querySelectorAll('[title],[aria-label],[data-tip],[placeholder]')] : root.nodeType === 9 ? [...root.querySelectorAll('[title],[aria-label],[data-tip],[placeholder]')] : [];
  for (const el of scope) for (const k of ['title', 'aria-label', 'data-tip', 'placeholder']) if (el.hasAttribute(k)) { const v = el.getAttribute(k), out = T(v); if (out !== v) el.setAttribute(k, out); }
}
function localeURL(href, lang = LANG) { const url = new URL(href, PAGE_LOCATION.href); url.searchParams.set('lang', lang); return url.href; }
function initLocale() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  $$('[data-language-slot]').forEach(slot => { slot.remove(); });
  $$('a[href]').forEach(a => { if (/^(?:\.\.\/\.\.\/)?(index|01-launch|02-chemistry)\.html(?:[?#]|$)/.test(a.getAttribute('href'))) a.href = localeURL(a.getAttribute('href')); });
  if (LANG === 'en') document.title = 'Agents-A1.5 · The computational chemistry showcase';
  localizeRoot(document);
  if (LANG === 'en') new MutationObserver(ms => { for (const m of ms) { if (m.type === 'childList') m.addedNodes.forEach(localizeRoot); else localizeRoot(m.target); } })
    .observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'data-tip']});
  document.addEventListener('click', e => { const b = e.target.closest('[data-language]'); if (!b) return; const url = new URL(PAGE_LOCATION.href); url.searchParams.set('lang', b.dataset.language); PAGE_LOCATION.href = url.href; });
}

/* ---------------------------------------------------------------- data */
const COMPONENTS = [
  ['elst', () => tr('静电', 'Electrostatics'), '#9085e9'],
  ['exch', () => tr('交换', 'Exchange'), '#d55181'],
  ['ind', () => tr('诱导', 'Induction'), '#c98500'],
  ['disp', () => tr('色散', 'Dispersion'), '#199e70'],
];
const compLabel = k => COMPONENTS.find(c => c[0] === k)[1]();
const compColor = k => COMPONENTS.find(c => c[0] === k)[2];
const BY_ID = Object.fromEntries(D.candidates.map(c => [c.id, c]));
const PARENT = BY_ID[D.parentId];
const CANDS = D.candidates.filter(c => c.role !== 'parent');
const accepted = c => (c?.poses || []).filter(p => p.status === 'accepted' && Number.isFinite(p.energy?.associationCP));
function bestPose(c, mode) {
  const ps = accepted(c).filter(p => mode === 'all' || p.ringN);
  return ps.length ? ps.reduce((a, b) => b.energy.associationCP < a.energy.associationCP ? b : a) : null;
}
function delta(c, mode) {
  const a = bestPose(c, mode), b = bestPose(PARENT, mode);
  return a && b ? a.energy.associationCP - b.energy.associationCP : null;
}
function strongest(mode = 'all') {
  const scored = CANDS.map(c => ({c, d: delta(c, mode)})).filter(r => r.d != null);
  return scored.length ? scored.reduce((a, b) => b.d < a.d ? b : a) : null;
}
/* How the SAPT terms moved for a candidate, relative to the parent. Attraction and
   repulsion are reported together: for a new contact both grow and largely cancel. */
function forceShift(c, mode = 'all') {
  const p = bestPose(c, mode), base = bestPose(PARENT, mode);
  if (!p || !base) return null;
  const d = Object.fromEntries(COMPONENTS.map(([k]) => [k, p.sapt[k] - base.sapt[k]]));
  const dominant = COMPONENTS.map(([k]) => ({key: k, value: d[k]}))
    .reduce((a, b) => Math.abs(b.value) > Math.abs(a.value) ? b : a);
  return {parts: d, attraction: d.elst + d.ind + d.disp, repulsion: d.exch,
          net: p.sapt.total - base.sapt.total, dominant};
}
// Compare the lowest-association-energy pose for each distinct final contact.
// Use exactly the same poses in the DFT chart, SAPT charts and structure inspector.
const COMPARISON_ROWS = D.candidates.flatMap(c => {
  const groups = new Map();
  for (const p of accepted(c)) {
    const prev = groups.get(p.finalMotif);
    if (!prev || p.energy.associationCP < prev.energy.associationCP) groups.set(p.finalMotif, p);
  }
  const poses = [...groups.values()].sort((a, b) => Number(b.ringN) - Number(a.ringN));
  if (!poses.length) poses.push(null);
  return poses.map(p => ({c, p,
    id: poses.length > 1 ? `${c.id}:${p.finalMotif}` : c.id,
    label: poses.length > 1 ? `${c.short}(${p.ringN ? 'N-HB' : p.finalMotif === 'OH_CO' ? 'O-HB' : p.finalMotif})` : c.short,
    d: p && bestPose(PARENT, 'ringN') ? p.energy.associationCP - bestPose(PARENT, 'ringN').energy.associationCP : null,
  }));
});
const comparisonCandidates = () => COMPARISON_ROWS.filter(r => r.c.role !== 'parent');
const contactKey = () => tr('N-HB：酰胺 N–H···N（吡啶环氮）；O-HB：羟基 O–H···O=C（酰胺羰基）。每种结合方式取采样中缔合能最低的构象。',
  'N-HB: amide N–H···N (pyridine ring); O-HB: hydroxyl O–H···O=C (amide carbonyl). Each binding mode uses its lowest-association-energy sampled pose.');
const state = {selected: comparisonCandidates()[0]?.id, filter: 'all', saptView: 'abs', hero: null, evidence: 'energies'};
const posLabel = p => p == null ? tr('母体', 'Parent') : tr(`${p}-位`, `${p}-position`);
/* A pose that no longer uses the ring nitrogen is not the same contact as the rest,
   so every chart that ranks it alongside the others marks it. */
const posMoved = p => !!p && p.finalMotif !== 'NH_Nring';
const motifLabel = m => ({NH_Nring: tr('N–H···N（环氮）', 'N–H···N (ring)'), NH_X: tr('N–H···取代基', 'N–H···substituent'), OH_CO: tr('O–H···O=C（羰基）', 'O–H···O=C (carbonyl)'), other: tr('其他接触', 'Other contact')}[m] || m || '—');
const DIRS = {
  stronger: ['↑', () => tr('预计更强', 'Predicted stronger')],
  weaker: ['↓', () => tr('预计更弱', 'Predicted weaker')],
  similar: ['≈', () => tr('预计相近', 'Predicted similar')],
  uncertain: ['?', () => tr('不确定', 'Uncertain')],
};
const VERDICTS = {
  supported: ['✓', 'var(--good)', () => tr('预测成立', 'Prediction held')],
  refuted: ['✕', 'var(--crit)', () => tr('预测不成立', 'Prediction failed')],
  partial: ['◐', 'var(--warn)', () => tr('部分成立', 'Partly held')],
  inconclusive: ['?', 'var(--muted)', () => tr('无法判断', 'Inconclusive')],
};

/* ---------------------------------------------------------------- molecule viewer */
const ELEM = {
  H: {r: .31, c: '#d9d7e3', s: .25}, C: {r: .76, c: '#8e93a6', s: .40}, N: {r: .71, c: '#7390ff', s: .40},
  O: {r: .66, c: '#ff6f6f', s: .40}, F: {r: .57, c: '#86d696', s: .36}, R: {r: .76, c: '#6fbdb5', s: .48},
};
const elem = e => ELEM[e] || ELEM.C;
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(v * f));
  return `rgb(${c.join(',')})`;
}
class MolView {
  constructor(canvas, opt = {}) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.opt = {scale: 1, labels: true, auto: true, ...opt};
    this.yaw = .7; this.pitch = -.45; this.drag = null; this.visible = true; this.w = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    canvas.addEventListener('pointerdown', e => { this.drag = {x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch}; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!this.drag) return;
      this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * .01;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.drag.pitch + (e.clientY - this.drag.y) * .01));
      this.draw();
    });
    const end = () => { this.drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.loop(); }).observe(canvas);
  }
  set(geom, pose) {
    this.pose = pose; this.geom = geom;
    if (!geom) { this.atoms = []; this.bonds = []; this.draw(); return; }
    const n = geom.atoms.length, cx = [0, 0, 0];
    geom.atoms.forEach(a => { cx[0] += a[1] / n; cx[1] += a[2] / n; cx[2] += a[3] / n; });
    this.atoms = geom.atoms.map(([e, x, y, z], i) => ({e, x: x - cx[0], y: y - cx[1], z: z - cx[2], i, frag: i < geom.nA ? 0 : 1}));
    this.R = Math.max(...this.atoms.map(a => Math.hypot(a.x, a.y, a.z))) || 1;
    this.bonds = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = this.atoms[i], b = this.atoms[j];
      if (a.frag !== b.frag) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1.2 * (elem(a.e).r + elem(b.e).r)) this.bonds.push([i, j]);
    }
    this.draw();
  }
  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    this.w = r.width; this.h = r.height;
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }
  loop() {
    if (this.raf || !this.opt.auto || this.reduced) return;
    const step = () => { this.raf = null; if (!this.visible) return; if (!this.drag) { this.yaw += .0035; this.draw(); } this.raf = requestAnimationFrame(step); };
    this.raf = requestAnimationFrame(step);
  }
  draw() {
    const {ctx, w, h} = this;
    if (!w) return;
    ctx.clearRect(0, 0, w, h);
    if (!this.atoms?.length) return;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const s = Math.min(w, h) / (2 * (this.R + 1.1)) * this.opt.scale;
    const P = this.atoms.map(a => {
      const x = a.x * cy + a.z * sy, z1 = -a.x * sy + a.z * cy;
      const y = a.y * cp - z1 * sp, z = a.y * sp + z1 * cp, k = 1 / (1 - z * .035);
      return {a, x: w / 2 + x * s * k, y: h / 2 - y * s * k, z, k};
    });
    const depth = z => .45 + .55 * Math.max(0, Math.min(1, (z + this.R) / (2 * this.R)));
    const items = [];
    for (const [i, j] of this.bonds) items.push({z: (P[i].z + P[j].z) / 2, f: () => {
      const A = P[i], B = P[j], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      ctx.globalAlpha = depth((A.z + B.z) / 2); ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, 2.6 * (A.k + B.k) / 2 * this.opt.scale);
      ctx.strokeStyle = elem(A.a.e).c; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(mx, my); ctx.stroke();
      ctx.strokeStyle = elem(B.a.e).c; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(B.x, B.y); ctx.stroke();
    }});
    const g = this.geom, hl = new Set(g.highlight || []);
    if (g.donorH != null && g.acceptor != null) {
      const A = P[g.donorH], B = P[g.acceptor];
      items.push({z: (A.z + B.z) / 2 + .01, f: () => {
        ctx.globalAlpha = .95; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.6; ctx.strokeStyle = '#f1e2b3';
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
      }});
    }
    for (const p of P) items.push({z: p.z, f: () => {
      const E = elem(p.a.e), r = Math.max(2.5, E.s * s * p.k * .62);
      ctx.globalAlpha = depth(p.z);
      if (hl.has(p.a.i)) { ctx.save(); ctx.shadowColor = '#6fbdb5'; ctx.shadowBlur = 18; ctx.fillStyle = '#6fbdb5'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.25, 0, 7); ctx.fill(); ctx.restore(); }
      const grad = ctx.createRadialGradient(p.x - r * .35, p.y - r * .35, r * .1, p.x, p.y, r);
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(.18, E.c); grad.addColorStop(1, shade(E.c, .45));
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
    }});
    items.sort((a, b) => a.z - b.z).forEach(it => it.f());
    ctx.globalAlpha = 1;
    if (!this.opt.labels) return;
    const label = (p, t, dx = 10, dy = -10) => {
      ctx.font = '11px Arial'; ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#172b45';
      ctx.strokeText(t, p.x + dx, p.y + dy); ctx.fillText(t, p.x + dx, p.y + dy);
    };
    if (g.donorH != null) label(P[g.donorH], 'H');
    if (g.acceptor != null) label(P[g.acceptor], P[g.acceptor].a.e === 'R' ? tr('取代基', 'substituent') : 'N');
    const anchor = [...hl].find(i => i !== g.acceptor && this.atoms[i].e !== 'H');
    if (anchor != null) label(P[anchor], 'R');
    if (this.pose?.hbond?.dist != null && g.donorH != null) {
      const A = P[g.donorH], B = P[g.acceptor];
      label({x: (A.x + B.x) / 2, y: (A.y + B.y) / 2}, `${this.pose.hbond.dist.toFixed(2)} Å`, -18, 20);
    }
  }
}

/* ---------------------------------------------------------------- ring drawing */
const RING_ANGLES = [-90, -30, 30, 90, 150, 210]; // positions 1(N)..6, clockwise
function ringSVG(position, {size = 62, numbers = false, counts = null, active = 'all', group = null} = {}) {
  const big = numbers, R = big ? 58 : 15, cx = big ? 150 : 44, cy = big ? 140 : 44, W = big ? 300 : 88, H = big ? 290 : 88;
  const pt = (k, r = R) => { const t = RING_ANGLES[k] * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; };
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${big ? W : size}" height="${big ? H : size}" role="img" aria-label="${position ? tr(`${position}-位取代的吡啶`, `Pyridine substituted at position ${position}`) : tr('吡啶', 'Pyridine')}">`;
  const bond = (a, b, inner) => {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#526078" stroke-width="${big ? 1.6 : 1.3}"/>`;
    if (inner) { const [a1, b1] = pt(a, R * .78), [a2, b2] = pt(b, R * .78); s += `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="#526078" stroke-width="${big ? 1.2 : 1}"/>`; }
  };
  for (let k = 0; k < 6; k++) bond(k, (k + 1) % 6, k % 2 === 0);
  const [nx, ny] = pt(0);
  s += `<circle cx="${nx}" cy="${ny}" r="${big ? 11 : 5.5}" fill="#f4f7fb"/><text x="${nx}" y="${ny + (big ? 5 : 3)}" text-anchor="middle" font-family="Arial" font-size="${big ? 15 : 9}" fill="#1f3db2">N</text>`;
  if (big) {
    for (let p = 2; p <= 6; p++) {
      const [x, y] = pt(p - 1, R + 34), n = counts?.[p] || 0, on = active === 'all' || +active === p;
      const fillCol = n ? (on ? '#3f928a' : '#e7edf6') : '#eff3f9';
      s += `<g class="pos" data-ring-pos="${p}" role="button" tabindex="${n ? 0 : -1}" aria-label="${tr(`${p}-位：${n} 个候选`, `Position ${p}: ${n} candidates`)}">`;
      const [bx, by] = pt(p - 1, R + 4), [ex, ey] = pt(p - 1, R + 20);
      if (n) s += `<line x1="${bx}" y1="${by}" x2="${ex}" y2="${ey}" stroke="${on ? '#3f928a' : '#c6d4e5'}" stroke-width="1.5"/>`;
      s += `<circle cx="${x}" cy="${y}" r="16" fill="${fillCol}" stroke="${n ? '#3f928a' : '#e8eef6'}" stroke-width="1"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Arial" font-size="12" fill="${n && on ? '#f3f6fa' : '#526078'}">${p}</text>`;
      if (n) s += `<text x="${x}" y="${y + 30}" text-anchor="middle" font-family="Arial" font-size="10" fill="#526078">×${n}</text>`;
      s += '</g>';
    }
  } else if (position) {
    const [bx, by] = pt(position - 1), [ex, ey] = pt(position - 1, R + 9), [lx, ly] = pt(position - 1, R + 21);
    s += `<line x1="${bx}" y1="${by}" x2="${ex}" y2="${ey}" stroke="#526078" stroke-width="1.3"/>`;
    if (group) s += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-family="Arial" font-size="10" fill="#3f9289">${esc(group)}</text>`;
  }
  return s + '</svg>';
}

/* ---------------------------------------------------------------- hero */
let heroView = null;
function initHero() {
  const chips = $('[data-candidate-chips]');
  chips.innerHTML = [PARENT, ...CANDS].map(c => `<button data-hero-candidate="${esc(c.id)}"${c.id === PARENT.id ? ' class="active"' : ''}>${esc(c.short)}<b>${posLabel(c.position)}</b></button>`).join('');
  if (SKELETON) chips.dataset.pending = 'candidates.json';
  heroView = new MolView($('[data-hero-mol]'), {scale: 1.15, labels: false});
  showHeroCandidate(PARENT.id);
  const baseline = bestPose(PARENT, 'all')?.energy.associationCP;
  $('[data-discovery-stat=baseline]').textContent = baseline == null ? '—' : fmt(baseline);
  if (SKELETON || baseline == null) $('.axis-callout').dataset.pending = 'results.json';
  const finding = D.findings;
  $('[data-hero-finding]').innerHTML = finding
    ? `${esc(L(finding.title))}${finding.emphasis ? `<em>${esc(L(finding.emphasis))}</em>` : ''}`
    : ph('这次运行得到的科学结论，将写在这里。', 'The scientific conclusion from this run will appear here.');
  if (!finding) $('.hero-finding').dataset.pending = 'REPORT.md';
  const lines = finding?.evidence || [];
  $('[data-hero-result]').textContent = lines[0] ? L(lines[0])
    : tr('这次运行得到的主要规律，将写在这里。', 'The pattern this run found will appear here.');
  $('[data-hero-force]').textContent = lines[1] ? L(lines[1])
    : tr('另一条关键结论，将写在这里。', 'The second conclusion will appear here.');
  if (SKELETON) $('.hero-evidence').dataset.pending = 'results.json';
}
function showHeroCandidate(id) {
  const c = BY_ID[id], p = bestPose(c, 'all'), d = c.role === 'parent' ? null : delta(c, 'all');
  state.hero = id;
  $$('[data-hero-candidate]').forEach(b => b.classList.toggle('active', b.dataset.heroCandidate === id));
  heroView.set(p?.geometry, p);
  const moved = p && p.finalMotif !== 'NH_Nring';
  const motif = p ? `<b class="motif">${motifLabel(p.finalMotif)}</b>${moved ? tr('（更换了氢键结合位点）', ' (a different hydrogen-bond site)') : ''}` : tr('没有通过检查的构象', 'No accepted pose');
  $('.hero-candidate-readout').innerHTML = `<div><strong>${esc(L(c.name))}</strong><span class="${moved ? 'moved' : ''}">${motif}</span></div><b class="${moved ? 'moved' : ''}">${c.role === 'parent' ? tr('基准', 'Baseline') : signed(d) + ' kcal/mol'}</b><button data-hero-locate="${esc(id)}" aria-label="${tr('在结合能对比中查看', 'See in the energy comparison')} ${esc(c.short)}">↗</button>`;
}

/* ---------------------------------------------------------------- workspace */
const KIND_LABEL = {task: () => tr('任务', 'Task'), spec: () => tr('规范', 'Spec')};
function inputFileButton(file) {
  return `<button class="workspace-file" data-workspace-file="${file.id}" title="${esc(file.path)}"><span class="file-type">MD</span><span class="file-info"><strong class="file-name">${esc(file.name)}</strong><span class="file-summary">${file.lines} ${tr('行', 'lines')} · ${(file.bytes / 1024).toFixed(1)} KB</span></span><i aria-hidden="true">↗</i></button>`;
}
function renderInputTree() {
  const q = $('[data-input-search]').value.trim().toLowerCase(), type = $('[data-input-type]').value;
  const files = WORKSPACE.files.filter(f => (type === 'all' || f.kind === type) && (!q || f.path.toLowerCase().includes(q) || f.text.toLowerCase().includes(q)));
  const roots = files.filter(f => !f.folder), folders = [...new Set(files.filter(f => f.folder).map(f => f.folder))];
  let html = roots.map(inputFileButton).join('');
  folders.forEach(folder => {
    const group = files.filter(f => f.folder === folder);
    html += `<details class="input-folder" open><summary><span>▸</span><strong>${esc(folder)}</strong><span>${group.length}</span></summary>${group.map(inputFileButton).join('')}</details>`;
  });
  $('#workspace-file-list').innerHTML = html || `<p class="input-empty">${tr('没有匹配的任务文件', 'No matching task file')}</p>`;
  $('[data-workspace-count]').textContent = (files.length === WORKSPACE.files.length ? '' : files.length + ' / ') + WORKSPACE.files.length + ' ' + tr('份文件', 'files');
}
function showInputSelection(file) {
  $('[data-input-selection]').innerHTML = `<span class="file-type">MD</span><div><strong>${esc(file.name)}</strong><span>${KIND_LABEL[file.kind]()} · ${file.lines} ${tr('行', 'lines')}</span></div><button data-workspace-file="${file.id}">${tr('预览', 'Preview')} ↗</button>`;
}
function openWorkspace(id) {
  const file = WORKSPACE.files.find(f => f.id === id);
  if (!file) return;
  const dialog = $('#workspace-dialog');
  $('.workspace-preview', dialog).innerHTML = `<div class="eyebrow">${tr('提交给模型的输入', 'Submitted to the model')}</div><h3>${esc(L(file.title))}</h3>
    <p class="preview-origin" data-no-translate>${esc(file.path)}</p>
    <div class="preview-meta"><span>${file.lines} ${tr('行', 'lines')} · ${(file.bytes / 1024).toFixed(1)} KB</span><span>${KIND_LABEL[file.kind]()}</span><span>${tr('前 60 行 · 原文节选', 'First 60 lines · excerpt')}</span></div>
    <pre class="file-preview" data-no-translate>${esc(file.preview)}</pre>
    <div class="input-integrity"><span>SHA-256</span><code data-no-translate>${esc(file.sha256)}</code></div>
    <button class="btn small" data-workspace-save="${file.id}" style="margin-top:14px">${tr('下载此文件', 'Download this file')} ↓</button>`;
  $('.workspace-modal-nav', dialog).innerHTML = WORKSPACE.files.map(inputFileButton).join('');
  $$('.workspace-modal-nav [data-workspace-file]', dialog).forEach(b => b.classList.toggle('active', b.dataset.workspaceFile === id));
  showInputSelection(file);
  if (!dialog.open) dialog.showModal();
}

/* ---------------------------------------------------------------- process film
   A deterministic, seekable reconstruction of the recorded workflow. Scene content
   is drawn from D: it presents saved results, it is not a screen recording. */
const FILM_LEN = 30;  // set by the scenes below, not inherited
const easeOut = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
class ProcessFilm {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.t = 0;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }
  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    this.w = r.width; this.h = r.height; this.dpr = dpr;
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.render(this.t);
  }
  text(t, x, y, {size = 14, color = '#172b45', align = 'left', weight = ''} = {}) {
    const ctx = this.ctx;
    ctx.font = `${weight} ${size}px ChemDots, Showcase, Arial, sans-serif`.trim();
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(t, x, y); ctx.textAlign = 'left';
  }
  box(x, y, w, h, r, fillCol, stroke) {
    const ctx = this.ctx;
    ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w), h, r);
    if (fillCol) { ctx.fillStyle = fillCol; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  /* Skeletal ring in the usual notation: the heteroatom and any substituent are
     written out, so CH3, F and OH are told apart by name rather than by colour. */
  ring(cx, cy, r, {sub = null, group = null, glow = false} = {}) {
    const ctx = this.ctx;
    const vertex = (k, rad = r) => [cx + rad * Math.cos((k * 60 - 90) * Math.PI / 180), cy + rad * Math.sin((k * 60 - 90) * Math.PI / 180)];
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const [x, y] = vertex(k); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.strokeStyle = glow ? '#3f9388' : '#526078'; ctx.lineWidth = 1.6; ctx.stroke();
    // Kekulé double bonds N1=C2, C3=C4, C5=C6 — without them the ring reads as piperidine.
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k += 2) {
      const [ax, ay] = vertex(k, r * .74), [bx, by] = vertex(k + 1, r * .74);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    const [nx, ny] = vertex(0);
    ctx.beginPath(); ctx.arc(nx, ny, r * .3, 0, 7); ctx.fillStyle = '#f5f8fc'; ctx.fill();
    this.text('N', nx, ny + r * .16, {size: r * .46, color: '#1f3db2', align: 'center'});
    if (sub != null && group) {
      const a = ((sub - 1) * 60 - 90) * Math.PI / 180, [vx, vy] = vertex(sub - 1);
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(cx + r * 1.42 * Math.cos(a), cy + r * 1.42 * Math.sin(a));
      ctx.strokeStyle = '#526078'; ctx.lineWidth = 1.4; ctx.stroke();
      this.text(group, cx + r * 1.78 * Math.cos(a), cy + r * 1.78 * Math.sin(a) + r * .16, {size: r * .46, color: '#3f9289', align: 'center'});
    }
  }
  render(t) {
    this.t = t = Math.max(0, Math.min(FILM_LEN, t));
    if (!this.w) return;
    const ctx = this.ctx, s = Math.min(this.w / 1000, this.h / 625);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = '#f5f8fc'; ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.translate((this.w - 1000 * s) / 2, (this.h - 625 * s) / 2); ctx.scale(s, s);
    const sc = SCENES.find(x => t < x.end) || SCENES[SCENES.length - 1];
    ctx.save();
    ctx.globalAlpha = sc.start === 0 ? 1 : Math.min(1, (t - sc.start) / .45);  // the opening scene is visible at t=0
    sc.draw(this, Math.max(0, Math.min(1, (t - sc.start) / (sc.end - sc.start))));
    ctx.restore();
    SCENES.forEach((x, i) => {
      const bx = 60 + i * 148, on = t >= x.start;
      this.box(bx, 596, 120, 3, 2, on ? '#3f928a' : '#ebf0f8');
      this.text(x.label(), bx, 586, {size: 9, color: on ? '#3f9388' : '#526078'});
    });
    ctx.restore();
  }
}
const SCENES = [
  {start: 0, end: 4.6, label: () => tr('任务', 'The task'), draw(f, p) {
    f.text(tr('研究请求与计算规范', 'The request and the specifications'), 60, 116, {size: 26, color: '#3f9286'});
    f.text(tr('没有候选分子，没有脚本，没有参考答案', 'No candidate molecules, no scripts, no reference answers'), 60, 146, {size: 13, color: '#526078'});
    WORKSPACE.files.forEach((file, i) => {
      const a = easeOut((p - i * .1) * 4);
      if (a <= 0) return;
      f.ctx.globalAlpha = a;
      f.box(60, 186 + i * 50, 390, 40, 8, '#f4f7fb', '#3e938833');
      f.text(file.name, 78, 211 + i * 50, {size: 13, color: '#3f9288'});
      f.text(`${file.lines} ${tr('行', 'lines')}`, 430, 211 + i * 50, {size: 11, color: '#526078', align: 'right'});
      f.ctx.globalAlpha = 1;
    });
    const q = tr('“以肽键模型分子 N-甲基乙酰胺与吡啶为体系，考察吡啶环上的小取代基如何改变二者 N–H···N 氢键的强弱；先提出候选并写下预测，再用量子化学计算检验，并解释结构与能量上的原因。”',
                 '"Using the peptide-bond model N-methylacetamide with pyridine, investigate how small substituents on the pyridine ring change the strength of their N–H···N hydrogen bond: propose candidates and predictions first, then test them with quantum chemistry and explain the structural and energetic reasons."');
    const shown = q.slice(0, Math.floor(q.length * easeOut(p * 1.7)));
    const limit = LANG === 'en' ? 52 : 26;  // characters per line at this size
    const words = shown.split(/(?<=[，；。,\s])/);
    let line = '', y = 232;
    words.forEach(w => {
      if (line.length + w.length > limit) { f.text(line, 520, y, {size: 17, color: '#3f9286'}); line = ''; y += 30; }
      line += w;
    });
    f.text(line, 520, y, {size: 17, color: '#3f9286'});
  }},
  {start: 4.6, end: 10.5, label: () => tr('候选', 'Candidates'), draw(f, p) {
    f.text(tr('模型提出候选，并先写下预测', 'The model proposes candidates, and predicts first'), 60, 116, {size: 26, color: '#3f9286'});
    f.ring(170, 330, 44, {glow: true});
    f.text(PARENT.short, 170, 412, {size: 13, color: '#3f9388', align: 'center'});
    f.text(tr('母体', 'Parent'), 170, 432, {size: 11, color: '#526078', align: 'center'});
    CANDS.forEach((c, i) => {
      const a = easeOut((p - .1 - i * .12) * 3.4);
      if (a <= 0) return;
      const x = 420 + (i % 3) * 200, y = 250 + Math.floor(i / 3) * 180;
      f.ctx.globalAlpha = a;
      f.ctx.beginPath(); f.ctx.moveTo(214, 330); f.ctx.lineTo(x - 42, y); f.ctx.strokeStyle = '#c6d4e5'; f.ctx.lineWidth = 1; f.ctx.stroke();
      f.ring(x, y, 30, {sub: c.position, group: c.group});
      f.text(c.short, x, y + 82, {size: 12, color: '#3f9287', align: 'center'});  // clears a group written at the 4-position
      const dir = c.prediction && DIRS[c.prediction.direction];
      if (dir) f.text(`${dir[0]} ${dir[1]()}`, x, y + 100, {size: 10, color: '#526078', align: 'center'});
      f.ctx.globalAlpha = 1;
    });
  }},
  {start: 10.5, end: 19.2, label: () => tr('计算', 'Calculations'), draw(f, p) {
    f.text(tr('并行提交量子化学计算', 'Quantum chemistry jobs run in parallel'), 60, 116, {size: 26, color: '#3f9286'});
    const jobs = D.journey?.jobs || [], rows = [...new Set(jobs.map(j => j.row))];
    const stages = ['pre', 'opt', 'cp', 'sapt'], names = {pre: tr('预优化', 'Pre-opt'), opt: tr('几何优化', 'Optimize'), cp: tr('能量 + CP', 'Energy + CP'), sapt: 'SAPT0'};
    const x0 = 300, colW = 128, rowH = Math.min(36, 290 / Math.max(1, rows.length));
    stages.forEach((s, i) => f.text(names[s], x0 + i * colW + (colW - 10) / 2, 178, {size: 11, color: '#526078', align: 'center'}));
    const clock = Math.min(1, p / .82);  // jobs finish at 82%; the rest holds the completed grid
    let done = 0;
    rows.forEach((row, r) => {
      const y = 196 + r * rowH;
      f.text(BY_ID[row.split('/')[0]]?.short || row.split('/')[0], 250, y + rowH * .66, {size: 11, color: '#3f9287', align: 'right'});
      stages.forEach((s, i) => {
        const job = jobs.find(j => j.row === row && j.stage === s), x = x0 + i * colW;
        let fillCol = '#f3f6fb', strokeCol = '#edf2f8';
        if (job && clock >= job.end) { done++; fillCol = job.status === 'recovered' ? '#f0f3f9' : '#f0f4f9'; strokeCol = job.status === 'recovered' ? '#b2831f55' : '#1b9c6f55'; }
        else if (job && clock >= job.start) { fillCol = '#f1f4fa'; strokeCol = '#3f928a80'; }
        f.box(x, y, colW - 10, rowH - 7, 5, fillCol, strokeCol);
        if (job && clock >= job.end) f.text(job.status === 'recovered' ? '↻' : '✓', x + (colW - 10) / 2, y + rowH * .64, {size: 12, color: job.status === 'recovered' ? '#b2831f' : '#349d69', align: 'center'});
      });
    });
    const finished = done === jobs.length;
    f.text(finished ? fill(tr('{rows} 个复合物 · {all} 次计算全部完成', 'All {all} jobs complete across {rows} complexes'), {rows: rows.length, all: jobs.length})
                    : fill(tr('已完成 {done} / {all} 次计算', '{done} / {all} jobs complete'), {done, all: jobs.length}),
           60, 520, {size: 14, color: finished ? '#339e8f' : '#3f9388'});
    f.text(finished ? tr('四个阶段都通过了验收检查', 'Every stage passed its acceptance checks')
                    : tr('失败的优化被自动重启，其余任务继续', 'A failed optimization restarts automatically; the others continue'),
           60, 546, {size: 11, color: '#526078'});
  }},
  {start: 19.2, end: 24.2, label: () => tr('结果', 'Results'), draw(f, p) {
    f.text(tr('哪个改动让结合更稳定？', 'Which change binds more strongly?'), 60, 116, {size: 26, color: '#3f9286'});
    const rows = CANDS.map(c => { const q = bestPose(c, 'all'); return {c, d: delta(c, 'all'), moved: q && q.finalMotif !== 'NH_Nring'}; }).filter(r => r.d != null);
    const ext = Math.max(.5, ...rows.map(r => Math.abs(r.d))) * 1.2, mid = 540, half = 320;
    f.box(mid, 170, 1, Math.max(60, rows.length * 52), 0, '#c6d4e5');
    f.text(tr('母体吡啶', 'Parent pyridine'), mid, 160, {size: 11, color: '#526078', align: 'center'});
    rows.forEach((r, i) => {
      const y = 190 + i * 52, w = Math.abs(r.d) / ext * half * easeOut(p * 1.5 - i * .06), neg = r.d < 0;
      f.text(r.moved ? `${r.c.short} ◆` : r.c.short, 150, y + 17, {size: 13, color: r.moved ? '#b27a1f' : '#3f9287'});
      f.box(neg ? mid - w : mid, y, w, 22, 4, neg ? '#1f62b2' : '#b2491f', r.moved ? '#b27a1f' : null);
      if (w > 6) f.text(signed(r.d), neg ? mid - w - 10 : mid + w + 10, y + 17, {size: 12, color: '#3f928c', align: neg ? 'right' : 'left'});
    });
    if (rows.some(r => r.moved)) f.text(tr('◆ 结合位点已改变，不再是原来的 N–H···N 接触', '◆ binds at a different site — no longer the original N–H···N contact'), 150, 488, {size: 11, color: '#b27a1f'});
    f.text(tr('← 结合更稳定　　结合更弱 →', '← binds more tightly    binds less tightly →'), mid, 520, {size: 11, color: '#526078', align: 'center'});
  }},
  {start: 24.2, end: 27.6, label: () => tr('受力', 'Forces'), draw(f, p) {
    f.text(tr('变化来自哪一种力？', 'Which force changed?'), 60, 116, {size: 26, color: '#3f9286'});
    const plain = strongest('ringN'), overall = strongest('all'), mid = 520;
    const rows = [{c: PARENT, pose: bestPose(PARENT, 'ringN')}];
    if (plain) rows.push({c: plain.c, pose: bestPose(plain.c, 'ringN')});
    // The strongest pose overall binds at another site; show it, but marked as such.
    if (overall && overall.c.id !== plain?.c.id) {
      const pose = bestPose(overall.c, 'all');
      if (pose) rows.push({c: overall.c, pose, moved: pose.finalMotif !== 'NH_Nring'});
    }
    const maxSpan = Math.max(...rows.map(({pose: q}) => q ? Math.abs(q.sapt.elst + q.sapt.ind + q.sapt.disp) + Math.abs(q.sapt.exch) : 1), 1);
    const scale = 600 / maxSpan;
    rows.forEach(({c, pose, moved}, i) => {
      if (!pose) return;
      const y = 200 + i * 100;
      f.text(moved ? `${L(c.name)} ◆` : L(c.name), 90, y - 12, {size: 13, color: moved ? '#b27a1f' : '#3f9287'});
      let acc = 0;
      ['elst', 'ind', 'disp'].forEach(k => {
        const w = Math.abs(pose.sapt[k]) * scale * easeOut(p * 1.6);
        f.box(mid - acc - w + 1, y, w - 2, 28, 3, compColor(k));
        acc += w;
      });
      const we = pose.sapt.exch * scale * easeOut(p * 1.6);
      f.box(mid + 1, y, we - 2, 28, 3, compColor('exch'));
      f.text(fmt(pose.sapt.total), mid + we + 14, y + 20, {size: 12, color: '#3f928c'});
    });
    f.box(mid, 180, 1, 100 * rows.length + 20, 0, '#c6d4e5');
    if (rows.some(r => r.moved)) f.text(tr('◆ 结合位点已改变，与其余各项不是同一种接触', '◆ a different binding site — not the same contact as the others'), 90, 474, {size: 11, color: '#b27a1f'});
    COMPONENTS.forEach(([k, label, color], i) => {
      f.box(250 + i * 140, 497, 12, 10, 2, color);
      f.text(label(), 270 + i * 140, 507, {size: 11, color: '#526078'});
    });
    f.text(tr('向左吸引 · 向右排斥 · 单位 kcal/mol', 'left = attraction · right = repulsion · kcal/mol'), 500, 540, {size: 11, color: '#526078', align: 'center'});
  }},
  {start: 27.6, end: FILM_LEN + .01, label: () => tr('结论', 'Conclusion'), draw(f, p) {
    f.text(tr('一轮可检验的分子设计', 'One round of testable molecular design'), 500, 235, {size: 15, color: '#526078', align: 'center'});
    const line = D.findings ? L(D.findings.title) + (D.findings.emphasis ? L(D.findings.emphasis) : '') : tr('（科学结论等待运行结果）', '(The conclusion awaits the run)');
    const shown = line.slice(0, Math.floor(line.length * easeOut(p * 2)));
    const limit = LANG === 'en' ? 46 : 22;  // characters per line at this size
    const parts = shown.split(/(?<=[，。,.\s—])/);
    const lines = [];
    for (const part of parts) {
      if (!lines.length || lines[lines.length - 1].length + part.length > limit) lines.push(part);
      else lines[lines.length - 1] += part;
    }
    lines.slice(0, 4).forEach((l, i) => f.text(l, 500, 285 + i * 38, {size: 23, color: '#3d9487', align: 'center'}));
    f.box(420, 452, 160, 40, 8, '#f4f7fb', '#3e938844');
    f.text('REPORT.md', 500, 478, {size: 13, color: '#3f9388', align: 'center'});
  }},
];
function initInlineFilm() {
  const canvas = $('#workflow-preview'), player = canvas.closest('.process-player'), runtime = new ProcessFilm(canvas);
  let visible = false, playing = !matchMedia('(prefers-reduced-motion: reduce)').matches, elapsed = 0, last = 0, raf = 0, lastPaint = 0;
  const clock = t => '00:' + String(Math.floor(t)).padStart(2, '0');
  $('[data-preview-seek]').max = FILM_LEN;
  const render = () => { runtime.render(elapsed); $('[data-preview-seek]').value = elapsed; $('[data-preview-time]').textContent = `${clock(elapsed)} / ${clock(FILM_LEN)}`; };
  const sync = () => { player.classList.toggle('paused', !playing); const b = $('[data-preview-toggle]'); b.textContent = playing ? 'Ⅱ' : '▶'; b.setAttribute('aria-label', playing ? tr('暂停流程演示', 'Pause the walkthrough') : tr('播放流程演示', 'Play the walkthrough')); };
  const tick = now => {
    raf = 0;
    if (!visible || !playing || document.hidden) { last = 0; return; }
    if (last) elapsed += Math.min((now - last) / 1000, .1);
    last = now;
    if (elapsed >= FILM_LEN) { elapsed = FILM_LEN; playing = false; sync(); }
    if (now - lastPaint >= 1000 / 30 || !playing) { render(); lastPaint = now; }
    if (playing) raf = requestAnimationFrame(tick);
  };
  const resume = () => { cancelAnimationFrame(raf); last = 0; if (visible && playing && !document.hidden) raf = requestAnimationFrame(tick); };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; resume(); }, {threshold: .25}).observe(canvas);
  $('[data-preview-play]').addEventListener('click', () => { if (elapsed >= FILM_LEN) elapsed = 0; playing = true; sync(); resume(); });
  $('[data-preview-toggle]').addEventListener('click', () => { if (elapsed >= FILM_LEN) elapsed = 0; playing = !playing; sync(); resume(); });
  $('[data-preview-seek]').addEventListener('input', e => { elapsed = +e.target.value; last = 0; render(); });
  document.addEventListener('visibilitychange', resume);
  render(); sync(); resume();
  window.processFilm = {runtime, play(restart) { if (restart || elapsed >= FILM_LEN) elapsed = 0; playing = true; sync(); resume(); }, pause() { playing = false; sync(); resume(); }, seek(t) { elapsed = Math.max(0, Math.min(FILM_LEN, t)); render(); }};
}

/* ---------------------------------------------------------------- findings */
function findingCards() {
  const card = (label, title, note) => `<article class="finding-card"${pend('REPORT.md', SKELETON)}><span>${label}</span><h3>${title}</h3><p>${note}</p></article>`;
  if (SKELETON) return ['01', '02', '03'].map(label => card(label,
    tr('研究结论待补充', 'Findings pending'),
    tr('运行完成后，根据报告与计算结果整理。', 'To be summarized from the report and results after the run.'))).join('');
  return [
    card('01', tr('甲基取代增强结合，氟取代削弱结合', 'Methyl strengthens binding; fluoro weakens it'),
      tr('本次考察的三种甲基吡啶与酰胺的结合均强于母体吡啶，4-氟吡啶则弱于母体。',
         'All three methylpyridines studied bind the amide more strongly than parent pyridine, while 4-fluoropyridine binds more weakly.')),
    card('02', tr('邻位甲基的位阻影响小于预期', 'The ortho methyl group hinders binding less than predicted'),
      tr('原先预计邻位甲基会妨碍氢键形成，但酰胺通过调整取向保留了 N–H···N 氢键。在保留这一氢键的候选中，2-甲基吡啶的结合最强。',
         'The ortho methyl group was expected to hinder hydrogen bonding, but the amide reorients to retain the N–H···N contact. Among candidates retaining this hydrogen bond, 2-methylpyridine binds most strongly.')),
    card('03', tr('羟基引入了新的氢键结合位点', 'The hydroxyl group introduces a new hydrogen-bonding site'),
      tr('3-羟基吡啶的最稳定构象中，酰胺不再与环氮形成氢键，而是由羰基接受羟基的氢键，形成 O–H···O=C 接触。因此，这一构象需要与保留环氮氢键的构象分开比较。',
         'In the most stable sampled pose of 3-hydroxypyridine, the amide no longer hydrogen-bonds to the ring nitrogen. Instead, its carbonyl accepts a hydrogen bond from the hydroxyl group, forming an O–H···O=C contact. This pose therefore needs to be considered separately from poses that retain the ring-N hydrogen bond.')),
  ].join('');
}
function selectEvidence(name, focus = false) {
  state.evidence = name;
  $$('[data-evidence]').forEach(b => {
    const active = b.dataset.evidence === name;
    b.classList.toggle('active', active);
    if (b.getAttribute('role') === 'tab') { b.setAttribute('aria-selected', active); b.tabIndex = active ? 0 : -1; if (active && focus) b.focus(); }
    else b.setAttribute('aria-pressed', active);
  });
  $$('.evidence-pane').forEach(p => { p.hidden = p.id !== 'evidence-' + name; });
  if (name === 'energies') drawDelta($('[data-widget=results]'));
  if (name === 'forces') drawSapt($('[data-widget=sapt]'));
}

/* ---------------------------------------------------------------- widgets */
function candidatesWidget() {
  const counts = {};
  CANDS.forEach(c => { if (c.position) counts[c.position] = (counts[c.position] || 0) + 1; });
  const positions = Object.keys(counts).map(Number).sort();
  const card = c => {
    const dir = c.prediction && DIRS[c.prediction.direction];
    return `<article class="cand" data-cand="${esc(c.id)}" data-pos="${c.position ?? ''}"${c.role === 'parent' ? '' : pend('candidates.json · plan.md')}>
      <div class="cand-head">${ringSVG(c.position, {group: c.group})}<div><strong>${esc(L(c.name))}</strong><small>${esc(c.short)} · ${posLabel(c.position)}${c.smiles ? ` · <span data-no-translate>${esc(c.smiles)}</span>` : ''}</small></div></div>
      <p class="ask">${esc(L(c.comparison))}</p>
      ${dir ? `<div class="prediction"><span class="dir">${dir[0]} ${dir[1]()}</span><p>${esc(L(c.prediction.rationale))}</p></div>` : ''}
    </article>`;
  };
  return `<div class="filter-row"><div class="switch" role="group" aria-label="${tr('按取代位置筛选', 'Filter by position')}"><button data-pos-filter="all" aria-pressed="true">${tr('全部', 'All')}</button>${positions.map(p => `<button data-pos-filter="${p}" aria-pressed="false">${posLabel(p)}</button>`).join('')}</div><span class="note">${tr('点击环上的位置，或用按钮筛选', 'Click a ring position or filter with the buttons')}</span></div>
  <div class="candidate-layout"><div class="ring-key"><div class="mono muted">SUBSTITUTION SITES</div><div data-ring-key>${ringSVG(null, {numbers: true, counts})}</div><p class="note">${tr('环氮编号为 1，图中标出了各取代基的位置。', 'The ring nitrogen is position 1; the diagram marks the substitution positions.')}</p></div>
  <div class="candidate-grid">${[PARENT, ...CANDS].map(card).join('')}</div></div>
  <p class="note" style="margin-top:16px"${pend('session log · candidates.json')}>${tr('预测记录于任何 Psi4 计算开始之前，之后未作修改。', 'Predictions were recorded before any Psi4 calculation and not revised afterwards.')}</p>`;
}
function applyPosFilter(root, p) {
  state.filter = p;
  $$('[data-pos-filter]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.posFilter === String(p))));
  $$('.cand', root).forEach(c => c.classList.toggle('dim', p !== 'all' && c.dataset.pos !== String(p) && c.dataset.cand !== PARENT.id));
  const counts = {};
  CANDS.forEach(c => { if (c.position) counts[c.position] = (counts[c.position] || 0) + 1; });
  $('[data-ring-key]', root).innerHTML = ringSVG(null, {numbers: true, counts, active: p});
}

const niceExt = v => { const steps = [.5, 1, 1.5, 2, 3, 4, 5, 8, 10, 15, 20]; return steps.find(s => s >= v) || Math.ceil(v); };
const tickStep = e => e <= 1 ? .25 : e <= 2 ? .5 : e <= 5 ? 1 : e <= 10 ? 2 : 5;
function barPath(xa, xb, y, h, rl, rr, r = 4) {
  const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), w = x1 - x0, R = Math.min(r, w / 2, h / 2);
  const Lr = rl ? R : 0, Rr = rr ? R : 0;
  return `M${x0 + Lr},${y}H${x1 - Rr}${Rr ? `Q${x1},${y} ${x1},${y + Rr}` : ''}V${y + h - Rr}${Rr ? `Q${x1},${y + h} ${x1 - Rr},${y + h}` : ''}H${x0 + Lr}${Lr ? `Q${x0},${y + h} ${x0},${y + h - Lr}` : ''}V${y + Lr}${Lr ? `Q${x0},${y} ${x0 + Lr},${y}` : ''}Z`;
}
const clip = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

function resultsWidget() {
  return `<p class="note contact-key">${contactKey()}</p>
  <div class="chart-layout"><div class="chart-box"${pend('results.json')}>
    <div class="legend"><span><i style="background:var(--stronger)"></i>${tr('比母体结合更稳定', 'Binds more tightly than parent')}</span><span><i style="background:var(--weaker)"></i>${tr('比母体结合更弱', 'Binds less tightly than parent')}</span></div>
    <div class="chart" data-chart="delta"></div>
    <div class="chart-foot"><span data-motif-note></span><span>${tr('点击一行，查看结构与数值', 'Click a row for its structure and values')}</span></div>
    <p class="note method-note">${tr('几何优化 ωB97X-D/def2-TZVP · 结合能 ωB97X-V/def2-TZVPD，含基组重叠校正',
                                     'Geometries ωB97X-D/def2-TZVP · association energies ωB97X-V/def2-TZVPD with counterpoise correction')}</p>
    ${SKELETON ? '<div class="watermark"><span>PLACEHOLDER</span></div>' : ''}
  </div><div class="inspector" data-inspector><div data-ins-head></div><canvas class="mol-canvas" data-mol="inspector" aria-label="${tr('所选候选复合物的三维结构', 'Selected complex in 3D')}"></canvas><div data-ins-body></div></div></div>
  <div class="table-scroll verdict-scroll"${pend('REPORT.md · candidates.json')}><table class="verdict-list"><thead><tr><th>${tr('候选', 'Candidate')}</th><th>${tr('计算前的预测', 'Prediction before calculating')}</th><th>${tr('相对母体（kcal/mol）', 'vs. parent (kcal/mol)')}</th><th>${tr('报告的判断', "The report's verdict")}</th></tr></thead><tbody data-verdicts></tbody></table></div>
  <details class="table-view"><summary>${tr('表格视图 · 全部构象与能量分项', 'Table view · every pose and energy term')}</summary><div class="table-scroll" data-energy-table></div></details>
  <div class="boundary"><span>ⓘ</span><span>${tr('这些是真空中两个中性小分子的电子能量，用来比较分子识别的趋势；它们不是药物与蛋白的结合亲和力，也不包含溶剂、温度或熵的贡献。', 'These are electronic energies of two neutral molecules in the gas phase, used to compare recognition trends. They are not drug–protein binding affinities and include no solvent, temperature or entropy.')}</span></div>`;
}
function drawDelta(root) {
  const box = $('[data-chart=delta]', root), W = Math.max(300, box.clientWidth || 600);
  const narrow = W < 460, labelW = narrow ? 124 : 150, valueW = narrow ? 42 : 56, rowH = 42, bar = 16, top = 6;
  const rows = comparisonCandidates();
  const ext = niceExt(Math.max(.5, ...rows.filter(r => r.d != null).map(r => Math.abs(r.d))));
  const x0 = labelW + valueW, x1 = W - valueW, mid = (x0 + x1) / 2, sx = v => mid + v / ext * (x1 - x0) / 2;
  const H = top + rows.length * rowH + 34, step = tickStep(ext);
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr('各候选相对母体的缔合能变化', 'Change in association energy vs. parent')}">`;
  for (let v = -ext; v <= ext + 1e-9; v += step) s += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${top + rows.length * rowH}"/>`;
  rows.forEach((r, i) => {
    const y = top + i * rowH, cy = y + rowH / 2, sel = r.id === state.selected;
    const motif = posMoved(r.p);
    s += `<g class="row${sel ? ' selected' : ''}" data-select="${esc(r.id)}" tabindex="0" role="button" aria-pressed="${sel}" data-tip="${r.d == null ? '—' : signed(r.d) + ' kcal/mol'}|${esc(r.label)} · ${esc(motifLabel(r.p?.finalMotif))}">`;
    s += `<rect class="row-bg" x="0" y="${y + 2}" width="${W}" height="${rowH - 4}" rx="8" fill="transparent"/>`;
    s += `<text class="label-text${motif ? ' moved' : ''}" x="0" y="${cy - 3}">${esc(r.label)}</text><text class="axis-text" x="0" y="${cy + 12}" font-size="10">${esc(clip(posLabel(r.c.position), 14))}</text>`;
    if (r.d == null) s += `<text class="axis-text" x="${mid + 8}" y="${cy + 4}">${tr('不可用', 'Unavailable')}</text>`;
    else {
      const neg = r.d < 0, xv = sx(r.d);
      s += `<path class="bar" d="${barPath(mid, xv, cy - bar / 2, bar, neg, !neg)}" fill="var(${neg ? '--stronger' : '--weaker'})"/>`;
      s += `<text class="value-text" x="${neg ? xv - 6 : xv + 6}" y="${cy + 4}" text-anchor="${neg ? 'end' : 'start'}">${signed(r.d)}</text>`;
    }
    s += `<rect class="hit" x="0" y="${y}" width="${W}" height="${rowH}"/></g>`;
  });
  const yb = top + rows.length * rowH;
  s += `<line class="zero" x1="${mid}" x2="${mid}" y1="${top - 2}" y2="${yb + 4}"/>`;
  for (let v = -ext; v <= ext + 1e-9; v += step) if (Math.abs(v / step) % (narrow ? 2 : 1) < 1e-9) s += `<text class="axis-text" x="${sx(v)}" y="${yb + 18}" text-anchor="middle">${signed(Math.abs(v) < 1e-9 ? 0 : v, narrow ? 0 : step < .5 ? 2 : 1)}</text>`;
  s += `<text class="axis-text" x="${W / 2}" y="${yb + 32}" text-anchor="middle" font-size="10">${narrow ? tr('← 更稳定　　母体 = 0　　更弱 →', '← stronger    parent = 0    weaker →') : tr('← 结合更稳定　　母体吡啶 = 0　　结合更弱 →', '← binds more tightly    parent pyridine = 0    binds less tightly →')}</text></svg>`;
  box.innerHTML = s;
  $('[data-motif-note]', root).textContent = tr('负值表示比母体吡啶结合更稳定。', 'Negative values mean stronger binding than parent pyridine.');
}
let inspectorView = null;
function drawInspector(root) {
  const row = COMPARISON_ROWS.find(r => r.id === state.selected), el = $('[data-inspector]', root);
  if (!row) return;
  const {c, p, d, label} = row;
  const alt = COMPARISON_ROWS.find(r => r.c.id === c.id && r.id !== row.id);
  const v = c.verdict && VERDICTS[c.verdict.result];
  $('[data-ins-head]', el).innerHTML = `<div class="mono muted">${esc(label)} · ${posLabel(c.position)}</div><h3>${esc(L(c.name))}</h3>
    <p class="sub">${p ? `${esc(L(p.label))} → ${motifLabel(p.finalMotif)}` : tr('没有通过检查的构象', 'No accepted pose')}</p>`;
  $('[data-ins-body]', el).innerHTML = `<div class="readouts"${pend('results.json')}><div class="readout"><span>${tr('缔合能', 'Association energy')}</span><strong>${fmt(p?.energy.associationCP)}<small>kcal/mol</small></strong></div>
    <div class="readout"><span>${tr('相对母体', 'vs. parent')}</span><strong>${signed(d)}<small>kcal/mol</small></strong></div>
    <div class="readout"><span>${tr('氢键距离', 'H-bond distance')}</span><strong>${fmt(p?.hbond?.dist)}<small>Å</small></strong></div>
    <div class="readout"><span>${tr('氢键角度', 'H-bond angle')}</span><strong>${fmt(p?.hbond?.angle, 0)}<small>°</small></strong></div></div>
    ${alt ? `<div class="motif-flag">${esc(motifLabel(p.finalMotif))}<br><button class="btn" data-select="${esc(alt.id)}">${tr('查看', 'View')} ${esc(alt.label)} ↗</button></div>` : ''}
    ${c.prediction ? `<p class="note" style="margin-top:12px">${tr('计算前预测：', 'Predicted before calculating: ')}${DIRS[c.prediction.direction]?.[1]() || '—'}${v ? ` · <span class="verdict"><b style="color:${v[1]}">${v[0]}</b>${v[2]()}</span>` : ''}</p>` : ''}`;
  if (!inspectorView) inspectorView = new MolView($('[data-mol=inspector]', el), {scale: 1.25});
  inspectorView.set(p?.geometry, p);
}
function drawVerdicts(root) {
  $('[data-verdicts]', root).innerHTML = CANDS.map(c => {
    const dir = c.prediction && DIRS[c.prediction.direction], v = c.verdict && VERDICTS[c.verdict.result];
    const rows = COMPARISON_ROWS.filter(r => r.c.id === c.id);
    const values = rows.map(r => `${rows.length > 1 ? esc(r.label) + ': ' : ''}${signed(r.d)}`).join('<br>');
    return `<tr><td>${esc(c.short)} <span class="muted">· ${posLabel(c.position)}</span></td><td>${dir ? `${dir[0]} ${dir[1]()}` : '—'}</td><td class="tabular">${values}</td><td>${v ? `<span class="verdict"><b style="color:${v[1]}">${v[0]}</b>${v[2]()}</span>${c.verdict.note ? `<div class="note">${esc(L(c.verdict.note))}</div>` : ''}` : '—'}</td></tr>`;
  }).join('');
}
function drawEnergyTable(root) {
  const head = [tr('候选 · 构象', 'Candidate · pose'), tr('最终结合方式', 'Final contact'), tr('相互作用（未校正）', 'Interaction (raw)'), tr('基组重叠校正', 'CP correction'), tr('相互作用（校正后）', 'Interaction (CP)'), tr('形变能', 'Deformation'), tr('缔合能', 'Association (CP)'), tr('状态', 'Status')];
  const rows = D.candidates.flatMap(c => c.poses.map(p => [`${esc(c.short)} · ${esc(L(p.label))}`, motifLabel(p.finalMotif), fmt(p.energy?.interactionRaw), signed(p.energy?.cpCorrection), fmt(p.energy?.interactionCP), signed(p.energy?.deformation), fmt(p.energy?.associationCP), p.status === 'accepted' ? tr('通过检查', 'Accepted') : esc(p.status)]));
  $('[data-energy-table]', root).innerHTML = `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="note" style="margin-top:8px">${tr('单位 kcal/mol。缔合能 = 校正后相互作用能 + 形变能。', 'Units kcal/mol. Association = CP interaction + deformation.')}</p>`;
}
function renderResults(root) { drawDelta(root); drawInspector(root); drawVerdicts(root); drawEnergyTable(root); }

function saptWidget() {
  const notes = {elst: tr('两个分子的正负电荷分布之间的吸引。', "Attraction between the two molecules' charge distributions."), exch: tr('电子云靠得太近时互相挤压，产生排斥。', 'Repulsion when the electron clouds are pushed into each other.'), ind: tr('一个分子让另一个分子的电子云变形，带来额外吸引。', "Each molecule distorts the other's electron cloud, adding attraction."), disp: tr('电子运动的瞬时涨落相互关联，产生普遍的弱吸引。', 'Correlated, momentary fluctuations of electrons produce a weak attraction.')};
  return `<div class="forces">${COMPONENTS.map(([k, label, color]) => `<article class="force"><i style="background:${color}"></i><h3>${label()}</h3><small>${k.toUpperCase()}</small><p>${notes[k]}</p></article>`).join('')}</div>
  <div class="filter-row"><div class="switch" role="group" aria-label="${tr('显示方式', 'View')}"><button data-sapt-view="abs" aria-pressed="true">${tr('四种力的大小', 'Size of each force')}</button><button data-sapt-view="delta" aria-pressed="false">${tr('相对母体的变化', 'Change vs. parent')}</button></div></div>
  <p class="note contact-key">${contactKey()}</p>
  <div class="chart-box"${pend('results.json')}><div class="legend" data-sapt-legend>${COMPONENTS.map(([k, f, c]) => `<span><i style="background:${c}"></i>${f()}</span>`).join('')}<span><i style="background:var(--ink);border-radius:50%;width:9px;height:9px"></i>${tr('SAPT 总相互作用能', 'SAPT total')}</span></div>
  <div class="chart" data-chart="sapt"></div>${SKELETON ? '<div class="watermark"><span>PLACEHOLDER</span></div>' : ''}</div>
  <p class="note" style="margin-top:12px" data-sapt-note></p>
  <p class="note method-note">${tr('SAPT0/jun-cc-pVDZ · 与结合能计算使用同一套优化几何',
                                   'SAPT0/jun-cc-pVDZ · at the same optimized geometries as the association energies')}</p>
  <details class="table-view"><summary>${tr('表格视图 · SAPT 分量与 DFT 对照', 'Table view · SAPT components vs. DFT')}</summary><div class="table-scroll" data-sapt-table></div></details>`;
}
function drawSapt(root) {
  const box = $('[data-chart=sapt]', root), W = Math.max(300, box.clientWidth || 600), narrow = W < 460;
  const list = COMPARISON_ROWS;
  $('[data-sapt-legend]', root).style.display = state.saptView === 'abs' ? '' : 'none';
  if (state.saptView === 'abs') {
    const labelW = narrow ? 124 : 150, valueW = narrow ? 48 : 64, rowH = 38, bar = 18, top = 14;
    const left = niceExt(Math.max(1, ...list.filter(r => r.p).map(r => -(r.p.sapt.elst + r.p.sapt.ind + r.p.sapt.disp))));
    const right = niceExt(Math.max(1, ...list.filter(r => r.p).map(r => r.p.sapt.exch)));
    const x0 = labelW, x1 = W - valueW, sx = v => x0 + (v + left) / (left + right) * (x1 - x0), z = sx(0);
    const H = top + list.length * rowH + 30, step = tickStep(Math.max(left, right)) * 2;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr('SAPT 能量分解', 'SAPT energy decomposition')}">`;
    for (let v = -Math.floor(left / step) * step; v <= right + 1e-9; v += step) s += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${top}" y2="${top + list.length * rowH}"/><text class="axis-text" x="${sx(v)}" y="${top + list.length * rowH + 16}" text-anchor="middle">${signed(Math.abs(v) < 1e-9 ? 0 : v, 0)}</text>`;
    s += `<text class="axis-text" x="${W - valueW + 4}" y="${top}" font-size="10">${tr('总计', 'Total')}</text>`;
    list.forEach(({c, p, label}, i) => {
      const y = top + i * rowH, cy = y + rowH / 2;
      s += `<text class="label-text${posMoved(p) ? ' moved' : ''}" x="0" y="${cy + 4}">${esc(label)}</text>`;
      if (!p) { s += `<text class="axis-text" x="${z + 8}" y="${cy + 4}">${tr('不可用', 'Unavailable')}</text>`; return; }
      const S = p.sapt;  // segments are inset 1px at each touching edge: a 2px surface gap
      s += `<path d="${barPath(z + 1, sx(S.exch), cy - bar / 2, bar, false, true)}" fill="${compColor('exch')}" data-tip="${signed(S.exch)} kcal/mol|${compLabel('exch')} · ${esc(label)} · ${esc(motifLabel(p.finalMotif))}"/>`;
      let acc = 0;
      ['elst', 'ind', 'disp'].forEach((k, j) => {
        const a = acc, b = acc + S[k]; acc = b;
        s += `<path d="${barPath(sx(a) - 1, sx(b) + (j < 2 ? 1 : 0), cy - bar / 2, bar, j === 2, false)}" fill="${compColor(k)}" data-tip="${signed(S[k])} kcal/mol|${compLabel(k)} · ${esc(label)} · ${esc(motifLabel(p.finalMotif))}"/>`;
      });
      s += `<circle cx="${sx(S.total)}" cy="${cy}" r="4.5" fill="var(--ink)" stroke="#0d1315" stroke-width="2" data-tip="${signed(S.total)} kcal/mol|${tr('SAPT 总相互作用能', 'SAPT total')} · ${esc(label)} · ${esc(motifLabel(p.finalMotif))}"/>`;
      s += `<text class="value-text" x="${W - valueW + 4}" y="${cy + 4}">${fmt(S.total)}</text>`;
    });
    s += `<line class="zero" x1="${z}" x2="${z}" y1="${top - 2}" y2="${top + list.length * rowH + 2}"/></svg>`;
    box.innerHTML = s;
    $('[data-sapt-note]', root).innerHTML = tr('向左为吸引（静电、诱导、色散），向右为排斥（交换）；白点是四项之和。单位 kcal/mol。', 'Left = attraction (electrostatics, induction, dispersion); right = repulsion (exchange); the white dot is the sum. Units kcal/mol.');
  } else {
    const base = bestPose(PARENT, 'ringN')?.sapt;
    const vals = comparisonCandidates().map(r => ({...r, d: r.p && base ? Object.fromEntries(COMPONENTS.map(([k]) => [k, r.p.sapt[k] - base[k]])) : null}));
    const ext = niceExt(Math.max(.25, ...vals.filter(v => v.d).flatMap(v => Object.values(v.d).map(Math.abs))));
    const stacked = W < 700, pw = stacked ? W : (W - 30) / 2;
    const panel = ([k, f, color]) => {
      const labelW = 124, rowH = 30, bar = 12, x0 = labelW + 38, x1 = pw - 44, mid = (x0 + x1) / 2, sx = v => mid + v / ext * (x1 - x0) / 2, H = vals.length * rowH + 22;
      let s = `<svg width="${pw}" height="${H}" viewBox="0 0 ${pw} ${H}" role="img" aria-label="${f()}">`;
      vals.forEach(({c, p, d, label}, i) => {
        const cy = i * rowH + rowH / 2;
        s += `<text class="label-text${posMoved(p) ? ' moved' : ''}" x="0" y="${cy + 4}" font-size="11">${esc(label)}</text>`;
        if (!d) { s += `<text class="axis-text" x="${mid + 6}" y="${cy + 4}">—</text>`; return; }
        const v = d[k], xv = sx(v);
        s += `<path d="${barPath(mid, xv, cy - bar / 2, bar, v < 0, v >= 0)}" fill="${color}" data-tip="${signed(v)} kcal/mol|${f()} · ${esc(label)} · ${esc(motifLabel(p.finalMotif))}"/>`;
        s += `<text class="value-text" x="${v < 0 ? xv - 5 : xv + 5}" y="${cy + 4}" text-anchor="${v < 0 ? 'end' : 'start'}" font-size="10">${signed(v)}</text>`;
      });
      s += `<line class="zero" x1="${mid}" x2="${mid}" y1="0" y2="${vals.length * rowH}"/><text class="axis-text" x="${pw / 2}" y="${H - 4}" text-anchor="middle" font-size="10">${tr('← 更有利　　更不利 →', '← more favorable    less favorable →')}</text></svg>`;
      return `<div><h4><i style="background:${color}"></i>${f()}</h4>${s}</div>`;
    };
    box.innerHTML = `<div class="multiples"${stacked ? ' style="grid-template-columns:1fr"' : ''}>${COMPONENTS.map(panel).join('')}</div>`;
    $('[data-sapt-note]', root).innerHTML = tr('每一项相对母体吡啶的变化：负值表示这一项让结合更有利。四张图使用同一刻度。单位 kcal/mol。', 'Change of each term vs. parent pyridine: negative means the term makes binding more favorable. All four panels share one scale. Units kcal/mol.');
  }
  const head = [tr('候选', 'Candidate'), ...COMPONENTS.map(c => c[1]()), tr('SAPT 总计', 'SAPT total'), tr('DFT 相互作用（校正后）', 'DFT interaction (CP)')];
  $('[data-sapt-table]', root).innerHTML = `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${list.map(({c, p, label}) => `<tr><td>${esc(label)}</td>${p ? [...COMPONENTS.map(([k]) => signed(p.sapt[k])), fmt(p.sapt.total), fmt(p.energy.interactionCP)].map(x => `<td>${x}</td>`).join('') : `<td colspan="6">${tr('不可用', 'Unavailable')}</td>`}</tr>`).join('')}</tbody></table><p class="note" style="margin-top:8px">${tr('SAPT 总能与 DFT 相互作用能（不含形变）对照；两种方法的差异如实保留。', 'SAPT totals are compared with the DFT interaction energy (no deformation); differences between the methods are kept visible.')}</p>`;
  $$('[data-sapt-view]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.saptView === state.saptView)));
}

const FIGURES = [
  ['structures', () => tr('候选结构', 'Candidate structures'), () => tr('母体与全部候选的分子结构，标出取代位置。', 'Parent and candidate molecules with the substitution sites marked.'), 'figures/…structures.png'],
  ['association', () => tr('缔合能对比', 'Association energies'), () => tr('相对母体的缔合能变化，标注每个构象的结合方式。', 'Change in association energy vs. parent, labeled by pose and contact.'), 'figures/…association.png'],
  ['sapt', () => tr('SAPT 分解', 'SAPT decomposition'), () => tr('静电、交换、诱导、色散四项的比较，注明符号约定与单位。', 'Electrostatics, exchange, induction and dispersion, with sign convention and units.'), 'figures/…sapt.png'],
  ['complexes', () => tr('复合物构型', 'Complex geometries'), () => tr('本次运行中通过验收的构型及其氢键距离与角度。', 'Accepted poses from the run, with hydrogen-bond distances and angles.'), 'figures/…complexes.png'],
];
function galleryWidget() {
  const hasReport = !!D.report?.text;
  const cards = [
    ['REPORT.md', tr('研究报告', 'Research report'), tr('问题、方法、发现、解释与局限，面向化学家撰写。', 'Question, method, findings, interpretation and limits, for chemists.'), 'REPORT.md', `<button data-report ${hasReport ? '' : 'disabled'}>${tr('阅读报告', 'Read the report')} ↗</button>`],
    ['candidates.json · plan.md', tr('候选与预测', 'Candidates & predictions'), tr('身份、取代位置、要检验的问题与计算前的预测。', 'Identity, position, the question each tests and its prediction.'), 'candidates.json', ''],
    ['results.json · results.csv', tr('结构化结果', 'Structured results'), tr('每个构象的能量分项、SAPT 分量与来源任务。', 'Energy terms, SAPT components and source jobs for every pose.'), 'results.json', `<button data-download-data>${tr('下载本页数据', 'Download page data')} ↓</button>`],
    ['*.xyz', tr('优化结构', 'Optimized structures'), tr('所有单体与复合物的最终几何结构。', 'Final geometries of every monomer and complex.'), 'structures/', ''],
    ['RUN_LOG.md · status.json', tr('运行记录', 'Run record'), tr('决策、恢复操作、人工干预与完成状态。', 'Decisions, recovery, human interventions and status.'), 'RUN_LOG.md', ''],
    ['Psi4 input / output', tr('计算输入与输出', 'Calculation inputs & outputs'), tr('每个数值都能追溯到一次通过检查的计算。', 'Every number traces back to an accepted calculation.'), 'run directory', ''],
  ];
  return `<div class="gallery-layout"><div><div class="mono muted" style="margin-bottom:14px">ORIGINAL FIGURES FROM THE RUN</div><div class="gallery-tabs">${FIGURES.map(([k, f], i) => `<button data-fig="${k}" aria-pressed="${i === 0}"><b>0${i + 1}</b>${f()}</button>`).join('')}</div>
    <div class="gallery-copy"><h3 data-fig-title></h3><p data-fig-desc></p><div class="actions" style="margin-top:14px" data-fig-actions></div></div></div>
    <div class="figure-frame" data-fig-frame${pend('figures/')}></div></div>
  <div class="artifact-grid">${cards.map(([tag, title, desc, key, action]) => `<article class="artifact"${pend(key)}><span class="tag">${tag}</span><h3>${title}</h3><p>${desc}</p>${action}</article>`).join('')}</div>`;
}
function drawFigure(root, key) {
  const f = FIGURES.find(x => x[0] === key), src = D.figures?.[key];
  $$('[data-fig]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fig === key)));
  $('[data-fig-title]', root).textContent = f[1]();
  $('[data-fig-desc]', root).textContent = f[2]();
  $('[data-fig-frame]', root).innerHTML = src ? `<img loading="lazy" src="${src}" alt="${esc(f[1]())}">` : `<div class="figure-empty"><span class="mono">PENDING · ${esc(f[3])}</span>${tr('这里将显示本次运行生成的原始图表，不做修饰。', 'The unedited figure generated by the run will appear here.')}</div>`;
  $('[data-fig-actions]', root).innerHTML = src ? `<button class="btn small secondary" data-download-fig="${key}">${tr('下载原图', 'Download figure')}</button>` : '';
}

/* ---------------------------------------------------------------- dialogs */
function sourceText() {
  const m = D.meta || {}, v = m.versions || {}, na = tr('（待运行）', '(pending run)');
  return tr(
`这次模型做了什么

研究问题：吡啶上的小取代基，如何改变它与 N-甲基乙酰胺之间 N–H···N 氢键的结合？
模型：${m.model || 'Agents-A1.5'}（运行配置 ${m.sourceModel || na}）
智能体框架：${m.harness || 'Codex CLI'} ${v.codex || ''}
计算引擎：${m.engine || 'Psi4'} ${v.psi4 || ''}
运行编号：${m.runId || na}
科学完成状态：${m.status || na}
人工干预：${D.journey?.interventions ?? na} 次续跑（launcher --resume），未介入候选选择、计算设置或结论

提交给模型的输入
5 份任务文件：研究请求、完整流程与三份计算规范；不含候选分子、结构、脚本或参考答案。可在研究工作区中逐份查看与下载。

计算方案（由任务规范给定，模型负责实现）
· 几何优化：PBE0/def2-SVP 预优化 → ωB97X-D/def2-TZVP，气相，中性单重态
· 能量：ωB97X-V/def2-TZVPD 单点，含基组重叠（counterpoise）校正与单体形变能
· 能量分解：SAPT0/jun-cc-pVDZ（静电、交换、诱导、色散）
· 未包含：溶剂、蛋白环境、频率验证、热力学校正、结合自由能

解释边界
页面中的能量是真空中两个小分子的电子能量，用于比较分子识别的趋势，不代表药物亲和力、选择性或成药性。所选构象是有限采样中能量最低的构象，并非已证明的全局最低。

展示说明
数值、结构与引述来自本次运行的产物；图表、差值、结构查看器与流程演示是基于这些产物的展示层重建，不是额外的模型输出。流程演示经过时间压缩。`,
`What the model did

Research question: how do small substituents on pyridine change its N–H···N hydrogen-bonded association with N-methylacetamide?
Model: ${m.model || 'Agents-A1.5'} (run configuration ${m.sourceModel || na})
Agent harness: ${m.harness || 'Codex CLI'} ${v.codex || ''}
Calculation engine: ${m.engine || 'Psi4'} ${v.psi4 || ''}
Run ID: ${m.runId || na}
Scientific status: ${m.status || na}
Human interventions: ${D.journey?.interventions ?? na} launcher resumes; no intervention in candidate choice, calculation settings or conclusions

What the model was given
Five task files: the research request, the full workflow and three calculation specifications. No candidate molecules, structures, scripts or reference answers. Each file can be read and downloaded in the research workspace.

Protocol (set by the task specifications, implemented by the model)
· Geometry: PBE0/def2-SVP pre-optimization → ωB97X-D/def2-TZVP, gas phase, neutral singlets
· Energies: ωB97X-V/def2-TZVPD single points with counterpoise correction and monomer deformation
· Decomposition: SAPT0/jun-cc-pVDZ (electrostatics, exchange, induction, dispersion)
· Not included: solvent, protein environment, frequency validation, thermal corrections, binding free energies

Interpretation boundary
Energies here are electronic energies of two small molecules in the gas phase, used to compare recognition trends. They do not represent drug affinity, selectivity or developability. Selected poses are the lowest-energy poses sampled, not proven global minima.

About this presentation
Numbers, structures and quotes come from the run's outputs; the charts, differences, structure viewer and process walkthrough are presentation-layer reconstructions of those outputs, not additional model output. The walkthrough is time-compressed.`);
}
function openText(title, body) { const d = $('#text-dialog'); $('#text-dialog-title').textContent = title; $('.source-text', d).textContent = body; d.showModal(); }
function download(name, content, type = 'application/json') {
  const a = document.createElement('a'); a.download = name;
  a.href = (content.startsWith('data:') || content.startsWith('assets/images/')) ? content : URL.createObjectURL(new Blob([content], {type}));
  a.click();
  if (!(content.startsWith('data:') || content.startsWith('assets/images/'))) setTimeout(() => URL.revokeObjectURL(a.href), 15000);
}
function openResearchBrief() {
  window.processFilm?.pause();
  let dialog = $('#research-brief');
  if (!dialog) {
    document.body.insertAdjacentHTML('beforeend', `<dialog id="research-brief" aria-labelledby="brief-title">
      <div class="dialog-head"><strong>${tr('研究结论摘要', 'Research brief')}</strong><button class="close-btn" data-close aria-label="${tr('关闭', 'Close')}">×</button></div>
      <article class="brief-body"><div class="eyebrow">AGENTS-A1.5 × CODEX × PSI4</div>
       <p class="brief-question">${tr('吡啶上的小取代基，如何改变它与酰胺的结合？', 'How do small substituents on pyridine change its association with an amide?')}</p>
       <h2 id="brief-title"${pend('REPORT.md', !D.findings)}>${D.findings ? esc(L(D.findings.title)) : ph('（科学结论等待运行结果）', '(The conclusion awaits the run)')}</h2>
       <p class="brief-answer"${pend('REPORT.md', !D.findings)}>${D.findings ? esc(L(D.findings.text)) : ph('报告的主要发现：哪些修饰改变了结合、改变有多大、主要是哪种作用力在起作用。', 'The main finding: which modifications changed binding, by how much, and which force drove it.')}</p>
       <section class="brief-next" aria-labelledby="brief-next-title">
        <h3 id="brief-next-title">${tr('可能的后续研究', 'Possible next steps')}</h3>
        <div class="brief-directions">
         <section><h4>${tr('溶剂和蛋白环境中的结合', 'Binding in solvent and proteins')}</h4>
          <p>${tr('从气相模型转向溶液和实际的蛋白结合口袋后，取代基对结合强弱的影响是否仍然成立？溶剂化、周围残基和空间约束会怎样改变这一趋势？', 'Do the substituent trends found in the gas-phase model persist in solution and in an actual protein binding pocket? How do solvation, surrounding residues and steric constraints change the picture?')}</p></section>
         <section><h4>${tr('结合方式改变后的影响', 'Consequences of a different binding mode')}</h4>
          <p>${tr('如果配体在蛋白中改变了结合位点或结合构象，新的接触能否稳定保持？这种变化会如何影响亲和力、靶点选择性及蛋白功能？', 'If a ligand adopts a different binding site or pose in a protein, can the new contacts persist? How would that change affect affinity, target selectivity and protein function?')}</p></section>
         <section><h4>${tr('进一步的取代基设计', 'Exploring further substituent designs')}</h4>
          <p>${tr('除了增强当前的氢键，能否通过调整取代基的种类与位置，引入其他相互作用、调节分子的构象偏好，或改善溶解性？这些目标之间又该如何权衡？', 'Beyond strengthening the current hydrogen bond, could different substituents or substitution positions introduce other interactions, tune conformational preferences or improve solubility? What trade-offs would these goals involve?')}</p></section>
        </div>
       </section>
       <p class="brief-source">${tr('研究结论依据本次运行的报告整理；后续方向是由此延伸的研究问题，尚未在本次计算中验证。', "The conclusions summarize this run's report; the proposed next steps extend beyond what was tested in these calculations.")}</p>
      </article></dialog>`);
    dialog = $('#research-brief');
  }
  dialog.showModal();
}
function injectDialogs() {
  document.body.insertAdjacentHTML('beforeend', `<div class="tip" role="tooltip" id="tooltip"></div>
    <dialog id="text-dialog" aria-labelledby="text-dialog-title"><div class="dialog-head"><strong id="text-dialog-title"></strong><button class="close-btn" data-close aria-label="${tr('关闭', 'Close')}">×</button></div><div class="dialog-body"><div class="source-text"></div></div></dialog>
    <dialog id="workspace-dialog" aria-label="${tr('任务文件预览', 'Task file preview')}"><div class="dialog-head"><strong>${tr('输入文件 · 原文预览', 'Input files · original text')}</strong><button class="close-btn" data-close aria-label="${tr('关闭', 'Close')}">×</button></div><div class="workspace-modal-layout"><nav class="workspace-modal-nav" aria-label="${tr('任务文件', 'Task files')}"></nav><div class="workspace-preview"></div></div></dialog>`);
}

/* ---------------------------------------------------------------- skeleton */
function initSkeleton() {
  if (!SKELETON) return;
  document.body.classList.add('show-pending');
  const keys = new Set($$('[data-pending]').map(e => e.dataset.pending));
  document.body.insertAdjacentHTML('beforeend', `<div class="skeleton-chip" role="status"><span>${fill(tr('骨架预览 · 分子、数值与引述均为占位 · {n} 类待补内容', 'Skeleton preview · molecules, numbers and quotes are placeholders · {n} pending sources'), {n: keys.size})}</span><button data-toggle-pending>${tr('隐藏标记', 'Hide markers')}</button></div>`);
}

/* ---------------------------------------------------------------- global */
function bindGlobal() {
  document.addEventListener('click', e => {
    const t = e.target.closest('button,a,[data-select],[data-ring-pos]');
    if (!t) return;
    if (t.matches('[data-close]')) t.closest('dialog').close();
    if (t.matches('[data-source]')) openText(tr('研究背景与数据来源', 'Background and data sources'), sourceText());
    if (t.matches('[data-report]') && D.report?.text) {
      const body = L(D.report.text), original = !D.report.text[LANG];
      openText(tr('本次运行生成的研究报告', 'The research report generated by the run'),
        (original ? tr('（以下为本次运行生成的报告原文，未翻译）\n\n', '(The run\'s own report, unedited)\n\n') : '') + body);
    }
    if (t.matches('[data-research-brief]')) openResearchBrief();
    if (t.matches('[data-download-data]')) download('agents-a1.5-chemistry-data.json', JSON.stringify(D, (k, v) => k === 'figures' ? undefined : v, 1));
    if (t.matches('[data-download-fig]')) download(`agents-a1.5-chemistry-${t.dataset.downloadFig}.png`, D.figures[t.dataset.downloadFig]);
    if (t.matches('[data-workspace-file]')) openWorkspace(t.dataset.workspaceFile);
    if (t.matches('[data-workspace-save]')) { const f = WORKSPACE.files.find(x => x.id === t.dataset.workspaceSave); download(f.name, f.text, 'text/markdown'); }
    if (t.matches('[data-workspace-download]')) download('agents-a1.5-chemistry-task-files.md', WORKSPACE.files.map(f => `<!-- ${f.path} -->\n\n${f.text}`).join('\n\n---\n\n'), 'text/markdown');
    if (t.matches('[data-toggle-pending]')) { const on = document.body.classList.toggle('show-pending'); t.textContent = on ? tr('隐藏标记', 'Hide markers') : tr('显示标记', 'Show markers'); }
    if (t.matches('[data-hero-candidate]')) showHeroCandidate(t.dataset.heroCandidate);
    if (t.matches('[data-hero-locate]')) { state.selected = COMPARISON_ROWS.find(r => r.c.id === t.dataset.heroLocate && r.p?.id === bestPose(r.c, 'all')?.id)?.id; selectEvidence('energies'); renderResults($('[data-widget=results]')); $('#findings').scrollIntoView(); }
    if (t.matches('[data-play-film]')) { $('#workspace').scrollIntoView(); window.processFilm?.play(true); }
    if (t.matches('[data-open-gallery]')) { selectEvidence('gallery'); $('.evidence-deck').scrollIntoView({block: 'start'}); }
    if (t.matches('[data-evidence]')) selectEvidence(t.dataset.evidence);
    if (t.matches('[data-pos-filter]')) applyPosFilter(t.closest('[data-widget]'), t.dataset.posFilter === 'all' ? 'all' : +t.dataset.posFilter);
    if (t.matches('[data-ring-pos]')) { const w = t.closest('[data-widget]'), p = +t.dataset.ringPos; applyPosFilter(w, state.filter === p ? 'all' : p); }
    if (t.matches('[data-select]')) { state.selected = t.dataset.select; const w = $('[data-widget=results]'); drawDelta(w); drawInspector(w); }
    if (t.matches('[data-sapt-view]')) { state.saptView = t.dataset.saptView; drawSapt($('[data-widget=sapt]')); }
    if (t.matches('[data-fig]')) drawFigure($('[data-widget=gallery]'), t.dataset.fig);
  });
  document.addEventListener('keydown', e => {
    if (['Enter', ' '].includes(e.key)) {
      const t = e.target.closest?.('[data-select],[data-ring-pos]');
      if (t) { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', {bubbles: true})); }
    }
  });
  $('.evidence-tabs').addEventListener('keydown', e => {
    if (!e.target.matches('[role="tab"]')) return;
    const tabs = $$('[role="tab"]', $('.evidence-tabs')), index = tabs.indexOf(e.target);
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault(); selectEvidence(tabs[next].dataset.evidence, true);
  });
  document.addEventListener('input', e => { if (e.target.matches('[data-input-search]')) renderInputTree(); });
  document.addEventListener('change', e => { if (e.target.matches('[data-input-type]')) renderInputTree(); });
  document.addEventListener('pointerover', e => { const t = e.target.closest('[data-tip]'); if (t && t.dataset.tip) showTip(t, e.clientX, e.clientY); });
  document.addEventListener('pointermove', e => { if ($('#tooltip').classList.contains('show')) placeTip(e.clientX, e.clientY); });
  document.addEventListener('pointerout', e => { if (e.target.closest('[data-tip]')) $('#tooltip').classList.remove('show'); });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('[data-tip]'); if (t && t.dataset.tip) { const r = t.getBoundingClientRect(); showTip(t, r.x + r.width / 2, r.y); } });
  document.addEventListener('focusout', () => $('#tooltip').classList.remove('show'));
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } }));
  let resizeTimer;
  new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.evidence === 'energies') drawDelta($('[data-widget=results]')); if (state.evidence === 'forces') drawSapt($('[data-widget=sapt]')); }, 120); }).observe($('.evidence-deck'));
}
function placeTip(x, y) { const t = $('#tooltip'); t.style.left = Math.max(8, Math.min(innerWidth - t.offsetWidth - 12, x + 15)) + 'px'; t.style.top = Math.max(8, Math.min(innerHeight - t.offsetHeight - 12, y + 15)) + 'px'; }
function showTip(el, x, y) { const [a, b] = el.dataset.tip.split('|'); $('#tooltip').innerHTML = `<strong>${esc(a)}</strong><span>${esc(b || '')}</span>`; $('#tooltip').classList.add('show'); placeTip(x, y); }

function start() {
  const W = {candidates: candidatesWidget, results: resultsWidget, sapt: saptWidget, gallery: galleryWidget};
  $$('[data-widget]').forEach(el => { const f = W[el.dataset.widget]; if (f) el.innerHTML = f(); });
  $('[data-finding-cards]').innerHTML = findingCards();
  injectDialogs();
  $$('[data-release]').forEach(el => { el.textContent = SKELETON ? tr('AGENTS-A1.5 × CODEX × PSI4 · 骨架预览', 'AGENTS-A1.5 × CODEX × PSI4 · skeleton preview') : 'AGENTS-A1.5 × CODEX × PSI4'; });
  $('[data-input-scope]').innerHTML = [
    [String(WORKSPACE.files.length), tr('份任务文件', 'task files')],
    ['0', tr('个预置候选或脚本', 'candidates or scripts supplied')],
  ].map(([n, label]) => `<span><b>${n}</b> ${label}</span>`).join('');
  renderInputTree();
  showInputSelection(WORKSPACE.files[0]);
  const J = D.journey || {};
  $('[data-run-stats]').innerHTML = [
    [J.hours == null ? '—' : '≈' + J.hours, tr('小时 · 主要为 Psi4 计算', 'hours in total, mostly Psi4 calculations'), 'session log'],
    [J.toolCalls == null ? '—' : J.toolCalls.toLocaleString('en-US'), tr('次工具调用', 'tool calls'), 'session log'],
    [J.psi4Jobs ?? '—', tr('次 Psi4 计算任务', 'Psi4 jobs submitted'), 'run records'],
    [J.recoveries ?? '—', tr('次失败后自行恢复', 'failures recovered without help'), 'run records'],
  ].map(([v, label, key]) => `<div${pend(key, v === '—')}><b>${v}</b><span>${label}</span></div>`).join('');
  initHero();
  renderResults($('[data-widget=results]'));
  drawSapt($('[data-widget=sapt]'));
  drawFigure($('[data-widget=gallery]'), FIGURES[0][0]);
  initInlineFilm();
  bindGlobal();
  initSkeleton();
  initLocale();
  window.showcase = {data: D, workspace: WORKSPACE, state, ready: true};
}
start();
