import { Test } from '@nestjs/testing';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('返回 ok 状态与服务标识', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const payload = moduleRef.get(HealthController).check();

    expect(payload.status).toBe('ok');
    expect(payload.service).toBe('zeekr-brand-site-api');
    expect(new Date(payload.timestamp).toString()).not.toBe('Invalid Date');
  });
});
