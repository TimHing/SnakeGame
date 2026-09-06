import Phaser from 'phaser';
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE, TICK_MS, QUESTION_TRIGGER_CHANCE, WRONG_ANSWER_FREEZE_MS, FOOD_TARGET_RATIO,
} from '../constants.js';
import { Snake } from '../game/snake.js';
import { randomEmptyCell, cellKey } from '../game/grid.js';
import { pickQuestion, recordAnswer } from '../game/questionEngine.js';
import { showQuestion } from '../ui/questionModal.js';

const KEY_DIRECTION_MAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};

const FOOD_TARGET = Math.max(1, Math.floor(GRID_COLS * GRID_ROWS * FOOD_TARGET_RATIO));

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('world');
  }

  init(profile) {
    this.profile = profile;
  }

  create() {
    this.cameras.main.setBackgroundColor('#10131a');
    this.gfx = this.add.graphics();

    const start = randomEmptyCell(new Set());
    this.snake = new Snake(start, 'right');
    this.snake.score = 0;
    this.frozenUntil = 0;
    this.pendingQuestion = false;
    this.lastTick = 0;

    this.foodMap = {};
    this.foodIdCounter = 0;
    this.askedIds = new Set();
    this.tally = { correct: 0, wrong: 0 };
    while (Object.keys(this.foodMap).length < FOOD_TARGET) this.spawnFood();

    this.keyHandler = (e) => {
      const dir = KEY_DIRECTION_MAP[e.key];
      if (dir) this.snake.setDirection(dir);
    };
    window.addEventListener('keydown', this.keyHandler);

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  cleanup() {
    window.removeEventListener('keydown', this.keyHandler);
  }

  update(time) {
    this.render();

    if (this.pendingQuestion) return; // 答題彈窗開著時，暫停移動
    if (time < this.frozenUntil) return; // 答錯後短暫停頓
    if (time - this.lastTick < TICK_MS) return;

    this.lastTick = time;
    this.tickMove();
  }

  tickMove() {
    const { selfCollided } = this.snake.move();
    if (selfCollided) this.cameras.main.flash(200, 255, 90, 90);

    const head = this.snake.head();
    const eatenId = Object.keys(this.foodMap).find((id) => {
      const f = this.foodMap[id];
      return f.x === head.x && f.y === head.y;
    });
    if (eatenId) this.tryEat(eatenId);

    this.maybeSpawnFood();
  }

  spawnFood() {
    const occupied = new Set(this.snake.segments.map((s) => cellKey(s.x, s.y)));
    Object.values(this.foodMap).forEach((f) => occupied.add(cellKey(f.x, f.y)));
    const cell = randomEmptyCell(occupied);
    const id = `f${this.foodIdCounter += 1}`;
    this.foodMap[id] = cell;
  }

  maybeSpawnFood() {
    if (Object.keys(this.foodMap).length < FOOD_TARGET) this.spawnFood();
  }

  async tryEat(foodId) {
    delete this.foodMap[foodId];

    if (Math.random() < QUESTION_TRIGGER_CHANCE) {
      this.pendingQuestion = true;
      const question = pickQuestion(this.askedIds, this.profile.grade, this.profile.subject);

      if (!question) {
        // 題庫是空的（Notion 裡還沒有題目）：當作直接吃到，不卡住遊戲
        this.grantFood();
        this.pendingQuestion = false;
        return;
      }

      const isCorrect = await showQuestion(question);
      recordAnswer(this.tally, isCorrect);
      if (isCorrect) {
        this.grantFood();
      } else {
        this.frozenUntil = this.time.now + WRONG_ANSWER_FREEZE_MS;
      }
      this.pendingQuestion = false;
    } else {
      this.grantFood();
    }
  }

  grantFood() {
    this.snake.grow(1);
    this.snake.score += 1;
    document.getElementById('score-value').textContent = this.snake.score;
  }

  getSessionSummary() {
    return { ...this.tally };
  }

  render() {
    this.gfx.clear();

    this.gfx.fillStyle(0xffcf40, 1);
    Object.values(this.foodMap).forEach((f) => {
      this.gfx.fillCircle(f.x * CELL_SIZE + CELL_SIZE / 2, f.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE * 0.3);
    });

    this.drawSnakeBody(this.snake.segments, 0x4c8bf5);
  }

  drawSnakeBody(segments, color) {
    segments.forEach((seg, i) => {
      const alpha = i === 0 ? 1 : 0.75;
      this.gfx.fillStyle(color, alpha);
      const pad = i === 0 ? 1 : 2;
      this.gfx.fillRoundedRect(
        seg.x * CELL_SIZE + pad, seg.y * CELL_SIZE + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4,
      );
    });
  }
}

export const SCENE_SIZE = { width: GRID_COLS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE };
