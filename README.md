# SnakeG — 教育版單人貪吃蛇

給幾個特定小朋友玩的線上教育遊戲：貪吃蛇玩法 + 隨機跳出學科題目（MVP：乘法口訣）。免密碼點名登入，**每個學生對應自己專屬的題庫**，題庫在 Notion 裡維護；分數跟排行榜存在 Firestore。網站本身是靜態網頁，部署在 GitHub Pages。

詳細設計決策見 `C:\Users\tianx\.claude\plans\githug-project-notion-notion-https-app-twinkly-eich.md`。

## 一、建立 Notion 整合與資料庫

1. 到 [notion.so/my-integrations](https://www.notion.so/my-integrations) 建立一個新的 internal integration，複製它的 secret token（就是後面的 `NOTION_TOKEN`）。
2. 在 Notion 裡建立一個 **Students 索引資料庫**，欄位如下：

   | 欄位 | 型別 | 說明 |
   |---|---|---|
   | `Name`（標題欄） | Title | 學生的名字（人數少、非公開，直接用真名沒問題） |
   | `Questions DB` | URL 或 Rich text | 貼這個學生專屬 Questions 資料庫的網址 |
   | `Active` | Checkbox | 勾選才會出現在點名清單、才會被同步 |

3. 針對**每一個學生**，建立一份專屬的 Questions 資料庫（可以先做一個範本，之後用 Notion 的「複製資料庫」功能複製給新學生）：

   | 欄位 | 型別 | 說明 |
   |---|---|---|
   | `Question`（標題欄） | Title | 題目文字 |
   | `Choice A` / `Choice B` / `Choice C` / `Choice D` | Rich text | 4 個選項 |
   | `Correct Answer` | Select（`A`/`B`/`C`/`D`） | 正確答案 |
   | `Active` | Checkbox | 勾選才會發布出去 |

4. **重要**：在 Students 索引資料庫、以及每一份學生的 Questions 資料庫，右上角 `...` → 連結 (Connections) 都要把剛剛建立的 integration 加進去，不然同步腳本讀不到資料。
5. 回 Students 索引資料庫，把每個學生的 Questions 資料庫網址貼進 `Questions DB` 欄位。
6. 記下 Students 索引資料庫的 ID（網址裡 32 碼那段），這就是 `NOTION_STUDENTS_DB_ID`。

## 二、建立 Firebase 專案（只用 Firestore）

1. [Firebase Console](https://console.firebase.google.com/) 建一個新專案（免費 Spark 方案），或沿用既有的。
2. 左側「數據庫和存儲」→ **Firestore Database** → 建立資料庫（選一個離你近的地區）。**不用**開 Authentication / Hosting / Storage / Realtime Database。
3. 專案設定 → 一般 → 新增一個 Web App，把拿到的設定值貼到 [`src/firebaseConfig.js`](src/firebaseConfig.js)。這組設定值不是密鑰，直接進版本庫沒關係，安全性是靠下面的 Firestore 規則把關。
4. 部署 Firestore 規則（一次性，之後除非改 schema 才需要重跑）：
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```

**已知風險**：`firestore.rules` 目前是完全開放讀寫（沒有做 Firebase Auth），因為這個遊戲只給少數幾個信任的人玩、網址也沒有公開宣傳。如果之後要開放給更多不認識的人，這裡需要重新設計權限。

## 三、設定 GitHub Secrets

Repo → Settings → Secrets and variables → Actions → 新增 2 個 Repository secrets：
- `NOTION_TOKEN`
- `NOTION_STUDENTS_DB_ID`

## 四、啟用 GitHub Pages

Repo → Settings → Pages → Build and deployment → Source 選「**GitHub Actions**」（一次性手動設定，之後不用再碰）。

## 五、第一次匯入題庫

本機建立一個 `.env`（已加進 `.gitignore`，不會被 commit）：

```
NOTION_TOKEN=你的token
```

執行（`<資料庫網址>` 換成某個學生的 Questions 資料庫網址或 ID）：

```bash
npm install
npm run seed:notion-questions -- <資料庫網址>
```

會把 81 題（1~9 × 1~9）乘法口訣種子題目寫進那個學生的 Questions 資料庫，當作起點，之後再自己修改/增減。想幫另一個學生也灌一份，重新指定另一個資料庫網址再跑一次即可。

## 六、日常維護

- **新增學生**：Notion 裡複製一份 Questions 範本資料庫給新學生 → 填題目 → 回 Students 索引資料庫加一列，貼上網址、打勾 `Active`。
- **修改某個學生的題目**：直接去他自己的 Questions 資料庫編輯。
- 網站每小時會自動重新同步一次（GitHub Actions 排程），或想立刻生效：repo 的 Actions 分頁 → 選這個 workflow → 「Run workflow」手動觸發一次。
- 分數、排行榜、答題進度都在 Firestore 裡，不需要手動維護，開 [Firebase Console](https://console.firebase.google.com/) 的 Firestore Database 頁面就能直接看。

## 七、本機開發

```bash
npm install
npm run sync:notion   # 有 .env 就抓真的 Notion 資料，沒有就自動退回範例假資料
npm run dev
```

開 http://localhost:5173/ 即可。

## 專案結構

```
├─ index.html              遊戲入口
├─ src/
│  ├─ scenes/WorldScene.js   主要遊戲場景：移動、碰撞、答題觸發、分數累加
│  ├─ game/
│  │  ├─ snake.js / grid.js     蛇的移動邏輯、座標工具
│  │  ├─ questionEngine.js      抽題演算法（Firestore 記錄每題使用次數，輪抽不重複）
│  │  └─ scoreboard.js          Firestore 讀寫：累積總分、單次高分榜
│  ├─ ui/
│  │  ├─ questionModal.js       答題彈窗
│  │  └─ leaderboard.js         右側排行榜（登入/開始遊玩時刷新一次）
│  ├─ rollcall.js            免密碼點名登入
│  ├─ firebase.js / firebaseConfig.js  只初始化 Firestore
│  └─ data/                  從 Notion 同步下來的 students.json（不進版本庫）＋範例假資料
├─ scripts/
│  ├─ sync-notion.mjs            CI/本機執行：Notion（Students 索引 + 每人的 Questions）→ 靜態 JSON
│  └─ seed-notion-questions.mjs  一次性本機腳本：對指定學生的 Questions 資料庫灌種子題目
├─ firestore.rules / firebase.json / .firebaserc   Firestore 安全規則設定
└─ .github/workflows/deploy.yml   同步 Notion → build → 部署到 GitHub Pages
```

## 已知限制（設計時已確認接受）

- **Firestore 規則完全開放讀寫**，沒有做任何登入驗證——只適合這種「少數信任的人、網址沒公開宣傳」的場景。
- 排行榜只在**登入/開始遊玩那一刻**刷新一次，遊玩途中看到的排行榜是那次登入當下的快照，不會即時更新。
- 高分榜的紀錄只有在點「結束遊玩」時才會寫入；如果直接關掉分頁/瀏覽器，那次遊玩的單次分數不會被記進 top 20（但累積總分是每吃一次食物就即時寫入，不受影響）。
- 點名清單、每個學生的姓名都是**公開網站原始碼的一部分**，任何知道網址的人都看得到。
