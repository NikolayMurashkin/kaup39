import * as migration_20260925_165304_initial from './20260925_165304_initial';
import * as migration_20260927_182335_media_temporary from './20260927_182335_media_temporary';
import * as migration_20260928_083959_home_v2 from './20260928_083959_home_v2';
import * as migration_20261007_184109_albums_zone_gallery_author from './20261007_184109_albums_zone_gallery_author';
import * as migration_20261012_084640_event_perks_refund_terms from './20261012_084640_event_perks_refund_terms';
import * as migration_20261012_124544_event_hero from './20261012_124544_event_hero';

export const migrations = [
  {
    up: migration_20260925_165304_initial.up,
    down: migration_20260925_165304_initial.down,
    name: '20260925_165304_initial',
  },
  {
    up: migration_20260927_182335_media_temporary.up,
    down: migration_20260927_182335_media_temporary.down,
    name: '20260927_182335_media_temporary',
  },
  {
    up: migration_20260928_083959_home_v2.up,
    down: migration_20260928_083959_home_v2.down,
    name: '20260928_083959_home_v2',
  },
  {
    up: migration_20261007_184109_albums_zone_gallery_author.up,
    down: migration_20261007_184109_albums_zone_gallery_author.down,
    name: '20261007_184109_albums_zone_gallery_author',
  },
  {
    up: migration_20261012_084640_event_perks_refund_terms.up,
    down: migration_20261012_084640_event_perks_refund_terms.down,
    name: '20261012_084640_event_perks_refund_terms',
  },
  {
    up: migration_20261012_124544_event_hero.up,
    down: migration_20261012_124544_event_hero.down,
    name: '20261012_124544_event_hero'
  },
];
