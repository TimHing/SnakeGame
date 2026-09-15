import {
  collection, doc, addDoc, setDoc, increment, getDocs, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

/** 單場對戰紀錄，append-only，跟 Snake Game 的 highScores 同邏輯 */
export async function recordMatch({
  durationMin, player1, player2, ropePosition, winner,
}) {
  await addDoc(collection(db, 'tugofwar_matches'), {
    durationMin,
    player1Id: player1.id,
    player1Name: player1.name,
    player1Correct: player1.correctCount,
    player1Wrong: player1.wrongCount,
    player2Id: player2.id,
    player2Name: player2.name,
    player2Correct: player2.correctCount,
    player2Wrong: player2.wrongCount,
    ropePosition,
    winner, // 'player1' | 'player2' | 'draw'
    endedAt: serverTimestamp(),
  });
}

/** 累加勝場/場次，供排行榜使用；同一份文件也是 tugofwar_students/{}/questions 權重紀錄的父層 */
export async function updateStanding(studentId, name, won) {
  await setDoc(doc(db, 'tugofwar_students', studentId), {
    name,
    matches: increment(1),
    wins: increment(won ? 1 : 0),
  }, { merge: true });
}

export async function fetchStandings() {
  const snap = await getDocs(query(collection(db, 'tugofwar_students'), orderBy('wins', 'desc'), limit(20)));
  return snap.docs
    .map((d) => ({ name: d.data().name, wins: d.data().wins || 0, matches: d.data().matches || 0 }))
    .filter((entry) => entry.matches > 0);
}
