export type ErrorDetails = Record<string, unknown> | undefined

export class BaseError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: ErrorDetails

  public constructor(
    message: string,
    options: { statusCode?: number; code?: string; details?: ErrorDetails } = {},
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = options.statusCode ?? 500
    this.code = options.code ?? 'INTERNAL_ERROR'
    this.details = options.details
  }
}

export class RouteError extends BaseError {
  public constructor(
    message: string,
    options: { statusCode?: number; details?: ErrorDetails } = {},
  ) {
    super(message, {
      statusCode: options.statusCode ?? 400,
      code: 'ROUTE_ERROR',
      details: options.details,
    })
  }
}

export class MiddlewareError extends BaseError {
  public constructor(
    message: string,
    options: { statusCode?: number; details?: ErrorDetails } = {},
  ) {
    super(message, {
      statusCode: options.statusCode ?? 401,
      code: 'MIDDLEWARE_ERROR',
      details: options.details,
    })
  }
}

export class ControllerError extends BaseError {
  public constructor(
    message: string,
    options: { statusCode?: number; details?: ErrorDetails } = {},
  ) {
    super(message, {
      statusCode: options.statusCode ?? 500,
      code: 'CONTROLLER_ERROR',
      details: options.details,
    })
  }
}

export class ServiceError extends BaseError {
  public constructor(
    message: string,
    options: { statusCode?: number; details?: ErrorDetails } = {},
  ) {
    super(message, {
      statusCode: options.statusCode ?? 500,
      code: 'SERVICE_ERROR',
      details: options.details,
    })
  }
}

export class RepositoryError extends BaseError {
  public constructor(
    message: string,
    options: { statusCode?: number; details?: ErrorDetails } = {},
  ) {
    super(message, {
      statusCode: options.statusCode ?? 500,
      code: 'REPOSITORY_ERROR',
      details: options.details,
    })
  }
}
