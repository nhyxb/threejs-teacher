import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { simulate, sample, SEQUENTIAL, INTERLEAVED, REPLACEMENT, EVENT_SECONDS } from './model.ts';

test('冷缓存按整块填充，重复与邻近元素均命中', () => {
  const events = simulate([0, 0, 1, 3, 4], 2);
  assert.deepEqual(events.map(e => e.hit), [false, true, true, true, false]);
  assert.deepEqual(events.map(e => e.block), [0, 0, 0, 0, 1]);
  assert.equal(events[4].misses, 2);
});
test('命中刷新 LRU，淘汰最久未访问的块，历史快照不被后续访问修改', () => {
  const events = simulate(REPLACEMENT, 2);
  assert.deepEqual(events.map(e => e.hit), [false, false, true, false, false]);
  assert.equal(events[3].evictedBlock, 1); assert.equal(events[4].evictedBlock, 0);
  assert.deepEqual(events[0].after.map(l => l.block), [0, null]);
  assert.deepEqual(events[0].before.map(l => l.block), [null, null]);
});
test('相同数据不同顺序的对比结论正确', () => {
  const summary = (trace: number[], size: number) => { const e = simulate(trace, size).at(-1)!; return [e.hits, e.misses]; };
  assert.deepEqual([...SEQUENTIAL].sort((a, b) => a - b), [...INTERLEAVED].sort((a, b) => a - b));
  assert.deepEqual(summary(SEQUENTIAL, 2), [12, 4]); assert.deepEqual(summary(INTERLEAVED, 2), [0, 16]);
  assert.deepEqual(summary(SEQUENTIAL, 4), [12, 4]); assert.deepEqual(summary(INTERLEAVED, 4), [12, 4]);
});
test('暂停/回退重采样一致，统计仅计入完成的读取', () => {
  const events = simulate([0, 1], 2), before = sample(events, 1.5);
  sample(events, 5.6); assert.deepEqual(sample(events, 1.5), before);
  assert.equal(sample(events, 0).complete, 0);
  assert.deepEqual([sample(events, EVENT_SECONDS * 2).hits, sample(events, EVENT_SECONDS * 2).misses], [1, 1]);
  assert.equal(sample(events, 0).cache[0].block, null);
});
test('新参数从空缓存开始，并拒绝不合法输入', () => {
  simulate(SEQUENTIAL, 4); assert.equal(simulate([0], 2)[0].hit, false);
  assert.throws(() => simulate([16], 2), RangeError); assert.throws(() => simulate([0], 0), RangeError);
  assert.throws(() => sample([], Number.NaN), RangeError);
});
