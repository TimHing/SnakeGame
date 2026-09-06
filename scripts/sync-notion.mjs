// 從 Notion 抓「Students 索引資料庫」+ 每個學生自己的「Questions 資料庫」，
// 烘焙成一份巢狀的 src/data/students.json 給遊戲打包用。
// 只在 GitHub Actions build 時、或本機手動執行時跑；瀏覽器端的遊戲程式碼永遠不會直接呼叫 Notion API。
//
// 沒有設定 NOTION_TOKEN 時（例如剛 clone 下來還沒申請 Notion integration），
// 會改用 src/data/students.sample.json 這組範例假資料，方便直接 `npm run dev` 測試畫面邏輯。
import 'dotenv/config';
import { Client } from '@notionhq/client';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const ANSWER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function getTitle(prop) {
  return (prop?.title || []).map((t) => t.plain_text).join('').trim();
}
function getRichText(prop) {
  return (prop?.rich_text || []).map((t) => t.plain_text).join('').trim();
}
function getSelectName(prop) {
  return prop?.select?.name;
}
function getUrlOrText(prop) {
  if (!prop) return '';
  if (prop.type === 'url') return prop.url || '';
  if (prop.type === 'rich_text') return getRichText(prop);
  return '';
}
function extractDatabaseId(raw) {
  const match = (raw || '').replace(/-/g, '').match(/[0-9a-f]{32}/i);
  return match ? match[0] : null;
}

function fail(message, page) {
  const url = page?.url ? `\n頁面網址：${page.url}` : '';
  throw new Error(`[sync-notion] ${message}${url}`);
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

async function syncStudentQuestions(notion, databaseId, studentLabel) {
  const pages = await queryAllActive(notion, databaseId);
  return pages.map((page) => {
    const question = getTitle(page.properties.Question);
    const choices = [
      getRichText(page.properties['Choice A']),
      getRichText(page.properties['Choice B']),
      getRichText(page.properties['Choice C']),
      getRichText(page.properties['Choice D']),
    ];
    const answer = getSelectName(page.properties['Correct Answer']);

    if (!question) fail(`${studentLabel} 的題庫有一列缺少 Question（標題欄）`, page);
    if (choices.some((c) => !c)) fail(`${studentLabel} 的題目「${question}」4 個選項必須全部填寫`, page);
    if (!(answer in ANSWER_INDEX)) fail(`${studentLabel} 的題目「${question}」Correct Answer 必須是 A/B/C/D 其中一個`, page);

    return {
      id: page.id, question, choices, correctIndex: ANSWER_INDEX[answer],
    };
  });
}

async function syncStudents(notion, studentsDbId) {
  const pages = await queryAllActive(notion, studentsDbId);
  const students = [];
  for (const page of pages) {
    const name = getTitle(page.properties.Name);
    const dbRaw = getUrlOrText(page.properties['Questions DB']);
    const questionsDbId = extractDatabaseId(dbRaw);
    const pin = getRichText(page.properties.PIN);

    if (!name) fail('學生列缺少 Name（標題欄）', page);
    if (!questionsDbId) fail(`學生「${name}」的 Questions DB 欄位看不出有效的 Notion 資料庫網址/ID`, page);

    // 依序處理（不平行）：Notion API 有速率限制，學生數量預期很少，順序執行更穩妥。
    // eslint-disable-next-line no-await-in-loop
    const questions = await syncStudentQuestions(notion, questionsDbId, `學生「${name}」`);
    students.push({
      id: page.id, name, pin: pin || null, questions,
    });
  }
  return students;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const studentsOut = join(DATA_DIR, 'students.json');

  if (!process.env.NOTION_TOKEN) {
    console.warn('[sync-notion] 沒有設定 NOTION_TOKEN，改用 students.sample.json 的範例假資料（僅供本機開發測試，正式部署前記得在 GitHub Secrets 設定好）。');
    copyFileSync(join(DATA_DIR, 'students.sample.json'), studentsOut);
    return;
  }

  const studentsDbId = process.env.NOTION_STUDENTS_DB_ID;
  if (!studentsDbId) {
    throw new Error('[sync-notion] 缺少 NOTION_STUDENTS_DB_ID 環境變數');
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const students = await syncStudents(notion, studentsDbId);

  writeFileSync(studentsOut, JSON.stringify(students, null, 2));
  const totalQuestions = students.reduce((sum, s) => sum + s.questions.length, 0);
  console.log(`[sync-notion] 同步完成：${students.length} 位學生，共 ${totalQuestions} 道題目`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
