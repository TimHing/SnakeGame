export const DEFAULT_MATCH_DURATION_MIN = 5;
export const MIN_MATCH_DURATION_MIN = 1;
export const MAX_MATCH_DURATION_MIN = 20;

export const ROPE_HALF_LENGTH = 3; // 拔河繩端點格數，淨勝 3 題即秒殺獲勝

export const BASE_WEIGHT = 1; // 每題初始抽題權重
export const WEIGHT_WRONG_MULTIPLIER = 1.3; // 答錯一次，該題權重 ×1.3（疊加複利）
export const WEIGHT_CORRECT_MULTIPLIER = 0.7; // 答對一次，該題權重 ×0.7（疊加複利）
export const WEIGHT_FLOOR_RATIO = 0.1; // 權重下限＝初始值的 10%，確保題目不會被完全排除

export const ANSWER_FEEDBACK_MS = 500; // 答題後的對/錯提示停留多久才自動跳下一題
