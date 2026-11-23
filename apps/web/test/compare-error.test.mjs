// 车型对比页错误态辅助逻辑的行为单测：真实 import 并调用 helper，非源码字符串断言。
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyCompareError,
  compareErrorMessage,
  describeCompareError,
} from '../src/lib/compare-error.mjs';

test('网络异常（TypeError: Failed to fetch）→ network / 可重试 / 文案含重试', () => {
  const state = describeCompareError(new TypeError('Failed to fetch'));
  assert.equal(state.kind, 'network');
  assert.equal(state.retryable, true);
  assert.match(state.message, /重试/);
});

test('非 2xx HTTP 响应（503）→ http / 可重试 / 文案含重试', () => {
  const response = { ok: false, status: 503 };
  const state = describeCompareError(response);
  assert.equal(state.kind, 'http');
  assert.equal(state.retryable, true);
  assert.match(state.message, /重试/);
});

test('未知输入（null / {} / 普通字符串）→ unknown，不抛异常', () => {
  for (const input of [null, {}, 'unexpected']) {
    const state = describeCompareError(input);
    assert.equal(state.kind, 'unknown');
    assert.equal(state.retryable, true);
    assert.match(state.message, /重试/);
  }
});

test('分类与文案函数可单独调用，且 2xx 响应不归入 http', () => {
  assert.equal(classifyCompareError(new Error('boom')), 'network');
  assert.equal(classifyCompareError({ ok: true, status: 200 }), 'unknown');
  assert.equal(compareErrorMessage('network'), '车型数据加载失败，请检查网络后重试。');
  assert.equal(compareErrorMessage('http'), '车型数据加载失败（服务暂时不可用），请重试。');
  assert.equal(compareErrorMessage('unknown'), '车型数据加载失败，请重试。');
});
