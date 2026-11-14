import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DISCLAIMER } from '@/lib/contract';

export const metadata: Metadata = {
  title: 'ZEEKR Brand Site (Demo)',
  description: '技术演示站点，不代表官方',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <footer style={{ marginTop: 48, fontSize: 12, opacity: 0.7 }}>
          {DISCLAIMER}
        </footer>
      </body>
    </html>
  );
}
