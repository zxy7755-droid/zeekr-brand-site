import { Test } from '@nestjs/testing';

import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

const SAMPLE_VEHICLE = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'demo-sedan-01',
  name: '车型 A',
  series: 'DEMO-S',
  tagline: '工程品牌文案',
  priceMin: 150000,
  priceMax: 180000,
  rangeKm: 600,
  batteryKwh: 80,
  zeroToHundred: 5.9,
  seats: 5,
  driveType: 'AWD',
  imageKey: '/brand/vehicle-a.jpg',
  badge: '标签',
  sortOrder: 0,
  status: 'PUBLISHED',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('VehiclesController', () => {
  const vehiclesServiceMock = {
    list: jest.fn(),
    getBySlug: jest.fn(),
  };

  let controller: VehiclesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: vehiclesServiceMock }],
    }).compile();
    controller = moduleRef.get(VehiclesController);
  });

  it('GET /vehicles 返回符合 VehicleList 形态的分页结构', async () => {
    vehiclesServiceMock.list.mockResolvedValue({
      items: [SAMPLE_VEHICLE],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const result = await controller.list(undefined, undefined, undefined, undefined);

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items[0]).toMatchObject({ slug: 'demo-sedan-01', name: '车型 A' });
    expect(result.items[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('page/pageSize 非法时抛 400（Error schema 形态）', async () => {
    await expect(controller.list('0', undefined, undefined, undefined)).rejects.toMatchObject({
      response: expect.objectContaining({ status: 400, title: 'Bad Request' }),
    });
    await expect(controller.list(undefined, '101', undefined, undefined)).rejects.toMatchObject({
      response: expect.objectContaining({ status: 400 }),
    });
  });

  it('status 传入非法值时抛 400', async () => {
    await expect(controller.list(undefined, undefined, undefined, 'FOO')).rejects.toMatchObject({
      response: expect.objectContaining({ status: 400 }),
    });
  });

  it('status 传入合法值但不是 PUBLISHED 时仍能正常请求（实际过滤由 service 强制）', async () => {
    vehiclesServiceMock.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });

    const result = await controller.list(undefined, undefined, undefined, 'DRAFT');

    expect(vehiclesServiceMock.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DRAFT' }),
    );
    expect(result.items).toEqual([]);
  });

  it('GET /vehicles/{slug} 命中时返回 VehicleDetail，含 highlights/galleryKeys', async () => {
    vehiclesServiceMock.getBySlug.mockResolvedValue(SAMPLE_VEHICLE);

    const result = await controller.detail('demo-sedan-01');

    expect(result.slug).toBe('demo-sedan-01');
    expect(result.galleryKeys).toEqual(['/brand/vehicle-a.jpg']);
    expect(result.highlights.length).toBeGreaterThan(0);
  });

  it('GET /vehicles/{slug} 未命中时抛 404（Error schema 形态）', async () => {
    vehiclesServiceMock.getBySlug.mockResolvedValue(null);

    await expect(controller.detail('not-exist')).rejects.toMatchObject({
      response: expect.objectContaining({ status: 404, title: 'Not Found' }),
    });
  });
});
