// 工程契约常量：唯一定义处见 docs/delivery/design.md，禁止在别处硬编码。
export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://localhost:3001';

export const DATABASE_URL =
  process.env.DATABASE_URL ??
  'mysql://zeekr:zeekr@127.0.0.1:3306/zeekr';

export const PORT = Number(process.env.PORT ?? 3001);

/** OpenAPI 契约文件位置，contract 测试与 CI contract-check 共用 */
export const OPENAPI_SPEC_PATH = '../../docs/api/openapi.yaml';

export const RESOURCE_ROUTES = {
  vehicles: 'vehicles',
  testDriveLeads: 'test-drive-leads',
  stores: 'stores',
  news: 'news',
  health: 'health',
} as const;

export type ResourceName = keyof typeof RESOURCE_ROUTES;
