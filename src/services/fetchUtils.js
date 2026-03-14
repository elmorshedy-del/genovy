import { HTTP_CONSTANTS } from '../constants/http.js';

export async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': HTTP_CONSTANTS.userAgent
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

export async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': HTTP_CONSTANTS.userAgent,
      accept: HTTP_CONSTANTS.jsonMimeType
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}
