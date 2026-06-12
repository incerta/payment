import { z } from 'zod';

const responseSchema = z.object({
  invoiceId: z.string().length(24),
});

describe('validateRouteOutput', () => {
  const initialNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = initialNodeEnv;
    jest.resetModules();
  });

  test('validates response schema when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    const { validateRouteOutput } = await import('../route-deprecate-middleware');

    expect(() =>
      validateRouteOutput(responseSchema, { invoiceId: 'not-an-object-id' }, 'GET /invoice/:id'),
    ).toThrow('Invalid response payload for GET /invoice/:id');
  });

  test('skips response validation in production', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const { validateRouteOutput } = await import('../route-deprecate-middleware');

    const invalidPayload = { invoiceId: 'not-an-object-id' };

    expect(validateRouteOutput(responseSchema, invalidPayload, 'GET /invoice/:id')).toEqual(invalidPayload);
  });
});
