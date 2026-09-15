import { ROPE_HALF_LENGTH } from '../constants.js';

const trackEl = document.getElementById('rope-track');
const knotEl = document.getElementById('rope-knot');
const leftAvatarEl = document.getElementById('rope-avatar-left');
const rightAvatarEl = document.getElementById('rope-avatar-right');

/** 選手選擇畫面挑的寶可夢頭像，直接當拉繩子的角色；沒選頭像就退回顯示名字的第一個字 */
function renderAvatarEl(el, avatar, name) {
  el.innerHTML = '';
  if (avatar) {
    const img = document.createElement('img');
    img.src = avatar.src;
    img.alt = avatar.name;
    el.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.textContent = (name || '?').slice(0, 1);
    el.appendChild(span);
  }
}

export function setAvatars(player1, player2) {
  renderAvatarEl(leftAvatarEl, player1.avatar, player1.name);
  renderAvatarEl(rightAvatarEl, player2.avatar, player2.name);
}

/** 賽前呼叫一次，把刻度畫出來、繩結歸零到正中央 */
export function resetRope() {
  trackEl.querySelectorAll('.rope-tick').forEach((t) => t.remove());
  const total = ROPE_HALF_LENGTH * 2;
  for (let i = 0; i <= total; i += 1) {
    const tick = document.createElement('div');
    tick.className = 'rope-tick';
    tick.style.left = `${(i / total) * 100}%`;
    trackEl.appendChild(tick);
  }
  knotEl.style.left = '50%';
  leftAvatarEl.classList.remove('rope-pulse');
  rightAvatarEl.classList.remove('rope-pulse');
}

/** 依繩子位置（-ROPE_HALF_LENGTH ~ +ROPE_HALF_LENGTH）更新繩結的水平位置 */
export function renderRope(position) {
  const ratio = position / ROPE_HALF_LENGTH; // -1 ~ 1
  const percent = 50 + ratio * 50; // 0% ~ 100%
  knotEl.style.left = `${percent}%`;
}

/** 每次得分時呼叫，讓拉贏的那一方頭像蹦一下，direction 是 'player1' 或 'player2' */
export function kickRope(direction) {
  const el = direction === 'player1' ? leftAvatarEl : rightAvatarEl;
  el.classList.remove('rope-pulse');
  // 強制 reflow，讓同一方連續得分時動畫也能重新播放
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;
  el.classList.add('rope-pulse');
}
