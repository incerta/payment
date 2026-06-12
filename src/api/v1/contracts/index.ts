import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { registerErrorSchemas } from './errors.contract'
import { registerCreateInvoiceContract } from './invoice/create-invoice.contract'
import { registerGetInvoiceContract } from './invoice/get-invoice.contract'
import { registerProcessWebhookContract } from './webhook/process-webhook.contract'

export const registerV1Contracts = (registry: OpenAPIRegistry): void => {
  registerErrorSchemas(registry)
  registerCreateInvoiceContract(registry)
  registerGetInvoiceContract(registry)
  registerProcessWebhookContract(registry)
}
