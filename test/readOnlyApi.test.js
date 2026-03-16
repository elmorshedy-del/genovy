import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test('read-only API rejects requests without a token', async () => {
  const app = createApp(
    {
      mode: 'full',
      publicSiteReady: true,
      knowledgeApiReady: true,
      adminApiReady: true,
      readOnlyApiReady: true
    },
    {
      readOnlyApiToken: 'consultant-token'
    }
  );

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.auth.header, 'Authorization');
  });
});

test('read-only API index returns docs with bearer auth', async () => {
  const app = createApp(
    {
      mode: 'full',
      publicSiteReady: true,
      knowledgeApiReady: true,
      adminApiReady: true,
      readOnlyApiReady: true
    },
    {
      readOnlyApiToken: 'consultant-token'
    }
  );

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1`, {
      headers: {
        Authorization: 'Bearer consultant-token'
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.api.version, 'v1');
    assert.equal(payload.api.docs.openapi.endsWith('/api/v1/openapi.json'), true);
    assert.equal(Array.isArray(payload.api.endpoints), true);
  });
});

test('read-only API health works with X-API-Key auth', async () => {
  const app = createApp(
    {
      mode: 'full',
      publicSiteReady: true,
      knowledgeApiReady: true,
      adminApiReady: true,
      readOnlyApiReady: true
    },
    {
      readOnlyApiToken: 'consultant-token'
    }
  );

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      headers: {
        'X-API-Key': 'consultant-token'
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.service, 'genovy');
  });
});

test('read-only API returns a clear 503 when disabled', async () => {
  const app = createApp(
    {
      mode: 'knowledge_only',
      publicSiteReady: true,
      knowledgeApiReady: true,
      adminApiReady: false,
      readOnlyApiReady: false
    },
    {
      readOnlyApiToken: 'consultant-token'
    }
  );

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1`, {
      headers: {
        Authorization: 'Bearer consultant-token'
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 503);
    assert.match(payload.error, /GENOVY_READONLY_API_TOKEN/);
  });
});
