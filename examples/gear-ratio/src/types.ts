import type * as THREE from 'three';

export type Params = Record<string, number | string>;
export type Point = [number, number, number];
export type Tone = 'neutral' | 'hit' | 'miss';
export interface Parameter {
  key: string; label: string; value: number | string;
  kind: 'select' | 'range'; min?: number; max?: number; step?: number;
  options?: { value: number | string; label: string }[];
}
export interface Question { prompt: string; choices: { label: string; feedback: string; correct: boolean }[] }
export interface LessonStep {
  id: string; title: string; heading: string; body: string[]; duration: number;
  takeaway: string; camera?: { position: Point; target: Point };
  question?: Question | ((params: Params) => Question);
}
export interface Snapshot {
  status: string; detail: string; tone?: Tone;
  metrics: { label: string; value: string | number; unit?: string }[];
  rows?: { label: string; value: string; tone?: Tone }[];
  sequence?: { label: string; state: 'waiting' | 'active' | 'hit' | 'miss' }[];
}
export interface Label {
  element: HTMLDivElement; position: THREE.Vector3;
  setText(text: string): void; setVisible(visible: boolean): void;
}
export interface SceneContext {
  scene: THREE.Scene; world: THREE.Group; camera: THREE.PerspectiveCamera;
  label(text: string, position: Point, className?: string): Label;
}
export interface LessonScene {
  updateAt(input: { stepId: string; time: number; params: Params; revealed?: boolean }): Snapshot;
  dispose(): void;
}
export interface LessonModule {
  slug: string; title: string; subtitle: string; concept: string; modelNote: string;
  sources: { title: string; url: string }[];
  sceneCaption?: string; timeNote?: string;
  steps: LessonStep[]; parameters: Parameter[];
  createScene(context: SceneContext): LessonScene;
}
