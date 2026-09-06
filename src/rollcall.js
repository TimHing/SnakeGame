import students from './data/students.json';

const loginView = document.getElementById('login-view');
const gameView = document.getElementById('game-view');

export function showRollCallView() {
  gameView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

/** 免密碼點名登入：點自己的名字開始玩，每個人對應自己專屬的題庫 */
export function bindRollCall({ onStart }) {
  const listEl = document.getElementById('rollcall-list');
  const emptyMsg = document.getElementById('rollcall-empty');

  listEl.innerHTML = '';
  students.forEach((student) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = student.name;
    btn.addEventListener('click', () => {
      loginView.classList.add('hidden');
      gameView.classList.remove('hidden');
      onStart({ id: student.id, name: student.name, questions: student.questions });
    });
    listEl.appendChild(btn);
  });
  emptyMsg.classList.toggle('hidden', students.length > 0);
}
