// 一次性本機腳本：產生二年級乘法口訣的種子題目（1~9 × 1~9），直接寫進 Notion 的 Questions 資料庫。
// 用法：在專案根目錄建立 .env，填好 NOTION_TOKEN 和 NOTION_QUESTIONS_DB_ID，然後執行
//   npm run seed:notion-questions
// 這支腳本只會在你自己的電腦上執行一次，不會被 CI 或遊戲本身呼叫。
import 'dotenv/config';
import { Client } from '@notionhq/client';

const ANSWER_LETTER = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDistractors(correct, i, j) {
  const candidates = new Set([
    correct + i,
    correct - i,
    correct + j,
    correct - j,
    (i + 1) * j,
    i * (j + 1),
    correct + 1,
    correct - 1,
  ].filter((n) => n > 0 && n !== correct));
  return shuffle([...candidates]).slice(0, 3);
}

function generateQuestions() {
  const questions = [];
  for (let i = 1; i <= 9; i += 1) {
    for (let j = 1; j <= 9; j += 1) {
      const correct = i * j;
      const distractors = makeDistractors(correct, i, j);
      while (distractors.length < 3) distractors.push(correct + distractors.length + 1);

      const options = shuffle([correct, ...distractors]);
      const correctIndex = options.indexOf(correct);

      questions.push({
        grade: 2,
        subject: 'multiplication',
        question: `${i} × ${j} = ?`,
        choices: options.map(String),
        correctIndex,
      });
    }
  }
  return questions;
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function main() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_QUESTIONS_DB_ID;
  if (!token || !databaseId) {
    console.error('請先在 .env 設定 NOTION_TOKEN 和 NOTION_QUESTIONS_DB_ID 再執行這支腳本。');
    process.exit(1);
  }

  const notion = new Client({ auth: token });
  const questions = generateQuestions();
  console.log(`準備寫入 ${questions.length} 道題目到 Notion...`);

  for (const q of questions) {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Question: { title: [{ text: { content: q.question } }] },
        Grade: { number: q.grade },
        Subject: { select: { name: q.subject } },
        'Choice A': { rich_text: [{ text: { content: q.choices[0] } }] },
        'Choice B': { rich_text: [{ text: { content: q.choices[1] } }] },
        'Choice C': { rich_text: [{ text: { content: q.choices[2] } }] },
        'Choice D': { rich_text: [{ text: { content: q.choices[3] } }] },
        'Correct Answer': { select: { name: ANSWER_LETTER[q.correctIndex] } },
        Active: { checkbox: true },
      },
    });
    process.stdout.write('.');
    await sleep(350); // 稍微放慢速度，避免撞到 Notion API 速率限制
  }

  console.log(`\n完成！已寫入 ${questions.length} 道題目。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
