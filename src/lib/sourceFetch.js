import zlib from 'zlib';
import { HTTP_CONSTANTS } from '../constants/http.js';

const SOURCE_FETCH_DEFAULTS = Object.freeze({
  compression: 'auto'
});

function shouldGunzipBuffer(url, response, compression) {
  if (compression === 'gzip') {
    return true;
  }
  if (compression !== SOURCE_FETCH_DEFAULTS.compression) {
    return false;
  }

  const contentEncoding = String(response.headers.get('content-encoding') || '').toLowerCase();
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  return url.endsWith('.gz') || contentEncoding.includes('gzip') || contentType.includes('gzip');
}

export function isGzipBuffer(buffer) {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

export async function fetchSourceText(url, { compression = SOURCE_FETCH_DEFAULTS.compression } = {}) {
  const response = await fetch(url, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok) {
    throw new Error(`Source fetch failed: ${response.status}`);
  }

  let buffer = Buffer.from(await response.arrayBuffer());
  if (shouldGunzipBuffer(url, response, compression) && isGzipBuffer(buffer)) {
    buffer = zlib.gunzipSync(buffer);
  }

  return buffer.toString('utf8');
}
