/** Почему заявка не ушла — так, как это объясняет форма: поле, лимит или отказ сети и каналов. */
export type LeadFormError = 'consent' | 'name' | 'phone' | 'kind' | 'guests' | 'date' | 'comment' | 'rate' | 'failed';

/** Форма заявки: заполняется, отправляется, отправлена или не ушла с причиной. */
export type LeadFormStatus =
  { state: 'idle' } | { state: 'sending' } | { state: 'sent' } | { state: 'error'; error: LeadFormError };
