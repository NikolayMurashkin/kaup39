import type { Site } from '@/payload-types';

/** Настройки сайта для тестов, которые рисуют шапку и подвал: придуманные значения, не контент владельцев. */
export const SITE: Site = {
  id: 1,
  name: 'Поселение эпохи викингов',
  tagline: 'поселение эпохи викингов',
  ageNote: 'Возрастная маркировка 12+',
  address: 'Калининградская область, 4 км от поселка',
  phone: '8 (4012) 00-00-00',
  email: 'test@example.com',
  legal: 'ИП Тестовый, ИНН 000000000000',
  socials: [{ label: 'ВКонтакте', url: 'https://vk.com/example' }],
};
