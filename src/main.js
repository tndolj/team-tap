import { onTouchStart, onTouchMove, onTouchEnd } from './touch-mode.js';
import { showToast, shuffle, setBadge, createFinger } from './utils.js';

// Apply saved colors before the app initializes
const savedOFF = localStorage.getItem('colorOFF');
const savedDEF = localStorage.getItem('colorDEF');
if (savedOFF) document.documentElement.style.setProperty('--OFF', savedOFF);
if (savedDEF) document.documentElement.style.setProperty('--DEF', savedDEF);

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
    this.toast = document.getElementById('toast');
    this.selPlayers = document.getElementById('selPlayers');
    this.instructionsEl = document.getElementById('instructions');
    this.maxCountEl = document.getElementById('maxCount');

    this.touches = new Map();
    this.splitDone = false;
    this.nextLabel = 1;
    this.maxPlayers = parseInt(this.selPlayers.value, 10);
  }

  updateInstructions() {
    this.instructionsEl.innerHTML = `Have <b>${this.maxPlayers} players</b> place their fingers on the screen — the system will auto-assign <b style="color:var(--OFF)">Offense</b> / <b style="color:var(--DEF)">Defense</b>`;
    this.hint.innerHTML = `Place ${this.maxPlayers} fingers at the same time.`;
    this.maxCountEl.textContent = this.maxPlayers;
    this.btnSim.textContent = `Simulate ${this.maxPlayers} (Test)`;
  }

  updateCountUI() {
    const n = this.touches.size;
    this.countEl.textContent = n;
    this.maxCountEl.textContent = this.maxPlayers;
    this.hint.style.display = n === 0 ? 'block' : 'none';
    if (n < this.maxPlayers) {
      this.statusEl.textContent = `Waiting for ${this.maxPlayers} fingers…`;
      this.banner.style.display = 'none';
    } else if (n === this.maxPlayers) {
      this.statusEl.textContent = this.splitDone ? 'Teams assigned…' : `${this.maxPlayers} fingers — assigning teams…`;
    } else {
      this.statusEl.textContent = `More than ${this.maxPlayers} fingers, keep only ${this.maxPlayers}`;
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
        this.assignTeamsFrom(Array.from(this.touches.values()));
      });
    }

    this.btnClear.addEventListener('click', () => {
      this.touches.forEach(t => t.el.remove());
      this.touches.clear();
      this.nextLabel = 1;
      this.resetSplitVisuals();
      this.updateCountUI();
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

const btnSettings = document.getElementById('btnSettings');
const modal = document.getElementById('settingsModal');
const offInput = document.getElementById('offColor');
const defInput = document.getElementById('defColor');
const btnSave = document.getElementById('btnSaveSettings');
const btnCancel = document.getElementById('btnCancelSettings');

btnSettings.addEventListener('click', () => {
  offInput.value = app.OFF_COL;
  defInput.value = app.DEF_COL;
  modal.style.display = 'flex';
});

btnCancel.addEventListener('click', () => {
  modal.style.display = 'none';
});

btnSave.addEventListener('click', () => {
  const off = offInput.value;
  const def = defInput.value;
  document.documentElement.style.setProperty('--OFF', off);
  document.documentElement.style.setProperty('--DEF', def);
  app.OFF_COL = off;
  app.DEF_COL = def;
  app.touches.forEach(t => {
    if (t.role === 'OFF') {
      t.el.style.background = off;
    } else if (t.role === 'DEF') {
      t.el.style.background = def;
    }
    setBadge(t, t.role);
  });
  localStorage.setItem('colorOFF', off);
  localStorage.setItem('colorDEF', def);
  modal.style.display = 'none';
});
