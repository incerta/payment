import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { registerV1Contracts } from '../api/v1/contracts';

extendZodWithOpenApi(z);

export const buildOpenApiDocument = () => {
  const registry = new OpenAPIRegistry();
  registerV1Contracts(registry);

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Payment Reception Service API',
      version: '1.0.0',
      description: 'Contract-generated API documentation',
    },
    servers: [{ url: '/' }],
  });
};

export const loadOpenApiDocs = (app: Express): void => {
  const openApiDocument = buildOpenApiDocument();

  app.get('/openapi.json', (_req, res) => {
    return res.status(200).json(openApiDocument);
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
};
