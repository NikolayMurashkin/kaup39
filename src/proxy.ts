import { NextResponse } from 'next/server';
import { STAND_ROBOTS_TAG } from '@/lib/consts';
import { isStand } from '@/lib/stand';

/** На стенде каждый ответ — страницы, медиа, админка — закрыт от индексации заголовком. */
const proxy = () => {
  const response = NextResponse.next();

  if (isStand()) {
    response.headers.set('X-Robots-Tag', STAND_ROBOTS_TAG);
  }

  return response;
};

export default proxy;
