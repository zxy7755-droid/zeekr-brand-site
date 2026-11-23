export type CompareErrorKind = 'network' | 'http' | 'unknown';

export interface CompareErrorState {
  kind: CompareErrorKind;
  message: string;
  retryable: boolean;
}

/** 把异常对象或非 2xx 的 Response 分类为 network / http / unknown。 */
export declare function classifyCompareError(input: unknown): CompareErrorKind;

/** 按错误分类返回含「重试」语义的中文提示。 */
export declare function compareErrorMessage(kind: CompareErrorKind): string;

/** 生成页面可直接渲染的结构化错误态。 */
export declare function describeCompareError(input: unknown): CompareErrorState;
