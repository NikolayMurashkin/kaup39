import { PHASE_PRODUCTION_BUILD } from 'next/constants';

/**
 * Payload поднимается при старте процесса, до первого запроса — только в рантайме Node.js и не на сборке. Код подъема
 * в отдельном модуле и импортируется внутри проверки рантайма: так он не попадает в сборку для Edge. Проверка —
 * равенство `nodejs`: Node вне Next (`payload run`, `payload migrate:create`) рантайм не задает и сам поднимает Payload.
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
    const { startPayload } = await import('./instrumentation-node');

    await startPayload();
  }
};
