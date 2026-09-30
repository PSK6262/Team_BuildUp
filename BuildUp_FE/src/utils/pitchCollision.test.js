import test from 'node:test';
import assert from 'node:assert/strict';
import { findOverlappingPitchSlot } from './pitchCollision.js';

const circle = (left, top, diameter = 44) => ({ left, top, width: diameter, height: diameter });

test('card edges and circle bounding-box corners do not cause a swap', () => {
  assert.equal(findOverlappingPitchSlot(circle(0, 0), [{ id: 1, rect: circle(45, 0) }]), null);
  assert.equal(findOverlappingPitchSlot(circle(0, 0), [{ id: 1, rect: circle(35, 35) }]), null);
});

test('only circles with a shared area swap; tangent circles do not', () => {
  assert.equal(findOverlappingPitchSlot(circle(0, 0), [{ id: 1, rect: circle(44, 0) }]), null);
  assert.equal(findOverlappingPitchSlot(circle(0, 0), [{ id: 1, rect: circle(43, 0) }]), 1);
});

test('selects the closest overlapping circle, ignoring hidden circles', () => {
  assert.equal(findOverlappingPitchSlot(circle(0, 0), [
    { id: 1, rect: circle(30, 0) },
    { id: 2, rect: circle(10, 0) },
    { id: 3, rect: circle(22, 22, 0) },
  ]), 2);
});

test('uses actual sizes for mobile, empty slots and enlarged dragging circles', () => {
  for (const scale of [330 / 425, 375 / 425, 1]) {
    const source = circle(0, 0, 32 * 1.15 * scale);
    assert.equal(findOverlappingPitchSlot(source, [{ id: 1, rect: circle(35 * scale, 0, 42 * scale) }]), 1);
    assert.equal(findOverlappingPitchSlot(source, [{ id: 1, rect: circle(40 * scale, 0, 42 * scale) }]), null);
  }
});
