// 把 Snake Game 已經從 Notion 同步好的學生/題庫資料複製進來給拔河遊戲打包用。
// 純唯讀複製：不會呼叫 Notion API、不會新增 Notion 資料庫、也不會動到根目錄的任何檔案。
// 優先用根目錄真正同步好的 src/data/students.json；
// 本機開發還沒設定 Notion 金鑰時，退回使用根目錄既有的 students.sample.json（同一份範例假資料，不重複維護）。
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DATA_DIR = join(__dirname, '..', '..', 'src', 'data');
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'students.json');

mkdirSync(OUT_DIR, { recursive: true });

const realFile = join(ROOT_DATA_DIR, 'students.json');
const sampleFile = join(ROOT_DATA_DIR, 'students.sample.json');
const source = existsSync(realFile) ? realFile : sampleFile;

copyFileSync(source, OUT_FILE);
console.log(`[tug-of-war] 已從 ${source} 複製學生/題庫資料`);
