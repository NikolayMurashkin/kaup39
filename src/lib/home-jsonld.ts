import { OWNERS_ORIGIN } from './consts';

export type HomeJsonLdInput = {
  name: string;
  description?: string | null;
  address: string;
  phone: string;
  email: string;
  map?: { latitude?: number | null; longitude?: number | null } | null;
  socials?: { url: string }[] | null;
};

/**
 * Разметка schema.org главной из глобала «Сайт»: поселение — и достопримечательность, и место с контактами, поэтому
 * один объект с двумя типами. Адрес — домен владельцев: стенд закрыт от индексации, разметка готовится к переезду.
 * Точка, соцсети и подзаголовок попадают в разметку, только когда заполнены: пустое поле Google считает ошибкой.
 */
export const homeJsonLd = ({
  name,
  description,
  address,
  phone,
  email,
  map,
  socials,
}: HomeJsonLdInput): Record<string, unknown> => {
  const latitude = map?.latitude;
  const longitude = map?.longitude;
  const sameAs = (socials ?? []).map((social) => social.url);

  return {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'LocalBusiness'],
    name,
    ...(description?.trim() ? { description } : {}),
    url: new URL('/', OWNERS_ORIGIN).href,
    telephone: phone,
    email,
    address: { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'RU' },
    ...(latitude != null && longitude != null ? { geo: { '@type': 'GeoCoordinates', latitude, longitude } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
};
