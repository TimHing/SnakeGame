import { showDurationView, bindDurationPicker } from './ui/durationPicker.js';
import { showPickerView, bindPlayerPicker } from './game/playerPicker.js';
import {
  renderRope, resetRope, kickRope, setAvatars,
} from './ui/ropeView.js';
import { createQuestionPanel } from './ui/questionPanel.js';
import { createMatch } from './game/matchEngine.js';
import {
  loadWeights, pickWeightedQuestion, recordAnswer as recordWeightedAnswer,
} from './game/questionWeighting.js';
import {
  recordMatch, updateStanding, fetchStandings,
} from './game/matchResult.js';
import { renderStandings } from './ui/leaderboard.js';
import { celebrate, clearCelebration } from './ui/celebration.js';
import { ANSWER_FEEDBACK_MS } from './constants.js';

const matchView = document.getElementById('match-view');
const resultView = document.getElementById('result-view');
const resultHeadline = document.getElementById('result-headline');
const resultText = document.getElementById('result-text');
const rematchBtn = document.getElementById('rematch-btn');
const endGameBtn = document.getElementById('end-game-btn');
const timerEl = document.getElementById('match-timer');

let lastMatchParams = null; // 供「再來一局」直接沿用同兩位選手、同比賽時長重新開一局

const panel1 = createQuestionPanel(document.getElementById('panel-player1'), {
  onAnswer: (isCorrect, question) => handleAnswer('player1', isCorrect, question),
});
const panel2 = createQuestionPanel(document.getElementById('panel-player2'), {
  onAnswer: (isCorrect, question) => handleAnswer('player2', isCorrect, question),
});

let match = null;
let players = null;
let weights = null;
const panels = { player1: panel1, player2: panel2 };

refreshStandings();

function refreshStandings() {
  fetchStandings().then(renderStandings).catch(() => {});
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function nextQuestion(side) {
  if (match.isEnded()) return;
  const question = pickWeightedQuestion(players[side].questions, weights[side]);
  panels[side].showQuestion(question);
}

function handleAnswer(side, isCorrect, question) {
  recordWeightedAnswer(players[side].id, question, isCorrect, weights[side]);
  match.applyAnswer(side, isCorrect);
  const t = match.getTally()[side];
  panels[side].setTally(t.correctCount, t.wrongCount);
  if (!match.isEnded()) {
    setTimeout(() => nextQuestion(side), ANSWER_FEEDBACK_MS);
  }
}

async function startMatch({ player1, player2, durationMin }) {
  lastMatchParams = { player1, player2, durationMin };
  matchView.classList.remove('hidden');
  resultView.classList.add('hidden');
  clearCelebration();
  panel1.resetCelebration();
  panel2.resetCelebration();

  players = { player1, player2 };
  const [weights1, weights2] = await Promise.all([
    loadWeights(player1.id),
    loadWeights(player2.id),
  ]);
  weights = { player1: weights1, player2: weights2 };

  panel1.setPlayerName(player1.name);
  panel2.setPlayerName(player2.name);
  panel1.setAvatar(player1.avatar);
  panel2.setAvatar(player2.avatar);
  panel1.setTally(0, 0);
  panel2.setTally(0, 0);
  setAvatars(player1, player2);
  resetRope();

  const durationMs = durationMin * 60 * 1000;
  let secondsLeft = Math.round(durationMs / 1000);
  timerEl.textContent = formatTime(secondsLeft);
  const tickId = setInterval(() => {
    secondsLeft -= 1;
    timerEl.textContent = formatTime(Math.max(0, secondsLeft));
    if (secondsLeft <= 0) clearInterval(tickId);
  }, 1000);

  match = createMatch({
    durationMs,
    onRopeChange: (position, direction) => {
      renderRope(position);
      kickRope(direction);
    },
    onEnd: ({ winner, ropePosition, tally }) => {
      clearInterval(tickId);
      panel1.showEnded('比賽結束！');
      panel2.showEnded('比賽結束！');
      finishMatch({
        player1, player2, durationMin, ropePosition, winner, tally,
      });
    },
  });

  nextQuestion('player1');
  nextQuestion('player2');
}

async function finishMatch({
  player1, player2, durationMin, ropePosition, winner, tally,
}) {
  // 故意不隱藏 matchView：讓拔河繩/面板停留在比賽結束當下的畫面，結果只是疊一層浮層上去，
  // 不會有「跳回首頁」的感覺；按「再來一局」或「結束遊戲」才真的離開這個畫面。
  resultView.classList.remove('hidden');

  const line1 = `${player1.name}：對 ${tally.player1.correctCount}／錯 ${tally.player1.wrongCount}`;
  const line2 = `${player2.name}：對 ${tally.player2.correctCount}／錯 ${tally.player2.wrongCount}`;
  resultHeadline.textContent = winner === 'draw'
    ? '🤝 平手！'
    : `🏆 ${winner === 'player1' ? player1.name : player2.name} 獲勝！`;
  resultText.textContent = `${line1}\n${line2}`;

  if (winner !== 'draw') {
    panels[winner].celebrate();
    celebrate();
  }

  try {
    await recordMatch({
      durationMin,
      player1: { id: player1.id, name: player1.name, ...tally.player1 },
      player2: { id: player2.id, name: player2.name, ...tally.player2 },
      ropePosition,
      winner,
    });
    await Promise.all([
      updateStanding(player1.id, player1.name, winner === 'player1'),
      updateStanding(player2.id, player2.name, winner === 'player2'),
    ]);
  } catch {
    // 寫入失敗不影響已經看到的結果畫面，最多下次排行榜少一筆
  }
  refreshStandings();
}

// bindPlayerPicker 只在啟動時掛一次監聽，避免每次「再玩一局」都重複掛，導致 onConfirm 被觸發多次。
// 選好的比賽時長先存起來，選手選擇畫面確認時再一起帶入 startMatch。
let pendingDurationMin = null;

function startPickerFlow(durationMin) {
  pendingDurationMin = durationMin;
  showPickerView();
}

bindPlayerPicker({
  onConfirm: ({ player1, player2 }) => startMatch({ player1, player2, durationMin: pendingDurationMin }),
});

rematchBtn.addEventListener('click', () => {
  resultView.classList.add('hidden');
  if (lastMatchParams) startMatch(lastMatchParams);
});

endGameBtn.addEventListener('click', () => {
  resultView.classList.add('hidden');
  matchView.classList.add('hidden');
  clearCelebration();
  panel1.resetCelebration();
  panel2.resetCelebration();
  showDurationView();
});

bindDurationPicker({ onConfirm: startPickerFlow });
showDurationView();
