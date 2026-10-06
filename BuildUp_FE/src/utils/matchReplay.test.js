import test from 'node:test';
import assert from 'node:assert/strict';
import { replayAttackingSide, replaySetPiece, replayNextIndex, replayKicker, replayFreeKickWall, replayFreeKickPosition, replayCornerPosition, replaySavingKeeper, replayPlayerPoint } from './matchReplay.js';

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

test('corner kick identifies the actual corner kicker from the timeline description instead of the default first forward', () => {
  for (const side of [0, 1]) {
    const lineup = [
      { pos: 'FW', player: { playerId: side * 10 + 1, nameKor: '엘링 홀란', name: 'Erling Haaland' } },
      { pos: 'MF', player: { playerId: side * 10 + 2, nameKor: '케빈 더 브라위너', name: 'Kevin De Bruyne' } },
      { pos: 'DF', player: { playerId: side * 10 + 3, nameKor: '트렌트 알렉산더-아놀드', name: 'Trent Alexander-Arnold' } },
    ];
    // Full name match in standard description
    assert.equal(replayKicker(lineup, { type: 'corner', side, description: '케빈 더 브라위너의 코너킥 크로스를 상대 수비가 걷어냅니다.' }).player.playerId, side * 10 + 2);
    // Partial name match in standard description
    assert.equal(replayKicker(lineup, { type: 'corner', side, description: '더 브라위너의 코너킥 크로스가 날카롭게 올라왔습니다.' }).player.playerId, side * 10 + 2);
    // Defender corner kicker
    assert.equal(replayKicker(lineup, { type: 'corner', side, description: '알렉산더-아놀드의 코너킥 크로스를 수비가 차단합니다.' }).player.playerId, side * 10 + 3);
  }
});

test('free-kick support players are positioned tactically for attack and defense', () => {
  const localBall = { x: 180, y: 95 };

  // 1. 공격팀 FW: 페널티 박스 안 골문 앞 헤더 경합 지점 (y: 42~68)
  for (let i = 0; i < 3; i++) {
    const atkFw = replayFreeKickPosition({ localBall, attacking: true, pos: 'FW', supportIndex: i });
    assert.ok(atkFw.y >= 42 && atkFw.y <= 68, `Attacking FW y=${atkFw.y} should be in box header area`);
    assert.ok(atkFw.x >= 120 && atkFw.x <= 240, `Attacking FW x=${atkFw.x} should be centered`);
  }

  // 2. 공격팀 MF: 박스 바깥 아크 서클 주변 세컨드볼 대기 (y: 65~78)
  for (let i = 0; i < 4; i++) {
    const atkMf = replayFreeKickPosition({ localBall, attacking: true, pos: 'MF', supportIndex: i });
    assert.ok(atkMf.y >= 65 && atkMf.y <= 78, `Attacking MF y=${atkMf.y} should be around the arc`);
    assert.ok(atkMf.x >= 65 && atkMf.x <= 295, `Attacking MF x=${atkMf.x} should be spread across the arc`);
  }

  // 3. 공격팀 DF: 후방/하프라인 라인 형성 (y: 198~235)
  for (let i = 0; i < 4; i++) {
    const atkDf = replayFreeKickPosition({ localBall, attacking: true, pos: 'DF', supportIndex: i });
    assert.ok(atkDf.y >= 198 && atkDf.y <= 235, `Attacking DF y=${atkDf.y} should be near halfway line`);
  }

  // 4. 수비팀 DF: 골문 앞 대인 마크 맨마킹 (y: 382~398)
  for (let i = 0; i < 3; i++) {
    const defDf = replayFreeKickPosition({ localBall, attacking: false, pos: 'DF', wallIndex: -1, supportIndex: i });
    assert.ok(defDf.y >= 382 && defDf.y <= 398, `Defending DF y=${defDf.y} should be in own box marking`);
    assert.ok(defDf.x >= 120 && defDf.x <= 240, `Defending DF x=${defDf.x} should be in box`);
  }

  // 5. 수비팀 MF: 박스 정면 컷백 방어 (y: 362~374)
  for (let i = 0; i < 3; i++) {
    const defMf = replayFreeKickPosition({ localBall, attacking: false, pos: 'MF', wallIndex: -1, supportIndex: i });
    assert.ok(defMf.y >= 362 && defMf.y <= 374, `Defending MF y=${defMf.y} should be in front of box`);
  }

  // 6. 수비팀 FW: 전방 역습 대기 (y: 205~235)
  for (let i = 0; i < 3; i++) {
    const defFw = replayFreeKickPosition({ localBall, attacking: false, pos: 'FW', wallIndex: -1, supportIndex: i });
    assert.ok(defFw.y >= 205 && defFw.y <= 235, `Defending FW y=${defFw.y} should be waiting near halfway`);
  }
});

