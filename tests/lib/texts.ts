import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { sourceFiles } from './files';

const ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  laquo: '«',
  lt: '<',
  mdash: '—',
  nbsp: String.fromCodePoint(0x00a0),
  ndash: '–',
  quot: '"',
  raquo: '»',
};

/**
 * JSX-текст и строковые атрибуты JSX хранятся в AST сырыми: `&nbsp;` там — шесть латинских букв,
 * а не неразрывный пробел. Незнакомая сущность — ошибка, а не пропуск: иначе ее знак не попал бы
 * в проверку сабсета.
 */
const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#x') || name.startsWith('#X')) return String.fromCodePoint(parseInt(name.slice(2), 16));
    if (name.startsWith('#')) return String.fromCodePoint(Number(name.slice(1)));

    const decoded = ENTITIES[name];

    if (decoded === undefined) {
      throw new Error(`неизвестная HTML-сущность ${entity}: добавь ее в ENTITIES`);
    }

    return decoded;
  });

const isModuleSpecifier = (node: ts.Node) =>
  ts.isImportDeclaration(node.parent) ||
  ts.isExportDeclaration(node.parent) ||
  ts.isExternalModuleReference(node.parent);

const textsOfScript = (path: string) => {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, kind);
  const texts: string[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      texts.push(decodeEntities(node.text));
    } else if (ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent)) {
      texts.push(decodeEntities(node.text));
    } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !isModuleSpecifier(node)) {
      texts.push(node.text);
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      texts.push(node.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  return texts;
};

const textsOfStyles = (path: string) =>
  [...readFileSync(path, 'utf8').matchAll(/content\s*:\s*(['"])(.*?)\1/g)].map(([, , value]) => value);

/**
 * Все знаки, которые могут попасть на страницу из исходников: строки и шаблоны TS, JSX-текст
 * с раскрытыми сущностями, `content` в стилях. Управляющие знаки (переносы строк и отступы JSX)
 * не рисуются и в набор не входят.
 */
export const repositoryCharacters = () => {
  const texts = [...sourceFiles(/\.tsx?$/).flatMap(textsOfScript), ...sourceFiles(/\.scss$/).flatMap(textsOfStyles)];

  return new Set([...texts.join('')].filter((character) => character.codePointAt(0)! >= 0x20));
};
