import { MoreLink } from '@/components/MoreLink';
import { typograph } from '@/lib/format';
import type { DirectionsParts } from '../../types';
import styles from './Routes.module.scss';

export type RoutesProps = {
  maps: DirectionsParts['maps'];
};

/** Маршрут на картах: ссылки на 2ГИС, Яндекс Карты и Google Карты из CMS открываются в новой вкладке. */
export const Routes = ({ maps }: RoutesProps) =>
  maps?.links?.length ? (
    <div
      id={maps.anchor ?? undefined}
      className={styles.routes}
    >
      {maps.heading ? <p className={styles.caps}>{typograph(maps.heading)}</p> : null}

      <p className={styles.links}>
        {maps.links.map((link) => (
          <MoreLink
            key={link.id ?? link.url}
            href={link.url}
            external
          >
            {typograph(link.label)}
          </MoreLink>
        ))}
      </p>
    </div>
  ) : null;
