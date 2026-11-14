import { Controller, Get } from '@nestjs/common';

import { RESOURCE_ROUTES } from './contract';
import { PrismaService } from './prisma.service';

export interface HealthPayload {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  db: 'ok' | 'unavailable';
}

@Controller(RESOURCE_ROUTES.health)
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthPayload> {
    let db: HealthPayload['db'] = 'unavailable';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      db = 'unavailable';
    }

    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      service: 'zeekr-brand-site-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      db,
    };
  }
}
