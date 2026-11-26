// 门店详情页静态源码检查：沿用现有 node:test 风格，不引入额外测试库。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(HERE, '..');
const ROUTE_DIR = join(WEB_ROOT, 'src/app/stores/[id]');

const pageSource = readFileSync(join(ROUTE_DIR, 'page.tsx'), 'utf8');
const cssSource = readFileSync(join(ROUTE_DIR, 'store-detail.module.css'), 'utf8');

test('门店详情统一走 apiUrl(/stores)，无 fixture/mock 回退与硬编码域名', () => {
  assert.ok(pageSource.includes("import { apiUrl"));
  assert.ok(pageSource.includes("from '@/lib/contract'"));
  assert.ok(pageSource.includes("apiUrl('/stores')"));
  assert.ok(!/fixture|mock-data/i.test(pageSource));
  const external = pageSource.match(/https?:\/\/(?!localhost)[a-z0-9.-]+/gi) ?? [];
  assert.deepEqual(external, [], `发现硬编码域名: ${external.join(', ')}`);
});

test('按路由 id 精确匹配单条门店，不做模糊匹配或 slug 查找', () => {
  assert.ok(pageSource.includes('params.id'));
  assert.ok(pageSource.includes('.find('));
  assert.ok(pageSource.includes('item.id === params.id'));
  assert.ok(!/slug/i.test(pageSource));
});

test('四类状态文案与 data-testid 齐全，错误态 role=alert', () => {
  for (const token of [
    '门店信息加载中…',
    'store-detail-loading',
    '当前暂无门店信息，请稍后再来。',
    'store-detail-empty',
    '未找到该门店，链接可能已失效。',
    'store-detail-not-found',
    '门店信息加载失败',
    'store-detail-error',
    'role="alert"',
    'store-detail-ready',
  ]) {
    assert.ok(pageSource.includes(token), `缺少状态标记: ${token}`);
  }
});

test('语义化结构、示意数据标注与可点击 tel 链接', () => {
  for (const tag of ['<main', '<h1', '<dl', '<dt', '<dd', '<address']) {
    assert.ok(pageSource.includes(tag), `缺少语义标签: ${tag}`);
  }
  assert.ok(pageSource.includes('示意数据'));
  assert.ok(pageSource.includes('tel:${digits}'));
  assert.ok(pageSource.includes('暂无营业时间信息'));
  assert.ok(pageSource.includes('暂无联系电话'));
});

test('M1：所有状态（含非 ready 态）都在 <main> 内渲染唯一主标题', () => {
  // 恰好一个 <h1>，且无条件渲染在 <main> 内、ready 条件分支之外；
  // 非 ready 态使用固定标题「门店详情」，保证读屏用户始终有页面主标题。
  const h1Count = (pageSource.match(/<h1\b/g) ?? []).length;
  assert.equal(h1Count, 1, `应只有一个 <h1>，实际 ${h1Count} 个`);
  const mainIdx = pageSource.indexOf('<main');
  const h1Idx = pageSource.indexOf('<h1');
  const readyIdx = pageSource.indexOf("state.kind === 'ready' && (");
  assert.ok(mainIdx !== -1 && h1Idx > mainIdx, '<h1> 必须位于 <main> 内');
  assert.ok(readyIdx !== -1, '缺少 ready 条件分支');
  assert.ok(h1Idx < readyIdx, '<h1> 必须无条件渲染，不能只在 ready 分支内');
  assert.ok(pageSource.includes('const heading = state.kind === '), '缺少按状态计算的 heading');
  assert.ok(pageSource.includes("'门店详情'"), '非 ready 态缺少固定主标题「门店详情」');
});

test('M2：合法 JSON 但结构异常走 error 态，不误判为空列表', () => {
  assert.ok(
    pageSource.includes('if (!Array.isArray(data?.items))'),
    '缺少对 items 结构的显式校验',
  );
  assert.ok(
    pageSource.includes("throw new Error('门店列表数据结构异常')"),
    '结构异常必须抛错，交由 error 态与 role="alert" 承接',
  );
  assert.ok(
    !pageSource.includes('Array.isArray(data?.items) ? data.items : []'),
    '不得再把结构异常静默退化为空数组（空列表态）',
  );
});

test('样式含焦点可见与长文本防溢出规则', () => {
  assert.ok(cssSource.includes(':focus-visible'));
  assert.ok(cssSource.includes('overflow-wrap'));
  assert.ok(cssSource.includes('@media (min-width: 640px)'));
});

test('不采集试驾线索、不输出电话日志', () => {
  assert.ok(!pageSource.includes('test-drive-leads'));
  assert.ok(!/console\.(log|info|debug)/.test(pageSource));
});
