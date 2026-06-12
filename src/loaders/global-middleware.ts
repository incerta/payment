import express, { type Express, type Request } from 'express'

export const loadGlobalMiddleware = (app: Express): void => {
  app.use(
    express.json({
      verify: (req, _res, buffer) => {
        const requestWithRawBody = req as Request & { rawBody?: Buffer }
        requestWithRawBody.rawBody = Buffer.from(buffer)
      },
    }),
  )
}
