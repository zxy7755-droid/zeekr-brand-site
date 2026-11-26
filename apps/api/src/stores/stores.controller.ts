import { Controller, Get, Query } from '@nestjs/common';

import { RESOURCE_ROUTES } from '../contract';

interface StoreDto {
  id: string;
  name: string;
  city: string;
  district: string | null;
  address: string;
  phone: string | null;
  businessHours: string | null;
}

interface StoreListDto {
  items: StoreDto[];
  total: number;
}

// 官网展示用示意门店数据；字段与 docs/api/openapi.yaml 的 Store / StoreList 一致。
const STORES: StoreDto[] = [
  {
    id: '1',
    name: '企鹅汽车 · 上海旗舰店',
    city: '上海',
    district: '浦东新区',
    address: '世纪大道 100 号',
    phone: '400-000-0001',
    businessHours: '09:00-21:00',
  },
  {
    id: '2',
    name: '企鹅汽车 · 北京体验中心',
    city: '北京',
    district: '朝阳区',
    address: '建国路 88 号',
    phone: '400-000-0002',
    businessHours: '09:30-20:30',
  },
  {
    id: '3',
    name: '企鹅汽车 · 深圳交付中心',
    city: '深圳',
    district: '南山区',
    address: '科技南路 12 号',
    phone: '400-000-0003',
    businessHours: '09:00-20:00',
  },
];

@Controller(RESOURCE_ROUTES.stores)
export class StoresController {
  @Get()
  list(@Query('city') city?: string): StoreListDto {
    const items = city ? STORES.filter((store) => store.city === city) : STORES;
    return { items, total: items.length };
  }
}
