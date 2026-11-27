import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { BASE_PATH, DISCLAIMER } from '@/lib/contract';

export const metadata: Metadata = {
  title: '企鹅汽车 PENGUIN MOTORS | 官方网站',
  description: '企鹅汽车官方网站：纯电车型、技术、门店与品牌资讯。',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a', background: '#fff' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 32px',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            background: 'rgba(255,255,255,0.95)',
            zIndex: 10,
          }}
        >
          <Image src="/brand/logo.png" alt="企鹅汽车品牌标识" width={40} height={40} priority />
          <strong style={{ fontSize: 18, letterSpacing: 1 }}>
            企鹅汽车 <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>PENGUIN MOTORS</span>
          </strong>
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 22, fontSize: 14 }}>
            <a href="/" style={{ color: '#0f172a', textDecoration: 'none' }}>首页</a>
            <a href="/#vehicles" style={{ color: '#0f172a', textDecoration: 'none' }}>车型</a>
            <a href="/compare" style={{ color: '#0f172a', textDecoration: 'none' }}>车型对比</a>
            <a href="/#technology" style={{ color: '#0f172a', textDecoration: 'none' }}>技术与安全</a>
            <a href="/#news" style={{ color: '#0f172a', textDecoration: 'none' }}>品牌资讯</a>
            <a href={`${BASE_PATH}/register`} style={{ color: '#0f172a', textDecoration: 'none' }}>注册</a>
          </nav>
        </header>

        {children}

        <footer style={{ marginTop: 72, padding: '28px 32px', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
          {DISCLAIMER}
        </footer>
      </body>
    </html>
  );
}
