import { WorldMapScene } from './WorldMapScene';

/** Màn tiêu đề ngắn gọn; nút "Bắt đầu" mở bản đồ thế giới. */
export class MenuScene extends Phaser.Scene {
  static readonly KEY = 'MenuScene';

  constructor() {
    super({ key: MenuScene.KEY });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor('#dff2ff');

    const g = this.add.graphics();
    g.fillStyle(0xbfe8d8, 1);
    g.fillRoundedRect(16, 16, w - 32, h - 32, 28);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(w - 120, 90, 46);
    g.fillCircle(120, h - 110, 34);

    this.add
      .text(w / 2, 96, 'Mô Phỏng AI', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '46px',
        color: '#0f7d59',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 148, 'Đảo Robot Thông Minh', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#47616e',
      })
      .setOrigin(0.5);

    this.add.text(w / 2, 250, '🤖', { fontSize: '86px' }).setOrigin(0.5);

    const button = this.add
      .rectangle(w / 2, 380, 260, 64, 0x0f7d59)
      .setStrokeStyle(3, 0x0a6246)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(w / 2, 380, 'Bắt đầu →', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const go = () => this.scene.start(WorldMapScene.KEY);
    button.on('pointerover', () => button.setFillStyle(0x0a6246));
    button.on('pointerout', () => button.setFillStyle(0x0f7d59));
    button.on('pointerup', go);
    label.setInteractive({ useHandCursor: true }).on('pointerup', go);

    this.add
      .text(w / 2, 440, 'Dùng chuột/chạm, hoặc nhấn Enter để bắt đầu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#47616e',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-ENTER', go);
    this.input.keyboard?.on('keydown-SPACE', go);
  }
}
