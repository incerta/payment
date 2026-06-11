## Что реализовано

### Endpoints

- `POST /invoice` (также доступен как `POST /v1/invoice`)
  - вход: `{ amount, currency, merchantId }`
  - считает `fee` и `amountToReceive`
  - сохраняет invoice со статусом `pending`

- `POST /webhook` (также доступен как `POST /v1/webhook`)
  - заголовки: `X-Signature`, `X-Timestamp`, `X-Nonce`
  - тело: `{ invoiceId, status }`, где `status = paid | failed`
  - проверяет HMAC SHA-256 по **raw body**
  - проверяет окно времени
  - блокирует replay через Redis nonce (`SET NX EX`)
  - обеспечивает зачисление `paid` ровно один раз (атомарный update в Mongo)

- `GET /invoice/:id` (также доступен как `GET /v1/invoice/:id`)
  - отдаёт текущий статус и суммы

## Денежные расчёты

- Деньги хранятся в minor units (`amountMinor`, `feeMinor`, `amountToReceiveMinor`)
- `feePercent` хранится как `ppm` (parts per million), чтобы избежать float-ошибок
- округление комиссии: `half-up` до копейки

## Требования

- Node.js 20+
- MongoDB
- Redis

## Установка и запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Продакшен запуск:

```bash
npm run build
npm start
```

## Тесты

```bash
npm test
```

Отдельно:

```bash
npm run test:unit
npm run test:integration
```

## Пример webhook-подписи

Подпись считается как:

`HMAC_SHA256(rawRequestBody, WEBHOOK_SECRET)` -> hex в `X-Signature`

## Принятые допущения

1. `paid` имеет приоритет над `failed`:
   - `failed` после успешного `paid` не откатывает зачисление
   - `paid` после `failed` может перевести invoice в `paid` и зачислить один раз
2. В проекте нет отдельного endpoint для мерчанта. При старте upsert-ится `DEFAULT_MERCHANT_ID` из `.env`.
3. Версия API поддержана в виде `/v1`, плюс root-роуты для совместимости (`/invoice`, `/webhook`).

## Что можно улучшить дальше

- Добавить отдельную таблицу/коллекцию ledger и баланс мерчанта в транзакции
- Добавить OpenAPI spec
- Поднять testcontainers для реального Redis/Mongo в integration
- Добавить полноценный ESLint/architecture rules из задания
