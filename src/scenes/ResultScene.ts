import Phaser from 'phaser';

const COLORS = [0xffd166, 0xef7d57, 0x2bb673, 0x4da3ff, 0xf2a7c3, 0xffe08a];

/** Màn ăn mừng: confetti + sao lớn, nằm trên bản đồ đang tạm dừng. */
export class ResultScene extends Phaser.Scene {
  static readonly KEY = 'ResultScene';

  private stars = 0;

  constructor() {
    super({ key: ResultScene.KEY });
  }

  init(data: { stars?: number }): void {
    this.stars = Math.max(0, Math.min(3, data.stars ?? 0));
  }

  create(): void {
    const reduced = Boolean(this.registry.get('reduced-motion'));
    const w = this.scale.width;
    const h = this.scale.height;

    this.add
      .text(w / 2, 64, 'HOÀN THÀNH!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: '#0f7d59',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(w / 2, 118, `${'★'.repeat(this.stars)}${'☆'.repeat(3 - this.stars)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '44px',
        color: '#e8a514',
        stroke: '#6b4a00',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(3);

    if (reduced) return;

    for (let i = 0; i < 46; i += 1) {
      const x = Phaser.Math.Between(20, w - 20);
      const size = Phaser.Math.Between(6, 14);
      const color = COLORS[i % COLORS.length] ?? 0xffd166;
      const piece = this.add.rectangle(x, -20, size, size * 0.65, color, 0.95).setDepth(2);
      this.tweens.add({
        targets: piece,
        y: h + 30,
        x: x + Phaser.Math.Between(-70, 70),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(1200, 2600),
        delay: Phaser.Math.Between(0, 500),
        ease: 'Quad.easeIn',
      });
    }

    const mascot = this.add
      .text(w / 2, 176, '🤖', { fontSize: '40px' })
      .setOrigin(0.5)
      .setDepth(3);
    this.tweens.add({
      targets: mascot,
      y: { from: 168, to: 182 },
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }
}
