import { describe, expect, it } from 'vitest';
import { upcoming } from '@/cms/upcoming';

const item = (date: string, start: string, end: string) => ({ date, start, end });

/** 24.09.2026, 12:00 по Калининграду (UTC+2). */
const NOON = new Date('2026-09-24T10:00:00.000Z');

describe('ближайшие даты', () => {
  it('прошедшие даты и сегодняшнее событие, которое уже закончилось, не попадают; идущее и будущие — попадают', () => {
    const items = [
      item('2026-09-23', '12:00', '15:00'),
      item('2026-09-24', '09:00', '11:00'),
      item('2026-09-24', '11:00', '15:00'),
      item('2026-09-24', '16:00', '19:00'),
      item('2026-09-25', '12:00', '15:00'),
    ];

    expect(upcoming(items, NOON)).toEqual(items.slice(2));
  });

  it('день считается по Калининграду, а не по UTC: в 01:30 по поселку вчерашний вечер уже прошел', () => {
    const lateNight = new Date('2026-09-24T23:30:00.000Z');

    expect(upcoming([item('2026-09-24', '16:00', '19:00'), item('2026-09-25', '12:00', '15:00')], lateNight)).toEqual([
      item('2026-09-25', '12:00', '15:00'),
    ]);
  });

  it('пустое расписание и расписание из одних прошедших дат дают пустой список', () => {
    expect(upcoming([], NOON)).toEqual([]);
    expect(upcoming([item('2026-08-31', '12:00', '15:00')], NOON)).toEqual([]);
  });
});
