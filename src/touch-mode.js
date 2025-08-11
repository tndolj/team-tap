import { getLocalXY, createFinger } from './utils.js';

export function onTouchStart(app, ev) {
  ev.preventDefault();
  for (const t of ev.changedTouches) {
    if (app.touches.size >= app.maxPlayers) continue;
    if (app.touches.has(t.identifier)) continue;
    const { x, y } = getLocalXY(app.arena, t.clientX, t.clientY);
    const label = app.touches.size + 1;
    const rec = createFinger(app.arena, x, y, label);
    app.touches.set(t.identifier, { ...rec, idx: label - 1, role: null });
  }
  app.updateCountUI();
  if (app.touches.size === app.maxPlayers && !app.splitDone) {
    app.assignTeamsFrom(Array.from(app.touches.values()));
  }
}

export function onTouchMove(app, ev) {
  ev.preventDefault();
  for (const t of ev.changedTouches) {
    const rec = app.touches.get(t.identifier);
    if (!rec) continue;
    const { x, y } = getLocalXY(app.arena, t.clientX, t.clientY);
    rec.el.style.left = x + 'px';
    rec.el.style.top = y + 'px';
  }
}

export function onTouchEnd(app, ev) {
  ev.preventDefault();
  // Intentionally keep finger markers after touch release.
}