test('only the free kicker is close to the ball on free kicks', () => {
  for (const ballX of [135, 165, 195, 225]) {
    const localBall = { x: ballX, y: 95 };
    const kicker = replayFreeKickPosition({ localBall, attacking: true, isKicker: true });
    assert.equal(kicker.x, ballX);
    assert.equal(kicker.y, 137);
    const kickerDist = Math.hypot(kicker.x - localBall.x, kicker.y - localBall.y);
    assert.equal(kickerDist, 42);

    // 공격팀 서포트 선수들 (FW, MF, DF)
    for (const pos of ['FW', 'MF', 'DF']) {
      for (let i = 0; i < 4; i++) {
        const support = replayFreeKickPosition({ localBall, attacking: true, pos, supportIndex: i });
        const dist = Math.hypot(support.x - localBall.x, support.y - localBall.y);
        assert.ok(dist >= 35, `Attacking ${pos} ${i} (dist=${dist.toFixed(1)}) should not crowd the ball`);
      }
    }

    // 수비팀 비수비벽 서포트 선수들 (DF, MF, FW)
    for (const pos of ['DF', 'MF', 'FW']) {
      for (let i = 0; i < 3; i++) {
        const defSupport = replayFreeKickPosition({ localBall: { x: 360 - ballX, y: 345 }, attacking: false, pos, wallIndex: -1, supportIndex: i });
        // Flipped to pitch coordinates
        const pitchDef = { x: 360 - defSupport.x, y: 440 - defSupport.y };
        const dist = Math.hypot(pitchDef.x - ballX, pitchDef.y - 95);
        assert.ok(dist >= 35, `Defending ${pos} ${i} (dist=${dist.toFixed(1)}) should not crowd the ball`);
      }
    }
  }
});

test('corner kick defending team tightly man-marks attacking players in the penalty box', () => {
  // Test both left and right corners, and both halves
  for (const cornerX of [24, 336]) {
    for (const secondHalf of [false, true]) {
      // Home team (side 0) attacking, Away team (side 1) defending
      const localBallAtk = { x: cornerX, y: 24 };
      const localBallDef = { x: 360 - cornerX, y: 440 - 24 };

      for (let idx = 0; idx < 7; idx++) {
        const atkLocal = replayCornerPosition({ localBall: localBallAtk, attacking: true, isKicker: false, pos: 'FW', outfieldIndex: idx });
        const defLocal = replayCornerPosition({ localBall: localBallDef, attacking: false, isKicker: false, pos: 'DF', outfieldIndex: idx });

        const atkPitch = replayPlayerPoint(atkLocal, 0, secondHalf);
        const defPitch = replayPlayerPoint(defLocal, 1, secondHalf);

        const dist = Math.hypot(atkPitch.x - defPitch.x, atkPitch.y - defPitch.y);
        assert.ok(dist <= 12, `Box runner ${idx} should be man-marked within 12px (actual=${dist.toFixed(1)}px)`);
      }

      // Away team (side 1) attacking, Home team (side 0) defending
      for (let idx = 0; idx < 7; idx++) {
        const atkLocal = replayCornerPosition({ localBall: localBallAtk, attacking: true, isKicker: false, pos: 'FW', outfieldIndex: idx });
        const defLocal = replayCornerPosition({ localBall: localBallDef, attacking: false, isKicker: false, pos: 'DF', outfieldIndex: idx });

        const atkPitch = replayPlayerPoint(atkLocal, 1, secondHalf);
        const defPitch = replayPlayerPoint(defLocal, 0, secondHalf);

        const dist = Math.hypot(atkPitch.x - defPitch.x, atkPitch.y - defPitch.y);
        assert.ok(dist <= 12, `Box runner ${idx} should be man-marked within 12px (actual=${dist.toFixed(1)}px)`);
      }
    }
  }
});
