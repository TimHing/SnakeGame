import { GRID_COLS, GRID_ROWS } from '../constants.js';

export function wrapCoord(x, y) {
  return {
    x: ((x % GRID_COLS) + GRID_COLS) % GRID_COLS,
    y: ((y % GRID_ROWS) + GRID_ROWS) % GRID_ROWS,
  };
}

export function cellKey(x, y) {
  return `${x},${y}`;
}

export function randomEmptyCell(occupiedKeys) {
  // 隨機挑一個目前沒有蛇身、也沒有道具佔用的格子；地圖夠大，重試幾次幾乎必定成功
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const x = Math.floor(Math.random() * GRID_COLS);
    const y = Math.floor(Math.random() * GRID_ROWS);
    if (!occupiedKeys.has(cellKey(x, y))) return { x, y };
  }
  return { x: Math.floor(Math.random() * GRID_COLS), y: Math.floor(Math.random() * GRID_ROWS) };
}

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(dirA, dirB) {
  const a = DIRECTIONS[dirA];
  const b = DIRECTIONS[dirB];
  return a.x === -b.x && a.y === -b.y;
}
