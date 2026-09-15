const listEl = document.getElementById('tow-leaderboard-list');
const emptyEl = document.getElementById('tow-leaderboard-empty');

/** 賽前/賽後呼叫一次即可，不用即時更新 */
export function renderStandings(standings) {
  listEl.innerHTML = '';
  standings.forEach((entry) => {
    const li = document.createElement('li');
    const nameEl = document.createElement('span');
    nameEl.className = 'lb-name';
    nameEl.textContent = entry.name;
    const winsEl = document.createElement('span');
    winsEl.className = 'lb-score';
    winsEl.textContent = `${entry.wins} 勝／${entry.matches} 場`;
    li.append(nameEl, winsEl);
    listEl.appendChild(li);
  });
  emptyEl.classList.toggle('hidden', standings.length > 0);
}
