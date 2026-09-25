import * as migration_20260925_165304_initial from './20260925_165304_initial';

export const migrations = [
  {
    up: migration_20260925_165304_initial.up,
    down: migration_20260925_165304_initial.down,
    name: '20260925_165304_initial'
  },
];
