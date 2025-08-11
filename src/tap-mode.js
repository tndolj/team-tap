import { getLocalXY, createFinger, showToast } from './utils.js';

export function onArenaClick(app, e) {
  if (app.mode !== 'tap') return;
  if (app.touches.size >= app.maxPlayers) {
    showToast(app.toast, `Already ${app.maxPlayers} tokens. Tap a token to remove.`);
    return;
  }
  const { x, y } = getLocalXY(app.arena, e.clientX, e.clientY);
  const rec = createFinger(app.arena, x, y, app.nextLabel++);
  const id = 'tap-' + Math.random().toString(36).slice(2);
  app.touches.set(id, { ...rec, role: null });
  rec.el.addEventListener('click', ev => {
    if (app.mode !== 'tap') return;
    ev.stopPropagation();
    rec.el.remove();
    app.touches.delete(id);
    app.resetSplitVisuals();
    app.updateCountUI();
  });
  app.updateCountUI();
}
