import test from 'node:test';
import assert from 'node:assert/strict';
import { captureMatchSquads, restoreMatchPlacement, matchPitchPoint } from './matchPlacement.js';

test('kickoff retains submitted positions by player ID even after response reorder and builder edits', () => {
  const slots = [
    { id: 0, pos: 'FW', player: { playerId: 1 }, x: 23, y: 19 },
    { id: 1, pos: 'FW', player: { playerId: 2 }, x: 81, y: 34 },
  ];
  const submitted = captureMatchSquads(slots);
  slots[0].x = 60;
  const restored = restoreMatchPlacement([
    { pos: 'FW', player: { playerId: 2 } },
    { pos: 'FW', player: { playerId: '1' } },
  ], submitted);
  assert.deepEqual(restored.map(({ x, y }) => [x, y]), [[81, 34], [23, 19]]);
  assert.deepEqual(matchPitchPoint(restored[1]), { x: 88.2, y: 89.8 });
});

test('missing coordinates use legacy layout; pitch boundaries preserve percentage placement', () => {
  assert.equal(matchPitchPoint({}), null);
  assert.equal(matchPitchPoint({ x: null, y: null }), null);
  assert.deepEqual(matchPitchPoint({ x: 0, y: 100 }), { x: 10, y: 430 });
});
