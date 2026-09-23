import type { Rgb } from '../lib/contrast';

export type TextRect = { x: number; y: number; w: number; h: number };

export type TextNode = {
  selector: string;
  color: Rgb;
  rects: TextRect[];
  /** Надпись набрана руническим алфавитом: она меряется своим кадром. */
  runic: boolean;
};

export type Failure = TextNode & { worst: number; below: number; area: number };

export type Measurement = {
  /** Сколько узлов реально померено. */
  nodes: number;
  /** Узлы, у которых кадры нигде не разошлись: глифов на странице не видно. */
  blind: number;
  failures: Failure[];
};

export type Frame = { data: Buffer; width: number; height: number; channels: number };

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
