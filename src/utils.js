export function getLocalXY(arena, clientX, clientY) {
  const rect = arena.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function showToast(toastEl, msg, ms = 1500) {
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toastEl.style.display = 'none'), ms);
}

export function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export function createFinger(arena, x, y, label) {
  const el = document.createElement('div');
  el.className = 'finger';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.textContent = label;
  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.style.display = 'none';
  el.appendChild(badge);
  arena.appendChild(el);
  return { el, badge, label };
}

export function setBadge(rec, role) {
  if (!rec?.badge) return;
  if (role === 'OFF') {
    rec.badge.textContent = '⚔️';
    rec.badge.className = 'badge off';
    rec.badge.style.display = 'block';
  } else if (role === 'DEF') {
    rec.badge.textContent = '🛡️';
    rec.badge.className = 'badge def';
    rec.badge.style.display = 'block';
  } else {
    rec.badge.textContent = '';
    rec.badge.className = 'badge';
    rec.badge.style.display = 'none';
  }
}
