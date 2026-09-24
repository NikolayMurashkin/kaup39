import type { ReactNode } from 'react';
import { toPhoto } from '@/cms/media';
import type { PageSection } from '@/cms/types';
import { formatAmount, paragraphs, typograph } from '@/lib/format';
import { Button } from '../Button';
import { CutBox } from '../CutBox';
import { PhotoSlot } from '../PhotoSlot';
import { Price } from '../Price';
import { SectionHead } from '../SectionHead';
import styles from './CmsSections.module.scss';
import { GALLERY_SIZES, SPLIT_PHOTO_SIZES } from './consts';
import { groupSections } from './group';
import type {
  AttachedProps,
  GalleryProps,
  ItemListProps,
  LinkRowProps,
  ParagraphsProps,
  PricesTableProps,
} from './types';

export type CmsSectionsProps = {
  sections: PageSection[];
  /** Что пристроить в конец раздела с данным якорем: плитки площадок, таверны. */
  extras?: Partial<Record<string, ReactNode>>;
  /** Якоря разделов, которые страница рисует сама и из общего потока убирает. */
  skip?: readonly string[];
};

const Paragraphs = ({ text, className }: ParagraphsProps) =>
  paragraphs(text).map((paragraph) => (
    <p
      key={paragraph}
      className={className ?? styles.paragraph}
    >
      {paragraph}
    </p>
  ));

const PricesTable = ({ block }: PricesTableProps) => (
  <CutBox
    cut="sm"
    surface="raised"
    className={styles.prices}
  >
    {block.heading ? <h3 className={styles.caps}>{typograph(block.heading)}</h3> : null}
    <Paragraphs text={block.intro} />

    <dl className={styles.rows}>
      {(block.rows ?? []).map((row) => (
        <div
          key={row.id ?? row.label}
          className={styles.row}
        >
          <dt className={styles.label}>
            {typograph(row.label)}
            {row.note ? <span className={styles.note}>{typograph(row.note)}</span> : null}
          </dt>
          <dd className={styles.amount}>
            <Price
              value={formatAmount(row.amount)}
              note={row.unit ? `за ${row.unit}` : undefined}
              tone="plain"
              className={styles.price}
            />
          </dd>
        </div>
      ))}
    </dl>

    <Paragraphs
      text={block.footnote}
      className={styles.footnote}
    />
  </CutBox>
);

const ItemList = ({ block }: ItemListProps) => (
  <div className={styles.list}>
    {block.heading ? <h3 className={styles.caps}>{typograph(block.heading)}</h3> : null}
    <Paragraphs text={block.intro} />

    <ul className={styles.items}>
      {(block.items ?? []).map((item) => (
        <li
          key={item.id ?? item.title}
          className={styles.item}
        >
          {item.url ? (
            <a
              className={styles.itemLink}
              href={item.url}
            >
              {typograph(item.title)}
            </a>
          ) : (
            <span className={styles.itemTitle}>{typograph(item.title)}</span>
          )}
          {item.text ? <span className={styles.note}>{typograph(item.text)}</span> : null}
        </li>
      ))}
    </ul>

    <Paragraphs
      text={block.footnote}
      className={styles.footnote}
    />
  </div>
);

const LinkRow = ({ block }: LinkRowProps) => (
  <div className={styles.list}>
    {block.heading ? <h3 className={styles.caps}>{typograph(block.heading)}</h3> : null}

    <div className={styles.links}>
      {(block.links ?? []).map((link) => (
        <Button
          key={link.id ?? link.url}
          kind="ghost"
          size="sm"
          href={link.url}
        >
          {typograph(link.label)}
        </Button>
      ))}
    </div>
  </div>
);

const Attached = ({ block }: AttachedProps) => {
  if (block.blockType === 'prices') return <PricesTable block={block} />;
  if (block.blockType === 'list') return <ItemList block={block} />;
  if (block.blockType === 'links') return <LinkRow block={block} />;

  return null;
};

const Gallery = ({ block }: GalleryProps) => (
  <div className={styles.gallery}>
    {(block.photos ?? []).map(toPhoto).map((photo) =>
      photo ? (
        <PhotoSlot
          key={photo.src}
          photo={photo}
          sizes={GALLERY_SIZES}
          caption={photo.caption ? typograph(photo.caption) : null}
          className={styles.shot}
        />
      ) : null,
    )}
  </div>
);

/** Разделы страницы из CMS по порядку: заголовок, текст, фотография, цены, списки и ссылки под ним. */
export const CmsSections = ({ sections, extras = {}, skip }: CmsSectionsProps) =>
  groupSections(sections, skip).map(({ lead, attached }) => {
    const photo = lead.blockType === 'text' ? toPhoto(lead.photo) : null;

    return (
      <section
        key={lead.id ?? lead.anchor}
        id={lead.anchor ?? undefined}
        className={styles.section}
      >
        {lead.heading ? <SectionHead heading={typograph(lead.heading)} /> : null}

        {lead.blockType === 'text' ? (
          <div className={photo ? styles.split : styles.column}>
            <div className={styles.body}>
              <Paragraphs text={lead.body} />
            </div>

            {photo ? (
              <PhotoSlot
                photo={photo}
                sizes={SPLIT_PHOTO_SIZES}
                className={styles.photo}
              />
            ) : null}
          </div>
        ) : null}

        {lead.blockType === 'photos' ? <Gallery block={lead} /> : null}
        {lead.blockType !== 'text' && lead.blockType !== 'photos' ? <Attached block={lead} /> : null}

        {attached.length ? (
          <div className={styles.attached}>
            {attached.map((block) => (
              <div
                key={block.id ?? block.anchor}
                id={block.anchor ?? undefined}
                className={styles.block}
              >
                <Attached block={block} />
              </div>
            ))}
          </div>
        ) : null}

        {lead.anchor ? extras[lead.anchor] : null}
      </section>
    );
  });
