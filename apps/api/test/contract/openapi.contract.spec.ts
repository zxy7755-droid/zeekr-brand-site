import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RESOURCE_ROUTES } from '../../src/contract';

const REPO_ROOT = join(__dirname, '../../../..');
const SPEC = join(REPO_ROOT, 'docs/api/openapi.yaml');
const DESIGN = join(REPO_ROOT, 'docs/delivery/design.md');

describe('接口契约（docs/api/openapi.yaml）', () => {
  it('契约文件与设计文档均存在', () => {
    expect(existsSync(SPEC)).toBe(true);
    expect(existsSync(DESIGN)).toBe(true);
  });

  const spec = readFileSync(SPEC, 'utf8');

  it('声明 OpenAPI 3.x 与基础元信息', () => {
    expect(spec).toMatch(/^openapi:\s*3\./m);
    expect(spec).toMatch(/^info:/m);
    expect(spec).toMatch(/^paths:/m);
  });

  it('包含 5 类资源路径', () => {
    const expected = [
      `/${RESOURCE_ROUTES.health}`,
      `/${RESOURCE_ROUTES.vehicles}`,
      `/${RESOURCE_ROUTES.testDriveLeads}`,
      `/${RESOURCE_ROUTES.stores}`,
      `/${RESOURCE_ROUTES.news}`,
    ];
    for (const p of expected) {
      expect(spec).toContain(`${p}:`);
    }
  });

  it('引用的 components schema 均已定义', () => {
    const refs = new Set(
      Array.from(spec.matchAll(/#\/components\/schemas\/([A-Za-z0-9_]+)/g)).map(
        (m) => m[1],
      ),
    );
    expect(refs.size).toBeGreaterThan(0);
    for (const name of refs) {
      expect(spec).toContain(`    ${name}:`);
    }
  });

  it('不含官方素材与 mock 字样', () => {
    expect(spec).not.toMatch(/official logo/i);
    expect(spec).not.toMatch(/mock-data/i);
  });
});

describe('设计文档常量', () => {
  const design = readFileSync(DESIGN, 'utf8');

  it('定义必填常量与运行时变量', () => {
    for (const key of ['BASE_PATH', 'API_BASE_URL', 'DATABASE_URL', 'WEB_DIR', 'API_DIR']) {
      expect(design).toContain(key);
    }
  });
});
