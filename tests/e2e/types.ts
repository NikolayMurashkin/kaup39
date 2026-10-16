/** Дата расписания из REST Payload при `depth=0`: событие — числовой id. */
export type ScheduleDoc = { id: number; event: number; date: string; start: string; end: string; show?: string | null };

/** Ответ REST Payload на список документов. */
export type DocsResponse<T> = { docs: T[] };

/** Запись приемника заявок: в какой канал ушла заявка и что в этом канале оказалось. */
export type SinkCall = {
  channel: 'telegram' | 'mail';
  body: string;
};
