export interface MapLevel {
  id: string;
  title: string;
  locked: boolean;
  implemented: boolean;
  stars: number;
}

export interface MapContext {
  levels: MapLevel[];
  onSelect: (id: string) => void;
}

const POSITIONS: Array<[number, number]> = [
  [140, 215],
  [366, 190],
  [592, 225],
  [818, 195],
  [818, 415],
  [592, 440],
  [366, 405],
  [140, 430],
];

export class WorldMapScene extends Phaser.Scene {
  static readonly KEY = 'WorldMap';

  private ctx!: MapContext;
  private selected = 0;
  private cursorRing!: Phaser.GameObjects.Arc;
  private hint!: Phaser.GameObjects.Text;
  private stations: Array<{ x: number; y: number; level: MapLevel; open: () => void }> = [];

  constructor() {
    super({ key: WorldMapScene.KEY });
  }

  init(): void {
    this.ctx = this.registry.get('map-ctx') as MapContext;
    this.stations = [];
    const firstOpen = this.ctx.levels.findIndex((l) => !l.locked && l.implemented);
    this.selected = firstOpen >= 0 ? firstOpen : 0;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor('#cdeeff');

    const sea = this.add.graphics();
    sea.fillStyle(0x9fdcf6, 1);
    sea.fillRect(0, 0, w, h);
    sea.fillStyle(0xbfeaf9, 0.7);
    for (let i = 0; i < 12; i += 1) {
      sea.fillEllipse(60 + ((i * 173) % (w - 120)), 150 + ((i * 89) % (h - 220)), 120, 26);
    }

    this.add
      .text(28, 22, 'Đảo Robot Thông Minh', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: '#12303f',
        fontStyle: 'bold',
      })
      .setDepth(2);
    this.add
      .text(30, 56, 'Chọn một trạm để chơi. Màn sau mở khi bạn qua màn trước.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#31586b',
      })
      .setDepth(2);

    this.drawRoute();

    this.ctx.levels.forEach((level, index) => {
      const pos = POSITIONS[index] ?? [100 + index * 90, 300];
      this.drawStation(index, pos[0], pos[1], level);
    });

    this.cursorRing = this.add.circle(0, 0, 46).setStrokeStyle(4, 0x1d4ed8, 0.95).setFillStyle(0xffffff, 0);
    this.hint = this.add
      .text(w / 2, h - 26, 'Dùng ← → ↑ ↓ rồi Enter, hoặc bấm/chạm vào trạm.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#12303f',
      })
      .setOrigin(0.5, 0.5);

    this.updateCursor();
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.onKey(event));
  }

  private drawRoute(): void {
    const line = this.add.graphics();
    line.lineStyle(4, 0xffffff, 0.75);
    for (let i = 0; i < POSITIONS.length - 1; i += 1) {
      const a = POSITIONS[i];
      const b = POSITIONS[i + 1];
      if (!a || !b) continue;
      line.lineBetween(a[0], a[1], b[0], b[1]);
    }
  }

  private drawStation(index: number, x: number, y: number, level: MapLevel): void {
    const open = !level.locked && level.implemented;
    const sand = this.add.ellipse(x, y + 18, 132, 54, 0xf3dfa8);
    sand.setDepth(1);

    const color = open ? 0x0f7d59 : level.implemented ? 0x7c8b94 : 0x9a8464;
    const circle = this.add.circle(x, y, 38, color).setStrokeStyle(4, 0xffffff, 0.95).setDepth(2);
    circle.setInteractive({ useHandCursor: open });

    const inside = open ? String(index + 1) : level.implemented ? '🔒' : '…';
    this.add
      .text(x, y - 1, inside, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    const label = this.add
      .text(x, y + 52, level.title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#12303f',
        backgroundColor: '#ffffffcc',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(
        x,
        y + 84,
        open ? '★'.repeat(level.stars) + '☆'.repeat(3 - level.stars) : level.implemented ? 'Chưa mở' : 'Sắp mở',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: open ? '#8a6300' : '#47616e',
        },
      )
      .setOrigin(0.5)
      .setDepth(3);

    const choose = () => {
      this.selected = index;
      this.updateCursor();
      if (open) this.ctx.onSelect(level.id);
      else
        this.showHint(
          level.implemented ? 'Màn này chưa mở — hãy hoàn thành màn trước nhé!' : 'Màn này đang được Bi-Bốp xây dựng.',
        );
    };

    circle.on('pointerup', choose);
    label.setInteractive({ useHandCursor: open }).on('pointerup', choose);

    this.stations.push({ x, y, level, open: choose });
  }

  private showHint(message: string): void {
    this.hint.setText(message);
    this.hint.setColor('#b3261e');
    this.tweens.add({ targets: this.hint, scale: { from: 1.06, to: 1 }, duration: 180 });
    this.time.delayedCall(2200, () => {
      this.hint.setText('Dùng ← → ↑ ↓ rồi Enter, hoặc bấm/chạm vào trạm.');
      this.hint.setColor('#12303f');
    });
  }

  private updateCursor(): void {
    const station = this.stations[this.selected];
    if (!station) return;
    this.cursorRing.setPosition(station.x, station.y);
  }

  private onKey(event: KeyboardEvent): void {
    const total = this.stations.length;
    if (total === 0) return;
    let next = this.selected;
    if (event.key === 'ArrowRight') next = (this.selected + 1) % total;
    else if (event.key === 'ArrowLeft') next = (this.selected - 1 + total) % total;
    else if (event.key === 'ArrowDown') next = Math.min(total - 1, this.selected + 4);
    else if (event.key === 'ArrowUp') next = Math.max(0, this.selected - 4);
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.stations[this.selected]?.open();
      return;
    } else {
      return;
    }
    event.preventDefault();
    this.selected = next;
    this.updateCursor();
  }
}

