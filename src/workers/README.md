# src/workers — sandbox cho mã người học (Giai đoạn 4)

Thư mục này để trống có chủ đích ở Giai đoạn 1. Khi làm Blockly/Pyodide:

- Mã học sinh **chỉ** chạy trong Web Worker (`sandbox.worker.ts`), không bao giờ `eval` trên main thread.
- Worker nhận `{ code, params, maxSteps, timeLimitMs }`, chạy mô phỏng bằng `core/`, trả về mảng `SimEvent`.
- Có giới hạn thời gian (timeout) và số bước; vượt thì trả về sự kiện `limit` với thông báo thân thiện.
- Pyodide nạp lazy, hiển thị tiến độ tải; chỉ khi đó mới bật COOP/COEP trong `public/_headers`.
- Kết quả trả về phải qua cùng `ReplayController` như hiện tại, nên UI/scene không cần thay đổi.
