export type TransferSummary = {
  /** Якорь раздела трансфера на странице «как доехать». */
  anchor: string;
  heading: string;
  /** Первый абзац раздела. */
  text: string | null;
  /** Цена первой строки таблицы цен трансфера. */
  amount: number | null;
  /** Заголовок таблицы цен: «Стоимость билета туда и обратно». */
  priceNote: string | null;
};
