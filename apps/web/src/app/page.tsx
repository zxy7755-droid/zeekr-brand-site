import Image from 'next/image';

const VEHICLES = [
  { name: '企鹅 P1', type: '纯电轿车', range: '600 km', image: '/brand/vehicle-a.jpg' },
  { name: '企鹅 P2', type: '纯电 SUV', range: '560 km', image: '/brand/vehicle-b.jpg' },
  { name: '企鹅 P3', type: '纯电轿跑', range: '650 km', image: '/brand/vehicle-c.jpg' },
  { name: '企鹅 P5', type: '纯电旅行车', range: '620 km', image: '/brand/vehicle-d.jpg' },
];

const NEWS = [
  { title: '企鹅汽车全新纯电系列正式发布', tag: '品牌', image: '/brand/news-01.jpg' },
  { title: '新一代补能技术与电池安全架构', tag: '技术', image: '/brand/news-02.jpg' },
  { title: '全国品牌体验中心陆续开放', tag: '门店', image: '/brand/news-03.jpg' },
];

export default function HomePage() {
  return (
    <main>
      <section
        aria-label="企鹅汽车纯电旗舰车型"
        style={{
          position: 'relative',
          height: 480,
          overflow: 'hidden',
          backgroundColor: '#0b1b33',
          backgroundImage:
            'linear-gradient(90deg, rgba(6,20,42,0.88) 0%, rgba(6,20,42,0.48) 52%, rgba(6,20,42,0.05) 100%), url(/brand/hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 58%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 8%',
          color: '#fff',
        }}
      >
        <p style={{ letterSpacing: 4, fontSize: 13, margin: 0, opacity: 0.85 }}>PENGUIN MOTORS</p>
        <h1 style={{ fontSize: 46, margin: '14px 0 12px', lineHeight: 1.2 }}>向前的每一步，都更从容</h1>
        <p style={{ fontSize: 17, margin: 0, maxWidth: 460, lineHeight: 1.7, opacity: 0.92 }}>
          企鹅汽车纯电系列，以设计、续航与安全，重新定义日常出行。
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <a href="#vehicles" style={{ background: '#0060FF', color: '#fff', padding: '11px 24px', borderRadius: 4, textDecoration: 'none', fontSize: 14 }}>探索车型</a>
          <a href="/compare" style={{ border: '1px solid rgba(255,255,255,0.7)', color: '#fff', padding: '11px 24px', borderRadius: 4, textDecoration: 'none', fontSize: 14 }}>车型对比</a>
        </div>
      </section>

      <section id="vehicles" style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 24px 0' }}>
        <h2 style={{ fontSize: 28, margin: '0 0 8px' }}>全系车型</h2>
        <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 14 }}>四款纯电车型，覆盖城市通勤与家庭远行。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {VEHICLES.map((v) => (
            <article key={v.name} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <Image src={v.image} alt={v.name} width={480} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} />
              <div style={{ padding: '16px 18px' }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{v.name}</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>{v.type} · 续航 {v.range}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="technology" style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 28, margin: '0 0 12px' }}>技术与安全</h2>
            <p style={{ color: '#475569', lineHeight: 1.9, fontSize: 15 }}>
              一体化电池底盘、高强度车身结构与全场景辅助驾驶，构成企鹅汽车的安全底座。
              从电芯到整车，每一层都经过严苛验证。
            </p>
            <ul style={{ color: '#475569', lineHeight: 2, fontSize: 14, paddingLeft: 20 }}>
              <li>一体化电池底盘与热管理</li>
              <li>高强度笼式车身</li>
              <li>全场景辅助驾驶</li>
            </ul>
          </div>
          <Image
            src="/brand/technology.jpg"
            alt="企鹅汽车电池底盘技术图解"
            width={640}
            height={430}
            style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
        </div>
      </section>

      <section id="news" style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 24px 0' }}>
        <h2 style={{ fontSize: 28, margin: '0 0 28px' }}>品牌资讯</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {NEWS.map((n) => (
            <article key={n.title} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <Image src={n.image} alt={n.title} width={420} height={280} style={{ width: '100%', height: 'auto', display: 'block' }} />
              <div style={{ padding: '16px 18px' }}>
                <span style={{ fontSize: 12, color: '#0060FF' }}>{n.tag}</span>
                <h3 style={{ margin: '8px 0 0', fontSize: 16 }}>{n.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1160, margin: '72px auto 0', padding: '40px 24px', background: '#F0F6FF', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, margin: '0 0 10px' }}>预约试驾</h2>
        <p style={{ color: '#475569', margin: '0 0 20px', fontSize: 14 }}>前往体验中心，亲自感受企鹅汽车的驾驶质感。</p>
        <a href="/compare" style={{ background: '#0060FF', color: '#fff', padding: '11px 26px', borderRadius: 4, textDecoration: 'none', fontSize: 14 }}>对比车型并预约</a>
      </section>
    </main>
  );
}
