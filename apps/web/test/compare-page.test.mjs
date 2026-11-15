// 车型对比页静态文本检查：与现有 contract.test.mjs 保持同样风格（不引入额外测试库）。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(HERE, '..');

const comparePageSource = readFileSync(join(WEB_ROOT, 'src/app/compare/page.tsx'), 'utf8');

test('对比页通过 apiUrl() 请求 /vehicles，无 fixture 回退', () => {
  assert.ok(comparePageSource.includes("from '@/lib/contract'"));
  assert.ok(comparePageSource.includes("apiUrl('/vehicles"));
  assert.ok(!/fixture|mock-data/i.test(comparePageSource));
});

test('对比页是客户端组件（需要勾选交互）', () => {
  assert.ok(comparePageSource.trimStart().startsWith("'use client'"));
});

test('对比页覆盖 6 项对比维度', () => {
  for (const label of ['价格区间', '续航', '电池容量', '加速', '座位', '驱动']) {
    assert.ok(comparePageSource.includes(label), `缺少对比维度: ${label}`);
  }
});

test('对比页包含空态、加载态与错误态文案', () => {
  assert.ok(comparePageSource.includes('compare-loading'));
  assert.ok(comparePageSource.includes('compare-empty'));
  assert.ok(comparePageSource.includes('compare-error'));
});

test('对比页限定 2-3 款选择范围', () => {
  assert.ok(comparePageSource.includes('MIN_SELECTION'));
  assert.ok(comparePageSource.includes('MAX_SELECTION'));
});

test('对比页使用品牌图资源，不写外链', () => {
  assert.ok(comparePageSource.includes('/brand/'));
  const external = comparePageSource.match(/https?:\/\/(?!localhost)[a-z0-9.-]+/gi) ?? [];
  assert.deepEqual(external, [], `发现硬编码域名: ${external.join(', ')}`);
});

test('对比页含移动端横向滚动与参数提示', () => {
  assert.ok(comparePageSource.includes('overflowX'));
  assert.ok(comparePageSource.includes('企鹅汽车'));
});
