## Что реализовано по требованиям

### 1) `POST /invoice`

- вход: `{ amount, currency, merchantId }`
- `feePercent` берётся из настроек мерчанта
- считается:
  - `fee = amount × feePercent`
  - `amountToReceive = amount - fee`
- invoice сохраняется в MongoDB со статусом `pending`
- ответ содержит `invoiceId` и рассчитанные суммы

### 2) `POST /webhook`

- заголовки: `X-Signature`, `X-Timestamp`, `X-Nonce`
- тело: `{ invoiceId, status }`, где `status = paid | failed`
- проверяется:
  - HMAC-SHA256 подпись по raw body,
  - актуальность timestamp,
  - уникальность nonce (Redis `SET NX EX`)
- статус инвойса обновляется
- при `paid` зачисление выполняется ровно один раз (идемпотентность на уровне Mongo update)

### 3) `GET /invoice/:id`

- возвращает текущий статус инвойса

### 4) Тесты

Покрыт минимум из задания:

- проверка подписи,
- идемпотентность webhook,
- расчёт комиссии.

Файл интеграционных тестов:

- `integration/api/v1/payment-api.integration.test.ts`

## Технические детали

- Денежные расчёты: minor units + integer math (без float ошибок)
- Комиссия хранится как `ppm` (parts per million)
- Округление комиссии: `half-up` до цента
- OpenAPI:
  - `/docs`
  - `/openapi.json`
  - генерация: `npm run docs:openapi:generate`
