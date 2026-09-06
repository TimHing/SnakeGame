import {
  collection, doc, setDoc, addDoc, increment, query, orderBy, limit, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

/** 登入/開始遊玩時讀一次即可，不用即時訂閱 */
export async function fetchLeaderboards() {
  const [totalsSnap, highScoresSnap] = await Promise.all([
    getDocs(query(collection(db, 'students'), orderBy('totalScore', 'desc'))),
    getDocs(query(collection(db, 'highScores'), orderBy('score', 'desc'), limit(20))),
  ]);

  return {
    totals: totalsSnap.docs.map((d) => ({ name: d.data().name, totalScore: d.data().totalScore || 0 })),
    highScores: highScoresSnap.docs.map((d) => ({ name: d.data().name, score: d.data().score })),
  };
}

/** 累積總分：吃到食物就即時累加，不用等到結束遊玩 */
export async function incrementStudentScore(studentId, name, amount) {
  await setDoc(doc(db, 'students', studentId), {
    name,
    totalScore: increment(amount),
  }, { merge: true });
}

/** 單次遊玩的分數紀錄，只在結束遊玩時寫一筆，append-only（規則不允許之後修改/刪除） */
export async function recordHighScore(studentId, name, score) {
  if (score <= 0) return;
  await addDoc(collection(db, 'highScores'), {
    studentId, name, score, endedAt: serverTimestamp(),
  });
}
