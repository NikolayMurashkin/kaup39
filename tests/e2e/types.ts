import type { Rgb } from '../lib/contrast';

export type TextRect = { x: number; y: number; w: number; h: number };

export type TextNode = {
  selector: string;
  color: Rgb;
  /** Собственная альфа цвета, умноженная на `opacity` узла и всех его предков. */
  alpha: number;
  /** Между текстом и полупрозрачным предком есть плашка со своим фоном: такой узел проваливается явно. */
  plated: boolean;
  rects: TextRect[];
  /** Надпись набрана руническим алфавитом: она меряется своим кадром. */
  runic: boolean;
};

export type Failure = TextNode & {
  worst: number;
  below: number;
  area: number;
  /** Почему узел провален без подсчета: замер не умеет честно смешать его цвет с фоном. */
  reason?: string;
};

export type Measurement = {
  /** Сколько узлов реально померено. */
  nodes: number;
  /** Узлы, у которых кадры нигде не разошлись: глифов на странице не видно. */
  blind: string[];
  /** Кадры, которые к съемке не загрузились: текст над ними мерился бы поверх заглушки. */
  unloaded: string[];
  failures: Failure[];
};

export type Frame = { data: Buffer; width: number; height: number; channels: number };

/** Текст, на котором сверяется запасное начертание гарнитуры, и откуда он взят. */
export type FallbackCheck = { family: string; kind: string; text: string };

export type NodeFonts = {
  /** Начало текста узла — чтобы в отчете было видно, какой узел упал. */
  text: string;
  /** Первое семейство вычисленного `font-family`, то есть гарнитура токена. */
  family: string;
  /** Первые семейства самого узла и вложенных в него текстовых узлов. */
  allowed: string[];
  /** Шрифты, которыми Chrome набрал глифы узла. */
  fonts: { familyName: string; isCustomFont: boolean }[];
};

/** Дата расписания из REST Payload при `depth=0`: событие — числовой id. */
export type ScheduleDoc = { id: number; event: number; date: string; start: string; end: string; show?: string | null };

/** Ответ REST Payload на список документов. */
export type DocsResponse<T> = { docs: T[] };
