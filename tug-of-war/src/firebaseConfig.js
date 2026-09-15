// 跟 Snake Game 共用同一個 Firebase 專案（snakegame-91f56），只是多開一個獨立的 Hosting site
// + 專屬的 Firestore collection（tugofwar_matches / tugofwar_students），完全不動 Snake Game 既有的資料。
// 這份設定值本來就是公開的 Web config，不是密鑰——安全性由 Firestore 規則把關，不是靠這份設定保密。
export const firebaseConfig = {
  apiKey: 'AIzaSyAXfMuteWm8V0anOV0M0RBz6NDk_8R7WUU',
  authDomain: 'snakegame-91f56.firebaseapp.com',
  projectId: 'snakegame-91f56',
  storageBucket: 'snakegame-91f56.firebasestorage.app',
  messagingSenderId: '966342783715',
  appId: '1:966342783715:web:373929fe13eebc8a684bd6',
};
