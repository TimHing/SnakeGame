# SnakeG — 教育版單人貪吃蛇

給小學生玩的線上教育遊戲：貪吃蛇玩法 + 隨機跳出學科題目（MVP：二年級乘法口訣）。免密碼點名登入，題庫跟學生名單都在 Notion 裡管理，網站本身是靜態網頁，部署在 GitHub Pages。

詳細設計決策見 `C:\Users\tianx\.claude\plans\githug-project-notion-notion-https-app-twinkly-eich.md`。

## 一、建立 Notion 整合與兩個資料庫

1. 到 [notion.so/my-integrations](https://www.notion.so/my-integrations) 建立一個新的 internal integration，複製它的 secret token（就是後面的 `NOTION_TOKEN`）。
2. 在你的 Notion 頁面（[這個 Snake Game 頁面](https://app.notion.com/p/Snake-Game-3d34d146e57f80c49128e9f67ac74c3c)）底下建立兩個資料庫，欄位如下：

   **Students（學生名單）**
   | 欄位 | 型別 | 說明 |
   |---|---|---|
   | `Code`（標題欄） | Title | 公開暱稱/代號，例如 `2年A班-05`。**不可放真實姓名**——這份清單會被打包進公開網站的原始碼 |
   | `Real Name` | Rich text | 給自己備查用，不會被同步出去 |
   | `Grade` | Number | 對應 `src/curriculum.js` 的 `GRADES`（目前只有 `2`） |
   | `Subject` | Select | 選項名稱要跟 `src/curriculum.js` 的 `SUBJECTS[].value` 完全一致（目前是 `multiplication`） |
   | `Active` | Checkbox | 勾選才會出現在點名清單裡 |

   **Questions（題庫）**
   | 欄位 | 型別 | 說明 |
   |---|---|---|
   | `Question`（標題欄） | Title | 題目文字 |
   | `Grade` / `Subject` | Number / Select | 同上 |
   | `Choice A` / `Choice B` / `Choice C` / `Choice D` | Rich text | 4 個選項 |
   | `Correct Answer` | Select（`A`/`B`/`C`/`D`） | 正確答案 |
   | `Active` | Checkbox | 勾選才會發布出去 |

3. **重要**：在每個資料庫頁面右上角 `...` → `連結` (Connections) 把剛剛建立的 integration 加進去，不然同步腳本讀不到資料。
4. 分別記下兩個資料庫的 ID（網址裡 32 碼那段），這就是 `NOTION_STUDENTS_DB_ID` 和 `NOTION_QUESTIONS_DB_ID`。

## 二、設定 GitHub Secrets

Repo → Settings → Secrets and variables → Actions → 新增 3 個 Repository secrets：
- `NOTION_TOKEN`
- `NOTION_STUDENTS_DB_ID`
- `NOTION_QUESTIONS_DB_ID`

## 三、啟用 GitHub Pages

Repo → Settings → Pages → Build and deployment → Source 選「**GitHub Actions**」（一次性手動設定，之後不用再碰）。

## 四、第一次匯入題庫

本機建立一個 `.env`（已加進 `.gitignore`，不會被 commit）：

```
NOTION_TOKEN=你的token
NOTION_QUESTIONS_DB_ID=你的Questions資料庫ID
```

執行：

```bash
npm install
npm run seed:notion-questions
```

會把 81 題（1~9 × 1~9）乘法口訣種子題目直接寫進 Notion 的 Questions 資料庫。想要不同的干擾選項，重新跑一次就會再產生一份新的（記得手動刪掉舊的，這支腳本只會新增不會覆蓋）。

## 五、新增學生名單

直接在 Notion 的 Students 資料庫裡手動加列，`Code` 填暱稱/代號、`Grade`/`Subject` 選好、`Active` 打勾即可，不需要跑任何腳本。

## 六、日常維護

之後題庫或學生名單有異動，**只需要在 Notion 裡編輯**：
- 網站每小時會自動重新同步一次（GitHub Actions 排程），或
- 想立刻生效：repo 的 Actions 分頁 → 選這個 workflow → 「Run workflow」手動觸發一次。

不需要碰程式碼、不需要重新部署。

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
├─ src/                    原始碼（Phaser 遊戲、點名登入、UI）
│  ├─ scenes/WorldScene.js 主要遊戲場景：移動、碰撞、答題觸發
│  ├─ game/                遊戲邏輯模組（snake、grid、questionEngine）
│  ├─ ui/                  DOM 疊加介面（答題彈窗）
│  ├─ rollcall.js          免密碼點名登入
│  └─ data/                從 Notion 同步下來的 students.json / questions.json（不進版本庫）＋範例假資料
├─ scripts/
│  ├─ sync-notion.mjs            CI/本機執行：Notion → 靜態 JSON
│  └─ seed-notion-questions.mjs  一次性本機腳本：產生種子題目寫進 Notion
└─ .github/workflows/deploy.yml  同步 Notion → build → 部署到 GitHub Pages
```

## 已知限制（設計時已確認接受）

- **答題進度只在單次遊玩期間統計**（點「結束遊玩」時看得到這次的答對/答錯次數），重新整理頁面或下次登入就會重置，不會跨裝置/跨次數保存，也不會回寫到 Notion——這是為了不架設任何額外的伺服器/代理服務所做的取捨。
- **沒有多人即時同步**，每個學生各玩各的，沒有排行榜——Notion 技術上做不到即時推播，跟原本每 180ms 同步一次的多人玩法不相容。
- 點名清單用暱稱/代號而不是真實姓名，但這份清單仍然是**公開網站原始碼的一部分**，任何知道網址的人都看得到（暱稱本身、不含真實姓名）。
- 目前只鎖定二年級乘法口訣一種年級/科目組合（`src/curriculum.js` 可擴充）。
