// 讀取 Firestore 裡 SnakeG（students/{}/questionProgress/{}）+ tug-of-war
// （tugofwar_students/{}/questions/{}）各自記錄的作答次數，合併後推回 Notion 的 Question 表，
// 讓老師直接在 Notion 裡看到每題的「使用次數／答錯次數／正確率」。
// 只讀 Firestore（沿用現有完全開放的規則，不需要額外密鑰）、只寫 Notion 新增的這三個欄位，
// 不會動到 Question/Choice*/Correct Answer/Active。只在 GitHub Actions 排程或本機手動跑，
// 瀏覽器端的兩個遊戲完全不會呼叫這裡的邏輯。
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from '@notionhq/client';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/firebaseConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUDENTS_JSON = join(__dirname, '..', 'src', 'data', 'students.json');

const THROTTLE_MS = 350; // Notion API 速率限制大約每秒 3 次，留點餘裕，避免 429

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function fetchProgress(db, collectionPath) {
  const snap = await getDoc(doc(db, ...collectionPath));
  return snap.exists() ? snap.data() : null;
}

async function main() {
  if (!process.env.NOTION_TOKEN) {
    console.warn('[push-notion-stats] 沒有設定 NOTION_TOKEN，略過（本機開發不需要跑這個）。');
    return;
  }

  const students = JSON.parse(readFileSync(STUDENTS_JSON, 'utf-8'));
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const app = initializeApp(firebaseConfig, 'push-notion-stats');
  const db = getFirestore(app);

  let pushed = 0;
  let skipped = 0;

  for (const student of students) {
    // Firestore 讀取沒有像 Notion 寫入那樣嚴格的速率限制，同一位學生的題目一次平行查完，加快檢查階段；
    // 真正需要節流的只有下面對 Notion 的寫入。
    // eslint-disable-next-line no-await-in-loop
    const progressList = await Promise.all(student.questions.map((question) => Promise.all([
      fetchProgress(db, ['students', student.id, 'questionProgress', question.id]),
      fetchProgress(db, ['tugofwar_students', student.id, 'questions', question.id]),
    ])));

    for (let i = 0; i < student.questions.length; i += 1) {
      const question = student.questions[i];
      const [snakeProgress, towProgress] = progressList[i];

      const usageCount = (snakeProgress?.usageCount || 0) + (towProgress?.usageCount || 0);
      const correctCount = (snakeProgress?.correctCount || 0) + (towProgress?.correctCount || 0);
      const wrongCount = (snakeProgress?.wrongCount || 0) + (towProgress?.wrongCount || 0);

      if (usageCount === 0) {
        // 這題從沒被任一遊戲抽到過，不寫入，避免對整個題庫做無意義的呼叫
        skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await notion.pages.update({
        page_id: question.id,
        properties: {
          使用次數: { number: usageCount },
          答錯次數: { number: wrongCount },
          正確率: { number: correctCount / usageCount },
        },
      });
      pushed += 1;
      // eslint-disable-next-line no-await-in-loop
      await sleep(THROTTLE_MS);
    }

    console.log(`[push-notion-stats] ${student.name}：已檢查 ${student.questions.length} 題（累計推回 ${pushed}、略過 ${skipped}）`);
  }

  console.log(`[push-notion-stats] 完成：推回 ${pushed} 題的統計，略過（從沒被抽到過）${skipped} 題。`);
}

main().catch((err) => {
  console.error(err.body || err.message);
  process.exit(1);
});
