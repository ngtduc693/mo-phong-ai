/**
 * Bộ điều khiển phát lại dùng chung cho mọi màn.
 *
 * Ý tưởng: thuật toán đã được chạy trọn vẹn thành một mảng sự kiện (xem engine/runLevel),
 * nên "Play / Pause / Step / Lùi 1 bước / Đổi tốc độ / Reset" chỉ là di chuyển con trỏ.
 * Nhờ vậy lùi bước không cần chạy ngược thuật toán và luôn tái lập được.
 *
 * Lớp này KHÔNG import Phaser/DOM: scene hoặc UI tự đăng ký lắng nghe.
 */

export type ReplayStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface ReplayOptions {
  /** Thời lượng mong muốn của cả lượt chạy ở tốc độ 1x (mili giây). */
  spanMs?: number;
  /** Gọi mỗi khi con trỏ đổi: cursor = số sự kiện đã áp dụng. */
  onCursor?: (cursor: number, total: number) => void;
  onStatus?: (status: ReplayStatus) => void;
}

export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
export type ReplaySpeed = (typeof SPEEDS)[number];

export class ReplayController {
  readonly total: number;
  private cursorIndex = 0;
  private statusValue: ReplayStatus = 'idle';
  private speedValue = 1;
  private carry = 0;
  private readonly spanMs: number;
  private readonly onCursor?: (cursor: number, total: number) => void;
  private readonly onStatus?: (status: ReplayStatus) => void;

  constructor(total: number, options: ReplayOptions = {}) {
    this.total = total;
    this.spanMs = options.spanMs ?? 9000;
    this.onCursor = options.onCursor;
    this.onStatus = options.onStatus;
  }

  get cursor(): number {
    return this.cursorIndex;
  }

  get status(): ReplayStatus {
    return this.statusValue;
  }

  get speed(): number {
    return this.speedValue;
  }

  /** Số sự kiện mỗi giây ở tốc độ 1x (tự co giãn để lượt chạy không quá dài). */
  private get rate(): number {
    const target = Math.max(1, this.total / (this.spanMs / 1000));
    return Math.min(45, Math.max(3, target));
  }

  private setStatus(next: ReplayStatus): void {
    if (this.statusValue === next) return;
    this.statusValue = next;
    this.onStatus?.(next);
  }

  private emit(): void {
    this.onCursor?.(this.cursorIndex, this.total);
  }

  play(): void {
    if (this.total === 0) return;
    if (this.cursorIndex >= this.total) this.reset();
    this.setStatus('playing');
  }

  pause(): void {
    if (this.statusValue === 'playing') this.setStatus('paused');
  }

  toggle(): void {
    if (this.statusValue === 'playing') this.pause();
    else this.play();
  }

  /** Tiến đúng một sự kiện, tạm dừng phát tự động. */
  step(): void {
    if (this.statusValue === 'playing') this.setStatus('paused');
    if (this.cursorIndex >= this.total) {
      this.setStatus('finished');
      return;
    }
    this.cursorIndex += 1;
    this.carry = 0;
    if (this.statusValue === 'idle') this.setStatus('paused');
    this.emit();
    if (this.cursorIndex >= this.total) this.setStatus('finished');
  }

  /** Lùi đúng một sự kiện (UI sẽ dựng lại trạng thái tại con trỏ mới). */
  back(): void {
    if (this.cursorIndex <= 0) return;
    if (this.statusValue === 'playing') this.setStatus('paused');
    if (this.statusValue === 'finished') this.setStatus('paused');
    this.cursorIndex -= 1;
    this.carry = 0;
    this.emit();
  }

  seek(index: number): void {
    const next = Math.max(0, Math.min(this.total, Math.trunc(index)));
    if (next === this.cursorIndex) return;
    this.cursorIndex = next;
    this.carry = 0;
    this.emit();
  }

  reset(): void {
    this.cursorIndex = 0;
    this.carry = 0;
    this.setStatus('idle');
    this.emit();
  }

  setSpeed(speed: number): void {
    this.speedValue = Math.max(0.25, Math.min(4, speed));
  }

  /** Gọi mỗi khung hình (scene.update hoặc requestAnimationFrame). */
  tick(deltaMs: number): void {
    if (this.statusValue !== 'playing') return;
    this.carry += (deltaMs / 1000) * this.rate * this.speedValue;
    let steps = Math.floor(this.carry);
    if (steps <= 0) return;
    this.carry -= steps;
    while (steps > 0 && this.cursorIndex < this.total) {
      this.cursorIndex += 1;
      steps -= 1;
    }
    this.emit();
    if (this.cursorIndex >= this.total) this.setStatus('finished');
  }
}
