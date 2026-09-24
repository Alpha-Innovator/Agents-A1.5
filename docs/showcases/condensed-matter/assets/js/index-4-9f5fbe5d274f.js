(() => {
  const host = $('heroLab'), crystal = $('heroCrystal');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let checkpoint = 0, role = 0, automatic = !reducedMotion.matches;
  let spin = !reducedMotion.matches, visible = true, elapsed = 0, previousTime = 0;
  let yaw = .56, pitch = -.2, pointer = null, inspectedAtom = -1, inspectedPeak = -1;
  let heroRenderer, heroScene, heroCamera, specimen, lattice, initialLattice;
  let transition = 1, sourceMatrix = F[0].matrix, sourceCoords = F[0].parameters.frac_coords;
  let currentMatrix = sourceMatrix, currentCoords = sourceCoords;
  const meshes = [], raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const geometryScale = 7 / Math.max(...F[0].parameters.cell.slice(0, 3));
  const spectrumMaximum = Math.max(1, ...D.observed, ...F.flatMap(f => f.profile));
  const spectrumMinimum = Math.min(0, ...D.observed, ...F.flatMap(f => f.profile));
  const residualMaximum = Math.max(1, ...F.flatMap(f => f.profile.map((v, i) => Math.abs(D.observed[i] - v))));
  const num = (v, precision = 4) => Number(v).toFixed(precision);
  const shortNotes = {
    zh: [
      ['读取初始结构、观测谱与剩余预算。', '固定原点，建立首个结构与谱图检查点。', '记录初始 Rwp，作为后续试探的比较基准。'],
      ['先开放比例和背景，检验整体强度偏差。', '优化比例与三个背景系数，保持晶胞和坐标固定。', 'Rwp 下降 0.034497 pp，接受当前参数。'],
      ['将试探转向晶胞长度，检验峰位偏差。', '开放 a、b、c，并继续优化比例与背景。', 'Rwp 下降 2.121462 pp，接受新的晶胞。'],
      ['单独检验晶胞角度是否仍有改善空间。', '试探角度参数，保持原子分数坐标固定。', '角度收益过小，拒绝试探并保留上一节点。'],
      ['从晶胞转向原子位置，检验相对强度残差。', '开放原子 1、2 的分数坐标与比例。', 'Rwp 下降 0.033376 pp，接受坐标更新。'],
      ['继续检验同一坐标块是否还有下降空间。', '原子 1、2 续跑，求解器返回无下降步。', 'Reviewer 建议接受；数值门禁拦截，保留上一节点。'],
      ['将剩余预算分配给尚未试探的原子。', '开放原子 3、4 的坐标与比例。', 'Rwp 再下降 0.009875 pp，接受更新。'],
      ['继续检验下一个原子坐标块。', '开放原子 5、6 的坐标与比例。', 'Rwp 下降 0.000339 pp，保存当前参数。'],
      ['将最后一轮用于尚未试探的原子 7。', '开放原子 7 与比例，完成八轮预算。', '最终 Rwp 为 86.109214%，导出当前结构与谱图。']
    ],
    en: [
      ['Read the initial structure, observed pattern and remaining budget.', 'Fix the origin and create the initial structure and pattern checkpoint.', 'Record the initial Rwp as the baseline for subsequent trials.'],
      ['Test overall intensity mismatch with scale and background.', 'Optimize scale and three background coefficients; keep geometry fixed.', 'Accept the parameters after a 0.034497 pp Rwp decrease.'],
      ['Test the peak-position hypothesis by opening cell lengths.', 'Optimize a, b and c together with scale and background.', 'Accept the new cell after a 2.121462 pp Rwp decrease.'],
      ['Test whether cell angles offer further improvement.', 'Optimize angles while holding fractional coordinates fixed.', 'Reject the small angle gain and retain the previous checkpoint.'],
      ['Test relative-intensity residuals with an atomic coordinate block.', 'Open fractional coordinates of atoms 1 and 2, together with scale.', 'Accept the coordinate update: Rwp decreases by 0.033376 pp.'],
      ['Test the same coordinate block for further descent.', 'Repeat atoms 1 and 2; the solver returns no descent step.', 'The Reviewer recommends acceptance; the numerical gate blocks it.'],
      ['Allocate the remaining trials to untested atoms.', 'Open coordinates of atoms 3 and 4, together with scale.', 'Accept another 0.009875 pp Rwp decrease.'],
      ['Test the next atomic coordinate block.', 'Open coordinates of atoms 5 and 6, together with scale.', 'Save the parameters after a 0.000339 pp Rwp decrease.'],
      ['Use the last trial for the remaining atom 7.', 'Open atom 7 and scale, completing the eight-trial budget.', 'Export the structure and pattern at a final Rwp of 86.109214%.']
    ]
  };

  $('heroCheckpoints').innerHTML = F.map((f, i) => `<button data-hero-checkpoint="${i}" class="${i && !f.history.accepted ? 'retained' : ''}" aria-pressed="${i === 0}">${String(i).padStart(2, '0')}</button>`).join('');
  function motionIcon() {
    $('heroMotion').innerHTML = `<i data-lucide="${automatic ? 'pause' : 'play'}"></i>`;
    icons();
  }
  function atomLabel() {
    if (inspectedAtom < 0) {
      const cell = F[checkpoint].parameters.cell;
      $('heroAtomDetail').textContent = `a ${num(cell[0], 3)} / b ${num(cell[1], 3)} / c ${num(cell[2], 3)} Å`;
      return;
    }
    const coords = F[checkpoint].parameters.frac_coords[inspectedAtom];
    $('heroAtomDetail').textContent = `${D.elements[inspectedAtom]} · ${t('原子', 'site')} ${inspectedAtom} / (${coords.map(v => num(v, 3)).join(', ')})`;
  }
  function refresh() {
    $('heroRwp').textContent = num(F[checkpoint].metrics.rwp) + '%';
    $('heroCheckpointLabel').textContent = `${checkpoint ? t('记录节点', 'Checkpoint') : t('初始状态', 'Initial state')} · ${String(checkpoint).padStart(2, '0')} / 08`;
    $('heroRoleNote').textContent = shortNotes[lang][checkpoint][role];
    $('heroInitial').setAttribute('aria-pressed', String(checkpoint === 0));
    $('heroFinal').setAttribute('aria-pressed', String(checkpoint === 8));
    host.querySelectorAll('[data-hero-checkpoint]').forEach(button => {
      const i = Number(button.dataset.heroCheckpoint);
      button.setAttribute('aria-pressed', String(i === checkpoint));
      button.setAttribute('aria-label', `${String(i).padStart(2, '0')} / ${titles[i]}`);
      button.title = `${titles[i]} · Rwp ${num(F[i].metrics.rwp)}%`;
    });
    document.querySelectorAll('[data-hero-role]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.heroRole) === role));
    });
    const label = automatic ? t('暂停首屏回放', 'Pause hero replay') : t('播放首屏回放', 'Play hero replay');
    $('heroMotion').setAttribute('aria-label', label);
    $('heroMotion').dataset.tip = label;
    atomLabel();
    drawPattern();
    drawTrace();
  }
  function selectCheckpoint(index, manual = true) {
    sourceMatrix = currentMatrix.map(row => row.slice());
    sourceCoords = currentCoords.map(row => row.slice());
    checkpoint = index;
    transition = reducedMotion.matches ? 1 : 0;
    elapsed = 0;
    if (manual) { automatic = false; motionIcon(); }
    refresh();
  }
  host.querySelectorAll('[data-hero-checkpoint]').forEach(button => {
    button.onclick = () => selectCheckpoint(Number(button.dataset.heroCheckpoint));
  });
  document.querySelectorAll('[data-hero-role]').forEach(button => {
    button.onclick = () => { role = Number(button.dataset.heroRole); automatic = false; motionIcon(); refresh(); };
  });
  $('heroInitial').onclick = () => selectCheckpoint(0);
  $('heroFinal').onclick = () => selectCheckpoint(8);
  $('heroMotion').onclick = () => { automatic = !automatic; elapsed = 0; motionIcon(); refresh(); };
  $('heroRotate').onclick = () => { spin = !spin; $('heroRotate').setAttribute('aria-pressed', String(spin)); };
  $('heroReset').onclick = () => { yaw = .56; pitch = -.2; inspectedAtom = -1; atomLabel(); };

  function cartesian(frac, matrix = currentMatrix) {
    return [0, 1, 2].map(j => frac.reduce((sum, v, i) => sum + (v - .5) * matrix[i][j], 0) * geometryScale);
  }
  function edgePositions(matrix) { return edges.flatMap(edge => edge.flatMap(i => cartesian(corners[i], matrix))); }
  function createLattice(matrix, color, opacity) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions(matrix), 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  }
  function resize() {
    if (heroRenderer) {
      const rect = crystal.getBoundingClientRect();
      heroRenderer.setSize(rect.width, rect.height);
      const aspect = rect.width / Math.max(1, rect.height);
      const halfHeight = Math.max(6.3, 6.8 / aspect);
      heroCamera.left = -halfHeight * aspect;
      heroCamera.right = halfHeight * aspect;
      heroCamera.top = halfHeight;
      heroCamera.bottom = -halfHeight;
      heroCamera.updateProjectionMatrix();
    }
    drawPattern(); drawTrace();
  }
  function initializeCrystal() {
    try {
      heroRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      heroRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      heroRenderer.outputEncoding = THREE.sRGBEncoding;
      heroRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      heroRenderer.toneMappingExposure = 1.25;
      heroScene = new THREE.Scene();
      heroCamera = new THREE.OrthographicCamera(-12, 12, 7, -7, .1, 100);
      heroCamera.position.set(0, 0, 25);
      specimen = new THREE.Group();
      heroScene.add(specimen);
      heroScene.add(new THREE.HemisphereLight(0xe5d7ff, 0x21172f, 1.1));
      [[0xffffff, 2.1, 4, 7, 8], [0xa187f2, 1.3, -6, 2, 3], [0xf6cca0, .7, 2, -4, -4]].forEach(([color, intensity, x, y, z]) => {
        const light = new THREE.DirectionalLight(color, intensity); light.position.set(x, y, z); heroScene.add(light);
      });
      const sphere = new THREE.SphereGeometry(1, 40, 28);
      D.elements.forEach((symbol, index) => {
        const material = new THREE.MeshStandardMaterial({ color: symbol === 'Sc' ? 0xbfa5ff : 0xe5b97f, roughness: .25, metalness: .3 });
        const mesh = new THREE.Mesh(sphere, material);
        mesh.scale.setScalar(symbol === 'Sc' ? .46 : .37);
        mesh.userData.index = index;
        meshes.push(mesh); specimen.add(mesh);
      });
      lattice = createLattice(currentMatrix, 0xbda4ed, .8);
      initialLattice = createLattice(F[0].matrix, 0x796b96, .22);
      specimen.add(lattice, initialLattice);
      const vertexGeometry = new THREE.BufferGeometry();
      vertexGeometry.setAttribute('position', new THREE.Float32BufferAttribute(corners.flatMap(corner => cartesian(corner)), 3));
      const vertices = new THREE.Points(vertexGeometry, new THREE.PointsMaterial({ color: 0xe5d7ff, size: .055 }));
      specimen.add(vertices);
      specimen.userData.vertices = vertices;
      const canvas = heroRenderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      crystal.prepend(canvas);
      canvas.onpointerdown = event => {
        if (event.button !== 0) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      };
      const pickAtom = event => {
        const rect = canvas.getBoundingClientRect();
        mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
        raycaster.setFromCamera(mouse, heroCamera);
        const hit = raycaster.intersectObjects(meshes)[0];
        inspectedAtom = hit ? hit.object.userData.index : -1;
        atomLabel();
      };
      canvas.onpointermove = event => {
        if (pointer && pointer.id === event.pointerId) {
          yaw += (event.clientX - pointer.x) * .007;
          pitch = Math.max(-1.2, Math.min(1.2, pitch + (event.clientY - pointer.y) * .007));
          pointer.x = event.clientX; pointer.y = event.clientY;
        } else if (event.pointerType !== 'touch') pickAtom(event);
      };
      canvas.onpointerup = event => {
        if (pointer && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 6) pickAtom(event);
        pointer = null;
      };
      canvas.onpointercancel = canvas.onlostpointercapture = () => { pointer = null; };
      canvas.onpointerleave = () => { if (!pointer) { inspectedAtom = -1; atomLabel(); } };
      canvas.onkeydown = event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Enter'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') yaw -= .15;
        if (event.key === 'ArrowRight') yaw += .15;
        if (event.key === 'ArrowUp') pitch = Math.max(-1.2, pitch - .15);
        if (event.key === 'ArrowDown') pitch = Math.min(1.2, pitch + .15);
        if (event.key === 'Home') { yaw = .56; pitch = -.2; }
        if (event.key === 'Enter') { inspectedAtom = (inspectedAtom + 1) % meshes.length; atomLabel(); }
      };
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); crystal.classList.add('no-webgl'); canvas.style.display = 'none'; });
      canvas.addEventListener('webglcontextrestored', () => { crystal.classList.remove('no-webgl'); canvas.style.display = 'block'; resize(); });
    } catch (error) {
      if (heroRenderer) heroRenderer.dispose();
      heroRenderer = null;
      crystal.classList.add('no-webgl');
      $('heroRotate').disabled = true; $('heroReset').disabled = true;
    }
  }
  function drawCrystal(dt) {
    if (!heroRenderer || crystal.classList.contains('no-webgl')) return;
    transition = Math.min(1, transition + dt / .7);
    const eased = transition * transition * (3 - 2 * transition), target = F[checkpoint];
    // Geometry eases between recorded checkpoints; numerical labels always use the actual checkpoint.
    currentMatrix = sourceMatrix.map((row, i) => row.map((v, j) => v + (target.matrix[i][j] - v) * eased));
    currentCoords = sourceCoords.map((row, i) => row.map((v, j) => v + (target.parameters.frac_coords[i][j] - v) * eased));
    meshes.forEach((mesh, index) => {
      mesh.position.set(...cartesian(currentCoords[index]));
      mesh.material.emissive.setHex(index === inspectedAtom ? 0x50336e : 0x000000);
    });
    lattice.geometry.attributes.position.array.set(edgePositions(currentMatrix));
    lattice.geometry.attributes.position.needsUpdate = true;
    specimen.userData.vertices.geometry.attributes.position.array.set(corners.flatMap(corner => cartesian(corner)));
    specimen.userData.vertices.geometry.attributes.position.needsUpdate = true;
    if (spin && !pointer && inspectedAtom < 0) yaw += dt * .16;
    specimen.rotation.set(pitch, yaw, -.12);
    heroRenderer.render(heroScene, heroCamera);
  }
  function drawPattern() {
    const [ctx, width, height] = context('heroSpectrum');
    if (!width || !height) return;
    const left = 6, right = width - 8, top = 27, baseline = height - 48, diffBaseline = height - 28;
    const x = i => left + (D.x[i] - D.x[0]) / (D.x.at(-1) - D.x[0]) * (right - left);
    const y = v => baseline - (v - spectrumMinimum) / (spectrumMaximum - spectrumMinimum) * (baseline - top);
    const profile = F[checkpoint].profile;
    ctx.lineWidth = 1;
    [baseline, diffBaseline].forEach(value => { ctx.strokeStyle = '#b9a4fc20'; ctx.beginPath(); ctx.moveTo(left, value); ctx.lineTo(right, value); ctx.stroke(); });
    const line = (values, color, converter, lineWidth = 1) => {
      ctx.beginPath(); values.forEach((v, i) => i ? ctx.lineTo(x(i), converter(v)) : ctx.moveTo(x(i), converter(v)));
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
    };
    line(D.observed, '#9788ac', y);
    line(profile, '#c2a8ff', y, 1.4);
    line(profile.map((v, i) => D.observed[i] - v), '#95dfc8aa', v => diffBaseline - v / residualMaximum * 12);
    ctx.font = '9px Consolas, monospace'; ctx.fillStyle = '#9689a7'; ctx.textAlign = 'center';
    for (let value = Math.ceil(D.x[0] / 20) * 20; value < D.x.at(-1); value += 20) {
      ctx.fillText(String(value), left + (value - D.x[0]) / (D.x.at(-1) - D.x[0]) * (right - left), height - 4);
    }
    ctx.textAlign = 'right'; ctx.fillText('2θ / °', right, height - 4);
    if (inspectedPeak >= 0) {
      const i = inspectedPeak, px = x(i);
      ctx.strokeStyle = '#c2a8ff77'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, diffBaseline + 8); ctx.stroke(); ctx.setLineDash([]);
      const label = `${num(D.x[i], 2)}° / ${t('观测', 'obs')} ${num(D.observed[i], 1)} / ${t('计算', 'calc')} ${num(profile[i], 1)}`;
      ctx.font = '9px Showcase, Arial';
      const labelWidth = ctx.measureText(label).width;
      const tx = Math.max(left, Math.min(right - labelWidth, px - labelWidth / 2));
      ctx.fillStyle = '#090a10ee'; ctx.fillRect(tx - 3, top - 5, labelWidth + 6, 16);
      ctx.fillStyle = '#e0d4f8'; ctx.textAlign = 'left'; ctx.fillText(label, tx, top + 6);
    }
  }
  const spectrumCanvas = $('heroSpectrum');
  const inspectPattern = event => {
    const rect = spectrumCanvas.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left - 6) / (rect.width - 14)));
    const value = D.x[0] + fraction * (D.x.at(-1) - D.x[0]);
    let low = 0, high = D.x.length - 1;
    while (low < high) { const middle = (low + high) >>> 1; if (D.x[middle] < value) low = middle + 1; else high = middle; }
    inspectedPeak = low > 0 && value - D.x[low - 1] < D.x[low] - value ? low - 1 : low;
    drawPattern();
  };
  spectrumCanvas.onpointermove = spectrumCanvas.onpointerdown = inspectPattern;
  spectrumCanvas.onpointerleave = () => { inspectedPeak = -1; drawPattern(); };
  function drawTrace() {
    const [ctx, width, height] = context('heroRwpTrace');
    const x = i => 4 + i / 8 * (width - 8);
    const y = i => 4 + (F[0].metrics.rwp - F[i].metrics.rwp) / (F[0].metrics.rwp - F[8].metrics.rwp) * (height - 8);
    ctx.beginPath(); F.forEach((f, i) => i ? ctx.lineTo(x(i), y(i)) : ctx.moveTo(x(i), y(i)));
    ctx.strokeStyle = '#b9a4fc33'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= checkpoint; i++) i ? ctx.lineTo(x(i), y(i)) : ctx.moveTo(x(i), y(i));
    ctx.strokeStyle = '#b9a4fc'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#dccaff'; ctx.beginPath(); ctx.arc(x(checkpoint), y(checkpoint), 2.5, 0, Math.PI * 2); ctx.fill();
  }
  function localize() {
    if (heroRenderer) heroRenderer.domElement.setAttribute('aria-label', t('Sc₂Au₆ 晶体结构；方向键旋转，回车选择原子', 'Sc₂Au₆ crystal; arrow keys rotate, Enter selects an atom'));
    refresh();
  }
  function animate(now) {
    const dt = previousTime ? Math.min((now - previousTime) / 1000, .06) : 0;
    previousTime = now;
    if (visible && !document.hidden) {
      if (automatic && !pointer && inspectedPeak < 0 && inspectedAtom < 0) {
        elapsed += dt;
        const nextRole = Math.min(2, Math.floor(elapsed / 1.5));
        if (role !== nextRole) { role = nextRole; refresh(); }
        if (elapsed >= 4.5) { role = 0; selectCheckpoint((checkpoint + 1) % F.length, false); }
      }
      drawCrystal(dt);
    }
    requestAnimationFrame(animate);
  }
  initializeCrystal();
  $('heroRotate').setAttribute('aria-pressed', String(spin));
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(host);
  new MutationObserver(localize).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  reducedMotion.addEventListener('change', () => { automatic = false; spin = false; $('heroRotate').setAttribute('aria-pressed', 'false'); motionIcon(); refresh(); });
  motionIcon(); localize(); resize(); drawCrystal(0); requestAnimationFrame(animate);
})();
