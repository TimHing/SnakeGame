const layer = document.getElementById('confetti-layer');
const COLORS = ['#4c8bf5', '#2f9e57', '#ffd166', '#d9463c', '#a06cd5'];
const PIECE_COUNT = 36;

let clearTimeoutId = null;

/** 贏方慶祝用的滿版彩帶紙屑，平手時不呼叫這個 */
export function celebrate() {
  clearCelebration();
  for (let i = 0; i < PIECE_COUNT; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
    layer.appendChild(piece);
  }
  clearTimeoutId = setTimeout(clearCelebration, 3200);
}

export function clearCelebration() {
  if (clearTimeoutId) clearTimeout(clearTimeoutId);
  layer.innerHTML = '';
}
