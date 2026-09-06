// 從 Notion 抓 Students / Questions 兩個資料庫，烘焙成遊戲要用的靜態 JSON。
// 只在 GitHub Actions build 時、或本機手動執行時跑；瀏覽器端的遊戲程式碼永遠不會直接呼叫 Notion API。
//
// 沒有設定 NOTION_TOKEN 時（例如剛 clone 下來還沒申請 Notion integration），
// 會改用 src/data/*.sample.json 這組範例假資料，方便直接 `npm run dev` 測試畫面邏輯。
import 'dotenv/config';
import { Client } from '@notionhq/client';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GRADES, SUBJECTS } from '../src/curriculum.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const SUBJECT_VALUES = new Set(SUBJECTS.map((s) => s.value));
const ANSWER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function getTitle(prop) {
  return (prop?.title || []).map((t) => t.plain_text).join('').trim();
}
function getRichText(prop) {
  return (prop?.rich_text || []).map((t) => t.plain_text).join('').trim();
}
function getNumber(prop) {
  return prop?.number;
}
function getSelectName(prop) {
  return prop?.select?.name;
}

function fail(message, page) {
  const url = page?.url ? `\n頁面網址：${page.url}` : '';
  throw new Error(`[sync-notion] ${message}${url}`);
}

function assertGradeSubject(grade, subject, page, where) {
  if (!GRADES.includes(grade)) {
    fail(`${where}：Grade「${grade}」不在允許的年級清單 ${JSON.stringify(GRADES)} 裡`, page);
  }
  if (!SUBJECT_VALUES.has(subject)) {
    fail(`${where}：Subject「${subject}」不在允許的科目清單 ${JSON.stringify([...SUBJECT_VALUES])} 裡`, page);
  }
}

async function queryAllActive(notion, database_id) {
  const results = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id,
      filter: { property: 'Active', checkbox: { equals: true } },
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function syncStudents(notion, databaseId) {
  const pages = await queryAllActive(notion, databaseId);
  return pages.map((page) => {
    const code = getTitle(page.properties.Code);
    const grade = getNumber(page.properties.Grade);
    const subject = getSelectName(page.properties.Subject);
    if (!code) fail('學生列缺少 Code（標題欄）', page);
    assertGradeSubject(grade, subject, page, `學生「${code}」`);
    return { code, grade, subject };
  });
}

async function syncQuestions(notion, databaseId) {
  const pages = await queryAllActive(notion, databaseId);
  return pages.map((page) => {
    const question = getTitle(page.properties.Question);
    const grade = getNumber(page.properties.Grade);
    const subject = getSelectName(page.properties.Subject);
    const choices = [
      getRichText(page.properties['Choice A']),
      getRichText(page.properties['Choice B']),
      getRichText(page.properties['Choice C']),
      getRichText(page.properties['Choice D']),
    ];
    const answer = getSelectName(page.properties['Correct Answer']);

    if (!question) fail('題目缺少 Question（標題欄）', page);
    assertGradeSubject(grade, subject, page, `題目「${question}」`);
    if (choices.some((c) => !c)) fail(`題目「${question}」的 4 個選項必須全部填寫`, page);
    if (!(answer in ANSWER_INDEX)) fail(`題目「${question}」的 Correct Answer 必須是 A/B/C/D 其中一個`, page);

    return {
      id: page.id, grade, subject, question, choices, correctIndex: ANSWER_INDEX[answer],
    };
  });
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const studentsOut = join(DATA_DIR, 'students.json');
  const questionsOut = join(DATA_DIR, 'questions.json');

  if (!process.env.NOTION_TOKEN) {
    console.warn('[sync-notion] 沒有設定 NOTION_TOKEN，改用範例假資料（僅供本機開發測試，正式部署前記得在 GitHub Secrets 設定好）。');
    copyFileSync(join(DATA_DIR, 'students.sample.json'), studentsOut);
    copyFileSync(join(DATA_DIR, 'questions.sample.json'), questionsOut);
    return;
  }

  const studentsDbId = process.env.NOTION_STUDENTS_DB_ID;
  const questionsDbId = process.env.NOTION_QUESTIONS_DB_ID;
  if (!studentsDbId || !questionsDbId) {
    throw new Error('[sync-notion] 缺少 NOTION_STUDENTS_DB_ID 或 NOTION_QUESTIONS_DB_ID 環境變數');
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const [students, questions] = await Promise.all([
    syncStudents(notion, studentsDbId),
    syncQuestions(notion, questionsDbId),
  ]);

  writeFileSync(studentsOut, JSON.stringify(students, null, 2));
  writeFileSync(questionsOut, JSON.stringify(questions, null, 2));
  console.log(`[sync-notion] 同步完成：${students.length} 位學生、${questions.length} 道題目`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
