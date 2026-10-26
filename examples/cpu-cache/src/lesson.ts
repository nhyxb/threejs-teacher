import * as THREE from 'three';
import type { Label, LessonModule } from './types';
import { box, colors, path, smooth } from './scene-kit';
import { simulate, sample, sequenceFor, EVENT_SECONDS, type CacheEvent } from './model';

const cacheX = [-1.75, -1.14, -0.53, 0.08], cacheZ = [-1.32, -0.44, 0.44, 1.32];
const blockColors = [0x4b9caa, 0x6b91bd, 0x81966b, 0xb09561];
const rangeName = (block: number) => `A[${block * 4}…${block * 4 + 3}]`;
const emptyColor = 0xd1ded8;

export const lesson: LessonModule = {
  slug: 'cpu-cache', title: 'CPU 缓存，数据的近路', concept: '计算机硬件',
  subtitle: '跟随一次数据读取，看懂缓存命中、整块搬入与有限容量。',
  modelNote: '这是结构与数据路径示意，不是芯片实际布局。模型为单层、只读、全相联缓存，使用 LRU 替换；忽略多级缓存、预取、并行、写入与一致性。A[0…15] 每元素 4 字节，每缓存行装 4 个连续元素（16 字节，为便于观察的教学取值，并非通用 CPU 行大小），容量可选 2 或 4 行。彩色方块代表数据副本，移动曲线代表抽象搬运路径；内存中的源数据仍然保留。',
  sources: [
    { title: 'Cornell CS 3410 · Caches：命中、局部性、缓存块与替换', url: 'https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/caches.html' },
    { title: 'Intel RDT 文档：缓存未命中与共享缓存', url: 'https://eci.intel.com/docs/3.2/development/performance/intel-pqos.html' }
  ],
  parameters: [
    { key: 'capacity', label: '缓存容量', kind: 'select', value: 2, options: [{ value: 2, label: '2 行 · 共 8 个元素' }, { value: 4, label: '4 行 · 共 16 个元素' }] },
    { key: 'pattern', label: '访问顺序（第 5 步）', kind: 'select', value: 'sequential', options: [{ value: 'sequential', label: '连续：0 → 1 → 2 → 3 → …' }, { value: 'interleaved', label: '交错：0 → 4 → 8 → 12 → …' }] }
  ],
  steps: [
    { id: 'structure', title: '认识结构', heading: '先找数据，再做计算', duration: 6,
      body: ['处理核心需要数据来完成计算。数据放在内存中，芯片内的缓存保留其中一小部分的副本。', '观察左侧芯片里的处理核心与缓存槽位，再看右侧内存。缓存不是更大的内存，而是容量有限的数据近路。'], takeaway: '缓存存的是副本。读取之后，内存里的原数据仍然存在。',
      question: { prompt: '缓存能装下所有数据吗？', choices: [{ label: '容量有限', correct: true, feedback: '对。正因为容量有限，后面才需要决定保留哪些数据、替换哪些数据。' }, { label: '总能全部装下', correct: false, feedback: '缓存通常远小于主内存。本实验可以用 2 行或 4 行观察容量产生的区别。' }] } },
    { id: 'cold', title: '第一次读取', heading: '缓存为空，就去内存取', duration: EVENT_SECONDS + 0.4,
      body: ['按“开始演示”，跟随第一次对 A[0] 的读取。缓存找不到它，这叫未命中。', '取回的不是孤零零一个元素，而是包含 A[0] 的一整块 A[0…3]。缓存保留这块副本，并把所需元素交给处理核心。'], takeaway: '缓存按块搬入数据；一次未命中，也把附近的数据带了回来。',
      question: { prompt: '第一次读取 A[0] 后，缓存里还有谁？', choices: [{ label: 'A[1]、A[2]、A[3]', correct: true, feedback: '对。一行包含连续的四个元素，邻居一起被搬入。' }, { label: '只有 A[0]', correct: false, feedback: '本模型按四个连续元素组成的块搬入，所以 A[0…3] 一起进入缓存。' }] } },
    { id: 'reuse', title: '用上局部性', heading: '再读一次，近路就有用了', duration: EVENT_SECONDS * 5 + 0.4,
      body: ['这一轮先读取 A[0]，再读 A[0]、A[1]、A[2]、A[3]。第二次读 A[0] 利用了时间局部性：刚用过的数据很快再次使用。', '邻近元素已经随整块数据进入缓存，随后读取也会命中。这体现了空间局部性。命中时无需再从内存搬入数据。'], takeaway: '既可能重复用到同一数据，也可能紧接着用到它的邻居。' },
    { id: 'replace', title: '容量与替换', heading: '位置有限，要留谁、换谁？', duration: EVENT_SECONDS * 5 + 0.4,
      body: ['默认两行缓存，依次读取 0 → 4 → 0 → 8 → 4。第三次读取重新用到块 A[0…3]，它变成最近使用的块。', '随后 A[8…11] 到来时，淘汰最久未使用的 A[4…7]。最后再读 A[4]，就会再次未命中。切到四行重播，比较结果。'], takeaway: '本模型用 LRU：满了以后，替换最久没被使用的块。',
      question: { prompt: '两行缓存读完 0 → 4 → 0，下一个读 8，先换掉哪块？', choices: [{ label: 'A[4…7]', correct: true, feedback: '对。A[0…3] 刚刚被再次访问，较久未用的是 A[4…7]。' }, { label: 'A[0…3]', correct: false, feedback: '命中也会刷新使用历史。第三次又读了 A[0]，所以保留它，淘汰 A[4…7]。' }] } },
    { id: 'compare', title: '改变再验证', heading: '同样的数据，顺序能改变结果', duration: EVENT_SECONDS * 16 + 0.4,
      body: ['两种顺序都读取 A[0…15] 各一次。连续读取先用完同一块；交错读取则在四个块之间轮流访问。', '先用两行缓存比较两种顺序，再改为四行重播。观察命中与内存搬运次数：顺序的效果取决于缓存容量和数据使用方式。'], takeaway: '更好的局部性有助于利用缓存；结果还取决于工作集与容量，不能只看读取数量。',
      question: { prompt: '四行都能保留时，交错读取还会每次未命中吗？', choices: [{ label: '不会，后续可以命中', correct: true, feedback: '对。四个块首次各搬入一次后，都能保留。最终是 12 次命中、4 次未命中。' }, { label: '仍然每次未命中', correct: false, feedback: '四行足以容纳这四个块。只要不被淘汰，后续读到同块的邻近元素就会命中。' }] } }
  ],
  createScene(ctx) {
    const { world } = ctx;
    box(world, [12.8, 0.18, 7], [0, -0.02, 0], 0xd5e2dc);
    box(world, [6.3, 0.22, 4.6], [-2.25, 0.2, 0], 0x577b71);
    box(world, [5.85, 0.18, 4.15], [-2.25, 0.4, 0], 0xb8ccc3);
    const core = box(world, [1.6, 0.38, 1.7], [-3.75, 0.73, 0], 0x456961);
    box(world, [1.17, 0.08, 1.25], [-3.75, 0.97, 0], 0x71958a);
    for (let i = 0; i < 11; i++) {
      box(world, [0.13, 0.12, 0.27], [-4.85 + i * 0.51, 0.2, -2.4], 0x9ba9a0, false);
      box(world, [0.13, 0.12, 0.27], [-4.85 + i * 0.51, 0.2, 2.4], 0x9ba9a0, false);
    }
    box(world, [2.7, 0.12, 3.6], [-0.85, 0.59, 0], 0x98b2a6);
    const cells: THREE.Mesh[][] = [], cellLabels: Label[][] = [], rowLabels: Label[] = [];
    for (let r = 0; r < 4; r++) {
      const row: THREE.Mesh[] = [], text: Label[] = [];
      for (let c = 0; c < 4; c++) {
        row.push(box(world, [0.52, 0.27, 0.6], [cacheX[c], 0.8, cacheZ[r]], emptyColor));
        text.push(ctx.label('—', [cacheX[c], 1.08, cacheZ[r]], 'data-label'));
      }
      cells.push(row); cellLabels.push(text); rowLabels.push(ctx.label(`行 ${r + 1}`, [0.85, 0.86, cacheZ[r]], 'data-label'));
    }
    box(world, [2.8, 0.16, 5], [3.7, 0.2, 0], 0xb8cdc3);
    const memoryCells: THREE.Mesh[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: THREE.Mesh[] = [];
      for (let c = 0; c < 4; c++) {
        const x = 2.75 + c * 0.61, z = -1.56 + r * 1.03;
        row.push(box(world, [0.52, 0.28, 0.7], [x, 0.48, z], blockColors[r]));
        ctx.label(String(r * 4 + c), [x, 0.77, z], 'data-label');
      }
      memoryCells.push(row);
    }
    ctx.label('处理核心', [-3.75, 1.6, 0], 'major');
    const capacityLabel = ctx.label('缓存 · 2 行', [0.0, 0.8, 2.6], 'major');
    ctx.label('内存 A[0…15]', [3.65, 0.45, 3.1], 'major');
    const currentLabel = ctx.label('', [1.6, 2.1, 0], 'major'); currentLabel.setVisible(false);
    const memoryPath = path(world, [[3.5, 0.9, -0.4], [2.1, 2.2, -0.4], [0.1, 1.8, -0.4], [-0.85, 1.1, -0.4]], colors.orange, 0.035);
    const corePath = path(world, [[-0.9, 1.1, -0.4], [-2, 1.8, -0.5], [-2.8, 1.6, 0], [-3.75, 1.15, 0]], colors.teal, 0.035);
    const requestPath = path(world, [[-3.75, 1.1, 0.25], [-2.6, 1.4, 0.7], [-1.7, 1.3, 0.4], [-0.85, 1.1, 0.25]], colors.teal, 0.018);
    const transfer = new THREE.Group(); world.add(transfer);
    const transferCells = Array.from({ length: 4 }, (_, i) => box(transfer, [0.38, 0.25, 0.4], [(i - 1.5) * 0.43, 0, 0], blockColors[0]));
    const word = box(world, [0.32, 0.32, 0.32], [0, 1, 0], colors.teal);
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 16), new THREE.MeshStandardMaterial({ color: colors.orange, roughness: 0.5 })); pointer.rotation.z = Math.PI; world.add(pointer);
    let events: CacheEvent[] = [], lastKey = '', lastRoute = '';
    function setRoute(route: ReturnType<typeof path>, points: [number, number, number][], radius: number) {
      route.curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
      route.mesh.geometry.dispose();
      route.mesh.geometry = new THREE.TubeGeometry(route.curve, 48, radius, 6, false);
    }
    function paint(mesh: THREE.Mesh, color: number, emphasis = false) {
      const m = mesh.material as THREE.MeshStandardMaterial;
      m.color.setHex(color); m.emissive.setHex(emphasis ? color : 0x000000); m.emissiveIntensity = emphasis ? 0.12 : 0;
    }
    return {
      updateAt({ stepId, time, params }) {
        const capacity = Number(params.capacity), pattern = String(params.pattern), key = `${stepId}:${capacity}:${pattern}`;
        if (key !== lastKey) { events = simulate(sequenceFor(stepId, pattern), capacity); lastKey = key; }
        const s = sample(events, time), event = s.event, phase = s.phase;
        capacityLabel.setText(`缓存 · ${capacity} 行`);
        const structureFocus = stepId === 'structure' ? Math.min(2, Math.floor(time / 2)) : -1;
        paint(core, 0x456961, structureFocus === 0);
        for (let r = 0; r < 4; r++) {
          const visible = r < capacity, line = s.cache[r], block = line?.block ?? null;
          rowLabels[r].setVisible(visible);
          for (let c = 0; c < 4; c++) {
            cells[r][c].visible = visible; cellLabels[r][c].setVisible(visible);
            paint(cells[r][c], block === null ? emptyColor : blockColors[block], structureFocus === 1 || !!event && event.slot === r && phase > 0.15);
            cellLabels[r][c].setText(block === null ? '—' : String(block * 4 + c));
          }
        }
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) paint(memoryCells[r][c], blockColors[r], structureFocus === 2 || !!event && !event.hit && event.block === r && phase >= 0.18 && phase < 0.64);
        memoryPath.mesh.visible = !!event && !event.hit && phase >= 0.18 && phase < 0.66;
        corePath.mesh.visible = !!event && phase >= 0.64;
        requestPath.mesh.visible = !!event && phase > 0 && phase < 0.2;
        transfer.visible = memoryPath.mesh.visible; word.visible = !!event && phase >= 0.64 && phase < 0.94;
        pointer.visible = !!event && phase > 0; currentLabel.setVisible(!!event && phase > 0.16);
        if (event) {
          const routeKey = `${key}:${event.index}`;
          if (lastRoute !== routeKey) {
            lastRoute = routeKey;
            const sourceZ = -1.56 + event.block * 1.03, targetZ = cacheZ[event.slot];
            setRoute(memoryPath, [[3.66, 0.95, sourceZ], [2.1, 2.1, sourceZ], [0.5, 1.8, targetZ], [-0.85, 1.12, targetZ]], 0.035);
            setRoute(corePath, [[cacheX[event.element % 4], 1.13, targetZ], [-2, 1.8, targetZ], [-2.8, 1.6, 0], [-3.75, 1.18, 0]], 0.035);
          }
          const memoryPosition = new THREE.Vector3(3.66, 0.95, -1.56 + event.block * 1.03), cachePosition = new THREE.Vector3(-0.85, 1.12, cacheZ[event.slot]);
          const travel = smooth((phase - 0.18) / 0.46);
          transfer.position.lerpVectors(memoryPosition, cachePosition, travel); transfer.position.y += Math.sin(travel * Math.PI) * 1.5;
          transferCells.forEach(m => paint(m, blockColors[event.block]));
          const returnProgress = smooth((phase - 0.64) / 0.28);
          word.position.lerpVectors(new THREE.Vector3(cacheX[event.element % 4], 1.13, cacheZ[event.slot]), new THREE.Vector3(-3.75, 1.18, 0), returnProgress);
          word.position.y += Math.sin(returnProgress * Math.PI) * 0.7;
          if (event.hit) pointer.position.set(cacheX[event.element % 4], 1.5, cacheZ[event.slot]);
          else pointer.position.set(2.75 + event.element % 4 * 0.61, 1.22, -1.56 + event.block * 1.03);
          currentLabel.setText(phase >= 0.92 ? `A[${event.element}] 已送达` : event.hit ? '命中 · 直接取用' : '未命中 · 整块搬入');
          currentLabel.position.set(2.0, 3.7, 0);
        }
        const structureTitles = ['处理核心：发出读取请求', '缓存：保存一部分数据副本', '内存：保存本实验全部数据'];
        let status = structureFocus >= 0 ? structureTitles[structureFocus] : '缓存准备好了，数据还在内存里';
        let detail = '浅色空槽表示未装入数据。每行可以保存同一块的 4 个连续元素。';
        if (event) {
          if (phase < 0.18) { status = `准备读取 A[${event.element}]`; detail = `处理核心先查询缓存。当前为第 ${event.index + 1} 次读取。`; }
          else if (phase < 0.64) {
            status = event.hit ? `命中：A[${event.element}] 已在缓存` : `未命中：取回 ${rangeName(event.block)}`;
            detail = event.hit ? '所需元素已随之前的整块数据驻留，可以直接使用，无需再从内存搬入。' : event.evictedBlock !== null ? `缓存已满，先替换最久未使用的 ${rangeName(event.evictedBlock)}，再放入新块。` : '包含目标元素的整块数据从内存复制到缓存，内存源数据保持不变。';
          } else { status = phase >= 0.92 ? `读取完成：A[${event.element}] 已送达核心` : `缓存把 A[${event.element}] 交给处理核心`; detail = event.hit ? '本次读取命中，只使用芯片内的数据近路。' : '新块已经保存在缓存中，同一块的邻近元素也可以在后续读取时使用。'; }
        }
        const lru = s.cache.filter(l => l.block !== null).sort((a, b) => b.usedAt - a.usedAt).map(l => rangeName(l.block!)).join(' → ');
        return {
          status, detail, tone: event && phase >= 0.18 ? event.hit ? 'hit' : 'miss' : 'neutral',
          metrics: [{ label: '命中', value: s.hits, unit: '次' }, { label: '未命中 / 内存搬运', value: s.misses, unit: '次' }, { label: '已完成读取', value: s.complete, unit: `/ ${events.length}` }],
          sequence: events.map((e, i) => ({ label: String(e.element), state: i < s.complete ? e.hit ? 'hit' : 'miss' : i === (event?.index ?? -1) ? 'active' : 'waiting' })),
          rows: [{ label: '缓存组织', value: `全相联 · LRU · ${capacity} 行 × 16 字节` }, { label: '各行内容', value: Array.from({ length: capacity }, (_, i) => s.cache[i]?.block == null ? '空' : rangeName(s.cache[i].block!)).join(' / ') }, { label: '最近使用 → 最久未用', value: lru || '空缓存' }, ...(stepId === 'compare' ? [{ label: '本轮访问顺序', value: pattern === 'sequential' ? '连续访问 · 同块相邻读取' : '交错访问 · 四个块轮流读取' }, { label: '序列标记', value: '绿：命中 · 黄：未命中 · 描边：当前' }] : [])]
        };
      },
      dispose() {}
    };
  }
};
