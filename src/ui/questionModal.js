import { CORRECT_FEEDBACK_MS, WRONG_FEEDBACK_MS } from '../constants.js';

const modal = document.getElementById('question-modal');
const textEl = document.getElementById('question-text');
const choicesEl = document.getElementById('question-choices');
const feedbackEl = document.getElementById('question-feedback');

let activeResolve = null;
let keyHandler = null;

/** 顯示一道選擇題，回傳 Promise<boolean>（是否答對） */
export function showQuestion(question) {
  return new Promise((resolve) => {
    activeResolve = resolve;
    textEl.textContent = question.question;
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('correct');
    choicesEl.innerHTML = '';

    question.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${'ABCD'[i]}. ${choice}`;
      btn.addEventListener('click', () => submitAnswer(i, question));
      choicesEl.appendChild(btn);
    });

    modal.classList.remove('hidden');

    keyHandler = (e) => {
      const idx = { 1: 0, 2: 1, 3: 2, 4: 3 }[e.key];
      if (idx !== undefined) submitAnswer(idx, question);
    };
    window.addEventListener('keydown', keyHandler);
  });
}

function submitAnswer(index, question) {
  if (!activeResolve) return;

  const buttons = Array.from(choicesEl.querySelectorAll('button'));
  buttons.forEach((b) => { b.disabled = true; });

  const isCorrect = index === question.correctIndex;
  buttons[index].classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) buttons[question.correctIndex].classList.add('correct');
  feedbackEl.textContent = isCorrect ? '答對了！蛇變長了 🎉' : '答錯了，這次先不能吃，再試試看～';
  feedbackEl.classList.toggle('correct', isCorrect);

  window.removeEventListener('keydown', keyHandler);
  const resolve = activeResolve;
  activeResolve = null;

  setTimeout(() => {
    modal.classList.add('hidden');
    resolve(isCorrect);
  }, isCorrect ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS);
}
