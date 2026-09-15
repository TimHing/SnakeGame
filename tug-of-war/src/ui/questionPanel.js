/**
 * 建立一側（player1 或 player2）的題目面板控制器。root 是該側的容器元素；
 * onAnswer(isCorrect, question) 由呼叫端決定下一步（更新繩子、記錄權重、抽下一題）。
 */
export function createQuestionPanel(root, { onAnswer }) {
  const nameEl = root.querySelector('.panel-name');
  const scoreEl = root.querySelector('.panel-score');
  const textEl = root.querySelector('.panel-question');
  const choicesEl = root.querySelector('.panel-choices');

  let locked = false;

  function setPlayerName(name) {
    nameEl.textContent = name;
  }

  function setTally(correctCount, wrongCount) {
    scoreEl.textContent = `對 ${correctCount}／錯 ${wrongCount}`;
  }

  function showQuestion(question) {
    if (!question) {
      showEnded('這位選手目前沒有題目');
      return;
    }
    locked = false;
    textEl.textContent = question.question;
    choicesEl.innerHTML = '';
    question.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${'ABCD'[i]}. ${choice}`;
      btn.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        const isCorrect = i === question.correctIndex;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) choicesEl.children[question.correctIndex].classList.add('correct');
        Array.from(choicesEl.children).forEach((b) => { b.disabled = true; });
        onAnswer(isCorrect, question);
      });
      choicesEl.appendChild(btn);
    });
  }

  function showEnded(message) {
    locked = true;
    textEl.textContent = message;
    choicesEl.innerHTML = '';
  }

  return {
    setPlayerName, setTally, showQuestion, showEnded,
  };
}
