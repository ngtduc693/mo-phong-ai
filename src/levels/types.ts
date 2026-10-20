import type { CellKey, Grid, RunStats, SimEvent } from '../core/events';

export type ParamValue = number | string | boolean;
export type ParamValues = Record<string, ParamValue>;

export interface ParamOption {
  value: string;
  label: string;
  hint?: string;
}

export type ParamDef =
  | {
      key: string;
      label: string;
      kind: 'slider';
      min: number;
      max: number;
      step: number;
      def: number;
      unit?: string;
      help?: string;
    }
  | {
      key: string;
      label: string;
      kind: 'select' | 'segmented';
      options: ParamOption[];
      def: string;
      help?: string;
    }
  | {
      key: string;
      label: string;
      kind: 'toggle';
      def: boolean;
      help?: string;
    };

export type ChallengeId = 'easy' | 'medium' | 'hard';

export interface ChallengeDef {
  id: ChallengeId;
  label: string;
  desc: string;
  preset: ParamValues;
}

export interface HintDef {
  tier: 1 | 2 | 3;
  title: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Chỉ số đáp án đúng trong options. */
  answer: number;
  explain: string;
}

export interface StarRule {
  label: string;
  check: (stats: RunStats, params: ParamValues) => boolean;
}

/** Trạng thái bàn chơi: học sinh có thể sửa tường/đích nên runner giữ bản sao. */
export interface BoardState {
  grid: Grid;
  start: CellKey;
  goal: CellKey;
}

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartSeries {
  label: string;
  points: ChartPoint[];
}

/** Dữ liệu cho biểu đồ nhỏ (tối đa 2 đường). */
export interface ChartData {
  series: ChartSeries[];
}

export interface RunInput {
  params: ParamValues;
  seed: number;
  board: BoardState;
}

/**
 * Cấu hình màn chơi: chỉ dữ liệu + 2 hàm thuần.
 * Thêm màn mới = thêm file như thế này + 1 scene, không sửa engine.
 */
export interface LevelConfig {
  id: string;
  slug: string;
  order: number;
  world: number;
  title: string;
  concept: string;
  /** Cốt truyện 2-3 câu, hài hước nhẹ. */
  mission: string;
  goal: string;
  params: ParamDef[];
  challenges: ChallengeDef[];
  hints: HintDef[];
  quiz: QuizQuestion[];
  lessons: string[];
  stars: StarRule[];
  maxSteps: number;
  defaultSeed: number;
  createBoard: (params: ParamValues, seed: number) => BoardState;
  run: (input: RunInput) => SimEvent[];
  /** Biểu đồ nhỏ trong lúc chạy (tuỳ màn). */
  chart?: (events: SimEvent[]) => ChartData;
}
