// 契约一致性测试：不依赖 TS 运行时，Node 20 可直接执行。
// 校验 web 侧常量与 docs/delivery/design.md 声明的默认值一致。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(HERE, '..');
const REPO_ROOT = join(WEB_ROOT, '..', '..');

const contractSource = readFileSync(join(WEB_ROOT, 'src/lib/contract.ts'), 'utf8');
const design = readFileSync(join(REPO_ROOT, 'docs/delivery/design.md'), 'utf8');
const nextConfig = readFileSync(join(WEB_ROOT, 'next.config.mjs'), 'utf8');

// 只保留代码行，排除注释干扰
const codeOnly = contractSource
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');

test('API_BASE_URL 默认值与设计文档一致', () => {
  const expected = 'http://localhost:3001';
  assert.ok(codeOnly.includes(expected), 'contract.ts 缺少默认 API_BASE_URL');
  assert.ok(design.includes(expected), 'design.md 缺少默认 API_BASE_URL');
});

test('BASE_PATH 通过 NEXT_PUBLIC_BASE_PATH 注入', () => {
  assert.ok(nextConfig.includes('NEXT_PUBLIC_BASE_PATH'));
  assert.ok(design.includes('BASE_PATH'));
});

test('代码中不硬编码非 localhost 域名', () => {
  const external = codeOnly.match(/https?:\/\/(?!localhost)[a-z0-9.-]+/gi) ?? [];
  assert.deepEqual(external, [], `发现硬编码域名: ${external.join(', ')}`);
});

test('免责声明存在', () => {
  assert.ok(contractSource.includes('DISCLAIMER'));
});
