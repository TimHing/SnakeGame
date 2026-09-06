import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * 抽題演算法：從這個學生自己的題庫（pool，來自 Notion 打包好的 JSON）裡，
 * 找出「這個學生使用次數最低」的那批題目，只在這批裡隨機抽一題。
 * 保證整個題庫被輪過一輪才會開始重複。進度存在 Firestore，跨裝置/跨次數保存。
 */
export async function pickQuestion(studentId, pool) {
  if (!pool || pool.length === 0) return null;

  const progressSnap = await getDocs(collection(db, 'students', studentId, 'questionProgress'));
  const usageById = {};
  progressSnap.forEach((d) => { usageById[d.id] = d.data().usageCount || 0; });

  const minUsage = Math.min(...pool.map((q) => usageById[q.id] || 0));
  const candidates = pool.filter((q) => (usageById[q.id] || 0) === minUsage);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function recordAnswer(studentId, question, isCorrect) {
  const progressRef = doc(db, 'students', studentId, 'questionProgress', question.id);
  const progressSnap = await getDoc(progressRef);
  const prev = progressSnap.exists() ? progressSnap.data() : { usageCount: 0, correctCount: 0, wrongCount: 0 };

  await setDoc(progressRef, {
    usageCount: (prev.usageCount || 0) + 1,
    correctCount: (prev.correctCount || 0) + (isCorrect ? 1 : 0),
    wrongCount: (prev.wrongCount || 0) + (isCorrect ? 0 : 1),
    lastUsedAt: serverTimestamp(),
  });
}
