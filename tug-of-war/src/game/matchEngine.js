import { ROPE_HALF_LENGTH } from '../constants.js';

/**
 * 一場比賽的狀態機。position 為負代表繩子偏向 player1（左），為正代表偏向 player2（右）。
 * 雙方各自獨立作答、各自倒數、答完立刻換下一題；繩子位置是唯一共用的狀態。
 * player1 答對／player2 答錯 → 繩子往 player1 移一格；
 * player2 答對／player1 答錯 → 繩子往 player2 移一格。
 * 淨移動到端點（±ROPE_HALF_LENGTH）立刻秒殺結束；時間到看繩子偏向哪邊，正中央算平手。
 */
export function createMatch({ durationMs, onRopeChange, onEnd }) {
  let ropePosition = 0;
  let ended = false;
  const tally = {
    player1: { correctCount: 0, wrongCount: 0 },
    player2: { correctCount: 0, wrongCount: 0 },
  };

  function finish(winner) {
    if (ended) return;
    ended = true;
    clearTimeout(timeoutId);
    onEnd({ winner, ropePosition, tally });
  }

  function applyAnswer(side, isCorrect) {
    if (ended) return;
    const towardPlayer1 = (side === 'player1') === isCorrect;
    const delta = towardPlayer1 ? -1 : 1;
    ropePosition += delta;
    tally[side][isCorrect ? 'correctCount' : 'wrongCount'] += 1;
    onRopeChange(ropePosition, towardPlayer1 ? 'player1' : 'player2');

    if (ropePosition <= -ROPE_HALF_LENGTH) finish('player1');
    else if (ropePosition >= ROPE_HALF_LENGTH) finish('player2');
  }

  const timeoutId = setTimeout(() => {
    if (ropePosition < 0) finish('player1');
    else if (ropePosition > 0) finish('player2');
    else finish('draw');
  }, durationMs);

  return {
    applyAnswer,
    getTally: () => tally,
    isEnded: () => ended,
  };
}
