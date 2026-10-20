# CREDITS — Tài sản & giấy phép

## Hình ảnh

Toàn bộ hình ảnh trong phiên bản hiện tại là **hình khối vector tự tạo**, vẽ trực tiếp bằng Phaser Graphics
hoặc SVG, không sử dụng tài sản của bên thứ ba:

- Robot **Bi-Bốp**: vẽ bằng `Phaser.GameObjects.Graphics` (hình tròn, ăng-ten, mắt) trong
  `src/scenes/levels/LevelBfsDfsScene.ts`.
- Ngọn hải đăng (đích): ngôi sao 5 cánh vẽ bằng `Graphics.fillPoints`.
- Bản đồ thế giới (đảo, trạm, đường nối): vẽ bằng `Graphics` trong `src/scenes/WorldMapScene.ts`.
- `public/favicon.svg`: SVG tự tạo.
- `public/og-default.png`: ảnh 1200×630 tạo bằng script nội bộ (nền chuyển màu + robot hình khối), dùng làm
  ảnh chia sẻ mạng xã hội tạm thời.

Không có hình ảnh, nhân vật, giao diện nào được sao chép từ Roblox, CodeCombat hay bất kỳ game thương mại nào.

## Phông chữ

Dùng phông chữ hệ thống (`system-ui`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`) — không nhúng webfont,
không tải phông từ bên thứ ba, hỗ trợ đầy đủ tiếng Việt có dấu.

## Âm thanh

Chưa có tệp âm thanh nào trong phiên bản này. Khi bổ sung, chỉ dùng tài sản CC0 (ví dụ Kenney.nl) hoặc tự tạo,
và ghi rõ nguồn + giấy phép tại đây.

## Mã nguồn & thư viện

| Thư viện | Giấy phép |
| --- | --- |
| Astro | MIT |
| Phaser 3 | MIT |
| TypeScript | Apache-2.0 |
| Vitest | MIT |
| Wrangler | MIT / Apache-2.0 |

## Nội dung

Toàn bộ văn bản tiếng Việt (nhiệm vụ, gợi ý, câu hỏi, bài học, bài viết SEO) do dự án tự viết.

## Thay thế tài sản sau này

Khi có bộ sprite/âm thanh thật, thêm tệp vào `src/assets/` và khai báo đường dẫn trong
`src/assets/manifest.ts`; các scene chỉ cần đổi từ “vẽ bằng Graphics” sang nạp texture theo manifest,
không phải sửa `core/`, `engine/` hay `levels/`.
