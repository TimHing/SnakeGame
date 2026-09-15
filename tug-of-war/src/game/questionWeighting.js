import {
  collection, doc, getDocs, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  BASE_WEIGHT, WEIGHT_WRONG_MULTIPLIER, WEIGHT_CORRECT_MULTIPLIER, WEIGHT_FLOOR_RATIO,
} from '../constants.js';

const WEIGHT_FLOOR = BASE_WEIGHT * WEIGHT_FLOOR_RATIO;

/** 賽前讀一次這位學生所有題目的權重紀錄，整場比賽都用這份記憶體快取抽題，答題時同步更新 */
export async function loadWeights(studentId) {
  const snap = await getDocs(collection(db, 'tugofwar_students', studentId, 'questions'));
  const weights = {};
  snap.forEach((d) => { weights[d.id] = d.data(); });
  return weights;
}

/** 依權重做加權隨機抽題，權重越高越容易被抽到；沒有紀錄的題目一律用初始權重 */
export function pickWeightedQuestion(pool, weights) {
  if (!pool || pool.length === 0) return null;

  const withWeight = pool.map((q) => ({ q, weight: weights[q.id]?.weight ?? BASE_WEIGHT }));
  const totalWeight = withWeight.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { q, weight } of withWeight) {
    roll -= weight;
    if (roll <= 0) return q;
  }
  return withWeight[withWeight.length - 1].q;
}

/**
 * 更新本地快取的權重（同一場比賽下一次抽題立刻生效），並非同步寫回 Firestore（不擋畫面，
 * 就算寫入失敗頂多下次抽題權重沒更新到，不影響正在進行的比賽）。
 */
export function recordAnswer(studentId, question, isCorrect, weights) {
  const prev = weights[question.id] || {
    weight: BASE_WEIGHT, usageCount: 0, correctCount: 0, wrongCount: 0,
  };
  const nextWeight = Math.max(
    WEIGHT_FLOOR,
    prev.weight * (isCorrect ? WEIGHT_CORRECT_MULTIPLIER : WEIGHT_WRONG_MULTIPLIER),
  );
  const next = {
    weight: nextWeight,
    usageCount: (prev.usageCount || 0) + 1,
    correctCount: (prev.correctCount || 0) + (isCorrect ? 1 : 0),
    wrongCount: (prev.wrongCount || 0) + (isCorrect ? 0 : 1),
  };
  weights[question.id] = next;

  setDoc(doc(db, 'tugofwar_students', studentId, 'questions', question.id), {
    ...next,
    lastUsedAt: serverTimestamp(),
  }).catch(() => {});
}
