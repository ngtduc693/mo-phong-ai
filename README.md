# Mô Phỏng AI

Web game 2D tiếng Việt giúp học sinh THCS/THPT hiểu thuật toán và trí tuệ nhân tạo qua từng màn chơi.
Toàn bộ tính toán chạy trên trình duyệt học sinh — không có backend xử lý nặng, không cần đăng nhập.

- Tên miền: https://mophongai.io.vn
- Thế giới 1: **Đảo Robot Thông Minh** (8 màn), mascot là robot **Bi-Bốp** vẽ bằng hình khối trong Phaser.

## Trạng thái

| Giai đoạn | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Kiến trúc, cấu trúc thư mục, lựa chọn phụ thuộc | ✅ xong |
| 1 | Engine chung + Bản đồ thế giới + Màn 1 (BFS/DFS) + trang SEO + cấu hình Cloudflare | ✅ xong (bản này) |
| 2 | Màn 2–4 (A*, gradient descent, K-means) | ⏳ chưa làm |
| 3 | Màn 5–8 (k-NN, cây quyết định, mạng nơ-ron, Q-learning) | ⏳ chưa làm |
| 4 | Blockly, rồi Pyodide trong Web Worker | ⏳ chưa làm |
| 5 | Trang giáo viên nâng cao, tối ưu hiệu năng, ra mắt | ⏳ chưa làm |

## Công nghệ

- **TypeScript strict** (`noUncheckedIndexedAccess`, `noUnusedLocals`, …)
- **Astro 5** (static output) — mỗi màn là một trang HTML tĩnh phục vụ SEO
- **Phaser 3.90** — chỉ nạp **sau khi** học sinh bấm “Chơi” (dynamic import)
- **Vitest** cho lõi thuật toán và bộ điều khiển phát lại
- **Cloudflare Pages / Workers Static Assets** qua `wrangler`

Không dùng UI framework: panel, quiz, biểu đồ viết bằng DOM thuần để giữ bundle nhỏ và có sẵn khả năng tiếp cận.

## Kiến trúc 3 lớp

```
levels/<id>.ts  ──►  engine/  ──►  scenes/  (Phaser)
      │                 │              ▲
      │                 ▼              │
      └──────────►  core/  ───────► ui/ (DOM panels)
```

1. `src/core/` — TypeScript thuần, **không** import Phaser/DOM.
   - `events.ts`: kiểu `Grid`, `SimEvent` (mỗi sự kiện kèm câu `why` tiếng Việt).
   - `rng.ts`: mulberry32 → mọi màn tái lập được với seed.
   - `grid.ts`: sinh bản đồ có seed, **luôn bảo đảm còn đường đi** (khoét trước một đường quanh co rồi rải tường).
   - `pathfinding/search.ts`: generator BFS/DFS phát sự kiện `open` / `visit` / `path` / `noPath` / `done` / `limit`.
   - `pathfinding/searchState.ts`: reducer dựng lại trạng thái tại **bất kỳ** con trỏ nào → nút “Lùi 1 bước” không cần chạy ngược thuật toán; `searchSeries` cho biểu đồ.
2. `src/engine/` — `ReplayController` (Play/Pause/Step/Back/Reset, tốc độ 0.25×–4×), `params` (preset thử thách, tính sao), `storage` (localStorage có try/catch), `levelLoader` (dynamic import theo màn).
3. `src/scenes/` — `Menu/WorldMap`, `LevelBfsDfsScene`, `ResultScene`; `mount.ts` tạo `Phaser.Game` với `Scale.FIT`, `fps.target = 30`, tự lùi về Canvas khi không có WebGL, và `destroy(true)` khi rời trang.
4. `src/ui/` — panel tham số, thanh phát lại, panel giải thích (aria-live), biểu đồ SVG, gợi ý 3 tầng, quiz chặn nhận sao, overlay kết quả, `levelRunner` nối mọi thứ.

Mỗi màn khai báo trong `src/levels/<id>.ts` (`LevelConfig`): tiêu đề, khái niệm, nhiệm vụ, mục tiêu, tham số, 3 thử thách, 3 gợi ý, 3 câu hỏi + giải thích, bài học, luật sao, `createBoard`/`run`/`chart`.
**Thêm màn = thêm file config + scene + file nội dung SEO + 1 dòng trong `levels/registry.ts`**, không sửa engine.

## Chạy dự án

Yêu cầu Node ≥ 20 (khuyến nghị 22, xem `.nvmrc`).

```bash
nvm use            # hoặc cài Node 22
npm install
npm run dev        # http://localhost:4321
npm test           # 29 unit test cho core + engine
npm run check      # astro check (TypeScript toàn dự án)
npm run build      # build tĩnh vào dist/
npm run preview    # xem bản build
```

Mở `http://localhost:4321/thuat-toan/bfs-dfs/`, cuộn xuống “Chơi màn 1” và bấm **Chơi ngay**.

## Kiểm thử

