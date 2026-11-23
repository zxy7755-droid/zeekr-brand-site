/**
 * 车型对比页错误态辅助逻辑。
 * 纯 ESM、无 DOM / React / 第三方依赖，可被 node --test 直接 import 验证行为。
 */

/** @typedef {'network' | 'http' | 'unknown'} CompareErrorKind */

/**
 * @typedef {object} CompareErrorState
 * @property {CompareErrorKind} kind 错误分类
 * @property {string} message 面向访客的中文提示（含重试语义）
 * @property {boolean} retryable 是否可重试；本页数据源固定，恒为 true
 */

/**
 * 分类车型列表请求失败的原因。
 * - 非 2xx 的 Response（ok === false）→ http
 * - fetch 抛出的异常（TypeError 等 Error 实例）→ network
 * - 其他未知输入 → unknown
 *
 * @param {unknown} input 异常对象或非 2xx 的 Response
 * @returns {CompareErrorKind}
 */
export function classifyCompareError(input) {
  if (input !== null && typeof input === 'object' && 'ok' in input && input.ok === false) {
    return 'http';
  }
  if (input instanceof Error) {
    return 'network';
  }
  return 'unknown';
}

/**
 * 按错误分类返回用户可读文案，三类均含「重试」语义。
 *
 * @param {CompareErrorKind} kind
 * @returns {string}
 */
export function compareErrorMessage(kind) {
  switch (kind) {
    case 'network':
      return '车型数据加载失败，请检查网络后重试。';
    case 'http':
      return '车型数据加载失败（服务暂时不可用），请重试。';
    default:
      return '车型数据加载失败，请重试。';
  }
}

/**
 * 组合分类与文案，生成页面可直接使用的结构化错误态。
 *
 * @param {unknown} input
 * @returns {CompareErrorState}
 */
export function describeCompareError(input) {
  const kind = classifyCompareError(input);
  return { kind, message: compareErrorMessage(kind), retryable: true };
}
