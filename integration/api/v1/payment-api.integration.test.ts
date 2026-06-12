import request from 'supertest'
import { computeHmacSha256Hex } from '../../../src/services/security/hmac.service'
import {
  createIntegrationTestContext,
  TEST_MERCHANT_ID,
  TEST_WEBHOOK_SECRET,
  type IntegrationTestContext,
} from '../../helpers/test-context'

describe('payment API integration', () => {
  let context: IntegrationTestContext

  beforeAll(async () => {
    context = await createIntegrationTestContext()
  })

  afterAll(async () => {
    await context.cleanup()
  })

  beforeEach(async () => {
    await context.redis.flushall()
  })

  test('POST /invoice creates pending invoice with calculated amounts', async () => {
    const response = await request(context.app).post('/invoice').send({
      amount: '100.00',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      status: 'pending',
      currency: 'USD',
      amount: '100.00',
      fee: '2.90',
      amountToReceive: '97.10',
    })
    expect(typeof response.body.invoiceId).toBe('string')
  })

  test('GET /invoice/:id returns current invoice status', async () => {
    const createResponse = await request(context.app).post('/invoice').send({
      amount: '12.34',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const response = await request(context.app).get(`/invoice/${createResponse.body.invoiceId}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      invoiceId: createResponse.body.invoiceId,
      status: 'pending',
      currency: 'USD',
      amount: '12.34',
      fee: '0.36',
      amountToReceive: '11.98',
      credited: false,
    })
  })

  test('POST /webhook rejects invalid signature', async () => {
    const invoiceResponse = await request(context.app).post('/invoice').send({
      amount: '10.00',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const payload = JSON.stringify({
      invoiceId: invoiceResponse.body.invoiceId,
      status: 'paid',
    })

    const response = await request(context.app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Signature', 'bad-signature')
      .set('X-Timestamp', `${Math.floor(Date.now() / 1000)}`)
      .set('X-Nonce', 'nonce-invalid-signature')
      .send(payload)

    expect(response.status).toBe(401)
  })

  test('POST /invoice applies merchant rate limit', async () => {
    const calls = Array.from({ length: 25 }).map(() => {
      return request(context.app).post('/invoice').send({
        amount: '1.00',
        currency: 'USD',
        merchantId: TEST_MERCHANT_ID,
      })
    })

    const responses = await Promise.all(calls)
    const successful = responses.filter((response) => response.status === 201)
    const limited = responses.filter((response) => response.status === 429)

    expect(successful.length).toBeLessThanOrEqual(20)
    expect(limited.length).toBeGreaterThanOrEqual(1)

    if (limited[0]) {
      expect(limited[0].body.error.code).toBe('MIDDLEWARE_ERROR')
      expect(typeof limited[0].headers['retry-after']).toBe('string')
    }
  })

  test('POST /webhook limits repeated invalid signatures', async () => {
    const invoiceResponse = await request(context.app).post('/invoice').send({
      amount: '10.00',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const payload = JSON.stringify({
      invoiceId: invoiceResponse.body.invoiceId,
      status: 'paid',
    })
    const timestamp = `${Math.floor(Date.now() / 1000)}`

    const attempts = Array.from({ length: 11 }).map((_, index) => {
      return request(context.app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', 'bad-signature')
        .set('X-Timestamp', timestamp)
        .set('X-Nonce', `nonce-bad-signature-${index}`)
        .send(payload)
    })

    const responses = await Promise.all(attempts)

    const unauthorized = responses.filter((response) => response.status === 401)
    const limited = responses.filter((response) => response.status === 429)

    expect(unauthorized.length).toBe(10)
    expect(limited.length).toBe(1)
    expect(limited[0].body.error.code).toBe('MIDDLEWARE_ERROR')
    expect(typeof limited[0].headers['retry-after']).toBe('string')
  })

  test('POST /webhook paid is idempotent for repeated delivery', async () => {
    const invoiceResponse = await request(context.app).post('/invoice').send({
      amount: '10.00',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const payload = JSON.stringify({
      invoiceId: invoiceResponse.body.invoiceId,
      status: 'paid',
    })
    const signature = computeHmacSha256Hex(TEST_WEBHOOK_SECRET, payload)
    const timestamp = `${Math.floor(Date.now() / 1000)}`

    const first = await request(context.app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Signature', signature)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', 'nonce-paid-first')
      .send(payload)

    const second = await request(context.app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Signature', signature)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', 'nonce-paid-second')
      .send(payload)

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(first.body.creditedNow).toBe(true)
    expect(second.body.creditedNow).toBe(false)

    const getInvoice = await request(context.app).get(`/invoice/${invoiceResponse.body.invoiceId}`)
    expect(getInvoice.status).toBe(200)
    expect(getInvoice.body.status).toBe('paid')
    expect(getInvoice.body.credited).toBe(true)
  })

  test('POST /webhook rejects nonce replay', async () => {
    const invoiceResponse = await request(context.app).post('/invoice').send({
      amount: '15.00',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const payload = JSON.stringify({
      invoiceId: invoiceResponse.body.invoiceId,
      status: 'failed',
    })
    const signature = computeHmacSha256Hex(TEST_WEBHOOK_SECRET, payload)
    const timestamp = `${Math.floor(Date.now() / 1000)}`

    const first = await request(context.app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Signature', signature)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', 'nonce-replay')
      .send(payload)

    const second = await request(context.app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Signature', signature)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', 'nonce-replay')
      .send(payload)

    expect(first.status).toBe(200)
    expect(second.status).toBe(409)
  })

  test('POST /webhook rejects outdated timestamp', async () => {
    const invoiceResponse = await request(context.app).post('/invoice').send({
      amount: '20.00',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const payload = JSON.stringify({
      invoiceId: invoiceResponse.body.invoiceId,
      status: 'paid',
    })

    const signature = computeHmacSha256Hex(TEST_WEBHOOK_SECRET, payload)

    const response = await request(context.app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Signature', signature)
      .set('X-Timestamp', `${Math.floor(Date.now() / 1000) - 1000}`)
      .set('X-Nonce', 'nonce-old-timestamp')
      .send(payload)

    expect(response.status).toBe(401)
  })

  test('POST /webhook concurrent paid events credit exactly once', async () => {
    const invoiceResponse = await request(context.app).post('/invoice').send({
      amount: '33.33',
      currency: 'USD',
      merchantId: TEST_MERCHANT_ID,
    })

    const payload = JSON.stringify({
      invoiceId: invoiceResponse.body.invoiceId,
      status: 'paid',
    })

    const signature = computeHmacSha256Hex(TEST_WEBHOOK_SECRET, payload)
    const timestamp = `${Math.floor(Date.now() / 1000)}`

    const calls = Array.from({ length: 20 }).map((_, index) => {
      return request(context.app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', signature)
        .set('X-Timestamp', timestamp)
        .set('X-Nonce', `nonce-concurrent-${index}`)
        .send(payload)
    })

    const responses = await Promise.all(calls)

    const successResponses = responses.filter((response) => response.status === 200)
    const creditedNowCount = successResponses.filter(
      (response) => response.body.creditedNow === true,
    ).length

    expect(successResponses.length).toBe(20)
    expect(creditedNowCount).toBe(1)

    const invoiceState = await request(context.app).get(
      `/invoice/${invoiceResponse.body.invoiceId}`,
    )
    expect(invoiceState.status).toBe(200)
    expect(invoiceState.body.status).toBe('paid')
    expect(invoiceState.body.credited).toBe(true)
  })
})
