import students from './data/students.json';

const loginView = document.getElementById('login-view');
const gameView = document.getElementById('game-view');

export function showRollCallView() {
  gameView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

/**
 * 免密碼點名登入，可選加一個存在 Notion 的 PIN 碼：只是防誤觸的小提醒，
 * PIN 本身會被打包進公開網站原始碼，不是真正的安全機制。
 */
export function bindRollCall({ onStart }) {
  const listEl = document.getElementById('rollcall-list');
  const emptyMsg = document.getElementById('rollcall-empty');

  listEl.innerHTML = '';
  students.forEach((student) => {
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

    const start = () => {
      loginView.classList.add('hidden');
      gameView.classList.remove('hidden');
      onStart({ id: student.id, name: student.name, questions: student.questions });
    };

    const attempt = () => {
      if (pinInput.value === student.pin) {
        start();
      } else {
        errorEl.textContent = 'PIN 不對，再試試看';
        pinInput.value = '';
        pinInput.focus();
      }
    };

    nameBtn.addEventListener('click', () => {
      if (!student.pin) {
        start(); // 沒設 PIN 的學生直接進去
        return;
      }
      pinRow.classList.remove('hidden');
      pinInput.focus();
    });
    confirmBtn.addEventListener('click', attempt);
    pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); });
  });
  emptyMsg.classList.toggle('hidden', students.length > 0);
}
