import { cellKey } from '../core/events';
import { generateGrid } from '../core/grid';
import { runSearchToArray, searchSeries } from '../core/pathfinding/searchState';
import { asNumber, asString } from '../engine/params';
import type { LevelConfig, ParamValues } from './types';

const W = 14;
const H = 10;
const START = cellKey(0, 0);
const GOAL = cellKey(W - 1, H - 1);

function algoOf(params: ParamValues): 'bfs' | 'dfs' {
  return asString(params, 'algo', 'bfs') === 'dfs' ? 'dfs' : 'bfs';
}

const config: LevelConfig = {
  id: 'bfs-dfs',
  slug: 'bfs-dfs',
  order: 1,
  world: 1,
  title: 'Robot lạc đường',
  concept: 'Tìm kiếm trên đồ thị: BFS và DFS',
  mission:
    'Bi-Bốp vừa lăn khỏi tàu và lạc trên Đảo Robot. Nó chỉ nhớ ngọn hải đăng nằm ở góc đảo, còn đường thì quên sạch. Hãy dạy nó cách mở từng ô — bằng hàng đợi hay ngăn xếp, tuỳ bạn.',
  goal: 'Đưa Bi-Bốp tới ngọn hải đăng. Ít ô phải xét hơn thì nhiều sao hơn.',
  params: [
    {
      key: 'algo',
      label: 'Thuật toán tìm kiếm',
      kind: 'segmented',
      def: 'bfs',
      options: [
        { value: 'bfs', label: 'BFS (hàng đợi)' },
        { value: 'dfs', label: 'DFS (ngăn xếp)' },
      ],
      help: 'BFS lấy ô cũ nhất ra trước, DFS lấy ô mới nhất ra trước.',
    },
    {
      key: 'wallDensity',
      label: 'Mật độ tường',
      kind: 'slider',
      min: 0,
      max: 0.35,
      step: 0.01,
      def: 0.16,
      unit: '%',
      help: 'Càng nhiều tường, bản đồ càng rối. Đường đi tới đích luôn được giữ thông.',
    },
    {
      key: 'seed',
      label: 'Bản đồ số',
      kind: 'slider',
      min: 1,
      max: 60,
      step: 1,
      def: 7,
      help: 'Đổi số này để nhận bản đồ khác (cùng số = cùng bản đồ, để so sánh công bằng).',
    },
    {
      key: 'editTool',
      label: 'Công cụ chỉnh bản đồ',
      kind: 'segmented',
      def: 'wall',
      options: [
        { value: 'wall', label: 'Đặt tường' },
        { value: 'goal', label: 'Dời đích' },
      ],
      help: 'Bấm (hoặc chạm) vào ô trên bản đồ để đặt/bỏ tường hoặc dời ngọn hải đăng.',
    },
  ],
  challenges: [
    {
      id: 'easy',
      label: 'Dễ',
      desc: 'Bản đồ thưa, chạy BFS theo hướng dẫn để tới đích.',
      preset: { algo: 'bfs', wallDensity: 0.06, seed: 7 },
    },
    {
      id: 'medium',
      label: 'Vừa',
      desc: 'Tự chọn thuật toán và mật độ tường, cố gắng xét ít ô.',
      preset: { wallDensity: 0.18, seed: 11 },
    },
    {
      id: 'hard',
      label: 'Khó',
      desc: 'Bản đồ rối với mật độ tường cao: quan sát BFS và DFS khác nhau ra sao.',
      preset: { wallDensity: 0.32, seed: 23 },
    },
  ],
  hints: [
    {
      tier: 1,
      title: 'Gợi ý nhẹ',
      text: 'Để ý hai chữ: hàng đợi và ngăn xếp. Robot lấy ô ở đâu ra để xét?',
    },
    {
      tier: 2,
      title: 'Gợi ý vừa',
      text: 'BFS lấy ô ở ĐẦU hàng đợi (ô được phát hiện sớm nhất), DFS lấy ô ở ĐỈNH ngăn xếp (ô vừa được phát hiện).',
    },
    {
      tier: 3,
      title: 'Gợi ý mạnh',
      text: 'Muốn đường ngắn nhất: chọn BFS. Muốn thấy robot lao sâu vào một nhánh: chọn DFS. Để xét ít ô, giảm mật độ tường hoặc thử bản đồ số khác.',
    },
  ],
  quiz: [
    {
      id: 'q1',
      question: 'BFS lấy ô tiếp theo ra khỏi cấu trúc dữ liệu nào?',
      options: ['Hàng đợi (lấy ở đầu – FIFO)', 'Ngăn xếp (lấy ở đỉnh – LIFO)', 'Cây nhị phân tìm kiếm'],
      answer: 0,
      explain: 'BFS dùng hàng đợi: ô nào được phát hiện trước thì được xét trước, nên nó mở ô theo từng "lớp" gần robot.',
    },
    {
      id: 'q2',
      question: 'Vì sao BFS tìm được đường ngắn nhất (tính theo số bước)?',
      options: [
        'Vì nó xét hết các ô cách robot 1 bước, rồi 2 bước, rồi 3 bước… nên gặp đích ở lớp gần nhất',
        'Vì nó chọn ngẫu nhiên ô để đi nên hay gặp đường tắt',
        'Vì nó luôn đi thẳng về phía đích',
      ],
      answer: 0,
      explain: 'BFS duyệt theo lớp khoảng cách. Khi chạm đích lần đầu, đó chính là lớp gần nhất — không có đường nào ngắn hơn.',
    },
    {
      id: 'q3',
      question: 'Nếu robot dùng DFS và đi vào một ngõ cụt, chuyện gì xảy ra?',
      options: [
        'Nó quay lại ô gần nhất còn nhánh chưa thử (nhờ ngăn xếp lưu các ô chờ)',
        'Nó dừng hẳn và báo lỗi',
        'Nó nhảy sang ô xa nhất trên bản đồ',
      ],
      answer: 0,
      explain: 'Ngăn xếp giữ các ô đã phát hiện nhưng chưa xét. Ngõ cụt thì robot lấy ô trên đỉnh ngăn xếp ra và thử hướng khác — đó là "quay lui".',
    },
  ],
  lessons: [
    'BFS mở ô theo từng lớp khoảng cách nên đường tìm được là NGẮN NHẤT.',
    'DFS luôn lấy ô mới nhất ra trước, nên nó lao sâu và đường đi có thể dài hơn.',
    'Khác biệt cốt lõi giữa hai thuật toán chỉ là: hàng đợi (FIFO) hay ngăn xếp (LIFO).',
    'Số ô phải xét càng ít thì thuật toán càng tiết kiệm — đó là điều ta cân nhắc khi chọn thuật toán.',
  ],
  stars: [
    { label: 'Tới được ngọn hải đăng', check: (stats) => stats.pathLen !== null },
    {
      label: 'Xét ít ô (BFS ≤ 140, DFS ≤ 50)',
      check: (stats, params) =>
        stats.pathLen !== null &&
        stats.visited <= (params.algo === 'dfs' ? 50 : 140),
    },
    {
      label: 'Xét rất ít ô (BFS ≤ 110, DFS ≤ 32)',
      check: (stats, params) =>
        stats.pathLen !== null &&
        stats.visited <= (params.algo === 'dfs' ? 32 : 110),
    },
  ],
  maxSteps: 2500,
  defaultSeed: 7,
  createBoard(params: ParamValues, seed: number) {
    const density = asNumber(params, 'wallDensity', 0.16);
    return {
      grid: generateGrid({ w: W, h: H, density, seed, start: START, goal: GOAL }),
      start: START,
      goal: GOAL,
    };
  },
  run({ params, board }) {
    return runSearchToArray({
      grid: board.grid,
      start: board.start,
      goal: board.goal,
      algo: algoOf(params),
      maxSteps: config.maxSteps,
    });
  },
  chart(events) {
    const points = searchSeries(events);
    return {
      series: [
        { label: 'Đã xét', points: points.map((p) => ({ x: p.i, y: p.visited })) },
        { label: 'Đã phát hiện', points: points.map((p) => ({ x: p.i, y: p.opened })) },
      ],
    };
  },
};

export { config };
