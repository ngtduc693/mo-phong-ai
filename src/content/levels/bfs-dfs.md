---
levelId: bfs-dfs
title: 'BFS và DFS: hai cách để robot tìm đường'
description: 'Học BFS và DFS qua trò chơi: vì sao hàng đợi giúp tìm đường ngắn nhất, còn ngăn xếp khiến robot đi sâu vào một nhánh. Giải thích bằng ví dụ đời thường, kèm các bước thuật toán.'
steps:
  - 'Đặt ô xuất phát vào cấu trúc dữ liệu: hàng đợi với BFS, ngăn xếp với DFS.'
  - 'Lấy một ô ra khỏi cấu trúc dữ liệu và đánh dấu đã xét.'
  - 'Nếu ô đó là đích, truy vết ngược theo "dấu vết" để in ra đường đi và dừng.'
  - 'Nếu chưa phải đích, xét bốn ô kề: ô nào chưa thăm và không phải tường thì thêm vào cấu trúc dữ liệu.'
  - 'Lặp lại đến khi tìm thấy đích hoặc cấu trúc dữ liệu rỗng (không có đường).'
faq:
  - q: 'BFS là gì?'
    a: 'BFS (Breadth-First Search – tìm kiếm theo chiều rộng) là thuật toán duyệt đồ thị theo từng lớp: xét hết các ô cách điểm xuất phát 1 bước, rồi 2 bước, rồi 3 bước… Nó dùng hàng đợi (FIFO) nên luôn xét ô được phát hiện sớm nhất trước.'
  - q: 'DFS là gì?'
    a: 'DFS (Depth-First Search – tìm kiếm theo chiều sâu) là thuật toán đi theo một nhánh đến cùng rồi mới quay lui. Nó dùng ngăn xếp (LIFO) nên luôn xét ô vừa được phát hiện gần nhất, nhờ đó robot "lao" sâu vào một hướng.'
  - q: 'Vì sao BFS luôn tìm được đường ngắn nhất?'
    a: 'Vì BFS duyệt theo lớp khoảng cách. Lần đầu tiên nó chạm tới đích là lúc nó đang xét các ô gần nhất có thể tới đích, nên không tồn tại đường nào ít bước hơn.'
  - q: 'Khi nào nên dùng DFS thay vì BFS?'
    a: 'Khi chỉ cần biết "có đường hay không" hoặc khi muốn tiết kiệm bộ nhớ, vì DFS thường giữ ít ô chờ hơn. Nhưng đường DFS tìm được có thể dài hơn đường ngắn nhất, và nếu đồ thị rất lớn thì nó có thể đi lạc rất lâu.'
  - q: 'Hàng đợi và ngăn xếp khác nhau ở đâu?'
    a: 'Hàng đợi lấy phần tử ở đầu (vào trước ra trước – FIFO), giống xếp hàng mua vé. Ngăn xếp lấy phần tử ở đỉnh (vào sau ra trước – LIFO), giống chồng đĩa: chiếc đĩa đặt sau cùng được lấy ra đầu tiên.'
keywords:
  - BFS
  - DFS
  - thuật toán tìm kiếm
  - hàng đợi
  - ngăn xếp
  - tin học THCS
  - tin học THPT
---

## Hai cách tìm đường, một ý tưởng chung

Hãy tưởng tượng bạn lạc trong một siêu thị lớn và cần tìm quầy bánh mì. Có hai cách: hoặc bạn đi **lần lượt từng dãy kệ gần mình nhất** rồi mở rộng dần ra (giống BFS), hoặc bạn **chọn một dãy và đi tới cuối dãy đó** rồi mới quay lại dãy khác (giống DFS). Cả hai cách đều dùng cùng một nguyên tắc: đánh dấu những chỗ đã đi qua, để không đi lại vô ích.

Máy tính làm việc này bằng cách tổ chức các ô chưa xét vào một **cấu trúc dữ liệu**. Với BFS, cấu trúc đó là **hàng đợi**: ô nào được phát hiện trước thì được xét trước. Với DFS, cấu trúc đó là **ngăn xếp**: ô vừa được phát hiện được xét ngay. Chỉ khác nhau ở chỗ "lấy ô nào ra" mà kết quả đã rất khác: BFS toả đều như vết dầu loang, DFS đi theo một đường như con rắn.

## Vì sao BFS cho đường ngắn nhất

BFS xét hết các ô cách điểm xuất phát 1 bước, rồi 2 bước, rồi 3 bước. Vì vậy khi nó chạm đích lần đầu tiên, đó chính là lúc nó đang xét lớp gần đích nhất — không thể có đường nào ít bước hơn. Đổi lại, BFS phải mở rất nhiều ô, có khi gần như cả bản đồ. Trong màn chơi, bạn sẽ thấy "số ô đã xét" của BFS lớn hơn DFS khá nhiều, nhưng đường đi của BFS luôn ngắn nhất.

## DFS nhanh mà không chắc tối ưu

DFS chỉ cần đi theo một nhánh. Nếu may mắn, nó tới đích sau vài bước và số ô phải xét rất ít. Nhưng nếu nhánh đó là ngõ cụt, nó phải quay lui và thử nhánh khác. Đó là lý do đường DFS tìm được thường dài hơn, và trong trường hợp xấu, DFS có thể lang thang rất lâu. Trong trò chơi, nếu robot đi lòng vòng quá lâu, mô phỏng sẽ dừng và nhắc bạn thử cách khác.

## Liên hệ với thực tế

BFS là nền tảng của tính năng "tìm đường ngắn nhất" trong bản đồ, của việc lan truyền tin nhắn trong mạng xã hội, hay tìm mối quan hệ ít bước nhất giữa hai người. DFS xuất hiện khi máy tính cần duyệt cây thư mục, giải mê cung, hoặc kiểm tra một cấu trúc có vòng lặp hay không. Hiểu hai thuật toán này là bước đầu tiên để hiểu vì sao có những bài toán máy tính giải rất nhanh, còn những bài khác lại rất chậm.
