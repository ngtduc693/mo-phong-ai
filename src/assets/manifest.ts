/**
 * Manifest tài sản (asset manifest).
 *
 * Hiện tại mọi hình ảnh được vẽ bằng hình khối Phaser/SVG nên `src` là null.
 * Khi có sprite thật (CC0 hoặc tự tạo), điền đường dẫn vào đây rồi cho scene nạp texture
 * theo `key` — không phải sửa core/engine/levels.
 */
export interface AssetEntry {
  key: string;
  /** Đường dẫn tương đối trong public/, null = đang dùng placeholder vẽ bằng code. */
  src: string | null;
  note: string;
}

export const SPRITE_MANIFEST: AssetEntry[] = [
  { key: 'robot', src: null, note: 'Bi-Bốp – hiện vẽ bằng Graphics trong LevelBfsDfsScene' },
  { key: 'goal', src: null, note: 'Ngọn hải đăng/ngôi sao đích – vẽ bằng Graphics' },
  { key: 'wall', src: null, note: 'Ô tường – dùng Rectangle màu nâu' },
  { key: 'island', src: null, note: 'Đảo trên bản đồ thế giới – vẽ bằng Ellipse' },
];

export const AUDIO_MANIFEST: AssetEntry[] = [
  { key: 'click', src: null, note: 'Chưa có âm thanh; mặc định tắt tiếng' },
  { key: 'win', src: null, note: 'Dự kiến dùng CC0 (Kenney) hoặc tự tạo bằng WebAudio' },
];
