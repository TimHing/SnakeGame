import questions from '../data/questions.json';

/**
 * 抽題（單次遊玩期間，純記憶體狀態，不跨裝置/跨次數保存）：
 * 過濾出該學生年級/科目的題庫，優先抽這次遊玩還沒出過的題目；
 * 整個題庫都出過一輪後，清空紀錄讓下一輪重新開始。
 */
export function pickQuestion(askedIds, grade, subject) {
  const pool = questions.filter((q) => q.grade === grade && q.subject === subject);
  if (pool.length === 0) return null;

  const fresh = pool.filter((q) => !askedIds.has(q.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  askedIds.add(picked.id);
  if (askedIds.size >= pool.length) askedIds.clear();

  return picked;
}

export function recordAnswer(tally, isCorrect) {
  if (isCorrect) {
    tally.correct += 1;
  } else {
    tally.wrong += 1;
  }
}
