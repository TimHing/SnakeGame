import ropeImageUrl from '../assets/tug-of-war.jpeg';
import { ROPE_HALF_LENGTH } from '../constants.js';

const imageEl = document.getElementById('rope-image');
imageEl.src = ropeImageUrl;

const MAX_PAN_PERCENT = 15; // 相對圖片自身寬度（圖片比容器寬 60%），約等於容器寬度的 24%，不會露出邊緣空白

/** 賽前呼叫一次，把圖片歸零到正中央 */
export function resetRope() {
  imageEl.classList.remove('rope-kick-left', 'rope-kick-right');
  imageEl.style.setProperty('--pan-pct', '0');
}

/** 依繩子位置（-ROPE_HALF_LENGTH ~ +ROPE_HALF_LENGTH）平移圖片，模擬整條拔河線被拉動 */
export function renderRope(position) {
  const ratio = position / ROPE_HALF_LENGTH; // -1 ~ 1
  imageEl.style.setProperty('--pan-pct', (ratio * MAX_PAN_PERCENT).toFixed(1));
}

/** 每次得分時呼叫，疊加一個短暫的「用力拉一下」動畫，direction 是 'player1' 或 'player2' */
export function kickRope(direction) {
  const className = direction === 'player1' ? 'rope-kick-left' : 'rope-kick-right';
  imageEl.classList.remove('rope-kick-left', 'rope-kick-right');
  // 強制 reflow，讓同一個方向連續觸發時動畫也能重新播放
  // eslint-disable-next-line no-unused-expressions
  imageEl.offsetWidth;
  imageEl.classList.add(className);
}
