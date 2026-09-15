import { DEFAULT_MATCH_DURATION_MIN, MIN_MATCH_DURATION_MIN, MAX_MATCH_DURATION_MIN } from '../constants.js';

const view = document.getElementById('duration-view');
const valueEl = document.getElementById('duration-value');
const minusBtn = document.getElementById('duration-minus');
const plusBtn = document.getElementById('duration-plus');
const startBtn = document.getElementById('duration-start-btn');

let minutes = DEFAULT_MATCH_DURATION_MIN;

function render() {
  valueEl.textContent = `${minutes} 分鐘`;
  minusBtn.disabled = minutes <= MIN_MATCH_DURATION_MIN;
  plusBtn.disabled = minutes >= MAX_MATCH_DURATION_MIN;
}

export function showDurationView() {
  minutes = DEFAULT_MATCH_DURATION_MIN;
  render();
  view.classList.remove('hidden');
}

export function bindDurationPicker({ onConfirm }) {
  minusBtn.addEventListener('click', () => { minutes = Math.max(MIN_MATCH_DURATION_MIN, minutes - 1); render(); });
  plusBtn.addEventListener('click', () => { minutes = Math.min(MAX_MATCH_DURATION_MIN, minutes + 1); render(); });
  startBtn.addEventListener('click', () => {
    view.classList.add('hidden');
    onConfirm(minutes);
  });
  render();
}
