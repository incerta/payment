import type { RequestHandler } from 'express'
import { type ZodType, type ZodTypeAny } from 'zod'
import { ControllerError, RouteError } from './error'

const isOutputValidationEnabled = process.env.NODE_ENV !== 'production'

export interface HttpContractRequest {
  body?: ZodTypeAny
  bodyErrorMessage?: string
  params?: ZodTypeAny
  paramsErrorMessage?: string
  query?: ZodTypeAny
  queryErrorMessage?: string
  headers?: ZodTypeAny
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

export interface HttpContract {
  method: HttpMethod
  path: string
  operationId: string
  summary: string
  request?: HttpContractRequest
  responses: Partial<Record<number, ZodTypeAny>>
}

export const parseRouteInput = <T>(schema: ZodType<T>, payload: unknown, message: string): T => {
  const validationResult = schema.safeParse(payload)
  if (validationResult.success) {
    return validationResult.data
  }

  throw new RouteError(message, {
    statusCode: 400,
    details: {
      issues: validationResult.error.issues,
    },
  })
}

export const createContractBodyValidator = (contract: HttpContract): RequestHandler => {
  return (req, _res, next) => {
    if (!contract.request?.body || !contract.request.bodyErrorMessage) {
      return next(new ControllerError(`Missing body contract for ${contract.operationId}`))
    }

    try {
      req.body = parseRouteInput(contract.request.body, req.body, contract.request.bodyErrorMessage)
      return next()
    } catch (error) {
      return next(error)
    }
  }
}

export const createContractParamsValidator = (contract: HttpContract): RequestHandler => {
  return (req, _res, next) => {
    if (!contract.request?.params || !contract.request.paramsErrorMessage) {
      return next(new ControllerError(`Missing params contract for ${contract.operationId}`))
    }

    try {
      req.params = parseRouteInput(
        contract.request.params,
        req.params,
        contract.request.paramsErrorMessage,
      ) as typeof req.params
      return next()
    } catch (error) {
      return next(error)
    }
  }
}

export const createContractQueryValidator = (contract: HttpContract): RequestHandler => {
  return (req, _res, next) => {
    if (!contract.request?.query || !contract.request.queryErrorMessage) {
      return next(new ControllerError(`Missing query contract for ${contract.operationId}`))
    }

    try {
      req.query = parseRouteInput(
        contract.request.query,
        req.query,
        contract.request.queryErrorMessage,
      )
      return next()
    } catch (error) {
      return next(error)
    }
  }
}

export const validateRouteOutput = <T>(schema: ZodType<T>, payload: unknown, route: string): T => {
  if (!isOutputValidationEnabled) {
    return payload as T
  }

  const validationResult = schema.safeParse(payload)
  if (validationResult.success) {
    return validationResult.data
  }

  throw new ControllerError(`Invalid response payload for ${route}`, {
    statusCode: 500,
    details: {
      issues: validationResult.error.issues,
    },
  })
}

export const createContractResponseValidator = (contract: HttpContract): RequestHandler => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res)

    res.json = ((payload: unknown) => {
      const schema = contract.responses[res.statusCode]
      if (!schema) {
        return originalJson(payload)
      }

      const route = `${req.method.toUpperCase()} ${contract.path}`
      const validatedPayload = validateRouteOutput(schema, payload, route)
      return originalJson(validatedPayload)
    }) as typeof res.json

    return next()
  }
}
