import * as THREE from 'three';
import type { Point } from './types';

export const colors = { ink: 0x263d3c, base: 0xdfe9e5, pale: 0xf4f7f5, teal: 0x247f87, blue: 0x3f83bf, orange: 0xd48c27, green: 0x388968 };

export function material(color: number, roughness = 0.65) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}
export function box(parent: THREE.Object3D, size: Point, at: Point, color = colors.pale, edge = true) {
  const geometry = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true;
  if (edge) {
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: colors.ink, transparent: true, opacity: 0.23 }));
    mesh.add(lines);
  }
  parent.add(mesh); return mesh;
}
export function cylinder(parent: THREE.Object3D, radius: number, height: number, at: Point, color: number) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), material(color));
  mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function path(parent: THREE.Object3D, points: Point[], color: number, radius = 0.025) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 6, false), material(color));
  parent.add(mesh); return { mesh, curve };
}
export function smooth(t: number) { const x = THREE.MathUtils.clamp(t, 0, 1); return x * x * (3 - 2 * x); }
export function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
  root.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m);
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
