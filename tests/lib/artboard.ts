import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ArtboardSnapshot, TableTheme, TokenGroup } from '../../scripts/sync-artboard-tokens.mts';
import snapshot from '../fixtures/artboard-tokens.json' with { type: 'json' };
import { readTokenRules, type ScssRule } from './scss';

export const artboard = snapshot as ArtboardSnapshot;

/** Артборд v2 (D30): с него снимается таблица токенов. */
export const ARTBOARD_PATH = fileURLToPath(new URL('../../../design/kaup/Kaup-v2.dc.html', import.meta.url));

/** Артборд v1: по его тексту подогнаны запасные начертания, снимок текста снят с него. */
export const V1_ARTBOARD_PATH = fileURLToPath(new URL('../../../design/kaup/Kaup.dc.html', import.meta.url));

export const artboardIsReachable = (path = ARTBOARD_PATH) => existsSync(path);

/** Тема в таблице артборда → блок токенов. */
export const THEME_GROUP: Record<TableTheme, TokenGroup> = {
  dark: 'dark',
  light: 'light',
  narrow: 'narrow',
};

/** Блок артборда → правило в `tokens.scss`: темная тема — корень, светлая — атрибут, узкая — медиазапрос. */
export const GROUP_RULE: Record<TokenGroup, { narrow: boolean; selector: string }> = {
  dark: { narrow: false, selector: ':root' },
  light: { narrow: false, selector: "[data-theme='light']" },
  narrow: { narrow: true, selector: ':root' },
  narrowLight: { narrow: true, selector: "[data-theme='light']" },
};

const isNarrowMedia = (rule: ScssRule) => rule.media !== null && /max-width/.test(rule.media);

export const scssGroups = (): Record<TokenGroup, Record<string, string>> => {
  const rules = readTokenRules();

  const groupOf = (group: TokenGroup) => {
    const { narrow, selector } = GROUP_RULE[group];
    const matched = rules.filter((rule) => rule.selector === selector && isNarrowMedia(rule) === narrow);

    return Object.assign({}, ...matched.map((rule) => rule.declarations)) as Record<string, string>;
  };

  return {
    dark: groupOf('dark'),
    light: groupOf('light'),
    narrow: groupOf('narrow'),
    narrowLight: groupOf('narrowLight'),
  };
};

/** Значения токенов, действующие в теме: светлая наследует темную. */
export const resolvedTokens = (
  groups: Record<TokenGroup, Record<string, string>>,
  theme: 'dark' | 'light',
): Record<string, string> => (theme === 'dark' ? { ...groups.dark } : { ...groups.dark, ...groups.light });
