import { test, expect } from '../support/fixtures/merged-fixtures';

test.describe('GraphQL Schema', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('graphql endpoint rejects unauthenticated requests', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: { query: '{ __typename }' },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  test('graphql endpoint rejects malformed bearer token', async ({ request }) => {
    const response = await request.post('/graphql', {
      headers: { Authorization: 'Bearer invalid-token-value' },
      data: { query: '{ __typename }' },
    });

    expect(response.status()).toBe(401);
  });

  test('graphql endpoint rejects missing bearer prefix', async ({ request }) => {
    const response = await request.post('/graphql', {
      headers: { Authorization: 'some-token-without-bearer' },
      data: { query: '{ __typename }' },
    });

    expect(response.status()).toBe(401);
  });
});
