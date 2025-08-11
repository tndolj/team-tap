import { onTouchStart, onTouchMove, onTouchEnd } from './touch-mode.js';
import { onArenaClick } from './tap-mode.js';
import { showToast, shuffle, setBadge, createFinger } from './utils.js';

export class TeamTap {
  constructor() {
    this.OFF_COL = getComputedStyle(document.documentElement).getPropertyValue('--OFF').trim() || '#f5b301';
    this.DEF_COL = getComputedStyle(document.documentElement).getPropertyValue('--DEF').trim() || '#19c37d';

    this.arena = document.getElementById('arena');
    this.hint = document.getElementById('hint');
    this.banner = document.getElementById('banner');
    this.countOffEl = document.getElementById('countOff');
    this.countDefEl = document.getElementById('countDef');
    this.countEl = document.getElementById('count');
    this.statusEl = document.getElementById('status');
    this.btnClear = document.getElementById('btnClear');
    this.btnSim = document.getElementById('btnSim');
    this.devControls = document.getElementById('devControls');
    this.btnMode = document.getElementById('btnMode');
    this.btnAssign = document.getElementById('btnAssign');
    this.toast = document.getElementById('toast');
    this.selPlayers = document.getElementById('selPlayers');
    this.instructionsEl = document.getElementById('instructions');
    this.maxCountEl = document.getElementById('maxCount');

    this.mode = 'touch';
    this.touches = new Map();
    this.splitDone = false;
    this.nextLabel = 1;
    this.maxPlayers = parseInt(this.selPlayers.value, 10);
  }

  updateInstructions() {
    this.instructionsEl.innerHTML = `Have <b>${this.maxPlayers} players</b> place their fingers on the screen — the system will auto-assign <b style="color:var(--OFF)">Offense</b> / <b style="color:var(--DEF)">Defense</b>`;
    this.hint.innerHTML = `<b>Touch Mode:</b> Place ${this.maxPlayers} fingers at the same time.<br/><b>Tap Tokens:</b> Tap ${this.maxPlayers} times to place tokens; tap a token to remove.`;
    this.maxCountEl.textContent = this.maxPlayers;
    this.btnSim.textContent = `Simulate ${this.maxPlayers} (Test)`;
  }

  updateCountUI() {
    const n = this.touches.size;
    this.countEl.textContent = n;
    this.maxCountEl.textContent = this.maxPlayers;
    this.hint.style.display = n === 0 ? 'block' : 'none';
    if (this.mode === 'touch') {
      if (n < this.maxPlayers) {
        this.statusEl.textContent = `Mode: Touch — Waiting for ${this.maxPlayers} fingers…`;
        this.banner.style.display = 'none';
      } else if (n === this.maxPlayers) {
        this.statusEl.textContent = this.splitDone ? 'Teams assigned…' : `${this.maxPlayers} fingers — assigning teams…`;
      } else {
        this.statusEl.textContent = `Mode: Touch — More than ${this.maxPlayers} fingers, keep only ${this.maxPlayers}`;
      }
    } else {
      this.statusEl.textContent = `Mode: Tap Tokens — Tap to add/remove (${n}/${this.maxPlayers})`;
      this.btnAssign.style.display = (n === this.maxPlayers && !this.splitDone) ? 'inline-block' : 'none';
      if (n < this.maxPlayers) this.banner.style.display = 'none';
    }
  }

  resetSplitVisuals() {
    this.splitDone = false;
    this.touches.forEach(t => {
      t.role = null;
      t.el.style.background = 'var(--idle)';
      setBadge(t, null);
    });
    this.banner.style.display = 'none';
    this.countOffEl.textContent = '0';
    this.countDefEl.textContent = '0';
  }

