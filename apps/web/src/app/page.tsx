import { apiUrl, DISCLAIMER } from '@/lib/contract';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>ZEEKR Brand Site</h1>
      <p>P0 立项骨架已就绪：主页、免责声明与后端接口地址常量均已定义。</p>
      <ul>
        <li>车型展示</li>
        <li>预约试驾</li>
        <li>门店查询</li>
        <li>资讯内容</li>
      </ul>
      <p data-testid="api-base-url">API: {apiUrl('/health')}</p>
      <p style={{ fontSize: 12, opacity: 0.7 }}>{DISCLAIMER}</p>
    </main>
  );
}
