import * as migration_20260925_165304_initial from './20260925_165304_initial';
import * as migration_20260927_182335_media_temporary from './20260927_182335_media_temporary';

export const migrations = [
  {
    up: migration_20260925_165304_initial.up,
    down: migration_20260925_165304_initial.down,
    name: '20260925_165304_initial',
  },
  {
    up: migration_20260927_182335_media_temporary.up,
    down: migration_20260927_182335_media_temporary.down,
    name: '20260927_182335_media_temporary'
  },
];
