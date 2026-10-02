import { matchPitchPoint } from './matchPlacement.js';

export function replaySavingKeeper(event, homeLineup, awayLineup) {
  if (event.type !== 'save' || ![0, 1].includes(event.side)) return null;
  const lineup = event.side === 0 ? homeLineup : awayLineup;
  const slot = lineup.find(({ player }) => String(player.playerId) === String(event.playerId))
    || lineup.find(({ pos }) => pos === 'GK') || lineup[0];
  if (!slot) return null;
  const placed = event.side === 0 ? matchPitchPoint(slot) : null;
  return { playerId: slot.player.playerId, name: slot.player.nameKor || slot.player.name, side: event.side,
    // A keeper moved upfield in the builder must return to their own goal to save.
    x: Math.max(140, Math.min(220, placed?.x ?? 180)),
    y: Math.max(380, Math.min(410, placed?.y ?? 392)) };
}

export function replayPlayerPoint(point, side, secondHalf) {
  return (side === 1) !== secondHalf ? { x: 360 - point.x, y: 440 - point.y } : { x: point.x, y: point.y };
}

// A save belongs to the defending side; other attacking events belong to the attacker.
export function replayAttackingSide(event) {
  if (event.side !== 0 && event.side !== 1) return null;
  return event.type === 'save' ? 1 - event.side : event.side;
}

export function replaySetPiece(event) {
  return ['corner', 'penalty', 'free-kick'].includes(event.type) ? event.type : null;
}

export function replayNextIndex(index, count) {
  return Math.min(index + 1, Math.max(0, count - 1));
}

export function replayKicker(lineup, event) {
  return lineup.find(({ player }) => String(player.playerId) === String(event.playerId))
    || [...lineup].sort((a, b) => (b.player.nameKor || b.player.name || '').length - (a.player.nameKor || a.player.name || '').length)
      .find(({ player }) => [player.nameKor, player.name].some(name => name && event.description?.includes(name)))
    || lineup.find(slot => slot.pos === 'FW') || lineup.find(slot => slot.pos === 'MF') || lineup[0];
}

export function replayFreeKickWall(lineup) {
  return lineup.filter(slot => slot.pos !== 'GK')
    .sort((a, b) => ['DF', 'MF', 'FW'].indexOf(a.pos) - ['DF', 'MF', 'FW'].indexOf(b.pos)).slice(0, 4);
}

// Positions are in each team's own coordinates: their goal is at the bottom.
export function replayFreeKickPosition({ localBall, attacking, isKicker, pos, wallIndex, wallCount, supportIndex }) {
  if (isKicker) return { x: localBall.x, y: localBall.y + 42 };
  if (pos === 'GK') return { x: 180, y: attacking ? 392 : 420 };
  if (!attacking && wallIndex >= 0) {
    return { x: localBall.x + (180 - localBall.x) * 0.45 + (wallIndex - (wallCount - 1) / 2) * 30,
      y: localBall.y + 42 };
  }
  return { x: 60 + (supportIndex % 4) * 80, y: 205 + Math.floor(supportIndex / 4) * 55 };
}
