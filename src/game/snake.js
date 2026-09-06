import { DIRECTIONS, isOpposite, wrapCoord } from './grid.js';
import { INITIAL_LENGTH, SELF_COLLISION_PENALTY, MIN_LENGTH, SELF_COLLISION_INVINCIBLE_MS } from '../constants.js';

export class Snake {
  constructor(startCell, direction = 'right') {
    this.direction = direction;
    this.pendingDirection = direction;
    this.growPending = 0;
    this.invincibleUntil = 0;
    this.score = 0;

    // 初始蛇身往移動方向的反方向排列
    const back = DIRECTIONS[direction];
    this.segments = [];
    for (let i = 0; i < INITIAL_LENGTH; i += 1) {
      this.segments.push(wrapCoord(startCell.x - back.x * i, startCell.y - back.y * i));
    }
  }

  setDirection(dir) {
    if (!DIRECTIONS[dir]) return;
    if (isOpposite(dir, this.direction)) return; // 禁止直接 180 度掉頭
    this.pendingDirection = dir;
  }

  grow(n = 1) {
    this.growPending += n;
  }

  isInvincible() {
    return Date.now() < this.invincibleUntil;
  }

  head() {
    return this.segments[0];
  }

  /** 前進一格。回傳 { selfCollided } */
  move() {
    this.direction = this.pendingDirection;
    const head = this.segments[0];
    const delta = DIRECTIONS[this.direction];
    const newHead = wrapCoord(head.x + delta.x, head.y + delta.y);

    const willGrow = this.growPending > 0;
    // 如果這步不成長，尾巴這一格會空出來，撞進去不算自撞
    const bodyToCheck = willGrow ? this.segments : this.segments.slice(0, -1);
    const selfHit = bodyToCheck.some((seg) => seg.x === newHead.x && seg.y === newHead.y);

    this.segments.unshift(newHead);
    if (willGrow) {
      this.growPending -= 1;
    } else {
      this.segments.pop();
    }

    let selfCollided = false;
    const now = Date.now();
    if (selfHit && now >= this.invincibleUntil) {
      selfCollided = true;
      const removable = this.segments.length - MIN_LENGTH;
      const removeCount = Math.max(0, Math.min(SELF_COLLISION_PENALTY, removable));
      if (removeCount > 0) this.segments.splice(this.segments.length - removeCount, removeCount);
      this.invincibleUntil = now + SELF_COLLISION_INVINCIBLE_MS;
    }

    return { selfCollided };
  }
}
