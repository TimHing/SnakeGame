import { GRADES, SUBJECTS } from './curriculum.js';
import students from './data/students.json';

const loginView = document.getElementById('login-view');
const gameView = document.getElementById('game-view');

export function showRollCallView() {
  gameView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

/** 免密碼點名登入：學生從年級/科目過濾出的清單裡點自己的暱稱開始玩 */
export function bindRollCall({ onStart }) {
  const gradeSelect = document.getElementById('rollcall-grade');
  const subjectSelect = document.getElementById('rollcall-subject');
  const listEl = document.getElementById('rollcall-list');
  const emptyMsg = document.getElementById('rollcall-empty');

  GRADES.forEach((grade) => {
    const opt = document.createElement('option');
    opt.value = String(grade);
    opt.textContent = `${grade}年級`;
    gradeSelect.appendChild(opt);
  });
  SUBJECTS.forEach((subject) => {
    const opt = document.createElement('option');
    opt.value = subject.value;
    opt.textContent = subject.label;
    subjectSelect.appendChild(opt);
  });

  function renderList() {
    const grade = Number(gradeSelect.value);
    const subject = subjectSelect.value;
    const matches = students.filter((s) => s.grade === grade && s.subject === subject);

    listEl.innerHTML = '';
    matches.forEach((student) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = student.code;
      btn.addEventListener('click', () => {
        loginView.classList.add('hidden');
        gameView.classList.remove('hidden');
        onStart({ code: student.code, grade: student.grade, subject: student.subject });
      });
      listEl.appendChild(btn);
    });
    emptyMsg.classList.toggle('hidden', matches.length > 0);
  }

  gradeSelect.addEventListener('change', renderList);
  subjectSelect.addEventListener('change', renderList);
  renderList();
}
