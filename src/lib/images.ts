/**
 * Качество кадра первого экрана. Кадр лежит под скримом плотностью от 0,7 до 0,97, и артефакты сжатия
 * под ним не видны, а на мобильной ширине он и есть LCP: при качестве 75 кадр весил 330 КБ.
 */
export const HERO_QUALITY = 40;

/**
 * Кандидаты `srcSet` с дескрипторами, которым можно верить: оптимизатор не увеличивает файл и на `w=1920` отдает
 * кадр 1600 px, а браузер по дескриптору `1920w` счел бы его плотнее и нарисовал мельче. Кандидаты уже файла
 * остаются как есть, первый не уже файла получает дескриптор ширины файла, остальные отбрасываются.
 */
export const fitSrcSet = (srcSet: string, fileWidth: number) => {
  const fitted: string[] = [];

  for (const candidate of srcSet.split(', ')) {
    const [url, descriptor] = candidate.split(' ');
    const width = Number.parseInt(descriptor, 10);

    fitted.push(`${url} ${Math.min(width, fileWidth)}w`);

    if (width >= fileWidth) {
      break;
    }
  }

  return fitted.join(', ');
};
