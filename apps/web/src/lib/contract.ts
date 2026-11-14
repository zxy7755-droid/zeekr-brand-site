// 工程契约常量：唯一定义处在 docs/delivery/design.md，此处与其保持一致。
// 任何页面/组件禁止自拼后端地址，一律引用本文件。
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const DISCLAIMER =
  '本项目为技术演示用途，不代表官方。页面资源均为占位素材。';

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, '')}${normalized}`;
}