- `src/core/__tests__/search.test.ts`: seed tái lập, BFS tối ưu (so với BFS tham chiếu), DFS không lặp ô, giới hạn bước, không có đường, reducer khi lùi bước, biểu đồ.
- `src/engine/__tests__/engine.test.ts`: trình phát lại (step/back/seek/speed/tick/pause), preset thử thách, tính sao.

## Hiệu năng (số đo trên bản build)

| Tệp | Kích thước | Gzip |
| --- | --- | --- |
| Script trang màn chơi | ~1.1 KB | **~0.65 KB** |
| `levelRunner` (UI màn chơi) | ~21 KB | ~7.5 KB |
| `mount` (Phaser + scenes — **chỉ tải khi bấm Chơi**) | ~1.5 MB | ~345 KB |
| CSS dùng chung | ~14 KB | ~3.5 KB |

- Trang HTML + CSS + script tải lúc mở trang chỉ vài chục KB gzip, đạt mục tiêu “bundle ban đầu < 300 KB”.
- Phaser nằm trong chunk riêng, chỉ tải sau khi người học bấm “Chơi”.
- Phaser chạy `fps.target = 30`; chế độ giảm chuyển động bỏ toàn bộ tween.

## SEO

- `/thuat-toan/<slug>/` sinh tĩnh từ content collection (`src/content/levels/*.md`) + cấu hình màn: H1, ~400 từ lý thuyết, các bước thuật toán, bài học, FAQ, sau đó mới tới khu chơi.
- JSON-LD: `LearningResource`, `FAQPage`, `BreadcrumbList`; trang chủ thêm `WebSite`.
- `canonical`, `hreflang="vi"`, `x-default`, Open Graph, `og-default.png` tự tạo.
- `sitemap.xml` sinh từ endpoint tĩnh `src/pages/sitemap.xml.ts`; `robots.txt`, `llms.txt` viết tay.
- Nội dung đọc được khi tắt JavaScript; game chỉ nạp sau khi bấm nút.

## Bảo mật & quyền riêng tư

- Không thu thập thông tin cá nhân, không cookie theo dõi, không analytics bên thứ ba.
- `public/_headers` đặt CSP chặt (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`), cache 1 năm cho `/_astro/*`.
- `COOP/COEP` **chưa bật** — chỉ cần khi thêm Pyodide ở Giai đoạn 4.
- Tiến trình chỉ nằm trong `localStorage`; nếu trình duyệt chặn, ứng dụng vẫn chơi được (có thông báo).

## Triển khai Cloudflare Pages

```bash
npx wrangler login
npx wrangler pages project create mophongai   # lần đầu
npm run deploy                                # build + wrangler pages deploy dist
```

`wrangler.toml` đã khai báo `pages_build_output_dir = "./dist"`. Trên CI: build command `npm run build`, output `dist`.

## Cấu trúc thư mục

```
src/
  core/        thuật toán thuần + test (không Phaser/DOM)
  engine/      replay controller, params, storage, levelLoader
  scenes/      Menu/WorldMap/Level/Result + mount.ts
  ui/          panel tham số, phát lại, giải thích, biểu đồ, quiz, kết quả
  levels/      types.ts, registry.ts, world1.ts, bfs-dfs.ts
  components/  Layout.astro
  pages/       index, lo-trinh, giao-vien, chinh-sach..., thuat-toan/[slug], sitemap.xml
  content/     nội dung SEO từng màn (markdown)
  i18n/        chuỗi giao diện tiếng Việt (sẵn sàng thêm en)
  assets/      manifest tài sản (placeholder vẽ bằng hình khối)
public/        _headers, _redirects, robots.txt, llms.txt, favicon, og image
```

## Quyết định kỹ thuật đáng chú ý

- **Lùi bước** dựa trên reducer thuần thay vì hoàn tác hiệu ứng hình ảnh → luôn đúng và rẻ.
- **Mọi sự kiện được tính trước** khi bấm Chạy (giới hạn `maxSteps = 2500`), nên không có vòng lặp vô hạn trên main thread.
- **Bản đồ luôn có đường**: `generateGrid` khoét trước một đường đi rồi mới rải tường, nên học sinh không bị kẹt ngoài ý muốn (trừ khi tự đặt tường bịt đích — đó cũng là bài học).
- **Không dùng UI framework**; mọi panel là DOM thuần, có `aria-live`, `aria-pressed`, kích thước chạm ≥ 44px, chữ ≥ 16px.
- Nội dung màn (nhiệm vụ, gợi ý, quiz, bài học) nằm trong `levels/*.ts` vì là dữ liệu màn chơi; chuỗi giao diện chung nằm trong `i18n/vi.ts`.

## Việc còn lại cho Giai đoạn 2

1. Thêm `levels/a-sao.ts`, `levels/gradient-descent.ts`, `levels/k-means.ts` + scene tương ứng, đăng ký trong `registry.ts`.
2. Tổng quát hoá `levelRunner` nếu cần (hiện đã generic qua `LevelConfig`, riêng phần đọc `stats`/`searchSeries` là đặc thù màn 1).
3. Bổ sung trang SEO cho từng màn mới (mỗi màn 1 file markdown).

