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

## Принятые допущения

1. **Авторизация/аутентификация не реализована**

   Сервис предполагается для работы во внутреннем контуре (trusted network) и не предназначен для самостоятельной публикации во внешний интернет. Поэтому в рамках тестового задания акцент сделан на подписи webhook, защите от replay и идемпотентности денежных операций.

2. **Расширенная стратегия логирования будет реализована позже**

   В текущей версии оставлено базовое структурированное логирование через `winston`. Политика аудита (уровни, маскирование чувствительных данных, корреляция запросов, ретеншн и централизованный сбор логов) предполагается как следующий этап развития сервиса.

3. **Поддерживаются только валюты с 2 знаками после запятой**

   Денежная модель в текущем решении использует fixed-scale `minor units` с коэффициентом `100` (центы). Специфичные валюты с иной дробностью (например, 0 или 3 знака) в рамках тестового задания не покрываются.

4. **Настройки мерчанта считаются преднастроенными**

   В API нет отдельного публичного сценария управления мерчантами. Предполагается, что `merchantId` и `feePercent` создаются/обновляются вне этого сервиса (админ-процессом или отдельным внутренним сервисом).

## Стратегия rate limiting

Ограничение реализовано через **token bucket в Redis** (атомарно через Lua), поэтому корректно работает при нескольких инстансах сервиса.

Где применяются лимиты:

- `POST /invoice`:
  - по `merchantId` (`invoice:create:merchant`),
  - по IP (`invoice:create:ip`).
- `GET /invoice/:id`:
  - по IP (`invoice:get:ip`).
- `POST /webhook`:
  - по IP (`webhook:ip`).
- невалидная подпись webhook:
  - строгий лимит по IP (`webhook:invalid-signature:ip`).

При превышении возвращается `429` (`MIDDLEWARE_ERROR`) и заголовок `Retry-After`.
Параметры token bucket настраиваются через env:

- `RATE_LIMIT_INVOICE_MERCHANT_BURST_CAPACITY`
- `RATE_LIMIT_INVOICE_MERCHANT_REFILL_TOKENS`
- `RATE_LIMIT_INVOICE_MERCHANT_REFILL_PERIOD_SEC`
- `RATE_LIMIT_INVOICE_IP_BURST_CAPACITY`
- `RATE_LIMIT_INVOICE_IP_REFILL_TOKENS`
- `RATE_LIMIT_INVOICE_IP_REFILL_PERIOD_SEC`
- `RATE_LIMIT_GET_INVOICE_IP_BURST_CAPACITY`
- `RATE_LIMIT_GET_INVOICE_IP_REFILL_TOKENS`
- `RATE_LIMIT_GET_INVOICE_IP_REFILL_PERIOD_SEC`
- `RATE_LIMIT_WEBHOOK_IP_BURST_CAPACITY`
- `RATE_LIMIT_WEBHOOK_IP_REFILL_TOKENS`
- `RATE_LIMIT_WEBHOOK_IP_REFILL_PERIOD_SEC`
- `RATE_LIMIT_WEBHOOK_INVALID_SIGNATURE_IP_BURST_CAPACITY`
- `RATE_LIMIT_WEBHOOK_INVALID_SIGNATURE_IP_REFILL_TOKENS`
- `RATE_LIMIT_WEBHOOK_INVALID_SIGNATURE_IP_REFILL_PERIOD_SEC`

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
