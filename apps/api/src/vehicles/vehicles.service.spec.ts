import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma.service';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  const prismaMock = {
    vehicle: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  let service: VehiclesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [VehiclesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(VehiclesService);
  });

  it('分页参数生效，且强制只按 PUBLISHED 过滤（即使传入其他 status）', async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([{ slug: 'demo-sedan-01' }]);
    prismaMock.vehicle.count.mockResolvedValue(1);

    const result = await service.list({ page: 2, pageSize: 5, status: 'DRAFT' });

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
        skip: 5,
        take: 5,
      }),
    );
    expect(prismaMock.vehicle.findMany.mock.calls[0][0].where.status).not.toBe('DRAFT');
    expect(result).toEqual({ items: [{ slug: 'demo-sedan-01' }], total: 1, page: 2, pageSize: 5 });
  });

  it('按 series 过滤', async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([]);
    prismaMock.vehicle.count.mockResolvedValue(0);

    await service.list({ series: 'DEMO-S' });

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ series: 'DEMO-S', status: 'PUBLISHED' }),
      }),
    );
  });

  it('默认分页为 page=1 pageSize=20', async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([]);
    prismaMock.vehicle.count.mockResolvedValue(0);

    const result = await service.list({});

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('按 slug 查询详情，仅返回 PUBLISHED', async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ slug: 'demo-sedan-01' });

    const vehicle = await service.getBySlug('demo-sedan-01');

    expect(prismaMock.vehicle.findFirst).toHaveBeenCalledWith({
      where: { slug: 'demo-sedan-01', status: 'PUBLISHED' },
    });
    expect(vehicle).toEqual({ slug: 'demo-sedan-01' });
  });

  it('查不到车型时返回 null', async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue(null);

    const vehicle = await service.getBySlug('not-exist');

    expect(vehicle).toBeNull();
  });
});
