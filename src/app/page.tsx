import { TOKEN_SURFACES } from './consts';
import styles from './page.module.scss';

const StartPage = () => (
  <main className={styles.page}>
    <p className={styles.caps}>Кауп · скелет репозитория</p>
    <h1 className={styles.title}>Токены направления</h1>
    <p className={styles.lead}>
      Страницы демо еще не написаны. Пока здесь лежат поверхности из таблицы артборда: на&nbsp;них считается контраст
      в&nbsp;обеих темах и&nbsp;на&nbsp;обеих ширинах.
    </p>

    <ul className={styles.surfaces}>
      {TOKEN_SURFACES.map((surface) => (
        <li
          key={surface.background}
          className={styles.surface}
          style={{ background: `var(${surface.background})` }}
        >
          <p
            className={styles.name}
            style={{ color: `var(${surface.nameToken})` }}
          >
            {surface.name}
          </p>

          {surface.texts.map((text) => (
            <p
              key={text.token}
              className={styles.sample}
              style={{ color: `var(${text.token})` }}
            >
              {text.label} — {text.token}
            </p>
          ))}
        </li>
      ))}
    </ul>
  </main>
);

export default StartPage;
