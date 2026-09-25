import { request as httpRequest, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { connect } from 'node:tls';
import { REQUEST_TIMEOUT, type SCHEMES } from './consts';

export type Probe = {
  scheme: (typeof SCHEMES)[number];
  /** Куда идет соединение — адрес сервера, мимо DNS имени. */
  ip: string;
  /** Заголовок `Host` и имя SNI; без него запрос идет голым IP. */
  host?: string;
  path: string;
};

export type ProbeResult = {
  status: number;
  body: string;
};

const collect = (response: IncomingMessage) =>
  new Promise<ProbeResult>((resolve, reject) => {
    let body = '';

    response.setEncoding('utf8');
    response.on('data', (chunk: string) => {
      body += chunk;
    });
    response.on('end', () => resolve({ status: response.statusCode ?? 0, body }));
    response.on('error', reject);
  });

/**
 * Запрос на сервер по IP с заданным `Host`. Сертификат не проверяется: по IP и по чужому имени сервер отдает
 * сертификат, который этому имени не принадлежит, а проверяется здесь ответ, а не сертификат.
 */
export const probe = ({ scheme, ip, host, path }: Probe) =>
  new Promise<ProbeResult>((resolve, reject) => {
    const headers = host ? { Host: host } : {};
    const onResponse = (response: IncomingMessage) => collect(response).then(resolve, reject);
    const request =
      scheme === 'http'
        ? httpRequest({ host: ip, port: 80, path, headers, timeout: REQUEST_TIMEOUT }, onResponse)
        : httpsRequest(
            {
              host: ip,
              port: 443,
              path,
              headers,
              servername: host && !isIP(host) ? host : undefined,
              rejectUnauthorized: false,
              timeout: REQUEST_TIMEOUT,
            },
            onResponse,
          );

    request.on('timeout', () => request.destroy(new Error(`${scheme}://${host ?? ip}${path}: нет ответа`)));
    request.on('error', reject);
    request.end();
  });

/** Имена из сертификата, который сервер отдает по SNI `host`; соединение падает, если сертификат этому имени не годится. */
export const certificateNames = (ip: string, host: string) =>
  new Promise<string[]>((resolve, reject) => {
    const socket = connect({ host: ip, port: 443, servername: host, timeout: REQUEST_TIMEOUT }, () => {
      const names = socket.getPeerCertificate().subjectaltname ?? '';

      socket.end();
      resolve(names.split(', '));
    });

    socket.on('timeout', () => socket.destroy(new Error(`${host}: нет ответа по TLS`)));
    socket.on('error', reject);
  });
