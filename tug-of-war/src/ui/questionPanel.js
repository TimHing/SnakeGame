/**
 * 建立一側（player1 或 player2）的題目面板控制器。root 是該側的容器元素；
 * onAnswer(isCorrect, question) 由呼叫端決定下一步（更新繩子、記錄權重、抽下一題）。
 */
export function createQuestionPanel(root, { onAnswer }) {
  const avatarEl = root.querySelector('.panel-avatar');
  const nameEl = root.querySelector('.panel-name');
  const scoreEl = root.querySelector('.panel-score');
  const textEl = root.querySelector('.panel-question');
  const choicesEl = root.querySelector('.panel-choices');

  let locked = false;

  function setPlayerName(name) {
    nameEl.textContent = name;
  }

  /** 賽前選手選擇畫面若有挑寶可夢頭像，帶進來這裡一起顯示；沒選就不顯示 */
  function setAvatar(avatar) {
    if (avatar) {
      avatarEl.src = avatar.src;
      avatarEl.alt = avatar.name;
      avatarEl.classList.remove('hidden');
    } else {
      avatarEl.classList.add('hidden');
    }
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
        pulse(isCorrect);
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

  /** 比賽結束時，贏方的面板持續發光慶祝；下一局開始前要記得呼叫 resetCelebration() 清掉 */
  function celebrate() {
    root.classList.add('panel-winner');
  }

  function resetCelebration() {
    root.classList.remove('panel-winner');
  }

  /** 答題當下的即時視覺回饋：面板閃一下顏色 + 浮出一個 +1／-1 的小動畫 */
  function pulse(isCorrect) {
    const flashClass = isCorrect ? 'panel-pulse-correct' : 'panel-pulse-wrong';
    root.classList.remove('panel-pulse-correct', 'panel-pulse-wrong');
    // eslint-disable-next-line no-unused-expressions
    root.offsetWidth; // 強制 reflow，讓連續同一種結果也能重新觸發動畫
    root.classList.add(flashClass);

    const pop = document.createElement('div');
    pop.className = `score-pop ${isCorrect ? 'score-pop-correct' : 'score-pop-wrong'}`;
    pop.textContent = isCorrect ? '+1 🎉' : '-1 😵';
    root.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove());
  }

  return {
    setPlayerName, setAvatar, setTally, showQuestion, showEnded, celebrate, resetCelebration,
  };
}
