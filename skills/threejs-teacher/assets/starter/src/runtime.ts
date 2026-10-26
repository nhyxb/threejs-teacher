import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Label, LessonModule, LessonScene, Params, Snapshot } from './types';
import { disposeTree } from './scene-kit';

const escape = (text: unknown) => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const cubeMark = '<svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="m16 2 14 8v16l-14 8L2 26V10L16 2Zm0 0v16m14-8-14 8L2 10m14 8v16" stroke="currentColor" stroke-width="1.8"/></svg>';

export function mountLesson(root: HTMLElement, lesson: LessonModule) {
  document.title = `${lesson.title} · 机制实验室`;
  const params: Params = Object.fromEntries(lesson.parameters.map(p => [p.key, p.value]));
  root.innerHTML = `
    <header class="lesson-header"><h1>${escape(lesson.title)}</h1><a class="wordmark" href="./">${cubeMark}<span>机制实验室</span></a></header>
    <main class="sheet">
      <section class="stage-panel" aria-label="三维机制演示">
        <div class="stage" id="stage"><div class="label-layer" id="labels"></div><button id="camera-reset" class="quiet-button">复位视角</button><div class="stage-caption">${escape(lesson.sceneCaption ?? '拖动旋转 · 滚轮或双指缩放')}</div></div>
        <div class="transport"><button id="play" class="primary-button">播放</button><input id="timeline" type="range" min="0" max="1000" value="0" aria-label="当前步骤进度"/><span id="time-label">0:00</span><button id="restart" class="quiet-button" aria-label="重播当前步骤">重播</button><span id="play-state" class="sr-only">已暂停</span></div>
      </section>
      <section class="current-step" aria-label="当前步骤">
        <div class="step-heading"><span id="step-count"></span><h2 id="step-heading"></h2></div>
        <div class="step-navigation"><button id="previous" class="secondary-button">上一步</button><button id="next" class="secondary-button">下一步</button></div>
        <p id="takeaway"></p>
      </section>
      <details id="question-panel" class="disclosure question-panel"><summary>预测一下</summary><section id="question" class="question-section"></section></details>
      <div class="tools">
        <details class="disclosure"><summary>调节实验</summary><section class="parameter-section"><div id="parameters">${lesson.parameters.map(p => `<label class="parameter"><span>${escape(p.label)}${p.kind === 'range' ? `<output id="value-${escape(p.key)}">${escape(p.value)}</output>` : ''}</span>${p.kind === 'select' ? `<select data-param="${escape(p.key)}">${p.options!.map(o => `<option value="${escape(o.value)}" ${o.value === p.value ? 'selected' : ''}>${escape(o.label)}</option>`).join('')}</select>` : `<input type="range" data-param="${escape(p.key)}" min="${p.min}" max="${p.max}" step="${p.step ?? 1}" value="${p.value}"/>`}</label>`).join('')}</div><label class="speed-control">播放速度<select id="speed" aria-label="演示速度"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></section></details>
        <details class="disclosure"><summary>查看数据</summary><section class="readout" aria-label="实验状态"><span id="status" class="state-title"></span><p id="state-detail"></p><div id="metrics" class="metrics"></div><div id="sequence" class="sequence" aria-label="事件序列"></div><dl id="state-rows" class="state-rows"></dl></section></details>
        <details class="disclosure" id="model-notes"><summary>详细讲解与资料</summary><div class="lesson-notes"><label class="step-picker-label">跳到步骤<select id="step-picker" aria-label="跳到步骤">${lesson.steps.map((step,i)=>`<option value="${i}">${i+1}. ${escape(step.title)}</option>`).join('')}</select></label><p class="lesson-subtitle">${escape(lesson.subtitle)}</p><div id="step-body" class="step-body"></div><h3>模型说明</h3><p>${escape(lesson.modelNote)}</p><ul>${lesson.sources.map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noreferrer">${escape(source.title)}</a></li>`).join('')}</ul><p>${escape(lesson.timeNote ?? '演示时间用于观察和理解，不代表真实过程的耗时。')}</p></div></details>
      </div>
    </main>`;
  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const stage = el<HTMLDivElement>('stage');
  const labels: Label[] = [];
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xeaf0ed);
  const world = new THREE.Group(); scene.add(world);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  let renderer: THREE.WebGLRenderer | undefined;
  let controls: OrbitControls | undefined;
  let course: LessonScene | undefined;
  let stepIndex = 0, time = 0, playing = false, speed = 1, raf = 0, disposed = false, revealed = false;
  let previousStamp = performance.now(), lastSnapshot = '';
  const labelLayer = el<HTMLDivElement>('labels');
  const timeline = el<HTMLInputElement>('timeline');
  const playButton = el<HTMLButtonElement>('play');
  const listeners = new AbortController();
  const label = (text: string, position: [number, number, number], className = '') => {
    const element = document.createElement('div'); element.className = `scene-label ${className}`; element.textContent = text; labelLayer.append(element);
    const item: Label = { element, position: new THREE.Vector3(...position), setText(value) { if (element.textContent !== value) element.textContent = value; }, setVisible(visible) { element.hidden = !visible; } };
    labels.push(item); return item;
  };
  scene.add(new THREE.HemisphereLight(0xffffff, 0x92a8a0, 2.6));
  const sun = new THREE.DirectionalLight(0xffffff, 3.2); sun.position.set(-4, 12, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); sun.shadow.normalBias = 0.03; scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0xeaf0ed, roughness: 0.94 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.15; ground.receiveShadow = true; scene.add(ground);

  function resetCamera() {
    const shot = lesson.steps[stepIndex].camera;
    const damping = controls?.enableDamping;
    if (controls) { controls.enableDamping = false; controls.update(); }
    camera.position.set(...(shot?.position ?? [9, 10, 13]));
    controls?.target.set(...(shot?.target ?? [0, 0.4, 0])); controls?.update();
    camera.lookAt(controls?.target ?? new THREE.Vector3(0, 0.4, 0));
    if (controls) controls.enableDamping = damping ?? true;
  }
  function showSnapshot(snapshot: Snapshot) {
    const serialized = JSON.stringify(snapshot); if (serialized === lastSnapshot) return; lastSnapshot = serialized;
    const status = el('status'); status.textContent = snapshot.status; status.dataset.tone = snapshot.tone ?? 'neutral';
    el('state-detail').textContent = snapshot.detail;
    el('metrics').innerHTML = snapshot.metrics.map(m => `<div><span>${escape(m.label)}</span><strong>${escape(m.value)}${m.unit ? `<small>${escape(m.unit)}</small>` : ''}</strong></div>`).join('');
    el('sequence').innerHTML = (snapshot.sequence ?? []).map((s, i) => `<span data-state="${s.state}" title="第 ${i + 1} 次：${escape(s.label)}">${escape(s.label)}</span>`).join('');
    el('sequence').hidden = !snapshot.sequence?.length;
    el('state-rows').innerHTML = (snapshot.rows ?? []).map(r => `<div data-tone="${r.tone ?? 'neutral'}"><dt>${escape(r.label)}</dt><dd>${escape(r.value)}</dd></div>`).join('');
  }
  function setPlaying(value: boolean) {
    playing = value; previousStamp = performance.now();
    playButton.textContent = playing ? '暂停' : time >= lesson.steps[stepIndex].duration ? '再播放' : time > 0 ? '继续' : '播放';
    el('play-state').textContent = playing ? '演示中' : '已暂停';
  }
  function draw() {
    if (course) showSnapshot(course.updateAt({ stepId: lesson.steps[stepIndex].id, time, params, revealed }));
    timeline.value = String(Math.round(time / lesson.steps[stepIndex].duration * 1000));
    el('time-label').textContent = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
    controls?.update();
    const w = stage.clientWidth, h = stage.clientHeight;
    for (const item of labels) {
      const p = item.position.clone().project(camera);
      item.element.style.left = `${(p.x * 0.5 + 0.5) * w}px`; item.element.style.top = `${(-p.y * 0.5 + 0.5) * h}px`;
      item.element.style.visibility = Math.abs(p.x) > 1.08 || Math.abs(p.y) > 1.04 || p.z > 1 ? 'hidden' : 'visible';
    }
    renderer?.render(scene, camera);
  }
  function currentQuestion() {
    const q = lesson.steps[stepIndex].question;
    return typeof q === 'function' ? q(params) : q;
  }
  function renderQuestion() {
    const q = currentQuestion(), question = el('question'); question.hidden = !q;
    const panel = el<HTMLDetailsElement>('question-panel'); panel.hidden = !q; panel.open = !!q && stepIndex === lesson.steps.length - 1;
    question.innerHTML = q ? `<h3>先猜，再验证</h3><p>${escape(q.prompt)}</p><div class="answer-options">${q.choices.map((c, i) => `<button class="answer-button" data-answer="${i}" aria-pressed="false">${escape(c.label)}</button>`).join('')}</div><p id="answer-feedback" class="answer-feedback" role="status"></p>` : '';
  }
  function selectStep(index: number) {
    stepIndex = index; time = 0; revealed = false; lastSnapshot = ''; setPlaying(false);
    const step = lesson.steps[index];
    el('step-count').textContent = `${index + 1} / ${lesson.steps.length}`;
    el<HTMLSelectElement>('step-picker').value = String(index);
    el('step-heading').textContent = step.heading;
    el('step-body').innerHTML = step.body.map(p => `<p>${escape(p)}</p>`).join(''); el('takeaway').textContent = step.takeaway;
    el<HTMLButtonElement>('previous').disabled = index === 0; el<HTMLButtonElement>('next').disabled = index === lesson.steps.length - 1;
    renderQuestion();
    resetCamera(); draw();
  }
  function resize() {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.zoom = Math.min(1.4, Math.max(0.85, camera.aspect * 0.8)); camera.updateProjectionMatrix(); draw();
  }
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
    renderer.domElement.setAttribute('aria-label', lesson.title + '三维场景，可拖动旋转'); stage.prepend(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.1;
    controls.minDistance = 7; controls.maxDistance = 25; controls.maxPolarAngle = Math.PI * 0.47; controls.enablePan = false;
    course = lesson.createScene({ scene, world, camera, label });
  } catch (error) {
    stage.insertAdjacentHTML('afterbegin', '<div class="webgl-error"><h2>三维画面暂时无法启动</h2><p>请使用支持 WebGL 2 的浏览器并开启硬件加速。下方的详细讲解与资料仍可阅读。</p></div>');
    console.error('无法启动三维课件：', error); playButton.disabled = true;
  }
  const observer = new ResizeObserver(resize); observer.observe(stage);
  root.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!target) return;
    if (target.id === 'play') { if (time >= lesson.steps[stepIndex].duration) time = 0; setPlaying(!playing); }
    if (target.id === 'restart') { time = 0; revealed = false; renderQuestion(); setPlaying(false); lastSnapshot = ''; draw(); }
    if (target.id === 'camera-reset') { resetCamera(); draw(); }
    if (target.id === 'previous' && stepIndex > 0) selectStep(stepIndex - 1);
    if (target.id === 'next' && stepIndex < lesson.steps.length - 1) selectStep(stepIndex + 1);
    if (target.dataset.answer !== undefined) {
      const choice = currentQuestion()!.choices[Number(target.dataset.answer)];
      root.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-pressed', b === target ? 'true' : 'false'));
      const feedback = el('answer-feedback'); feedback.textContent = choice.feedback; feedback.dataset.correct = String(choice.correct); revealed = true; draw();
    }
  }, { signal: listeners.signal });
  root.addEventListener('input', event => {
    const target = event.target as HTMLInputElement;
    if (target.id === 'step-picker') { selectStep(Number(target.value)); return; }
    if (target.id === 'timeline') { time = Number(target.value) / 1000 * lesson.steps[stepIndex].duration; setPlaying(false); draw(); }
    if (target.dataset.param) {
      const definition = lesson.parameters.find(p => p.key === target.dataset.param)!;
      params[definition.key] = typeof definition.value === 'number' ? Number(target.value) : target.value;
      const output = root.querySelector(`output[id="value-${definition.key}"]`); if (output) output.textContent = target.value;
      time = 0; revealed = false; lastSnapshot = ''; renderQuestion(); setPlaying(false); draw();
    }
  }, { signal: listeners.signal });
  el<HTMLSelectElement>('speed').addEventListener('change', event => { speed = Number((event.target as HTMLSelectElement).value); }, { signal: listeners.signal });
  document.addEventListener('visibilitychange', () => { previousStamp = performance.now(); if (document.hidden) setPlaying(false); }, { signal: listeners.signal });
  const frame = (stamp: number) => {
    if (disposed) return;
    const delta = Math.min((stamp - previousStamp) / 1000, 0.1); previousStamp = stamp;
    if (!document.hidden) {
      if (playing) { time = Math.min(time + delta * speed, lesson.steps[stepIndex].duration); if (time >= lesson.steps[stepIndex].duration) setPlaying(false); }
      draw();
    }
    raf = requestAnimationFrame(frame);
  };
  selectStep(0); resize(); raf = requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => {
    disposed = true; cancelAnimationFrame(raf); observer.disconnect(); listeners.abort(); course?.dispose(); controls?.dispose(); disposeTree(scene); renderer?.dispose(); labels.forEach(l => l.element.remove());
  }, { once: true });
}
