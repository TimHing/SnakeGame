import { ROPE_HALF_LENGTH } from '../constants.js';

const trackEl = document.getElementById('rope-track');
const knotEl = document.getElementById('rope-knot');

/** 依繩子位置（-ROPE_HALF_LENGTH ~ +ROPE_HALF_LENGTH）更新繩結的水平位置 */
export function renderRope(position) {
  const ratio = position / ROPE_HALF_LENGTH; // -1 ~ 1
  const percent = 50 + ratio * 50; // 0% ~ 100%
  knotEl.style.left = `${percent}%`;
}

/** 畫出端點之間的刻度，賽前呼叫一次即可 */
export function renderRopeTicks() {
  trackEl.querySelectorAll('.rope-tick').forEach((t) => t.remove());
  const total = ROPE_HALF_LENGTH * 2;
  for (let i = 0; i <= total; i += 1) {
    const tick = document.createElement('div');
    tick.className = 'rope-tick';
    tick.style.left = `${(i / total) * 100}%`;
    trackEl.appendChild(tick);
  }
}
