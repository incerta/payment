import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildOpenApiDocument } from '../src/loaders/openapi';
import { OPEN_API_DOCS_PATH } from '../src/config';

const run = async (): Promise<void> => {
  const outputPath = OPEN_API_DOCS_PATH;
  const outputDir = dirname(outputPath);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`, 'utf-8');

  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec generated at ${outputPath}`);
};

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI spec', error);
  process.exit(1);
});
