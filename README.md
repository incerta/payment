# Payment Reception Service

Решение тестового задания Backend (Node.js): приём инвойсов и webhook-статусов оплаты.

## Стек

- Node.js + Express
- MongoDB (Mongoose)
- Redis
- Jest + Supertest
- TypeScript

## Запуск

```sh
npm install
cp .env.example .env
docker-compose up -d
npm run dev
```

Прод:

```sh
npm run build
npm start
```

## API (по требованиям задания)

### `POST /invoice`

Создание счёта.

**Body**:

```json
{
  "amount": "100.00",
  "currency": "USD",
  "merchantId": "merchant-it"
}
```

**Логика**:

- берётся `feePercent` из настроек мерчанта,
- считается `fee = amount × feePercent`,
- считается `amountToReceive = amount - fee`,
- invoice сохраняется в MongoDB со статусом `pending`.

**Response 201**:

```json
{
  "invoiceId": "...",
  "status": "pending",
  "currency": "USD",
  "amount": "100.00",
  "fee": "2.90",
  "amountToReceive": "97.10"
}
```

---

### `POST /webhook`

Приём статуса оплаты.

**Headers**:

- `X-Signature` — `HMAC_SHA256(rawRequestBody, WEBHOOK_SECRET)` в hex
- `X-Timestamp` — unix time (sec)
- `X-Nonce` — уникальный nonce

**Body**:

```json
{
  "invoiceId": "...",
  "status": "paid"
}
```

`status`: `paid | failed`

**Проверки**:

- подпись,
- актуальность `X-Timestamp` (анти-replay по времени),
- уникальность `X-Nonce` (Redis, `SET NX EX`).

**Идемпотентность**:

- при `paid` зачисление выполняется ровно один раз даже при повторной доставке webhook.

---

### `GET /invoice/:id`

Возвращает текущий статус счёта.

## Денежная точность

- суммы хранятся в minor units (центах),
- `feePercent` хранится как `ppm` (parts per million),
- комиссия считается без float-ошибок, округление `half-up` до цента.

## Тесты

```sh
npm test
```

Или отдельно:

```sh
npm run test:unit
npm run test:integration
```

Интеграционные тесты покрывают минимум из задания:

- проверка подписи webhook,
- идемпотентность повторной доставки webhook,
- расчёт комиссии.

## OpenAPI

- Swagger UI: `/docs`
- JSON: `/openapi.json`
- Генерация файла: `npm run docs:openapi:generate`
