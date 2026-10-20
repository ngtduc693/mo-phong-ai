/**
 * Dữ liệu tĩnh của Thế giới 1 — dùng cho bản đồ thế giới, trang /lo-trinh và sitemap.
 * Màn chưa làm vẫn hiện trên bản đồ ở trạng thái "sắp mở".
 */
export interface WorldLevel {
  id: string;
  slug: string;
  order: number;
  title: string;
  concept: string;
  blurb: string;
}

export const WORLD1: WorldLevel[] = [
  {
    id: 'bfs-dfs',
    slug: 'bfs-dfs',
    order: 1,
    title: 'Robot lạc đường',
    concept: 'Tìm kiếm trên đồ thị: BFS và DFS',
    blurb: 'Dạy Bi-Bốp cách lần theo các ô để tìm ngọn hải đăng, và xem hàng đợi khác ngăn xếp thế nào.',
  },
  {
    id: 'a-sao',
    slug: 'a-sao',
    order: 2,
    title: 'Đường đi ngắn nhất',
    concept: 'A* và hàm heuristic',
    blurb: 'Ước lượng đường đi để tìm đích nhanh hơn, và trả giá bằng số ô phải xét.',
  },
  {
    id: 'gradient-descent',
    slug: 'gradient-descent',
    order: 3,
    title: 'Quả bóng xuống thung lũng',
    concept: 'Gradient descent và learning rate',
    blurb: 'Lăn quả bóng xuống đáy thung lũng: học cách chọn bước nhảy vừa phải.',
  },
  {
    id: 'k-means',
    slug: 'k-means',
    order: 4,
    title: 'Gom nhóm sinh vật',
    concept: 'K-means clustering',
    blurb: 'Chia đàn sinh vật thành K nhóm, xem tâm cụm dịch dần sau mỗi vòng.',
  },
  {
    id: 'k-nn',
    slug: 'k-nn',
    order: 5,
    title: 'Hỏi hàng xóm',
    concept: 'k-NN và biên quyết định',
    blurb: 'Quyết định nhãn cho điểm mới dựa trên những hàng xóm gần nhất.',
  },
  {
    id: 'cay-quyet-dinh',
    slug: 'cay-quyet-dinh',
    order: 6,
    title: 'Cây hỏi đáp',
    concept: 'Cây quyết định, entropy và Gini',
    blurb: 'Đặt câu hỏi tách dữ liệu sao cho đám đông trở nên thuần khiết.',
  },
  {
    id: 'mang-no-ron',
    slug: 'mang-no-ron',
    order: 7,
    title: 'Bộ não nhỏ',
    concept: 'Perceptron và mạng nơ-ron 2D',
    blurb: 'Thêm nơ-ron, chọn hàm kích hoạt và nhìn biên phân loại uốn cong.',
  },
  {
    id: 'q-learning',
    slug: 'q-learning',
    order: 8,
    title: 'Robot tự học',
    concept: 'Học tăng cường với Q-learning',
    blurb: 'Cho robot tự đi thử, tự nhận thưởng và dần thuộc đường ngắn nhất.',
  },
];

export function levelBySlug(slug: string): WorldLevel | undefined {
  return WORLD1.find((l) => l.slug === slug);
}
