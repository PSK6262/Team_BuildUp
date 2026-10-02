import test from 'node:test';
import assert from 'node:assert/strict';
import { replayAttackingSide, replaySetPiece, replayNextIndex, replayKicker, replayFreeKickWall, replayFreeKickPosition, replaySavingKeeper, replayPlayerPoint } from './matchReplay.js';

test('saves attach possession to the defending keeper in both halves, including custom placement', () => {
  const home = [{ pos: 'GK', player: { playerId: 10 }, x: 25, y: 90 }];
  const away = [{ pos: 'GK', player: { playerId: 20 } }];
  for (const side of [0, 1]) {
    const keeper = replaySavingKeeper({ type: 'save', side, playerId: side ? 20 : 10 }, home, away);
    assert.equal(keeper.playerId, side ? 20 : 10);
    assert.equal(keeper.side, side);
    assert.deepEqual({ x: keeper.x, y: keeper.y }, side ? { x: 180, y: 392 } : { x: 140, y: 388 });
    for (const secondHalf of [false, true]) {
      const point = replayPlayerPoint(keeper, side, secondHalf);
      assert.equal(point.y > 220, (side === 0) !== secondHalf);
      const reverse = replayPlayerPoint(point, side, secondHalf);
      assert.deepEqual(reverse, { x: keeper.x, y: keeper.y });
    }
  }
});

test('older saves find the active keeper; emergency keeper IDs override nominal positions', () => {
  const lineup = [{ pos: 'DF', player: { playerId: 1 } }, { pos: 'GK', player: { playerId: 2 } }];
  assert.equal(replaySavingKeeper({ type: 'save', side: 0 }, lineup, []).playerId, 2);
  assert.equal(replaySavingKeeper({ type: 'save', side: 0, playerId: 1 }, lineup, []).playerId, 1);
  assert.equal(replaySavingKeeper({ type: 'save', side: 0 }, lineup.slice(0, 1), []).playerId, 1);
  assert.equal(replaySavingKeeper({ type: 'goal', side: 0 }, lineup, []), null);
});

test('a keeper dragged into the opposing half returns to their own goal when saving', () => {
  const home = [{ pos: 'GK', player: { playerId: 10 }, x: 95, y: 5 }];
  const keeper = replaySavingKeeper({ type: 'save', side: 0, playerId: 10 }, home, []);
  assert.deepEqual(replayPlayerPoint(keeper, 0, false), { x: 220, y: 380 });
  assert.deepEqual(replayPlayerPoint(keeper, 0, true), { x: 140, y: 60 });
});

test('free kick uses the actual shooter and selects an outfield defensive wall', () => {
  const lineup = [
    { pos: 'GK', player: { playerId: 1, name: 'Keeper' } },
    { pos: 'FW', player: { playerId: 2, name: 'Forward' } },
    { pos: 'MF', player: { playerId: 3, name: 'Midfielder' } },
    { pos: 'DF', player: { playerId: 4, name: 'Defender' } },
  ];
  assert.equal(replayKicker(lineup, { playerId: 3 }).player.playerId, 3);
  assert.equal(replayKicker(lineup, { description: '좋은 위치에서 얻은 프리킥을 Midfielder이 직접 노립니다.' }).player.playerId, 3);
  assert.deepEqual(replayFreeKickWall(lineup).map(slot => slot.player.playerId), [4, 3, 2]);
});

test('PK identifies the actual taker instead of the first forward for either team', () => {
  for (const side of [0, 1]) {
    const lineup = [
      { pos: 'FW', player: { playerId: side * 10 + 1, nameKor: '첫 공격수' } },
      { pos: 'MF', player: { playerId: side * 10 + 2, nameKor: '실제 키커' } },
    ];
    const playerId = lineup[1].player.playerId;
    assert.equal(replayKicker(lineup, { type: 'penalty', side, playerId }).player.playerId, playerId);
    assert.equal(replayKicker(lineup, { type: 'penalty', side, description: '실제 키커의 돌파 중 페널티킥이 선언됩니다.' }).player.playerId, playerId);
    assert.equal(replayKicker(lineup, { type: 'goal', label: 'PK 성공', side, playerId }).player.playerId, playerId);
  }
});

test('free-kick kicker is behind the ball, wall is toward goal, for both teams and halves', () => {
  for (const ballX of [135, 165, 195, 225]) {
    const kicker = replayFreeKickPosition({ localBall: { x: ballX, y: 95 }, attacking: true, isKicker: true });
    const wall = Array.from({ length: 4 }, (_, wallIndex) => {
      const local = replayFreeKickPosition({ localBall: { x: 360 - ballX, y: 345 }, attacking: false,
        pos: 'DF', wallIndex, wallCount: 4 });
      return { x: 360 - local.x, y: 440 - local.y };
    });
    assert.equal(kicker.x, ballX);
    assert.equal(kicker.y, 137);
    for (const defender of wall) {
      assert.equal(defender.y, 53);
      assert.ok(defender.x > 10 && defender.x < 350);
      for (const flip of [false, true]) {
        const project = point => flip ? { x: 360 - point.x, y: 440 - point.y } : point;
        assert.ok(Math.hypot(project(kicker).x - project(defender).x, project(kicker).y - project(defender).y) >= 84);
      }
    }
  }
});

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
