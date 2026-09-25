import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DIRECTIONS_PATH, SCHEDULE_PATH } from '@/lib/consts';

const require = createRequire(import.meta.url);

type LighthouseConfig = {
  ci: {
    collect: { numberOfRuns: number; url: string[] };
    assert: {
      aggregationMethod?: string;
      assertions: Record<string, [string, { minScore?: number; maxNumericValue?: number }]>;
    };
  };
};

const config = require('../../lighthouserc.cjs') as LighthouseConfig;

const SITE_CONFIG_PATH = fileURLToPath(new URL('../../../site/lighthouserc.cjs', import.meta.url));

describe('lighthouserc.cjs', () => {
  it('порог считается по худшему из прогонов, не по лучшему', () => {
    expect(config.ci.assert.aggregationMethod).toBe('pessimistic');
  });

  it('меряются главная, расписание и «как доехать» — каждая страница сдается со своим замером', () => {
    expect(config.ci.collect.url.map((url) => new URL(url).pathname)).toEqual(['/', SCHEDULE_PATH, DIRECTIONS_PATH]);
  });

  it('прогонов три', () => {
    expect(config.ci.collect.numberOfRuns).toBe(3);
  });

  it('performance каждого прогона не ниже 90', () => {
    expect(config.ci.assert.assertions['categories:performance']).toEqual(['error', { minScore: 0.9 }]);
  });

  it('accessibility каждого прогона равна 100', () => {
    expect(config.ci.assert.assertions['categories:accessibility']).toEqual(['error', { minScore: 1 }]);
  });

  it('seo каждого прогона не ниже 90', () => {
    expect(config.ci.assert.assertions['categories:seo']).toEqual(['error', { minScore: 0.9 }]);
  });

  it('CLS каждого прогона не выше 0,02: текст не прыгает, пока грузятся шрифты направления', () => {
    expect(config.ci.assert.assertions['cumulative-layout-shift']).toEqual(['error', { maxNumericValue: 0.02 }]);
  });

  it('aggregationMethod совпадает с сайтом студии (на CI репозитория сайта нет — сверка идет на маке)', () => {
    if (!existsSync(SITE_CONFIG_PATH)) {
      expect(config.ci.assert.aggregationMethod).toBe('pessimistic');

      return;
    }

    const site = require(SITE_CONFIG_PATH) as LighthouseConfig;

    expect(config.ci.assert.aggregationMethod).toBe(site.ci.assert.aggregationMethod);
  });
});
