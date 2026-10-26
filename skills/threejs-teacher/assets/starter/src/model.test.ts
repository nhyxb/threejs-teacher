import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { requiredEffort } from './model.ts';

test('力矩平衡与力臂比例', () => {
  assert.equal(requiredEffort(20, 1, 2), 10);
  assert.equal(requiredEffort(20, 1, 4), 5);
  assert.equal(requiredEffort(0, 1, 2), 0);
  assert.throws(() => requiredEffort(20, 1, 0), RangeError);
});
