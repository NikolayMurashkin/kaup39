'use client';

import { useEffect, useRef, useState, type ReactNode, type SubmitEvent } from 'react';
import { POLICY_PATH } from '@/lib/consts';
import { phoneHref, typograph } from '@/lib/format';
import { HONEYPOT_FIELD, LEAD_KINDS, LEAD_LIMITS } from '@/lib/lead/consts';
import type { LeadAnswer } from '@/lib/lead/types';
import { Button } from '../Button';
import { DEMO_NOTE_TEXTS, ERROR_TEXTS, FIELD_LABELS, FORM_TEXTS, LEAD_ENDPOINT, SENT_TEXTS } from './consts';
import type { LeadFormError, LeadFormStatus } from './types';
import styles from './LeadForm.module.scss';

const FIELD_ERRORS: readonly string[] = ['consent', 'name', 'phone', 'kind', 'guests', 'date', 'comment', 'rate'];

const errorOf = (answer: LeadAnswer | null): LeadFormError =>
  answer && !answer.ok && FIELD_ERRORS.includes(answer.reason) ? (answer.reason as LeadFormError) : 'failed';

const textOf = (data: FormData, name: string) => {
  const value = data.get(name);

  return typeof value === 'string' ? value : '';
};

export type LeadSentProps = {
  /** Телефон владельцев для настоящего заказа. */
  phone: string;
  /** Под номером: кнопка «Новая заявка», когда сообщение показывает форма. */
  children?: ReactNode;
};

/** Заявка ушла: она пришла студии, а не поселению, — и номер владельцев, чтобы заказать праздник по-настоящему. */
export const LeadSent = ({ phone, children }: LeadSentProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.sent}
      role="status"
    >
      <p className={styles.caps}>{SENT_TEXTS.label}</p>
      <h3
        ref={titleRef}
        className={styles.sentTitle}
        tabIndex={-1}
      >
        {SENT_TEXTS.title}
      </h3>
      <p className={styles.muted}>{typograph(SENT_TEXTS.text)}</p>
      <p className={styles.contacts}>
        <a href={phoneHref(phone)}>{phone}</a>
      </p>
      {children}
    </div>
  );
};

export type LeadFormProps = {
  /** Телефон владельцев для настоящего заказа. */
  phone: string;
};

/**
 * Форма заявки на мероприятие с плашкой демо рядом: заявка уходит в бот и на почту студии. Отправка неактивна, пока
 * не отмечено согласие; поле-ловушка скрыто от людей и экранного чтения. Заявка не ушла — причина и телефон
 * владельцев, введенное остается в форме.
 */
export const LeadForm = ({ phone }: LeadFormProps) => {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const body = {
      name: textOf(data, 'name'),
      phone: textOf(data, 'phone'),
      date: textOf(data, 'date'),
      guests: textOf(data, 'guests'),
      kind: textOf(data, 'kind'),
      comment: textOf(data, 'comment'),
      consent: data.get('consent') === 'on',
      [HONEYPOT_FIELD]: textOf(data, HONEYPOT_FIELD),
    };

    setStatus({ state: 'sending' });

    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const answer = (await response.json().catch(() => null)) as LeadAnswer | null;

      if (response.ok && answer?.ok) {
        setConsent(false);
        setStatus({ state: 'sent' });
      } else {
        setStatus({ state: 'error', error: errorOf(answer) });
      }
    } catch {
      setStatus({ state: 'error', error: 'failed' });
    }
  };

  return (
    <div className={styles.request}>
      <div className={styles.main}>
        {status.state === 'sent' ? (
          <LeadSent phone={phone}>
            <Button
              kind="ghost"
              size="sm"
              onClick={() => setStatus({ state: 'idle' })}
            >
              {SENT_TEXTS.again}
            </Button>
          </LeadSent>
        ) : (
          <form
            className={styles.form}
            onSubmit={submit}
          >
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>{FIELD_LABELS.name}</span>
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={LEAD_LIMITS.name}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{FIELD_LABELS.phone}</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>
                  {FIELD_LABELS.date} <small>{FIELD_LABELS.dateNote}</small>
                </span>
                <input
                  name="date"
                  autoComplete="off"
                  maxLength={LEAD_LIMITS.date}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{FIELD_LABELS.guests}</span>
                <input
                  name="guests"
                  type="number"
                  min={1}
                  max={LEAD_LIMITS.guests}
                  step={1}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>{FIELD_LABELS.kind}</span>
              <select
                name="kind"
                autoComplete="off"
              >
                {LEAD_KINDS.map((kind) => (
                  <option key={kind}>{kind}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{FIELD_LABELS.comment}</span>
              <textarea
                name="comment"
                autoComplete="off"
                maxLength={LEAD_LIMITS.comment}
              />
            </label>

            <div
              className={styles.trap}
              aria-hidden="true"
            >
              <input
                name={HONEYPOT_FIELD}
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <label className={styles.consent}>
              <input
                type="checkbox"
                name="consent"
                required
                checked={consent}
                onChange={(event) => setConsent(event.currentTarget.checked)}
              />
              <span>
                {typograph(FORM_TEXTS.consent)}
                <a
                  href={POLICY_PATH}
                  target="_blank"
                  rel="noopener"
                >
                  {FORM_TEXTS.policy}
                </a>
              </span>
            </label>

            {status.state === 'error' ? (
              <div
                className={styles.error}
                role="alert"
              >
                <p>{typograph(ERROR_TEXTS[status.error])}</p>
                <p>
                  {typograph(FORM_TEXTS.call)} <a href={phoneHref(phone)}>{phone}</a>
                </p>
              </div>
            ) : null}

            <div className={styles.foot}>
              <Button
                kind="steel"
                type="submit"
                disabled={!consent || status.state === 'sending'}
              >
                {status.state === 'sending' ? FORM_TEXTS.sending : FORM_TEXTS.submit}
              </Button>
              <p>{typograph(FORM_TEXTS.required)}</p>
            </div>
          </form>
        )}
      </div>

      <aside
        className={styles.side}
        aria-label={DEMO_NOTE_TEXTS.aside}
      >
        <div className={styles.note}>
          <p className={styles.caps}>{DEMO_NOTE_TEXTS.label}</p>
          <p>{typograph(DEMO_NOTE_TEXTS.text)}</p>
          <a href={phoneHref(phone)}>{phone}</a>
        </div>
      </aside>
    </div>
  );
};
