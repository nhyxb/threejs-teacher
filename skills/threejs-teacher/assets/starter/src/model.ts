export function requiredEffort(loadForce: number, loadArm: number, effortArm: number) {
  if (![loadForce, loadArm, effortArm].every(Number.isFinite) || loadForce < 0 || loadArm <= 0 || effortArm <= 0) throw new RangeError('力须非负，力臂须大于零');
  return loadForce * loadArm / effortArm;
}
