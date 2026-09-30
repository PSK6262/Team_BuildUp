// Keep the submitted formation independent of later edits to the builder.
export function captureMatchSquads(slots) {
  return slots.map((slot) => ({
    positionNo: slot.id + 1, position: slot.pos,
    playerId: slot.player.playerId, x: slot.x, y: slot.y,
  }));
}

export function restoreMatchPlacement(home, squads) {
  const byPlayer = new Map(squads.map((slot) => [String(slot.playerId), slot]));
  return home.map((slot) => {
    const submitted = byPlayer.get(String(slot.player.playerId));
    return submitted ? { ...slot, x: submitted.x, y: submitted.y } : slot;
  });
}

export function matchPitchPoint(slot) {
  if (!Number.isFinite(slot.x) || !Number.isFinite(slot.y)) return null;
  return { x: 10 + slot.x * 3.4, y: 10 + slot.y * 4.2 };
}
