import test from 'node:test';
import assert from 'node:assert/strict';
import { replayAttackingSide, replaySetPiece, replayNextIndex } from './matchReplay.js';

test('a shot and the opposing keeper save stay at the same attacking goal', () => {
  for (const side of [0, 1]) {
    const shot = { type: 'miss', side };
    const save = { type: 'save', side: 1 - side };
    assert.equal(replayAttackingSide(shot), side);
    assert.equal(replayAttackingSide(save), side);
  }
  assert.equal(replayAttackingSide({ type: 'period', side: null }), null);
});

test('PK and free-kick results do not reposition the kicker at the goal as a new set piece', () => {
  for (const type of ['goal', 'miss']) {
    for (const label of ['PK 성공', 'PK 실패', '프리킥 골', '프리킥 실패']) {
      assert.equal(replaySetPiece({ type, label }), null);
    }
  }
  for (const type of ['corner', 'penalty', 'free-kick']) {
    assert.equal(replaySetPiece({ type }), type);
  }
});

test('replay reaches the final event without advancing past it', () => {
  assert.equal(replayNextIndex(2, 4), 3);
  assert.equal(replayNextIndex(3, 4), 3);
  assert.equal(replayNextIndex(0, 1), 0);
});
