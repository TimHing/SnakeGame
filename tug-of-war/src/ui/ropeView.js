import { ROPE_HALF_LENGTH } from '../constants.js';

const trainEl = document.getElementById('rope-train');
const leftAvatarEl = document.getElementById('rope-avatar-left');
const rightAvatarEl = document.getElementById('rope-avatar-right');

// 整條隊伍最多平移「自己寬度」的 26%；#rope-viewport 比隊伍本身窄一些，
// 平移到底時，離中心最遠的隊員（甚至頭像）就會被拖出可視範圍外而消失，營造緊張感。
const MAX_PAN_PERCENT = 26;

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

/** 賽前呼叫一次，把隊伍歸位到正中央 */
export function resetRope() {
  trainEl.style.setProperty('--pan-pct', '0');
  leftAvatarEl.classList.remove('rope-pulse');
  rightAvatarEl.classList.remove('rope-pulse');
}

/** 依繩子位置（-ROPE_HALF_LENGTH ~ +ROPE_HALF_LENGTH）平移整條隊伍 */
export function renderRope(position) {
  const ratio = position / ROPE_HALF_LENGTH; // -1 ~ 1
  trainEl.style.setProperty('--pan-pct', (ratio * MAX_PAN_PERCENT).toFixed(1));
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
