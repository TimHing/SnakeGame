export const GRID_COLS = 30;
export const GRID_ROWS = 20;
export const CELL_SIZE = 24; // px

export const TICK_MS = 180; // 固定移動速度，不隨蛇變長加快

export const INITIAL_LENGTH = 3;
export const SELF_COLLISION_PENALTY = 3; // 自撞扣 3 節
export const MIN_LENGTH = 2; // 扣到底不再扣
export const SELF_COLLISION_INVINCIBLE_MS = 1000; // 自撞後 1 秒無敵冷卻

export const QUESTION_TRIGGER_CHANCE = 0.4; // 吃道具時觸發題目的機率
export const WRONG_ANSWER_FREEZE_MS = 600; // 答錯後短暫停頓
export const CORRECT_FEEDBACK_MS = 600; // 答對後彈窗停留多久才關閉
export const WRONG_FEEDBACK_MS = 1100; // 答錯後彈窗停留多久才關閉（比答對久一點，讓學生看清楚正確答案）

export const CORRECT_ANSWER_SCORE = 3; // 答對題目加分
export const WRONG_ANSWER_PENALTY = 2; // 答錯題目扣分
export const QUESTION_TIMEOUT_MS = 4000; // 抽題若卡住太久（網路問題），最多等這麼久就放行，避免遊戲卡死

export const RETRY_WRONG_CHANCE = 0.5; // 有「錯得比對得多」的題目時，優先抽到它們複習的機率

export const FOOD_TARGET_RATIO = 0.02; // 場上食物數量目標＝地圖格數的 2%
