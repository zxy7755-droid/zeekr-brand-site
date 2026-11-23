'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { apiUrl } from '@/lib/contract';
import { describeCompareError, type CompareErrorState } from '@/lib/compare-error.mjs';

interface Vehicle {
  id: string;
  slug: string;
  name: string;
  series: string;
  priceMin?: number | null;
  priceMax?: number | null;
  rangeKm?: number | null;
  batteryKwh?: number | null;
  zeroToHundred?: number | null;
  seats?: number | null;
  driveType?: string | null;
  imageKey?: string | null;
  status: string;
}

interface VehicleListResponse {
  items: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
}

const MIN_SELECTION = 2;
const MAX_SELECTION = 3;
const BRAND_IMAGE_FALLBACK = '/brand/vehicle-a.jpg';

function vehicleImage(key?: string | null): string {
  if (!key) return BRAND_IMAGE_FALLBACK;
  return key.startsWith('/') ? key : `/${key}`;
}

interface Dimension {
  key: string;
  label: string;
  format: (v: Vehicle) => string;
}

const DIMENSIONS: Dimension[] = [
  {
    key: 'price',
    label: '价格区间',
    format: (v) =>
      v.priceMin != null && v.priceMax != null
        ? `¥${(v.priceMin / 10000).toFixed(1)}万 - ¥${(v.priceMax / 10000).toFixed(1)}万`
        : '—',
  },
  {
    key: 'range',
    label: '续航',
    format: (v) => (v.rangeKm != null ? `${v.rangeKm} km` : '—'),
  },
  {
    key: 'battery',
    label: '电池容量',
    format: (v) => (v.batteryKwh != null ? `${v.batteryKwh} kWh` : '—'),
  },
  {
    key: 'acceleration',
    label: '加速 0-100km/h',
    format: (v) => (v.zeroToHundred != null ? `${v.zeroToHundred}s` : '—'),
  },
  {
    key: 'seats',
    label: '座位数',
    format: (v) => (v.seats != null ? `${v.seats} 座` : '—'),
  },
  {
    key: 'driveType',
    label: '驱动形式',
    format: (v) => (v.driveType ? v.driveType : '—'),
  },
];

export default function ComparePage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<CompareErrorState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setError(null);
      setVehicles(null);
      try {
        const res = await fetch(apiUrl('/vehicles?pageSize=50'));
        if (!res.ok) {
          if (!cancelled) {
            setError(describeCompareError(res));
          }
          return;
        }
        const data = (await res.json()) as VehicleListResponse;
        if (!cancelled) {
          setVehicles(data.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(describeCompareError(err));
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const selectedVehicles = useMemo(
    () => (vehicles ?? []).filter((v) => selected.includes(v.slug)),
    [vehicles, selected],
  );

  function toggle(slug: string): void {
    setSelected((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= MAX_SELECTION) {
        return prev;
      }
      return [...prev, slug];
    });
  }

  function retry(): void {
    setReloadToken((n) => n + 1);
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>企鹅汽车 · 车型对比</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        勾选 2–3 款车型，并排查看核心参数；参数以官网公示口径为准。
      </p>

      {error && (
        <div
          role="alert"
          data-testid="compare-error"
          style={{
            color: '#b00020',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <p style={{ margin: 0 }}>{error.message}</p>
          <button type="button" data-testid="compare-retry" onClick={retry}>
            重试加载车型
          </button>
        </div>
      )}

      {!error && vehicles === null && (
        <p role="status" aria-live="polite" data-testid="compare-loading">
          车型数据加载中…
        </p>
      )}

      {!error && vehicles !== null && vehicles.length === 0 && (
        <p data-testid="compare-empty">暂无可对比的车型，请稍后再来。</p>
      )}

      {!error && vehicles !== null && vehicles.length > 0 && (
        <>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {vehicles.map((v) => {
              const checked = selected.includes(v.slug);
              const disabled = !checked && selected.length >= MAX_SELECTION;
              return (
                <li
                  key={v.slug}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 12,
                    minWidth: 160,
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(v.slug)}
                    />
                    <Image
                      unoptimized
                      src={vehicleImage(v.imageKey)}
                      alt={`${v.name} 品牌图`}
                      width={48}
                      height={32}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                    <span>{v.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {selected.length < MIN_SELECTION && (
            <p data-testid="compare-hint">请至少选择 2 款车型以生成对比表。</p>
          )}
          {selected.length > MAX_SELECTION && (
            <p data-testid="compare-hint">最多可选择 3 款车型，请取消部分勾选。</p>
          )}

          {selectedVehicles.length >= MIN_SELECTION && selectedVehicles.length <= MAX_SELECTION && (
            <div style={{ overflowX: 'auto', marginTop: 16 }} data-testid="compare-table-wrap">
              <table style={{ borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: '#fff',
                        textAlign: 'left',
                        padding: 8,
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      对比维度
                    </th>
                    {selectedVehicles.map((v) => (
                      <th
                        key={v.slug}
                        style={{ padding: 8, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}
                      >
                        {v.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIMENSIONS.map((dim) => (
                    <tr key={dim.key}>
                      <th
                        style={{
                          position: 'sticky',
                          left: 0,
                          background: '#fff',
                          textAlign: 'left',
                          padding: 8,
                          borderBottom: '1px solid #eee',
                          fontWeight: 400,
                        }}
                      >
                        {dim.label}
                      </th>
                      {selectedVehicles.map((v) => (
                        <td
                          key={v.slug}
                          style={{ padding: 8, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}
                        >
                          {dim.format(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
