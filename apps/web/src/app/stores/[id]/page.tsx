'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { apiUrl, BASE_PATH } from '@/lib/contract';

import styles from './store-detail.module.css';

// 镜像 OpenAPI 的 Store / StoreList；不新增共享 DTO，不改接口契约。
interface Store {
  id: string;
  name: string;
  city: string;
  district?: string | null;
  address: string;
  phone?: string | null;
  businessHours?: string | null;
}

interface StoreList {
  items: Store[];
  total: number;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; store: Store };

const DATA_NOTICE = '以上为官网展示内容 / 示意数据，非量产参数。';

function formatAddress(store: Store): string {
  return [store.city, store.district, store.address]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' · ');
}

function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length > 0 ? `tel:${digits}` : null;
}

function phoneContent(phone?: string | null): ReactNode {
  const value = phone?.trim();
  if (!value) return '暂无联系电话';
  const href = telHref(value);
  return href ? (
    <a className={styles.tel} href={href}>
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );
}

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setState({ kind: 'loading' });
      try {
        const res = await fetch(apiUrl('/stores'));
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as StoreList;
        // 合法 JSON 但结构异常（{} / null / {"items":"bad"}）属于上游契约退化，
        // 走 error 态与 role="alert"，不得误判为「空列表」（M2）。
        if (!Array.isArray(data?.items)) {
          throw new Error('门店列表数据结构异常');
        }
        const items = data.items;
        if (cancelled) return;
        if (items.length === 0) {
          setState({ kind: 'empty' });
          return;
        }
        const matched = items.find((item) => item.id === params.id);
        setState(matched ? { kind: 'ready', store: matched } : { kind: 'not-found' });
      } catch (err) {
        if (!cancelled) {
          const detail = err instanceof Error ? err.message : '未知错误';
          setState({ kind: 'error', message: `门店信息加载失败：${detail}` });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // 所有状态均渲染唯一页面主标题：ready 用门店名称，其余状态用固定标题，
  // 保证加载/空/未找到/错误态下读屏用户仍有主标题与定位锚点（M1）。
  const heading = state.kind === 'ready' ? state.store.name || '—' : '门店详情';

  return (
    <main className={styles.main} data-testid="store-detail">
      <h1 className={styles.title}>{heading}</h1>

      {state.kind === 'loading' && (
        <p data-testid="store-detail-loading">门店信息加载中…</p>
      )}

      {state.kind === 'empty' && (
        <p data-testid="store-detail-empty">当前暂无门店信息，请稍后再来。</p>
      )}

      {state.kind === 'not-found' && (
        <p data-testid="store-detail-not-found">未找到该门店，链接可能已失效。</p>
      )}

      {state.kind === 'error' && (
        <p role="alert" className={styles.error} data-testid="store-detail-error">
          {state.message}
        </p>
      )}

      {state.kind === 'ready' && (
        <article data-testid="store-detail-ready">
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt>门店地址</dt>
              <dd>
                <address className={styles.address}>
                  {formatAddress(state.store) || '—'}
                </address>
              </dd>
            </div>
            <div className={styles.row}>
              <dt>营业时间</dt>
              <dd>{state.store.businessHours?.trim() || '暂无营业时间信息'}</dd>
            </div>
            <div className={styles.row}>
              <dt>联系电话</dt>
              <dd>{phoneContent(state.store.phone)}</dd>
            </div>
          </dl>
          <p className={styles.notice}>{DATA_NOTICE}</p>
        </article>
      )}

      <p className={styles.back}>
        <a className={styles.backLink} href={BASE_PATH || '/'}>
          返回首页
        </a>
      </p>
    </main>
  );
}