  assignTeamsFrom(records) {
    const order = shuffle(records);
    const half = this.maxPlayers / 2;
    const OFF = order.slice(0, half);
    const DEF = order.slice(half, this.maxPlayers);
    OFF.forEach(t => {
      t.role = 'OFF';
      t.el.style.background = this.OFF_COL;
      setBadge(t, 'OFF');
    });
    DEF.forEach(t => {
      t.role = 'DEF';
      t.el.style.background = this.DEF_COL;
      setBadge(t, 'DEF');
    });
    this.countOffEl.textContent = OFF.length;
    this.countDefEl.textContent = DEF.length;
    this.banner.style.display = 'flex';
    this.splitDone = true;
    showToast(this.toast, 'Teams assigned: Offense / Defense');
    this.updateCountUI();
  }

  init() {
    const isDev = window.location.hostname === 'localhost' ||
      new URLSearchParams(window.location.search).get('dev') === '1';
    if (isDev) {
      this.devControls.style.display = 'block';
      this.btnSim.addEventListener('click', () => {
        this.btnClear.click();
        const rect = this.arena.getBoundingClientRect();
        const pad = 90;
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * (rect.width - pad * 2) + pad;
          const y = Math.random() * (rect.height - pad * 2) + pad;
          const rec = createFinger(this.arena, x, y, i + 1);
          this.touches.set('sim' + i, { ...rec, role: null });
        }
        this.updateCountUI();
        if (this.mode === 'touch') {
          this.assignTeamsFrom(Array.from(this.touches.values()));
        } else {
          this.btnAssign.style.display = 'inline-block';
        }
      });
    }

    this.btnClear.addEventListener('click', () => {
      this.touches.forEach(t => t.el.remove());
      this.touches.clear();
      this.nextLabel = 1;
      this.resetSplitVisuals();
      this.updateCountUI();
    });

    this.btnMode.addEventListener('click', () => {
      if (this.mode === 'touch') {
        this.mode = 'tap';
        this.btnMode.textContent = 'Mode: Tap Tokens';
        this.btnAssign.style.display = (this.touches.size === this.maxPlayers && !this.splitDone) ? 'inline-block' : 'none';
        this.statusEl.textContent = `Mode: Tap Tokens — Tap to add/remove (0/${this.maxPlayers})`;
        showToast(this.toast, 'Tap anywhere to add tokens. Tap a token to remove.');
      } else {
        this.mode = 'touch';
        this.btnMode.textContent = 'Mode: Touch';
        this.btnAssign.style.display = 'none';
        this.statusEl.textContent = 'Mode: Touch — Waiting…';
        showToast(this.toast, `Place up to ${this.maxPlayers} fingers at once.`);
      }
      this.touches.forEach(t => t.el.remove());
      this.touches.clear();
      this.nextLabel = 1;
      this.resetSplitVisuals();
      this.updateCountUI();
    });

    this.btnAssign.addEventListener('click', () => {
      if (this.mode !== 'tap') return;
      if (this.touches.size !== this.maxPlayers) {
        showToast(this.toast, `Need exactly ${this.maxPlayers} tokens to assign.`);
        return;
      }
      if (this.splitDone) return;
      this.assignTeamsFrom(Array.from(this.touches.values()));
    });

    this.selPlayers.addEventListener('change', () => {
      this.maxPlayers = parseInt(this.selPlayers.value, 10);
      this.updateInstructions();
      this.btnClear.click();
    });

    this.arena.addEventListener('touchstart', ev => onTouchStart(this, ev), { passive: false });
    this.arena.addEventListener('touchmove', ev => onTouchMove(this, ev), { passive: false });
    this.arena.addEventListener('touchend', ev => onTouchEnd(this, ev), { passive: false });
    this.arena.addEventListener('touchcancel', ev => onTouchEnd(this, ev), { passive: false });

    this.arena.addEventListener('click', ev => onArenaClick(this, ev));

    window.addEventListener('resize', () => {
      const rect = this.arena.getBoundingClientRect();
      this.touches.forEach(t => {
        const x = parseFloat(t.el.style.left);
        const y = parseFloat(t.el.style.top);
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
          t.el.style.left = rect.width / 2 + 'px';
          t.el.style.top = rect.height / 2 + 'px';
        }
      });
    });

    this.updateInstructions();
    this.updateCountUI();
  }
}

const app = new TeamTap();
app.init();
