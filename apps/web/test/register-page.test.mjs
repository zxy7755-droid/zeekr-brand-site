// 用户注册界面静态源码检查：沿用 node:test + readFileSync 风格（REQ：issue-1795750262423282263）。
// 这是源码级约束检查，不等同于浏览器端真实交互/读屏/多视口验收。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(HERE, '..');
const REGISTER_DIR = join(WEB_ROOT, 'src/app/register');

const pageSource = readFileSync(join(REGISTER_DIR, 'page.tsx'), 'utf8');
const layoutSource = readFileSync(join(join(WEB_ROOT, 'src/app'), 'layout.tsx'), 'utf8');
const cssSource = readFileSync(join(REGISTER_DIR, 'register.module.css'), 'utf8');

const CONSENT_TEXT =
  '我已知悉：本页仅作界面展示，不会创建真实账号，也不会提交、存储或传输填写的信息。';

test('注册页为客户端组件，标题与主标题文案正确', () => {
  assert.ok(pageSource.trimStart().startsWith("'use client'"));
  assert.ok(pageSource.includes('用户注册（界面演示）'));
  assert.ok(pageSource.includes('data-testid="register-page"'));
  // Next.js 14 禁止在 'use client' 组件导出 metadata，标题由路由级 layout.tsx 提供。
  const routeLayout = readFileSync(join(REGISTER_DIR, 'layout.tsx'), 'utf8');
  assert.ok(routeLayout.includes('用户注册（界面演示） | 企鹅汽车 PENGUIN MOTORS'));
});

test('注册表单包含四类字段与可见 label', () => {
  assert.ok(pageSource.includes('type="email"'));
  assert.ok(pageSource.includes('autoComplete="email"'));
  assert.ok(pageSource.includes('type="password"'));
  assert.ok(pageSource.includes('autoComplete="new-password"'));
  assert.ok(pageSource.includes('type="checkbox"'));
  for (const label of ['邮箱', '密码', '确认密码', '知悉声明']) {
    assert.ok(pageSource.includes(`>\n            ${label}\n`), `缺少可见 label: ${label}`);
  }
  assert.ok(pageSource.includes(CONSENT_TEXT));
  assert.ok(pageSource.includes('提交（界面演示）'));
});

test('注册页无网络请求、无 PII 存储、无手机号字段、无第三方域名', () => {
  for (const forbidden of [
    'fetch(',
    'apiUrl(',
    'localStorage',
    'sessionStorage',
    'document.cookie',
    'console.',
    'type="tel"',
    'autoComplete="tel"',
    '手机号',
  ]) {
    assert.ok(!pageSource.includes(forbidden), `注册页不应出现: ${forbidden}`);
  }
  const external = pageSource.match(/https?:\/\/(?!localhost)[a-z0-9.-]+/gi) ?? [];
  assert.deepEqual(external, [], `发现硬编码域名: ${external.join(', ')}`);
});

test('注册页不出现真实业务承诺文案', () => {
  for (const forbidden of ['注册成功', '账号已创建', '已发送验证邮件']) {
    assert.ok(!pageSource.includes(forbidden), `不应承诺真实业务结果: ${forbidden}`);
  }
  assert.ok(pageSource.includes('未创建真实账号，未提交或存储任何信息。'));
});

test('注册页具备校验、错误摘要与可访问性标记', () => {
  for (const marker of [
    'noValidate',
    'role="alert"',
    'role="status"',
    'aria-invalid',
    'aria-describedby',
    'aria-pressed',
    'aria-label',
    'aria-labelledby',
  ]) {
    assert.ok(pageSource.includes(marker), `缺少可访问性标记: ${marker}`);
  }
  for (const message of [
    '请填写邮箱。',
    '请输入有效的邮箱地址。',
    '请填写密码。',
    '密码需为 8–64 位，且同时包含字母和数字。',
    '请再次输入密码。',
    '两次输入的密码不一致。',
    '请勾选知悉声明后再提交。',
  ]) {
    assert.ok(pageSource.includes(message), `缺少校验文案: ${message}`);
  }
  assert.ok(pageSource.includes('refs.current[firstInvalid]?.focus()'));
});

test('样式覆盖响应式、焦点、对比度与减少动态效果约束', () => {
  for (const marker of [
    ':focus-visible',
    '@media (min-width: 640px)',
    'prefers-reduced-motion',
    'min-height: 44px',
    'overflow-wrap',
    '#b00020',
    '#0b62c4',
  ]) {
    assert.ok(cssSource.includes(marker), `样式缺少约束: ${marker}`);
  }
});

test('根布局含注册入口且使用 BASE_PATH 前缀，不硬编码子路径', () => {
  assert.ok(layoutSource.includes('BASE_PATH'));
  assert.ok(layoutSource.includes('${BASE_PATH}/register'));
  assert.ok(layoutSource.includes('>注册</a>'));
  assert.ok(!layoutSource.includes('/penguin/register'));
  assert.ok(!layoutSource.includes('/demo/register'));
});
