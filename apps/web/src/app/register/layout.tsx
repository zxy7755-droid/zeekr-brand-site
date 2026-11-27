import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Next.js 14 不允许在 'use client' 组件中导出 metadata（NEXT_RSC_ERR_CLIENT_METADATA_EXPORT）。
// 表单交互在 page.tsx（客户端组件），页面标题在此处的路由级 Server Component 中声明。
export const metadata: Metadata = {
  title: '用户注册（界面演示） | 企鹅汽车 PENGUIN MOTORS',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
