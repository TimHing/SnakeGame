import students from '../data/students.json';

const view = document.getElementById('picker-view');
const leftListEl = document.getElementById('picker-left-list');
const rightListEl = document.getElementById('picker-right-list');
const startBtn = document.getElementById('picker-start-btn');
const emptyMsg = document.getElementById('picker-empty');

let leftPick = null;
let rightPick = null;

/**
 * 免密碼點名選人，可選加一個存在 Notion 的 PIN 碼，跟 Snake Game 的點名畫面同一套邏輯，
 * 但獨立實作（不共用 src/rollcall.js），並加上左右互斥：一邊選走的名字，另一邊清單要排除掉。
 */
function renderSide(listEl, excludeId, onPick) {
  listEl.innerHTML = '';
  students.forEach((student) => {
    if (student.id === excludeId) return;

    const item = document.createElement('div');
    item.className = 'rollcall-item';

    const nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.textContent = student.name;

    const pinRow = document.createElement('div');
    pinRow.className = 'rollcall-pin hidden';
    const pinInput = document.createElement('input');
    pinInput.type = 'password';
    pinInput.inputMode = 'numeric';
    pinInput.placeholder = 'PIN';
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'secondary';
    confirmBtn.textContent = '確認';
    const errorEl = document.createElement('p');
    errorEl.className = 'error';
    pinRow.append(pinInput, confirmBtn, errorEl);
    item.append(nameBtn, pinRow);
    listEl.appendChild(item);

    const attempt = () => {
      if (pinInput.value === student.pin) {
        onPick(student);
      } else {
        errorEl.textContent = 'PIN 不對，再試試看';
        pinInput.value = '';
        pinInput.focus();
      }
    };

    nameBtn.addEventListener('click', () => {
      if (!student.pin) { onPick(student); return; }
      pinRow.classList.remove('hidden');
      pinInput.focus();
    });
    confirmBtn.addEventListener('click', attempt);
    pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); });
  });
}

function refresh() {
  renderSide(leftListEl, rightPick?.id, (student) => { leftPick = student; refresh(); });
  renderSide(rightListEl, leftPick?.id, (student) => { rightPick = student; refresh(); });
  startBtn.disabled = !(leftPick && rightPick);
  emptyMsg.classList.toggle('hidden', students.length >= 2);
}

export function showPickerView() {
  leftPick = null;
  rightPick = null;
  refresh();
  view.classList.remove('hidden');
}

export function hidePickerView() {
  view.classList.add('hidden');
}

export function bindPlayerPicker({ onConfirm }) {
  startBtn.addEventListener('click', () => {
    if (!leftPick || !rightPick) return;
    hidePickerView();
    onConfirm({ player1: leftPick, player2: rightPick });
  });
}
