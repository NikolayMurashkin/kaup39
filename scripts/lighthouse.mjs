import { spawnSync } from 'node:child_process';

const lhci = (...args) => {
  const result = spawnSync('yarn', ['lhci', ...args], { stdio: 'inherit' });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

// Первый прогон на свежем раннере измеряет холодный Chrome и Node, а не страницу: TBT там в 3–4 раза
// выше остальных. Прогревочный прогон не попадает ни в assert, ни в отчеты.
console.log('\n=== Lighthouse CI: warm-up (не учитывается) ===');
lhci('collect', '--numberOfRuns=1');

console.log('\n=== Lighthouse CI ===');
lhci('autorun');
