import * as THREE from 'three';
import type { LessonModule } from './types';
import { box, colors, cylinder } from './scene-kit';
import { requiredEffort } from './model';

export const lesson: LessonModule = {
  slug: 'lever', title: '杠杆，距离怎样换来省力', concept: '力与机械',
  subtitle: '把施力点移远一点，观察平衡所需的力怎样变化。',
  modelNote: '理想刚性杠杆，忽略杆重和摩擦；力垂直作用于杆。仅演示静态力矩平衡，不模拟加速度或人体动作。',
  sources: [{ title: 'OpenStax Physics · Simple Machines', url: 'https://openstax.org/books/physics/pages/9-3-simple-machines' }],
  parameters: [{ key: 'arm', label: '施力臂长度（米）', kind: 'range', value: 2, min: 1, max: 4, step: 0.5 }],
  steps: [
    { id: 'structure', title: '认识力臂', heading: '从支点，量到施力点', duration: 6, body: ['中间的支架是支点。力臂是支点到力的作用线的垂直距离。这里的力竖直向下，杆保持水平。', '右侧负载为 20 牛，距离支点 1 米。改变左侧施力点的位置，比较两侧的力臂。'], takeaway: '力臂越长，同样的力产生的力矩越大。' },
    { id: 'balance', title: '改变力臂', heading: '更远的距离，换来更小的力', duration: 8, body: ['平衡时，两侧相反方向的力矩相等：施力 × 施力臂 = 负载 × 负载臂。', '拖动滑杆，把左侧力臂从 1 米增加到 4 米。数值和箭头长度同步表示平衡所需的力。'], takeaway: '省力伴随着更长的移动距离，并不意味着凭空节省功。', question: { prompt: '施力臂变为原来的两倍，平衡所需的力如何变化？', choices: [{ label: '变为一半', correct: true, feedback: '对。同样的力矩，由两倍力臂乘以一半的力产生。' }, { label: '变为两倍', correct: false, feedback: '再看平衡式：负载力矩不变，力臂增大，所需的力应减小。' }] } }
  ],
  createScene(ctx) {
    box(ctx.world, [11, 0.15, 5], [0, 0, 0], colors.base);
    const support = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.35, 3), new THREE.MeshStandardMaterial({ color: colors.ink, roughness: 0.8 })); support.position.set(0, 0.8, 0); support.rotation.y = Math.PI / 6; support.castShadow = true; ctx.world.add(support);
    box(ctx.world, [8.6, 0.18, 0.5], [-1.4, 1.55, 0], colors.pale);
    const weight = box(ctx.world, [0.7, 0.7, 0.8], [1, 2, 0], colors.blue);
    const marker = cylinder(ctx.world, 0.13, 0.1, [-2, 1.72, 0], colors.orange);
    const effort = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(-2, 3.8, 0), 1.6, colors.orange, 0.25, 0.2); ctx.world.add(effort);
    const load = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 4.1, 0), 1.6, colors.blue, 0.25, 0.2); ctx.world.add(load);
    ctx.label('支点', [0, 0.6, 1.1]); ctx.label('负载 20 N', [1, 4.6, 0], 'major');
    const effortLabel = ctx.label('', [-2, 4.6, 0], 'major');
    const armLabel = ctx.label('', [-1, 1.1, 1]);
    return {
      updateAt({ params }) {
        const arm = Number(params.arm); const force = requiredEffort(20, 1, arm);
        marker.position.x = -arm; effort.position.x = -arm; effort.setLength(0.6 + force / 20, 0.25, 0.2);
        effortLabel.position.x = -arm; effortLabel.setText(`施力 ${force.toFixed(1)} N`);
        armLabel.position.x = -arm / 2; armLabel.setText(`施力臂 ${arm} m`); weight.visible = true;
        return { status: '理想杠杆处于平衡', detail: '两侧力矩相同，杆保持水平。箭头表示力的方向与相对大小。', metrics: [{ label: '平衡所需施力', value: force.toFixed(1), unit: 'N' }, { label: '施力臂', value: arm, unit: 'm' }, { label: '负载力矩', value: 20, unit: 'N·m' }], rows: [{ label: '平衡关系', value: `${force.toFixed(1)} N × ${arm} m = 20 N × 1 m` }] };
      },
      dispose() {}
    };
  }
};
