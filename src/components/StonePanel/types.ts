export type StonePanelEvent = {
  /** День строкой `YYYY-MM-DD` — в атрибут `datetime`. */
  dateTime: string;
  date: string;
  time: string;
  name: string;
  price: string;
  priceNote: string;
  /** Приписка перед ценой: «от», когда у события несколько видов билета. */
  pricePrefix?: string;
  ticketUrl: string;
  scheduleUrl: string;
  scheduleLabel: string;
};
