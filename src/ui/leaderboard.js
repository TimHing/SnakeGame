const totalListEl = document.getElementById('total-leaderboard-list');
const highScoreListEl = document.getElementById('high-score-list');

function renderList(el, entries, scoreKey) {
  el.innerHTML = '';
  entries.forEach((entry) => {
    const li = document.createElement('li');
    const nameEl = document.createElement('span');
    nameEl.className = 'lb-name';
    nameEl.textContent = entry.name;
    const scoreEl = document.createElement('span');
    scoreEl.className = 'lb-score';
    scoreEl.textContent = entry[scoreKey];
    li.append(nameEl, scoreEl);
    el.appendChild(li);
  });
}

/** 登入/開始遊玩時呼叫一次即可，不用即時更新 */
export function renderLeaderboard({ totals, highScores }) {
  renderList(totalListEl, totals, 'totalScore');
  renderList(highScoreListEl, highScores, 'score');
}
