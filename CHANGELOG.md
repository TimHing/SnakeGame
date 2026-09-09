# Changelog

紀錄每次功能改動的內容、影響檔案與回退方式，方便新版本出問題時能快速找到上一個可用版本。

格式參考 [Keep a Changelog](https://keepachangelog.com/)，版本號對應 `package.json` 的 `version`。

## [Unreleased]

### Added — 觸控滑動方向控制

- 在遊戲畫面上滑動（上/下/左/右）也能操控蛇的方向，與原本畫面右下角的虛擬方向鍵按鈕**並存**，兩者都可以用，互不影響。
- 使用 Phaser 內建的 pointer 事件（`pointerdown`/`pointermove`/`pointerup`/`pointerupoutside`）偵測滑動，滑動距離超過約一格（28px）門檻即觸發轉向；斜向滑動會依位移較大的軸解析成上下或左右。
- Canvas 加上 `touch-action: none`，避免手機瀏覽器在畫布上滑動時觸發頁面捲動/縮放/下拉刷新。

**影響檔案：**
- `src/scenes/WorldScene.js` — 新增 `SWIPE_MIN_DISTANCE` 常數與滑動偵測的 pointer 事件綁定/清理（`create()`、`cleanup()`）
- `src/style.css` — `#phaser-container canvas` 規則加上 `touch-action: none`

**未變動：** 首頁（點名畫面）學生名字順序不是寫在程式碼裡，而是 build 時從 Notion 的「Students」資料庫同步產生；若要調整顯示順序，請直接到 Notion 資料庫調整列順序，不需要改程式碼或部署。

**若此版本出問題想回退：**
```bash
git log --oneline        # 找到本次改動之前的 commit
git revert <本次 commit>  # 或
git checkout <上一個 commit> -- src/scenes/WorldScene.js src/style.css
```
