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
