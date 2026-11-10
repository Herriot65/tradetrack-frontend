import test from 'node:test';
import assert from 'node:assert/strict';
import { mapConcurrent } from '../src/lib/mapConcurrent.js';

test('history pagination bounds concurrent requests and preserves page order', async () => {
  let active = 0, peak = 0;
  const results = await mapConcurrent([1, 2, 3, 4, 5, 6], 2, async page => {
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, page % 2 ? 8 : 1));
    active--;
    return page;
  });
  assert.equal(peak, 2);
  assert.deepEqual(results, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(await mapConcurrent([], 4, () => assert.fail()), []);
});

test('failed history pages reject the entire read and stop queuing pages', async () => {
  const calls = [];
  await assert.rejects(mapConcurrent([1, 2, 3], 1, async page => {
    calls.push(page);
    throw new Error('offline');
  }), /offline/);
  assert.deepEqual(calls, [1]);
});
