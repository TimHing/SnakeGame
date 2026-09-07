import Phaser from 'phaser';
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE, TICK_MS, QUESTION_TRIGGER_CHANCE, WRONG_ANSWER_FREEZE_MS, FOOD_TARGET_RATIO,
} from '../constants.js';
import { Snake } from '../game/snake.js';
import { randomEmptyCell, cellKey, DIRECTIONS } from '../game/grid.js';
import { pickQuestion, recordAnswer } from '../game/questionEngine.js';
import { incrementStudentScore } from '../game/scoreboard.js';
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
    this.tally = { correct: 0, wrong: 0 };
    this.headBounce = 1;
    while (Object.keys(this.foodMap).length < FOOD_TARGET) this.spawnFood();

    this.keyHandler = (e) => {
      const dir = KEY_DIRECTION_MAP[e.key];
      if (dir) this.snake.setDirection(dir);
    };
    window.addEventListener('keydown', this.keyHandler);

    this.dpadButtons = Array.from(document.querySelectorAll('.dpad-btn'));
    this.dpadHandler = (e) => {
      e.preventDefault();
      const dir = e.currentTarget.dataset.dir;
      if (dir) this.snake.setDirection(dir);
    };
    this.dpadButtons.forEach((btn) => btn.addEventListener('pointerdown', this.dpadHandler));

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  cleanup() {
    window.removeEventListener('keydown', this.keyHandler);
    this.dpadButtons?.forEach((btn) => btn.removeEventListener('pointerdown', this.dpadHandler));
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
      const question = await pickQuestion(this.profile.id, this.profile.questions);

      if (!question) {
        // 題庫是空的（Notion 裡還沒有題目）：當作直接吃到，不卡住遊戲
        this.grantFood();
        this.pendingQuestion = false;
        return;
      }

      const isCorrect = await showQuestion(question);
      await recordAnswer(this.profile.id, question, isCorrect);
      if (isCorrect) {
        this.tally.correct += 1;
        this.grantFood();
        this.celebrateCorrectAnswer();
      } else {
        this.tally.wrong += 1;
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
    incrementStudentScore(this.profile.id, this.profile.name, 1).catch(() => {});
    this.showScorePopup();
  }

  showScorePopup() {
    const head = this.snake.head();
    const text = this.add.text(
      head.x * CELL_SIZE + CELL_SIZE / 2,
      head.y * CELL_SIZE,
      '+1',
      { fontSize: '18px', fontStyle: 'bold', color: '#ffcf40' },
    ).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: text,
      y: text.y - 26,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /** 答對題目時的慶祝效果：綠色閃光 + 蛇頭彈跳一下 */
  celebrateCorrectAnswer() {
    this.cameras.main.flash(250, 90, 220, 140);

    this.tweens.addCounter({
      from: 100,
      to: 112,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => { this.headBounce = tween.getValue() / 100; },
      onComplete: () => { this.headBounce = 1; },
    });
  }

  getSessionSummary() {
    return { correct: this.tally.correct, wrong: this.tally.wrong, score: this.snake.score };
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
      if (i === 0) {
        this.drawHead(seg, color);
        return;
      }
      this.gfx.fillStyle(color, 0.75);
      const pad = 2;
      this.gfx.fillRoundedRect(
        seg.x * CELL_SIZE + pad, seg.y * CELL_SIZE + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4,
      );
    });
  }

  /** 蛇頭：比身體更圓、有一雙看向前進方向的眼睛，答對題目時會輕輕彈跳一下 */
  drawHead(seg, color) {
    const scale = this.headBounce;
    const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
    const size = CELL_SIZE * scale;

    this.gfx.fillStyle(color, 1);
    this.gfx.fillRoundedRect(cx - size / 2 + 1, cy - size / 2 + 1, size - 2, size - 2, size * 0.32);

    const dir = DIRECTIONS[this.snake.direction];
    const forward = { x: dir.x * size * 0.2, y: dir.y * size * 0.2 };
    const side = { x: -dir.y * size * 0.22, y: dir.x * size * 0.22 };
    const eyeR = size * 0.11;

    [1, -1].forEach((s) => {
      const ex = cx + forward.x + side.x * s;
      const ey = cy + forward.y + side.y * s;
      this.gfx.fillStyle(0xffffff, 1);
      this.gfx.fillCircle(ex, ey, eyeR);
      this.gfx.fillStyle(0x10131a, 1);
      this.gfx.fillCircle(ex + dir.x * size * 0.05, ey + dir.y * size * 0.05, eyeR * 0.5);
    });
  }
}

export const SCENE_SIZE = { width: GRID_COLS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE };
