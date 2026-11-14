import { Controller, Get } from '@nestjs/common';

import { RESOURCE_ROUTES } from './contract';

export interface HealthPayload {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

@Controller(RESOURCE_ROUTES.health)
export class HealthController {
  @Get()
  check(): HealthPayload {
    return {
      status: 'ok',
      service: 'zeekr-brand-site-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}
