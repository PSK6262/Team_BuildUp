// Rectangles must describe the visible circles, not their surrounding cards.
// Client rectangles include responsive sizing and the drag/hover scale.
export function findOverlappingPitchSlot(sourceRect, candidates) {
  const radius = Math.min(sourceRect.width, sourceRect.height) / 2;
  if (radius <= 0) return null;

  const centerX = sourceRect.left + sourceRect.width / 2;
  const centerY = sourceRect.top + sourceRect.height / 2;
  let nearestId = null;
  let nearestDistance = Infinity;

  for (const { id, rect } of candidates) {
    const targetRadius = Math.min(rect.width, rect.height) / 2;
    if (targetRadius <= 0) continue;
    const distance = Math.hypot(
      centerX - (rect.left + rect.width / 2),
      centerY - (rect.top + rect.height / 2),
    );
    // Tangency alone has no overlapping area.
    if (distance < radius + targetRadius && distance < nearestDistance) {
      nearestId = id;
      nearestDistance = distance;
    }
  }
  return nearestId;
}
