import { Test } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';

const prismaMock = {
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
};

describe('HealthController', () => {
  async function buildController(): Promise<HealthController> {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    return moduleRef.get(HealthController);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ 1: 1 }]);
  });

  it('返回 ok 状态、服务标识与 db 连通状态', async () => {
    const payload = await (await buildController()).check();

    expect(payload.status).toBe('ok');
    expect(payload.service).toBe('zeekr-brand-site-api');
    expect(payload.db).toBe('ok');
    expect(new Date(payload.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('数据库不可用时返回 degraded 与 unavailable', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    const payload = await (await buildController()).check();

    expect(payload.status).toBe('degraded');
    expect(payload.db).toBe('unavailable');
  });
});
